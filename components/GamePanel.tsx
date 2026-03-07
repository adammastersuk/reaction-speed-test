'use client';

import type { GameStatus } from '@/lib/types';

interface GamePanelProps {
  status: GameStatus;
  instruction: string;
  onInteract: () => void;
}

const stateTitle: Record<GameStatus, string> = {
  idle: 'Ready',
  waiting: 'Stand by',
  go: 'GO',
  tooSoon: 'Too soon',
  result: 'Round complete',
};

const stateHint: Record<GameStatus, string> = {
  idle: 'Start a round to activate the panel.',
  waiting: 'Wait for green before tapping.',
  go: 'Tap/click immediately.',
  tooSoon: 'You reacted before the signal.',
  result: 'Run another round when ready.',
};

export function GamePanel({ status, instruction, onInteract }: GamePanelProps) {
  return (
    <button
      type="button"
      className={`panel panel-${status}`}
      onClick={onInteract}
      disabled={status === 'idle' || status === 'result'}
      aria-live="polite"
    >
      <span className="panel-content">
        <span className="panel-kicker">{stateTitle[status]}</span>
        <span className="panel-instruction">{instruction}</span>
        <span className="panel-helper">{stateHint[status]}</span>
      </span>
    </button>
  );
}
