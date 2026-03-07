'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { GamePanel } from '@/components/GamePanel';
import { Leaderboard } from '@/components/Leaderboard';
import { ResultCard } from '@/components/ResultCard';
import { getPerformanceMessage } from '@/lib/feedback';
import type { GameStatus, LeaderboardScore } from '@/lib/types';

const MIN_DELAY_MS = 1400;
const MAX_DELAY_MS = 3600;

function randomDelay() {
  return Math.floor(Math.random() * (MAX_DELAY_MS - MIN_DELAY_MS + 1)) + MIN_DELAY_MS;
}

export default function HomePage() {
  const [status, setStatus] = useState<GameStatus>('idle');
  const [reactionTimeMs, setReactionTimeMs] = useState<number | null>(null);
  const [showLeaderboard, setShowLeaderboard] = useState(false);
  const [leaderboardEnabled, setLeaderboardEnabled] = useState(false);
  const [scores, setScores] = useState<LeaderboardScore[]>([]);
  const [scoresLoading, setScoresLoading] = useState(false);
  const [scoresError, setScoresError] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [submitLoading, setSubmitLoading] = useState(false);
  const [submitMessage, setSubmitMessage] = useState<string | null>(null);

  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const goAtRef = useRef<number | null>(null);
  const roundIdRef = useRef(0);

  const clearRoundTimer = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const loadScores = useCallback(async () => {
    setScoresLoading(true);
    setScoresError(null);

    try {
      const response = await fetch('/api/scores', { method: 'GET' });
      const payload = (await response.json()) as {
        enabled: boolean;
        scores: LeaderboardScore[];
      };
      setLeaderboardEnabled(payload.enabled);
      setScores(payload.scores ?? []);
    } catch {
      setScoresError('Could not load leaderboard right now.');
    } finally {
      setScoresLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadScores();
  }, [loadScores]);

  useEffect(() => {
    return () => {
      clearRoundTimer();
    };
  }, [clearRoundTimer]);

  const startRound = useCallback(() => {
    clearRoundTimer();
    roundIdRef.current += 1;

    setStatus('waiting');
    setReactionTimeMs(null);
    setSubmitMessage(null);

    const localRoundId = roundIdRef.current;
    timerRef.current = setTimeout(() => {
      if (localRoundId !== roundIdRef.current) {
        return;
      }

      goAtRef.current = performance.now();
      setStatus('go');
      timerRef.current = null;
    }, randomDelay());
  }, [clearRoundTimer]);

  const handlePanelInteract = useCallback(() => {
    if (status === 'waiting') {
      clearRoundTimer();
      goAtRef.current = null;
      setReactionTimeMs(null);
      setStatus('tooSoon');
      return;
    }

    if (status === 'go' && goAtRef.current) {
      const elapsed = Math.max(1, Math.round(performance.now() - goAtRef.current));
      setReactionTimeMs(elapsed);
      setStatus('result');
      return;
    }
  }, [clearRoundTimer, status]);

  const instruction = useMemo(() => {
    switch (status) {
      case 'idle':
        return 'Press Start Test to begin your first round.';
      case 'waiting':
        return 'Wait for green… clicking now counts as too soon.';
      case 'go':
        return 'Go. Tap or click immediately.';
      case 'result':
        return 'Round complete. Review your result and run another test.';
      case 'tooSoon':
        return 'Too soon. Start another round and wait for green.';
      default:
        return '';
    }
  }, [status]);

  const submitScore = useCallback(async () => {
    if (!reactionTimeMs || !leaderboardEnabled || submitLoading) {
      return;
    }

    setSubmitLoading(true);
    setSubmitMessage(null);

    try {
      const response = await fetch('/api/scores', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          reactionTimeMs,
        }),
      });

      const payload = (await response.json()) as { message?: string };

      if (!response.ok) {
        setSubmitMessage(payload.message ?? 'Could not submit score.');
        return;
      }

      setSubmitMessage('Score submitted.');
      setName('');
      void loadScores();
    } catch {
      setSubmitMessage('Could not submit score right now.');
    } finally {
      setSubmitLoading(false);
    }
  }, [leaderboardEnabled, loadScores, name, reactionTimeMs, submitLoading]);

  const canSubmit =
    status === 'result' &&
    leaderboardEnabled &&
    reactionTimeMs !== null &&
    name.trim().length >= 2 &&
    name.trim().length <= 24;

  return (
    <main className="page">
      <div className="container">
        <header className="header">
          <h1>Reaction Speed Test</h1>
          <p>Measure your click/tap response time with a clean one-step test.</p>
        </header>

        <div className="actions-top">
          <button type="button" className="secondary-btn" onClick={() => setShowLeaderboard((v) => !v)}>
            {showLeaderboard ? 'Hide Leaderboard' : 'View Leaderboard'}
          </button>
        </div>

        <section className="game-card">
          <div className="status-row">
            <p className="instruction">{instruction}</p>
            {(status === 'idle' || status === 'result' || status === 'tooSoon') && (
              <button type="button" className="primary-btn" onClick={startRound}>
                {status === 'idle' ? 'Start Test' : 'Try Again'}
              </button>
            )}
          </div>

          <GamePanel status={status} instruction={instruction} onInteract={handlePanelInteract} />

          {status === 'result' && reactionTimeMs !== null && (
            <>
              <ResultCard reactionTimeMs={reactionTimeMs} feedback={getPerformanceMessage(reactionTimeMs)} />

              {leaderboardEnabled && (
                <section className="submit-card">
                  <label htmlFor="display-name">Display name</label>
                  <div className="submit-row">
                    <input
                      id="display-name"
                      name="display-name"
                      value={name}
                      onChange={(event) => setName(event.target.value)}
                      placeholder="Your name"
                      maxLength={24}
                      autoComplete="nickname"
                    />
                    <button type="button" className="primary-btn" disabled={!canSubmit || submitLoading} onClick={submitScore}>
                      {submitLoading ? 'Submitting…' : 'Submit Score'}
                    </button>
                  </div>
                  <p className="muted">Your submitted score always matches the displayed result: {reactionTimeMs} ms.</p>
                  {submitMessage && <p className="muted">{submitMessage}</p>}
                </section>
              )}
            </>
          )}

          {status === 'tooSoon' && (
            <section className="too-soon-card" role="status">
              <strong>Too soon</strong>
              <p>You clicked before the signal turned green.</p>
            </section>
          )}
        </section>

        {showLeaderboard && (
          <Leaderboard enabled={leaderboardEnabled} loading={scoresLoading} error={scoresError} scores={scores} />
        )}
      </div>
    </main>
  );
}
