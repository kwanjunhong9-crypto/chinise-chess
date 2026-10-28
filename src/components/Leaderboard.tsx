import React, { useState } from 'react';
import { Player } from '../types/chess';
import { getTierTitleByRating } from '../utils/aiJudge';

interface LeaderboardProps {
  players: Player[];
  onSelectPlayer: (player: Player) => void;
  onOpenMatchSetup: () => void;
  onOpenMemberManager: () => void;
  isAdmin: boolean;
}

export const Leaderboard: React.FC<LeaderboardProps> = ({
  players,
  onSelectPlayer,
  onOpenMatchSetup,
  onOpenMemberManager,
  isAdmin,
}) => {
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState<'rating' | 'winrate' | 'matches'>('rating');

  // Sort players
  const sortedPlayers = [...players].sort((a, b) => {
    if (sortBy === 'rating') {
      return b.rating - a.rating;
    } else if (sortBy === 'winrate') {
      const rateA = a.matchesPlayed > 0 ? (a.wins / a.matchesPlayed) * 100 : 0;
      const rateB = b.matchesPlayed > 0 ? (b.wins / b.matchesPlayed) * 100 : 0;
      return rateB - rateA;
    } else {
      return b.matchesPlayed - a.matchesPlayed;
    }
  });

  const filteredPlayers = sortedPlayers.filter(p =>
    p.name.toLowerCase().includes(search.toLowerCase()) ||
    p.tierTitle.toLowerCase().includes(search.toLowerCase())
  );

  const top1 = sortedPlayers[0];
  const top2 = sortedPlayers[1];
  const top3 = sortedPlayers[2];

  const getWinRate = (p: Player) => {
    if (!p.matchesPlayed) return 0;
    return Math.round((p.wins / p.matchesPlayed) * 100);
  };

  return (
    <div className="w-full max-w-5xl mx-auto space-y-8 animate-fade-in">
      {/* Header & Quick Action Buttons */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-stone-800">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-2xl">🏆</span>
            <h2 className="text-2xl font-black text-amber-300 font-serif tracking-wide">
              中国象棋天梯总积分榜
            </h2>
          </div>
          <p className="text-xs text-stone-400 mt-1">
            根据天梯排位赛胜负自动结算 Elo 等级分 · 点击任意棋手查看完整个人档案与对局回放
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={onOpenMemberManager}
            className="px-4 py-2 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-200 text-xs font-bold border border-stone-700 transition flex items-center gap-1.5 shadow-sm"
          >
            <svg className="w-4 h-4 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
            </svg>
            积记分加成员
          </button>

          <button
            onClick={onOpenMatchSetup}
            className="px-4 py-2 rounded-xl bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-500 hover:to-amber-600 text-white text-xs font-bold shadow-lg shadow-amber-950 transition flex items-center gap-1.5"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            发起排位/匹配
          </button>
        </div>
      </div>

      {/* Top 3 Podium (1st 🥇, 2nd 🥈, 3rd 🥉) */}
      {sortedPlayers.length >= 3 && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end pt-6 pb-2">
          {/* 2nd Place (Silver) */}
          {top2 && (
            <div
              onClick={() => onSelectPlayer(top2)}
              className="order-2 md:order-1 rounded-2xl bg-gradient-to-b from-stone-800/80 to-stone-900 border border-slate-400/40 p-5 text-center cursor-pointer hover:-translate-y-1 hover:border-slate-300 transition-all shadow-xl group relative"
            >
              <div className="absolute -top-4 left-1/2 -translate-x-1/2 w-8 h-8 rounded-full bg-slate-300 text-slate-900 font-black flex items-center justify-center text-sm shadow-md border-2 border-white">
                2
              </div>
              <div className="relative inline-block mt-2">
                <img
                  src={top2.avatar}
                  alt={top2.name}
                  className="w-20 h-20 rounded-full mx-auto border-3 border-slate-300 object-cover shadow-md group-hover:scale-105 transition"
                />
                <span className="absolute bottom-0 right-0 text-lg">🥈</span>
              </div>
              <h3 className="mt-3 font-bold text-lg text-stone-100 group-hover:text-amber-300 transition">
                {top2.name}
              </h3>
              <p className="text-xs text-slate-300 font-medium">
                {top2.tierTitle}
              </p>
              <div className="mt-3 py-2 px-3 rounded-xl bg-stone-950/70 border border-stone-800 flex items-center justify-around">
                <div>
                  <span className="text-[10px] text-stone-500 block">Elo天梯分</span>
                  <span className="text-base font-black font-mono text-slate-200">
                    {top2.rating}
                  </span>
                </div>
                <div className="w-px h-6 bg-stone-800" />
                <div>
                  <span className="text-[10px] text-stone-500 block">胜率</span>
                  <span className="text-base font-black font-mono text-emerald-400">
                    {getWinRate(top2)}%
                  </span>
                </div>
              </div>
              <span className="mt-2 text-[11px] text-amber-400/80 group-hover:text-amber-300 block">
                点击查看档案 →
              </span>
            </div>
          )}

          {/* 1st Place (Gold Champion) */}
          {top1 && (
            <div
              onClick={() => onSelectPlayer(top1)}
              className="order-1 md:order-2 rounded-2xl bg-gradient-to-b from-amber-950/80 via-stone-900 to-amber-950/40 border-2 border-amber-400 p-6 text-center cursor-pointer hover:-translate-y-1.5 hover:border-amber-300 transition-all shadow-2xl group relative"
            >
              <div className="absolute -top-5 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full bg-gradient-to-r from-amber-400 to-amber-500 text-amber-950 font-black text-xs shadow-lg border-2 border-amber-200 flex items-center gap-1">
                <span>👑</span>
                <span>榜首魁首</span>
              </div>
              <div className="relative inline-block mt-3">
                <div className="absolute inset-0 rounded-full bg-amber-400/20 blur-md animate-pulse" />
                <img
                  src={top1.avatar}
                  alt={top1.name}
                  className="relative w-24 h-24 rounded-full mx-auto border-4 border-amber-400 object-cover shadow-xl group-hover:scale-105 transition"
                />
                <span className="absolute bottom-0 right-0 text-2xl">🥇</span>
              </div>
              <h3 className="mt-3 font-black text-xl text-amber-300 group-hover:text-amber-200 transition font-serif">
                {top1.name}
              </h3>
              <p className="text-xs text-amber-400/90 font-bold">
                {top1.tierTitle} · 等级分第 1 名
              </p>
              <div className="mt-4 py-2.5 px-4 rounded-xl bg-stone-950 border border-amber-900/50 flex items-center justify-around">
                <div>
                  <span className="text-[10px] text-stone-500 block">Elo天梯分</span>
                  <span className="text-lg font-black font-mono text-amber-300">
                    {top1.rating}
                  </span>
                </div>
                <div className="w-px h-7 bg-stone-800" />
                <div>
                  <span className="text-[10px] text-stone-500 block">胜率</span>
                  <span className="text-lg font-black font-mono text-emerald-400">
                    {getWinRate(top1)}%
                  </span>
                </div>
                <div className="w-px h-7 bg-stone-800" />
                <div>
                  <span className="text-[10px] text-stone-500 block">总局数</span>
                  <span className="text-lg font-black font-mono text-stone-300">
                    {top1.matchesPlayed}
                  </span>
                </div>
              </div>
              <span className="mt-2 text-xs text-amber-400 font-medium group-hover:underline block">
                点击查看特级大师个人档案 →
              </span>
            </div>
          )}

          {/* 3rd Place (Bronze) */}
          {top3 && (
            <div
              onClick={() => onSelectPlayer(top3)}
              className="order-3 md:order-3 rounded-2xl bg-gradient-to-b from-stone-800/80 to-stone-900 border border-amber-700/40 p-5 text-center cursor-pointer hover:-translate-y-1 hover:border-amber-600 transition-all shadow-xl group relative"
            >
              <div className="absolute -top-4 left-1/2 -translate-x-1/2 w-8 h-8 rounded-full bg-amber-700 text-amber-100 font-black flex items-center justify-center text-sm shadow-md border-2 border-amber-400">
                3
              </div>
              <div className="relative inline-block mt-2">
                <img
                  src={top3.avatar}
                  alt={top3.name}
                  className="w-20 h-20 rounded-full mx-auto border-3 border-amber-700 object-cover shadow-md group-hover:scale-105 transition"
                />
                <span className="absolute bottom-0 right-0 text-lg">🥉</span>
              </div>
              <h3 className="mt-3 font-bold text-lg text-stone-100 group-hover:text-amber-300 transition">
                {top3.name}
              </h3>
              <p className="text-xs text-amber-600/90 font-medium">
                {top3.tierTitle}
              </p>
              <div className="mt-3 py-2 px-3 rounded-xl bg-stone-950/70 border border-stone-800 flex items-center justify-around">
                <div>
                  <span className="text-[10px] text-stone-500 block">Elo天梯分</span>
                  <span className="text-base font-black font-mono text-amber-200">
                    {top3.rating}
                  </span>
                </div>
                <div className="w-px h-6 bg-stone-800" />
                <div>
                  <span className="text-[10px] text-stone-500 block">胜率</span>
                  <span className="text-base font-black font-mono text-emerald-400">
                    {getWinRate(top3)}%
                  </span>
                </div>
              </div>
              <span className="mt-2 text-[11px] text-amber-400/80 group-hover:text-amber-300 block">
                点击查看档案 →
              </span>
            </div>
          )}
        </div>
      )}

      {/* Full Leaderboard Table */}
      <div className="rounded-2xl bg-stone-900 border border-stone-800 overflow-hidden shadow-xl">
        {/* Table Control Bar */}
        <div className="p-4 bg-stone-950 border-b border-stone-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="text-xs text-stone-400">排序依据：</span>
            <div className="flex gap-1.5 text-xs">
              {[
                { key: 'rating', label: '天梯等级分' },
                { key: 'winrate', label: '胜率' },
                { key: 'matches', label: '总场次' },
              ].map(opt => (
                <button
                  key={opt.key}
                  onClick={() => setSortBy(opt.key as typeof sortBy)}
                  className={`px-3 py-1 rounded-lg transition ${
                    sortBy === opt.key
                      ? 'bg-amber-600 text-white font-bold'
                      : 'bg-stone-900 text-stone-400 hover:text-stone-200'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          <div className="relative">
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="搜索棋手姓名或称号..."
              className="w-full sm:w-64 px-3 py-1.5 pl-8 rounded-lg bg-stone-900 border border-stone-700 text-xs text-stone-200 focus:border-amber-500 focus:outline-none"
            />
            <svg
              className="w-4 h-4 text-stone-500 absolute left-2.5 top-1/2 -translate-y-1/2"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
        </div>

        {/* Table rows */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs sm:text-sm">
            <thead className="bg-stone-950 text-stone-400 text-[11px] uppercase tracking-wider border-b border-stone-800">
              <tr>
                <th className="py-3 px-4 text-center w-16">名次</th>
                <th className="py-3 px-4">棋手资料</th>
                <th className="py-3 px-4">棋力称号</th>
                <th className="py-3 px-4 text-right">天梯 Elo 积分</th>
                <th className="py-3 px-4 text-center hidden sm:table-cell">总战绩</th>
                <th className="py-3 px-4 text-right">胜率</th>
                <th className="py-3 px-4 text-center w-24">操作</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-800 text-stone-200">
              {filteredPlayers.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-10 text-center text-xs text-stone-500">
                    未找到相关选手，点击上方「积记分加成员」可添加新成员
                  </td>
                </tr>
              ) : (
                filteredPlayers.map((p, idx) => {
                  const rank = idx + 1;
                  const winRate = getWinRate(p);
                  const isTop3 = rank <= 3;

                  return (
                    <tr
                      key={p.id}
                      onClick={() => onSelectPlayer(p)}
                      className="hover:bg-amber-950/20 cursor-pointer transition"
                    >
                      {/* Rank */}
                      <td className="py-3.5 px-4 text-center font-mono font-bold">
                        {rank === 1 ? (
                          <span className="inline-block w-6 h-6 rounded-full bg-amber-400 text-amber-950 text-xs font-black leading-6">
                            1
                          </span>
                        ) : rank === 2 ? (
                          <span className="inline-block w-6 h-6 rounded-full bg-slate-300 text-slate-900 text-xs font-black leading-6">
                            2
                          </span>
                        ) : rank === 3 ? (
                          <span className="inline-block w-6 h-6 rounded-full bg-amber-700 text-amber-100 text-xs font-black leading-6">
                            3
                          </span>
                        ) : (
                          <span className="text-stone-500">{rank}</span>
                        )}
                      </td>

                      {/* Profile info */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-3">
                          <img
                            src={p.avatar}
                            alt={p.name}
                            className="w-9 h-9 rounded-full border border-stone-700 object-cover flex-shrink-0"
                          />
                          <div>
                            <div className="font-bold text-stone-100 flex items-center gap-1.5">
                              <span>{p.name}</span>
                              {isTop3 && (
                                <span className="text-amber-400 text-xs">★</span>
                              )}
                            </div>
                            <span className="text-[11px] text-stone-400 line-clamp-1">
                              {p.note || '天梯认证棋手'}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Tier title */}
                      <td className="py-3.5 px-4">
                        <span className="inline-block px-2.5 py-0.5 rounded-full text-xs bg-stone-950 border border-stone-700 text-stone-300 font-serif">
                          {p.tierTitle}
                        </span>
                      </td>

                      {/* Rating */}
                      <td className="py-3.5 px-4 text-right">
                        <span className="font-mono font-black text-amber-400 text-base">
                          {p.rating}
                        </span>
                        <span className="text-[10px] text-stone-500 block">
                          最高 {p.highestRating}
                        </span>
                      </td>

                      {/* Matches */}
                      <td className="py-3.5 px-4 text-center hidden sm:table-cell font-mono text-xs text-stone-300">
                        {p.matchesPlayed}战 · <span className="text-emerald-400 font-bold">{p.wins}胜</span> {p.losses}负 {p.draws}和
                      </td>

                      {/* Win rate */}
                      <td className="py-3.5 px-4 text-right font-mono font-bold text-emerald-400">
                        {winRate}%
                      </td>

                      {/* Action */}
                      <td className="py-3.5 px-4 text-center">
                        <button
                          onClick={e => {
                            e.stopPropagation();
                            onSelectPlayer(p);
                          }}
                          className="px-2.5 py-1 rounded bg-stone-800 hover:bg-stone-700 text-stone-300 text-xs transition"
                        >
                          查看
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
