import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,existsSync} from 'node:fs';
import {execFileSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
import {parseMusicQuestion,importMusicQuestions,isMusicMovable,nextMusicMode,validMusicProgress} from '../shared/music-history.mjs';
import {hintMusicBlock,restoreMusicBoards,musicParagraphCorrect,musicAnswer,packMusicDraft,musicWords,emptyMusicRecord} from '../src/utils/musicHistory.ts';
import {insertFromPool,takeBack,moveByInsertion,emptyRail} from '../src/utils/railState.ts';
const questions=JSON.parse(readFileSync(new URL('../src/data/musicHistory/genres.json',import.meta.url),'utf8'));
test('37 annotated source questions preserve every paragraph, score point, character and punctuation',()=>{
 assert.equal(questions.length,37);assert.equal(new Set(questions.map(q=>q.id)).size,37);
 for(const q of questions){const parsed=parseMusicQuestion(q,q.category);assert.equal(parsed.rawAnswer,q.rawAnswer);assert.equal(parsed.annotatedAnswer,q.annotatedAnswer);assert.equal(parsed.version,q.version);assert.deepEqual(parsed.correctOrder,q.correctOrder);assert(q.scorePoints.length);assert.equal(q.scorePoints.map(s=>`【${s.text}】`).join(''),q.annotatedAnswer.match(/【[^【】]+】/gu).join(''));}
 const source=new URL('../../source/UI/音乐体裁_得分点标注版.docx',import.meta.url);
 if(existsSync(source)){const paragraphs=JSON.parse(execFileSync('python3',['-c',`import sys,json,zipfile,xml.etree.ElementTree as E
with zipfile.ZipFile(sys.argv[1]) as z:r=E.fromstring(z.read('word/document.xml'))
n={'w':'http://schemas.openxmlformats.org/wordprocessingml/2006/main'}
print(json.dumps([''.join(t.text or '' for t in p.findall('.//w:t',n)) for p in r.findall('.//w:body/w:p',n)],ensure_ascii=False))`,fileURLToPath(source)],{encoding:'utf8'}));let index=-1,rows=[];for(const p of paragraphs){if(/^\d{1,3}\s+/.test(p)){index++;rows[index]=[];}else if(index>=0&&p)rows[index].push(p);}assert.deepEqual(rows.map(p=>p.join('\n')),questions.map(q=>q.sourceAnnotatedAnswer||q.annotatedAnswer));}
});
test('both modes use source positions, support repeated identical blocks and restore complete source answers',()=>{
 for(const q of questions)for(const mode of ['organize','retrieve']){const boards=restoreMusicBoards(q,mode);for(let pi=0;pi<boards.length;pi++){const expected=musicWords(q,mode,pi);assert(expected.every(w=>q.paragraphs[pi].segments.some(s=>s.id===w.id&&isMusicMovable(s,mode))));expected.forEach((word,index)=>{boards[pi]=insertFromPool(boards[pi],index,word.id);});assert(musicParagraphCorrect(q,mode,pi,boards[pi]));}assert.equal(musicAnswer(q,mode,boards),q.rawAnswer);const draft=packMusicDraft(q,1,boards);const restored=restoreMusicBoards(q,mode,JSON.parse(JSON.stringify(draft)));assert.equal(musicAnswer(q,mode,restored),q.rawAnswer);const changed=restoreMusicBoards({...q,version:'changed'},mode,draft);assert(changed.every(b=>b.slots.every(w=>w===null)));}
 const repeated=parseMusicQuestion({id:'repeat',title:'重复词块',answer:'【圣咏】与【圣咏】；先与后。'});const b=restoreMusicBoards(repeated,'retrieve');b[0]=insertFromPool(b[0],0,b[0].pool[0].id);b[0]=insertFromPool(b[0],1,b[0].pool[0].id);assert(musicParagraphCorrect(repeated,'retrieve',0,b[0]));assert.equal(new Set(b[0].slots.map(w=>w.id)).size,2);
});
test('repeated insert, take-back and reorder conserve all IDs; corrupted drafts cannot duplicate blocks',()=>{
 for(const q of questions)for(const mode of ['organize','retrieve'])for(let pi=0;pi<q.paragraphs.length;pi++){let board=restoreMusicBoards(q,mode)[pi];const ids=b=>[...b.slots.filter(Boolean),...b.pool].map(w=>w.id).sort(),original=ids(board);for(let turn=0;turn<80;turn++){const target=Math.floor(Math.random()*board.slots.length);if(turn%3===0&&board.pool.length)board=insertFromPool(board,target,board.pool[0].id);else if(turn%3===1)board=moveByInsertion(board,target,Math.floor(Math.random()*board.slots.length));else board=takeBack(board,target);assert.deepEqual(ids(board),original);}assert.deepEqual(ids(emptyRail(board)),original);}
 const q=questions[0],boards=restoreMusicBoards(q,'organize'),draft=packMusicDraft(q,0,boards),id=boards[0].pool[0].id;draft.slots[0]=draft.slots[0].map(()=>id);const restored=restoreMusicBoards(q,'organize',draft);assert(restored[0].slots.every(w=>!w));
});
test('import supports marked JSON and existing split segments, rejects malformed or duplicate questions',()=>{
 const split={id:'manual',title:'人工拆块',paragraphs:[{segments:[{kind:'language',text:'连续'},{kind:'language',text:'骨架'},{kind:'score',text:'核心知识点'},{kind:'language',text:'。'}]}]};assert.deepEqual(parseMusicQuestion(split).paragraphs[0].segments.map(s=>s.text),['连续','骨架','核心知识点','。']);
 for(const answer of ['未标注的答案','【未闭合','前【【嵌套】后','前【】后'])assert.throws(()=>parseMusicQuestion({id:'bad',title:'错误',answer}));assert.throws(()=>parseMusicQuestion({title:'无 ID',answer:'前【核心】后'}));assert.throws(()=>importMusicQuestions([split,split],'genres'));
 assert.equal(importMusicQuestions([{...split,id:'composer-01'}],'composers')[0].category,'composers');assert.equal(importMusicQuestions([{...split,id:'work-01'}],'works')[0].category,'works');
});
test('independent review progress, draft and bounded answer history survive JSON round trip',()=>{const r=emptyMusicRecord();assert.equal(nextMusicMode(r),'organize');r.organizeComplete=true;assert.equal(nextMusicMode(r),'retrieve');const q=questions[0];r.drafts={organize:packMusicDraft(q,0,restoreMusicBoards(q,'organize'))};r.attempts=[{at:100,mode:'organize',correct:true,answer:q.rawAnswer,version:q.version}];const progress={version:1,questions:{[q.id]:r}};assert(validMusicProgress(JSON.parse(JSON.stringify(progress))));assert(!validMusicProgress({version:1,questions:{[q.id]:{...r,organizeComplete:false,retrieveComplete:true}}}));assert(!validMusicProgress({version:1,questions:{[q.id]:{...r,drafts:{organize:{version:q.version,paragraph:-1,slots:[]}}}}}));});
test('both pools contain POS words without punctuation, isolated particles or sentence-size chunks',()=>{
 const positions=new Set();for(const q of questions)for(const mode of ['organize','retrieve'])for(let pi=0;pi<q.paragraphs.length;pi++){for(const word of musicWords(q,mode,pi)){assert(!/[\p{P}\p{S}\s]/u.test(word.text),word.text);assert.notEqual(word.text,'的');assert(word.text.length<=12,word.text);assert(word.pos);positions.add(word.pos);}for(const s of q.paragraphs[pi].segments.filter(s=>s.kind==='punctuation'||s.kind==='anchor'))assert(!isMusicMovable(s,mode));}for(const pos of ['名词','动词','形容词','副词'])assert(positions.has(pos),pos);
});

test('reviewed anchors are short and distinctive, with unchanged original answers',()=>{for(const q of questions){assert.equal(q.sourceAnnotatedAnswer.replace(/[【】]/gu,''),q.rawAnswer);assert(q.scorePoints.every(s=>s.text.length<=9&&!/[\p{P}\p{S}\s]/u.test(s.text)));}const points=questions[0].scorePoints.map(s=>s.text);assert(points.includes('神意'));assert(points.includes('社会秩序'));assert(!points.includes('人与命运、神意及社会秩序之间的冲突'));});

test('hint fills only the earliest empty slot in both modes and conserves misplaced/repeated blocks',()=>{
 for(const q of questions)for(const mode of ['organize','retrieve'])for(let pi=0;pi<q.paragraphs.length;pi++){
  const expected=musicWords(q,mode,pi);let board=restoreMusicBoards(q,mode)[pi];const ids=b=>[...b.pool,...b.slots.filter(Boolean)].map(w=>w.id).sort(),original=ids(board);
  if(expected.length>1){board=insertFromPool(board,1,expected[0].id);const before=board;board=hintMusicBlock(q,mode,pi,board);assert.equal(board.slots[0].text,expected[0].text);assert.deepEqual(ids(board),original);assert.equal(before.slots[0],null);}
  for(let count=0;count<=expected.length;count++){const empty=board.slots.findIndex(w=>w===null);if(empty<0)break;const before=board;board=hintMusicBlock(q,mode,pi,board);assert.equal(board.slots[empty].text,expected[empty].text);assert.deepEqual(ids(board),original);for(let i=0;i<before.slots.length;i++)if(before.slots[i]?.text===expected[i].text)assert.equal(board.slots[i],before.slots[i]);}
  assert(musicParagraphCorrect(q,mode,pi,board));assert.equal(hintMusicBlock(q,mode,pi,board),board);
 }
});
