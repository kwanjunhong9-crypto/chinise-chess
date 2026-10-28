import React from 'react';
import { BoardGrid, Position, PieceColor } from '../types/chess';
import { ChessPiece } from './ChessPiece';
import { findKing, isCheck } from '../utils/chessEngine';

interface ChessBoardProps {
  board: BoardGrid;
  selectedPos: Position | null;
  legalMoves: Position[];
  lastMove: { from: Position; to: Position } | null;
  isFlipped?: boolean;
  isAdmin?: boolean;
  activeColor: PieceColor;
  onSquareClick: (r: number, c: number) => void;
  onAdminPrompt?: () => void;
}

export const ChessBoard: React.FC<ChessBoardProps> = ({
  board,
  selectedPos,
  legalMoves,
  lastMove,
  isFlipped = false,
  isAdmin = true,
  activeColor,
  onSquareClick,
  onAdminPrompt,
}) => {
  // Determine if kings are currently under check
  const redChecked = isCheck(board, 'red');
  const blackChecked = isCheck(board, 'black');
  const redKing = redChecked ? findKing(board, 'red') : null;
  const blackKing = blackChecked ? findKing(board, 'black') : null;

  // Grid coordinates mapping (9 columns, 10 rows)
  // Standard (unflipped): Row 0 is Black (top), Row 9 is Red (bottom)
  // If flipped: Row 9 is Black (top), Row 0 is Red (bottom)
  const getRenderCoords = (r: number, c: number) => {
    const renderR = isFlipped ? 9 - r : r;
    const renderC = isFlipped ? 8 - c : c;
    return { renderR, renderC };
  };

  const handleClick = (r: number, c: number) => {
    if (!isAdmin) {
      if (onAdminPrompt) onAdminPrompt();
      return;
    }
    onSquareClick(r, c);
  };

  // Convert board (row, col) to percentage positioning (0% to 100%)
  // 9 columns: spaced from 0 to 8 -> col * (100 / 8) %
  // 10 rows: spaced from 0 to 9 -> row * (100 / 9) %
  const getPctPosition = (r: number, c: number) => {
    const { renderR, renderC } = getRenderCoords(r, c);
    return {
      left: `${(renderC / 8) * 100}%`,
      top: `${(renderR / 9) * 100}%`,
    };
  };

  const isLegalTarget = (r: number, c: number) => {
    return legalMoves.some(m => m.r === r && m.c === c);
  };

  const isLastMoveSquare = (r: number, c: number) => {
    if (!lastMove) return false;
    return (
      (lastMove.from.r === r && lastMove.from.c === c) ||
      (lastMove.to.r === r && lastMove.to.c === c)
    );
  };

  return (
    <div className="relative w-full max-w-[540px] mx-auto p-2 sm:p-4 rounded-2xl bg-gradient-to-b from-amber-950/90 via-stone-900 to-amber-950/90 shadow-2xl border border-amber-900/40 select-none">
      {/* Board Wooden Frame */}
      <div
        className="relative w-full rounded-xl p-3 sm:p-5 shadow-inner"
        style={{
          background: 'linear-gradient(135deg, #e8be89 0%, #d89f66 45%, #cb8c4f 70%, #b57636 100%)',
          boxShadow: 'inset 0 0 40px rgba(78, 33, 7, 0.45), 0 8px 24px rgba(0, 0, 0, 0.5)',
        }}
      >
        {/* Outer Border Inset Line */}
        <div className="relative w-full border-2 border-amber-950/80 rounded-lg p-1.5 sm:p-2 bg-amber-100/10">
          
          {/* Top Column Labels (Black viewpoint or flipped) */}
          <div className="flex justify-between px-2 text-[10px] sm:text-xs font-serif font-bold text-amber-950/80 mb-1">
            {(isFlipped
              ? ['九', '八', '七', '六', '五', '四', '三', '二', '一']
              : ['１', '２', '３', '４', '５', '６', '７', '８', '９']
            ).map((lbl, idx) => (
              <span key={idx} className="w-5 text-center">
                {lbl}
              </span>
            ))}
          </div>

          {/* SVG Chessboard Canvas (Lines, River, Crosses) */}
          <div className="relative w-full aspect-[8/9]">
            <svg
              className="absolute inset-0 w-full h-full pointer-events-none"
              viewBox="0 0 800 900"
              preserveAspectRatio="none"
            >
              {/* Outer boundary rectangle */}
              <rect x="0" y="0" width="800" height="900" fill="none" stroke="#451a03" strokeWidth="4" />

              {/* Horizontal grid lines (10 lines at y = 0, 100, 200, ... 900) */}
              {[0, 100, 200, 300, 400, 500, 600, 700, 800, 900].map((y, idx) => (
                <line
                  key={`h-${idx}`}
                  x1="0"
                  y1={y}
                  x2="800"
                  y2={y}
                  stroke="#572507"
                  strokeWidth={idx === 0 || idx === 9 ? '4' : '2'}
                />
              ))}

              {/* Vertical grid lines: Top half (y=0 to 400), Bottom half (y=500 to 900) */}
              {/* Columns 0 and 8 are continuous edge lines from 0 to 900 */}
              <line x1="0" y1="0" x2="0" y2="900" stroke="#451a03" strokeWidth="4" />
              <line x1="800" y1="0" x2="800" y2="900" stroke="#451a03" strokeWidth="4" />

              {/* Interior columns: 100, 200, 300, 400, 500, 600, 700 */}
              {[100, 200, 300, 400, 500, 600, 700].map(x => (
                <React.Fragment key={`v-${x}`}>
                  {/* Top section (0 to 400) */}
                  <line x1={x} y1="0" x2={x} y2="400" stroke="#572507" strokeWidth="2" />
                  {/* Bottom section (500 to 900) */}
                  <line x1={x} y1="500" x2={x} y2="900" stroke="#572507" strokeWidth="2" />
                </React.Fragment>
              ))}

              {/* Top Palace Diagonals (九宫格斜线: cols 3..5, rows 0..2 -> x: 300..500, y: 0..200) */}
              <line x1="300" y1="0" x2="500" y2="200" stroke="#572507" strokeWidth="2" />
              <line x1="500" y1="0" x2="300" y2="200" stroke="#572507" strokeWidth="2" />

              {/* Bottom Palace Diagonals (九宫格斜线: cols 3..5, rows 7..9 -> x: 300..500, y: 700..900) */}
              <line x1="300" y1="700" x2="500" y2="900" stroke="#572507" strokeWidth="2" />
              <line x1="500" y1="700" x2="300" y2="900" stroke="#572507" strokeWidth="2" />

              {/* River Text: 楚河 (Chu River) 漢界 (Han Border) */}
              <text
                x="200"
                y="465"
                textAnchor="middle"
                fill="#78350f"
                fontSize="42"
                fontWeight="900"
                fontFamily='"Ma Shan Zheng", "Noto Serif SC", serif'
                letterSpacing="18"
                opacity="0.85"
              >
                {isFlipped ? '漢界' : '楚河'}
              </text>
              <text
                x="600"
                y="465"
                textAnchor="middle"
                fill="#78350f"
                fontSize="42"
                fontWeight="900"
                fontFamily='"Ma Shan Zheng", "Noto Serif SC", serif'
                letterSpacing="18"
                opacity="0.85"
              >
                {isFlipped ? '楚河' : '漢界'}
              </text>
            </svg>

            {/* Clickable Grid Intersections and Pieces */}
            <div className="absolute inset-0">
              {Array.from({ length: 10 }).map((_, r) =>
                Array.from({ length: 9 }).map((_, c) => {
                  const piece = board[r][c];
                  const posPct = getPctPosition(r, c);
                  const isSelected = selectedPos?.r === r && selectedPos?.c === c;
                  const isTarget = isLegalTarget(r, c);
                  const isLast = isLastMoveSquare(r, c);
                  const isCheckedKing =
                    (redKing?.r === r && redKing?.c === c) ||
                    (blackKing?.r === r && blackKing?.c === c);

                  return (
                    <div
                      key={`square-${r}-${c}`}
                      onClick={() => handleClick(r, c)}
                      className="absolute -translate-x-1/2 -translate-y-1/2 flex items-center justify-center cursor-pointer group"
                      style={{
                        left: posPct.left,
                        top: posPct.top,
                        width: '11.5%',
                        height: '10.2%',
                        zIndex: isSelected ? 30 : piece ? 15 : 10,
                      }}
                      title={`${r}行 ${c}列`}
                    >
                      {/* Last Move Footprint Highlight */}
                      {isLast && !isSelected && (
                        <div className="absolute inset-0 rounded-full bg-emerald-500/25 animate-pulse border border-emerald-500/60" />
                      )}

                      {/* Piece Rendering */}
                      {piece ? (
                        <ChessPiece
                          piece={piece}
                          isSelected={isSelected}
                          isLastMoveTarget={isLast}
                          isCheckTarget={isCheckedKing}
                        />
                      ) : (
                        // Hover crosshair for empty intersections
                        <div className="w-2.5 h-2.5 rounded-full bg-amber-950/20 group-hover:bg-amber-900/50 transition-colors" />
                      )}

                      {/* Legal Move Candidate Dot */}
                      {isTarget && (
                        <div
                          className={`absolute z-25 pointer-events-none rounded-full flex items-center justify-center ${
                            piece
                              ? 'inset-0 border-4 border-red-500 animate-ping opacity-75'
                              : 'w-4 h-4 bg-emerald-600/90 shadow-md ring-2 ring-white/80'
                          }`}
                        />
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Bottom Column Labels (Red viewpoint or flipped) */}
          <div className="flex justify-between px-2 text-[10px] sm:text-xs font-serif font-bold text-amber-950/80 mt-1">
            {(isFlipped
              ? ['１', '２', '３', '４', '５', '６', '７', '８', '９']
              : ['九', '八', '七', '六', '五', '四', '三', '二', '一']
            ).map((lbl, idx) => (
              <span key={idx} className="w-5 text-center">
                {lbl}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Admin Notice Bar */}
      {!isAdmin && (
        <div
          onClick={onAdminPrompt}
          className="mt-2 py-1.5 px-3 rounded-lg bg-amber-900/50 border border-amber-600/40 text-amber-200 text-xs text-center cursor-pointer hover:bg-amber-800/60 transition flex items-center justify-center gap-1.5"
        >
          <svg className="w-3.5 h-3.5 text-amber-400" fill="currentColor" viewBox="0 0 20 20">
            <path
              fillRule="evenodd"
              d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z"
              clipRule="evenodd"
            />
          </svg>
          <span>当前为观战视角。仅管理员可执棋操作（点击输入密码解锁）</span>
        </div>
      )}
    </div>
  );
};
