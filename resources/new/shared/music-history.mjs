export const MUSIC_CATEGORIES=[{id:'genres',name:'音乐体裁',description:'在体裁与曲式里，听见音乐的来路',symbol:'♫'},{id:'composers',name:'作曲家',description:'走近音乐家的故事与创作世界',symbol:'♬'},{id:'works',name:'音乐作品',description:'翻开经典作品的声音画册',symbol:'♪'}];
export const MUSIC_MODES=['organize','retrieve'];
export const MUSIC_MODE_LABELS={organize:'组织答案',retrieve:'知识提取'};
const idPattern=/^[a-zA-Z0-9_-]{1,100}$/;
export function contentVersion(value){let h=2166136261;for(const char of JSON.stringify(value)){h^=char.codePointAt(0);h=Math.imul(h,16777619);}return (h>>>0).toString(16);}
// Keep short grammatical links intact and never split the inside of a score point.
// Punctuation stays in language pieces; joining all pieces must reproduce the source.
export function splitLanguage(text){const clauses=text.match(/[^，。；！？：、,.;!?\n]+[，。；！？：、,.;!?]?|[，。；！？：、,.;!?\n]/gu)||[];const segmenter=new Intl.Segmenter('zh-CN',{granularity:'word'});return clauses.flatMap(clause=>{if(clause.length<=20)return [clause];const result=[];let part='';for(const {segment}of segmenter.segment(clause)){if(part.length>=10&&part.length+segment.length>18){result.push(part);part='';}part+=segment;}if(part)result.push(part);return result;});}
export function parseMusicQuestion(input,category='genres'){
 if(!MUSIC_CATEGORIES.some(c=>c.id===category))throw Error('未知音乐史分类');
 if(!input||typeof input.id!=='string'||!idPattern.test(input.id)||typeof input.title!=='string'||!input.title.trim())throw Error('题目需要稳定的 ID 和名称');
 let sources;
 const structured=Array.isArray(input.paragraphs)&&input.paragraphs.every(p=>p&&Array.isArray(p.segments))?input.paragraphs:null;
 if(Array.isArray(input.paragraphs)&&input.paragraphs.every(p=>p&&Array.isArray(p.segments))){sources=input.paragraphs.map(p=>p.segments.map(s=>{if(!['score','language'].includes(s.kind)||typeof s.text!=='string'||!s.text||/[【】]/u.test(s.text))throw Error('结构化词块格式不正确');return s.kind==='score'?`【${s.text}】`:s.text;}).join(''));}
 else if(Array.isArray(input.segments))return parseMusicQuestion({...input,paragraphs:[{segments:input.segments}]},category);
 else{const text=input.annotatedAnswer??input.answer;if(typeof text!=='string')throw Error('缺少带【】的完整答案');sources=text.split(/\r?\n/).filter(p=>p.length);}
 if(!sources.length)throw Error('答案不能为空');let scoreCount=0;
 const paragraphs=sources.map((text,pi)=>{const segments=[];let cursor=0;const pattern=/【([^【】]+)】/gu;let match;const add=(kind,part)=>{for(const value of kind==='score'?[part]:splitLanguage(part)){if(value)segments.push({id:`${input.id}-p${pi}-s${segments.length}`,kind,text:value});}};
 if(structured){for(const segment of structured[pi].segments){segments.push({id:`${input.id}-p${pi}-s${segments.length}`,kind:segment.kind,text:segment.text});if(segment.kind==='score')scoreCount++;}return {id:`${input.id}-p${pi}`,segments};}
 while((match=pattern.exec(text))){const before=text.slice(cursor,match.index);if(/[【】]/u.test(before))throw Error('得分点括号未配对');add('language',before);add('score',match[1]);scoreCount++;cursor=pattern.lastIndex;}
 const after=text.slice(cursor);if(/[【】]/u.test(after))throw Error('得分点括号未配对');add('language',after);if(segments.map(s=>s.kind==='score'?`【${s.text}】`:s.text).join('')!==text)throw Error('拆块不能改变原文');return {id:`${input.id}-p${pi}`,segments};});
 if(!scoreCount||!paragraphs.some(p=>p.segments.some(s=>s.kind==='language')))throw Error('双阶段题目需要得分点和语言骨架');const rawAnswer=paragraphs.map(p=>p.segments.map(s=>s.text).join('')).join('\n');if(input.rawAnswer!=null&&input.rawAnswer!==rawAnswer)throw Error('原始答案与词块不一致');
 return {id:input.id,category,title:input.title,annotatedAnswer:sources.join('\n'),rawAnswer,paragraphs,scorePoints:paragraphs.flatMap(p=>p.segments.filter(s=>s.kind==='score')),skeleton:paragraphs.flatMap(p=>p.segments.filter(s=>s.kind==='language')),correctOrder:paragraphs.flatMap(p=>p.segments.map(s=>s.id)),version:contentVersion(paragraphs.map(p=>p.segments.map(s=>[s.kind,s.text])))};
}
export function importMusicQuestions(input,category){const rows=Array.isArray(input)?input:input?.questions;if(!Array.isArray(rows))throw Error('题库应为数组或 {questions: [...]}');const questions=rows.map(q=>parseMusicQuestion(q,category));if(new Set(questions.map(q=>q.id)).size!==questions.length)throw Error('题目 ID 重复');return questions;}
export function isMusicMovable(segment,mode){return segment.kind===(mode==='organize'?'language':'score');}
export function nextMusicMode(record){return record?.organizeComplete&&!record?.retrieveComplete?'retrieve':'organize';}
export function validMusicProgress(value){const integer=n=>Number.isSafeInteger(n)&&n>=0;if(!value||typeof value!=='object'||Array.isArray(value)||value.version!==1||!value.questions||typeof value.questions!=='object'||Array.isArray(value.questions)||Object.keys(value.questions).length>5000)return false;
 return Object.entries(value.questions).every(([id,r])=>idPattern.test(id)&&r&&typeof r==='object'&&!Array.isArray(r)&&['organizeComplete','retrieveComplete'].every(k=>typeof r[k]==='boolean')&&(!r.retrieveComplete||r.organizeComplete)&&integer(r.lastStudiedAt)&&Array.isArray(r.attempts)&&r.attempts.length<=50&&r.attempts.every(a=>a&&MUSIC_MODES.includes(a.mode)&&integer(a.at)&&typeof a.correct==='boolean'&&typeof a.answer==='string'&&a.answer.length<=30000&&typeof a.version==='string')&&(!r.drafts||(typeof r.drafts==='object'&&!Array.isArray(r.drafts)&&Object.entries(r.drafts).every(([mode,d])=>MUSIC_MODES.includes(mode)&&d&&typeof d.version==='string'&&integer(d.paragraph)&&Array.isArray(d.slots)&&d.slots.length<=100&&d.slots.every(row=>Array.isArray(row)&&row.length<=1000&&row.every(s=>s===null||(typeof s==='string'&&s.length<=200)))))));
}
