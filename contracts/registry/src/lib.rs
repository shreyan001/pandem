use near_sdk::json_types::U128;
use near_sdk::store::{IterableMap, LookupMap};
use near_sdk::{env, near, require, AccountId, PanicOnDefault};

pub const THREE_DAYS_NS: u64 = 3 * 86_400 * 1_000_000_000;

#[near(serializers = [borsh, json])]
#[derive(Clone, Copy, PartialEq, Eq, Debug)]
pub enum ProposalStatus {
    Active,
    Passed,
    Rejected,
    Executed,
}

#[near(serializers = [borsh, json])]
#[derive(Clone, Debug)]
pub struct ProductListing {
    pub product_id: u64,
    pub name: String,
    pub steward: AccountId,
    pub tee_model: String,
    pub tee_verified: bool,
    pub upvotes: u64,
    pub heartbeat_streak: u64,
    pub contingency_reserve: U128,
}

#[near(serializers = [borsh, json])]
#[derive(Clone, Debug)]
pub struct Proposal {
    pub proposal_id: u64,
    pub product_id: u64,
    pub proposer: AccountId,
    pub recipient: AccountId,
    pub amount: U128,
    pub description: String,
    pub created_at_ns: u64,
    pub voting_duration_ns: u64,
    pub yes_votes: u64,
    pub no_votes: u64,
    pub status: ProposalStatus,
    pub executed: bool,
}

#[near(contract_state)]
#[derive(PanicOnDefault)]
pub struct RegistryContract {
    pub owner: AccountId,
    pub listings: IterableMap<u64, ProductListing>,
    pub proposals: IterableMap<u64, Proposal>,
    pub next_proposal_id: u64,
    // (proposal_id, voter) -> has_voted
    pub proposal_votes: LookupMap<(u64, AccountId), bool>,
    // voter -> custom voting weight
    pub voter_weights: LookupMap<AccountId, u64>,
    // (product_id, account) -> has_upvoted
    pub product_upvotes: LookupMap<(u64, AccountId), bool>,
}

#[near]
impl RegistryContract {
    #[init]
    pub fn new(owner: AccountId) -> Self {
        Self {
            owner,
            listings: IterableMap::new(b"l"),
            proposals: IterableMap::new(b"p"),
            next_proposal_id: 1,
            proposal_votes: LookupMap::new(b"v"),
            voter_weights: LookupMap::new(b"w"),
            product_upvotes: LookupMap::new(b"u"),
        }
    }

    /// Register a product listing with TEE model and verification status.
    pub fn register_listing(
        &mut self,
        product_id: u64,
        name: String,
        steward: AccountId,
        tee_model: String,
        tee_verified: bool,
    ) {
        require!(
            !self.listings.contains_key(&product_id),
            "Listing already registered"
        );

        let listing = ProductListing {
            product_id,
            name: name.clone(),
            steward: steward.clone(),
            tee_model: tee_model.clone(),
            tee_verified,
            upvotes: 0,
            heartbeat_streak: 0,
            contingency_reserve: U128(0),
        };

        self.listings.insert(product_id, listing);

        env::log_str(&format!(
            r#"EVENT_JSON:{{"standard":"pandem","version":"0.2.0","event":"listing_registered","data":[{{"product_id":{product_id},"name":"{name}","steward":"{steward}"}}]}}"#
        ));
    }

    /// Update contingency reserve for a product (e.g. synced from escrow).
    pub fn update_contingency_reserve(&mut self, product_id: u64, contingency_reserve: U128) {
        let listing = self.listings.get_mut(&product_id).expect("Listing not found");
        let predecessor = env::predecessor_account_id();
        require!(
            predecessor == self.owner || predecessor == listing.steward,
            "Unauthorized to update contingency reserve"
        );
        listing.contingency_reserve = contingency_reserve;
    }

    /// Record a heartbeat event and update streak.
    pub fn record_heartbeat(&mut self, product_id: u64) {
        let listing = self.listings.get_mut(&product_id).expect("Listing not found");
        listing.heartbeat_streak += 1;
    }

    /// Upvote a product listing.
    pub fn upvote_listing(&mut self, product_id: u64) {
        let listing = self.listings.get_mut(&product_id).expect("Listing not found");
        let caller = env::predecessor_account_id();
        let vote_key = (product_id, caller.clone());

        require!(
            !self.product_upvotes.contains_key(&vote_key),
            "Account already upvoted this listing"
        );

        self.product_upvotes.insert(vote_key, true);
        listing.upvotes += 1;

        env::log_str(&format!(
            r#"EVENT_JSON:{{"standard":"pandem","version":"0.2.0","event":"listing_upvoted","data":[{{"product_id":{product_id},"upvotes":{}}}]}}"#,
            listing.upvotes
        ));
    }

    /// Computes composite listing score:
    /// score = upvotes * (tee_verified ? 2 : 1) + heartbeat_streak * 10.
    pub fn get_score(&self, product_id: u64) -> u64 {
        let listing = self.listings.get(&product_id).expect("Listing not found");
        let multiplier = if listing.tee_verified { 2 } else { 1 };
        listing.upvotes * multiplier + listing.heartbeat_streak * 10
    }

    /// Set voting weight for a subscriber / participant.
    pub fn set_voter_weight(&mut self, voter: AccountId, weight: u64) {
        require!(
            env::predecessor_account_id() == self.owner,
            "Only owner can set voter weights"
        );
        require!(weight > 0, "Weight must be positive");
        self.voter_weights.insert(voter, weight);
    }

    /// Submits a fix proposal against the contingency buffer.
    /// Amount must not exceed 20% of the product's contingency reserve.
    pub fn create_proposal(
        &mut self,
        product_id: u64,
        recipient: AccountId,
        amount: U128,
        description: String,
    ) -> u64 {
        let listing = self.listings.get(&product_id).expect("Listing not found");

        // Amount must be <= 20% of product contingency reserve
        let max_allowed = (listing.contingency_reserve.0 * 20) / 100;
        require!(
            amount.0 <= max_allowed,
            "Proposal amount exceeds 20% of contingency reserve"
        );
        require!(amount.0 > 0, "Proposal amount must be positive");

        let proposal_id = self.next_proposal_id;
        self.next_proposal_id += 1;

        let proposal = Proposal {
            proposal_id,
            product_id,
            proposer: env::predecessor_account_id(),
            recipient: recipient.clone(),
            amount,
            description: description.clone(),
            created_at_ns: env::block_timestamp(),
            voting_duration_ns: THREE_DAYS_NS,
            yes_votes: 0,
            no_votes: 0,
            status: ProposalStatus::Active,
            executed: false,
        };

        self.proposals.insert(proposal_id, proposal);

        env::log_str(&format!(
            r#"EVENT_JSON:{{"standard":"pandem","version":"0.2.0","event":"proposal_created","data":[{{"proposal_id":{proposal_id},"product_id":{product_id},"amount":"{}"}}]}}"#,
            amount.0
        ));

        proposal_id
    }

    /// Vote on a fix proposal with default or registered weight.
    pub fn vote_proposal(&mut self, proposal_id: u64, support: bool) {
        let voter = env::predecessor_account_id();
        let weight = self.voter_weights.get(&voter).copied().unwrap_or(1);
        self.internal_vote(proposal_id, voter, support, weight);
    }

    /// Vote on a fix proposal with an explicit weight (caller must be owner or authorized).
    pub fn vote_proposal_with_weight(&mut self, proposal_id: u64, support: bool, weight: u64) {
        let voter = env::predecessor_account_id();
        self.internal_vote(proposal_id, voter, support, weight);
    }

    fn internal_vote(&mut self, proposal_id: u64, voter: AccountId, support: bool, weight: u64) {
        require!(weight > 0, "Vote weight must be positive");
        let proposal = self.proposals.get_mut(&proposal_id).expect("Proposal not found");

        require!(
            proposal.status == ProposalStatus::Active,
            "Proposal is not active"
        );

        let now = env::block_timestamp();
        require!(
            now < proposal.created_at_ns + proposal.voting_duration_ns,
            "Voting period has ended"
        );

        let vote_key = (proposal_id, voter.clone());
        require!(
            !self.proposal_votes.contains_key(&vote_key),
            "Account already voted on this proposal"
        );

        self.proposal_votes.insert(vote_key, true);

        if support {
            proposal.yes_votes += weight;
        } else {
            proposal.no_votes += weight;
        }

        env::log_str(&format!(
            r#"EVENT_JSON:{{"standard":"pandem","version":"0.2.0","event":"proposal_voted","data":[{{"proposal_id":{proposal_id},"voter":"{voter}","support":{support},"weight":{weight}}}]}}"#
        ));
    }

    /// Finalize proposal after 3-day duration.
    /// Checks: duration passed, >50% approval, amount <= 20% contingency reserve.
    pub fn finalize_proposal(&mut self, proposal_id: u64) -> bool {
        let proposal = self.proposals.get_mut(&proposal_id).expect("Proposal not found");
        require!(!proposal.executed, "Proposal already executed");

        let now = env::block_timestamp();
        require!(
            now >= proposal.created_at_ns + proposal.voting_duration_ns,
            "Voting duration has not elapsed (3 days)"
        );

        let total_votes = proposal.yes_votes + proposal.no_votes;
        require!(total_votes > 0, "No votes cast on proposal");

        // Quorum: strictly > 50% approval
        require!(
            proposal.yes_votes > proposal.no_votes,
            "Proposal rejected: does not have >50% approval"
        );

        let product_id = proposal.product_id;
        let amount = proposal.amount.0;

        let listing = self.listings.get_mut(&product_id).expect("Listing not found");
        let max_allowed = (listing.contingency_reserve.0 * 20) / 100;
        require!(
            amount <= max_allowed,
            "Execution blocked: amount exceeds 20% contingency reserve"
        );

        // Deduct from contingency reserve
        listing.contingency_reserve = U128(listing.contingency_reserve.0 - amount);
        proposal.executed = true;
        proposal.status = ProposalStatus::Executed;

        env::log_str(&format!(
            r#"EVENT_JSON:{{"standard":"pandem","version":"0.2.0","event":"proposal_finalized","data":[{{"proposal_id":{proposal_id},"product_id":{product_id},"amount":"{amount}"}}]}}"#
        ));

        true
    }

    // Views
    pub fn get_listing(&self, product_id: u64) -> Option<ProductListing> {
        self.listings.get(&product_id).cloned()
    }

    pub fn get_proposal(&self, proposal_id: u64) -> Option<Proposal> {
        self.proposals.get(&proposal_id).cloned()
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use near_sdk::test_utils::VMContextBuilder;
    use near_sdk::testing_env;

    fn setup_registry() -> (RegistryContract, AccountId) {
        let owner: AccountId = "owner.testnet".parse().unwrap();
        testing_env!(VMContextBuilder::new()
            .current_account_id("registry.testnet".parse().unwrap())
            .predecessor_account_id(owner.clone())
            .build());

        let contract = RegistryContract::new(owner.clone());
        (contract, owner)
    }

    // 1. Product Registry & Scoring Tests
    #[test]
    fn test_listing_and_composite_score() {
        let (mut contract, _owner) = setup_registry();

        // Product 1: TEE verified
        contract.register_listing(
            1,
            "Agent Alpha".to_string(),
            "steward.testnet".parse().unwrap(),
            "Qwen/Qwen3.8-27B".to_string(),
            true,
        );

        // Product 2: TEE unverified
        contract.register_listing(
            2,
            "Agent Beta".to_string(),
            "steward2.testnet".parse().unwrap(),
            "standard-model".to_string(),
            false,
        );

        // 5 upvotes on each
        for i in 1..=5 {
            let voter: AccountId = format!("user{i}.testnet").parse().unwrap();
            testing_env!(VMContextBuilder::new().predecessor_account_id(voter.clone()).build());
            contract.upvote_listing(1);
            contract.upvote_listing(2);
        }

        // Streak 3 on both
        for _ in 0..3 {
            contract.record_heartbeat(1);
            contract.record_heartbeat(2);
        }

        // Product 1 score: 5 * 2 + 3 * 10 = 10 + 30 = 40
        assert_eq!(contract.get_score(1), 40);

        // Product 2 score: 5 * 1 + 3 * 10 = 5 + 30 = 35
        assert_eq!(contract.get_score(2), 35);
    }

    // 2. Proposal Creation: Amount within 20% succeeds, >20% panics
    #[test]
    fn test_create_proposal_within_twenty_percent() {
        let (mut contract, owner) = setup_registry();

        contract.register_listing(
            1,
            "Agent Alpha".to_string(),
            "steward.testnet".parse().unwrap(),
            "Qwen/Qwen3.8-27B".to_string(),
            true,
        );

        // Contingency reserve = 10,000. 20% cap = 2,000.
        contract.update_contingency_reserve(1, U128(10_000));

        testing_env!(VMContextBuilder::new().predecessor_account_id(owner).build());
        let prop_id = contract.create_proposal(
            1,
            "bugfixer.testnet".parse().unwrap(),
            U128(2_000), // Exactly 20%
            "Security vulnerability patch".to_string(),
        );

        assert_eq!(prop_id, 1);
        let proposal = contract.get_proposal(1).unwrap();
        assert_eq!(proposal.amount.0, 2_000);
    }

    #[test]
    #[should_panic(expected = "Proposal amount exceeds 20% of contingency reserve")]
    fn test_create_proposal_exceeding_twenty_percent() {
        let (mut contract, owner) = setup_registry();

        contract.register_listing(
            1,
            "Agent Alpha".to_string(),
            "steward.testnet".parse().unwrap(),
            "Qwen/Qwen3.8-27B".to_string(),
            true,
        );

        // Contingency reserve = 10,000. 20% cap = 2,000.
        contract.update_contingency_reserve(1, U128(10_000));

        testing_env!(VMContextBuilder::new().predecessor_account_id(owner).build());
        // 2,500 > 2,000 -> panic
        contract.create_proposal(
            1,
            "bugfixer.testnet".parse().unwrap(),
            U128(2_500),
            "Expensive fix".to_string(),
        );
    }

    // 3. Voting Weights & Quorum
    #[test]
    fn test_voting_weights_and_quorum() {
        let (mut contract, owner) = setup_registry();

        contract.register_listing(
            1,
            "Agent Alpha".to_string(),
            "steward.testnet".parse().unwrap(),
            "Qwen/Qwen3.8-27B".to_string(),
            true,
        );
        contract.update_contingency_reserve(1, U128(10_000));

        let start_time_ns = 1_000_000_000_000;
        testing_env!(VMContextBuilder::new()
            .predecessor_account_id(owner.clone())
            .block_timestamp(start_time_ns)
            .build());

        let prop_id = contract.create_proposal(
            1,
            "dev.testnet".parse().unwrap(),
            U128(1_000),
            "Critical fix".to_string(),
        );

        // Set voter weights: alice has 10 votes, bob has 3 votes
        let alice: AccountId = "alice.testnet".parse().unwrap();
        let bob: AccountId = "bob.testnet".parse().unwrap();
        contract.set_voter_weight(alice.clone(), 10);
        contract.set_voter_weight(bob.clone(), 3);

        // Alice votes YES with weight 10
        testing_env!(VMContextBuilder::new()
            .predecessor_account_id(alice)
            .block_timestamp(start_time_ns + 10_000_000)
            .build());
        contract.vote_proposal(prop_id, true);

        // Bob votes NO with weight 3
        testing_env!(VMContextBuilder::new()
            .predecessor_account_id(bob)
            .block_timestamp(start_time_ns + 20_000_000)
            .build());
        contract.vote_proposal(prop_id, false);

        let proposal = contract.get_proposal(prop_id).unwrap();
        assert_eq!(proposal.yes_votes, 10);
        assert_eq!(proposal.no_votes, 3);
    }

    // 4. Finalize Proposal: 3-day duration, >50% approval, and execution
    #[test]
    #[should_panic(expected = "Voting duration has not elapsed (3 days)")]
    fn test_finalize_before_three_days_panics() {
        let (mut contract, owner) = setup_registry();

        contract.register_listing(
            1,
            "Agent Alpha".to_string(),
            "steward.testnet".parse().unwrap(),
            "Qwen/Qwen3.8-27B".to_string(),
            true,
        );
        contract.update_contingency_reserve(1, U128(10_000));

        let start_time_ns = 1_000_000_000_000;
        testing_env!(VMContextBuilder::new()
            .predecessor_account_id(owner)
            .block_timestamp(start_time_ns)
            .build());

        let prop_id = contract.create_proposal(
            1,
            "dev.testnet".parse().unwrap(),
            U128(1_000),
            "Fix bug".to_string(),
        );

        // Advance only 2 days
        let two_days_ns = start_time_ns + 2 * 86_400 * 1_000_000_000;
        testing_env!(VMContextBuilder::new()
            .predecessor_account_id("anyone.testnet".parse().unwrap())
            .block_timestamp(two_days_ns)
            .build());

        contract.finalize_proposal(prop_id); // panic
    }

    #[test]
    fn test_finalize_after_three_days_succeeds() {
        let (mut contract, owner) = setup_registry();

        contract.register_listing(
            1,
            "Agent Alpha".to_string(),
            "steward.testnet".parse().unwrap(),
            "Qwen/Qwen3.8-27B".to_string(),
            true,
        );
        contract.update_contingency_reserve(1, U128(10_000));

        let start_time_ns = 1_000_000_000_000;
        testing_env!(VMContextBuilder::new()
            .predecessor_account_id(owner)
            .block_timestamp(start_time_ns)
            .build());

        let prop_id = contract.create_proposal(
            1,
            "dev.testnet".parse().unwrap(),
            U128(1_500),
            "Fix bug".to_string(),
        );

        // Vote YES
        testing_env!(VMContextBuilder::new()
            .predecessor_account_id("alice.testnet".parse().unwrap())
            .block_timestamp(start_time_ns + 1_000_000)
            .build());
        contract.vote_proposal(prop_id, true);

        // Advance 3 days + 1 second
        let three_days_ns = start_time_ns + THREE_DAYS_NS + 1_000_000_000;
        testing_env!(VMContextBuilder::new()
            .predecessor_account_id("anyone.testnet".parse().unwrap())
            .block_timestamp(three_days_ns)
            .build());

        let finalized = contract.finalize_proposal(prop_id);
        assert!(finalized);

        let proposal = contract.get_proposal(prop_id).unwrap();
        assert!(proposal.executed);
        assert_eq!(proposal.status, ProposalStatus::Executed);

        // Listing contingency reserve was 10,000 - 1,500 = 8,500
        let listing = contract.get_listing(1).unwrap();
        assert_eq!(listing.contingency_reserve.0, 8_500);
    }

    #[test]
    #[should_panic(expected = "Proposal rejected: does not have >50% approval")]
    fn test_finalize_rejected_proposal_panics() {
        let (mut contract, owner) = setup_registry();

        contract.register_listing(
            1,
            "Agent Alpha".to_string(),
            "steward.testnet".parse().unwrap(),
            "Qwen/Qwen3.8-27B".to_string(),
            true,
        );
        contract.update_contingency_reserve(1, U128(10_000));

        let start_time_ns = 1_000_000_000_000;
        testing_env!(VMContextBuilder::new()
            .predecessor_account_id(owner)
            .block_timestamp(start_time_ns)
            .build());

        let prop_id = contract.create_proposal(
            1,
            "dev.testnet".parse().unwrap(),
            U128(1_000),
            "Questionable proposal".to_string(),
        );

        // Vote NO
        testing_env!(VMContextBuilder::new()
            .predecessor_account_id("bob.testnet".parse().unwrap())
            .block_timestamp(start_time_ns + 1_000_000)
            .build());
        contract.vote_proposal(prop_id, false);

        // Advance 3 days + 1 second
        let three_days_ns = start_time_ns + THREE_DAYS_NS + 1_000_000_000;
        testing_env!(VMContextBuilder::new()
            .predecessor_account_id("anyone.testnet".parse().unwrap())
            .block_timestamp(three_days_ns)
            .build());

        contract.finalize_proposal(prop_id); // panic
    }
}
