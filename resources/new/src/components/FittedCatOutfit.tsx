import React, { useId } from 'react';
import type { CatId, OutfitSlot, ShopItem } from '../data/catShop';

/**
 * Costume placement uses image coordinates, not five independently positioned
 * square icons. Both cat photos have different eye/neck/shoulder anchors.
 * SVG and base PNG share a single (1000 x 1000) picture coordinate system;
 * the outer DressedCat wrapper always keeps the PNG's original aspect ratio.
 */
export type CatFit = {
  eyeLeft: [number, number];
  eyeRight: [number, number];
  eyeRadius: [number, number];
  neck: [number, number];
  shoulders: [number, number, number];
};
export const CAT_FIT: Record<CatId, CatFit> = {
  mimi: {
    eyeLeft: [414, 458], eyeRight: [699, 452], eyeRadius: [96, 92],
    neck: [552, 730], shoulders: [245, 840, 722],
  },
  tuanzhang: {
    eyeLeft: [380, 495], eyeRight: [662, 495], eyeRadius: [101, 94],
    neck: [521, 738], shoulders: [225, 790, 736],
  },
};

const Outline = '#755948';
function Dress({ item, fit }: { item: ShopItem; fit: CatFit }) {
  const gradientId = useId().replace(/:/g, '_');
  const [neckX, neckY] = fit.neck;
  const [shoulderL, shoulderR, shoulderY] = fit.shoulders;
  const hem = 985;
  const leftHem = Math.max(60, shoulderL - 80);
  const rightHem = Math.min(948, shoulderR + 54);
  const isDress = item.icon === 'dress';
  const isMagic = item.id === 'star-cape';
  const isPirate = item.id === 'pirate-coat';
  const neckline = neckY - (isDress ? 12 : 5);
  return <g aria-label={`${item.name}（贴合猫咪身形）`}>
    <defs>
      <linearGradient id={gradientId} x1="0" x2="1" y1="0" y2="1">
        <stop offset="0" stopColor={item.accent} />
        <stop offset="0.24" stopColor={item.color} />
        <stop offset="1" stopColor={item.color} />
      </linearGradient>
    </defs>
    {/* Left/right shoulder drape and tapered body; neckline curves under chin. */}
    <path d={`M${neckX-88} ${neckline} Q${neckX-164} ${shoulderY-24} ${shoulderL} ${shoulderY+53}
       Q${shoulderL-36} ${shoulderY+125} ${leftHem} ${hem-34}
       Q${neckX} ${hem+17} ${rightHem} ${hem-34}
       Q${shoulderR+34} ${shoulderY+130} ${shoulderR} ${shoulderY+52}
       Q${neckX+167} ${shoulderY-28} ${neckX+88} ${neckline}
       Q${neckX} ${neckY+72} ${neckX-88} ${neckline}Z`}
      fill={`url(#${gradientId})`} stroke={Outline} strokeOpacity=".78" strokeWidth="9" strokeLinejoin="round" />
    {/* Crisp neckline / collar is what makes the costume look worn, not pasted. */}
    <path d={`M${neckX-88} ${neckline} Q${neckX-21} ${neckY+58} ${neckX} ${neckY+48} Q${neckX+35} ${neckY+54} ${neckX+88} ${neckline}`}
      stroke={item.accent} strokeWidth="24" strokeLinecap="round" fill="none" />
    <path d={`M${neckX-85} ${neckline+3} Q${neckX} ${neckY+76} ${neckX+86} ${neckline+3}`}
      stroke="#FFFCF6" strokeOpacity=".8" strokeWidth="6" fill="none" />
    {/* Shaded seams provide a sense of volume around the cat's chest. */}
    <path d={`M${shoulderL+47} ${shoulderY+108} Q${shoulderL+92} ${hem-123} ${leftHem+124} ${hem-28}`}
      stroke={Outline} strokeOpacity=".20" strokeWidth="12" fill="none" />
    <path d={`M${shoulderR-39} ${shoulderY+108} Q${shoulderR-87} ${hem-118} ${rightHem-117} ${hem-28}`}
      stroke="#FFF7E8" strokeOpacity=".45" strokeWidth="11" fill="none" />
    {isDress ? <>
      <path d={`M${leftHem+8} ${hem-49} Q${neckX} ${hem-2} ${rightHem-8} ${hem-49}`}
        stroke={item.accent} strokeWidth="33" strokeDasharray="8 11" fill="none" strokeLinecap="round" />
      <path d={`M${leftHem+4} ${hem-35} Q${neckX} ${hem+12} ${rightHem-4} ${hem-35}`}
        stroke="#FFF9F2" strokeWidth="7" fill="none" />
      <path d={`M${neckX} ${neckY+85} L${neckX} ${hem-80}`}
        stroke={item.accent} strokeWidth="13" strokeDasharray="7 26" strokeLinecap="round" />
      <circle cx={neckX} cy={neckY+102} r="13" fill="#FFF8EF" />
    </> : <>
      <path d={`M${neckX} ${neckY+82} L${neckX} ${hem-62}`}
        stroke={item.accent} strokeWidth="12" strokeOpacity=".75" strokeDasharray="16 16" fill="none" />
      <path d={`M${shoulderL+18} ${shoulderY+100} Q${neckX-215} ${hem-105} ${leftHem+67} ${hem-58}
        M${shoulderR-17} ${shoulderY+100} Q${neckX+220} ${hem-107} ${rightHem-62} ${hem-58}`}
        stroke={item.accent} strokeOpacity=".8" strokeWidth="12" fill="none" />
      {isMagic && <>
        <path d={`M${neckX+144} ${neckY+94} l12 28 30 3 -23 18 7 30 -26 -16 -24 15 5 -29 -20 -18 29 -4Z`}
          fill={item.accent} stroke="#FFF9D5" strokeWidth="5" />
        <circle cx={neckX-165} cy={neckY+157} r="7" fill="#FFF2B9"/>
      </>}
      {isPirate && <>
        <path d={`M${neckX-70} ${neckY+95} L${neckX-35} ${hem-90} M${neckX+70} ${neckY+95} L${neckX+36} ${hem-90}`}
          stroke={item.accent} strokeWidth="9" fill="none" />
        {[0,1,2].map((n)=><circle key={n} cx={neckX+7} cy={neckY+105+n*55} r="10" fill={item.accent} />)}
      </>}
    </>}
  </g>;
}

function Glasses({ item, fit }: { item: ShopItem; fit: CatFit }) {
  const [[lx,ly],[rx,ry]] = [fit.eyeLeft, fit.eyeRight];
  const [lensRx, lensRy] = fit.eyeRadius;
  const heart = item.icon === 'heart';
  const rim = item.color;
  const drawLens = (x:number,y:number) => heart
    ? <path d={`M${x} ${y-lensRy*.57} C${x-lensRx*.9} ${y-lensRy*1.6} ${x-lensRx*1.5} ${y-lensRy*.2} ${x} ${y+lensRy*.9} C${x+lensRx*1.5} ${y-lensRy*.2} ${x+lensRx*.9} ${y-lensRy*1.6} ${x} ${y-lensRy*.57}Z`}
        stroke={rim} strokeWidth="11" strokeLinejoin="round" fill={item.accent} fillOpacity=".16" />
    : <ellipse cx={x} cy={y} rx={lensRx} ry={lensRy} fill={item.accent} fillOpacity=".1"
        stroke={rim} strokeWidth="11" />;
  return <g aria-label={`${item.name}（对齐眼睛）`}>
    {drawLens(lx,ly)}{drawLens(rx,ry)}
    <path d={`M${lx+lensRx-4} ${ly-18} Q${(lx+rx)/2} ${Math.min(ly,ry)-50} ${rx-lensRx+4} ${ry-18}`}
      stroke={rim} strokeWidth="11" strokeLinecap="round" fill="none" />
    <path d={`M${lx-lensRx+2} ${ly-27} Q${lx-lensRx-42} ${ly-47} ${lx-lensRx-59} ${ly-63}
      M${rx+lensRx-2} ${ry-27} Q${rx+lensRx+39} ${ry-47} ${rx+lensRx+55} ${ry-63}`}
      stroke={rim} strokeWidth="12" strokeLinecap="round" fill="none" />
    <path d={`M${lx-45} ${ly-54} Q${lx-84} ${ly-26} ${lx-75} ${ly+17}`}
      stroke="#FFF" strokeWidth="8" strokeOpacity=".35" strokeLinecap="round" fill="none" />
  </g>;
}

function NeckBow({ item, fit }: { item: ShopItem; fit: CatFit }) {
  const [x,y] = fit.neck;
  const cy=y+26;
  return <g aria-label={`${item.name}（系在颈部）`}>
    <path d={`M${x-9} ${cy} C${x-88} ${cy-87} ${x-168} ${cy-57} ${x-146} ${cy+13} C${x-130} ${cy+80} ${x-58} ${cy+72} ${x-8} ${cy+15}Z`}
      fill={item.color} stroke={Outline} strokeWidth="9" strokeLinejoin="round"/>
    <path d={`M${x+8} ${cy} C${x+89} ${cy-87} ${x+165} ${cy-57} ${x+147} ${cy+13} C${x+127} ${cy+80} ${x+57} ${cy+72} ${x+8} ${cy+15}Z`}
      fill={item.color} stroke={Outline} strokeWidth="9" strokeLinejoin="round"/>
    <path d={`M${x-128} ${cy-17} Q${x-64} ${cy-3} ${x-24} ${cy+6}
      M${x+128} ${cy-17} Q${x+64} ${cy-3} ${x+24} ${cy+6}`}
      stroke={item.accent} strokeWidth="12" strokeOpacity=".85" fill="none" />
    <ellipse cx={x} cy={cy+6} rx="27" ry="31" fill={item.accent} stroke={Outline} strokeWidth="8" />
    <circle cx={x} cy={cy+6} r="9" fill="#FFF8E6" />
  </g>;
}

function Accessory({ item, fit }: { item: ShopItem; fit: CatFit }) {
  const [neckX,neckY] = fit.neck;
  const x=neckX+165,y=neckY+135;
  if(item.icon==='star') return <g aria-label={`${item.name}（别在衣襟上）`}>
    <path d={`M${x} ${y-53} l17 34 37 5 -27 25 7 37 -34 -18 -34 18 7 -37 -27 -25 37 -5Z`}
      fill={item.color} stroke={Outline} strokeWidth="9" strokeLinejoin="round" />
    <circle cx={x} cy={y} r="12" fill={item.accent}/>
  </g>;
  return <g aria-label={`${item.name}（别在衣襟上）`}>
    <path d={`M${x-9} ${y-47} Q${x} ${y-71} ${x+9} ${y-47}`} stroke={item.color} strokeWidth="13" fill="none" />
    <circle cx={x} cy={y} r="35" fill={item.color} stroke={Outline} strokeWidth="8" />
    <circle cx={x} cy={y} r="22" fill={item.accent} stroke="#FFF" strokeWidth="7" />
    <circle cx={x-8} cy={y-7} r="7" fill="white" fillOpacity=".85" />
  </g>;
}

export const FittedCatOutfit: React.FC<{ cat: CatId; items: Partial<Record<OutfitSlot,string>> }> = ({cat,items}) => {
  const fit=CAT_FIT[cat];
  const get=(slot:OutfitSlot)=>SHOP_ITEM_BY_ID.get(items[slot]||'')?.slot===slot?SHOP_ITEM_BY_ID.get(items[slot]||''):undefined;
  const clothes=get('clothes'),glasses=get('glasses'),bow=get('bow'),accessory=get('accessory');
  if(!clothes && !glasses && !bow && !accessory) return null;
  return <svg aria-label="已穿戴的装扮" className="absolute inset-0 w-full h-full pointer-events-none overflow-visible" viewBox="0 0 1000 1000" preserveAspectRatio="none" xmlns="http://www.w3.org/2000/svg">
    {clothes && <Dress item={clothes} fit={fit}/>}
    {glasses && <Glasses item={glasses} fit={fit}/>}
    {bow && <NeckBow item={bow} fit={fit}/>}
    {accessory && <Accessory item={accessory} fit={fit}/>}
  </svg>;
};

import {SHOP_ITEMS} from '../data/catShop';
const SHOP_ITEM_BY_ID = new Map(SHOP_ITEMS.map(i=>[i.id,i]));
