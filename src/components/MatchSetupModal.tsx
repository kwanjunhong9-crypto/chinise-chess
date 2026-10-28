import React, { useState } from 'react';
import { MatchType, Player } from '../types/chess';
import { getStoredPlayers, findPlayerByName } from '../utils/storage';

interface MatchSetupModalProps {
  isOpen: boolean;
  isAdmin: boolean;
  initialType?: MatchType;
  onClose: () => void;
  onRequireAdmin: () => void;
  onStartMatch: (config: {
    type: MatchType;
    redPlayer: Player;
    blackPlayer: Player;
    timeLimitMinutes: number;
    incrementSeconds: number;
  }) => void;
}

export const MatchSetupModal: React.FC<MatchSetupModalProps> = ({
  isOpen,
  isAdmin,
  initialType = 'ranked',
  onClose,
  onRequireAdmin,
  onStartMatch,
}) => {
  const [matchType, setMatchType] = useState<MatchType>(initialType);
  const [redName, setRedName] = useState('');
  const [blackName, setBlackName] = useState('');
  const [timePreset, setTimePreset] = useState<number>(15); // 15 mins
  const [increment, setIncrement] = useState<number>(5);     // 5s per move
  const [errorBanner, setErrorBanner] = useState<string | null>(null);

  const players = getStoredPlayers();

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!isAdmin) {
      onRequireAdmin();
      return;
    }

    setErrorBanner(null);

    const trimmedRed = redName.trim();
    const trimmedBlack = blackName.trim();

    if (!trimmedRed) {
      setErrorBanner('请输入或选择红方选手姓名！');
      return;
    }
    if (!trimmedBlack) {
      setErrorBanner('请输入或选择黑方选手姓名！');
      return;
    }

    if (trimmedRed.toLowerCase() === trimmedBlack.toLowerCase()) {
      setErrorBanner('⚠️ 红方与黑方不能为同一位选手，请选择不同的两位选手！');
      return;
    }

    // STRICT USER REQUIREMENT:
    // "然后输入积分榜里面的人 如果没有这个人就说没有这个人"
    const redPlayer = findPlayerByName(trimmedRed);
    if (!redPlayer) {
      setErrorBanner(`⚠️ 查无此选手「${trimmedRed}」！积分榜内没有这个人，请先在成员管理中添加该成员后再开局！`);
      return;
    }

    const blackPlayer = findPlayerByName(trimmedBlack);
    if (!blackPlayer) {
      setErrorBanner(`⚠️ 查无此选手「${trimmedBlack}」！积分榜内没有这个人，请先在成员管理中添加该成员后再开局！`);
      return;
    }

    // Validation passed! Start match
    onStartMatch({
      type: matchType,
      redPlayer,
      blackPlayer,
      timeLimitMinutes: timePreset,
      incrementSeconds: increment,
    });

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
      <div className="w-full max-w-lg rounded-2xl bg-stone-900 border border-amber-800/60 shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-stone-800 bg-stone-950 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="p-2 rounded-xl bg-amber-950 text-amber-400 border border-amber-800/50">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </span>
            <div>
              <h3 className="text-lg font-bold text-stone-100">
                开启棋局对弈（{matchType === 'ranked' ? '天梯排位赛' : '普通匹配赛'}）
              </h3>
              <p className="text-xs text-stone-400">
                仅管理员可创建比赛并由裁判掌局记录走子
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-stone-400 hover:text-white p-1 rounded-lg hover:bg-stone-800 transition"
          >
            ✕
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit} className="p-4 sm:p-6 space-y-5">
          {/* Admin check gate */}
          {!isAdmin && (
            <div className="p-3 rounded-xl bg-amber-950/40 border border-amber-700/50 text-xs text-amber-300 flex items-center justify-between">
              <span>⚠️ 仅管理员可开启匹配与排位赛</span>
              <button
                type="button"
                onClick={onRequireAdmin}
                className="px-2.5 py-1 rounded bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs transition"
              >
                解锁管理
              </button>
            </div>
          )}

          {/* Error Banner ("如果没有这个人就说没有这个人") */}
          {errorBanner && (
            <div className="p-3.5 rounded-xl bg-red-950/90 border border-red-600/70 text-red-200 text-xs sm:text-sm font-medium flex items-start gap-2 animate-shake">
              <svg className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              <div className="flex-1">
                <span>{errorBanner}</span>
              </div>
            </div>
          )}

          {/* Mode Selector */}
          <div>
            <label className="block text-xs font-bold text-stone-300 uppercase tracking-wider mb-2">
              选择赛制类型
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setMatchType('ranked')}
                className={`p-3 rounded-xl border text-left transition flex flex-col justify-between ${
                  matchType === 'ranked'
                    ? 'bg-amber-950/60 border-amber-500 shadow-lg shadow-amber-950/50'
                    : 'bg-stone-950 border-stone-800 opacity-60 hover:opacity-100'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="font-bold text-sm text-amber-300">🏆 天梯排位赛</span>
                  {matchType === 'ranked' && (
                    <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
                  )}
                </div>
                <p className="text-[11px] text-stone-400">
                  比赛胜负将自动按 Elo 算分并更新天梯积分榜排名
                </p>
              </button>

              <button
                type="button"
                onClick={() => setMatchType('casual')}
                className={`p-3 rounded-xl border text-left transition flex flex-col justify-between ${
                  matchType === 'casual'
                    ? 'bg-blue-950/60 border-blue-500 shadow-lg shadow-blue-950/50'
                    : 'bg-stone-950 border-stone-800 opacity-60 hover:opacity-100'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="font-bold text-sm text-blue-300">⚔️ 普通匹配赛</span>
                  {matchType === 'casual' && (
                    <span className="w-2 h-2 rounded-full bg-blue-400 animate-pulse" />
                  )}
                </div>
                <p className="text-[11px] text-stone-400">
                  友谊交流对局，记录棋谱复盘但不计入官方天梯积分
                </p>
              </button>
            </div>
          </div>

          {/* Players Selection */}
          <div className="space-y-4 pt-1">
            {/* Red Player Input */}
            <div className="p-3.5 rounded-xl bg-stone-950 border border-red-950/80 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-red-400 flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded-full bg-red-600 inline-block border border-red-300" />
                  红方（先手）选手姓名
                </span>
                <span className="text-[10px] text-stone-500">须为积分榜已注册成员</span>
              </div>
              <input
                type="text"
                list="red-players-list"
                value={redName}
                onChange={e => {
                  setRedName(e.target.value);
                  if (errorBanner) setErrorBanner(null);
                }}
                placeholder="输入或选择红方选手姓名（如：王天一）"
                className="w-full px-3 py-2 rounded-lg bg-stone-900 border border-stone-700 text-stone-100 text-sm focus:border-red-500 focus:outline-none"
              />
              <datalist id="red-players-list">
                {players.map(p => (
                  <option key={`red-${p.id}`} value={p.name}>
                    {p.name} ({p.rating}分 - {p.tierTitle})
                  </option>
                ))}
              </datalist>
            </div>

            {/* Black Player Input */}
            <div className="p-3.5 rounded-xl bg-stone-950 border border-stone-800 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-stone-300 flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded-full bg-stone-700 inline-block border border-stone-400" />
                  黑方（后手）选手姓名
                </span>
                <span className="text-[10px] text-stone-500">须为积分榜已注册成员</span>
              </div>
              <input
                type="text"
                list="black-players-list"
                value={blackName}
                onChange={e => {
                  setBlackName(e.target.value);
                  if (errorBanner) setErrorBanner(null);
                }}
                placeholder="输入或选择黑方选手姓名（如：郑惟桐）"
                className="w-full px-3 py-2 rounded-lg bg-stone-900 border border-stone-700 text-stone-100 text-sm focus:border-stone-500 focus:outline-none"
              />
              <datalist id="black-players-list">
                {players.map(p => (
                  <option key={`black-${p.id}`} value={p.name}>
                    {p.name} ({p.rating}分 - {p.tierTitle})
                  </option>
                ))}
              </datalist>
            </div>
          </div>

          {/* Time Controls */}
          <div>
            <label className="block text-xs font-bold text-stone-300 uppercase tracking-wider mb-2">
              对局时限设置
            </label>
            <div className="grid grid-cols-4 gap-2 text-xs">
              {[
                { label: '10分钟', min: 10, inc: 0 },
                { label: '15分+5秒', min: 15, inc: 5 },
                { label: '20分钟', min: 20, inc: 0 },
                { label: '不限时', min: 0, inc: 0 },
              ].map((opt, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => {
                    setTimePreset(opt.min);
                    setIncrement(opt.inc);
                  }}
                  className={`py-2 rounded-lg border text-center transition ${
                    timePreset === opt.min && increment === opt.inc
                      ? 'bg-amber-900/60 border-amber-500 text-amber-200 font-bold'
                      : 'bg-stone-950 border-stone-800 text-stone-400 hover:text-stone-200'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Buttons */}
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-300 text-sm font-medium transition"
            >
              取消
            </button>
            <button
              type="submit"
              className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-500 hover:to-amber-600 text-white text-sm font-bold shadow-lg shadow-amber-950 transition"
            >
              确认开局（管理员主控）
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
