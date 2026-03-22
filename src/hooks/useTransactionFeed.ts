/**
 * Real-Time Transaction Feed Hook
 * Uses WebSocket for live transaction updates
 */

'use client';

import { useEffect, useState, useCallback } from 'react';
import {
  backendWebSocket,
  WEBSOCKET_CHANNELS,
  type WebSocketMessage,
} from '@/lib/websocket/manager';

export interface Transaction {
  id: string;
  timestamp: string;
  type: string;
  amount: number;
  currency: string;
  from?: string;
  to?: string;
  status: 'SUCCESS' | 'FAILED' | 'PENDING';
  failureReason?: string;
}

export interface UseTransactionFeedResult {
  transactions: Transaction[];
  isConnected: boolean;
  addTransaction: (transaction: Transaction) => void;
  clearTransactions: () => void;
}

export function useTransactionFeed(
  maxTransactions: number = 50
): UseTransactionFeedResult {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isConnected, setIsConnected] = useState<boolean>(false);

  useEffect(() => {
    if (!backendWebSocket.isConnected()) {
      backendWebSocket.connect();
    }

    setIsConnected(backendWebSocket.isConnected());

    const handleTransaction = (data: Transaction) => {
      setTransactions((prev) => {
        const newTransactions = [data, ...prev].slice(0, maxTransactions);
        return newTransactions;
      });
    };

    const unsubscribe = backendWebSocket.subscribe<Transaction>(
      WEBSOCKET_CHANNELS.TRANSACTIONS,
      handleTransaction
    );

    const connectionCheckInterval = setInterval(() => {
      setIsConnected(backendWebSocket.isConnected());
    }, 5000);

    return () => {
      unsubscribe();
      clearInterval(connectionCheckInterval);
    };
  }, [maxTransactions]);

  const addTransaction = useCallback((transaction: Transaction) => {
    setTransactions((prev) => [transaction, ...prev].slice(0, maxTransactions));
  }, [maxTransactions]);

  const clearTransactions = useCallback(() => {
    setTransactions([]);
  }, []);

  return {
    transactions,
    isConnected,
    addTransaction,
    clearTransactions,
  };
}
