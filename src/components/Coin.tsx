interface CoinProps {
  onClick: () => void;
  disabled: boolean;
}

export function Coin({ onClick, disabled }: CoinProps) {
  return (
    <button
      className={`coin ${disabled ? 'coin-disabled' : ''}`}
      onClick={onClick}
      disabled={disabled}
    >
      <span className="coin-face">$</span>
    </button>
  );
}
