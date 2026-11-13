use near_sdk::json_types::U128;
use near_sdk::store::LookupMap;
use near_sdk::{env, ext_contract, near, require, AccountId, Gas, NearToken, PanicOnDefault, Promise, PromiseError, PromiseOrValue};

#[ext_contract(ext_ft)]
pub trait FungibleToken {
    fn ft_transfer(&mut self, receiver_id: AccountId, amount: U128, memo: Option<String>);
}

#[near(serializers = [borsh, json])]
#[derive(Clone)]
pub struct Subscription {
    pub subscriber: AccountId,
    pub amount: U128,
    pub msg: String,
    pub released: bool,
}

#[near(contract_state)]
#[derive(PanicOnDefault)]
pub struct Escrow {
    token: AccountId,
    beneficiary: AccountId,
    next_id: u64,
    subs: LookupMap<u64, Subscription>,
}

#[near]
impl Escrow {
    #[init]
    pub fn new(token: AccountId, beneficiary: AccountId) -> Self {
        Self { token, beneficiary, next_id: 0, subs: LookupMap::new(b"s") }
    }

    /// NEP-141 receiver: record a subscription deposit. Wrong token => refund everything.
    pub fn ft_on_transfer(&mut self, sender_id: AccountId, amount: U128, msg: String) -> PromiseOrValue<U128> {
        if env::predecessor_account_id() != self.token {
            return PromiseOrValue::Value(amount);
        }
        let id = self.next_id;
        self.next_id += 1;
        self.subs.insert(id, Subscription { subscriber: sender_id.clone(), amount, msg, released: false });
        env::log_str(&format!(
            r#"EVENT_JSON:{{"standard":"pandem","version":"0.1.0","event":"subscribed","data":[{{"id":{id},"subscriber":"{sender_id}","amount":"{}"}}]}}"#,
            amount.0
        ));
        PromiseOrValue::Value(U128(0))
    }

    /// Release one subscription's deposit to the beneficiary (beneficiary-only in this spike).
    pub fn release(&mut self, id: u64) -> Promise {
        require!(env::predecessor_account_id() == self.beneficiary, "Not beneficiary");
        let token = self.token.clone();
        let beneficiary = self.beneficiary.clone();
        let sub = self.subs.get_mut(&id).expect("No such subscription");
        require!(!sub.released, "Already released");
        sub.released = true; // mutate before the async call; roll back in the callback on failure
        let amount = sub.amount;
        ext_ft::ext(token)
            .with_attached_deposit(NearToken::from_yoctonear(1))
            .with_static_gas(Gas::from_tgas(15))
            .ft_transfer(beneficiary, amount, Some(format!("pandem release {id}")))
            .then(Self::ext(env::current_account_id()).with_static_gas(Gas::from_tgas(10)).on_release(id))
    }

    #[private]
    pub fn on_release(&mut self, id: u64, #[callback_result] r: Result<(), PromiseError>) -> bool {
        if r.is_err() {
            if let Some(s) = self.subs.get_mut(&id) { s.released = false; }
            env::log_str("release failed, rolled back");
            return false;
        }
        true
    }

    pub fn get_subscription(&self, id: u64) -> Option<Subscription> { self.subs.get(&id).cloned() }
    pub fn get_config(&self) -> (AccountId, AccountId, u64) { (self.token.clone(), self.beneficiary.clone(), self.next_id) }
}
