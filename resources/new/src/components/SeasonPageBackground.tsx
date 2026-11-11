import React from 'react';
import {useSeasonTheme} from '../utils/seasonTheme';
/** Shared, viewport-bound art for study and friends; independent of document height. */
export function SeasonPageBackground(){const[season]=useSeasonTheme();const url=new URL(`./assets/pages/${season}.png`,document.baseURI).href;return <div className="eb-other-page-background" aria-hidden="true" data-background-season={season} style={{backgroundImage:`linear-gradient(color-mix(in srgb,var(--theme-surface) 15%,transparent),transparent 35%),url("${url}")`}}/>;}
