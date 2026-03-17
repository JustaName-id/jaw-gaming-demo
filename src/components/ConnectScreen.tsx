import { useConnect } from '@jaw.id/wagmi';
import { config } from '../config/wagmi';

export function ConnectScreen() {
  const { mutate: connect, isPending } = useConnect();

  const handleConnect = () => {
    connect({ connector: config.connectors[0] });
  };

  return (
    <div className="screen connect-screen">
      <div className="logo">🎮</div>
      <h2>Arcade Coin Clicker</h2>
      <p className="subtitle">Spend USDC with every click!</p>
      <button
        className="btn btn-primary"
        onClick={handleConnect}
        disabled={isPending}
      >
        {isPending ? 'Connecting...' : 'Sign Up / Login'}
      </button>
    </div>
  );
}
