import { BoardGrid, PieceColor, PieceType, AIEvaluation, GameResult } from '../types/chess';
import { getLegalMoves, isCheck } from './chessEngine';

// Standard Xiangqi piece base values
const PIECE_VALUES: Record<PieceType, number> = {
  k: 10000,
  r: 900,
  c: 450,
  n: 400,
  b: 200,
  a: 200,
  p: 100,
};

/**
 * Calculates positional bonus for pieces (e.g. advance pawns, active rooks)
 */
function getPositionBonus(type: PieceType, color: PieceColor, r: number, c: number): number {
  let bonus = 0;
  const isRed = color === 'red';

  if (type === 'p') {
    // Soldier/Pawn bonus for crossing river and getting close to enemy palace
    if (isRed) {
      if (r <= 4) bonus += 100; // Crossed river
      if (r <= 2) bonus += 50;  // Penetrated palace area
      if (c >= 3 && c <= 5) bonus += 30; // Center file
    } else {
      if (r >= 5) bonus += 100;
      if (r >= 7) bonus += 50;
      if (c >= 3 && c <= 5) bonus += 30;
    }
  } else if (type === 'n') {
    // Horse likes central files
    if (c >= 2 && c <= 6) bonus += 25;
    // Crossing river
    if ((isRed && r <= 4) || (!isRed && r >= 5)) bonus += 35;
  } else if (type === 'r') {
    // Chariots like open columns and penetrating
    if ((isRed && r <= 4) || (!isRed && r >= 5)) bonus += 40;
  } else if (type === 'c') {
    // Central cannon
    if (c === 4) bonus += 30;
  }

  return bonus;
}

/**
 * Evaluate the board position from Red's perspective
 * Positive = Red advantage, Negative = Black advantage
 */
export function evaluateBoard(board: BoardGrid): AIEvaluation {
  let redMaterial = 0;
  let blackMaterial = 0;
  let redMobility = 0;
  let blackMobility = 0;

  for (let r = 0; r < 10; r++) {
    for (let c = 0; c < 9; c++) {
      const piece = board[r][c];
      if (!piece) continue;

      const baseVal = PIECE_VALUES[piece.type];
      const posBonus = getPositionBonus(piece.type, piece.color, r, c);
      const totalVal = baseVal + posBonus;

      if (piece.color === 'red') {
        redMaterial += totalVal;
      } else {
        blackMaterial += totalVal;
      }
    }
  }

  // Quick mobility check for attacking pieces
  for (let r = 0; r < 10; r++) {
    for (let c = 0; c < 9; c++) {
      const piece = board[r][c];
      if (piece && ['r', 'c', 'n'].includes(piece.type)) {
        const moves = getLegalMoves(board, { r, c });
        if (piece.color === 'red') {
          redMobility += moves.length * 5;
        } else {
          blackMobility += moves.length * 5;
        }
      }
    }
  }

  // Check state penalties
  if (isCheck(board, 'red')) redMaterial -= 120;
  if (isCheck(board, 'black')) blackMaterial -= 120;

  const score = (redMaterial + redMobility) - (blackMaterial + blackMobility);

  // Convert raw score to Win Probability % for Red
  // A difference of 450 points (e.g. 1 cannon) gives ~75% win probability
  const exponent = -score / 450;
  const winProbabilityRed = Math.min(99, Math.max(1, Math.round((1 / (1 + Math.pow(10, exponent))) * 100)));

  let statusText = '局面均势，胜负难料';
  if (score > 600) {
    statusText = '红方大优（胜券在握）';
  } else if (score > 250) {
    statusText = '红方稍占上风';
  } else if (score < -600) {
    statusText = '黑方大优（胜券在握）';
  } else if (score < -250) {
    statusText = '黑方稍占上风';
  }

  return {
    score,
    winProbabilityRed,
    statusText,
  };
}

/**
 * Calculates Elo rating changes based on standard chess formula
 * K = 32
 */
export function calculateEloDelta(
  redRating: number,
  blackRating: number,
  result: 'red' | 'black' | 'draw'
): { redDelta: number; blackDelta: number } {
  const K = 32;

  // Expected scores
  const expectedRed = 1 / (1 + Math.pow(10, (blackRating - redRating) / 400));
  const expectedBlack = 1 - expectedRed;

  let actualRed = 0.5;
  let actualBlack = 0.5;

  if (result === 'red') {
    actualRed = 1.0;
    actualBlack = 0.0;
  } else if (result === 'black') {
    actualRed = 0.0;
    actualBlack = 1.0;
  }

  const redDelta = Math.round(K * (actualRed - expectedRed));
  const blackDelta = Math.round(K * (actualBlack - expectedBlack));

  return { redDelta, blackDelta };
}

/**
 * Derives a human-readable title based on Elo rating
 */
export function getTierTitleByRating(rating: number): { title: string; color: string; badge: string } {
  if (rating >= 2100) {
    return { title: '特级大师', color: 'from-amber-400 to-amber-600 text-amber-950 font-black', badge: '🥇 棋界泰斗' };
  } else if (rating >= 1900) {
    return { title: '国家大师', color: 'from-orange-400 to-red-500 text-white font-bold', badge: '🥈 棋坛宗师' };
  } else if (rating >= 1700) {
    return { title: '棋协大师', color: 'from-purple-400 to-indigo-500 text-white font-bold', badge: '🥉 弈林名宿' };
  } else if (rating >= 1550) {
    return { title: '业余豪强', color: 'from-blue-400 to-cyan-500 text-white font-medium', badge: '⚔️ 棋艺精湛' };
  } else if (rating >= 1400) {
    return { title: '江湖高手', color: 'from-emerald-400 to-teal-500 text-white font-medium', badge: '🌿 初出茅庐' };
  } else {
    return { title: '初涉江湖', color: 'from-stone-400 to-stone-500 text-white font-medium', badge: '🌱 新秀棋手' };
  }
}

/**
 * AI Commentary generator for match recap
 */
export function generateAIMatchSummary(
  winnerName: string,
  loserName: string,
  totalMoves: number,
  resultType: string
): string {
  if (resultType === 'draw') {
    return `本局双方鏖战 ${totalMoves} 回合，布局严密、攻守兼备，残局子力互相牵制，最终握手言和，尽显大师风范！`;
  }

  const openingStyles = [
    '中炮对屏风马布局',
    '当头炮进兵局',
    '飞象局沉稳相持',
    '仙人指路稳扎稳打',
  ];
  const opening = openingStyles[Math.floor(Math.random() * openingStyles.length)];

  return `本局由「${winnerName}」执子力克「${loserName}」，双方开局以${opening}展开较量。进入中局后，胜方运子精妙，在中路构筑强大攻势，最终在第 ${totalMoves} 回合一举奠定胜局！`;
}
