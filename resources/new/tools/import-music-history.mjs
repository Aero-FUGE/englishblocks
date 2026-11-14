import {readFileSync,writeFileSync,mkdirSync} from 'node:fs';
import {execFileSync} from 'node:child_process';
import {dirname,resolve} from 'node:path';
import {importMusicQuestions} from '../shared/music-history.mjs';
const args=process.argv.slice(2);const option=(key,fallback)=>args.includes(key)?args[args.indexOf(key)+1]:fallback;
const input=option('--input'),category=option('--category','genres'),output=option('--output',`src/data/musicHistory/${category}.json`);
if(!input)throw Error('用法：node tools/import-music-history.mjs --input 文件.docx或.json --category genres|composers|works [--output 文件.json]');
let rows;
if(input.toLowerCase().endsWith('.docx')){
 const paragraphs=JSON.parse(execFileSync('python3',['-c',`import json,sys,zipfile,xml.etree.ElementTree as E
with zipfile.ZipFile(sys.argv[1]) as z: root=E.fromstring(z.read('word/document.xml'))
ns={'w':'http://schemas.openxmlformats.org/wordprocessingml/2006/main'}
print(json.dumps([''.join(t.text or '' for t in p.findall('.//w:t',ns)) for p in root.findall('.//w:body/w:p',ns)],ensure_ascii=False))`,resolve(input)],{encoding:'utf8'}));
 rows=[];let current;
 for(const text of paragraphs){const title=/^(\d{1,3})\s+(.+)$/u.exec(text);if(title){current={id:`music-${category}-${title[1].padStart(2,'0')}`,title:title[2],annotatedAnswer:''};rows.push(current);}else if(current&&text){current.annotatedAnswer+=(current.annotatedAnswer?'\n':'')+text;}}
}else rows=JSON.parse(readFileSync(input,'utf8'));
const questions=importMusicQuestions(rows,category);mkdirSync(dirname(resolve(output)),{recursive:true});writeFileSync(output,JSON.stringify(questions,null,2)+'\n');console.log(`已导入 ${questions.length} 题到 ${output}；得分点、标点与原文逐字一致。`);
