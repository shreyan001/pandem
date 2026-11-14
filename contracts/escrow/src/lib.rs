use near_sdk::json_types::U128;
use near_sdk::store::{IterableMap, LookupMap};
use near_sdk::{
    env, ext_contract, near, require, AccountId, Gas, NearToken, PanicOnDefault, Promise,
    PromiseError, PromiseOrValue,
};

#[ext_contract(ext_ft)]
pub trait FungibleToken {
    fn ft_transfer(&mut self, receiver_id: AccountId, amount: U128, memo: Option<String>);
}

#[near(serializers = [borsh, json])]
#[derive(Clone, Copy, PartialEq, Eq, Debug)]
pub enum ProductStatus {
    Pending,
    Active,
    Abandoned,
}

#[near(serializers = [borsh, json])]
#[derive(Clone, Debug)]
pub struct Product {
    pub steward: AccountId,
    pub heartbeat_signer: AccountId,
    pub price_per_period: U128,
    pub period_ns: u64,
    pub grace_ns: u64,
    pub status: ProductStatus,
    pub last_heartbeat_period: u64,
    pub last_heartbeat_ns: u64,
    pub ops_reserve: U128,
    pub contingency_reserve: U128,
    pub passport_root: String,
}

#[near(serializers = [borsh, json])]
#[derive(Clone, Debug)]
pub struct Agreement {
    pub product_id: u64,
    pub subscriber: AccountId,
    pub refund_to: AccountId,
    pub price_per_period: U128,
    pub period_ns: u64,
    pub grace_ns: u64,
    pub start_ns: u64,
    pub start_product_period: u64,
}

#[near(serializers = [borsh, json])]
#[derive(Clone, Debug)]
pub struct EscrowState {
    pub funded_periods: u64,
    pub released_periods: u64,
    pub balance: U128,
    pub contingency_contributed: U128,
    pub refunded: bool,
}

#[near(serializers = [json])]
#[derive(Clone, Debug)]
pub struct RawSubscribeMsg {
    pub product_id: String,
    pub periods: u64,
    pub subscriber: Option<AccountId>,
    pub refund_to: Option<AccountId>,
}

#[near(serializers = [json])]
#[derive(Clone, Debug)]
pub struct HealthInfo {
    pub product_id: u64,
    pub status: ProductStatus,
    pub last_heartbeat_period: u64,
    pub last_heartbeat_ns: u64,
    pub is_alive: bool,
    pub in_grace: bool,
}

const GAS_FOR_FT_TRANSFER: Gas = Gas::from_tgas(15);
const GAS_FOR_RESOLVE_TRANSFER: Gas = Gas::from_tgas(10);

#[near(contract_state)]
#[derive(PanicOnDefault)]
pub struct EscrowContract {
    pub owner: AccountId,
    pub token_id: AccountId,
    pub treasury: AccountId,
    pub protocol_fees: u128,
    pub next_product_id: u64,
    pub next_agreement_id: u64,
    pub products: IterableMap<u64, Product>,
    pub agreements: IterableMap<u64, Agreement>,
    pub escrows: LookupMap<u64, EscrowState>,
}

#[near]
impl EscrowContract {
    #[init]
    pub fn new(owner: AccountId, token_id: AccountId, treasury: AccountId) -> Self {
        Self {
            owner,
            token_id,
            treasury,
            protocol_fees: 0,
            next_product_id: 1,
            next_agreement_id: 1,
            products: IterableMap::new(b"p"),
            agreements: IterableMap::new(b"a"),
            escrows: LookupMap::new(b"e"),
        }
    }

    /// Register a new product listing (owner only).
    pub fn register_product(
        &mut self,
        steward: AccountId,
        heartbeat_signer: AccountId,
        price_per_period: U128,
        period_ns: u64,
        grace_ns: u64,
        passport_root: String,
    ) -> u64 {
        require!(
            env::predecessor_account_id() == self.owner,
            "Only owner can register products"
        );
        require!(price_per_period.0 > 0, "Price must be positive");
        require!(period_ns > 0, "Period length must be positive");

        let id = self.next_product_id;
        self.next_product_id += 1;

        let product = Product {
            steward,
            heartbeat_signer,
            price_per_period,
            period_ns,
            grace_ns,
            status: ProductStatus::Pending,
            last_heartbeat_period: 0,
            last_heartbeat_ns: 0,
            ops_reserve: U128(0),
            contingency_reserve: U128(0),
            passport_root,
        };

        self.products.insert(id, product);

        env::log_str(&format!(
            r#"EVENT_JSON:{{"standard":"pandem","version":"0.1.0","event":"product_registered","data":[{{"id":{id}}}]}}"#
        ));

        id
    }

    /// Steward approves and activates product.
    pub fn approve_product(&mut self, id: u64) {
        let product = self.products.get_mut(&id).expect("Product not found");
        require!(
            env::predecessor_account_id() == product.steward,
            "Only steward can approve product"
        );
        require!(
            product.status == ProductStatus::Pending,
            "Product not pending"
        );
        product.status = ProductStatus::Active;
    }

    /// NEP-141 token receiver: processes subscription deposit.
    /// Never panics on bad token or invalid message; returns unused amount to sender.
    pub fn ft_on_transfer(
        &mut self,
        sender_id: AccountId,
        amount: U128,
        msg: String,
    ) -> PromiseOrValue<U128> {
        // 1. Authenticate token predecessor
        if env::predecessor_account_id() != self.token_id {
            return PromiseOrValue::Value(amount);
        }

        // 2. Parse JSON msg safely
        let raw_msg: RawSubscribeMsg = match near_sdk::serde_json::from_str(&msg) {
            Ok(m) => m,
            Err(_) => return PromiseOrValue::Value(amount),
        };

        let product_id: u64 = match raw_msg.product_id.parse() {
            Ok(n) => n,
            Err(_) => return PromiseOrValue::Value(amount),
        };

        if raw_msg.periods == 0 {
            return PromiseOrValue::Value(amount);
        }

        // 3. Validate product
        let product = match self.products.get(&product_id) {
            Some(p) => p,
            None => return PromiseOrValue::Value(amount),
        };

        if product.status != ProductStatus::Active {
            return PromiseOrValue::Value(amount);
        }

        let price = product.price_per_period.0;
        let total_cost = match price.checked_mul(raw_msg.periods as u128) {
            Some(c) => c,
            None => return PromiseOrValue::Value(amount),
        };

        if amount.0 < total_cost {
            return PromiseOrValue::Value(amount);
        }

        let unused = amount.0 - total_cost;
        let subscriber = raw_msg.subscriber.unwrap_or_else(|| sender_id.clone());
        let refund_to = raw_msg.refund_to.unwrap_or_else(|| sender_id.clone());

        let agreement_id = self.next_agreement_id;
        self.next_agreement_id += 1;

        let start_ns = env::block_timestamp();
        let start_product_period = product.last_heartbeat_period + 1; // D-06 fix

        let agreement = Agreement {
            product_id,
            subscriber: subscriber.clone(),
            refund_to: refund_to.clone(),
            price_per_period: U128(price),
            period_ns: product.period_ns,
            grace_ns: product.grace_ns,
            start_ns,
            start_product_period,
        };

        let escrow = EscrowState {
            funded_periods: raw_msg.periods,
            released_periods: 0,
            balance: U128(total_cost),
            contingency_contributed: U128(0),
            refunded: false,
        };

        self.agreements.insert(agreement_id, agreement);
        self.escrows.insert(agreement_id, escrow);

        env::log_str(&format!(
            r#"EVENT_JSON:{{"standard":"pandem","version":"0.1.0","event":"subscribed","data":[{{"id":{agreement_id},"subscriber":"{subscriber}","product_id":{product_id},"periods":{},"amount":"{total_cost}"}}]}}"#,
            raw_msg.periods
        ));

        PromiseOrValue::Value(U128(unused))
    }

    /// Product heartbeat posted by authorized heartbeat signer.
    pub fn heartbeat(&mut self, product_id: u64, period: u64, _status_hash: Option<String>) {
        let product = self.products.get_mut(&product_id).expect("Product not found");
        require!(
            env::predecessor_account_id() == product.heartbeat_signer,
            "Only heartbeat signer may heartbeat"
        );
        require!(
            product.status != ProductStatus::Abandoned,
            "Cannot heartbeat abandoned product"
        );
        require!(
            period > product.last_heartbeat_period,
            "Heartbeat period must strictly increase"
        );

        product.last_heartbeat_period = period;
        product.last_heartbeat_ns = env::block_timestamp();

        if product.status == ProductStatus::Pending {
            product.status = ProductStatus::Active;
        }

        env::log_str(&format!(
            r#"EVENT_JSON:{{"standard":"pandem","version":"0.1.0","event":"heartbeat","data":[{{"product_id":{product_id},"period":{period}}}]}}"#
        ));
    }

    /// Release one period's funds. Callable permissionlessly.
    /// Follows D-06 period check and Stillworks 2.5/30/20/47.5 split.
    pub fn release_period(&mut self, agreement_id: u64) -> Promise {
        let agreement = self.agreements.get(&agreement_id).expect("Agreement not found").clone();
        let product = self.products.get_mut(&agreement.product_id).expect("Product not found");
        let escrow = self.escrows.get_mut(&agreement_id).expect("Escrow not found");

        require!(!escrow.refunded, "Agreement already refunded");
        require!(
            escrow.released_periods < escrow.funded_periods,
            "All funded periods released"
        );

        let p = escrow.released_periods + 1; // 1-indexed relative period
        let required_product_period = agreement.start_product_period + p - 1; // D-06 check
        require!(
            product.last_heartbeat_period >= required_product_period,
            "Heartbeat for period not on-chain"
        );

        let price = agreement.price_per_period.0;
        let fee = (price * 250) / 10000;          // 2.5%
        let ops = (price * 3000) / 10000;         // 30%
        let contingency = (price * 2000) / 10000; // 20%
        let steward_share = price - fee - ops - contingency; // 47.5% remainder (zero rounding leak)

        // Mutate state BEFORE async external call
        escrow.released_periods += 1;
        escrow.balance = U128(escrow.balance.0 - price);
        escrow.contingency_contributed = U128(escrow.contingency_contributed.0 + contingency);

        self.protocol_fees += fee;
        product.ops_reserve = U128(product.ops_reserve.0 + ops);
        product.contingency_reserve = U128(product.contingency_reserve.0 + contingency);

        let steward = product.steward.clone();

        ext_ft::ext(self.token_id.clone())
            .with_attached_deposit(NearToken::from_yoctonear(1))
            .with_static_gas(GAS_FOR_FT_TRANSFER)
            .ft_transfer(
                steward,
                U128(steward_share),
                Some(format!("pandem release {agreement_id} period {p}")),
            )
            .then(
                Self::ext(env::current_account_id())
                    .with_static_gas(GAS_FOR_RESOLVE_TRANSFER)
                    .on_release_period(agreement_id, fee, ops, contingency, steward_share),
            )
    }

    #[private]
    pub fn on_release_period(
        &mut self,
        agreement_id: u64,
        fee: u128,
        ops: u128,
        contingency: u128,
        steward_share: u128,
        #[callback_result] r: Result<(), PromiseError>,
    ) -> bool {
        if r.is_err() {
            // Roll back state on failure
            if let Some(escrow) = self.escrows.get_mut(&agreement_id) {
                escrow.released_periods = escrow.released_periods.saturating_sub(1);
                let price = fee + ops + contingency + steward_share;
                escrow.balance = U128(escrow.balance.0.saturating_add(price));
                escrow.contingency_contributed =
                    U128(escrow.contingency_contributed.0.saturating_sub(contingency));
            }
            self.protocol_fees = self.protocol_fees.saturating_sub(fee);
            if let Some(agreement) = self.agreements.get(&agreement_id) {
                if let Some(product) = self.products.get_mut(&agreement.product_id) {
                    product.ops_reserve = U128(product.ops_reserve.0.saturating_sub(ops));
                    product.contingency_reserve =
                        U128(product.contingency_reserve.0.saturating_sub(contingency));
                }
            }
            env::log_str("release_period failed, rolled back state");
            return false;
        }

        env::log_str(&format!(
            r#"EVENT_JSON:{{"standard":"pandem","version":"0.1.0","event":"released","data":[{{"agreement_id":{agreement_id},"steward_amount":"{steward_share}"}}]}}"#
        ));
        true
    }

    /// Killswitch: steward declares product abandoned.
    pub fn declare_abandoned(&mut self, product_id: u64, reason: Option<String>) {
        let product = self.products.get_mut(&product_id).expect("Product not found");
        require!(
            env::predecessor_account_id() == product.steward,
            "Only steward can declare abandoned"
        );
        require!(
            product.status != ProductStatus::Abandoned,
            "Already abandoned"
        );
        product.status = ProductStatus::Abandoned;

        let reason_str = reason.unwrap_or_else(|| "steward killswitch".to_string());
        env::log_str(&format!(
            r#"EVENT_JSON:{{"standard":"pandem","version":"0.1.0","event":"abandoned","data":[{{"product_id":{product_id},"reason":"{reason_str}"}}]}}"#
        ));
    }

    /// Claim refund for unreleased periods (permissionless).
    /// If abandoned, refund also includes the agreement's contingency share.
    pub fn claim_refund(&mut self, agreement_id: u64) -> Promise {
        let agreement = self.agreements.get(&agreement_id).expect("Agreement not found").clone();
        let product = self.products.get(&agreement.product_id).expect("Product not found");
        let escrow = self.escrows.get_mut(&agreement_id).expect("Escrow not found");

        require!(!escrow.refunded, "Agreement already refunded");
        require!(
            escrow.released_periods < escrow.funded_periods,
            "No unreleased funds"
        );

        let unreleased_periods = escrow.funded_periods - escrow.released_periods;
        let unreleased_amount = unreleased_periods as u128 * agreement.price_per_period.0;

        let is_abandoned = product.status == ProductStatus::Abandoned;
        let is_missed_hb = {
            let next_rel = escrow.released_periods + 1;
            let period_due_ns = agreement.start_ns
                .saturating_add(next_rel.saturating_mul(agreement.period_ns))
                .saturating_add(agreement.grace_ns);
            let req_hb = agreement.start_product_period + next_rel - 1;
            env::block_timestamp() > period_due_ns && product.last_heartbeat_period < req_hb
        };

        require!(
            is_abandoned || is_missed_hb,
            "Refund conditions not met"
        );

        let total_refund = if is_abandoned {
            unreleased_amount + escrow.contingency_contributed.0
        } else {
            unreleased_amount
        };

        // Mutate state BEFORE async call
        escrow.refunded = true;
        let prev_balance = escrow.balance.0;
        escrow.balance = U128(0);

        let refund_to = agreement.refund_to.clone();

        ext_ft::ext(self.token_id.clone())
            .with_attached_deposit(NearToken::from_yoctonear(1))
            .with_static_gas(GAS_FOR_FT_TRANSFER)
            .ft_transfer(
                refund_to,
                U128(total_refund),
                Some(format!("pandem refund {agreement_id}")),
            )
            .then(
                Self::ext(env::current_account_id())
                    .with_static_gas(GAS_FOR_RESOLVE_TRANSFER)
                    .on_claim_refund(agreement_id, prev_balance),
            )
    }

    #[private]
    pub fn on_claim_refund(
        &mut self,
        agreement_id: u64,
        prev_balance: u128,
        #[callback_result] r: Result<(), PromiseError>,
    ) -> bool {
        if r.is_err() {
            if let Some(escrow) = self.escrows.get_mut(&agreement_id) {
                escrow.refunded = false;
                escrow.balance = U128(prev_balance);
            }
            env::log_str("claim_refund failed, rolled back state");
            return false;
        }

        env::log_str(&format!(
            r#"EVENT_JSON:{{"standard":"pandem","version":"0.1.0","event":"refunded","data":[{{"agreement_id":{agreement_id}}}]}}"#
        ));
        true
    }

    /// Withdraw accumulated protocol fees to the treasury.
    pub fn withdraw_fees(&mut self) -> Promise {
        require!(
            env::predecessor_account_id() == self.owner,
            "Only owner can withdraw protocol fees"
        );
        require!(self.protocol_fees > 0, "No protocol fees to withdraw");

        let amount = self.protocol_fees;
        self.protocol_fees = 0;

        ext_ft::ext(self.token_id.clone())
            .with_attached_deposit(NearToken::from_yoctonear(1))
            .with_static_gas(GAS_FOR_FT_TRANSFER)
            .ft_transfer(
                self.treasury.clone(),
                U128(amount),
                Some("pandem protocol fees withdraw".to_string()),
            )
            .then(
                Self::ext(env::current_account_id())
                    .with_static_gas(GAS_FOR_RESOLVE_TRANSFER)
                    .on_withdraw_fees(amount),
            )
    }

    #[private]
    pub fn on_withdraw_fees(
        &mut self,
        amount: u128,
        #[callback_result] r: Result<(), PromiseError>,
    ) -> bool {
        if r.is_err() {
            self.protocol_fees = self.protocol_fees.saturating_add(amount);
            env::log_str("withdraw_fees failed, rolled back");
            return false;
        }
        true
    }

    // --- Views ---

    pub fn get_product(&self, id: u64) -> Option<Product> {
        self.products.get(&id).cloned()
    }

    pub fn list_products(&self, from_index: Option<u64>, limit: Option<u64>) -> Vec<(u64, Product)> {
        let from = from_index.unwrap_or(0);
        let lim = limit.unwrap_or(50);
        self.products
            .iter()
            .skip(from as usize)
            .take(lim as usize)
            .map(|(k, v)| (*k, v.clone()))
            .collect()
    }

    pub fn get_health(&self, product_id: u64) -> Option<HealthInfo> {
        let product = self.products.get(&product_id)?;
        let now = env::block_timestamp();
        let is_abandoned = product.status == ProductStatus::Abandoned;
        let is_alive = !is_abandoned && (product.last_heartbeat_ns == 0 || now <= product.last_heartbeat_ns + product.period_ns + product.grace_ns);
        let in_grace = !is_abandoned && product.last_heartbeat_ns > 0 && now > product.last_heartbeat_ns + product.period_ns && now <= product.last_heartbeat_ns + product.period_ns + product.grace_ns;

        Some(HealthInfo {
            product_id,
            status: product.status,
            last_heartbeat_period: product.last_heartbeat_period,
            last_heartbeat_ns: product.last_heartbeat_ns,
            is_alive,
            in_grace,
        })
    }

    pub fn get_agreement(&self, id: u64) -> Option<Agreement> {
        self.agreements.get(&id).cloned()
    }

    pub fn get_escrow(&self, id: u64) -> Option<EscrowState> {
        self.escrows.get(&id).cloned()
    }

    pub fn get_agreements_for(&self, account_id: AccountId) -> Vec<(u64, Agreement, EscrowState)> {
        self.agreements
            .iter()
            .filter(|(_, a)| a.subscriber == account_id || a.refund_to == account_id)
            .filter_map(|(id, a)| {
                let e = self.escrows.get(id)?;
                Some((*id, a.clone(), e.clone()))
            })
            .collect()
    }

    pub fn is_refund_claimable(&self, agreement_id: u64) -> bool {
        let agreement = match self.agreements.get(&agreement_id) {
            Some(a) => a,
            None => return false,
        };
        let product = match self.products.get(&agreement.product_id) {
            Some(p) => p,
            None => return false,
        };
        let escrow = match self.escrows.get(&agreement_id) {
            Some(e) => e,
            None => return false,
        };

        if escrow.refunded || escrow.released_periods >= escrow.funded_periods {
            return false;
        }

        if product.status == ProductStatus::Abandoned {
            return true;
        }

        let next_rel = escrow.released_periods + 1;
        let period_due_ns = agreement.start_ns
            .saturating_add(next_rel.saturating_mul(agreement.period_ns))
            .saturating_add(agreement.grace_ns);
        let req_hb = agreement.start_product_period + next_rel - 1;

        env::block_timestamp() > period_due_ns && product.last_heartbeat_period < req_hb
    }

    pub fn version(&self) -> String {
        "0.1.0".to_string()
    }

    pub fn get_config(&self) -> (AccountId, AccountId, AccountId, U128) {
        (
            self.owner.clone(),
            self.token_id.clone(),
            self.treasury.clone(),
            U128(self.protocol_fees),
        )
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use near_sdk::test_utils::VMContextBuilder;
    use near_sdk::testing_env;

    fn setup_contract() -> (EscrowContract, AccountId, AccountId, AccountId, AccountId, AccountId) {
        let owner: AccountId = "owner.testnet".parse().unwrap();
        let token: AccountId = "usdc.testnet".parse().unwrap();
        let treasury: AccountId = "treasury.testnet".parse().unwrap();
        let steward: AccountId = "steward.testnet".parse().unwrap();
        let agent: AccountId = "agent.testnet".parse().unwrap();

        let context = VMContextBuilder::new()
            .current_account_id("escrow.testnet".parse().unwrap())
            .predecessor_account_id(owner.clone())
            .block_timestamp(1_000_000_000)
            .build();
        testing_env!(context);

        let mut contract = EscrowContract::new(owner.clone(), token.clone(), treasury.clone());

        // Register product 1: price = 1000, period = 300s, grace = 120s
        let p_id = contract.register_product(
            steward.clone(),
            agent.clone(),
            U128(1_000),
            300_000_000_000,
            120_000_000_000,
            "root_hash".to_string(),
        );
        assert_eq!(p_id, 1);

        // Approve product as steward
        testing_env!(VMContextBuilder::new()
            .predecessor_account_id(steward.clone())
            .build());
        contract.approve_product(1);

        (contract, owner, token, treasury, steward, agent)
    }

    // 1. ft_on_transfer: wrong token, invalid msg, and overpayment excess
    #[test]
    fn test_ft_on_transfer_behaviour() {
        let (mut contract, _owner, token, _treasury, _steward, _agent) = setup_contract();

        // Wrong token => full refund
        testing_env!(VMContextBuilder::new()
            .predecessor_account_id("fake.testnet".parse().unwrap())
            .build());
        let res = contract.ft_on_transfer("alice.testnet".parse().unwrap(), U128(5_000), "{}".to_string());
        if let PromiseOrValue::Value(v) = res {
            assert_eq!(v.0, 5_000);
        } else {
            panic!("Expected Value");
        }

        // Correct token, invalid msg => full refund
        testing_env!(VMContextBuilder::new()
            .predecessor_account_id(token.clone())
            .build());
        let res = contract.ft_on_transfer("alice.testnet".parse().unwrap(), U128(5_000), "invalid json".to_string());
        if let PromiseOrValue::Value(v) = res {
            assert_eq!(v.0, 5_000);
        } else {
            panic!("Expected Value");
        }

        // Correct token, valid msg with overpayment => returns excess
        // Price is 1_000 per period. 3 periods = 3_000. Send 3_500 => unused 500
        let msg = r#"{"product_id":"1","periods":3,"subscriber":"alice.testnet","refund_to":"alice.testnet"}"#;
        let res = contract.ft_on_transfer("alice.testnet".parse().unwrap(), U128(3_500), msg.to_string());
        if let PromiseOrValue::Value(unused) = res {
            assert_eq!(unused.0, 500);
        } else {
            panic!("Expected Value");
        }

        let agreement = contract.get_agreement(1).unwrap();
        assert_eq!(agreement.product_id, 1);
        assert_eq!(agreement.start_product_period, 1); // 0 + 1 = 1

        let escrow = contract.get_escrow(1).unwrap();
        assert_eq!(escrow.funded_periods, 3);
        assert_eq!(escrow.released_periods, 0);
        assert_eq!(escrow.balance.0, 3_000);
    }

    // 2. Sequential release blocked without heartbeat for start_product_period + p - 1 (D-14)
    #[test]
    #[should_panic(expected = "Heartbeat for period not on-chain")]
    fn test_release_blocked_without_heartbeat() {
        let (mut contract, _owner, token, _treasury, _steward, _agent) = setup_contract();

        testing_env!(VMContextBuilder::new().predecessor_account_id(token).build());
        let msg = r#"{"product_id":"1","periods":3}"#;
        let _ = contract.ft_on_transfer("alice.testnet".parse().unwrap(), U128(3_000), msg.to_string());

        // Attempt to release period 1 when last_heartbeat_period is 0 (start_product_period is 1)
        // 1 + 1 - 1 = 1. Requires heartbeat >= 1. Should panic.
        let _ = contract.release_period(1);
    }

    // 3. Split: 2.5% fee, 30% ops, 20% contingency, 47.5% steward
    #[test]
    fn test_split_calculation() {
        let (mut contract, _owner, token, _treasury, _steward, agent) = setup_contract();

        testing_env!(VMContextBuilder::new().predecessor_account_id(token).build());
        let msg = r#"{"product_id":"1","periods":2}"#;
        let _ = contract.ft_on_transfer("alice.testnet".parse().unwrap(), U128(20_000), msg.to_string()); // price is 1000, 2 periods = 2000

        // Agent heartbeats period 1
        testing_env!(VMContextBuilder::new().predecessor_account_id(agent).build());
        contract.heartbeat(1, 1, None);

        // Permissionless caller releases period 1
        testing_env!(VMContextBuilder::new()
            .current_account_id("escrow.testnet".parse().unwrap())
            .predecessor_account_id("anyone.testnet".parse().unwrap())
            .build());
        let _ = contract.release_period(1);

        // Verify split on 1_000:
        // fee = 1000 * 250 / 10000 = 25
        // ops = 1000 * 3000 / 10000 = 300
        // contingency = 1000 * 2000 / 10000 = 200
        // steward = 1000 - 25 - 300 - 200 = 475
        let product = contract.get_product(1).unwrap();
        assert_eq!(contract.protocol_fees, 25);
        assert_eq!(product.ops_reserve.0, 300);
        assert_eq!(product.contingency_reserve.0, 200);

        let escrow = contract.get_escrow(1).unwrap();
        assert_eq!(escrow.released_periods, 1);
        assert_eq!(escrow.contingency_contributed.0, 200);
        assert_eq!(escrow.balance.0, 1000);
    }

    // 4. Refund: possible after grace with missing heartbeat, or when Abandoned
    #[test]
    fn test_refund_when_abandoned() {
        let (mut contract, _owner, token, _treasury, steward, agent) = setup_contract();

        testing_env!(VMContextBuilder::new().predecessor_account_id(token).build());
        let msg = r#"{"product_id":"1","periods":3}"#;
        let _ = contract.ft_on_transfer("alice.testnet".parse().unwrap(), U128(3_000), msg.to_string());

        // Agent posts heartbeat 1 and period 1 is released
        testing_env!(VMContextBuilder::new().predecessor_account_id(agent).build());
        contract.heartbeat(1, 1, None);

        testing_env!(VMContextBuilder::new()
            .current_account_id("escrow.testnet".parse().unwrap())
            .predecessor_account_id("anyone.testnet".parse().unwrap())
            .build());
        let _ = contract.release_period(1);

        // Steward declares abandoned
        testing_env!(VMContextBuilder::new().predecessor_account_id(steward).build());
        contract.declare_abandoned(1, Some("shutdown".to_string()));

        // Refund claimable
        assert!(contract.is_refund_claimable(1));

        // Claim refund: 2 unreleased periods (2_000) + contingency share (200) = 2_200
        testing_env!(VMContextBuilder::new()
            .current_account_id("escrow.testnet".parse().unwrap())
            .predecessor_account_id("alice.testnet".parse().unwrap())
            .build());
        let _ = contract.claim_refund(1);

        let escrow = contract.get_escrow(1).unwrap();
        assert!(escrow.refunded);
        assert_eq!(escrow.balance.0, 0);

        // Cannot claim refund twice
        assert!(!contract.is_refund_claimable(1));
    }

    // 5. Heartbeat period strictly increases and cannot revive Abandoned product
    #[test]
    #[should_panic(expected = "Cannot heartbeat abandoned product")]
    fn test_heartbeat_cannot_revive_abandoned() {
        let (mut contract, _owner, _token, _treasury, steward, agent) = setup_contract();

        testing_env!(VMContextBuilder::new().predecessor_account_id(steward).build());
        contract.declare_abandoned(1, None);

        testing_env!(VMContextBuilder::new().predecessor_account_id(agent).build());
        contract.heartbeat(1, 1, None);
    }

    #[test]
    #[should_panic(expected = "Heartbeat period must strictly increase")]
    fn test_heartbeat_must_strictly_increase() {
        let (mut contract, _owner, _token, _treasury, _steward, agent) = setup_contract();

        testing_env!(VMContextBuilder::new().predecessor_account_id(agent.clone()).build());
        contract.heartbeat(1, 2, None);
        contract.heartbeat(1, 2, None); // panic
    }

    // 6. Rollback callbacks
    #[test]
    fn test_release_rollback_on_failure() {
        let (mut contract, _owner, token, _treasury, _steward, agent) = setup_contract();

        testing_env!(VMContextBuilder::new().predecessor_account_id(token).build());
        let msg = r#"{"product_id":"1","periods":1}"#;
        let _ = contract.ft_on_transfer("alice.testnet".parse().unwrap(), U128(1_000), msg.to_string());

        testing_env!(VMContextBuilder::new().predecessor_account_id(agent).build());
        contract.heartbeat(1, 1, None);

        testing_env!(VMContextBuilder::new()
            .current_account_id("escrow.testnet".parse().unwrap())
            .predecessor_account_id("anyone.testnet".parse().unwrap())
            .build());
        let _ = contract.release_period(1);

        // Simulate callback error
        let failed_result: Result<(), PromiseError> = Err(PromiseError::Failed);
        contract.on_release_period(1, 25, 300, 200, 475, failed_result);

        // Verify state was rolled back
        let escrow = contract.get_escrow(1).unwrap();
        assert_eq!(escrow.released_periods, 0);
        assert_eq!(escrow.balance.0, 1_000);
        assert_eq!(escrow.contingency_contributed.0, 0);
        assert_eq!(contract.protocol_fees, 0);
        let product = contract.get_product(1).unwrap();
        assert_eq!(product.ops_reserve.0, 0);
        assert_eq!(product.contingency_reserve.0, 0);
    }
}
