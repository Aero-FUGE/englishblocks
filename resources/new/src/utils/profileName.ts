export const DEFAULT_PLAYER_NAME = '小小拼句家';

// Replace the name shipped with early versions without touching learning data.
export function normalizePlayerName(name: unknown): string {
  return typeof name === 'string' && name.trim() && name.trim() !== '浮歌'
    ? name.trim() : DEFAULT_PLAYER_NAME;
}
