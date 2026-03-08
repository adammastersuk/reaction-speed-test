'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { GamePanel } from '@/components/GamePanel';
import { Leaderboard } from '@/components/Leaderboard';
import { ResultCard } from '@/components/ResultCard';
import { getPerformanceMessage } from '@/lib/feedback';
import type {
  ApiErrorResponse,
  GameStatus,
  LeaderboardAvailability,
  LeaderboardResponse,
  LeaderboardScore,
} from '@/lib/types';

const MIN_DELAY_MS = 1400;
const MAX_DELAY_MS = 3600;
const THEME_STORAGE_KEY = 'rst-theme';

type ThemeMode = 'light' | 'dark';

function randomDelay() {
  return Math.floor(Math.random() * (MAX_DELAY_MS - MIN_DELAY_MS + 1)) + MIN_DELAY_MS;
}

function getThemeFromDocument(): ThemeMode {
  if (typeof document === 'undefined') {
    return 'light';
  }

  return document.documentElement.dataset.theme === 'dark' ? 'dark' : 'light';
}

function isTypingTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) {
    return false;
  }

  if (target.isContentEditable) {
    return true;
  }

  const tagName = target.tagName.toLowerCase();
  return tagName === 'input' || tagName === 'textarea' || tagName === 'select';
}

export default function HomePage() {
  const [theme, setTheme] = useState<ThemeMode>('light');
  const [status, setStatus] = useState<GameStatus>('idle');
  const [reactionTimeMs, setReactionTimeMs] = useState<number | null>(null);
  const [showLeaderboard, setShowLeaderboard] = useState(true);
  const [scores, setScores] = useState<LeaderboardScore[]>([]);
  const [leaderboardAvailability, setLeaderboardAvailability] = useState<LeaderboardAvailability>('not_configured');
  const [leaderboardLabel, setLeaderboardLabel] = useState("Today's Top 5");
  const [leaderboardTimeZone, setLeaderboardTimeZone] = useState('UTC');
  const [scoresLoading, setScoresLoading] = useState(false);
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

    try {
      const response = await fetch('./api/scores', { method: 'GET' });
      const payload = (await response.json()) as LeaderboardResponse;
      setLeaderboardAvailability(payload.availability ?? 'unavailable');
      setLeaderboardLabel(payload.leaderboardLabel ?? "Today's Top 5");
      setLeaderboardTimeZone(payload.timeZone ?? 'UTC');
      setScores(payload.scores ?? []);
    } catch {
      setLeaderboardAvailability('unavailable');
      setScores([]);
    } finally {
      setScoresLoading(false);
    }
  }, []);

  useEffect(() => {
    setTheme(getThemeFromDocument());
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
    }
  }, [clearRoundTimer, status]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.code !== 'Space') {
        return;
      }

      if (isTypingTarget(event.target)) {
        return;
      }

      if (status === 'waiting' || status === 'go') {
        event.preventDefault();
        if (!event.repeat) {
          handlePanelInteract();
        }
      }
    };

    window.addEventListener('keydown', onKeyDown);
    return () => {
      window.removeEventListener('keydown', onKeyDown);
    };
  }, [handlePanelInteract, status]);

  const toggleTheme = useCallback(() => {
    const nextTheme: ThemeMode = theme === 'dark' ? 'light' : 'dark';
    document.documentElement.dataset.theme = nextTheme;
    localStorage.setItem(THEME_STORAGE_KEY, nextTheme);
    setTheme(nextTheme);
  }, [theme]);

  const instruction = useMemo(() => {
    switch (status) {
      case 'idle':
        return 'Press Start Test to begin your first round.';
      case 'waiting':
        return 'Wait for green. Clicking or pressing Space too early counts as too soon.';
      case 'go':
        return 'Go. Tap, click, or press Space immediately.';
      case 'result':
        return 'Round complete. Review your result and run another test.';
      case 'tooSoon':
        return 'Too soon. Start another round and wait for green.';
      default:
        return '';
    }
  }, [status]);

  const submitScore = useCallback(async () => {
    if (!reactionTimeMs || leaderboardAvailability !== 'ready' || submitLoading) {
      return;
    }

    setSubmitLoading(true);
    setSubmitMessage(null);

    try {
      const response = await fetch('./api/scores', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          reactionTimeMs,
        }),
      });

      const payload = (await response.json()) as ApiErrorResponse;

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
  }, [leaderboardAvailability, loadScores, name, reactionTimeMs, submitLoading]);

  const canSubmit =
    status === 'result' &&
    leaderboardAvailability === 'ready' &&
    reactionTimeMs !== null &&
    name.trim().length >= 2 &&
    name.trim().length <= 24;

  return (
    <main className="page">
      <div className="container">
        <div className="top-bar">
          <a className="back-link" href="https://builds.adammasters.co.uk">
            ← Back to Builds
          </a>
          <button type="button" className="secondary-btn theme-toggle" onClick={toggleTheme}>
            {theme === 'dark' ? 'Light mode' : 'Dark mode'}
          </button>
        </div>

        <header className="header">
          <h1>Reaction Speed Test</h1>
          <p>Measure your click/tap response time with a clean one-step test.</p>
        </header>

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
            <div className="result-stack">
              <ResultCard reactionTimeMs={reactionTimeMs} feedback={getPerformanceMessage(reactionTimeMs)} />

              {leaderboardAvailability === 'ready' && (
                <section className="submit-card">
                  <label htmlFor="display-name">Save this result</label>
                  <div className="submit-row">
                    <input
                      id="display-name"
                      name="display-name"
                      value={name}
                      onChange={(event) => setName(event.target.value)}
                      placeholder="Display name"
                      maxLength={24}
                      autoComplete="nickname"
                    />
                    <button type="button" className="primary-btn" disabled={!canSubmit || submitLoading} onClick={submitScore}>
                      {submitLoading ? 'Submitting…' : 'Submit Score'}
                    </button>
                  </div>
                  <p className="muted">Submitted score always matches the result above: {reactionTimeMs} ms.</p>
                  {submitMessage && <p className="muted">{submitMessage}</p>}
                </section>
              )}
            </div>
          )}

          {status === 'tooSoon' && (
            <section className="too-soon-card" role="status">
              <strong>Too soon</strong>
              <p>You reacted before the signal turned green. Reset and try again.</p>
            </section>
          )}
        </section>

        <section className="leaderboard-wrap">
          <div className="actions-top">
            <button
              type="button"
              className="secondary-btn"
              onClick={() => setShowLeaderboard((value) => !value)}
              aria-expanded={showLeaderboard}
              aria-controls="leaderboard-section"
            >
              {showLeaderboard ? 'Hide Today’s Top 5' : 'Show Today’s Top 5'}
            </button>
          </div>

          {showLeaderboard && (
            <div id="leaderboard-section">
              <Leaderboard
                availability={leaderboardAvailability}
                loading={scoresLoading}
                scores={scores}
                title={leaderboardLabel}
                timeZone={leaderboardTimeZone}
              />
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
