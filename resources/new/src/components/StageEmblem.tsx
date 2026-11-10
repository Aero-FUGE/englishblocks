import React from 'react';
/** Hand-drawn vector mini emblems for the four learning-stage badges. */
export function StageEmblem({tier, size=68, className=''}:{tier:number;size?:number;className?:string}) {
  const palette = [
    {bg:'#E4F1D8',stroke:'#5D8E6B',light:'#A3C79D',gold:'#E8B96A'},
    {bg:'#FBE8D8',stroke:'#A67B6C',light:'#E4B0A4',gold:'#E9BA71'},
    {bg:'#DFEDF6',stroke:'#5A87A1',light:'#9ABBD0',gold:'#F1C879'},
    {bg:'#EDE4F6',stroke:'#806F9E',light:'#B8A1D3',gold:'#E6C073'},
  ][Math.max(0,Math.min(3,tier-1))];
  const stroke={stroke:palette.stroke,strokeLinecap:'round' as const,strokeLinejoin:'round' as const,strokeWidth:2.4};
  return <svg viewBox="0 0 100 100" role="img" aria-label={['初中基础小鹰与树苗','高中进阶展翼小鹰','大学英语书卷与星光','考研冲刺金羽与学士帽'][Math.max(0,Math.min(3,tier-1))]} width={size} height={size} className={className}>
    <circle cx="50" cy="50" r="47" fill={palette.bg}/>
    <circle cx="50" cy="50" r="42" fill="none" stroke="white" strokeWidth="2" opacity=".8" strokeDasharray="2.5 5"/>
    {tier===1 && <g>
      <path d="M19 64 Q37 55 50 64 Q63 55 81 64 L80 77 Q62 72 50 81 Q38 72 20 77 Z" fill="white" {...stroke}/>
      <path d="M50 64 V80 M28 69 Q41 66 46 74 M55 74 Q66 65 74 69" fill="none" {...stroke} strokeWidth="1.7"/>
      <path d="M49 61 Q35 52 43 37 Q55 40 55 56 M51 57 Q69 51 63 35 Q49 41 51 57" fill={palette.light} {...stroke}/>
      <path d="M51 63 Q49 47 53 35" fill="none" {...stroke}/>
      <path d="M65 27 Q72 19 81 25 M75 17 L79 21" fill="none" stroke={palette.gold} strokeWidth="3" strokeLinecap="round"/>
      <circle cx="27" cy="33" r="3" fill={palette.gold}/>
    </g>}
    {tier===2 && <g>
      <circle cx="50" cy="48" r="22" fill="#FFF7E7"/>
      <path d="M50 55 C33 57 22 46 16 30 Q36 31 49 45 Q61 30 84 29 C78 48 67 57 51 55" fill="white" {...stroke}/>
      <path d="M50 48 Q49 64 53 69 L61 75 L50 72 L40 76 L47 67" fill={palette.gold} {...stroke}/>
      <path d="M23 38 L43 51 M78 38 L58 51" fill="none" {...stroke} strokeWidth="1.5"/>
      <path d="M50 19 L50 13 M33 25 L29 20 M67 25 L71 20" stroke={palette.gold} strokeWidth="3" strokeLinecap="round"/>
      <path d="M20 72 Q50 80 80 72" fill="none" {...stroke}/>
    </g>}
    {tier===3 && <g>
      <path d="M17 60 L36 31 L48 48 L65 27 L84 58 L64 76 L42 74 Z" fill="#F6FBFF" {...stroke}/>
      <path d="M31 45 L42 58 L59 40 L74 55" fill="none" {...stroke} strokeWidth="2"/>
      <path d="M20 65 Q35 57 50 68 Q65 57 80 65 L80 79 Q64 74 50 83 Q36 74 20 79 Z" fill="white" {...stroke}/>
      <path d="M50 69 V82" stroke={palette.stroke} strokeWidth="2"/>
      <path d="M72 15 L74 22 L82 24 L75 27 L73 34 L70 27 L63 24 L70 22 Z" fill={palette.gold}/>
      <circle cx="31" cy="21" r="3" fill={palette.gold}/>
    </g>}
    {tier===4 && <g>
      <path d="M50 59 C35 57 23 46 17 30 Q34 29 49 46 Q65 29 84 29 Q78 46 51 59" fill="white" {...stroke}/>
      <path d="M50 49 L57 65 L50 71 L42 65 Z" fill={palette.gold} {...stroke}/>
      <path d="M26 35 L43 52 M75 35 L57 52" fill="none" {...stroke} strokeWidth="1.5"/>
      <path d="M24 24 L50 15 L77 24 L50 34 Z" fill={palette.stroke} stroke="white" strokeWidth="2" strokeLinejoin="round"/>
      <path d="M35 29 V39 Q50 49 66 39 V29" fill={palette.light} {...stroke}/>
      <path d="M75 25 V44" stroke={palette.stroke} strokeWidth="2.8"/><circle cx="75" cy="46" r="3.5" fill={palette.gold}/>
      <path d="M27 74 Q50 80 73 74" fill="none" {...stroke}/>
    </g>}
  </svg>;
}
