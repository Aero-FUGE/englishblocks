import React from 'react';
import {findAvatar} from '../../shared/avatars.mjs';
export function PlayerAvatar({avatar,size=64,label='玩家头像',fallback,className=''}:{avatar?:string|null;size?:number;label?:string;fallback?:React.ReactNode;className?:string}){
 const selected=findAvatar(avatar);
 return <span className={`eb-player-avatar ${className}`} style={{width:size,height:size}} data-avatar-id={selected?.id||'legacy'}>{selected?<img src={`./assets/avatars/${selected.file}`} alt={label} draggable={false}/>:fallback||<img src="./assets/mimi-golden.png" alt={label} draggable={false}/>}</span>;
}
