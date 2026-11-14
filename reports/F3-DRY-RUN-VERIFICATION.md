# Pandem Milestone F3: Dry Run Verification Report

**Date**: November 14, 2026 (23:59 UTC / Nov 15 05:29 IST)  
**Network**: NEAR Protocol Testnet  
**RPC Endpoint Tested**: FastNear Testnet RPC (`https://rpc.testnet.fastnear.com`)  
**Status**: **ALL TESTS PASSED & ALL CONTRACT STATES AUDITED**

---

## 1. Automated Test Suite Execution

All 6 automated verification scripts were executed locally against live testnet state with zero failures:

| Test Script | Status | Assertions / Coverage | Execution Command |
|---|:---:|---|---|
| `scripts/test_f2_send_usdc.mjs` | **PASS** | 21/21 assertions: 6-decimal math, balance guards, NEP-141 schema | `node scripts/test_f2_send_usdc.mjs` |
| `scripts/test_d6_1_onboarding.mjs` | **PASS** | Account state, storage deposit, 100 tUSDC faucet balance verified | `node scripts/test_d6_1_onboarding.mjs` |
| `scripts/test_d6_2_lifecycle.mjs` | **PASS** | Graded tiers, prorated upgrade, renewal, refund on cancel verified | `node scripts/test_d6_2_lifecycle.mjs` |
| `scripts/test_d63_access.mjs` | **PASS** | 16/16 assertions: Live NEP-413 Ed25519 signing + FastNear RPC verify | `node scripts/test_d63_access.mjs` |
| `scripts/test_d6_4_ops_flow.mjs` | **PASS** | Automated 30% ops share (1.5 tUSDC) forwarded & receipt verified | `node scripts/test_d6_4_ops_flow.mjs` |
| `scripts/test_d6_5_private_mode.mjs` | **PASS** | 13/13 assertions: 32-byte secret, blind sha256 commitment, gated API | `node scripts/test_d6_5_private_mode.mjs` |

---

## 2. Live Contract RPC State Audit

Direct queries executed against FastNear Testnet RPC (`https://rpc.testnet.fastnear.com`):

### 2.1 Token Contract (`pandem-tusdc-46cee5ca.testnet`)
- **Method**: `ft_metadata`
- **Result**:
  ```json
  {
    "spec": "ft-1.0.0",
    "name": "Testnet USDC",
    "symbol": "tUSDC",
    "icon": null,
    "reference": null,
    "reference_hash": null,
    "decimals": 6
  }
  ```
- **Audit**: Verified standard NEP-141 metadata with exactly 6 decimals.

### 2.2 Escrow Contract (`escrow-d64-40ba.test-pandem-alice-1.testnet`)
- **Method**: `get_config`
  - **Owner**: `escrow-d64-40ba.test-pandem-alice-1.testnet`
  - **Token ID**: `pandem-tusdc-46cee5ca.testnet`
  - **Treasury**: `pandem-treasury-46cee5ca.testnet`
  - **Protocol Fee**: `125000` (2.5%)
- **Method**: `get_budget_contract`
  - **Budget Contract Destination**: `pandem-budget-d1-8f199e48.testnet`
- **Audit**: Verified escrow contract is actively bound to `pandem-budget-d1-8f199e48.testnet` for automated 30% ops routing.

### 2.3 Budget Contract (`pandem-budget-d1-8f199e48.testnet`)
- **Method**: `get_budget(product_id: 1)`
- **Result**:
  ```json
  {
    "product_id": 1,
    "steward": "pandem-steward-46cee5ca.testnet",
    "agent_address": "pandem-agent-46cee5ca.testnet",
    "total_ops_received": "3000000",
    "current_balance": "2500000",
    "period_draw_cap": "1500000",
    "last_draw_period": 1,
    "drawn_in_current_period": "500000",
    "inference_cost_per_query": "1000",
    "last_cost_update_ns": 1794653390303120400,
    "total_periods": 12,
    "completed_periods": 0,
    "projected_remaining_cost": "18000000",
    "status": "Active"
  }
  ```
- **Audit**: Verified total ops ingested (`3.0 tUSDC`), current ops balance (`2.5 tUSDC`), and draw telemetry from agent runner (`0.5 tUSDC drawn`).

### 2.4 Registry Contract (`pandem-registry-v2-46cee5ca.testnet`)
- **Method**: `get_listing(product_id: 1)`
- **Result**:
  - **Product**: Open-WebUI (`slug: open-webui`)
  - **Decentralization Score**: 98 / 100
  - **Tiers**: Pro (5 tUSDC/month) and Max (15 tUSDC/month)
  - **Decentralization Checks**: 5/5 passed (open_source, self_hostable, private_ai_tee, non_custodial, heartbeat)
  - **Steward**: `pandem-steward-46cee5ca.testnet`
- **Audit**: Complete on-chain listing metadata verified.

---

## 3. Demo Journey: Real On-Chain Transaction Hashes

Every single step of the end-to-end user and maker journey is backed by confirmed NEAR Testnet transactions:

| Step | Action | Signer | Transaction ID | Explorer Link | Confirmed Receipts / Logs |
|---|---|---|---|---|---|
| **1** | **Faucet Claim (100 tUSDC)** | `d61.test-pandem-alice-1.testnet` | `GJM3Nke5UovC3gUik319G4MAxQgdKmMa18iDvbyfu97` | [View Tx](https://explorer.testnet.near.org/transactions/GJM3Nke5UovC3gUik319G4MAxQgdKmMa18iDvbyfu97) | 100,000,000 units minted to subscriber |
| **2** | **Send tUSDC** | `test-pandem-alice-1.testnet` | `FTk6jq875AaFwhDo3deZFosPji79SaAC1k8zuHkm83pe` | [View Tx](https://explorer.testnet.near.org/transactions/FTk6jq875AaFwhDo3deZFosPji79SaAC1k8zuHkm83pe) | 1,000,000 units sent with memo |
| **3** | **Subscribe (Pro, 2 Periods)** | `test-pandem-alice-1.testnet` | `FuSkAiSVCihP9Qrkgyv7wagFy5chGPtE2PJXs8hSzAeZ` | [View Tx](https://explorer.testnet.near.org/transactions/FuSkAiSVCihP9Qrkgyv7wagFy5chGPtE2PJXs8hSzAeZ) | `ft_transfer_call` creates agreement #1 |
| **4** | **Heartbeat & Release (30% Ops to Budget)** | `test-pandem-alice-1.testnet` | `7f2t1evj8sTrWZ7CkNEz3mdexwuBpjym1m6ivGoiZpT7` | [View Tx](https://explorer.testnet.near.org/transactions/7f2t1evj8sTrWZ7CkNEz3mdexwuBpjym1m6ivGoiZpT7) | Escrow forwards 1.5 tUSDC ops to budget; budget emits `ops_funds_received` |
| **5** | **Renew (+1 Period Max Tier)** | `test-pandem-alice-1.testnet` | `GMZ4ya8KXwVWDAgmdW9HQXcJov3jM13fT4Qav62V74Ut` | [View Tx](https://explorer.testnet.near.org/transactions/GMZ4ya8KXwVWDAgmdW9HQXcJov3jM13fT4Qav62V74Ut) | `ft_transfer_call` extends funded periods |
| **6** | **Cancel & Pro-Rata Refund** | `test-pandem-alice-1.testnet` | `8FkaGuUcsKirk9xvjkyTXDrK3qVCWX67yLsfZywseN9C` | [View Tx](https://explorer.testnet.near.org/transactions/8FkaGuUcsKirk9xvjkyTXDrK3qVCWX67yLsfZywseN9C) | Pro-rata refund returned to subscriber wallet |

### 3.1 Deep-Dive: Automated 30% Ops Share Cross-Contract Call
Transaction `7f2t1evj8sTrWZ7CkNEz3mdexwuBpjym1m6ivGoiZpT7` generated 14 receipt execution outcomes:
1. `pandem-steward-46cee5ca.testnet` received 47.5% share (2.375 tUSDC):
   `EVENT_JSON:{"standard":"nep141","version":"1.0.0","event":"ft_transfer","data":[{"amount":"2375000","memo":"pandem release 1 period 1"}]}`
2. `escrow-d64-40ba.test-pandem-alice-1.testnet` emitted release event:
   `EVENT_JSON:{"standard":"pandem","version":"0.1.0","event":"released","data":[{"agreement_id":1,"steward_amount":"2375000"}]}`
3. `pandem-tusdc-46cee5ca.testnet` transferred 30.0% ops share (1.500 tUSDC) to `pandem-budget-d1-8f199e48.testnet`:
   `EVENT_JSON:{"standard":"nep141","version":"1.0.0","event":"ft_transfer","data":[{"amount":"1500000","memo":"pandem ops release agreement 1"}]}`
4. `pandem-budget-d1-8f199e48.testnet` ingested funds and updated balance:
   `EVENT_JSON:{"standard":"pandem","version":"0.2.0","event":"ops_funds_received","data":[{"product_id":1,"amount":"1500000"}]}`
5. `escrow-d64-40ba.test-pandem-alice-1.testnet` acknowledged completion:
   `EVENT_JSON:{"standard":"pandem","version":"0.1.0","event":"ops_forwarded","data":[{"agreement_id":1,"product_id":1,"ops_amount":"1500000"}]}`

---

## 4. Verification Conclusion

Milestone F3 Dry Run is **100% complete and verified**:
- All 6 automated test scripts execute deterministically and exit 0.
- All 4 core contracts (`pandem-tusdc-46cee5ca.testnet`, `escrow-d64-40ba.test-pandem-alice-1.testnet`, `pandem-budget-d1-8f199e48.testnet`, `pandem-registry-v2-46cee5ca.testnet`) are healthy, with correct state and configurations confirmed via live RPC.
- All 6 demo journey transactions are permanently verifiable on NEAR Testnet Explorer.
- The project is fully ready for demo presentation and final submission.
