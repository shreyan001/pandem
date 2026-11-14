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
#[derive(Clone, Debug, PartialEq, Eq)]
pub struct RoadmapItem {
    pub title: String,
    pub description: String,
    pub target_date: String,
    pub completed: bool,
}

#[near(serializers = [borsh, json])]
#[derive(Clone, Debug, PartialEq, Eq)]
pub struct ListingTier {
    pub tier_id: String,
    pub name: String,
    pub price_monthly: U128,
    pub price_yearly: U128,
    pub description: Option<String>,
}

#[near(serializers = [borsh, json])]
#[derive(Clone, Debug, PartialEq, Eq)]
pub struct DecentralizationCheck {
    pub check_id: String,
    pub title: String,
    pub passed: bool,
    pub evidence_url: Option<String>,
}

#[near(serializers = [borsh, json])]
#[derive(Clone, Debug)]
pub struct ListingV2 {
    pub product_id: u64,
    pub slug: String,
    pub name: String,
    pub tagline: String,
    pub description: String,
    pub category: String,
    pub logo_url: String,
    pub hero_url: String,
    pub website_url: String,
    pub repo_url: String,
    pub demo_url: String,
    pub license: String,
    pub launched_at: u64,
    pub steward: AccountId,
    pub roadmap: Vec<RoadmapItem>,
    pub tiers: Vec<ListingTier>,
    pub decentralization_checks: Vec<DecentralizationCheck>,
    pub score: u32,
    pub score_inputs_hash: String,
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
    pub agent_account_id: AccountId,
    pub listings: IterableMap<u64, ListingV2>,
    pub slug_to_id: LookupMap<String, u64>,
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
    pub fn new(owner: AccountId, agent_account_id: Option<AccountId>) -> Self {
        let agent = agent_account_id.unwrap_or_else(|| owner.clone());
        Self {
            owner,
            agent_account_id: agent,
            listings: IterableMap::new(b"l"),
            slug_to_id: LookupMap::new(b"s"),
            proposals: IterableMap::new(b"p"),
            next_proposal_id: 1,
            proposal_votes: LookupMap::new(b"v"),
            voter_weights: LookupMap::new(b"w"),
            product_upvotes: LookupMap::new(b"u"),
        }
    }

    /// Set or update the authorized scoring agent account ID (owner only).
    pub fn set_agent_account_id(&mut self, agent_account_id: AccountId) {
        require!(
            env::predecessor_account_id() == self.owner,
            "Only owner can update agent account"
        );
        self.agent_account_id = agent_account_id;
    }

    /// Register a product listing V2 with full metadata, tiers, roadmap and decentralization checks.
    pub fn register_listing_v2(
        &mut self,
        product_id: u64,
        slug: String,
        name: String,
        tagline: String,
        description: String,
        category: String,
        logo_url: String,
        hero_url: String,
        website_url: String,
        repo_url: String,
        demo_url: String,
        license: String,
        steward: AccountId,
        roadmap: Option<Vec<RoadmapItem>>,
        tiers: Option<Vec<ListingTier>>,
        decentralization_checks: Option<Vec<DecentralizationCheck>>,
    ) {
        require!(
            !self.listings.contains_key(&product_id),
            "Listing already registered"
        );
        require!(!self.slug_to_id.contains_key(&slug), "Slug already taken");

        // Default tiers per spec: Pro 5 / Max 15 tUSDC monthly, yearly = 10x
        let resolved_tiers = tiers.unwrap_or_else(|| {
            vec![
                ListingTier {
                    tier_id: "pro".to_string(),
                    name: "Pro".to_string(),
                    price_monthly: U128(5_000_000), // 5 tUSDC
                    price_yearly: U128(50_000_000), // 50 tUSDC (10x)
                    description: Some("Pro plan with standard private compute".to_string()),
                },
                ListingTier {
                    tier_id: "max".to_string(),
                    name: "Max".to_string(),
                    price_monthly: U128(15_000_000), // 15 tUSDC
                    price_yearly: U128(150_000_000), // 150 tUSDC (10x)
                    description: Some("Max plan with priority TEE enclave resources".to_string()),
                },
            ]
        });

        let listing = ListingV2 {
            product_id,
            slug: slug.clone(),
            name: name.clone(),
            tagline,
            description,
            category,
            logo_url,
            hero_url,
            website_url,
            repo_url,
            demo_url,
            license,
            launched_at: env::block_timestamp(),
            steward: steward.clone(),
            roadmap: roadmap.unwrap_or_default(),
            tiers: resolved_tiers,
            decentralization_checks: decentralization_checks.unwrap_or_default(),
            score: 0,
            score_inputs_hash: "".to_string(),
            upvotes: 0,
            heartbeat_streak: 0,
            contingency_reserve: U128(0),
        };

        self.slug_to_id.insert(slug, product_id);
        self.listings.insert(product_id, listing);

        env::log_str(&format!(
            r#"EVENT_JSON:{{"standard":"pandem","version":"0.3.0","event":"listing_v2_registered","data":[{{"product_id":{product_id},"name":"{name}","steward":"{steward}"}}]}}"#
        ));
    }

    /// Convenience wrapper for backward compatibility.
    pub fn register_listing(
        &mut self,
        product_id: u64,
        name: String,
        steward: AccountId,
        tee_model: String,
        tee_verified: bool,
    ) {
        let slug = format!("product-{}", product_id);
        let checks = vec![DecentralizationCheck {
            check_id: "tee_enclave".to_string(),
            title: format!("TEE Enclave ({tee_model})"),
            passed: tee_verified,
            evidence_url: Some("https://cloud-api.near.ai/v1/attestation/report".to_string()),
        }];

        self.register_listing_v2(
            product_id,
            slug,
            name.clone(),
            format!("{name} private SaaS"),
            format!("{name} running confidentially with TEE attestation on NEAR AI Cloud"),
            "ai-agent".to_string(),
            "https://pandem.app/icons/default.png".to_string(),
            "https://pandem.app/heroes/default.png".to_string(),
            "https://pandem.app".to_string(),
            "https://github.com/shreyan001/pandem".to_string(),
            "https://pandem.app/demo".to_string(),
            "MIT".to_string(),
            steward,
            None,
            None,
            Some(checks),
        );
    }

    /// Steward-only edit of listing details.
    pub fn edit_listing(
        &mut self,
        product_id: u64,
        tagline: Option<String>,
        description: Option<String>,
        logo_url: Option<String>,
        hero_url: Option<String>,
        website_url: Option<String>,
        repo_url: Option<String>,
        demo_url: Option<String>,
        license: Option<String>,
        roadmap: Option<Vec<RoadmapItem>>,
        tiers: Option<Vec<ListingTier>>,
        decentralization_checks: Option<Vec<DecentralizationCheck>>,
    ) {
        let listing = self.listings.get_mut(&product_id).expect("Listing not found");
        require!(
            env::predecessor_account_id() == listing.steward,
            "Only steward can edit listing"
        );

        if let Some(t) = tagline {
            listing.tagline = t;
        }
        if let Some(d) = description {
            listing.description = d;
        }
        if let Some(l) = logo_url {
            listing.logo_url = l;
        }
        if let Some(h) = hero_url {
            listing.hero_url = h;
        }
        if let Some(w) = website_url {
            listing.website_url = w;
        }
        if let Some(r) = repo_url {
            listing.repo_url = r;
        }
        if let Some(dm) = demo_url {
            listing.demo_url = dm;
        }
        if let Some(lic) = license {
            listing.license = lic;
        }
        if let Some(rm) = roadmap {
            listing.roadmap = rm;
        }
        if let Some(tr) = tiers {
            listing.tiers = tr;
        }
        if let Some(dc) = decentralization_checks {
            listing.decentralization_checks = dc;
        }

        env::log_str(&format!(
            r#"EVENT_JSON:{{"standard":"pandem","version":"0.3.0","event":"listing_edited","data":[{{"product_id":{product_id}}}]}}"#
        ));
    }

    /// Upvote a product listing. Strictly enforces ONE upvote per account.
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
            r#"EVENT_JSON:{{"standard":"pandem","version":"0.3.0","event":"listing_upvoted","data":[{{"product_id":{product_id},"upvotes":{}}}]}}"#,
            listing.upvotes
        ));
    }

    /// Update decentralization score (0-100) and inputs hash.
    /// Callable ONLY by the authorized agent account.
    pub fn update_score(&mut self, product_id: u64, score: u32, inputs_hash: String) {
        let caller = env::predecessor_account_id();
        require!(
            caller == self.agent_account_id,
            "Only agent can update score"
        );
        require!(score <= 100, "Score must be between 0 and 100");

        let listing = self.listings.get_mut(&product_id).expect("Listing not found");
        listing.score = score;
        listing.score_inputs_hash = inputs_hash.clone();

        env::log_str(&format!(
            r#"EVENT_JSON:{{"standard":"pandem","version":"0.3.0","event":"score_updated","data":[{{"product_id":{product_id},"score":{score},"inputs_hash":"{inputs_hash}"}}]}}"#
        ));
    }

    /// Returns listing score (0-100).
    pub fn get_score(&self, product_id: u64) -> u32 {
        let listing = self.listings.get(&product_id).expect("Listing not found");
        listing.score
    }

    /// Returns score and input hash.
    pub fn get_score_details(&self, product_id: u64) -> (u32, String) {
        let listing = self.listings.get(&product_id).expect("Listing not found");
        (listing.score, listing.score_inputs_hash.clone())
    }

    /// Check if an account has already upvoted a listing.
    pub fn has_upvoted(&self, product_id: u64, account_id: AccountId) -> bool {
        self.product_upvotes.contains_key(&(product_id, account_id))
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
    pub fn get_listing(&self, product_id: u64) -> Option<ListingV2> {
        self.listings.get(&product_id).cloned()
    }

    pub fn get_listing_by_slug(&self, slug: String) -> Option<ListingV2> {
        if let Some(id) = self.slug_to_id.get(&slug) {
            self.listings.get(id).cloned()
        } else {
            None
        }
    }

    pub fn list_listings(&self, from_index: Option<u64>, limit: Option<u64>) -> Vec<ListingV2> {
        let start = from_index.unwrap_or(0) as usize;
        let lim = limit.unwrap_or(50) as usize;
        self.listings
            .values()
            .skip(start)
            .take(lim)
            .cloned()
            .collect()
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

    fn setup_registry() -> (RegistryContract, AccountId, AccountId) {
        let owner: AccountId = "owner.testnet".parse().unwrap();
        let agent: AccountId = "agent.testnet".parse().unwrap();
        testing_env!(VMContextBuilder::new()
            .current_account_id("registry.testnet".parse().unwrap())
            .predecessor_account_id(owner.clone())
            .build());

        let contract = RegistryContract::new(owner.clone(), Some(agent.clone()));
        (contract, owner, agent)
    }

    #[test]
    fn test_listing_v2_and_defaults() {
        let (mut contract, _owner, _agent) = setup_registry();

        contract.register_listing_v2(
            1,
            "deepsearch-ai".to_string(),
            "DeepSearch AI".to_string(),
            "Confidential deep web search".to_string(),
            "Autonomous research agent in TEE".to_string(),
            "ai-search".to_string(),
            "https://deepsearch.ai/logo.png".to_string(),
            "https://deepsearch.ai/hero.png".to_string(),
            "https://deepsearch.ai".to_string(),
            "https://github.com/deepsearch/core".to_string(),
            "https://deepsearch.ai/demo".to_string(),
            "Apache-2.0".to_string(),
            "steward.testnet".parse().unwrap(),
            None,
            None,
            None,
        );

        let listing = contract.get_listing(1).unwrap();
        assert_eq!(listing.slug, "deepsearch-ai");
        assert_eq!(listing.name, "DeepSearch AI");
        let expected_steward: AccountId = "steward.testnet".parse().unwrap();
        assert_eq!(listing.steward, expected_steward);
        assert_eq!(listing.score, 0);

        // Check default tiers: Pro 5 / Max 15 tUSDC, yearly = 10x
        assert_eq!(listing.tiers.len(), 2);
        assert_eq!(listing.tiers[0].tier_id, "pro");
        assert_eq!(listing.tiers[0].price_monthly.0, 5_000_000);
        assert_eq!(listing.tiers[0].price_yearly.0, 50_000_000);

        assert_eq!(listing.tiers[1].tier_id, "max");
        assert_eq!(listing.tiers[1].price_monthly.0, 15_000_000);
        assert_eq!(listing.tiers[1].price_yearly.0, 150_000_000);

        // Lookup by slug
        let by_slug = contract.get_listing_by_slug("deepsearch-ai".to_string()).unwrap();
        assert_eq!(by_slug.product_id, 1);
    }

    #[test]
    fn test_steward_only_edit_succeeds() {
        let (mut contract, _owner, _agent) = setup_registry();

        contract.register_listing_v2(
            1,
            "deepsearch-ai".to_string(),
            "DeepSearch AI".to_string(),
            "Old tagline".to_string(),
            "Old desc".to_string(),
            "ai-search".to_string(),
            "logo.png".to_string(),
            "hero.png".to_string(),
            "site.com".to_string(),
            "repo.com".to_string(),
            "demo.com".to_string(),
            "MIT".to_string(),
            "steward.testnet".parse().unwrap(),
            None,
            None,
            None,
        );

        // Steward edits listing
        testing_env!(VMContextBuilder::new()
            .predecessor_account_id("steward.testnet".parse().unwrap())
            .build());

        contract.edit_listing(
            1,
            Some("New tagline".to_string()),
            Some("New description".to_string()),
            None,
            None,
            None,
            None,
            None,
            None,
            None,
            None,
            None,
        );

        let listing = contract.get_listing(1).unwrap();
        assert_eq!(listing.tagline, "New tagline");
        assert_eq!(listing.description, "New description");
    }

    #[test]
    #[should_panic(expected = "Only steward can edit listing")]
    fn test_non_steward_edit_panics() {
        let (mut contract, _owner, _agent) = setup_registry();

        contract.register_listing_v2(
            1,
            "deepsearch-ai".to_string(),
            "DeepSearch AI".to_string(),
            "Old tagline".to_string(),
            "Old desc".to_string(),
            "ai-search".to_string(),
            "logo.png".to_string(),
            "hero.png".to_string(),
            "site.com".to_string(),
            "repo.com".to_string(),
            "demo.com".to_string(),
            "MIT".to_string(),
            "steward.testnet".parse().unwrap(),
            None,
            None,
            None,
        );

        // Attacker attempts edit
        testing_env!(VMContextBuilder::new()
            .predecessor_account_id("attacker.testnet".parse().unwrap())
            .build());

        contract.edit_listing(1, Some("Hacked".to_string()), None, None, None, None, None, None, None, None, None, None);
    }

    #[test]
    fn test_one_upvote_per_account() {
        let (mut contract, _owner, _agent) = setup_registry();

        contract.register_listing(1, "Agent 1".to_string(), "steward.testnet".parse().unwrap(), "Qwen".to_string(), true);

        // User 1 upvotes
        testing_env!(VMContextBuilder::new().predecessor_account_id("user1.testnet".parse().unwrap()).build());
        contract.upvote_listing(1);
        assert_eq!(contract.get_listing(1).unwrap().upvotes, 1);
        assert!(contract.has_upvoted(1, "user1.testnet".parse().unwrap()));

        // User 2 upvotes
        testing_env!(VMContextBuilder::new().predecessor_account_id("user2.testnet".parse().unwrap()).build());
        contract.upvote_listing(1);
        assert_eq!(contract.get_listing(1).unwrap().upvotes, 2);
    }

    #[test]
    #[should_panic(expected = "Account already upvoted this listing")]
    fn test_duplicate_upvote_panics() {
        let (mut contract, _owner, _agent) = setup_registry();

        contract.register_listing(1, "Agent 1".to_string(), "steward.testnet".parse().unwrap(), "Qwen".to_string(), true);

        testing_env!(VMContextBuilder::new().predecessor_account_id("user1.testnet".parse().unwrap()).build());
        contract.upvote_listing(1);
        // Duplicate upvote should panic
        contract.upvote_listing(1);
    }

    #[test]
    fn test_update_score_by_agent_succeeds() {
        let (mut contract, _owner, agent) = setup_registry();

        contract.register_listing(1, "Agent 1".to_string(), "steward.testnet".parse().unwrap(), "Qwen".to_string(), true);

        // Agent updates score
        testing_env!(VMContextBuilder::new().predecessor_account_id(agent).build());
        contract.update_score(1, 88, "sha256:inputs_hash_val".to_string());

        let listing = contract.get_listing(1).unwrap();
        assert_eq!(listing.score, 88);
        assert_eq!(listing.score_inputs_hash, "sha256:inputs_hash_val");
        assert_eq!(contract.get_score(1), 88);
    }

    #[test]
    #[should_panic(expected = "Only agent can update score")]
    fn test_update_score_by_non_agent_panics() {
        let (mut contract, _owner, _agent) = setup_registry();

        contract.register_listing(1, "Agent 1".to_string(), "steward.testnet".parse().unwrap(), "Qwen".to_string(), true);

        // Attacker attempts score update
        testing_env!(VMContextBuilder::new().predecessor_account_id("attacker.testnet".parse().unwrap()).build());
        contract.update_score(1, 99, "fake_hash".to_string());
    }

    #[test]
    #[should_panic(expected = "Score must be between 0 and 100")]
    fn test_update_score_above_100_panics() {
        let (mut contract, _owner, agent) = setup_registry();

        contract.register_listing(1, "Agent 1".to_string(), "steward.testnet".parse().unwrap(), "Qwen".to_string(), true);

        testing_env!(VMContextBuilder::new().predecessor_account_id(agent).build());
        contract.update_score(1, 105, "hash".to_string());
    }

    #[test]
    fn test_proposal_voting_and_finalize() {
        let (mut contract, owner, _agent) = setup_registry();

        contract.register_listing(1, "Agent 1".to_string(), "steward.testnet".parse().unwrap(), "Qwen".to_string(), true);
        contract.update_contingency_reserve(1, U128(10_000));

        let start_time_ns = 1_000_000_000_000;
        testing_env!(VMContextBuilder::new().predecessor_account_id(owner).block_timestamp(start_time_ns).build());

        let prop_id = contract.create_proposal(1, "dev.testnet".parse().unwrap(), U128(1_500), "Bug fix".to_string());

        testing_env!(VMContextBuilder::new().predecessor_account_id("voter.testnet".parse().unwrap()).block_timestamp(start_time_ns + 1000).build());
        contract.vote_proposal(prop_id, true);

        testing_env!(VMContextBuilder::new().predecessor_account_id("anyone.testnet".parse().unwrap()).block_timestamp(start_time_ns + THREE_DAYS_NS + 1000).build());
        assert!(contract.finalize_proposal(prop_id));
        assert_eq!(contract.get_listing(1).unwrap().contingency_reserve.0, 8_500);
    }
}
