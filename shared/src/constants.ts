export const PANDEM_ESCROW_ID =
  process.env["PANDEM_ESCROW_ID"] ?? "pandem-escrow-d1-8f199e48.testnet";

export const PANDEM_TOKEN_ID =
  process.env["PANDEM_TOKEN_ID"] ?? "pandem-tusdc-46cee5ca.testnet";

export const PANDEM_TREASURY_ID =
  process.env["PANDEM_TREASURY_ID"] ?? "pandem-treasury-46cee5ca.testnet";

export const PANDEM_STEWARD_ID =
  process.env["PANDEM_STEWARD_ID"] ?? "pandem-steward-46cee5ca.testnet";

export const PANDEM_AGENT_ID =
  process.env["PANDEM_AGENT_ID"] ?? "pandem-agent-46cee5ca.testnet";

export const PANDEM_BUDGET_ID =
  process.env["PANDEM_BUDGET_ID"] ?? "pandem-budget-d1-8f199e48.testnet";

export const PANDEM_REGISTRY_ID =
  process.env["PANDEM_REGISTRY_ID"] ?? "pandem-registry-v2-46cee5ca.testnet";

export const CLOUD_COMPUTE_OPERATOR_ID =
  process.env["CLOUD_COMPUTE_OPERATOR_ID"] ?? "cloud-compute-operator.testnet";

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
