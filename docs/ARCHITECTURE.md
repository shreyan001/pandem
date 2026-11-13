# Architecture

**TL;DR:** Pandem is a set of collaborating NEAR Rust contracts, built in stages. Stage 1 is a single `escrow` contract that holds USDC (NEP-141). It releases one period at a time while heartbeats arrive, and lets anyone trigger a refund when they stop. The TypeScript agent only calls permissionless or heartbeat methods with a function-call key. 1Click is an edge on-ramp on mainnet only. Everything runs on testnet. Interface: TECH-SPEC §3.

## 1. Stage 1 system (testnet demo)
```mermaid
flowchart LR
  U[Subscriber<br/>NEAR wallet via near-connect] -->|ft_transfer_call + msg| T[USDC NEP-141<br/>testnet token S1-1]
  T -->|ft_on_transfer| E[escrow contract<br/>Rust]
  W[web/ Next.js] -->|views| E
  U --> W
  A[agent/ TS<br/>FC key: heartbeat, release, refund] -->|heartbeat| E
  A -->|release_period / claim_refund| E
  A -->|chat + attestation, USD credits| AI[NEAR AI Cloud]
  S[Steward] -->|declare_abandoned killswitch| E
  E -->|ft_transfer 47.5%| S
  E -->|withdraw_fees 2.5%| TR[treasury account]
  E -->|ft_transfer refund| U
  X[Payer on another chain] -.->|mainnet only: 1Click EXACT_OUTPUT<br/>customRecipientMsg| T
```

## 2. Subscribe and release
```mermaid
sequenceDiagram
  autonumber
  actor P as Subscriber
  participant T as USDC (NEP-141)
  participant E as escrow
  participant A as agent
  actor S as Steward
  P->>T: ft_transfer_call(escrow, price×periods, msg)
  T->>E: ft_on_transfer(sender, amount, msg)
  E-->>T: unused (excess, or all if invalid)
  E->>E: Agreement + Escrow, start_product_period = last_hb + 1, event subscribed
  loop each period
    A->>E: heartbeat(product, period)
    A->>E: release_period(agreement)
    E->>S: ft_transfer 47.5% (callback rolls back on failure)
    E->>E: 2.5% fee, 30% ops, 20% contingency (ledger)
  end
  S->>E: declare_abandoned (or heartbeats stop past grace)
  A->>E: claim_refund(agreement)
  E->>P: ft_transfer unreleased × price (+ contingency share)
```

## 3. Agreement lifecycle
```mermaid
stateDiagram-v2
  [*] --> Funded: ft_on_transfer (valid msg)
  Funded --> Releasing: release_period (heartbeat for start+p−1)
  Releasing --> Releasing: next period
  Releasing --> Completed: released == funded
  Funded --> Refunded: claim_refund (grace missed or Abandoned)
  Releasing --> Refunded: claim_refund
  Completed --> [*]
  Refunded --> [*]
```

## 4. Staged contract set (target)
```mermaid
flowchart TB
  subgraph S1[Stage 1]
    E[escrow]
  end
  subgraph S2[Stage 2]
    B[budget: yearly term, ops allocation, cost-adjusted]
  end
  subgraph S3[Stage 3]
    AW[agent-wallet: starting capital, caps, pays operators/providers]
  end
  subgraph S4[Stage 4]
    R[registry + factory: one escrow per product]
    D[treasury DAO Sputnik/Trezu]
  end
  E -->|ops share| B
  B -->|budgeted draws| AW
  AW -->|ft_transfer| OP[operators / providers]
  R -->|deploys| E
  E -->|fees| D
```
On-chain: money, agreements, heartbeats (period + status hash) and events. Off-chain: the catalog text, the agent's chat logs and attestation reports, and inference costs (only their hashes go on-chain from stage 3).
