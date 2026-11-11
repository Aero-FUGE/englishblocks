import React from 'react';
const stages=[
 {file:'junior',label:'初中基础'},
 {file:'senior',label:'高中进阶'},
 {file:'university',label:'大学英语'},
 {file:'postgraduate',label:'考研冲刺'},
];
/** The same supplied artwork appears in stage selection, profiles and study badges. */
export function StageEmblem({tier,size=68,className=''}:{tier:number;size?:number;className?:string}){
 const stage=stages.find((_,index)=>index+1===tier)||stages[0];
 return <span role="img" aria-label={stage.label} className={`eb-stage-art ${className}`} style={{width:size,height:size}}><img src={`./assets/stages/${stage.file}.png`} alt="" aria-hidden="true" draggable={false}/></span>;
}
