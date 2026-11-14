use near_sdk::json_types::U128;
use near_sdk::store::IterableMap;
use near_sdk::{
    env, ext_contract, near, require, AccountId, Gas, NearToken, PanicOnDefault, Promise,
    PromiseError, PromiseOrValue,
};

#[ext_contract(ext_ft)]
pub trait FungibleToken {
    fn ft_transfer(&mut self, receiver_id: AccountId, amount: U128, memo: Option<String>);
}

pub const SEVEN_DAYS_NS: u64 = 7 * 86_400 * 1_000_000_000;
const GAS_FOR_FT_TRANSFER: Gas = Gas::from_tgas(15);
const GAS_FOR_RESOLVE_TRANSFER: Gas = Gas::from_tgas(10);

#[near(serializers = [borsh, json])]
#[derive(Clone, Copy, PartialEq, Eq, Debug)]
pub enum BudgetStatus {
    Active,
    Abandoned,
    Closed,
}

#[near(serializers = [borsh, json])]
#[derive(Clone, Debug)]
pub struct ProductBudget {
    pub product_id: u64,
    pub steward: AccountId,
    pub agent_address: AccountId,
    pub total_ops_received: U128,
    pub current_balance: U128,
    pub period_draw_cap: U128,
    pub last_draw_period: u64,
    pub drawn_in_current_period: U128,
    pub inference_cost_per_query: U128,
    pub last_cost_update_ns: u64,
    pub total_periods: u64,
    pub completed_periods: u64,
    pub projected_remaining_cost: U128,
    pub status: BudgetStatus,
}

#[near(serializers = [borsh, json])]
#[derive(Clone, Debug)]
pub struct ReviewLock {
    pub lock_id: u64,
    pub product_id: u64,
    pub amount: U128,
    pub lock_timestamp_ns: u64,
    pub released: bool,
}

#[derive(near_sdk::serde::Deserialize)]
#[serde(crate = "near_sdk::serde")]
struct RawReceiveOpsMsg {
    action: String,
    product_id: near_sdk::serde_json::Value,
}

#[near(contract_state)]
#[derive(PanicOnDefault)]
pub struct BudgetContract {
    pub owner: AccountId,
    pub token_id: AccountId,
    pub escrow_contract: AccountId,
    pub budgets: IterableMap<u64, ProductBudget>,
    pub review_locks: IterableMap<u64, ReviewLock>,
    pub next_lock_id: u64,
}

#[near]
impl BudgetContract {
    #[init]
    pub fn new(owner: AccountId, token_id: AccountId, escrow_contract: AccountId) -> Self {
        Self {
            owner,
            token_id,
            escrow_contract,
            budgets: IterableMap::new(b"b"),
            review_locks: IterableMap::new(b"r"),
            next_lock_id: 1,
        }
    }

    /// Register or configure a product budget.
    pub fn register_budget(
        &mut self,
        product_id: u64,
        steward: AccountId,
        agent_address: AccountId,
        period_draw_cap: U128,
        initial_unit_cost: U128,
        total_periods: u64,
        projected_remaining_cost: U128,
    ) {
        let predecessor = env::predecessor_account_id();
        require!(
            predecessor == self.owner || predecessor == self.escrow_contract,
            "Unauthorized to register budget"
        );

        let budget = ProductBudget {
            product_id,
            steward,
            agent_address,
            total_ops_received: U128(0),
            current_balance: U128(0),
            period_draw_cap,
            last_draw_period: 1,
            drawn_in_current_period: U128(0),
            inference_cost_per_query: initial_unit_cost,
            last_cost_update_ns: env::block_timestamp(),
            total_periods,
            completed_periods: 0,
            projected_remaining_cost,
            status: BudgetStatus::Active,
        };

        self.budgets.insert(product_id, budget);

        env::log_str(&format!(
            r#"EVENT_JSON:{{"standard":"pandem","version":"0.2.0","event":"budget_registered","data":[{{"product_id":{product_id}}}]}}"#
        ));
    }

    /// Ingests 30% ops share via NEP-141 ft_on_transfer.
    /// Expected msg: {"action": "receive_ops_funds", "product_id": 1}
    pub fn ft_on_transfer(
        &mut self,
        _sender_id: AccountId,
        amount: U128,
        msg: String,
    ) -> PromiseOrValue<U128> {
        // 1. Verify caller is approved token
        if env::predecessor_account_id() != self.token_id {
            return PromiseOrValue::Value(amount);
        }

        // 2. Parse JSON message safely
        let raw: RawReceiveOpsMsg = match near_sdk::serde_json::from_str(&msg) {
            Ok(m) => m,
            Err(_) => return PromiseOrValue::Value(amount),
        };

        if raw.action != "receive_ops_funds" {
            return PromiseOrValue::Value(amount);
        }

        let product_id = match raw.product_id {
            near_sdk::serde_json::Value::Number(n) => match n.as_u64() {
                Some(id) => id,
                None => return PromiseOrValue::Value(amount),
            },
            near_sdk::serde_json::Value::String(s) => match s.parse::<u64>() {
                Ok(id) => id,
                Err(_) => return PromiseOrValue::Value(amount),
            },
            _ => return PromiseOrValue::Value(amount),
        };

        let budget = match self.budgets.get_mut(&product_id) {
            Some(b) => b,
            None => return PromiseOrValue::Value(amount),
        };

        if budget.status != BudgetStatus::Active {
            return PromiseOrValue::Value(amount);
        }

        // 3. Update ops balance
        budget.total_ops_received = U128(budget.total_ops_received.0 + amount.0);
        budget.current_balance = U128(budget.current_balance.0 + amount.0);

        env::log_str(&format!(
            r#"EVENT_JSON:{{"standard":"pandem","version":"0.2.0","event":"ops_funds_received","data":[{{"product_id":{product_id},"amount":"{}"}}]}}"#,
            amount.0
        ));

        PromiseOrValue::Value(U128(0))
    }

    /// Draw ops funds for infrastructure or confidential TEE inference.
    /// Callable only by authorized agent, restricted by period_draw_cap.
    pub fn draw_ops_funds(
        &mut self,
        product_id: u64,
        amount: U128,
        recipient: AccountId,
    ) -> Promise {
        let budget = self.budgets.get_mut(&product_id).expect("Budget not found");
        require!(
            env::predecessor_account_id() == budget.agent_address,
            "Only authorized agent may draw ops funds"
        );
        require!(budget.status == BudgetStatus::Active, "Budget is not active");
        require!(amount.0 > 0, "Draw amount must be positive");
        require!(
            amount.0 <= budget.current_balance.0,
            "Insufficient budget balance"
        );

        let new_draw_total = budget.drawn_in_current_period.0 + amount.0;
        require!(
            new_draw_total <= budget.period_draw_cap.0,
            "Draw amount exceeds period draw cap"
        );

        // Mutate state BEFORE async call
        budget.current_balance = U128(budget.current_balance.0 - amount.0);
        budget.drawn_in_current_period = U128(new_draw_total);

        ext_ft::ext(self.token_id.clone())
            .with_attached_deposit(NearToken::from_yoctonear(1))
            .with_static_gas(GAS_FOR_FT_TRANSFER)
            .ft_transfer(
                recipient.clone(),
                amount,
                Some(format!("ops draw product {product_id}")),
            )
            .then(
                Self::ext(env::current_account_id())
                    .with_static_gas(GAS_FOR_RESOLVE_TRANSFER)
                    .on_draw_ops_callback(product_id, amount),
            )
    }

    #[private]
    pub fn on_draw_ops_callback(
        &mut self,
        product_id: u64,
        amount: U128,
        #[callback_result] r: Result<(), PromiseError>,
    ) -> bool {
        if r.is_err() {
            if let Some(budget) = self.budgets.get_mut(&product_id) {
                budget.current_balance = U128(budget.current_balance.0 + amount.0);
                budget.drawn_in_current_period =
                    U128(budget.drawn_in_current_period.0.saturating_sub(amount.0));
            }
            env::log_str(&format!("draw_ops_funds for product {product_id} failed; rolled back"));
            return false;
        }

        env::log_str(&format!(
            r#"EVENT_JSON:{{"standard":"pandem","version":"0.2.0","event":"ops_budget_drawn","data":[{{"product_id":{product_id},"amount":"{}"}}]}}"#,
            amount.0
        ));
        true
    }

    /// Adjust inference unit cost per query.
    /// Callable by authorized agent, enforces +/- 15% dampener against last_unit_cost.
    pub fn adjust_inference_cost(&mut self, product_id: u64, new_unit_cost: U128) {
        let budget = self.budgets.get_mut(&product_id).expect("Budget not found");
        let predecessor = env::predecessor_account_id();
        require!(
            predecessor == budget.agent_address || predecessor == self.owner,
            "Unauthorized to adjust inference cost"
        );
        require!(budget.status == BudgetStatus::Active, "Budget is not active");

        let last_unit_cost = budget.inference_cost_per_query.0;
        if last_unit_cost > 0 {
            let min_allowed = (last_unit_cost * 85) / 100;
            let max_allowed = (last_unit_cost * 115) / 100;

            require!(
                new_unit_cost.0 >= min_allowed && new_unit_cost.0 <= max_allowed,
                "Inference cost adjustment exceeds +/-15% dampener"
            );
        }

        budget.inference_cost_per_query = new_unit_cost;
        budget.last_cost_update_ns = env::block_timestamp();

        env::log_str(&format!(
            r#"EVENT_JSON:{{"standard":"pandem","version":"0.2.0","event":"inference_cost_adjusted","data":[{{"product_id":{product_id},"new_cost":"{}"}}]}}"#,
            new_unit_cost.0
        ));
    }

    /// Records review-locked funds for steward payout (e.g. 47.5% steward share).
    pub fn record_review_lock(&mut self, product_id: u64, amount: U128) -> u64 {
        let predecessor = env::predecessor_account_id();
        require!(
            predecessor == self.owner || predecessor == self.escrow_contract,
            "Unauthorized to record review lock"
        );
        require!(amount.0 > 0, "Amount must be positive");

        let lock_id = self.next_lock_id;
        self.next_lock_id += 1;

        let lock = ReviewLock {
            lock_id,
            product_id,
            amount,
            lock_timestamp_ns: env::block_timestamp(),
            released: false,
        };

        self.review_locks.insert(lock_id, lock);

        env::log_str(&format!(
            r#"EVENT_JSON:{{"standard":"pandem","version":"0.2.0","event":"review_funds_locked","data":[{{"lock_id":{lock_id},"product_id":{product_id},"amount":"{}"}}]}}"#,
            amount.0
        ));

        lock_id
    }

    /// Release review-locked funds to steward after 7-day lock period.
    pub fn release_review_funds(&mut self, product_id: u64, amount: U128) -> Promise {
        let budget = self.budgets.get(&product_id).expect("Budget not found");
        require!(
            budget.status != BudgetStatus::Abandoned,
            "Cannot release review funds for abandoned product"
        );
        require!(amount.0 > 0, "Amount must be positive");

        let now = env::block_timestamp();
        let mut unlocked_available = 0u128;
        let mut locks_to_release = Vec::new();

        for (id, lock) in self.review_locks.iter() {
            if lock.product_id == product_id && !lock.released {
                require!(
                    now >= lock.lock_timestamp_ns + SEVEN_DAYS_NS,
                    "Review lock period has not elapsed (7 days)"
                );
                unlocked_available += lock.amount.0;
                locks_to_release.push(*id);
                if unlocked_available >= amount.0 {
                    break;
                }
            }
        }

        require!(
            unlocked_available >= amount.0,
            "Insufficient unlocked review funds"
        );

        for id in &locks_to_release {
            if let Some(l) = self.review_locks.get_mut(id) {
                l.released = true;
            }
        }

        let steward = budget.steward.clone();

        ext_ft::ext(self.token_id.clone())
            .with_attached_deposit(NearToken::from_yoctonear(1))
            .with_static_gas(GAS_FOR_FT_TRANSFER)
            .ft_transfer(
                steward,
                amount,
                Some(format!("release review funds product {product_id}")),
            )
            .then(
                Self::ext(env::current_account_id())
                    .with_static_gas(GAS_FOR_RESOLVE_TRANSFER)
                    .on_release_review_callback(locks_to_release),
            )
    }

    #[private]
    pub fn on_release_review_callback(
        &mut self,
        lock_ids: Vec<u64>,
        #[callback_result] r: Result<(), PromiseError>,
    ) -> bool {
        if r.is_err() {
            for id in lock_ids {
                if let Some(l) = self.review_locks.get_mut(&id) {
                    l.released = false;
                }
            }
            env::log_str("release_review_funds failed; rolled back lock state");
            return false;
        }

        env::log_str(
            r#"EVENT_JSON:{"standard":"pandem","version":"0.2.0","event":"review_funds_released"}"#,
        );
        true
    }

    /// Claim ops reserve surplus by steward.
    /// Permits claim only if all periods completed OR reserve > 150% projected costs.
    pub fn claim_ops_reserve(&mut self, product_id: u64) -> Promise {
        let budget = self.budgets.get_mut(&product_id).expect("Budget not found");
        require!(
            env::predecessor_account_id() == budget.steward,
            "Only steward may claim ops reserve"
        );
        require!(budget.status == BudgetStatus::Active, "Budget is not active");

        let all_completed = budget.completed_periods >= budget.total_periods;
        let safety_reserve = (budget.projected_remaining_cost.0 * 150) / 100;
        let is_surplus = budget.current_balance.0 > safety_reserve;

        require!(
            all_completed || is_surplus,
            "Cannot claim ops reserve: terms not completed and reserve <= 150% projected costs"
        );

        let claimable = if all_completed {
            budget.current_balance.0
        } else {
            budget.current_balance.0 - safety_reserve
        };

        require!(claimable > 0, "No claimable ops reserve surplus");

        budget.current_balance = U128(budget.current_balance.0 - claimable);
        let steward = budget.steward.clone();

        ext_ft::ext(self.token_id.clone())
            .with_attached_deposit(NearToken::from_yoctonear(1))
            .with_static_gas(GAS_FOR_FT_TRANSFER)
            .ft_transfer(
                steward,
                U128(claimable),
                Some(format!("claim ops reserve product {product_id}")),
            )
            .then(
                Self::ext(env::current_account_id())
                    .with_static_gas(GAS_FOR_RESOLVE_TRANSFER)
                    .on_claim_ops_callback(product_id, U128(claimable)),
            )
    }

    #[private]
    pub fn on_claim_ops_callback(
        &mut self,
        product_id: u64,
        amount: U128,
        #[callback_result] r: Result<(), PromiseError>,
    ) -> bool {
        if r.is_err() {
            if let Some(budget) = self.budgets.get_mut(&product_id) {
                budget.current_balance = U128(budget.current_balance.0 + amount.0);
            }
            env::log_str("claim_ops_reserve failed; rolled back balance");
            return false;
        }

        env::log_str(&format!(
            r#"EVENT_JSON:{{"standard":"pandem","version":"0.2.0","event":"ops_reserve_claimed","data":[{{"product_id":{product_id},"amount":"{}"}}]}}"#,
            amount.0
        ));
        true
    }

    /// Advance draw period (resets drawn_in_current_period).
    pub fn advance_draw_period(&mut self, product_id: u64) {
        let budget = self.budgets.get_mut(&product_id).expect("Budget not found");
        let predecessor = env::predecessor_account_id();
        require!(
            predecessor == budget.agent_address || predecessor == self.owner,
            "Unauthorized to advance period"
        );
        budget.last_draw_period += 1;
        budget.drawn_in_current_period = U128(0);
    }

    /// Mark a period as completed.
    pub fn complete_period(&mut self, product_id: u64, cost_in_period: U128) {
        let budget = self.budgets.get_mut(&product_id).expect("Budget not found");
        let predecessor = env::predecessor_account_id();
        require!(
            predecessor == self.owner || predecessor == self.escrow_contract,
            "Unauthorized to complete period"
        );
        budget.completed_periods += 1;
        budget.projected_remaining_cost =
            U128(budget.projected_remaining_cost.0.saturating_sub(cost_in_period.0));
    }

    // Views
    pub fn get_budget(&self, product_id: u64) -> Option<ProductBudget> {
        self.budgets.get(&product_id).cloned()
    }

    pub fn get_review_lock(&self, lock_id: u64) -> Option<ReviewLock> {
        self.review_locks.get(&lock_id).cloned()
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use near_sdk::test_utils::VMContextBuilder;
    use near_sdk::testing_env;

    fn setup_budget() -> (
        BudgetContract,
        AccountId,
        AccountId,
        AccountId,
        AccountId,
        AccountId,
    ) {
        let owner: AccountId = "owner.testnet".parse().unwrap();
        let token: AccountId = "usdc.testnet".parse().unwrap();
        let escrow: AccountId = "escrow.testnet".parse().unwrap();
        let steward: AccountId = "steward.testnet".parse().unwrap();
        let agent: AccountId = "agent.testnet".parse().unwrap();

        testing_env!(VMContextBuilder::new()
            .current_account_id("budget.testnet".parse().unwrap())
            .predecessor_account_id(owner.clone())
            .build());

        let mut contract = BudgetContract::new(owner.clone(), token.clone(), escrow.clone());

        contract.register_budget(
            1,
            steward.clone(),
            agent.clone(),
            U128(300), // period_draw_cap
            U128(100), // initial inference cost
            12,        // total_periods
            U128(600), // projected_remaining_cost
        );

        (contract, owner, token, escrow, steward, agent)
    }

    // 1. Draw cap test: draws within cap succeed, exceeding cap panics
    #[test]
    fn test_draw_ops_funds_within_cap() {
        let (mut contract, _owner, token, _escrow, _steward, agent) = setup_budget();

        // Ingest 1000 ops funds via ft_on_transfer
        testing_env!(VMContextBuilder::new().predecessor_account_id(token).build());
        let msg = r#"{"action":"receive_ops_funds","product_id":1}"#;
        let _ = contract.ft_on_transfer("escrow.testnet".parse().unwrap(), U128(1_000), msg.to_string());

        let budget = contract.get_budget(1).unwrap();
        assert_eq!(budget.current_balance.0, 1_000);

        // Agent draws 200 (cap is 300) -> succeeds
        testing_env!(VMContextBuilder::new()
            .current_account_id("budget.testnet".parse().unwrap())
            .predecessor_account_id(agent)
            .build());
        let _ = contract.draw_ops_funds(1, U128(200), "provider.testnet".parse().unwrap());

        let budget = contract.get_budget(1).unwrap();
        assert_eq!(budget.current_balance.0, 800);
        assert_eq!(budget.drawn_in_current_period.0, 200);
    }

    #[test]
    #[should_panic(expected = "Draw amount exceeds period draw cap")]
    fn test_draw_ops_funds_exceeding_cap() {
        let (mut contract, _owner, token, _escrow, _steward, agent) = setup_budget();

        testing_env!(VMContextBuilder::new().predecessor_account_id(token).build());
        let msg = r#"{"action":"receive_ops_funds","product_id":1}"#;
        let _ = contract.ft_on_transfer("escrow.testnet".parse().unwrap(), U128(1_000), msg.to_string());

        // Agent attempts to draw 350 when cap is 300 -> panic
        testing_env!(VMContextBuilder::new()
            .current_account_id("budget.testnet".parse().unwrap())
            .predecessor_account_id(agent)
            .build());
        let _ = contract.draw_ops_funds(1, U128(350), "provider.testnet".parse().unwrap());
    }

    // 2. Dampener tests: +/-15% allowed, >15% swing rejected
    #[test]
    fn test_dampener_allowed_adjustments() {
        let (mut contract, _owner, _token, _escrow, _steward, agent) = setup_budget();

        testing_env!(VMContextBuilder::new().predecessor_account_id(agent.clone()).build());

        // Initial cost is 100
        // +15% is 115 -> should succeed
        contract.adjust_inference_cost(1, U128(115));
        let b = contract.get_budget(1).unwrap();
        assert_eq!(b.inference_cost_per_query.0, 115);

        // -15% of 115 is 115 * 85 / 100 = 97 -> 100 is within bounds -> should succeed
        contract.adjust_inference_cost(1, U128(100));
        let b2 = contract.get_budget(1).unwrap();
        assert_eq!(b2.inference_cost_per_query.0, 100);
    }

    #[test]
    #[should_panic(expected = "Inference cost adjustment exceeds +/-15% dampener")]
    fn test_dampener_rejection_on_excess_increase() {
        let (mut contract, _owner, _token, _escrow, _steward, agent) = setup_budget();

        testing_env!(VMContextBuilder::new().predecessor_account_id(agent).build());
        // Initial cost 100; +25% (125) exceeds 115 bound -> panics
        contract.adjust_inference_cost(1, U128(125));
    }

    #[test]
    #[should_panic(expected = "Inference cost adjustment exceeds +/-15% dampener")]
    fn test_dampener_rejection_on_excess_decrease() {
        let (mut contract, _owner, _token, _escrow, _steward, agent) = setup_budget();

        testing_env!(VMContextBuilder::new().predecessor_account_id(agent).build());
        // Initial cost 100; -20% (80) is below 85 bound -> panics
        contract.adjust_inference_cost(1, U128(80));
    }

    // 3. Review lock duration: fails before 7 days, succeeds after 7 days
    #[test]
    #[should_panic(expected = "Review lock period has not elapsed (7 days)")]
    fn test_review_lock_before_7_days_panics() {
        let (mut contract, owner, _token, _escrow, _steward, _agent) = setup_budget();

        let start_time_ns = 1_000_000_000_000;
        testing_env!(VMContextBuilder::new()
            .predecessor_account_id(owner)
            .block_timestamp(start_time_ns)
            .build());

        let _lock_id = contract.record_review_lock(1, U128(500));

        // 3 days later
        let three_days_ns = start_time_ns + 3 * 86_400 * 1_000_000_000;
        testing_env!(VMContextBuilder::new()
            .current_account_id("budget.testnet".parse().unwrap())
            .predecessor_account_id("anyone.testnet".parse().unwrap())
            .block_timestamp(three_days_ns)
            .build());

        let _ = contract.release_review_funds(1, U128(500)); // panic
    }

    #[test]
    fn test_review_lock_after_7_days_succeeds() {
        let (mut contract, owner, _token, _escrow, _steward, _agent) = setup_budget();

        let start_time_ns = 1_000_000_000_000;
        testing_env!(VMContextBuilder::new()
            .predecessor_account_id(owner)
            .block_timestamp(start_time_ns)
            .build());

        let lock_id = contract.record_review_lock(1, U128(500));

        // 7 days and 1 second later
        let seven_days_ns = start_time_ns + SEVEN_DAYS_NS + 1_000_000_000;
        testing_env!(VMContextBuilder::new()
            .current_account_id("budget.testnet".parse().unwrap())
            .predecessor_account_id("anyone.testnet".parse().unwrap())
            .block_timestamp(seven_days_ns)
            .build());

        let _ = contract.release_review_funds(1, U128(500));

        let lock = contract.get_review_lock(lock_id).unwrap();
        assert!(lock.released);
    }

    // 4. Claim ops reserve: fails if terms not completed and <= 150%, succeeds if surplus or completed
    #[test]
    #[should_panic(expected = "Cannot claim ops reserve: terms not completed and reserve <= 150% projected costs")]
    fn test_claim_ops_reserve_fails_insufficient_surplus() {
        let (mut contract, _owner, token, _escrow, steward, _agent) = setup_budget();

        // projected remaining cost is 600, so 150% is 900.
        // Ingest 800 (< 900)
        testing_env!(VMContextBuilder::new().predecessor_account_id(token).build());
        let msg = r#"{"action":"receive_ops_funds","product_id":1}"#;
        let _ = contract.ft_on_transfer("escrow.testnet".parse().unwrap(), U128(800), msg.to_string());

        testing_env!(VMContextBuilder::new()
            .current_account_id("budget.testnet".parse().unwrap())
            .predecessor_account_id(steward)
            .build());
        let _ = contract.claim_ops_reserve(1); // panic
    }

    #[test]
    fn test_claim_ops_reserve_succeeds_with_surplus() {
        let (mut contract, _owner, token, _escrow, steward, _agent) = setup_budget();

        // projected remaining cost is 600, 150% safety is 900.
        // Ingest 1500 -> surplus is 600
        testing_env!(VMContextBuilder::new().predecessor_account_id(token).build());
        let msg = r#"{"action":"receive_ops_funds","product_id":1}"#;
        let _ = contract.ft_on_transfer("escrow.testnet".parse().unwrap(), U128(1_500), msg.to_string());

        testing_env!(VMContextBuilder::new()
            .current_account_id("budget.testnet".parse().unwrap())
            .predecessor_account_id(steward)
            .build());
        let _ = contract.claim_ops_reserve(1);

        let b = contract.get_budget(1).unwrap();
        // Surplus 600 claimed, 900 safety reserve remains
        assert_eq!(b.current_balance.0, 900);
    }
}
