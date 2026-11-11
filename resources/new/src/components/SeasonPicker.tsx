import React from 'react';
import {SEASONS,SEASON_LABELS,useSeasonTheme} from '../utils/seasonTheme';
export function SeasonPicker(){const[season,setSeason]=useSeasonTheme();return <section className="eb-lobby-seasons" aria-label="四季主题"><strong>花园的四季</strong><div>{SEASONS.map(value=><button type="button" key={value} aria-pressed={season===value} onClick={()=>setSeason(value)}>{SEASON_LABELS[value]}</button>)}</div></section>;}
