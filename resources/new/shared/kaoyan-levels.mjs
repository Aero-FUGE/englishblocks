/** One adapter shared by the game and server catalog; source JSON stays immutable. */
export function createKaoyanLevels(bank, startNumber=1190){
 return [...bank.sets].sort((a,b)=>a.id.localeCompare(b.id,undefined,{numeric:true})).flatMap(set=>set.questions.map(q=>({
  id:100000+q.index,levelNumber:startNumber+q.index,tier:5,tierName:'考研长难句精练',targetChinese:q.zh,targetEnglish:q.en,
  words:q.chunks.map((text,i)=>({id:`kaoyan:${q.id}:${i}`,text,cleanWord:text.toLowerCase(),pos:'词组',phonetic:'',translation:'',sentenceMeaning:'',colorTheme:'green',senseNotes:`本题考点：${q.points.join('、')}。请结合整句理解本词组。`})),
  correctSequence:q.chunks,grammarExplanation:q.analysis,
  kaoyan:{id:q.id,setId:set.id,setName:set.name,points:q.points,analysis:q.analysis,tips:q.tips,topic:q.topic,difficulty:q.difficulty},
 })));
}
