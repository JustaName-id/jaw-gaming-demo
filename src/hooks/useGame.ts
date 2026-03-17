import { useState, useCallback, useRef } from 'react';
import { Account } from '@jaw.id/core';
import { encodeFunctionData, parseUnits } from 'viem';
import { USDC_ADDRESS, USDC_ABI, GAME_TREASURY, USDC_DECIMALS, COST_PER_CLICK } from '../config/constants';

const DEBOUNCE_MS = 1000;

type JawAccount = Awaited<ReturnType<typeof Account.fromLocalAccount>>;

const transferCall = {
  to: USDC_ADDRESS,
  data: encodeFunctionData({
    abi: USDC_ABI,
    functionName: 'transfer',
    args: [GAME_TREASURY, parseUnits(COST_PER_CLICK, USDC_DECIMALS)],
  }),
};

export function useGame(
  permissionId: `0x${string}` | null,
  accessKeyAccount: JawAccount | null,
) {
  const [clicks, setClicks] = useState(0);
  const [pendingTxs, setPendingTxs] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [txConfirmed, setTxConfirmed] = useState(0);

  const pendingClicksRef = useRef(0);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>(undefined);

  const flushClicks = useCallback(async () => {
    if (!permissionId || !accessKeyAccount || pendingClicksRef.current === 0) return;

    const count = pendingClicksRef.current;
    pendingClicksRef.current = 0;
    setPendingTxs((p) => p + 1);

    try {
      // Build one call per click — they batch atomically
      const calls = Array.from({ length: count }, () => transferCall);

      const { id } = await accessKeyAccount.sendCalls(calls, { permissionId });

      // Poll in background
      let status = accessKeyAccount.getCallStatus(id);
      while (!status || status.status === 100) {
        await new Promise((r) => setTimeout(r, 1000));
        status = accessKeyAccount.getCallStatus(id);
      }

      setPendingTxs((p) => p - 1);
      if (status?.status === 200) {
        setTxConfirmed((c) => c + 1);
      } else {
        setError(`Transaction failed (status: ${status?.status})`);
      }
    } catch (err) {
      // Revert optimistic clicks
      setClicks((c) => c - count);
      setPendingTxs((p) => p - 1);
      setError(err instanceof Error ? err.message : 'Transaction failed');
    }
  }, [permissionId, accessKeyAccount]);

  const handleClick = useCallback(() => {
    if (!permissionId || !accessKeyAccount) return;
    setError(null);

    // Optimistically count the click
    pendingClicksRef.current += 1;
    setClicks((c) => c + 1);

    // Debounce — flush after user stops clicking
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(flushClicks, DEBOUNCE_MS);
  }, [permissionId, accessKeyAccount, flushClicks]);

  return { clicks, pendingTxs, error, txConfirmed, handleClick };
}
