use near_sdk::json_types::U128;
use near_sdk::store::LookupMap;
use near_sdk::{
    env, ext_contract, near, require, AccountId, Gas, NearToken, PanicOnDefault, Promise,
    PromiseError, PromiseOrValue,
};

pub const DECIMALS: u8 = 6;
pub const FAUCET_AMOUNT: u128 = 100_000_000; // 100 tUSDC with 6 decimal places
pub const TWENTY_FOUR_HOURS_NS: u64 = 24 * 60 * 60 * 1_000_000_000; // 86,400,000,000,000 ns
pub const MIN_STORAGE_BALANCE: NearToken = NearToken::from_millinear(1);

const GAS_FOR_FT_ON_TRANSFER: Gas = Gas::from_tgas(30);
const GAS_FOR_RESOLVE_TRANSFER: Gas = Gas::from_tgas(10);

#[ext_contract(ext_ft_receiver)]
pub trait FungibleTokenReceiver {
    fn ft_on_transfer(
        &mut self,
        sender_id: AccountId,
        amount: U128,
        msg: String,
    ) -> PromiseOrValue<U128>;
}

#[ext_contract(ext_self)]
pub trait ExtSelf {
    fn ft_resolve_transfer(
        &mut self,
        sender_id: AccountId,
        receiver_id: AccountId,
        amount: U128,
    ) -> U128;
}

#[near(serializers = [borsh, json])]
#[derive(Clone, Debug, PartialEq, Eq)]
pub struct StorageBalance {
    pub total: NearToken,
    pub available: NearToken,
}

#[near(serializers = [borsh, json])]
#[derive(Clone, Debug, PartialEq, Eq)]
pub struct StorageBalanceBounds {
    pub min: NearToken,
    pub max: Option<NearToken>,
}

#[near(serializers = [borsh, json])]
#[derive(Clone, Debug, PartialEq, Eq)]
pub struct FungibleTokenMetadata {
    pub spec: String,
    pub name: String,
    pub symbol: String,
    pub icon: Option<String>,
    pub reference: Option<String>,
    pub reference_hash: Option<String>,
    pub decimals: u8,
}

#[near(contract_state)]
#[derive(PanicOnDefault)]
pub struct MockTUsdcToken {
    pub owner: AccountId,
    pub total_supply: u128,
    pub accounts: LookupMap<AccountId, u128>,
    pub registered_storage: LookupMap<AccountId, NearToken>,
    pub last_faucet_claim: LookupMap<AccountId, u64>,
}

#[near]
impl MockTUsdcToken {
    #[init]
    pub fn new(owner: AccountId) -> Self {
        let mut contract = Self {
            owner: owner.clone(),
            total_supply: 0,
            accounts: LookupMap::new(b"a"),
            registered_storage: LookupMap::new(b"s"),
            last_faucet_claim: LookupMap::new(b"f"),
        };
        // Auto-register owner with 0 balance
        contract.accounts.insert(owner.clone(), 0);
        contract
            .registered_storage
            .insert(owner, MIN_STORAGE_BALANCE);
        contract
    }

    /// Faucet giving 100 tUSDC per account per 24 hours.
    /// Automatically handles storage registration for the caller if not yet registered.
    pub fn faucet(&mut self) -> U128 {
        let caller = env::predecessor_account_id();
        let now = env::block_timestamp();

        // 1. Rate limiting check: once per 24 hours per account
        if let Some(last_claim) = self.last_faucet_claim.get(&caller) {
            require!(
                now >= *last_claim + TWENTY_FOUR_HOURS_NS,
                "Faucet rate limit: 100 tUSDC per account per 24h"
            );
        }

        // 2. Storage handled: automatically register caller if not already registered
        if !self.accounts.contains_key(&caller) {
            self.accounts.insert(caller.clone(), 0);
            self.registered_storage
                .insert(caller.clone(), MIN_STORAGE_BALANCE);
        }

        // 3. Mint 100 tUSDC
        let current_bal = self.accounts.get(&caller).copied().unwrap_or(0);
        let new_bal = current_bal
            .checked_add(FAUCET_AMOUNT)
            .expect("Balance overflow");
        self.accounts.insert(caller.clone(), new_bal);
        self.total_supply = self
            .total_supply
            .checked_add(FAUCET_AMOUNT)
            .expect("Total supply overflow");

        // 4. Record claim timestamp
        self.last_faucet_claim.insert(caller.clone(), now);

        env::log_str(&format!(
            r#"EVENT_JSON:{{"standard":"nep141","version":"1.0.0","event":"ft_mint","data":[{{"owner_id":"{caller}","amount":"{FAUCET_AMOUNT}"}}]}}"#
        ));

        U128(FAUCET_AMOUNT)
    }

    /// Transfer tokens to a receiver. Requires 1 yocto deposit.
    #[payable]
    pub fn ft_transfer(&mut self, receiver_id: AccountId, amount: U128, memo: Option<String>) {
        require!(
            env::attached_deposit() == NearToken::from_yoctonear(1),
            "Requires attached deposit of exactly 1 yoctoNEAR"
        );
        let sender_id = env::predecessor_account_id();
        self.internal_transfer(&sender_id, &receiver_id, amount.0, memo);
    }

    /// Transfer tokens and call on_transfer on receiver contract. Requires 1 yocto deposit.
    #[payable]
    pub fn ft_transfer_call(
        &mut self,
        receiver_id: AccountId,
        amount: U128,
        memo: Option<String>,
        msg: String,
    ) -> Promise {
        require!(
            env::attached_deposit() == NearToken::from_yoctonear(1),
            "Requires attached deposit of exactly 1 yoctoNEAR"
        );
        let sender_id = env::predecessor_account_id();
        self.internal_transfer(&sender_id, &receiver_id, amount.0, memo);

        ext_ft_receiver::ext(receiver_id.clone())
            .with_static_gas(GAS_FOR_FT_ON_TRANSFER)
            .ft_on_transfer(sender_id.clone(), amount, msg)
            .then(
                ext_self::ext(env::current_account_id())
                    .with_static_gas(GAS_FOR_RESOLVE_TRANSFER)
                    .ft_resolve_transfer(sender_id, receiver_id, amount),
            )
    }

    /// Internal transfer logic.
    fn internal_transfer(
        &mut self,
        sender_id: &AccountId,
        receiver_id: &AccountId,
        amount: u128,
        memo: Option<String>,
    ) {
        require!(amount > 0, "Transfer amount must be positive");
        require!(sender_id != receiver_id, "Cannot transfer to self");

        let sender_bal = self
            .accounts
            .get(sender_id)
            .copied()
            .expect("Sender account is not registered");
        require!(sender_bal >= amount, "Insufficient balance");

        // Ensure receiver is registered or auto-register if storage handled
        if !self.accounts.contains_key(receiver_id) {
            self.accounts.insert(receiver_id.clone(), 0);
            self.registered_storage
                .insert(receiver_id.clone(), MIN_STORAGE_BALANCE);
        }

        let receiver_bal = self.accounts.get(receiver_id).copied().unwrap_or(0);

        self.accounts.insert(sender_id.clone(), sender_bal - amount);
        self.accounts
            .insert(receiver_id.clone(), receiver_bal + amount);

        let memo_str = memo.unwrap_or_default();
        env::log_str(&format!(
            r#"EVENT_JSON:{{"standard":"nep141","version":"1.0.0","event":"ft_transfer","data":[{{"old_owner_id":"{sender_id}","new_owner_id":"{receiver_id}","amount":"{amount}","memo":"{memo_str}"}}]}}"#
        ));
    }

    /// Resolve transfer callback. Rolls back unused funds to sender.
    #[private]
    pub fn ft_resolve_transfer(
        &mut self,
        sender_id: AccountId,
        receiver_id: AccountId,
        amount: U128,
        #[callback_result] result: Result<U128, PromiseError>,
    ) -> U128 {
        let unused_amount = match result {
            Ok(unused) => std::cmp::min(unused.0, amount.0),
            Err(_) => amount.0,
        };

        if unused_amount > 0 {
            let receiver_bal = self.accounts.get(&receiver_id).copied().unwrap_or(0);
            let refund = std::cmp::min(receiver_bal, unused_amount);

            if refund > 0 {
                self.accounts.insert(receiver_id.clone(), receiver_bal - refund);
                let sender_bal = self.accounts.get(&sender_id).copied().unwrap_or(0);
                self.accounts.insert(sender_id.clone(), sender_bal + refund);

                env::log_str(&format!(
                    r#"EVENT_JSON:{{"standard":"nep141","version":"1.0.0","event":"ft_transfer","data":[{{"old_owner_id":"{receiver_id}","new_owner_id":"{sender_id}","amount":"{refund}","memo":"refund unused"}}]}}"#
                ));
            }
        }

        U128(amount.0 - unused_amount)
    }

    /// Total supply of tUSDC.
    pub fn ft_total_supply(&self) -> U128 {
        U128(self.total_supply)
    }

    /// Balance of account in tUSDC.
    pub fn ft_balance_of(&self, account_id: AccountId) -> U128 {
        U128(self.accounts.get(&account_id).copied().unwrap_or(0))
    }

    /// NEP-148 metadata for tUSDC (6 decimals).
    pub fn ft_metadata(&self) -> FungibleTokenMetadata {
        FungibleTokenMetadata {
            spec: "ft-1.0.0".to_string(),
            name: "Testnet USDC".to_string(),
            symbol: "tUSDC".to_string(),
            icon: None,
            reference: None,
            reference_hash: None,
            decimals: DECIMALS,
        }
    }

    /// NEP-145 storage deposit.
    #[payable]
    pub fn storage_deposit(
        &mut self,
        account_id: Option<AccountId>,
        _registration_only: Option<bool>,
    ) -> StorageBalance {
        let account = account_id.unwrap_or_else(|| env::predecessor_account_id());
        let attached = env::attached_deposit();

        require!(
            attached >= MIN_STORAGE_BALANCE,
            "Attached deposit below minimum storage bound"
        );

        if !self.accounts.contains_key(&account) {
            self.accounts.insert(account.clone(), 0);
            self.registered_storage.insert(account.clone(), attached);
        } else {
            let current = self
                .registered_storage
                .get(&account)
                .copied()
                .unwrap_or(NearToken::from_yoctonear(0));
            self.registered_storage
                .insert(account.clone(), current.saturating_add(attached));
        }

        StorageBalance {
            total: self
                .registered_storage
                .get(&account)
                .copied()
                .unwrap_or(MIN_STORAGE_BALANCE),
            available: NearToken::from_yoctonear(0),
        }
    }

    /// Storage balance bounds.
    pub fn storage_balance_bounds(&self) -> StorageBalanceBounds {
        StorageBalanceBounds {
            min: MIN_STORAGE_BALANCE,
            max: Some(MIN_STORAGE_BALANCE),
        }
    }

    /// Storage balance of account.
    pub fn storage_balance_of(&self, account_id: AccountId) -> Option<StorageBalance> {
        if self.accounts.contains_key(&account_id) {
            Some(StorageBalance {
                total: self
                    .registered_storage
                    .get(&account_id)
                    .copied()
                    .unwrap_or(MIN_STORAGE_BALANCE),
                available: NearToken::from_yoctonear(0),
            })
        } else {
            None
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use near_sdk::test_utils::VMContextBuilder;
    use near_sdk::testing_env;

    fn get_context(predecessor: &str, block_timestamp_ns: u64, attached_deposit: NearToken) -> VMContextBuilder {
        let mut builder = VMContextBuilder::new();
        builder
            .current_account_id("mock-tusdc.testnet".parse().unwrap())
            .signer_account_id(predecessor.parse().unwrap())
            .predecessor_account_id(predecessor.parse().unwrap())
            .block_timestamp(block_timestamp_ns)
            .attached_deposit(attached_deposit);
        builder
    }

    #[test]
    fn test_initial_metadata() {
        let context = get_context("owner.testnet", 1_000_000_000, NearToken::from_yoctonear(0));
        testing_env!(context.build());

        let contract = MockTUsdcToken::new("owner.testnet".parse().unwrap());
        let meta = contract.ft_metadata();
        assert_eq!(meta.name, "Testnet USDC");
        assert_eq!(meta.symbol, "tUSDC");
        assert_eq!(meta.decimals, 6);
        assert_eq!(contract.ft_total_supply().0, 0);
    }

    #[test]
    fn test_faucet_first_claim() {
        let context = get_context("alice.testnet", 1_000_000_000, NearToken::from_yoctonear(0));
        testing_env!(context.build());

        let mut contract = MockTUsdcToken::new("owner.testnet".parse().unwrap());
        let claimed = contract.faucet();
        assert_eq!(claimed.0, 100_000_000); // 100 tUSDC
        assert_eq!(contract.ft_balance_of("alice.testnet".parse().unwrap()).0, 100_000_000);
        assert_eq!(contract.ft_total_supply().0, 100_000_000);
        assert!(contract.storage_balance_of("alice.testnet".parse().unwrap()).is_some());
    }

    #[test]
    #[should_panic(expected = "Faucet rate limit: 100 tUSDC per account per 24h")]
    fn test_faucet_rate_limit_rejection() {
        let start_time = 1_000_000_000;
        let mut context = get_context("alice.testnet", start_time, NearToken::from_yoctonear(0));
        testing_env!(context.build());

        let mut contract = MockTUsdcToken::new("owner.testnet".parse().unwrap());
        contract.faucet();

        // 1 hour later (should panic)
        context.block_timestamp(start_time + 3600 * 1_000_000_000);
        testing_env!(context.build());
        contract.faucet();
    }

    #[test]
    fn test_faucet_after_24_hours_succeeds() {
        let start_time = 1_000_000_000;
        let mut context = get_context("alice.testnet", start_time, NearToken::from_yoctonear(0));
        testing_env!(context.build());

        let mut contract = MockTUsdcToken::new("owner.testnet".parse().unwrap());
        contract.faucet();
        assert_eq!(contract.ft_balance_of("alice.testnet".parse().unwrap()).0, 100_000_000);

        // Advance 25 hours
        context.block_timestamp(start_time + 25 * 3600 * 1_000_000_000);
        testing_env!(context.build());

        let claimed2 = contract.faucet();
        assert_eq!(claimed2.0, 100_000_000);
        assert_eq!(contract.ft_balance_of("alice.testnet".parse().unwrap()).0, 200_000_000);
        assert_eq!(contract.ft_total_supply().0, 200_000_000);
    }

    #[test]
    fn test_ft_transfer() {
        let start_time = 1_000_000_000;
        let mut context = get_context("alice.testnet", start_time, NearToken::from_yoctonear(0));
        testing_env!(context.build());

        let mut contract = MockTUsdcToken::new("owner.testnet".parse().unwrap());
        contract.faucet();

        // Alice transfers 25 tUSDC to Bob
        context.attached_deposit(NearToken::from_yoctonear(1));
        testing_env!(context.build());
        contract.ft_transfer("bob.testnet".parse().unwrap(), U128(25_000_000), Some("payment".to_string()));

        assert_eq!(contract.ft_balance_of("alice.testnet".parse().unwrap()).0, 75_000_000);
        assert_eq!(contract.ft_balance_of("bob.testnet".parse().unwrap()).0, 25_000_000);
    }
}
