/**
 * Time-based ping-pong sweep: 0 -> 100 -> 0 over sweepMs milliseconds.
 * The displayed marker and the tap use the same formula, independent of RAF
 * frequency. Large frame gaps do not slow the meter or get trapped at edges.
 */
export function meterValueAtTime(startMs, nowMs, sweepMs) {
  if (![startMs, nowMs, sweepMs].every(Number.isFinite) || sweepMs <= 0) return 0;
  const elapsed = Math.max(0, nowMs - startMs);
  const position = (elapsed % sweepMs) / sweepMs;
  return 100 * (position <= 0.5 ? 2 * position : 2 * (1 - position));
}
