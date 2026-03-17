import { useState, useEffect } from 'react';
import { useAccount, useReadContract } from 'wagmi';
import { formatUnits } from 'viem';
import { Account } from '@jaw.id/core';
import { Coin } from './Coin';
import { useGame } from '../hooks/useGame';
import { USDC_ADDRESS, USDC_ABI, USDC_DECIMALS } from '../config/constants';

type JawAccount = Awaited<ReturnType<typeof Account.fromLocalAccount>>;

interface GameScreenProps {
  permissionId: `0x${string}`;
  accessKeyAccount: JawAccount;
  sessionExpiry: number;
  onSessionExpired: (clicks: number) => void;
}

export function GameScreen({ permissionId, accessKeyAccount, sessionExpiry, onSessionExpired }: GameScreenProps) {
  const { address } = useAccount();
  const { clicks, pendingTxs, error, txConfirmed, handleClick } = useGame(permissionId, accessKeyAccount);
  const [timeLeft, setTimeLeft] = useState('');

  const { data: balance, refetch: refetchBalance } = useReadContract({
    address: USDC_ADDRESS,
    abi: USDC_ABI,
    functionName: 'balanceOf',
    args: address ? [address] : undefined,
    query: { enabled: !!address },
  });

  // Refresh balance after each confirmed tx
  useEffect(() => {
    if (txConfirmed > 0) {
      refetchBalance();
    }
  }, [txConfirmed, refetchBalance]);

  // Check for zero balance -> game over
  useEffect(() => {
    if (balance !== undefined && (balance as bigint) === 0n) {
      onSessionExpired(clicks);
    }
  }, [balance, clicks, onSessionExpired]);

  // Countdown timer
  useEffect(() => {
    const tick = () => {
      const remaining = sessionExpiry - Math.floor(Date.now() / 1000);
      if (remaining <= 0) {
        onSessionExpired(clicks);
        return;
      }
      const mins = Math.floor(remaining / 60);
      const secs = remaining % 60;
      setTimeLeft(`${mins}:${secs.toString().padStart(2, '0')}`);
    };

    tick();
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, [sessionExpiry, clicks, onSessionExpired]);

  const displayBalance = balance !== undefined
    ? formatUnits(balance as bigint, USDC_DECIMALS)
    : '...';

  return (
    <div className="screen game-screen">
      <div className="game-hud">
        <div className="hud-item">
          <span className="hud-label">Balance</span>
          <span className="hud-value">{displayBalance} USDC</span>
        </div>
        <div className="hud-item">
          <span className="hud-label">Clicks</span>
          <span className="hud-value">{clicks}</span>
        </div>
        <div className="hud-item">
          <span className="hud-label">Time Left</span>
          <span className="hud-value">{timeLeft}</span>
        </div>
      </div>

      <Coin onClick={handleClick} disabled={false} />

      {pendingTxs > 0 && <p className="status">{pendingTxs} tx pending...</p>}
      {error && <p className="status error">{error}</p>}
      <p className="hint">Click the coin! Each click costs 0.1 USDC</p>
    </div>
  );
}
