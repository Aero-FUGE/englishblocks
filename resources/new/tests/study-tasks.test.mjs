import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';
import {studyDay,studyWeek,recordStudyTask,taskSummary} from '../src/utils/studyTasks.ts';
import {fillOneEmptyAnswer,filledAnswerBoard} from '../src/utils/answer.ts';
import {phraseHints}from '../src/utils/phraseHints.ts';
import {validSnapshot}from '../shared/snapshot.mjs';
const levels=JSON.parse(fs.readFileSync(new URL('../src/data/allLevels.json',import.meta.url)));
const monday=Date.parse('2026-11-09T03:00:00Z');
test('daily/weekly awards stack once; duplicate submits, reload, day/week rollover and timezone',()=>{
 let progress,fish=0;
 for(let i=1;i<=20;i++){const r=recordStudyTask(progress,i,monday);progress=r.progress;fish+=r.fish;assert.equal(recordStudyTask(progress,i,monday).fish,0);}
 assert.equal(fish,85);assert.equal(taskSummary(progress,monday).today,20);assert.equal(taskSummary(progress,monday).weekly,20);
 const restored=JSON.parse(JSON.stringify(progress));assert.equal(recordStudyTask(restored,20,monday).fish,0);
 for(let i=21;i<=100;i++){const r=recordStudyTask(progress,i,monday+86400000);progress=r.progress;fish+=r.fish;}
 assert.equal(fish,385);assert.equal(taskSummary(progress,monday+86400000).weekly,100);
 const nextWeek=monday+7*86400000;const next=recordStudyTask(progress,101,nextWeek);assert.equal(next.fish,5);assert.equal(taskSummary(next.progress,nextWeek).weekly,1);assert.equal(Object.keys(next.progress.days).length,3);
 assert.equal(studyDay(Date.parse('2026-11-09T15:59:59Z')),'2026-11-09');assert.equal(studyDay(Date.parse('2026-11-09T16:00:00Z')),'2026-11-10');assert.equal(studyWeek('2026-11-15'),'2026-11-09');assert.equal(studyWeek('2026-11-16'),'2026-11-16');
});
test('single empty hint conserves all IDs, fills only one position, handles duplicates and misplaced source',()=>{
 const l=levels[0];let board={slots:l.words.map(()=>null),pool:[...l.words].reverse()};
 const ids=b=>[...b.slots.filter(Boolean),...b.pool].map(w=>w.id).sort();const original=ids(board);
 for(let i=0;i<2;i++){const result=fillOneEmptyAnswer(board,l);assert(result);assert.equal(result.index,i);assert.equal(result.board.slots.filter(Boolean).length,i+1);assert.deepEqual(ids(result.board),original);board=result.board;}
 const complete=filledAnswerBoard(board,l);assert.equal(fillOneEmptyAnswer(complete,l),null);
 const misplaced={slots:[null,...complete.slots.slice(1)],pool:[]};misplaced.pool=[misplaced.slots[2]];misplaced.slots[2]=complete.slots[0];const moved=fillOneEmptyAnswer(misplaced,l);assert(moved);assert.equal(moved.board.slots[0].id,complete.slots[0].id);assert.equal(moved.board.slots[2],null);assert.deepEqual(ids(moved.board),original);
 for(const level of levels){const empty={slots:level.words.map(()=>null),pool:level.words};const hint=fillOneEmptyAnswer(empty,level);assert(hint,level.id);assert.equal(hint.board.slots.filter(Boolean).length,1);assert.deepEqual(ids(hint.board),ids(empty));}
});
test('every lesson has an actual matching phrase and Chinese meaning; phases do not leak future phrases',()=>{
 for(const level of levels){const phrases=phraseHints(level);assert(phrases.length,level.id);for(const p of phrases){assert(/[\u3400-\u9fff]/u.test(p.meaning));assert(level.correctSequence.join(' ').toLowerCase().replace(/[,.?!;:]/g,'').includes(p.english));}}
 const base=levels[0],custom={...base,tieredAssembly:{phases:[{wordIds:base.words.slice(0,4).map(w=>w.id)}]}};assert(phraseHints(custom,0).some(p=>p.english==='make coffee'));assert(!phraseHints(custom,0).some(p=>p.english==='start working'));
});
test('task progress is compatible with cloud snapshots and malformed records are rejected',()=>{
 const p={id:'x',name:'猫',avatar:'cat-avatar-01',themeColor:'green',currentLevelIndex:0,totalAttempts:0,correctAttempts:0,streakDays:0,totalWordGoal:1200,totalSentenceGoal:500,completedLevelIds:[],masteredWordIds:[],starredWordIds:[],mistakeHistory:[]};const c={fish:5,activeCat:'mimi',owned:[],equipped:{mimi:{},tuanzhang:{}},bestHints:{},studyTasks:recordStudyTask(undefined,2001,monday).progress};
 assert(validSnapshot({profile:p,collection:c}));assert(validSnapshot({profile:p,collection:{...c,studyTasks:undefined}}));assert(!validSnapshot({profile:p,collection:{...c,studyTasks:{...c.studyTasks,days:{'2026-11-09':[1,1]}}}}));assert(!validSnapshot({profile:p,collection:{...c,studyTasks:{...c.studyTasks,grants:{fake:999}}}}));
});
