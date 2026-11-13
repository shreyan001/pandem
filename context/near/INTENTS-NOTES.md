# NEAR Intents, stablecoins and wallets: Pandem notes

**TL;DR:** 1Click is Pandem's **mainnet-only edge on-ramp**: a payer on another chain gets an `EXACT_OUTPUT` quote for USDC on NEAR. The recipient is the escrow contract, with `customRecipientMsg` = the subscribe msg, so 1Click delivers with `ft_transfer_call` → `ft_on_transfer`. Inside Pandem, payments are native NEAR USDC transfers, never 1Click. 1Click has no testnet, so the testnet demo pays with `ft_transfer_call` directly. Checked 13 Nov 2026 IST with live dry quotes unless marked unverified.

## Which mechanism fits
| Mechanism | Use in Pandem | Why |
|---|---|---|
| Direct `ft_transfer_call` from a NEAR wallet | **Core** (testnet and mainnet) | Native USDC on NEAR straight into `escrow.ft_on_transfer` |
| **1Click API** + `customRecipientMsg` (`https://1click.chaindefuser.com/v0`) | **Edge only**, mainnet (M7, E-1/E-2) | Any token in, USDC delivered to the escrow by `ft_transfer_call`. Here `sender_id` is the solver, so the subscriber and `refund_to` must come from the msg. Validate the msg before quoting: an invalid msg makes the escrow return the tokens, and where they end up is **unverified** |
| 1Click for refunds or internal flows | **No** | Refunds are `ft_transfer` on NEAR to the subscriber |
| NEAR Connect `@hot-labs/near-connect` 0.12.0 | Wallet login and signing | Wallet selector is archived |
| Confidential Swaps, reusable deposit addresses | Later / not planned | Need a user session and a partner key |

## 1Click facts
- Flow: `GET /v0/tokens` → `POST /v0/quote` (dry) → `POST /v0/quote` (`dry:false`, returns `depositAddress`, ~10 min) → deposit tx → `POST /v0/deposit/submit` → `GET /v0/status?depositAddress=`.
- Statuses: `PENDING_DEPOSIT`, `KNOWN_DEPOSIT_TX`, `PROCESSING` → terminal `SUCCESS`, `FAILED`, `REFUNDED`, `INCOMPLETE_DEPOSIT`.
- Live dry quotes on 13 Nov 2026, no API key:
  - Inbound, 1 USDC to a NEAR account, from USDC on Base: `amountIn` 1.010224, ~35 s.
  - Refund, 1 USDC on NEAR → USDC on Base: `amountOut` 0.997398, ~22 s.
- Fees (docs.near-intents.org/resources/fees):
  - 0.0001% protocol fee.
  - 1Click adds **0.25% without an API key**.
  - With a key: 0.20%, or **0.01% on stablecoin pairs**.
  - No 1Click fee on `ANY_INPUT`.
  - HACKATHON.md Q-006 says "0.2% without a JWT". The fees page (current) says 0.25% without a key, so plan for 0.25%.
- `intents.near` account ids: an EVM signer's id is its lowercase address (`erc191`).
- **No testnet** (HACKATHON.md Q-007).
- OpenAPI: https://1click.chaindefuser.com/docs/v0/openapi.yaml
- Incident: the 1 Oct 2026 NEAR Intents exploit ($3.8M, Omni deposit/withdraw bug), https://x.com/near_intents/status/2105642219357241796. Keep demo amounts tiny.

## Stablecoins on NEAR (mainnet, NEP-141, 6 decimals)
- **USDC (native, Circle):** `17208628f84f5d6ad33f0da3bbbeb27ffcb398eac501a31bd6ad2011e36133a1` (circle.com/multi-chain-usdc/near)
- **USDT (native, Tether):** `usdt.tether-token.near`
- Avoid bridged `a0b86991c6218b36c1d19d4a2e9eb0ce3606eb48.factory.bridge.near` (USDC.e).
- In 1Click, use the `assetId` from `/v0/tokens` (format `nep141:<contract>`). Don't type it by hand.
- Receivers must be storage-registered on the token (`storage_deposit`) before transfers to them succeed.

## Contracts
- Pandem contracts are Rust (near-sdk 5.30.1), D-01. `near-sdk-js` still builds (spike, `near/RESEARCH-2026-11-DECENTRALIZED.md`), but it is archived and not used.

## Learnings carried over from the Gemini chat (summarised)
1. Intents is declarative: you state the outcome, and solvers compete to fill it. It is structured JSON, not free text.
2. The user signs only with the wallet that holds the source asset. NEAR runs settlement and verification.
3. Settlement is all-or-nothing, with an automatic refund on failure.
4. NEAR AI Cloud is an OpenAI-compatible confidential inference API, not a general container host. Hosting full private SaaS stacks belongs to Phala or OutLayer / Shade Agents (later stages, **unverified** here).
