import { createConfig, http } from 'wagmi';
import { baseSepolia } from 'wagmi/chains';
import { jaw } from '@jaw.id/wagmi';

export const jawConnector = jaw({
  apiKey: import.meta.env.VITE_JAW_API_KEY,
  appName: 'Arcade Coin Clicker',
  defaultChainId: 84532,
  ens: import.meta.env.VITE_ENS_DOMAIN,
  preference: {
    showTestnets: true,
  },
});

export const config = createConfig({
  chains: [baseSepolia],
  connectors: [jawConnector],
  transports: {
    [baseSepolia.id]: http(),
  },
});
