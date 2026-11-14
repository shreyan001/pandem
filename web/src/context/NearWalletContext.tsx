"use client";

import React, { createContext, useContext, useEffect, useState, useCallback } from "react";
import { NearConnector } from "@hot-labs/near-connect";
import { PANDEM_ESCROW_ID, PANDEM_TOKEN_ID } from "@pandem/shared";

interface NearWalletContextType {
  accountId: string | null;
  isConnected: boolean;
  isLoading: boolean;
  tokenBalance: string;
  isStorageRegistered: boolean;
  connect: () => Promise<void>;
  disconnect: () => Promise<void>;
  setManualAccount: (acc: string) => void;
  refreshBalances: () => Promise<void>;
  registerStorage: () => Promise<string | null>;
  sendSubscribe: (productId: string, periods: number, amountYocto: string) => Promise<string | null>;
}

const NearWalletContext = createContext<NearWalletContextType | null>(null);

const TESTNET_RPC = "https://rpc.testnet.near.org";

export function NearWalletProvider({ children }: { children: React.ReactNode }) {
  const [connector, setConnector] = useState<NearConnector | null>(null);
  const [accountId, setAccountId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [tokenBalance, setTokenBalance] = useState<string>("0");
  const [isStorageRegistered, setIsStorageRegistered] = useState<boolean>(true);

  // Initialize NearConnector on mount (browser only)
  useEffect(() => {
    if (typeof window === "undefined") return;

    try {
      const nc = new NearConnector({
        network: "testnet",
      });
      setConnector(nc);

      // Check if already signed in
      nc.wallet()
        .then(async (w) => {
          const accounts = await w.getAccounts();
          if (accounts.length > 0 && accounts[0].accountId) {
            setAccountId(accounts[0].accountId);
          }
        })
        .catch(() => {})
        .finally(() => setIsLoading(false));

      nc.on("wallet:signIn", async (t: any) => {
        if (t?.accounts?.length > 0) {
          setAccountId(t.accounts[0].accountId);
        }
      });

      nc.on("wallet:signOut", async () => {
        setAccountId(null);
        setTokenBalance("0");
      });
    } catch (e) {
      console.warn("NearConnector init error:", e);
      setIsLoading(false);
    }
  }, []);

  // Fetch token balance & storage registration status via public RPC
  const refreshBalances = useCallback(async () => {
    if (!accountId) {
      setTokenBalance("0");
      return;
    }

    try {
      // 1. Query ft_balance_of on token
      const balRes = await fetch(TESTNET_RPC, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          jsonrpc: "2.0",
          id: "bal-check",
          method: "query",
          params: {
            request_type: "call_function",
            finality: "optimistic",
            account_id: PANDEM_TOKEN_ID,
            method_name: "ft_balance_of",
            args_base64: btoa(JSON.stringify({ account_id: accountId })),
          },
        }),
      });
      const balJson = await balRes.json();
      if (balJson?.result?.result) {
        const decoded = JSON.parse(
          new TextDecoder().decode(new Uint8Array(balJson.result.result))
        );
        setTokenBalance(decoded);
      }

      // 2. Query storage_balance_of
      const storageRes = await fetch(TESTNET_RPC, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          jsonrpc: "2.0",
          id: "storage-check",
          method: "query",
          params: {
            request_type: "call_function",
            finality: "optimistic",
            account_id: PANDEM_TOKEN_ID,
            method_name: "storage_balance_of",
            args_base64: btoa(JSON.stringify({ account_id: accountId })),
          },
        }),
      });
      const storageJson = await storageRes.json();
      if (storageJson?.result?.result) {
        const decoded = JSON.parse(
          new TextDecoder().decode(new Uint8Array(storageJson.result.result))
        );
        setIsStorageRegistered(decoded !== null);
      } else {
        setIsStorageRegistered(false);
      }
    } catch (e) {
      console.error("Balance query error:", e);
    }
  }, [accountId]);

  useEffect(() => {
    if (accountId) {
      refreshBalances();
    }
  }, [accountId, refreshBalances]);

  const connect = async () => {
    if (!connector) return;
    try {
      setIsLoading(true);
      const wallet = await connector.connect();
      const accounts = await wallet.getAccounts();
      if (accounts.length > 0) {
        setAccountId(accounts[0].accountId);
      }
    } catch (e) {
      console.error("Connect failed:", e);
    } finally {
      setIsLoading(false);
    }
  };

  const disconnect = async () => {
    if (!connector) return;
    try {
      await connector.disconnect();
      setAccountId(null);
      setTokenBalance("0");
    } catch (e) {
      console.error("Disconnect failed:", e);
    }
  };

  const setManualAccount = (acc: string) => {
    setAccountId(acc.trim());
  };

  const registerStorage = async (): Promise<string | null> => {
    if (!connector || !accountId) return null;
    try {
      const wallet = await connector.wallet();
      const outcome: any = await wallet.signAndSendTransaction({
        receiverId: PANDEM_TOKEN_ID,
        actions: [
          {
            type: "FunctionCall",
            params: {
              methodName: "storage_deposit",
              args: { account_id: accountId, registration_only: true },
              gas: "50000000000000",
              deposit: "12500000000000000000000", // 0.0125 NEAR
            },
          },
        ],
      });
      await refreshBalances();
      return outcome?.transaction?.hash ?? "submitted";
    } catch (e: any) {
      console.error("Register storage error:", e);
      throw e;
    }
  };

  const sendSubscribe = async (
    productId: string,
    periods: number,
    amountYocto: string
  ): Promise<string | null> => {
    if (!connector || !accountId) return null;
    const msg = JSON.stringify({
      product_id: productId,
      periods,
      subscriber: accountId,
      refund_to: accountId,
    });

    try {
      const wallet = await connector.wallet();
      const outcome: any = await wallet.signAndSendTransaction({
        receiverId: PANDEM_TOKEN_ID,
        actions: [
          {
            type: "FunctionCall",
            params: {
              methodName: "ft_transfer_call",
              args: {
                receiver_id: PANDEM_ESCROW_ID,
                amount: amountYocto,
                msg,
              },
              gas: "100000000000000", // 100 TGas
              deposit: "1",           // 1 yocto
            },
          },
        ],
      });
      await refreshBalances();
      return outcome?.transaction?.hash ?? "submitted";
    } catch (e: any) {
      console.error("Subscribe transaction error:", e);
      throw e;
    }
  };

  return (
    <NearWalletContext.Provider
      value={{
        accountId,
        isConnected: !!accountId,
        isLoading,
        tokenBalance,
        isStorageRegistered,
        connect,
        disconnect,
        setManualAccount,
        refreshBalances,
        registerStorage,
        sendSubscribe,
      }}
    >
      {children}
    </NearWalletContext.Provider>
  );
}

export function useNearWallet() {
  const ctx = useContext(NearWalletContext);
  if (!ctx) {
    throw new Error("useNearWallet must be used within NearWalletProvider");
  }
  return ctx;
}
