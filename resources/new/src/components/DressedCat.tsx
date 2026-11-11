import React from 'react';
import type { MascotEmotion } from '../types/game';
import { SHOP_ITEMS, type CatId, type OutfitSlot } from '../data/catShop';

export type CatPose = 'peek' | 'half' | 'stand' | 'sit';
export type CatExpression = 'smile' | 'focus' | 'proud' | 'shy';

export const CAT_IMAGES: Record<CatId, string> = {
  mimi: './assets/cat-poses/mimi/peek.png',
  tuanzhang: './assets/cat-poses/tuanzhang/peek.png',
};

type LayerKey = OutfitSlot | 'paws' | 'base';
type LayerAdjust = { x?: number; y?: number; scale?: number; rotate?: number };

const DEFAULT_ADJUST: LayerAdjust = { x: 0, y: 0, scale: 1, rotate: 0 };

/**
 * Pose specific tweaks for the approved PNG wearables. The underlying assets are
 * already matched to each cat, but glasses / bows / clothes still need tiny
 * pose-aware nudges so they look worn rather than pasted. Values are percentages
 * relative to the rendered mascot box.
 */
const LAYER_ADJUSTMENTS: Record<CatId, Partial<Record<Exclude<CatPose, 'sit'>, Partial<Record<LayerKey, LayerAdjust>>>>> = {
  mimi: {
    peek: {
      glasses: { y: 5.8, scale: 0.9 },
      bow: { y: 8.8, scale: 0.94 },
      clothes: { y: 9.4, scale: 1.1 },
      accessory: { y: 8.2, scale: 1.02 },
      paws: { y: 4.5 },
    },
    half: {
      glasses: { y: 2.8, scale: 0.94 },
      bow: { y: 2.2, scale: 0.98 },
      clothes: { y: 2.8, scale: 1.04 },
      accessory: { y: 2.6 },
      paws: { y: 1.6 },
    },
    stand: {
      glasses: { y: 4.2, scale: 0.9 },
      bow: { y: 2.8, scale: 0.97 },
      clothes: { y: 2.2, scale: 1.05 },
      accessory: { y: 2.0 },
      paws: { y: 0.8 },
    },
  },
  tuanzhang: {
    peek: {
      glasses: { y: 6.6, scale: 0.88 },
      bow: { y: 9.8, scale: 0.92 },
      clothes: { y: 10.5, scale: 1.12 },
      accessory: { y: 8.6, scale: 1.02 },
      paws: { y: 4.8 },
    },
    half: {
      glasses: { y: 3.6, scale: 0.92 },
      bow: { y: 2.8, scale: 0.97 },
      clothes: { y: 3.0, scale: 1.05 },
      accessory: { y: 2.4 },
      paws: { y: 1.7 },
    },
    stand: {
      glasses: { y: 5.0, scale: 0.88 },
      bow: { y: 3.0, scale: 0.97 },
      clothes: { y: 2.4, scale: 1.05 },
      accessory: { y: 2.1 },
      paws: { y: 0.9 },
    },
  },
};

export const DressedCat: React.FC<{
  cat: CatId;
  items?: Partial<Record<OutfitSlot, string>>;
  size?: number;
  className?: string;
  emotion?: MascotEmotion;
  pose?: CatPose;
  expression?: CatExpression;
  showGround?: boolean;
  translator?: boolean;
}> = ({cat, items={}, size=130, className='', emotion='happy', pose='peek', expression='smile', showGround=true, translator=false}) => {
  const safePose = pose === 'sit' ? 'half' : pose;
  const base = translator && cat==='mimi' ? `./assets/mimi-translator/${pose==='peek'?'peek':pose==='half'?'half':'full'}.png` : `./assets/cat-poses/${cat}/${safePose}.png`;
  const sprite = (id: string) => `./assets/wearables/${cat}/${safePose}/${id}.png?v=21`;
  const slotted = (slot: OutfitSlot) => {
    const id = items[slot];
    return id && SHOP_ITEMS.some(x => x.id === id && x.slot === slot && x.cats.includes(cat)) ? id : undefined;
  };
  const clothes = slotted('clothes');
  const accessory = slotted('accessory');
  const bow = slotted('bow');
  const glasses = slotted('glasses');
  const hat = slotted('hat');

  const getAdjust = (key: LayerKey): LayerAdjust => ({
    ...DEFAULT_ADJUST,
    ...(LAYER_ADJUSTMENTS[cat]?.[safePose as Exclude<CatPose, 'sit'>]?.[key] || {}),
  });

  const layer = (src: string, key: LayerKey, classNames = '') => {
    const adjust = getAdjust(key);
    return (
      <img
        key={key}
        src={src}
        alt=""
        draggable={false}
        className={`absolute inset-0 block w-full h-full select-none pointer-events-none ${classNames}`}
        style={{
          objectFit: 'contain',
          transform: `translate(${adjust.x || 0}%, ${adjust.y || 0}%) scale(${adjust.scale || 1}) rotate(${adjust.rotate || 0}deg)`,
          transformOrigin: 'center center',
        }}
      />
    );
  };

  return <div className={`relative shrink-0 select-none ${className}`} style={{width:size,height:size}} role="img"
    aria-label={`${cat==='mimi'?'咪咪':'团长'}，${safePose==='peek'?'探头':safePose==='half'?'半身':'站立'}，已穿戴：${[hat,glasses,bow,clothes,accessory].filter(Boolean).length}件`}>
    <div className={'relative w-full h-full transition-transform duration-200 '+
      (emotion==='puzzled'?'rotate-[-4deg]':emotion==='shocked'?'scale-[1.035]':emotion==='celebrating'?'animate-bounce':'')}>
      {showGround && <div aria-hidden="true" className="absolute left-[27%] right-[27%] bottom-[6%] h-[6%] rounded-[50%] bg-[#9cb47b]/15 blur-sm"/>}
      {layer(base,'base')}
      {clothes && layer(sprite(clothes),'clothes')}
      {clothes && layer(`./assets/cat-paws/${cat}/${safePose}.png`,'paws')}
      {accessory && layer(sprite(accessory),'accessory')}
      {bow && layer(sprite(bow),'bow')}
      {glasses && layer(sprite(glasses),'glasses')}
      {hat && layer(sprite(hat),'hat')}
    </div>
    {(emotion==='puzzled' || (emotion==='happy' && expression==='focus')) && <span className="absolute right-0 top-1 text-[#BA9A67] text-lg font-bold">?</span>}
    {emotion==='shocked' && <span className="absolute right-0 top-1 text-[#D99687] text-lg font-bold">!</span>}
    {emotion==='celebrating' && <span className="absolute right-0 top-1 text-amber-400 text-lg font-bold">✦</span>}
    {emotion==='speechless' && <span className="absolute right-0 top-1 text-slate-400 text-sm font-bold">…</span>}
    {emotion==='happy' && expression==='proud' && <span className="absolute right-0 top-1 text-amber-400 text-lg font-bold">✦</span>}
    {emotion==='happy' && expression==='shy' && <span className="absolute right-0 top-1 text-rose-300 text-lg font-bold">♡</span>}
  </div>;
};
