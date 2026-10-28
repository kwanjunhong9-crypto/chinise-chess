import React from 'react';
import { Piece } from '../types/chess';
import { PIECE_NAMES } from '../utils/chessEngine';

interface ChessPieceProps {
  piece: Piece;
  isSelected?: boolean;
  isLastMoveTarget?: boolean;
  isCheckTarget?: boolean;
}

export const ChessPiece: React.FC<ChessPieceProps> = ({
  piece,
  isSelected = false,
  isLastMoveTarget = false,
  isCheckTarget = false,
}) => {
  const isRed = piece.color === 'red';
  const name = PIECE_NAMES[piece.color][piece.type];

  return (
    <div
      className={`relative w-full h-full rounded-full flex items-center justify-center select-none transition-all duration-200 cursor-pointer
        ${isSelected ? '-translate-y-1.5 scale-105 shadow-2xl z-20 ring-4 ring-amber-400' : 'shadow-md hover:scale-102'}
        ${isLastMoveTarget ? 'ring-2 ring-emerald-500' : ''}
        ${isCheckTarget ? 'ring-4 ring-red-600 animate-pulse' : ''}
      `}
      style={{
        background: isRed
          ? 'radial-gradient(circle at 35% 35%, #fffbeb 0%, #fef3c7 45%, #fde68a 80%, #d97706 100%)'
          : 'radial-gradient(circle at 35% 35%, #f5f5f4 0%, #e7e5e4 45%, #d6d3d1 80%, #a8a29e 100%)',
        boxShadow: isSelected
          ? '0 12px 20px -3px rgba(0, 0, 0, 0.4), inset 0 2px 4px rgba(255, 255, 255, 0.8), inset 0 -3px 5px rgba(0, 0, 0, 0.3)'
          : '0 4px 8px -1px rgba(0, 0, 0, 0.3), inset 0 2px 4px rgba(255, 255, 255, 0.7), inset 0 -2px 4px rgba(0, 0, 0, 0.25)',
      }}
    >
      {/* Outer wooden piece bevel ridge */}
      <div
        className={`absolute inset-0.5 rounded-full border ${
          isRed ? 'border-amber-700/60' : 'border-stone-600/60'
        }`}
      />

      {/* Inner carved groove ring */}
      <div
        className={`absolute inset-1.5 rounded-full border-2 border-dashed ${
          isRed ? 'border-red-600/70' : 'border-stone-800/70'
        }`}
      />

      {/* Calligraphy Character */}
      <span
        className={`relative z-10 font-bold select-none leading-none tracking-tight font-serif ${
          isRed ? 'text-red-700 drop-shadow-[0_1px_1px_rgba(255,255,255,0.8)]' : 'text-stone-900 drop-shadow-[0_1px_1px_rgba(255,255,255,0.7)]'
        }`}
        style={{
          fontFamily: '"Ma Shan Zheng", "Noto Serif SC", STKaiti, KaiTi, serif',
          fontSize: 'clamp(1.1rem, 4.5vw, 2.3rem)',
          textShadow: isRed
            ? '0 1px 0 rgba(255,255,255,0.6), 0 -1px 0 rgba(153,27,27,0.4)'
            : '0 1px 0 rgba(255,255,255,0.6), 0 -1px 0 rgba(28,25,23,0.4)',
        }}
      >
        {name}
      </span>
    </div>
  );
};
