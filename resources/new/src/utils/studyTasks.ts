export type StudyTaskProgress={startedOn:string;days:Record<string,number[]>;grants:Record<string,number>};
export const DAILY_TASKS=[{id:'daily-1',target:1,fish:5},{id:'daily-10',target:10,fish:20},{id:'daily-20',target:20,fish:35}] as const;
export const WEEKLY_TASKS=[{id:'weekly-10',target:10,fish:25},{id:'weekly-50',target:50,fish:80},{id:'weekly-100',target:100,fish:160}] as const;
export const studyDay=(time=Date.now())=>new Date(time+8*3600000).toISOString().slice(0,10);
export function studyWeek(day:string){const date=new Date(day+'T00:00:00Z');date.setUTCDate(date.getUTCDate()-(date.getUTCDay()+6)%7);return date.toISOString().slice(0,10);}
export function shiftStudyDay(day:string,offset:number){const d=new Date(day+'T00:00:00Z');d.setUTCDate(d.getUTCDate()+offset);return d.toISOString().slice(0,10);}
export function taskSummary(progress:StudyTaskProgress|undefined,time=Date.now()){
 const day=studyDay(time),week=studyWeek(day);const days=progress?.days||{};
 const today=days[day]?.length||0,weekly=Object.entries(days).filter(([d])=>d>=week&&d<=day).reduce((n,[,ids])=>n+ids.length,0);
 return {day,week,today,weekly,daily:DAILY_TASKS.map(t=>({...t,count:today,earned:!!progress?.grants[`${day}:${t.id}`]})),weeklyTasks:WEEKLY_TASKS.map(t=>({...t,count:weekly,earned:!!progress?.grants[`${week}:${t.id}`]}))};
}
/** Progress and granted fish are applied together in the collection's single state update. */
export function recordStudyTask(previous:StudyTaskProgress|undefined,levelId:number,time=Date.now()){
 const day=studyDay(time);const current:StudyTaskProgress=previous||{startedOn:day,days:{},grants:{}};
 if(current.days[day]?.includes(levelId))return {progress:current,fish:0,awards:[] as string[]};
 const progress:StudyTaskProgress={...current,days:{...current.days,[day]:[...(current.days[day]||[]),levelId]},grants:{...current.grants}};
 const summary=taskSummary(progress,time);let fish=0;const awards:string[]=[];
 for(const [period,tasks]of [[summary.day,summary.daily],[summary.week,summary.weeklyTasks]] as const)for(const task of tasks){const key=`${period}:${task.id}`;if(task.count>=task.target&&!progress.grants[key]){progress.grants[key]=task.fish;fish+=task.fish;awards.push(task.id);}}
 return {progress,fish,awards};
}
