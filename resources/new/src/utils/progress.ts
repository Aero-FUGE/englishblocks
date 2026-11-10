import type { LevelData, UserProfile } from '../types/game';

/**
 * V7 stored completedLevelIds but never advanced currentLevelIndex (always zero).
 * For old saves infer the next lesson after the furthest completed lesson.
 * V8 saves an explicit cursor and should preserve manually selected lessons.
 */
export function resumeLevelIndex(profile: Pick<UserProfile, 'currentLevelIndex' | 'completedLevelIds' | 'progressVersion'>, levels: Pick<LevelData, 'id'>[]): number {
  if (!levels.length) return 0;
  const raw = profile.currentLevelIndex;
  const storedIndex = Number.isInteger(raw) && raw >= 0 && raw < levels.length ? raw : 0;
  if (profile.progressVersion === 3) return storedIndex;
  // Older V8 saves sometimes pinned the cursor to LEVEL 1 even after many clears.
  // For migration, completed levels are authoritative when the stored cursor is stale.
  const finished = new Set(Array.isArray(profile.completedLevelIds) ? profile.completedLevelIds : []);
  const furthest = levels.reduce((latest, level, index) => finished.has(level.id) ? index : latest, -1);
  if (profile.progressVersion === 2 && furthest >= storedIndex && finished.has(levels[storedIndex].id)) {
    const next = levels.findIndex((lvl, i) => i > furthest && !finished.has(lvl.id));
    return next >= 0 ? next : levels.length - 1;
  }
  if (profile.progressVersion === 2) return storedIndex;

  const completed = new Set(Array.isArray(profile.completedLevelIds) ? profile.completedLevelIds : []);
  if (!completed.size) return storedIndex;
  // When importing legacy data from V7, index 0 did not mean the user was on level one.
  const latestCompletedIndex = levels.reduce((latest, level, index) => completed.has(level.id) ? index : latest, -1);
  if (latestCompletedIndex < 0) return storedIndex;
  // Preserve an explicit legacy cursor only if it is ahead of completed progress.
  if (storedIndex > latestCompletedIndex && !completed.has(levels[storedIndex].id)) return storedIndex;
  for (let i = latestCompletedIndex + 1; i < levels.length; i++) {
    if (!completed.has(levels[i].id)) return i;
  }
  // If an old save has all lessons completed, keep the final lesson accessible.
  return Math.max(0, levels.findIndex(level => !completed.has(level.id)) === -1 ? levels.length - 1 : levels.findIndex(level => !completed.has(level.id)));
}
