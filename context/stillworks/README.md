# Stillworks (reference only)

**TL;DR:** Stillworks is shreyan's earlier ETHGlobal / 0G project, a SaaS storefront with an autonomous escrow, built in Solidity. Pandem ports its escrow, heartbeat, killswitch and walkaway rules one-to-one into native NEAR Rust contracts, built in stages (D-01) (`docs/STILLWORKS-TO-NEAR.md`). It is a different project; don't copy its 0G, Privy, Redis or Foundry code.

- Repo: https://github.com/shreyan001/stillworks (`main` @ 7fc916c, 7 Nov 2026). Live: https://stillworks.vercel.app
- Deployed on 0G Galileo (chain 16602): `StewardshipEscrowPayments` ("cleanEscrow"), `StillworksHourlyProtocolHub`, `WaterfallContingencyHub`, MockUSDT.
- Also in source: `ProductRegistry` + `SubscriptionAgreement` + `SubscriptionEscrow` + `InvoiceRegistry` (the per-period release and pro-rata refund model) and `ProductHealthReceiver`. `StillworksHub` is the older hub that HourlyProtocolHub replaced.
- Must disclose: the hackathon rules (Q-002, Q-005) require the README to name this prior work.
