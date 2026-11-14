import {MUSIC_LEXICON} from './music-lexicon.mjs';
export const MUSIC_CATEGORIES=[{id:'genres',name:'音乐体裁',description:'在体裁与曲式里，听见音乐的来路',symbol:'♫'},{id:'composers',name:'作曲家',description:'走近音乐家的故事与创作世界',symbol:'♬'},{id:'works',name:'音乐作品',description:'翻开经典作品的声音画册',symbol:'♪'}];
export const MUSIC_MODES=['organize','retrieve'];
export const MUSIC_MODE_LABELS={organize:'一刷',retrieve:'二刷'};
const idPattern=/^[a-zA-Z0-9_-]{1,100}$/;
const fixedPattern=/^[\p{P}\p{S}\s]+$/u;
const wordSegmenter=new Intl.Segmenter('zh-CN',{granularity:'word'});
const buckets=new Map();
for(const word of Object.keys(MUSIC_LEXICON)){const first=word[0];if(!buckets.has(first))buckets.set(first,[]);buckets.get(first).push(word);}
for(const words of buckets.values())words.sort((a,b)=>b.length-a.length);
export function contentVersion(value){let h=2166136261;for(const char of JSON.stringify(value)){h^=char.codePointAt(0);h=Math.imul(h,16777619);}return (h>>>0).toString(16);}
function posName(flag){if(/^v/.test(flag))return '动词';if(/^a/.test(flag))return '形容词';if(/^d/.test(flag))return '副词';if(/^m/.test(flag))return '数词';return '名词';}
// POS words, reviewed music proper names and short noun phrases. Function particles
// join a neighbouring semantic word; a particle alone between two score points stays
// as a fixed connector in the sentence instead of becoming an unusable pool block.
function semanticWords(text){
 const atoms=[];let cursor=0;
 while(cursor<text.length){const known=buckets.get(text[cursor])?.find(w=>text.startsWith(w,cursor)&&!fixedPattern.test(w));const value=known||wordSegmenter.segment(text.slice(cursor))[Symbol.iterator]().next().value.segment;atoms.push({text:value,flag:MUSIC_LEXICON[value]||'n'});cursor+=value.length;}
 const result=[];let pending='';
 for(const atom of atoms){if(/^[upcrye]/.test(atom.flag)){pending+=atom.text;continue;}const value=pending+atom.text;pending='';const previous=result[result.length-1];if(previous&&/^n/.test(atom.flag)&&/^n/.test(previous.flag)&&previous.text.length+value.length<=6){previous.text+=value;previous.pos='名词短语';}else result.push({text:value,flag:atom.flag,pos:posName(atom.flag)});}
 if(pending){const previous=result[result.length-1];if(previous&&previous.text.length+pending.length<=12)previous.text+=pending;else result.push({text:pending,flag:'u',pos:'连接词',anchor:true});}
 return result;
}
export function splitMusicText(text,role){const result=[];for(const match of text.matchAll(/[\p{P}\p{S}\s]+|[^\p{P}\p{S}\s]+/gu)){if(fixedPattern.test(match[0]))result.push({kind:'punctuation',text:match[0],sourceRole:role,pos:'标点'});else for(const word of semanticWords(match[0]))result.push({kind:word.anchor?'anchor':role,text:word.text,sourceRole:role,pos:word.pos});}return result;}
export function splitLanguage(text){return splitMusicText(text,'language').map(s=>s.text);}
export function parseMusicQuestion(input,category='genres'){
 if(!MUSIC_CATEGORIES.some(c=>c.id===category))throw Error('未知音乐史分类');
 if(!input||typeof input.id!=='string'||!idPattern.test(input.id)||typeof input.title!=='string'||!input.title.trim())throw Error('题目需要稳定的 ID 和名称');
 let sources;
 if(input.tokenizationVersion===2&&typeof input.annotatedAnswer==='string')sources=input.annotatedAnswer.split(/\r?\n/).filter(Boolean);
 else if(Array.isArray(input.paragraphs)&&input.paragraphs.every(p=>p&&Array.isArray(p.segments))){sources=input.paragraphs.map(p=>p.segments.map(s=>{if(!['score','language'].includes(s.kind)||typeof s.text!=='string'||!s.text||/[【】]/u.test(s.text))throw Error('结构化词块格式不正确');return s.kind==='score'?`【${s.text}】`:s.text;}).join(''));}
 else if(Array.isArray(input.segments))return parseMusicQuestion({...input,paragraphs:[{segments:input.segments}]},category);
 else{const text=input.annotatedAnswer??input.answer;if(typeof text!=='string')throw Error('缺少带【】的完整答案');sources=text.split(/\r?\n/).filter(p=>p.length);}
 if(!sources.length)throw Error('答案不能为空');const scorePoints=[];
 const paragraphs=sources.map((text,pi)=>{const segments=[];let cursor=0;const pattern=/【([^【】]+)】/gu;let match;
 const add=(role,part,pointId)=>{const pieces=splitMusicText(part,role);pieces.forEach((piece,index)=>segments.push({...piece,id:`${input.id}-p${pi}-s${segments.length}`,...(pointId?{pointId,pointStart:index===0,pointEnd:index===pieces.length-1}:{})}));};
 while((match=pattern.exec(text))){const before=text.slice(cursor,match.index);if(/[【】]/u.test(before))throw Error('得分点括号未配对');add('language',before);const pointId=`${input.id}-point${scorePoints.length}`;scorePoints.push({id:pointId,kind:'score',text:match[1]});add('score',match[1],pointId);cursor=pattern.lastIndex;}
 const after=text.slice(cursor);if(/[【】]/u.test(after))throw Error('得分点括号未配对');add('language',after);if(segments.map(s=>(s.pointStart?'【':'')+s.text+(s.pointEnd?'】':'')).join('')!==text)throw Error('拆块不能改变原文');return {id:`${input.id}-p${pi}`,segments};});
 if(!scorePoints.length||!paragraphs.some(p=>p.segments.some(s=>s.kind==='language')))throw Error('双阶段题目需要得分点和语言骨架');const rawAnswer=paragraphs.map(p=>p.segments.map(s=>s.text).join('')).join('\n');if(input.rawAnswer!=null&&input.rawAnswer!==rawAnswer)throw Error('原始答案与词块不一致');
 return {id:input.id,category,title:input.title,annotatedAnswer:sources.join('\n'),rawAnswer,tokenizationVersion:2,paragraphs,scorePoints,skeleton:paragraphs.flatMap(p=>p.segments.filter(s=>s.sourceRole==='language')),correctOrder:paragraphs.flatMap(p=>p.segments.map(s=>s.id)),version:contentVersion(paragraphs.map(p=>p.segments.map(s=>[s.kind,s.text,s.pos])))};
}
export function importMusicQuestions(input,category){const rows=Array.isArray(input)?input:input?.questions;if(!Array.isArray(rows))throw Error('题库应为数组或 {questions: [...]}');const questions=rows.map(q=>parseMusicQuestion(q,category));if(new Set(questions.map(q=>q.id)).size!==questions.length)throw Error('题目 ID 重复');return questions;}
export function isMusicMovable(segment,mode){return segment.kind===(mode==='organize'?'language':'score');}
export function nextMusicMode(record){return record?.organizeComplete&&!record?.retrieveComplete?'retrieve':'organize';}
export function validMusicProgress(value){const integer=n=>Number.isSafeInteger(n)&&n>=0;if(!value||typeof value!=='object'||Array.isArray(value)||value.version!==1||!value.questions||typeof value.questions!=='object'||Array.isArray(value.questions)||Object.keys(value.questions).length>5000)return false;
 return Object.entries(value.questions).every(([id,r])=>idPattern.test(id)&&r&&typeof r==='object'&&!Array.isArray(r)&&['organizeComplete','retrieveComplete'].every(k=>typeof r[k]==='boolean')&&(!r.retrieveComplete||r.organizeComplete)&&integer(r.lastStudiedAt)&&Array.isArray(r.attempts)&&r.attempts.length<=50&&r.attempts.every(a=>a&&MUSIC_MODES.includes(a.mode)&&integer(a.at)&&typeof a.correct==='boolean'&&typeof a.answer==='string'&&a.answer.length<=30000&&typeof a.version==='string')&&(!r.drafts||(typeof r.drafts==='object'&&!Array.isArray(r.drafts)&&Object.entries(r.drafts).every(([mode,d])=>MUSIC_MODES.includes(mode)&&d&&typeof d.version==='string'&&integer(d.paragraph)&&Array.isArray(d.slots)&&d.slots.length<=100&&d.slots.every(row=>Array.isArray(row)&&row.length<=1000&&row.every(s=>s===null||(typeof s==='string'&&s.length<=200)))))));
}
