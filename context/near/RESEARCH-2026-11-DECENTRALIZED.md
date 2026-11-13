# Live testnet spikes: NEAR contract paths (13 Nov 2026, 17:50–18:10 IST)

**TL;DR:** All three paths built, deployed and ran on NEAR **testnet** from the box. Every account is a throwaway faucet account; none of shreyan's keys or .env were used.
1. **Rust is the recommended path** (Rust is now allowed). A minimal escrow (near-sdk 5.30.1, cargo-near 0.23.0, rustc 1.100.0) builds in 14 s to 126 KB. On testnet it received a NEP-141 `ft_transfer_call` through `ft_on_transfer`, recorded the subscription, rejected a non-beneficiary, released by `ft_transfer` with a callback, and rejected a double release.
2. **near-sdk-js 2.0.0 still works, though it's archived.** It needed two workarounds: pin `@types/node@20` and set `"type":"module"`. It also produces a 531 KB wasm, which locks about 5.3 NEAR of storage.
3. **The Stillworks Solidity runs unmodified on Aurora testnet.** It was deployed through the NEAR `aurora` engine account, so gas was paid in NEAR, and the real `subscribe()` split worked (2.5% to the hub).
   - Public-RPC tooling needs Aurora ETH, and the only faucet is captcha-gated, so it needs a human.
   - Foundry needs `--legacy` on Aurora because the RPC rejects `eth_feeHistory`.
   - Hardhat 3 was installed but not run, because I was stopped first.

## 1. Rust: near-sdk-rs + cargo-near (verdict: WORKS, recommended)
Toolchain:

| Tool | Version |
|---|---|
| rustup | 1.29.3 |
| rustc / cargo | 1.100.0 (2026-11-09) |
| target | wasm32-unknown-unknown |
| cargo-near | 0.23.0 (release 2026-11-06, prebuilt binary) |
| near-sdk | 5.30.1 (crates.io, 2026-11-05) |
| near-cli-rs | 0.31.1 |

Sources: https://github.com/near/cargo-near/releases and https://crates.io/crates/near-sdk, both checked 13 Nov 2026. Code: `/workspace/spike-rs/src/lib.rs` (~85 lines), state `{token, beneficiary, next_id, subs: LookupMap<u64, Subscription>}`.

Commands:
```
curl -sSf https://sh.rustup.rs | sh -s -- -y --profile minimal --default-toolchain stable --target wasm32-unknown-unknown
curl -sL https://github.com/near/cargo-near/releases/download/cargo-near-v0.23.0/cargo-near-x86_64-unknown-linux-gnu.tar.gz | tar xz   # copy cargo-near into ~/.cargo/bin
cargo near build non-reproducible-wasm
near account create-account sponsor-by-faucet-service <acct>.testnet autogenerate-new-keypair save-to-legacy-keychain network-config testnet create
near contract deploy <acct>.testnet use-file target/near/pandem_escrow_spike.wasm with-init-call new json-args '{"token":"wrap.testnet","beneficiary":"<ben>.testnet"}' prepaid-gas '100.0 Tgas' attached-deposit '0 NEAR' network-config testnet sign-with-legacy-keychain send
```
Build output:
```
✓ Contract successfully built! (in CARGO_NEAR_BUILD_ENVIRONMENT=host)
     -                Binary: /workspace/spike-rs/target/near/pandem_escrow_spike.wasm
     -                  Size: 126.0 KB (125965 bytes)
     -          Embedded ABI: /workspace/spike-rs/target/near/pandem_escrow_spike_abi.zst
    Finished cargo near build in 14s
```
Testnet run (escrow `pandem-rs-escrow-1794573260.testnet`, token `wrap.testnet`):
```
New account <pandem-rs-escrow-1794573260.testnet> created successfully.
Transaction ID: 5v5zQihwW24FvgTbPoxa3MA2Ei8Xg7BNjATpX6oWCPRT   Contract code has been successfully deployed.
== ft_transfer_call 0.02 wNEAR -> escrow
Transaction ID: EeG4edLpd4gLkGAYKCWtFuqszCXFFHcPMfE4ePPo9n5f
  EVENT_JSON:{"standard":"pandem","version":"0.1.0","event":"subscribed","data":[{"id":0,"subscriber":"pandem-spike-1794572594.testnet","amount":"20000000000000000000000"}]}
get_subscription(0): {"amount":"20000000000000000000000","msg":"{\"product\":1,\"periods\":1}","released":false,"subscriber":"pandem-spike-1794572594.testnet"}
escrow wNEAR: "20000000000000000000000"
beneficiary wNEAR before: "10000000000000000000000"
== release(0) by non-beneficiary (expect panic)
Transaction ID: 4gNq6us9GupbGfVs6U2YewuXHsmwogu2B2LQimpxUtHQ
  ExecutionError("Smart contract panicked: Not beneficiary")
== release(0) by beneficiary
Transaction ID: HZFcRw8abcrvwhCUEkyZHTt4x5BSREdb6MajQ6Lpezu2   return value: true
get_subscription(0): {..."released":true,...}
escrow wNEAR after: "0"
beneficiary wNEAR after: "30000000000000000000000"
== release(0) again (expect Already released)
Already released
Storage used by the account 126.4 KB
```
Not done (to save credits): near-workspaces/sandbox tests, `cargo near build reproducible-wasm` (needs Docker), and a mainnet USDC run.

## 2. near-sdk-js 2.0.0 (verdict: WORKS with workarounds; archived, not recommended now that Rust is allowed)
- `npm install near-sdk-js@2.0.0`. npm 11 blocks its install scripts, so I ran `node node_modules/near-sdk-js/lib/cli/post-install.js` by hand. It downloaded QuickJS, wasi-sdk and binaryen fine.
- Fix 1: the build failed in its bundled tsc 4.7.4 against `@types/node@26` (`ffi.d.ts ... TS1139`). Fix: `npm i -D @types/node@20`.
- Fix 2: the build failed with `SyntaxError: Unexpected token 'export'`. Fix: `npm pkg set type=module`.
- Result: `✔ Generated build/spike.wasm contract successfully!`, a **531 KB** wasm in 14 s. Storage used was 531.4 KB, which locks about 5.3 NEAR (the faucet gives 10).
- Testnet `pandem-spike-1794572594.testnet` (counter + `ft_on_transfer`):
  - `increment` ×2 → `count=1`, `count=2`; `get_count` → `2` (tx HkoBPaH3…, 8.92 TGas).
  - Second contract `pandem-spike-recv-1794572643.testnet` (token = wrap.testnet): `ft_transfer_call` 0.01 wNEAR → `EVENT_JSON:{"...","event":"received",...}`, `get_received` = `10000000000000000000000` (tx AEHwyBPv…, 13.57 TGas).
  - Wrong-token path: the contract returned the full amount, and wrap.testnet logged `Refund 4000000000000000000000 from pandem-spike-1794572594.testnet to pandem-spike-recv-1794572643.testnet`.

## 3. Stillworks Solidity on Aurora testnet (verdict: contracts WORK unmodified; public-RPC tooling blocked on faucet ETH)
- RPC `https://testnet.aurora.dev`: `eth_chainId` = `0x4e454153` (1313161555). Engine account `aurora` on NEAR testnet reports `get_version` = `3.11.1`. The ETH connector is `eth.sepolia.testnet`.
- solc 0.8.19 (npm `solc`) compiled all 10 Stillworks contracts plus MockUSDT with 0 errors.
- **Deploy and call without Aurora ETH:** NEAR account → `aurora.deploy_code` / `aurora.call` (borsh `CallArgs::V2`). Gas is paid in NEAR, about 0.0005 NEAR per deploy. `msg.sender` = `keccak256(account_id)[12:]` = `0x04e61f0a…f9a7`.
```
MockUSDT     0xbc2265602dda5323f4978ef3f3e10671efc6cc1e  tx QmonjEWCms5AbNfEq8ZnzLahwmE5rD8FmCY655uPp4o
StillworksHub 0x316653bec730ef4918e55f1ccea8849771e99725 tx 2Fi9PBtSVxfTowNxgo1Lr2LnLM5gaVkYnFeqQajqn1SV
registerListing                                          tx 7K8T8QydKJm6Ta9kcBQBK1DCu1mtkVbTRWMkXtyXHzDQ
StewardshipEscrowPayments 0x590efab265e592e47bc5b6600a3bbe01905c67e3 tx 8p4VW9mFtdSvc276cbudSAPx7rhyPdXB86Ks8zsKbzXF
approve + subscribe(ProMonthly)  tx 51m8dXGP… / 6ck9BroFx7R8PUSSgRyC5rHU9Lt81AJhVdgaTayUur8o
balanceOf escrow => 9750000   balanceOf hub => 250000   totalProtocolFeesCollected => 250000   totalSubscriptions => 1
```
- **EVM-signed transactions relayed through NEAR at gas price 0:** a fresh EVM key signed legacy (type 0) and EIP-1559 (type 2) deploys, and `aurora.submit` accepted both (MockUSDT at `0x3757…6138` and `0x6074…47e7`). The public RPC rejects price 0 with `rejected: gas price is too low`.
- NEP-141 → Aurora: `get_erc20_from_nep141` (borsh string arg) maps `wrap.testnet` → `0x4861825e…d146` and Circle testnet USDC `3e2210e1…b8af` → `0x13d48d80…c1b2`. `ft_transfer_call` of 0.001 wNEAR to `aurora` with msg = the EVM address credited the ERC-20 balance (tx i4UWe7w5…). The exit path (ERC-20 → NEP-141) was not tested.
- **Foundry 1.9.0, with and without `--legacy`:**
```
forge create (no --legacy):  Error: Failed to estimate EIP1559 fees. This chain might not support EIP1559, try adding --legacy ...
                             server returned an error response: error code -32601: method not supported   (eth_feeHistory)
forge create --legacy:       Error: ... Err(Engine(EngineError { kind: GasPayment(OutOfFund), gas_used: 0 }))   (unfunded key; tx was accepted for execution)
forge script (no --legacy):  Unsupported Chain IDs: 1313161555. ... Error: Failed to get EIP-1559 fees; ... method not supported
forge script --legacy:       not finished (stopped)
```
  So **`--legacy` is required**. `eth_maxPriorityFeePerGas` works (`0x42c1d80`, 0.07 gwei), but `eth_feeHistory` doesn't. The same applies to viem/Hardhat: use legacy `gasPrice` (**unverified for Hardhat**).
- **Hardhat 3.22.0** installed (`hardhat@3.22.0`, toolbox-viem) in `/workspace/spike-hh`, but I didn't run it. **Unverified.**
- **Faucet:** https://aurora.dev/faucet posts `{address, captchaValue}` to `/api/faucet/testnet` (seen in the site JS), so a human has to solve the captcha. Tidepool's faucet (https://app.usetidepool.tech/faucet) is site-only (`403 site_only` for API claims, per https://www.usetidepool.tech/llms-full.txt, 13 Nov 2026) and gives test USDC/USDT but **no native gas**. It was not claimed, so it is **unverified** whether its Aurora test USDC is reachable. Ref testnet pool 1664 (`aurora`/wNEAR) holds only ~0.00026 ETH, which isn't a usable source.

## Comparison of contract paths (as tested)
| Path | Works on testnet today | Language | Effort to a demo by 15 Nov 05:29 IST | Reuses Stillworks | Notes |
|---|---|---|---|---|---|
| **Rust near-sdk 5.30.1 + cargo-near 0.23.0** | **Yes** (deploy + ft_on_transfer + ft_transfer callback) | Rust | Medium: port the rules (~1.5k Solidity lines → Rust) | Logic only | Official, maintained. Native NEP-141 and 1Click `customRecipientMsg` → `ft_on_transfer` fit directly |
| near-sdk-js 2.0.0 | Yes, with 2 workarounds | TS | Medium | Logic only | Archived. 531 KB wasm (~5.3 NEAR storage). Risky to depend on |
| Solidity on Aurora | Yes, **unmodified** | Solidity | Low for contracts. Needs Aurora ETH (captcha faucet) or a NEAR-relayed submit | **Direct** | Not NEAR-native (judging risk). USDC must be bridged into Aurora as ERC-20. Foundry needs `--legacy` |

Left on the box: throwaway testnet accounts and keys in `/home/box/.near-credentials/testnet/` (pandem-spike-*, pandem-rs-escrow-*), a fresh EVM test key in `/workspace/spike-aurora/fresh.key` (holds no ETH), and spike folders `/workspace/spike-{rs,sdkjs,aurora,forge,hh}`.
