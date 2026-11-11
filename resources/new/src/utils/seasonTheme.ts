import {useSyncExternalStore} from 'react';
export const SEASONS=['spring','summer','autumn','winter'] as const;
export type Season=typeof SEASONS[number];
export const SEASON_LABELS:Record<Season,string>={spring:'🌸 春日',summer:'☀️ 夏日',autumn:'🍂 秋日',winter:'❄️ 冬日'};
const KEY='englishblocks_season',EVENT='englishblocks-season-change';
const valid=(value:unknown):value is Season=>SEASONS.includes(value as Season);
let current:Season='spring';
export function initializeSeason(){try{const saved=localStorage.getItem(KEY);current=valid(saved)?saved:'spring';}catch{current='spring';}document.documentElement.dataset.season=current;}
export function setSeason(season:Season){if(!valid(season))return;current=season;document.documentElement.dataset.season=season;try{localStorage.setItem(KEY,season);}catch{}window.dispatchEvent(new Event(EVENT));}
function subscribe(listener:()=>void){const storage=(event:StorageEvent)=>{if(event.key===KEY||event.key===null){initializeSeason();listener();}};window.addEventListener(EVENT,listener);window.addEventListener('storage',storage);return()=>{window.removeEventListener(EVENT,listener);window.removeEventListener('storage',storage);};}
export function useSeasonTheme(){return [useSyncExternalStore(subscribe,()=>current,()=> 'spring' as Season),setSeason] as const;}
