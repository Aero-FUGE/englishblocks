import {strict as assert} from 'node:assert';
import {formatTime,recordLevelTime,timeBonusFor,SPEED_MILESTONES} from '../src/utils/timing.ts';
assert.equal(SPEED_MILESTONES.length,4);
assert.equal(formatTime(0),'00:00');
assert.equal(formatTime(59_990),'00:59');
assert.equal(formatTime(60_001),'01:00');
assert.equal(formatTime(5*60_000),'05:00');
for (const [ms,expected] of [
  [0,6],[60_000,6],[60_001,4],[120_000,4],[120_001,2],
  [180_000,2],[180_001,1],[300_000,1],[300_001,0],[900_000,0]
]) assert.equal(timeBonusFor(ms),expected,`speed bonus for ${ms}`);
assert.equal(timeBonusFor(-1),0);assert.equal(timeBonusFor(Number.NaN),0);
const first = recordLevelTime(undefined, 91_000, false, 100);
assert.equal(first.speedReward,4);
assert.equal(first.isPersonalBest,true);
assert.equal(first.record.bestMs,91_000);
assert.equal(first.record.awardedSpeedBonus,4);
const replaySlower=recordLevelTime(first.record,105_000,false,101);
assert.equal(replaySlower.speedReward,0,'cannot farm reward by replaying same tier');
assert.equal(replaySlower.isPersonalBest,false);
assert.equal(replaySlower.record.bestMs,91_000);
const fasterSameTier=recordLevelTime(replaySlower.record,80_000,false,102);
assert.equal(fasterSameTier.isPersonalBest,true,'PB celebrated even without new fish');
assert.equal(fasterSameTier.speedReward,0);
const fasterTier=recordLevelTime(fasterSameTier.record,58_000,false,103);
assert.equal(fasterTier.speedReward,2,'crossing from 4 to 6 rewards only the difference');
assert.equal(fasterTier.record.bestMs,58_000);
const assisted=recordLevelTime(fasterTier.record,10_000,true,104);
assert.equal(assisted.speedReward,0,'full answer cannot get time reward');
assert.equal(assisted.isPersonalBest,false,'full answer cannot set PB');
assert.equal(assisted.record.bestMs,58_000);
assert.equal(assisted.record.independentClears,4);
const clone=JSON.parse(JSON.stringify(assisted.record));
assert.equal(clone.bestMs,58_000,'records survive JSON backup roundtrip');
assert.equal(recordLevelTime(undefined,301_000,false).speedReward,0,'over five minutes gives no bonus');
console.log('PASS: timer boundaries, formatting, PB, no fish farming, assisted answer excluded, JSON recovery');
