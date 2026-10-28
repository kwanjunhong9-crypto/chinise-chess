import React, { useEffect } from 'react';
import confetti from 'canvas-confetti';
import { GameResult, MatchType, Player } from '../types/chess';
import { sounds } from '../utils/audio';

interface GameOverModalProps {
  isOpen: boolean;
  matchType: MatchType;
  redPlayer: Player;
  blackPlayer: Player;
  result: GameResult;
  moveCount: number;
  aiSummary: string;
  onClose: () => void;
  onStartReview: () => void;
  onGoToLeaderboard: () => void;
  onNewMatch: () => void;
}

export const GameOverModal: React.FC<GameOverModalProps> = ({
  isOpen,
  matchType,
  redPlayer,
  blackPlayer,
  result,
  moveCount,
  aiSummary,
  onClose,
  onStartReview,
  onGoToLeaderboard,
  onNewMatch,
}) => {
  useEffect(() => {
    if (isOpen) {
      sounds.playVictory();
      // Confetti burst
      try {
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.6 },
          colors: ['#d97706', '#ef4444', '#10b981', '#f59e0b', '#ffffff'],
        });
      } catch {
        // Fallback if canvas is blocked
      }
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const isDraw = result.winner === 'draw';
  const isRedWin = result.winner === 'red';
  const winnerName = isDraw ? '双方握手言和' : isRedWin ? redPlayer.name : blackPlayer.name;

  const reasonLabels: Record<string, string> = {
    checkmate: '将死（绝杀无解）',
    stalemate: '困毙（无子可动判负）',
    resigned: '认输认负',
    draw_agreement: '协议和棋',
    ai_adjudication: 'AI 裁判判定胜负',
    king_captured: '老将阵亡',
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md animate-fade-in">
      <div className="w-full max-w-lg rounded-2xl bg-stone-900 border-2 border-amber-600/80 shadow-2xl overflow-hidden flex flex-col text-stone-100">
        {/* Banner with Crown / Ribbon */}
        <div className="p-6 bg-gradient-to-b from-amber-950 via-stone-900 to-stone-900 text-center relative border-b border-stone-800">
          <div className="inline-block p-3 rounded-2xl bg-amber-600/20 border border-amber-500/40 mb-3 shadow-lg">
            <span className="text-4xl">{isDraw ? '🤝' : '👑'}</span>
          </div>
          <h2 className="text-2xl font-black text-amber-300 font-serif tracking-wide">
            {isDraw ? '对局握手言和' : `🏆 ${winnerName} 荣获胜利！`}
          </h2>
          <p className="text-xs text-stone-400 mt-1">
            结算原因：{reasonLabels[result.reason] || '常规决胜'} · 共进行 {moveCount} 回合
          </p>
        </div>

        <div className="p-5 sm:p-6 space-y-5">
          {/* Elo Rating Settlement Cards */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-stone-400 uppercase tracking-wider">
                {matchType === 'ranked' ? '天梯排位 Elo 积分结算' : '普通匹配（友谊赛无积分变动）'}
              </span>
              <span className="text-[11px] px-2 py-0.5 rounded-full bg-amber-950 text-amber-300 border border-amber-800">
                {matchType === 'ranked' ? '官方天梯榜生效' : '休闲练习'}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-3">
              {/* Red Card */}
              <div
                className={`p-3.5 rounded-xl border flex flex-col justify-between ${
                  isRedWin
                    ? 'bg-red-950/40 border-red-500/60 shadow-lg'
                    : 'bg-stone-950 border-stone-800'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold text-red-400 flex items-center gap-1">
                    <span className="w-2.5 h-2.5 rounded-full bg-red-600 inline-block" />
                    红方 · {redPlayer.name}
                  </span>
                  {isRedWin && <span className="text-xs font-black text-amber-400">WIN</span>}
                </div>
                <div className="flex items-baseline justify-between mt-1">
                  <span className="text-xs text-stone-400">Elo天梯分</span>
                  <div className="text-right">
                    <span className="text-lg font-black font-mono text-white">
                      {redPlayer.rating + (matchType === 'ranked' ? result.redEloDelta : 0)}
                    </span>
                    {matchType === 'ranked' && (
                      <span
                        className={`text-xs font-bold ml-1.5 font-mono ${
                          result.redEloDelta > 0
                            ? 'text-emerald-400'
                            : result.redEloDelta < 0
                            ? 'text-red-400'
                            : 'text-stone-400'
                        }`}
                      >
                        {result.redEloDelta > 0 ? `+${result.redEloDelta}` : result.redEloDelta}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Black Card */}
              <div
                className={`p-3.5 rounded-xl border flex flex-col justify-between ${
                  !isDraw && !isRedWin
                    ? 'bg-amber-950/40 border-amber-500/60 shadow-lg'
                    : 'bg-stone-950 border-stone-800'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold text-stone-300 flex items-center gap-1">
                    <span className="w-2.5 h-2.5 rounded-full bg-stone-700 inline-block" />
                    黑方 · {blackPlayer.name}
                  </span>
                  {!isDraw && !isRedWin && (
                    <span className="text-xs font-black text-amber-400">WIN</span>
                  )}
                </div>
                <div className="flex items-baseline justify-between mt-1">
                  <span className="text-xs text-stone-400">Elo天梯分</span>
                  <div className="text-right">
                    <span className="text-lg font-black font-mono text-white">
                      {blackPlayer.rating + (matchType === 'ranked' ? result.blackEloDelta : 0)}
                    </span>
                    {matchType === 'ranked' && (
                      <span
                        className={`text-xs font-bold ml-1.5 font-mono ${
                          result.blackEloDelta > 0
                            ? 'text-emerald-400'
                            : result.blackEloDelta < 0
                            ? 'text-red-400'
                            : 'text-stone-400'
                        }`}
                      >
                        {result.blackEloDelta > 0 ? `+${result.blackEloDelta}` : result.blackEloDelta}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* AI Referee Analysis Card */}
          <div className="p-4 rounded-xl bg-stone-950 border border-stone-800 space-y-1.5">
            <div className="flex items-center gap-2 text-xs font-bold text-amber-400">
              <svg className="w-4 h-4 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
              <span>AI 智能裁判局势分析总结</span>
            </div>
            <p className="text-xs text-stone-300 leading-relaxed font-serif">
              {aiSummary}
            </p>
          </div>

          {/* Action Buttons */}
          <div className="space-y-2 pt-2">
            <button
              onClick={onStartReview}
              className="w-full py-3 rounded-xl bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-500 hover:to-amber-600 text-white font-bold text-sm shadow-lg shadow-amber-950 flex items-center justify-center gap-2 transition"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              立即进入棋谱复盘（导出/步步拆解）
            </button>

            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={onGoToLeaderboard}
                className="py-2.5 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-200 font-medium text-xs transition"
              >
                查看天梯积分榜
              </button>
              <button
                onClick={onNewMatch}
                className="py-2.5 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-200 font-medium text-xs transition"
              >
                重开一局新比赛
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
