'use client';

import type { GameStatus } from '@/lib/types';

interface GamePanelProps {
  status: GameStatus;
  instruction: string;
  onInteract: () => void;
}

export function GamePanel({ status, instruction, onInteract }: GamePanelProps) {
  const isGo = status === 'go';

  return (
    <button
      type="button"
      className={`panel panel-${status}`}
      onClick={onInteract}
      disabled={status === 'idle' || status === 'result'}
      aria-live="polite"
    >
      <span className="panel-title">{isGo ? 'Click now' : 'Reaction panel'}</span>
      <span className="panel-instruction">{instruction}</span>
      {!isGo && <span className="panel-helper">Tap/click here when the round is active.</span>}
    </button>
  );
}
