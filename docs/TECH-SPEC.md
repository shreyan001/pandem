# Technical spec

**TL;DR:** `contracts/` is a Cargo workspace of NEAR Rust contracts. Stage 1 has a single `escrow` contract. `web/` is Next.js with near-connect, `agent/` is a Node TypeScript service, and `shared/` holds types. Payment is a NEP-141 `ft_transfer_call` into `escrow.ft_on_transfer`, in USDC on NEAR. The agent posts heartbeats and triggers releases and refunds with a function-call key. Everything runs on testnet. §3 (the contract interface) is the source of truth.

## 1. Stack (versions verified 13 Nov 2026)
| Area | Choice |
|---|---|
| Contracts | Rust, near-sdk **5.30.1**, cargo-near **0.23.0**, rustc 1.100 (rustup), wasm32-unknown-unknown |
| Contract tests | Rust unit tests (`near_sdk::test_utils`). `near-workspaces` sandbox tests only if time allows |
| CLI | near-cli-rs **0.31.1** (`near …`) |
| Web | Next.js 16.x, Tailwind, `@hot-labs/near-connect` 0.12.0, near-api-js 7.5.3 |
| Agent | Node ≥24, TypeScript, near-api-js 7.5.3, `openai` client → NEAR AI Cloud `https://cloud-api.near.ai/v1` (model `Qwen/Qwen3.8-27B`, owned_by nearai) |
| Edge on-ramp | 1Click `https://1click.chaindefuser.com/v0`, mainnet only |

## 2. Layout
```
contracts/Cargo.toml         workspace
contracts/escrow/src/lib.rs  Stage 1 escrow (+ unit tests)
contracts/scripts/*.sh       near-cli-rs deploy/init/demo scripts (testnet)
web/                          storefront, checkout (ft_transfer_call), /me, /steward, /agent
agent/src/                    runner (heartbeat/release/refund), chat, attestation
shared/src/                   types mirroring contract JSON, constants (token id, contract id)
```

## 3. Stage 1 contract: `escrow`
State:
- `owner`, `token_id`, `treasury`
- `products: IterableMap<u64, Product>`
- `agreements: IterableMap<u64, Agreement>`
- `escrows: LookupMap<u64, Escrow>`
- `protocol_fees`, `next_*` ids
- the parameters from S1-3 and S1-7

**Product:**
- `steward`, `heartbeat_signer`, `price_per_period` (U128)
- `period_ns`, `grace_ns`
- `status: Pending|Active|Abandoned`
- `last_heartbeat_period`, `last_heartbeat_ns`
- `ops_reserve`, `contingency_reserve`, `passport_root`

**Agreement:**
- `product_id`, `subscriber`, `refund_to`
- `price_per_period`, `period_ns`, `grace_ns`
- `start_ns`, `start_product_period` (D-06)

**Escrow:** `funded_periods`, `released_periods`, `balance`, `contingency_contributed`, `refunded`.

Methods (Stage 1):
- `new({owner, token_id, treasury})`, which runs once.
- `register_product({steward, heartbeat_signer, price_per_period, period_ns, grace_ns, passport_root}) → id` (owner) · `approve_product({id})` (steward → Active).
- `ft_on_transfer({sender_id, amount, msg}) → U128 unused`:
  - `predecessor` must equal `token_id`, otherwise it returns `amount`.
  - `msg = {"product_id":"1","periods":3,"subscriber":"alice.testnet","refund_to":"alice.testnet"}`. If `subscriber` / `refund_to` are absent they default to `sender_id`; they must be present for the 1Click edge.
  - Requires the product to be Active and `amount ≥ price × periods`. It returns the excess.
  - An invalid msg returns the full amount and never panics.
- `heartbeat({product_id, period, status_hash})`: callable only by `heartbeat_signer`. The period must strictly increase. Grace → Active (an Abandoned product stays Abandoned).
- `release_period({agreement_id})`:
  - Permissionless (S1-5), sequential, and runs the D-06 check.
  - It splits the payment: fee → `protocol_fees`, ops and contingency → product reserves, and the steward share → `ft_transfer`. A callback rolls the state back if the transfer fails.
- `declare_abandoned({product_id, reason})`: steward only. This is the killswitch.
- `claim_refund({agreement_id})`:
  - Permissionless. Allowed when the product is Abandoned, or when `now > start + next×period + grace` and the heartbeat for that period is missing.
  - Pays `(funded − released) × price` plus the agreement's `contingency_contributed` (if Abandoned) to `refund_to` by `ft_transfer`, with a rollback callback. One refund per agreement.
- `withdraw_fees()`: sends `protocol_fees` to `treasury`.
- Views: `get_product`, `list_products`, `get_health({product_id})`, `get_agreement`, `get_escrow`, `get_agreements_for({account})`, `is_refund_claimable`, `version`.
- Events (NEP-297, standard `pandem`): `product_registered`, `subscribed`, `heartbeat`, `released`, `abandoned`, `refunded`.

NEAR specifics:
- The escrow, steward, treasury and every `refund_to` must be registered for storage on the token (`storage_deposit`). The deploy script registers the escrow, steward and treasury.
- The UI checks `storage_balance_of(subscriber)`.
- `ft_transfer` uses 1 yocto, which the contract pays from its own balance: 15 TGas for the transfer and 10 TGas for the callback (as in the spike).
- The contract account holds NEAR for storage. The spike wasm was 126 KB, which locks about 1.3 NEAR.

## 4. Payment flows
- **Testnet (demo):** the subscriber connects a NEAR wallet (near-connect) and the UI sends `token.ft_transfer_call({receiver_id: escrow, amount: price×periods, msg})` with 1 yocto attached and 100 TGas. Afterwards the UI reads `get_agreements_for`.
- **Mainnet edge (optional, E-1):** 1Click quote `{swapType:"EXACT_OUTPUT", destinationAsset:<USDC on NEAR>, recipient:<escrow>, recipientType:"DESTINATION_CHAIN", customRecipientMsg: JSON(msg with subscriber + refund_to), refundTo:<payer origin address>}`. The solver delivers with `ft_transfer_call`. **Check that the product is Active and the price is current before quoting:** if `ft_on_transfer` returns unused tokens, they go back to the solver, not the payer. Demo default: show a dry quote only.

## 5. Agent (`agent/`)
- **Runner, every 20 s:**
  - Checks the demo provider's health URL and, if it's up, calls `heartbeat`. It stops when `agent/.killswitch` exists.
  - Calls `release_period` for due agreements and `claim_refund` for claimable ones.
  - Signs with a function-call key on `pandem-agent.testnet` that is limited to the escrow and these 3 methods, so it can't move tokens itself.
- **Chat:** `/chat` with the tools `search_catalog` and `get_subscription` (escrow views). `/attestation` uses a nonce check against `GET /v1/attestation/report`. Billing is in USD credits ($10 Builders key). Each call's inference id and cost go to an off-chain log (`agent/data/`, gitignored).
- Stage 3 moves the agent's money into an `agent-wallet` contract.

## 6. Environments
- Testnet only. Contract dev uses unit tests, then a throwaway faucet account (`near account create-account sponsor-by-faucet-service`), then shreyan's named accounts (S1-2).
- Secrets: `.env*` and `.near-credentials/` are gitignored. Agents never read shreyan's keys.
