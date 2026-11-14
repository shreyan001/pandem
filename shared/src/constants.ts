export const PANDEM_ESCROW_ID =
  process.env["PANDEM_ESCROW_ID"] ?? "pandem-escrow-46cee5ca.testnet";

export const PANDEM_TOKEN_ID =
  process.env["PANDEM_TOKEN_ID"] ?? "wrap.testnet";

export const PANDEM_TREASURY_ID =
  process.env["PANDEM_TREASURY_ID"] ?? "pandem-treasury-46cee5ca.testnet";

export const PANDEM_STEWARD_ID =
  process.env["PANDEM_STEWARD_ID"] ?? "pandem-steward-46cee5ca.testnet";

export const PANDEM_AGENT_ID =
  process.env["PANDEM_AGENT_ID"] ?? "pandem-agent-46cee5ca.testnet";

export const SPLIT_BPS = {
  PROTOCOL_FEE: 250,      // 2.5%
  OPS_RESERVE: 3000,      // 30.0%
  CONTINGENCY_RESERVE: 2000, // 20.0%
  STEWARD: 4750,          // 47.5%
  TOTAL: 10000,
} as const;

export const GAS = {
  FT_TRANSFER: "15000000000000",        // 15 TGas
  FT_CALLBACK: "10000000000000",        // 10 TGas
  FT_TRANSFER_CALL: "100000000000000",  // 100 TGas
} as const;

export const ONE_YOCTO = "1";
