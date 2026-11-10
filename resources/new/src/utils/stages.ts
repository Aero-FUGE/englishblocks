import type { LevelData } from '../types/game';

export const LEARNING_STAGES = [
  {tier: 1, label: '初中基础', subtitle: '基础句型 · 日常表达', emoji: '🌿', tone: 'mint', tagline: '从一句话开始，慢慢搭起语感'},
  {tier: 2, label: '高中进阶', subtitle: '从句结构 · 语法突破', emoji: '🌸', tone: 'peach', tagline: '复杂句子也能一点点拆开'},
  {tier: 3, label: '大学英语', subtitle: '四六级 · 长句训练', emoji: '📚', tone: 'sky', tagline: '走进更丰富的表达世界'},
  {tier: 4, label: '考研冲刺', subtitle: '长难句 · 高阶阅读', emoji: '🎓', tone: 'violet', tagline: '挑战结构与逻辑的极限'},
] as const;
export function stageForLevel(level: Pick<LevelData, 'tier'>) {
  return LEARNING_STAGES.find(stage => stage.tier === level.tier) ?? LEARNING_STAGES[3];
}
