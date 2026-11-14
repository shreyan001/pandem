export type ProductStatus = "Pending" | "Active" | "Abandoned";

export interface Product {
  steward: string;
  heartbeat_signer: string;
  price_per_period: string;
  period_ns: string;
  grace_ns: string;
  status: ProductStatus;
  last_heartbeat_period: number;
  last_heartbeat_ns: string;
  ops_reserve: string;
  contingency_reserve: string;
  passport_root: string;
}

export interface Agreement {
  product_id: string;
  subscriber: string;
  refund_to: string;
  price_per_period: string;
  period_ns: string;
  grace_ns: string;
  start_ns: string;
  start_product_period: number;
}

export interface Escrow {
  funded_periods: number;
  released_periods: number;
  balance: string;
  contingency_contributed: string;
  refunded: boolean;
}

export interface Health {
  product_id: string;
  status: ProductStatus;
  last_heartbeat_period: number;
  last_heartbeat_ns: string;
  is_healthy: boolean;
}

export interface SubscribeMsg {
  product_id: string;
  periods: number;
  subscriber?: string;
  refund_to?: string;
}

export interface CatalogItem {
  id: string;
  name: string;
  tagline: string;
  description: string;
  price_per_period: string;
  price_display: string;
  period_seconds: number;
  period_display: string;
  grace_seconds: number;
  grace_display: string;
  category: string;
  status: ProductStatus;
  features: string[];
  upvotes?: number;
  rank?: number;
  isProductOfTheDay?: boolean;
  steward?: string;
  teeHardware?: string;
  teeModel?: string;
}

export interface InferencePaymentReceipt {
  receipt_id: string;
  batch_id: number;
  timestamp: string;
  product_id: number;
  tee_session_id: string;
  model_id: string;
  query_count: number;
  token_usage: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
    compute_hours: number;
  };
  unit_cost_yocto: string;
  amount_yocto: string;
  amount_wnear: string;
  sha256_cost_proof: string;
  tx_hash: string;
  recipient: string;
  status: "Settled" | "Simulated" | "Pending";
  dampener_variance_pct: number;
}

export interface BudgetAllocation {
  product_id: number;
  steward: string;
  agent_address: string;
  total_ops_received: string;
  current_balance: string;
  current_balance_wnear: string;
  period_draw_cap: string;
  period_draw_cap_wnear: string;
  drawn_in_current_period: string;
  drawn_in_current_period_wnear: string;
  inference_cost_per_query: string;
  inference_cost_per_query_wnear: string;
  last_cost_update_ns: string;
  status: "Active" | "Abandoned" | "Closed";
  dampener_bounds: {
    min_allowed_yocto: string;
    max_allowed_yocto: string;
    min_allowed_wnear: string;
    max_allowed_wnear: string;
  };
}

export interface CloudPaymentTelemetry {
  total_settled_draws: number;
  total_drawn_yocto: string;
  total_drawn_wnear: string;
  pending_unsettled_queries: number;
  pending_unsettled_tokens: number;
  pending_unsettled_yocto: string;
  pending_unsettled_wnear: string;
  active_allocation: BudgetAllocation;
  recent_receipts: InferencePaymentReceipt[];
}
