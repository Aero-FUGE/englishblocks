import React from 'react';
import { MascotEmotion } from '../types/game';

interface MascotCharacterProps {
  emotion: MascotEmotion;
  size?: number;
  className?: string;
  onClick?: () => void;
}

export const MascotCharacter: React.FC<MascotCharacterProps> = ({
  emotion,
  size = 72,
  className = '',
  onClick,
}) => {
  return (
    <div
      onClick={onClick}
      className={`relative inline-flex items-center justify-center cursor-pointer transition-transform active:scale-95 ${className}`}
      style={{ width: size, height: size }}
      title="我是实时翻译官：咪咪翻译官！点我听吐槽~"
    >
      <svg
        viewBox="0 0 100 100"
        width={size}
        height={size}
        className={`drop-shadow-md overflow-visible ${
          emotion === 'shocked'
            ? 'animate-jelly-shock'
            : emotion === 'celebrating'
            ? 'animate-bounce'
            : 'animate-jelly'
        }`}
      >
        <defs>
          {/* Jelly Soft Gradient */}
          <linearGradient id="jellyBodyGrad" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#7DD3FC" />
            <stop offset="60%" stopColor="#38BDF8" />
            <stop offset="100%" stopColor="#0284C7" />
          </linearGradient>

          {/* Jelly Top Gloss */}
          <linearGradient id="jellyGloss" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.8" />
            <stop offset="100%" stopColor="#FFFFFF" stopOpacity="0.05" />
          </linearGradient>

          {/* Cheeks */}
          <radialGradient id="cheekGlow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#FB7185" stopOpacity="0.8" />
            <stop offset="100%" stopColor="#FB7185" stopOpacity="0" />
          </radialGradient>
        </defs>

        {/* Jelly Body Shadow */}
        <ellipse cx="50" cy="92" rx="34" ry="7" fill="#000000" opacity="0.12" />

        {/* Jelly Main Body (Soft rounded blob) */}
        <path
          d={
            emotion === 'puzzled'
              ? 'M20,68 C16,42 24,20 46,16 C68,12 84,28 82,54 C80,78 72,88 50,88 C28,88 24,84 20,68 Z'
              : emotion === 'shocked'
              ? 'M24,78 C18,48 24,14 50,14 C76,14 82,48 76,78 C72,89 64,90 50,90 C36,90 28,89 24,78 Z'
              : 'M18,65 C15,38 28,18 50,18 C72,18 85,38 82,65 C80,84 70,88 50,88 C30,88 20,84 18,65 Z'
          }
          fill="url(#jellyBodyGrad)"
          stroke="#0284C7"
          strokeWidth="3.5"
        />

        {/* Top Gloss Highlight */}
        <path
          d="M28,32 C34,24 45,22 55,23 C50,28 38,32 30,42 C28,38 27,35 28,32 Z"
          fill="url(#jellyGloss)"
        />
        <circle cx="68" cy="30" r="3" fill="#FFFFFF" opacity="0.75" />

        {/* Rosy Cheeks */}
        <circle cx="28" cy="62" r="7" fill="url(#cheekGlow)" />
        <circle cx="72" cy="62" r="7" fill="url(#cheekGlow)" />

        {/* EMOTION FACES */}
        {emotion === 'happy' && (
          <g>
            {/* Happy Curved Eyes */}
            <path d="M32,50 Q40,43 45,50" fill="none" stroke="#0C4A6E" strokeWidth="4" strokeLinecap="round" />
            <path d="M55,50 Q60,43 68,50" fill="none" stroke="#0C4A6E" strokeWidth="4" strokeLinecap="round" />
            {/* Happy Smile */}
            <path d="M42,60 Q50,70 58,60" fill="none" stroke="#0C4A6E" strokeWidth="3.5" strokeLinecap="round" />
          </g>
        )}

        {emotion === 'puzzled' && (
          <g>
            {/* Left Eye normal round */}
            <circle cx="36" cy="48" r="4.5" fill="#0C4A6E" />
            <circle cx="37.5" cy="46.5" r="1.5" fill="#FFFFFF" />
            {/* Right Eye squinted */}
            <circle cx="64" cy="50" r="3.5" fill="#0C4A6E" />
            {/* Raised Eyebrow on left */}
            <path d="M30,40 Q37,34 44,39" fill="none" stroke="#0C4A6E" strokeWidth="3" strokeLinecap="round" />
            {/* Flat mouth */}
            <path d="M46,63 Q52,65 56,62" fill="none" stroke="#0C4A6E" strokeWidth="3" strokeLinecap="round" />
            {/* Little Question Mark */}
            <text x="74" y="32" fill="#F59E0B" fontSize="16" fontWeight="bold" fontFamily="sans-serif">?</text>
          </g>
        )}

        {emotion === 'shocked' && (
          <g>
            {/* Wide Open Stunned Eyes */}
            <circle cx="35" cy="46" r="6.5" fill="#FFFFFF" stroke="#0C4A6E" strokeWidth="2.5" />
            <circle cx="35" cy="46" r="2.5" fill="#0C4A6E" />
            <circle cx="65" cy="46" r="6.5" fill="#FFFFFF" stroke="#0C4A6E" strokeWidth="2.5" />
            <circle cx="65" cy="46" r="2.5" fill="#0C4A6E" />
            {/* Open Gasp Mouth */}
            <ellipse cx="50" cy="65" rx="5" ry="7" fill="#0C4A6E" />
            {/* Blue sweat drop */}
            <path d="M78,40 Q84,48 80,52 Q76,54 75,50 Q74,45 78,40 Z" fill="#38BDF8" stroke="#0284C7" strokeWidth="1" />
          </g>
        )}

        {emotion === 'speechless' && (
          <g>
            {/* Horizontal Line Eyes (- -) */}
            <line x1="30" y1="48" x2="44" y2="48" stroke="#0C4A6E" strokeWidth="4" strokeLinecap="round" />
            <line x1="56" y1="48" x2="70" y2="48" stroke="#0C4A6E" strokeWidth="4" strokeLinecap="round" />
            {/* Flat Straight Mouth */}
            <line x1="43" y1="62" x2="57" y2="62" stroke="#0C4A6E" strokeWidth="3" strokeLinecap="round" />
            {/* Large Blue Sweat drop on forehead */}
            <path d="M68,26 Q74,34 70,39 Q66,41 64,37 Q62,32 68,26 Z" fill="#60A5FA" stroke="#2563EB" strokeWidth="1" />
          </g>
        )}

        {emotion === 'celebrating' && (
          <g>
            {/* Starry Eyes (★ ★) */}
            <path d="M38,48 L40,43 L45,43 L41,47 L43,52 L38,49 L33,52 L35,47 L31,43 L36,43 Z" fill="#FBBF24" stroke="#D97706" strokeWidth="1" />
            <path d="M62,48 L64,43 L69,43 L65,47 L67,52 L62,49 L57,52 L59,47 L55,43 L60,43 Z" fill="#FBBF24" stroke="#D97706" strokeWidth="1" />
            {/* Huge Cheerful Mouth with Tongue */}
            <path d="M40,58 Q50,74 60,58 Z" fill="#BE123C" stroke="#0C4A6E" strokeWidth="2.5" />
            <path d="M44,65 Q50,62 56,65 Q50,72 44,65 Z" fill="#FB7185" />
            {/* Floating Sparkles */}
            <circle cx="20" cy="24" r="2" fill="#FDE047" />
            <circle cx="80" cy="22" r="2.5" fill="#FDE047" />
            <path d="M78,16 L80,20 L84,22 L80,24 L78,28 L76,24 L72,22 L76,20 Z" fill="#F59E0B" opacity="0.8" />
          </g>
        )}
      </svg>
    </div>
  );
};
