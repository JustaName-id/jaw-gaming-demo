import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { WagmiProvider } from 'wagmi';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { JustaNameProvider } from '@justaname.id/react';
import { config } from './config/wagmi';
import App from './App';
import './index.css';

const queryClient = new QueryClient();

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        <JustaNameProvider config={{
          ensDomains: [{
            chainId: 1,
            ensDomain: import.meta.env.VITE_ENS_DOMAIN,
            apiKey: import.meta.env.VITE_JAW_API_KEY,
          }],
          networks: [{
            chainId: 1,
            providerUrl: 'https://eth.llamarpc.com',
          }],
        }}>
          <App />
        </JustaNameProvider>
      </QueryClientProvider>
    </WagmiProvider>
  </StrictMode>,
);
