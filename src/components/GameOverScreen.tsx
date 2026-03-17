interface GameOverScreenProps {
  clicks: number;
  onNewSession: () => void;
}

export function GameOverScreen({ clicks, onNewSession }: GameOverScreenProps) {
  return (
    <div className="screen gameover-screen">
      <h2>Game Over!</h2>
      <p className="final-score">You clicked {clicks} times</p>
      <button className="btn btn-primary" onClick={onNewSession}>
        New Session
      </button>
    </div>
  );
}
