export type PieceColor = 'red' | 'black';

export type PieceType = 
  | 'k' // 帅 / 将 (General / King)
  | 'a' // 仕 / 士 (Advisor)
  | 'b' // 相 / 象 (Elephant / Bishop)
  | 'n' // 傌 / 馬 (Horse / Knight)
  | 'r' // 俥 / 車 (Chariot / Rook)
  | 'c' // 炮 / 砲 (Cannon)
  | 'p';// 兵 / 卒 (Soldier / Pawn)

export interface Piece {
  id: string;
  type: PieceType;
  color: PieceColor;
}

export type BoardGrid = (Piece | null)[][]; // 10 rows x 9 columns

export interface Position {
  r: number; // 0..9 (row)
  c: number; // 0..8 (col)
}

export interface Move {
  from: Position;
  to: Position;
  piece: Piece;
  captured: Piece | null;
  notation: string; // Traditional Chinese, e.g. "炮二平五"
  iccs: string;     // e.g. "h2e2"
  isCheck?: boolean;
  fenBefore: string;
  fenAfter: string;
  timestamp: number;
}

export type MatchType = 'ranked' | 'casual';

export type GameStatus = 'playing' | 'checkmate' | 'stalemate' | 'resigned' | 'draw' | 'timeout';

export interface GameResult {
  winner: PieceColor | 'draw';
  reason: 'checkmate' | 'stalemate' | 'resigned' | 'draw_agreement' | 'ai_adjudication' | 'king_captured';
  redEloDelta: number;
  blackEloDelta: number;
}

export interface Player {
  id: string;
  name: string;
  avatar: string;
  rating: number;          // Current Elo rating
  highestRating: number;
  matchesPlayed: number;
  wins: number;
  losses: number;
  draws: number;
  tierTitle: string;       // e.g. 特级大师, 国家大师
  createdAt: number;
  note?: string;
}

export interface MatchRecord {
  id: string;
  type: MatchType;
  redPlayerId: string;
  redPlayerName: string;
  blackPlayerId: string;
  blackPlayerName: string;
  winner: PieceColor | 'draw';
  reason: string;
  redEloBefore: number;
  redEloAfter: number;
  blackEloBefore: number;
  blackEloAfter: number;
  redEloDelta: number;
  blackEloDelta: number;
  moves: Move[];
  date: string;
  timestamp: number;
  durationSeconds: number;
  aiAnalysis?: string;
}

export interface AIEvaluation {
  score: number; // Positive = Red advantage, Negative = Black advantage (in centipawns or points)
  winProbabilityRed: number; // 0 to 100%
  statusText: string;
  suggestedMove?: string;
  commentary?: string;
}
