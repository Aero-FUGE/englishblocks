import React from 'react';
/** Approved A款「主角款」 app icon, cropped directly from the selected concept sheet. */
export function BrandLogo({size=62, className=''}:{size?:number;className?:string}) {
  return <img
    src="./assets/brand-mimi-a.png"
    alt="英语拼块 · 咪咪站在彩色字母拼块后面"
    draggable={false}
    className={`brand-mimi-logo shrink-0 select-none object-cover drop-shadow-[0_3px_5px_rgba(85,103,71,.14)] ${className}`}
    style={{width:size,height:size,borderRadius:'26%'}}
  />;
}
