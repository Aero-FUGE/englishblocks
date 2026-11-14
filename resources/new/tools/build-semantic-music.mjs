import {readFileSync,writeFileSync} from 'node:fs';
import {parseMusicQuestion} from '../shared/music-history.mjs';
const sources=JSON.parse(readFileSync(new URL('./music-history/genres-source.json',import.meta.url),'utf8'));
const knowledge=JSON.parse(readFileSync(new URL('./music-history/semantic-knowledge.json',import.meta.url),'utf8'));
if(Object.keys(knowledge).length!==sources.length)throw Error('知识配置与题目数量不符');
const questions=sources.map(q=>{const lines=q.rawAnswer.split('\n'),recipe=knowledge[q.id];if(!recipe||recipe.length!==lines.length)throw Error(`段落配置不完整：${q.id}`);const semanticParagraphs=lines.map((text,pi)=>{let cursor=0;const parts=[];for(const term of recipe[pi]){const start=text.indexOf(term,cursor);if(start<0)throw Error(`${q.id} 第${pi+1}段找不到：${term}`);if(start>cursor)parts.push({role:'framework',text:text.slice(cursor,start)});parts.push({role:'knowledge',text:term});cursor=start+term.length;}if(cursor<text.length)parts.push({role:'framework',text:text.slice(cursor)});return parts;});return parseMusicQuestion({...q,semanticParagraphs},'genres');});
writeFileSync(new URL('../src/data/musicHistory/genres.json',import.meta.url),JSON.stringify(questions,null,2)+'\n');
console.log(`已从无标记原文生成 ${questions.length} 题：知识挖空 / 框架反向，完整原文逐字校验通过。`);
