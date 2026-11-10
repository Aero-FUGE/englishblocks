import React from 'react';
import type { CatId, OutfitSlot } from '../data/catShop';
import { DressedCat } from './DressedCat';
export type { CatPose, CatExpression } from './DressedCat';
import type { CatPose, CatExpression } from './DressedCat';
export const POSE_UNLOCK_TIER:Record<CatPose,number> = {peek:1,half:1,stand:2,sit:3};
/** Uses the approved PNG character + transparent wearable layers. No SVG cats. */
export const PoseDressedCat:React.FC<{
  cat:CatId;items?:Partial<Record<OutfitSlot,string>>;
  pose?:CatPose;expression?:CatExpression;size?:number;className?:string;showGround?:boolean;
}> = ({cat,items,pose='peek',expression='smile',size=180,className='',showGround=true}) =>
  <DressedCat cat={cat} items={items} pose={pose} expression={expression} size={size} className={className} showGround={showGround}/>;
