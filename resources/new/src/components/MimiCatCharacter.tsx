import React, { useState } from 'react';
import { MascotEmotion } from '../types/game';
import { sound } from '../utils/sound';

interface MimiCatCharacterProps {
  emotion: MascotEmotion;
  size?: number;
  className?: string;
  onClick?: () => void;
}

/** Gold-shaded Mimi mascot; image asset is kept separate for easy future wardrobe swaps. */
export const MimiCatCharacter: React.FC<MimiCatCharacterProps> = ({
  emotion, size = 100, className = '', onClick,
}) => {
  const [clickHeart, setClickHeart] = useState(false);
  const handleClick = () => {
    sound.playKittenMewShort();
    setClickHeart(true);
    window.setTimeout(() => setClickHeart(false), 900);
    onClick?.();
  };
  return (
    <div
      onClick={handleClick}
      className={`relative inline-flex items-center justify-center cursor-pointer select-none transition-transform active:scale-95 group ${className}`}
      style={{ width: size, height: size }}
      title="我是咪咪翻译官！喵呜~ 点我听甜美猫叫！"
    >
      {clickHeart && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2 pointer-events-none text-rose-500 text-lg font-bold animate-bounce z-30 flex items-center gap-1 drop-shadow-md">
          <span>❤️</span>
          <span className="text-[10px] bg-white/90 text-rose-600 px-1.5 py-0.5 rounded-full border border-rose-200">喵~</span>
        </div>
      )}
      <img
        src="./assets/mimi-golden.png"
        alt="金渐层咪咪翻译官"
        draggable={false}
        width={size}
        height={size}
        className={`w-full h-full object-contain drop-shadow-sm transition-transform duration-300 group-hover:scale-105 ${
          emotion === 'shocked' ? 'animate-wobble' : emotion === 'celebrating' ? 'animate-bounce' : 'animate-cat-breathe'
        }`}
      />
    </div>
  );
};
