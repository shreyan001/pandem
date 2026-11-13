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
