const safeInteger = n => Number.isSafeInteger(n) && n >= 0;

export function validSnapshot(value) {
  const p = value?.profile, c = value?.collection;
  if (!p || !c || Array.isArray(p) || Array.isArray(c)) return false;
  if (!['id','name','avatar','themeColor'].every(k => typeof p[k] === 'string' && p[k].length <= 200)) return false;
  if (!['currentLevelIndex','totalAttempts','correctAttempts','streakDays','totalWordGoal','totalSentenceGoal'].every(k => safeInteger(p[k]))) return false;
  if (p.correctAttempts > p.totalAttempts || !Array.isArray(p.completedLevelIds) || !p.completedLevelIds.every(safeInteger)) return false;
  if (!['masteredWordIds','starredWordIds'].every(k => Array.isArray(p[k]) && p[k].every(x => typeof x === 'string'))) return false;
  if (!Array.isArray(p.mistakeHistory) || !safeInteger(c.fish) || !Array.isArray(c.owned) || !c.owned.every(x => typeof x === 'string')) return false;
  if (!['mimi','tuanzhang'].includes(c.activeCat) || !c.equipped || !c.bestHints) return false;
  if (!p.mistakeHistory.every(r=>r && safeInteger(r.levelId) && typeof r.wrongSentence==='string' && typeof r.targetSentence==='string' && Number.isFinite(r.timestamp))) return false;
  if (!c.equipped.mimi || !c.equipped.tuanzhang || Array.isArray(c.equipped) || Array.isArray(c.bestHints)) return false;
  if (![c.equipped.mimi,c.equipped.tuanzhang].every(r=>typeof r==='object' && !Array.isArray(r) && Object.values(r).every(v=>typeof v==='string'))) return false;
  if (!Object.values(c.bestHints).every(safeInteger)) return false;
  if(c.studyTasks!=null){
    const tasks=c.studyTasks,date=s=>typeof s==='string'&&/^\d{4}-\d{2}-\d{2}$/.test(s)&&!Number.isNaN(Date.parse(s+'T00:00:00Z'));
    if(typeof tasks!=='object'||Array.isArray(tasks)||!date(tasks.startedOn)||!tasks.days||typeof tasks.days!=='object'||Array.isArray(tasks.days)||!tasks.grants||typeof tasks.grants!=='object'||Array.isArray(tasks.grants))return false;
    if(Object.keys(tasks.days).length>5000||Object.keys(tasks.grants).length>20000)return false;
    if(!Object.entries(tasks.days).every(([day,ids])=>date(day)&&Array.isArray(ids)&&ids.length<=5000&&ids.every(safeInteger)&&new Set(ids).size===ids.length))return false;
    if(!Object.entries(tasks.grants).every(([key,fish])=>/^\d{4}-\d{2}-\d{2}:(daily-(1|10|20)|weekly-(10|50|100))$/.test(key)&&safeInteger(fish)))return false;
  }
  if (value.preferences != null && (typeof value.preferences !== 'object' || Array.isArray(value.preferences))) return false;
  // Reject pathological nesting and prototype keys before returning stored data.
  function safe(v, depth = 0) {
    if (depth > 14) return false;
    if (!v || typeof v !== 'object') return true;
    return Object.entries(v).every(([k,x]) => !['__proto__','constructor','prototype'].includes(k) && safe(x,depth+1));
  }
  return safe(value);
}

