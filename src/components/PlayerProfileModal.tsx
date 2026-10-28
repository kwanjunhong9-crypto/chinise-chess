import React from 'react';
import { Player, MatchRecord } from '../types/chess';
import { getStoredMatches } from '../utils/storage';

interface PlayerProfileModalProps {
  player: Player | null;
  onClose: () => void;
  onLoadMatchToReplay: (match: MatchRecord) => void;
}

export const PlayerProfileModal: React.FC<PlayerProfileModalProps> = ({
  player,
  onClose,
  onLoadMatchToReplay,
}) => {
  if (!player) return null;

  const allMatches = getStoredMatches();
  // Filter matches where this player participated
  const playerMatches = allMatches.filter(
    m => m.redPlayerId === player.id || m.blackPlayerId === player.id ||
         m.redPlayerName === player.name || m.blackPlayerName === player.name
  );

  const winRate = player.matchesPlayed > 0 ? Math.round((player.wins / player.matchesPlayed) * 100) : 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
      <div className="w-full max-w-2xl max-h-[90vh] rounded-2xl bg-stone-900 border border-amber-800/60 shadow-2xl overflow-hidden flex flex-col text-stone-100">
        {/* Header Profile Hero */}
        <div className="relative p-6 bg-gradient-to-r from-amber-950 via-stone-900 to-stone-950 border-b border-stone-800">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-stone-400 hover:text-white p-2 rounded-lg hover:bg-stone-800 transition"
          >
            ✕
          </button>

          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4">
            <img
              src={player.avatar}
              alt={player.name}
              className="w-20 h-20 rounded-2xl border-2 border-amber-500/80 object-cover shadow-xl flex-shrink-0"
            />
            <div className="text-center sm:text-left">
              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
                <h3 className="text-2xl font-black text-amber-300 font-serif">
                  {player.name}
                </h3>
                <span className="px-2.5 py-0.5 rounded-full text-xs bg-amber-950 border border-amber-700/60 text-amber-300 font-medium">
                  {player.tierTitle}
                </span>
              </div>
              <p className="text-xs text-stone-400 mt-1 max-w-md">
                {player.note || '中国象棋天梯认证选手'}
              </p>
              <div className="flex items-center justify-center sm:justify-start gap-4 mt-3 text-xs text-stone-300 font-mono">
                <span>当前天梯分：<strong className="text-amber-400 text-sm">{player.rating}</strong></span>
                <span>•</span>
                <span>历史峰值：<strong className="text-stone-100">{player.highestRating}</strong></span>
              </div>
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-6">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-3.5 rounded-xl bg-stone-950 border border-stone-800 text-center">
              <span className="text-[11px] text-stone-500 uppercase tracking-wider block">总对局数</span>
              <span className="text-xl font-black font-mono text-white mt-1 block">
                {player.matchesPlayed}
              </span>
            </div>

            <div className="p-3.5 rounded-xl bg-stone-950 border border-stone-800 text-center">
              <span className="text-[11px] text-stone-500 uppercase tracking-wider block">胜场率</span>
              <span className="text-xl font-black font-mono text-emerald-400 mt-1 block">
                {winRate}%
              </span>
            </div>

            <div className="p-3.5 rounded-xl bg-stone-950 border border-stone-800 text-center">
              <span className="text-[11px] text-stone-500 uppercase tracking-wider block">战绩 (胜/负/和)</span>
              <span className="text-sm font-black font-mono text-stone-200 mt-1.5 block">
                <span className="text-emerald-400">{player.wins}</span> / <span className="text-red-400">{player.losses}</span> / <span className="text-stone-400">{player.draws}</span>
              </span>
            </div>

            <div className="p-3.5 rounded-xl bg-stone-950 border border-stone-800 text-center">
              <span className="text-[11px] text-stone-500 uppercase tracking-wider block">棋风评级</span>
              <span className="text-sm font-bold text-amber-300 mt-1.5 block">
                {player.rating > 2000 ? '宗师风范' : player.rating > 1700 ? '沉着老辣' : '勇猛果断'}
              </span>
            </div>
          </div>

          {/* Historical Matches */}
          <div className="space-y-3">
            <h4 className="text-sm font-bold text-stone-200 flex items-center justify-between">
              <span>历史天梯对局记录（共 {playerMatches.length} 场）</span>
              <span className="text-xs text-stone-500 font-normal">点击可直接调入复盘系统</span>
            </h4>

            {playerMatches.length === 0 ? (
              <div className="p-8 rounded-xl bg-stone-950 border border-stone-800 text-center text-xs text-stone-500">
                暂无历史对局，可通过管理员开启匹配或排位赛
              </div>
            ) : (
              <div className="divide-y divide-stone-800 rounded-xl bg-stone-950 border border-stone-800 max-h-64 overflow-y-auto">
                {playerMatches.map(match => {
                  const isRed = match.redPlayerName === player.name;
                  const opponentName = isRed ? match.blackPlayerName : match.redPlayerName;
                  const isDraw = match.winner === 'draw';
                  const isWin = (match.winner === 'red' && isRed) || (match.winner === 'black' && !isRed);
                  const eloDelta = isRed ? match.redEloDelta : match.blackEloDelta;

                  return (
                    <div
                      key={match.id}
                      className="p-3 sm:px-4 flex items-center justify-between hover:bg-stone-900/60 transition gap-2"
                    >
                      <div className="flex items-center gap-3">
                        {/* Win/Loss Badge */}
                        <span
                          className={`w-7 h-7 rounded-lg text-xs font-bold flex items-center justify-center flex-shrink-0 ${
                            isDraw
                              ? 'bg-stone-800 text-stone-300'
                              : isWin
                              ? 'bg-emerald-950 text-emerald-400 border border-emerald-700/50'
                              : 'bg-red-950 text-red-400 border border-red-700/50'
                          }`}
                        >
                          {isDraw ? '和' : isWin ? '胜' : '负'}
                        </span>

                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-stone-400">
                              执{isRed ? '红先' : '黑后'} VS
                            </span>
                            <strong className="text-sm font-bold text-stone-100">
                              {opponentName}
                            </strong>
                            <span className="text-[10px] text-stone-500">
                              ({match.type === 'ranked' ? '排位' : '普通'})
                            </span>
                          </div>
                          <span className="text-[11px] text-stone-500 block">
                            {match.date} · {match.moves.length} 回合 · {match.reason}
                          </span>
                        </div>
                      </div>

                      {/* Right: Elo Delta & Replay button */}
                      <div className="flex items-center gap-3">
                        {match.type === 'ranked' && (
                          <span
                            className={`font-mono font-bold text-xs ${
                              eloDelta > 0
                                ? 'text-emerald-400'
                                : eloDelta < 0
                                ? 'text-red-400'
                                : 'text-stone-400'
                            }`}
                          >
                            {eloDelta > 0 ? `+${eloDelta}` : eloDelta}
                          </span>
                        )}

                        <button
                          onClick={() => {
                            onLoadMatchToReplay(match);
                            onClose();
                          }}
                          className="px-2.5 py-1 rounded-lg bg-amber-900/40 hover:bg-amber-800 text-amber-200 text-xs font-medium border border-amber-700/50 transition flex items-center gap-1"
                        >
                          <span>复盘</span>
                          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                          </svg>
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-stone-800 bg-stone-950 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-200 text-sm font-medium transition"
          >
            关闭档案
          </button>
        </div>
      </div>
    </div>
  );
};
