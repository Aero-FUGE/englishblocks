import React from 'react';
import {useSeasonTheme} from '../utils/seasonTheme';
/** A bounded set of compositor-only decorations; no timers, canvas, or hit targets. */
export function SeasonAtmosphere(){const[season]=useSeasonTheme();return <div className={`eb-season-atmosphere eb-season-${season}`} aria-hidden="true"><div className="eb-season-light"/>{Array.from({length:8},(_,i)=><i key={i} className="eb-season-particle" style={{'--particle-x':`${6+i*12}%`,'--particle-delay':`${-i*3.7}s`,'--particle-duration':`${19+i*1.4}s`,'--particle-drift':`${i%2?40:-35}px`,'--particle-turn':`${i%2?220:-170}deg`} as React.CSSProperties}/>)}</div>;}
