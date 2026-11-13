# Stillworks Solidity → Pandem Rust contracts

**TL;DR:** Each Solidity function maps to one Rust method on a NEAR contract. Stage 1 puts everything marked S1 into `contracts/escrow`, and later stages split the rest into `budget`, `agent-wallet` and `registry`. The rules stay identical (the split, health, refund formula). Only the platform mechanics change: NEP-141 instead of ERC-20, async promises with rollback callbacks, ns timestamps. There is one deliberate fix, the D-14 period offset.

Source: `context/stillworks/contracts/*.sol` (shreyan001/stillworks@7fc916c). Rust reference: `context/near/spike-rs/src/lib.rs`.

## A. Mechanics
| Solidity | NEAR Rust (near-sdk 5.30.1) |
|---|---|
| `address` | `AccountId` |
| `uint256` amounts | `u128` inside the contract, `U128` in JSON |
| `block.timestamp` (s) | `env::block_timestamp()` (ns) |
| `msg.sender` | `env::predecessor_account_id()` |
| ERC-20 `transferFrom` into the escrow | the payer calls `ft_transfer_call` → `ft_on_transfer`. Check `predecessor == token_id`, and return the unused amount |
| `usdt.transfer(to,x)` | `ext_ft::ext(token).with_attached_deposit(1 yocto).ft_transfer(..)`, then a `#[private]` callback that rolls back on failure |
| `nonReentrant` | mutate state before the promise and roll it back in the callback |
| `modifier onlyX` / `require` | `require!(cond, "Same error name")` |
| `event` | NEP-297 `EVENT_JSON:` log |
| `mapping` | `near_sdk::store::{LookupMap, IterableMap}` |
| `keccak256` agreement id | `u64` counter |
| contract → contract call | an async promise and callback. It is not atomic, so design for partial failure |

## B. Function map
| Solidity function | Rust method (contract) | Stage |
|---|---|---|
| ProductRegistry.register | `escrow.register_product` | S1 |
| ProductRegistry.approvePassport | `escrow.approve_product` | S1 |
| ProductRegistry.proposePassport | `registry.propose_passport` | S4 |
| ProductRegistry.heartbeat / Hub.recordHeartbeat | `escrow.heartbeat` (signer only, period increases) | S1 |
| Hub._evaluateHealth / getProductHealth | `escrow.get_health` (view, derived from `last_heartbeat_ns`) | S1 |
| Hub.performHourlyUpkeep | not needed: health is computed lazily. The agent's runner calls `release_period` / `claim_refund` | S1 |
| Hub.receiveServiceFee / withdrawProtocolFees | `protocol_fees` ledger + `escrow.withdraw_fees` → treasury | S1 |
| Hub.replenishInferenceQuota / releaseOpsReserveForInference | `budget.draw_for_inference` → `agent-wallet` | S2/S3 |
| Hub.submitSuccessionProposal / voteOnProposal / executeSuccession | `registry.*_succession` | S4 |
| SubscriptionAgreement.create | inside `escrow.ft_on_transfer` (SubscribeMsg) | S1 |
| SubscriptionAgreement.cancel | `escrow.cancel_agreement` | S2 |
| SubscriptionAgreement.requestWalkaway / updateWalkawayRoot | `escrow.request_walkaway` / `update_walkaway_root` (events) | S2 |
| SubscriptionEscrow.fund | `escrow.ft_on_transfer` (`amount ≥ price×periods`, returns the excess) | S1 |
| SubscriptionEscrow.releasePeriod / release / _release | `escrow.release_period` (sequential, D-14 check, split, `ft_transfer` + callback) | S1 |
| SubscriptionEscrow.claimRefund / isRefundClaimable | `escrow.claim_refund` / `is_refund_claimable` | S1 |
| StewardshipEscrowPayments.subscribe (split) | split applied per released period in `release_period` | S1 |
| StewardshipEscrowPayments.declareAbandoned | `escrow.declare_abandoned` (killswitch) | S1 |
| StewardshipEscrowPayments.claimContingencyAndRefund | inside `escrow.claim_refund` when Abandoned | S1 |
| StewardshipEscrowPayments.transferStewardship | `escrow.transfer_stewardship` | S1 (if time) |
| StewardshipEscrowPayments.releaseReviewFunds (7-day lock) | `budget.release_review_funds` | S2 |
| StewardshipEscrowPayments.claimOpsReserve | `budget.claim_ops` | S2 |
| InvoiceRegistry.mint / getInvoice | a `released` event, plus an invoice record in `escrow` | S1 (event), S2 (record) |
| ProductHealthReceiver.onReport | `registry.report_health` | S4 |
| WaterfallContingencyHub.submitFixProposal / vote / execute | `registry.*_fix_proposal` | S4 |
| MockUSDT | an existing testnet NEP-141 (S1-1), or a mock FT in tests | S1 |

## C. Behaviour to test (Rust unit tests in `contracts/escrow`)
1. `ft_on_transfer` from the wrong token returns the full amount, an invalid msg returns the full amount, and an overpayment returns the excess.
2. Release is sequential and blocked without a heartbeat for `start_product_period + p − 1` (D-14).
3. Split: `fee = cost×250/10000`, `ops = cost×30/100`, `contingency = cost×20/100`, `steward = remainder`.
4. A refund is possible only after `start + next×period + grace` with the heartbeat missing, or when Abandoned. Amount = unreleased × price (+ contingency share when Abandoned). Only once.
5. A heartbeat period must strictly increase and can't revive an Abandoned product.
6. The callback rolls back `released` / `refunded` when `ft_transfer` fails.
