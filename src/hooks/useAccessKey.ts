import { useState, useCallback } from 'react';
import { generatePrivateKey, privateKeyToAccount } from 'viem/accounts';
import { Account } from '@jaw.id/core';

const STORAGE_KEY = 'AccessKeys';

const paymasterUrl = import.meta.env.VITE_PAYMASTER_URL;

const accountConfig = {
  chainId: 84532,
  apiKey: import.meta.env.VITE_JAW_API_KEY,
  paymasterUrl,
};

export function useAccessKey() {
  const [account, setAccount] = useState<Awaited<ReturnType<typeof Account.fromLocalAccount>> | null>(null);
  const [isCreating, setIsCreating] = useState(false);

  const createAccessKey = useCallback(async () => {
    setIsCreating(true);
    try {
      const privateKey = generatePrivateKey();
      localStorage.setItem(STORAGE_KEY, privateKey);
      const localAccount = privateKeyToAccount(privateKey);
      const jawAccount = await Account.fromLocalAccount(accountConfig, localAccount);
      setAccount(jawAccount);
      return jawAccount;
    } finally {
      setIsCreating(false);
    }
  }, []);

  return { account, isCreating, createAccessKey };
}
