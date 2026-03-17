export const USDC_ADDRESS = '0x036CbD53842c5426634e7929541eC2318f3dCF7e' as const;

export const GAME_TREASURY = '0x000000000000000000000000000000000000dEaD' as const;

export const USDC_DECIMALS = 6;

export const COST_PER_CLICK = '0.1'; // in USDC

export const SESSION_DURATION = 3600; // 1 hour in seconds

export const SPEND_LIMIT = '2'; // 2 USDC per hour

export const USDC_ABI = [
  {
    name: 'transfer',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [
      { name: 'to', type: 'address' },
      { name: 'amount', type: 'uint256' },
    ],
    outputs: [{ name: '', type: 'bool' }],
  },
  {
    name: 'balanceOf',
    type: 'function',
    stateMutability: 'view',
    inputs: [{ name: 'account', type: 'address' }],
    outputs: [{ name: '', type: 'uint256' }],
  },
] as const;
