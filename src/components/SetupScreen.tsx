import { useAccount } from 'wagmi';
import { useGrantPermissions } from '@jaw.id/wagmi';
import { Account } from '@jaw.id/core';
import { parseUnits } from 'viem';
import { useReverseResolve } from '@justaname.id/react';
import { useAccessKey } from '../hooks/useAccessKey';
import {
  USDC_ADDRESS,
  SESSION_DURATION,
  SPEND_LIMIT,
  USDC_DECIMALS,
} from '../config/constants';

type JawAccount = Awaited<ReturnType<typeof Account.fromLocalAccount>>;

interface SetupScreenProps {
  onPermissionGranted: (permissionId: `0x${string}`, expiry: number, account: JawAccount) => void;
}

export function SetupScreen({ onPermissionGranted }: SetupScreenProps) {
  const { address } = useAccount();
  const { ensName, isReverseResolveLoading } = useReverseResolve({ address });
  const { isCreating, createAccessKey } = useAccessKey();
  const { mutate: grant, isPending: isGranting } = useGrantPermissions();

  const handleGetStarted = async () => {
    const jawAccount = await createAccessKey();
    const expiry = Math.floor(Date.now() / 1000) + SESSION_DURATION;

    grant({
      expiry,
      spender: jawAccount.address,
      permissions: {
        calls: [{
          target: USDC_ADDRESS,
          functionSignature: 'transfer(address,uint256)',
        }],
        spends: [{
          token: USDC_ADDRESS,
          allowance: parseUnits(SPEND_LIMIT, USDC_DECIMALS).toString(),
          unit: 'hour',
        }],
      },
    }, {
      onSuccess: (data) => {
        onPermissionGranted(data.permissionId, expiry, jawAccount);
      },
    });
  };

  const isLoading = isCreating || isGranting;

  return (
    <div className="screen setup-screen">
      <h2>Welcome!</h2>
      <p className="gamer-tag">
        {isReverseResolveLoading
          ? 'Loading...'
          : ensName || `${address?.slice(0, 6)}...${address?.slice(-4)}`}
      </p>
      <p className="info">
        Grant a session to play. Each click costs 0.1 USDC.
        Sessions last 1 hour with a 2 USDC limit.
      </p>
      <button
        className="btn btn-primary"
        onClick={handleGetStarted}
        disabled={isLoading}
      >
        {isCreating ? 'Creating session key...' : isGranting ? 'Granting permission...' : 'Get Started'}
      </button>
    </div>
  );
}
