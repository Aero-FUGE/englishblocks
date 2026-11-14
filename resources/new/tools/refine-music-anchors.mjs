import {readFileSync,writeFileSync} from 'node:fs';
import {parseMusicQuestion} from '../shared/music-history.mjs';
const bank=new URL('../src/data/musicHistory/genres.json',import.meta.url),vocabulary=JSON.parse(readFileSync(new URL('./music-genre-anchors.json',import.meta.url),'utf8'));
const rows=JSON.parse(readFileSync(bank,'utf8'));
const result=rows.map((q,index)=>{const source=q.sourceAnnotatedAnswer||q.annotatedAnswer,terms=vocabulary[index].split('|').sort((a,b)=>b.length-a.length);const annotatedAnswer=source.replace(/【([^【】]+)】/gu,(_,text)=>{let output='',cursor=0;while(cursor<text.length){const term=terms.find(t=>text.startsWith(t,cursor));if(term){output+=`【${term}】`;cursor+=term.length;}else output+=text[cursor++];}return output;});const parsed=parseMusicQuestion({id:q.id,title:q.title,annotatedAnswer},q.category);if(parsed.rawAnswer!==q.rawAnswer)throw Error(`原文发生改变 ${q.id}`);if(parsed.scorePoints.some(s=>s.text.length>9||/[\p{P}\p{S}\s]/u.test(s.text)))throw Error(`锚点过长 ${q.id}`);return {...parsed,sourceAnnotatedAnswer:source};});
writeFileSync(bank,JSON.stringify(result,null,2)+'\n');console.log(`已审校 ${result.length} 题：只保留术语、人物、作品及辨识度高的锚点，原文不变。`);
