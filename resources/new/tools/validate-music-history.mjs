import {readdirSync,readFileSync} from 'node:fs';
import {importMusicQuestions,MUSIC_CATEGORIES} from '../shared/music-history.mjs';
const folder=new URL('../src/data/musicHistory/',import.meta.url),ids=new Set(),totals={};
for(const file of readdirSync(folder).filter(f=>f.endsWith('.json'))){const rows=JSON.parse(readFileSync(new URL(file,folder),'utf8')),category=file.slice(0,-5);const parsed=importMusicQuestions(rows,category);for(let i=0;i<parsed.length;i++){const q=parsed[i];if(ids.has(q.id))throw Error('跨分类题目 ID 重复：'+q.id);ids.add(q.id);if(q.rawAnswer!==rows[i].rawAnswer||q.version!==rows[i].version||JSON.stringify(q.correctOrder)!==JSON.stringify(rows[i].correctOrder))throw Error('请重新运行题库导入工具：'+q.id);}totals[category]=parsed.length;}
console.log('Music history catalog (independent from English): '+MUSIC_CATEGORIES.map(c=>`${c.name} ${totals[c.id]||0}`).join(' / '));
