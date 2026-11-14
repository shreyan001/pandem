// contracts/pandem-tripartite/src/lib.rs
use near_sdk::borsh::{BorshDeserialize, BorshSerialize};
use near_sdk::collections::{LookupMap, UnorderedMap, Vector};
use near_sdk::json_types::U128;
use near_sdk::serde::{Deserialize, Serialize};
use near_sdk::{
    env, ext_contract, near, AccountId, Gas, NearToken, PanicOnDefault, Promise, PromiseOrValue,
};

/// Canonical NEAR Mainnet Contract Identifiers
pub const INTENTS_VERIFIER_CONTRACT: &str = "intents.near";
pub const NEAR_USDC_CONTRACT: &str =
    "17208628f84f5d6ad33f0da3bbbeb27ffcb398eac501a31bd6ad2011e36133a1";
pub const WRAP_NEAR_CONTRACT: &str = "wrap.near";

/// Pandem Tripartite Capital Split (Basis Points, 10_000 = 100%)
pub const OPS_BUDGET_BPS: u128 = 3000;      // 30.0% -> AI Inference, TEE LangGraph/DB & Verifiable Frontend
pub const UPDATE_BUFFER_BPS: u128 = 1750;   // 17.5% -> Product Updates, Bug Bounties & Decentralization
pub const DEV_PAYOUT_BPS: u128 = 5000;      // 50.0% -> Developer Revenue (Subject to 7-Day Clawback)
pub const PROTOCOL_FEE_BPS: u128 = 250;     //  2.5% -> Pandem Attestation & Heartbeat Keepers
pub const TOTAL_BPS: u128 = 10000;

/// 7-Day Waiting Period for Credit Misuse Clawback (604,800 seconds)
pub const SEVEN_DAY_CLAWBACK_SEC: u64 = 604_800;

/// Cross-Contract Interface for `intents.near`
#[ext_contract(ext_intents_verifier)]
pub trait ExtIntentsVerifier {
    fn ft_withdraw(
        &mut self,
        token: String,
        receiver_id: AccountId,
        amount: U128,
        memo: Option<String>,
        msg: Option<String>,
    );

    fn mt_transfer(
        &mut self,
        receiver_id: AccountId,
        token_id: String,
        amount: U128,
        approval: Option<(AccountId, u64)>,
        memo: Option<String>,
    );
}

/// Cross-Contract Interface for NEP-141 Fungible Tokens (USDC / wNEAR)
#[ext_contract(ext_fungible_token)]
pub trait ExtFungibleToken {
    fn ft_transfer(&mut self, receiver_id: AccountId, amount: U128, memo: Option<String>);
    fn ft_transfer_call(
        &mut self,
        receiver_id: AccountId,
        amount: U128,
        memo: Option<String>,
        msg: String,
    );
}

#[derive(BorshDeserialize, BorshSerialize, Serialize, Deserialize, Clone, PartialEq)]
#[serde(crate = "near_sdk::serde")]
pub enum ApiKeyMode {
    PandemManagedKey,   // Pandem generates `pk-pandem-tee-...` and meters 30% Ops Reserve
    DeveloperTopUpKey,  // Contract tops up developer's assigned provider account via `intents.near`
}

#[derive(BorshDeserialize, BorshSerialize, Serialize, Deserialize, Clone, PartialEq)]
#[serde(crate = "near_sdk::serde")]
pub enum PaymentAsset {
    Usdc,       // 6 decimals
    NativeNear, // 24 decimals
}

#[derive(BorshDeserialize, BorshSerialize, Serialize, Deserialize, Clone)]
#[serde(crate = "near_sdk::serde")]
pub struct DeveloperTranche {
    pub tranche_id: u64,
    pub product_id: String,
    pub developer: AccountId,
    pub asset: PaymentAsset,
    pub amount: U128,
    pub created_at_sec: u64,
    pub unlock_at_sec: u64,
    pub claimed: bool,
    pub clawed_back: bool,
    pub clawback_reason: Option<String>,
}

#[derive(BorshDeserialize, BorshSerialize, Serialize, Deserialize, Clone)]
#[serde(crate = "near_sdk::serde")]
pub struct TripartiteProduct {
    pub product_id: String,
    pub name: String,
    pub developer: AccountId,
    pub key_mode: ApiKeyMode,
    pub scoped_api_key_hash: String,
    pub allowed_models: Vec<String>,
    pub tee_compose_hash: String,      // Attested SHA-256 hash of LangGraph + Postgres docker-compose.yml
    pub verifiable_frontend_cid: String, // Filecoin / FastFS frontend root CID
    pub ops_budget_usdc: U128,
    pub ops_budget_near: U128,
    pub update_buffer_usdc: U128,
    pub update_buffer_near: U128,
    pub dev_locked_usdc: U128,
    pub dev_locked_near: U128,
    pub misuse_flagged: bool,
}

#[derive(BorshDeserialize, BorshSerialize, Serialize, Deserialize, Clone)]
#[serde(crate = "near_sdk::serde")]
pub struct BlindSubscription {
    pub commitment_hash: String, // sha256(subscriber_secret + product_id) — zero wallet link!
    pub product_id: String,
    pub expires_at_sec: u64,
    pub active: bool,
}

#[near(contract_state)]
#[derive(PanicOnDefault)]
pub struct PandemTripartiteContract {
    pub admin: AccountId,
    pub enclave_keeper: AccountId,
    pub products: UnorderedMap<String, TripartiteProduct>,
    pub tranches: Vector<DeveloperTranche>,
    pub blind_subscriptions: LookupMap<String, BlindSubscription>,
}

#[near]
impl PandemTripartiteContract {
    #[init]
    pub fn new(admin: AccountId, enclave_keeper: AccountId) -> Self {
        Self {
            admin,
            enclave_keeper,
            products: UnorderedMap::new(b"p"),
            tranches: Vector::new(b"t"),
            blind_subscriptions: LookupMap::new(b"b"),
        }
    }

    /// 1. Register a SaaS product under a Tripartite Agreement
    pub fn register_product(
        &mut self,
        product_id: String,
        name: String,
        key_mode: ApiKeyMode,
        scoped_api_key_hash: String,
        allowed_models: Vec<String>,
        tee_compose_hash: String,
        verifiable_frontend_cid: String,
    ) {
        let product = TripartiteProduct {
            product_id: product_id.clone(),
            name,
            developer: env::predecessor_account_id(),
            key_mode,
            scoped_api_key_hash,
            allowed_models,
            tee_compose_hash,
            verifiable_frontend_cid,
            ops_budget_usdc: U128(0),
            ops_budget_near: U128(0),
            update_buffer_usdc: U128(0),
            update_buffer_near: U128(0),
            dev_locked_usdc: U128(0),
            dev_locked_near: U128(0),
            misuse_flagged: false,
        };
        self.products.insert(&product_id, &product);
    }

    /// 2A. Subscribe Privately Using Native NEAR
    #[payable]
    pub fn subscribe_with_near(
        &mut self,
        product_id: String,
        blind_commitment_hash: String,
        duration_sec: u64,
    ) {
        let deposit = env::attached_deposit().as_yoctonear();
        assert!(deposit > 0, "Must attach NEAR deposit");
        self.internal_process_subscription(
            product_id,
            blind_commitment_hash,
            deposit,
            PaymentAsset::NativeNear,
            duration_sec,
        );
    }

    /// 2B. Subscribe Privately Using USDC (`17208628...`) via NEP-141 `ft_on_transfer`
    /// Called automatically when a NEAR Confidential Intent solver settles USDC to this contract.
    /// `msg` format: `{"product_id":"postiz-private","blind_commitment_hash":"0xabc...","duration_sec":2592000}`
    pub fn ft_on_transfer(
        &mut self,
        sender_id: AccountId,
        amount: U128,
        msg: String,
    ) -> PromiseOrValue<U128> {
        let token = env::predecessor_account_id();
        assert!(
            token.as_str() == NEAR_USDC_CONTRACT || token.as_str() == WRAP_NEAR_CONTRACT,
            "Unsupported token contract"
        );

        #[derive(Deserialize)]
        #[serde(crate = "near_sdk::serde")]
        struct SubPayload {
            product_id: String,
            blind_commitment_hash: String,
            duration_sec: u64,
        }

        let payload: SubPayload = serde_json::from_str(&msg).expect("Invalid msg JSON");
        let _ = sender_id; // Never persisted so subscriber wallet remains completely unlinkable!

        self.internal_process_subscription(
            payload.product_id,
            payload.blind_commitment_hash,
            amount.0,
            PaymentAsset::Usdc,
            payload.duration_sec,
        );

        PromiseOrValue::Value(U128(0))
    }

    fn internal_process_subscription(
        &mut self,
        product_id: String,
        blind_commitment_hash: String,
        amount: u128,
        asset: PaymentAsset,
        duration_sec: u64,
    ) {
        let mut product = self.products.get(&product_id).expect("Product not found");

        let ops_share = (amount * OPS_BUDGET_BPS) / TOTAL_BPS;
        let update_share = (amount * UPDATE_BUFFER_BPS) / TOTAL_BPS;
        let dev_share = (amount * DEV_PAYOUT_BPS) / TOTAL_BPS;
        let now_sec = env::block_timestamp_ms() / 1000;

        match asset {
            PaymentAsset::Usdc => {
                product.ops_budget_usdc = U128(product.ops_budget_usdc.0 + ops_share);
                product.update_buffer_usdc = U128(product.update_buffer_usdc.0 + update_share);
                product.dev_locked_usdc = U128(product.dev_locked_usdc.0 + dev_share);
            }
            PaymentAsset::NativeNear => {
                product.ops_budget_near = U128(product.ops_budget_near.0 + ops_share);
                product.update_buffer_near = U128(product.update_buffer_near.0 + update_share);
                product.dev_locked_near = U128(product.dev_locked_near.0 + dev_share);
            }
        }
        self.products.insert(&product_id, &product);

        let tranche_id = self.tranches.len();
        self.tranches.push(&DeveloperTranche {
            tranche_id,
            product_id: product_id.clone(),
            developer: product.developer,
            asset,
            amount: U128(dev_share),
            created_at_sec: now_sec,
            unlock_at_sec: now_sec + SEVEN_DAY_CLAWBACK_SEC,
            claimed: false,
            clawed_back: false,
            clawback_reason: None,
        });

        self.blind_subscriptions.insert(
            &blind_commitment_hash,
            &BlindSubscription {
                commitment_hash: blind_commitment_hash.clone(),
                product_id,
                expires_at_sec: now_sec + duration_sec,
                active: true,
            },
        );
    }

    /// 3. Direct Smart-Contract Payment via `intents.near` from the 30% Operations Reserve
    /// Pays NEAR AI Cloud, Phala TEE compute, or Filecoin/Lighthouse x402 storage renewals.
    pub fn pay_provider_via_intents(
        &mut self,
        product_id: String,
        amount_usdc: U128,
        intents_token_id: String,    // e.g. NEAR_USDC_CONTRACT or "base-0x833589fcd6edb6e08f4c7c32d4f71b54bda02913.omft.near"
        provider_account: AccountId, // e.g. "intents.near" or "billing.near-ai.near"
        withdraw_memo: Option<String>, // e.g. Some("WITHDRAW_TO:0xProviderAddressOnBase")
    ) -> Promise {
        let caller = env::predecessor_account_id();
        let mut product = self.products.get(&product_id).expect("Product not found");
        assert!(
            caller == self.enclave_keeper || caller == product.developer,
            "Unauthorized caller"
        );
        assert!(!product.misuse_flagged, "Product is frozen due to credit misuse");
        assert!(
            product.ops_budget_usdc.0 >= amount_usdc.0,
            "Insufficient 30% Ops USDC balance"
        );

        product.ops_budget_usdc = U128(product.ops_budget_usdc.0 - amount_usdc.0);
        self.products.insert(&product_id, &product);

        ext_intents_verifier::ext(INTENTS_VERIFIER_CONTRACT.parse().unwrap())
            .with_attached_deposit(NearToken::from_yoctonear(1))
            .with_static_gas(Gas::from_tgas(100))
            .ft_withdraw(
                intents_token_id,
                provider_account,
                amount_usdc,
                withdraw_memo,
                None, // Leaving `msg` as None preserves `intents.near` automatic refund protection
            )
    }

    /// 4. 7-Day Clawback Function: Reclaims Developer Payout if API Credits or TEE Stack Are Misused
    pub fn clawback_misused_credits(
        &mut self,
        tranche_id: u64,
        reason: String,
        rotated_api_key_hash: String,
    ) {
        assert_eq!(
            env::predecessor_account_id(),
            self.enclave_keeper,
            "Only Pandem Enclave Keeper can execute clawback"
        );

        let mut tranche = self.tranches.get(tranche_id).expect("Tranche not found");
        let now_sec = env::block_timestamp_ms() / 1000;
        assert!(!tranche.claimed, "Already claimed");
        assert!(!tranche.clawed_back, "Already clawed back");
        assert!(now_sec <= tranche.unlock_at_sec, "7-day clawback window expired");

        tranche.clawed_back = true;
        tranche.clawback_reason = Some(reason);
        self.tranches.replace(tranche_id, &tranche);

        let mut product = self.products.get(&tranche.product_id).expect("Product not found");
        product.misuse_flagged = true;
        product.scoped_api_key_hash = rotated_api_key_hash;

        match tranche.asset {
            PaymentAsset::Usdc => {
                product.dev_locked_usdc = U128(product.dev_locked_usdc.0 - tranche.amount.0);
                product.ops_budget_usdc = U128(product.ops_budget_usdc.0 + tranche.amount.0);
            }
            PaymentAsset::NativeNear => {
                product.dev_locked_near = U128(product.dev_locked_near.0 - tranche.amount.0);
                product.ops_budget_near = U128(product.ops_budget_near.0 + tranche.amount.0);
            }
        }
        self.products.insert(&tranche.product_id, &product);
    }

    /// 5. Developer Payout Claim (Unlocked After 7-Day Waiting Period)
    pub fn claim_dev_payout(&mut self, tranche_id: u64) -> Promise {
        let mut tranche = self.tranches.get(tranche_id).expect("Tranche not found");
        let now_sec = env::block_timestamp_ms() / 1000;

        assert_eq!(env::predecessor_account_id(), tranche.developer, "Only developer can claim");
        assert!(!tranche.claimed, "Already claimed");
        assert!(!tranche.clawed_back, "Tranche clawed back for misuse");
        assert!(now_sec >= tranche.unlock_at_sec, "7-day waiting period still active");

        tranche.claimed = true;
        self.tranches.replace(tranche_id, &tranche);

        let mut product = self.products.get(&tranche.product_id).expect("Product not found");
        match tranche.asset {
            PaymentAsset::Usdc => {
                product.dev_locked_usdc = U128(product.dev_locked_usdc.0 - tranche.amount.0);
                self.products.insert(&tranche.product_id, &product);
                ext_fungible_token::ext(NEAR_USDC_CONTRACT.parse().unwrap())
                    .with_attached_deposit(NearToken::from_yoctonear(1))
                    .with_static_gas(Gas::from_tgas(30))
                    .ft_transfer(
                        tranche.developer,
                        tranche.amount,
                        Some("Pandem Verified 7-Day Payout".to_string()),
                    )
            }
            PaymentAsset::NativeNear => {
                product.dev_locked_near = U128(product.dev_locked_near.0 - tranche.amount.0);
                self.products.insert(&tranche.product_id, &product);
                Promise::new(tranche.developer).transfer(NearToken::from_yoctonear(tranche.amount.0))
            }
        }
    }

    // View methods
    pub fn get_product(&self, product_id: String) -> Option<TripartiteProduct> {
        self.products.get(&product_id)
    }

    pub fn get_tranche(&self, tranche_id: u64) -> Option<DeveloperTranche> {
        self.tranches.get(tranche_id)
    }

    pub fn get_blind_subscription(&self, commitment_hash: String) -> Option<BlindSubscription> {
        self.blind_subscriptions.get(&commitment_hash)
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use near_sdk::test_utils::VMContextBuilder;
    use near_sdk::testing_env;

    fn setup_contract() -> (PandemTripartiteContract, AccountId, AccountId, AccountId) {
        let admin: AccountId = "admin.near".parse().unwrap();
        let keeper: AccountId = "keeper.near".parse().unwrap();
        let dev: AccountId = "developer.near".parse().unwrap();

        testing_env!(VMContextBuilder::new()
            .current_account_id("pandem-tripartite.near".parse().unwrap())
            .predecessor_account_id(admin.clone())
            .build());

        let mut contract = PandemTripartiteContract::new(admin.clone(), keeper.clone());

        // Register product as developer
        testing_env!(VMContextBuilder::new()
            .current_account_id("pandem-tripartite.near".parse().unwrap())
            .predecessor_account_id(dev.clone())
            .build());

        contract.register_product(
            "postiz-private".to_string(),
            "Postiz Private AI".to_string(),
            ApiKeyMode::PandemManagedKey,
            "hash123".to_string(),
            vec!["Qwen/Qwen2.5-72B-Instruct".to_string()],
            "composehash123".to_string(),
            "cid123".to_string(),
        );

        (contract, admin, keeper, dev)
    }

    #[test]
    fn test_subscription_split_near() {
        let (mut contract, _admin, _keeper, _dev) = setup_contract();

        let subscriber: AccountId = "alice.near".parse().unwrap();
        let deposit = NearToken::from_yoctonear(10_000); // 10,000 yocto

        testing_env!(VMContextBuilder::new()
            .current_account_id("pandem-tripartite.near".parse().unwrap())
            .predecessor_account_id(subscriber)
            .attached_deposit(deposit)
            .block_timestamp(1_000_000_000_000)
            .build());

        contract.subscribe_with_near(
            "postiz-private".to_string(),
            "blindhash_abc".to_string(),
            2592000,
        );

        let prod = contract.get_product("postiz-private".to_string()).unwrap();
        // 30% ops = 3,000; 17.5% update = 1,750; 50% dev = 5,000
        assert_eq!(prod.ops_budget_near.0, 3_000);
        assert_eq!(prod.update_buffer_near.0, 1_750);
        assert_eq!(prod.dev_locked_near.0, 5_000);

        let sub = contract.get_blind_subscription("blindhash_abc".to_string()).unwrap();
        assert!(sub.active);
        assert_eq!(sub.product_id, "postiz-private");

        let tranche = contract.get_tranche(0).unwrap();
        assert_eq!(tranche.amount.0, 5_000);
        assert!(!tranche.claimed);
        assert!(!tranche.clawed_back);
    }

    #[test]
    fn test_subscription_split_usdc() {
        let (mut contract, _admin, _keeper, _dev) = setup_contract();

        let token: AccountId = NEAR_USDC_CONTRACT.parse().unwrap();
        let amount = U128(20_000_000); // 20 USDC

        testing_env!(VMContextBuilder::new()
            .current_account_id("pandem-tripartite.near".parse().unwrap())
            .predecessor_account_id(token)
            .block_timestamp(1_000_000_000_000)
            .build());

        let msg = r#"{"product_id":"postiz-private","blind_commitment_hash":"blind_usdc_123","duration_sec":2592000}"#;
        let _ = contract.ft_on_transfer("solver.near".parse().unwrap(), amount, msg.to_string());

        let prod = contract.get_product("postiz-private".to_string()).unwrap();
        // 30% = 6,000,000; 17.5% = 3,500,000; 50% = 10,000,000
        assert_eq!(prod.ops_budget_usdc.0, 6_000_000);
        assert_eq!(prod.update_buffer_usdc.0, 3_500_000);
        assert_eq!(prod.dev_locked_usdc.0, 10_000_000);
    }

    #[test]
    fn test_clawback_misused_credits() {
        let (mut contract, _admin, keeper, _dev) = setup_contract();

        // Subscribe with NEAR
        testing_env!(VMContextBuilder::new()
            .current_account_id("pandem-tripartite.near".parse().unwrap())
            .predecessor_account_id("alice.near".parse().unwrap())
            .attached_deposit(NearToken::from_yoctonear(10_000))
            .block_timestamp(1_000_000_000_000) // 1000 sec
            .build());

        contract.subscribe_with_near("postiz-private".to_string(), "blindhash_claw".to_string(), 2592000);

        // Within 7 days, keeper triggers clawback
        testing_env!(VMContextBuilder::new()
            .current_account_id("pandem-tripartite.near".parse().unwrap())
            .predecessor_account_id(keeper)
            .block_timestamp(1_100_000_000_000) // 1100 sec (within 7 days)
            .build());

        contract.clawback_misused_credits(0, "Unauthorized LLM call".to_string(), "rotated_key_hash".to_string());

        let tranche = contract.get_tranche(0).unwrap();
        assert!(tranche.clawed_back);
        assert_eq!(tranche.clawback_reason, Some("Unauthorized LLM call".to_string()));

        let prod = contract.get_product("postiz-private".to_string()).unwrap();
        assert!(prod.misuse_flagged);
        // Dev locked (5,000) was clawed back into ops budget (3,000 + 5,000 = 8,000)
        assert_eq!(prod.dev_locked_near.0, 0);
        assert_eq!(prod.ops_budget_near.0, 8_000);
    }
}
