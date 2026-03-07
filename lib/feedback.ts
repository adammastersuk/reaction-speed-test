export function getPerformanceMessage(reactionTimeMs: number): string {
  if (reactionTimeMs < 200) return 'Excellent focus and reaction speed.';
  if (reactionTimeMs < 300) return 'Very good response time.';
  if (reactionTimeMs < 400) return 'Solid timing. Keep sharpening it.';
  return 'Room to improve. Stay relaxed and try again.';
}
