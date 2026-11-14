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
  walletError: string | null;
  clearWalletError: () => void;
  connect: () => Promise<void>;
  disconnect: () => Promise<void>;
  setManualAccount: (acc: string) => void;
  refreshBalances: () => Promise<void>;
  registerStorage: () => Promise<string | null>;
  claimFaucet: () => Promise<string | null>;
  setupPaymentsBatch: () => Promise<{ batchTx: string | null; storageTx: string | null; faucetTx: string | null }>;
  sendSubscribe: (productId: string, periods: number, amountYocto: string, tierId?: string, commitment?: string) => Promise<string | null>;
  sendUpgrade: (agreementId: number, targetTier: string, amountUnits: string) => Promise<string | null>;
  sendRenew: (agreementId: number, periods: number, amountUnits: string) => Promise<string | null>;
  sendCancel: (agreementId: number) => Promise<string | null>;
  sendTransfer: (receiverId: string, amountUnits: string, memo?: string) => Promise<string | null>;
  signNep413Message: (params: { message: string; recipient: string; nonce: Uint8Array }) => Promise<{ accountId: string; publicKey: string; signature: string } | null>;
}

const NearWalletContext = createContext<NearWalletContextType | null>(null);

// Resilient RPC query helper that uses our server-side proxy with fallback
async function queryRpc(methodName: string, argsObj: Record<string, any>): Promise<any | null> {
  const rpcPayload = {
    jsonrpc: "2.0",
    id: `pandem-${methodName}`,
    method: "query",
    params: {
      request_type: "call_function",
      finality: "optimistic",
      account_id: PANDEM_TOKEN_ID,
      method_name: methodName,
      args_base64: typeof window !== "undefined" ? btoa(JSON.stringify(argsObj)) : Buffer.from(JSON.stringify(argsObj)).toString("base64"),
    },
  };

  const endpoints = ["/api/rpc", "https://rpc.testnet.near.org", "https://testnet.neartransaction.com"];

  for (const ep of endpoints) {
    try {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 4000);

      const res = await fetch(ep, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(rpcPayload),
        signal: controller.signal,
      });
      clearTimeout(timer);

      if (!res.ok) continue;
      const json = await res.json();
      if (json?.result?.result) {
        const decoded = JSON.parse(new TextDecoder().decode(new Uint8Array(json.result.result)));
        return decoded;
      }
    } catch {
      // Continue to next fallback
    }
  }
  return null;
}

export function NearWalletProvider({ children }: { children: React.ReactNode }) {
  const [connector, setConnector] = useState<NearConnector | null>(null);
  const [accountId, setAccountId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [tokenBalance, setTokenBalance] = useState<string>("0");
  const [isStorageRegistered, setIsStorageRegistered] = useState<boolean>(true);
  const [walletError, setWalletError] = useState<string | null>(null);

  const clearWalletError = useCallback(() => {
    setWalletError(null);
  }, []);

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
          try {
            const accounts = await w.getAccounts();
            if (accounts.length > 0 && accounts[0].accountId) {
              setAccountId(accounts[0].accountId);
            }
          } catch (e) {
            console.warn("Could not retrieve accounts:", e);
          }
        })
        .catch(() => {})
        .finally(() => setIsLoading(false));

      nc.on("wallet:signIn", async (t: any) => {
        if (t?.accounts?.length > 0) {
          setAccountId(t.accounts[0].accountId);
          setWalletError(null);
        }
      });

      nc.on("wallet:signOut", async () => {
        setAccountId(null);
        setTokenBalance("0");
      });
    } catch (e: any) {
      console.warn("NearConnector init error (handled):", e?.message || e);
      setIsLoading(false);
    }
  }, []);

  // Fetch token balance & storage registration status safely
  const refreshBalances = useCallback(async () => {
    if (!accountId) {
      setTokenBalance("0");
      return;
    }

    try {
      // 1. Query ft_balance_of
      const bal = await queryRpc("ft_balance_of", { account_id: accountId });
      if (bal !== null) {
        setTokenBalance(String(bal));
      }

      // 2. Query storage_balance_of
      const storage = await queryRpc("storage_balance_of", { account_id: accountId });
      setIsStorageRegistered(storage !== null);
    } catch (e: any) {
      // Silently handle RPC issues, never blow up the UI
      console.warn("Balance query warning (fallback engaged):", e?.message || e);
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
      setWalletError(null);
      const wallet = await connector.connect();
      const accounts = await wallet.getAccounts();
      if (accounts.length > 0) {
        setAccountId(accounts[0].accountId);
      }
    } catch (e: any) {
      const msg = e?.message || String(e);
      // Catch common wallet aborts/timeouts gracefully
      if (
        msg.includes("User closed the window") ||
        msg.includes("closed") ||
        msg.includes("Failed to connect to MetaMask") ||
        msg.includes("timed out")
      ) {
        console.warn("Wallet action cancelled by user or timed out:", msg);
        setWalletError("Wallet action cancelled or timed out. Please try again or switch testnet persona.");
      } else {
        console.warn("Connect notice:", msg);
        setWalletError(msg);
      }
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
      setWalletError(null);
    } catch (e: any) {
      console.warn("Disconnect notice:", e?.message || e);
    }
  };

  const setManualAccount = (acc: string) => {
    setAccountId(acc.trim());
    setWalletError(null);
  };

  const registerStorage = async (): Promise<string | null> => {
    if (!connector || !accountId) return null;
    try {
      setWalletError(null);
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
      const msg = e?.message || String(e);
      console.warn("Register storage notice:", msg);
      setWalletError(`Storage deposit notice: ${msg}`);
      return null;
    }
  };

  const claimFaucet = async (): Promise<string | null> => {
    if (!connector || !accountId) return null;
    try {
      setWalletError(null);
      const wallet = await connector.wallet();
      const outcome: any = await wallet.signAndSendTransaction({
        receiverId: PANDEM_TOKEN_ID,
        actions: [
          {
            type: "FunctionCall",
            params: {
              methodName: "faucet",
              args: {},
              gas: "50000000000000", // 50 TGas
              deposit: "0",
            },
          },
        ],
      });
      await refreshBalances();
      return outcome?.transaction?.hash ?? "submitted";
    } catch (e: any) {
      const msg = e?.message || String(e);
      console.warn("Claim faucet notice:", msg);
      setWalletError(`Faucet notice: ${msg}`);
      return null;
    }
  };

  const setupPaymentsBatch = async (): Promise<{ batchTx: string | null; storageTx: string | null; faucetTx: string | null }> => {
    if (!connector || !accountId) return { batchTx: null, storageTx: null, faucetTx: null };
    try {
      setWalletError(null);
      const wallet = await connector.wallet();

      const balBigInt = BigInt(tokenBalance || "0");
      const needsStorage = !isStorageRegistered;
      const needsFaucet = balBigInt < 50000000n; // 50 tUSDC (6 decimals)

      if (!needsStorage && !needsFaucet) {
        return { batchTx: "already_funded", storageTx: "already_registered", faucetTx: "already_funded" };
      }

      const actions: any[] = [];
      if (needsStorage) {
        actions.push({
          type: "FunctionCall",
          params: {
            methodName: "storage_deposit",
            args: { account_id: accountId, registration_only: true },
            gas: "30000000000000", // 30 TGas
            deposit: "1250000000000000000000", // 0.00125 NEAR
          },
        });
      }
      if (needsFaucet) {
        actions.push({
          type: "FunctionCall",
          params: {
            methodName: "faucet",
            args: {},
            gas: "50000000000000", // 50 TGas
            deposit: "0",
          },
        });
      }

      try {
        const outcome: any = await wallet.signAndSendTransaction({
          receiverId: PANDEM_TOKEN_ID,
          actions,
        });
        const txHash = outcome?.transaction?.hash ?? outcome?.transaction_outcome?.id ?? "submitted";
        await refreshBalances();
        return {
          batchTx: txHash,
          storageTx: needsStorage ? txHash : "already_registered",
          faucetTx: needsFaucet ? txHash : "already_funded",
        };
      } catch (batchErr) {
        console.warn("Batch execution fallback to sequential:", batchErr);
        let sTx = null;
        let fTx = null;
        if (needsStorage) {
          sTx = await registerStorage();
        }
        if (needsFaucet) {
          fTx = await claimFaucet();
        }
        await refreshBalances();
        return { batchTx: null, storageTx: sTx, faucetTx: fTx };
      }
    } catch (e: any) {
      const msg = e?.message || String(e);
      console.warn("Setup payments batch error:", msg);
      setWalletError(`Setup payments notice: ${msg}`);
      return { batchTx: null, storageTx: null, faucetTx: null };
    }
  };

  const sendSubscribe = async (
    productId: string,
    periods: number,
    amountYocto: string,
    tierId?: string,
    commitment?: string
  ): Promise<string | null> => {
    if (!connector || !accountId) return null;
    const msg = commitment
      ? JSON.stringify({
          action: "subscribe",
          product_id: productId.toString(),
          commitment,
          tier: tierId || "pro",
          tier_id: tierId || "pro",
          periods,
        })
      : JSON.stringify({
          product_id: productId,
          periods,
          tier_id: tierId || "pro",
          subscriber: accountId,
          refund_to: accountId,
        });

    try {
      setWalletError(null);
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
      const msg = e?.message || String(e);
      console.warn("Subscribe notice:", msg);
      setWalletError(`Subscription notice: ${msg}`);
      return null;
    }
  };

  const sendUpgrade = async (
    agreementId: number,
    targetTier: string,
    amountUnits: string
  ): Promise<string | null> => {
    if (!connector || !accountId) return null;
    const msg = JSON.stringify({
      action: "upgrade",
      agreement_id: agreementId,
      tier: targetTier,
    });

    try {
      setWalletError(null);
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
                amount: amountUnits,
                msg,
              },
              gas: "100000000000000",
              deposit: "1",
            },
          },
        ],
      });
      await refreshBalances();
      return outcome?.transaction?.hash ?? "submitted";
    } catch (e: any) {
      const msg = e?.message || String(e);
      console.warn("Upgrade notice:", msg);
      setWalletError(`Upgrade notice: ${msg}`);
      return null;
    }
  };

  const sendRenew = async (
    agreementId: number,
    periods: number,
    amountUnits: string
  ): Promise<string | null> => {
    if (!connector || !accountId) return null;
    const msg = JSON.stringify({
      action: "renew",
      agreement_id: agreementId,
      periods,
    });

    try {
      setWalletError(null);
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
                amount: amountUnits,
                msg,
              },
              gas: "100000000000000",
              deposit: "1",
            },
          },
        ],
      });
      await refreshBalances();
      return outcome?.transaction?.hash ?? "submitted";
    } catch (e: any) {
      const msg = e?.message || String(e);
      console.warn("Renew notice:", msg);
      setWalletError(`Renew notice: ${msg}`);
      return null;
    }
  };

  const sendCancel = async (agreementId: number): Promise<string | null> => {
    if (!connector || !accountId) return null;
    try {
      setWalletError(null);
      const wallet = await connector.wallet();
      const outcome: any = await wallet.signAndSendTransaction({
        receiverId: PANDEM_ESCROW_ID,
        actions: [
          {
            type: "FunctionCall",
            params: {
              methodName: "cancel",
              args: {
                agreement_id: agreementId,
              },
              gas: "100000000000000",
              deposit: "0",
            },
          },
        ],
      });
      await refreshBalances();
      return outcome?.transaction?.hash ?? "submitted";
    } catch (e: any) {
      const msg = e?.message || String(e);
      console.warn("Cancel notice:", msg);
      setWalletError(`Cancel notice: ${msg}`);
      return null;
    }
  };

  const sendTransfer = async (
    receiverId: string,
    amountUnits: string,
    memo?: string
  ): Promise<string | null> => {
    if (!connector || !accountId) return null;
    try {
      setWalletError(null);
      const wallet = await connector.wallet();
      const outcome: any = await wallet.signAndSendTransaction({
        receiverId: PANDEM_TOKEN_ID,
        actions: [
          {
            type: "FunctionCall",
            params: {
              methodName: "ft_transfer",
              args: {
                receiver_id: receiverId.trim(),
                amount: amountUnits,
                memo: memo || "Transfer via Pandem",
              },
              gas: "50000000000000", // 50 TGas
              deposit: "1",          // 1 yocto
            },
          },
        ],
      });
      await refreshBalances();
      return outcome?.transaction?.hash ?? outcome?.transaction_outcome?.id ?? "submitted";
    } catch (e: any) {
      const msg = e?.message || String(e);
      console.warn("Transfer notice:", msg);
      setWalletError(`Transfer notice: ${msg}`);
      return null;
    }
  };

  const signNep413Message = async (params: {
    message: string;
    recipient: string;
    nonce: Uint8Array;
  }): Promise<{ accountId: string; publicKey: string; signature: string } | null> => {
    if (!connector || !accountId) return null;
    try {
      setWalletError(null);
      const wallet = await connector.wallet();
      if (typeof (wallet as any).signMessage === "function") {
        const res: any = await (wallet as any).signMessage({
          message: params.message,
          recipient: params.recipient,
          nonce: params.nonce,
        });

        const rawSig = res?.signature;
        const sigBase64 =
          typeof rawSig === "string"
            ? rawSig
            : rawSig instanceof Uint8Array || Array.isArray(rawSig)
            ? Buffer.from(rawSig).toString("base64")
            : "";

        return {
          accountId: res?.accountId || accountId,
          publicKey: res?.publicKey || "",
          signature: sigBase64,
        };
      } else {
        throw new Error("Connected wallet does not support NEP-413 signMessage");
      }
    } catch (e: any) {
      const msg = e?.message || String(e);
      console.warn("Sign NEP-413 message notice:", msg);
      setWalletError(`Message signing notice: ${msg}`);
      return null;
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
        walletError,
        clearWalletError,
        connect,
        disconnect,
        setManualAccount,
        refreshBalances,
        registerStorage,
        claimFaucet,
        setupPaymentsBatch,
        sendSubscribe,
        sendUpgrade,
        sendRenew,
        sendCancel,
        sendTransfer,
        signNep413Message,
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
