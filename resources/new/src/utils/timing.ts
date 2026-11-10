/** Stopwatch rewards are once per milestone per level, not farmable on replay. */
export interface LevelTimeRecord {
  bestMs?: number;
  lastMs: number;
  independentClears: number;
  totalMs: number;
  /** Largest speed milestone rewarded for this level. */
  awardedSpeedBonus: number;
  lastWasAssisted?: boolean;
  bestAt?: number;
}
export const SPEED_MILESTONES = [
  {maxMs: 60_000, bonus: 6, label: '1 分钟冲刺'},
  {maxMs: 120_000, bonus: 4, label: '2 分钟快手'},
  {maxMs: 180_000, bonus: 2, label: '3 分钟稳稳过'},
  {maxMs: 300_000, bonus: 1, label: '5 分钟内完成'},
] as const;

export function timeBonusFor(elapsedMs: number): number {
  if (!Number.isFinite(elapsedMs) || elapsedMs < 0) return 0;
  return SPEED_MILESTONES.find(tier => elapsedMs <= tier.maxMs)?.bonus ?? 0;
}
export function formatTime(durationMs: number): string {
  const seconds = Math.floor(Math.max(0, durationMs) / 1000);
  const minutes = Math.floor(seconds / 60);
  return `${String(minutes).padStart(2, '0')}:${String(seconds % 60).padStart(2, '0')}`;
}
export function recordLevelTime(previous: LevelTimeRecord | undefined, elapsedMs: number, assisted: boolean, timestamp = Date.now()) {
  const elapsed = Math.max(0, Math.round(elapsedMs));
  const priorBonus = previous?.awardedSpeedBonus ?? 0;
  const isPersonalBest = !assisted && (previous?.bestMs === undefined || elapsed < previous.bestMs);
  const milestone = assisted ? 0 : timeBonusFor(elapsed);
  const speedReward = assisted ? 0 : Math.max(0, milestone - priorBonus);
  const record: LevelTimeRecord = {
    bestMs: isPersonalBest ? elapsed : previous?.bestMs,
    lastMs: elapsed,
    independentClears: (previous?.independentClears ?? 0) + (assisted ? 0 : 1),
    totalMs: (previous?.totalMs ?? 0) + elapsed,
    awardedSpeedBonus: Math.max(priorBonus, milestone),
    lastWasAssisted: assisted,
    bestAt: isPersonalBest ? timestamp : previous?.bestAt,
  };
  return {record, speedReward, isPersonalBest, milestone};
}
