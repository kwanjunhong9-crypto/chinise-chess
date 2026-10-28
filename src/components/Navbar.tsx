import React from 'react';
import { usePWAInstall } from '../hooks/usePWAInstall';
import { sounds } from '../utils/audio';

interface NavbarProps {
  activeTab: 'board' | 'leaderboard' | 'review';
  setActiveTab: (tab: 'board' | 'leaderboard' | 'review') => void;
  isAdmin: boolean;
  onOpenAdminModal: () => void;
  onOpenMemberModal: () => void;
  onOpenMatchModal: () => void;
  onOpenPackagingModal: () => void;
  soundEnabled: boolean;
  onToggleSound: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  isAdmin,
  onOpenAdminModal,
  onOpenMemberModal,
  onOpenMatchModal,
  onOpenPackagingModal,
  soundEnabled,
  onToggleSound,
}) => {
  const { isInstallable, install } = usePWAInstall();

  return (
    <header className="sticky top-0 z-40 w-full bg-stone-950/90 backdrop-blur-md border-b border-amber-900/40 text-stone-100">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 h-16 flex items-center justify-between gap-2">
        {/* Brand */}
        <div
          onClick={() => setActiveTab('leaderboard')}
          className="flex items-center gap-2.5 cursor-pointer group flex-shrink-0"
        >
          <img
            src="/icon.svg"
            alt="楚汉象棋Logo"
            className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl shadow-md border border-amber-600/60 group-hover:rotate-6 transition-transform"
          />
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-serif font-black text-base sm:text-lg tracking-wider text-amber-300">
                楚汉争雄
              </span>
              <span className="text-[10px] px-1.5 py-0.2 rounded bg-amber-950 text-amber-400 border border-amber-800 hidden sm:inline-block">
                天梯裁判系统
              </span>
            </div>
            <p className="text-[10px] text-stone-400 font-sans hidden md:block">
              实时走子 · AI裁决 · Elo结算 · 棋谱复盘
            </p>
          </div>
        </div>

        {/* Center Navigation Tabs */}
        <nav className="flex items-center gap-1 bg-stone-900/80 p-1 rounded-xl border border-stone-800 text-xs sm:text-sm font-medium">
          <button
            onClick={() => setActiveTab('leaderboard')}
            className={`px-3 py-1.5 rounded-lg transition flex items-center gap-1.5 ${
              activeTab === 'leaderboard'
                ? 'bg-amber-600 text-white font-bold shadow-sm'
                : 'text-stone-300 hover:text-white hover:bg-stone-800'
            }`}
          >
            <span>🏆</span>
            <span>天梯总榜</span>
          </button>

          <button
            onClick={() => setActiveTab('board')}
            className={`px-3 py-1.5 rounded-lg transition flex items-center gap-1.5 ${
              activeTab === 'board'
                ? 'bg-amber-600 text-white font-bold shadow-sm'
                : 'text-stone-300 hover:text-white hover:bg-stone-800'
            }`}
          >
            <span>⚔️</span>
            <span>对弈实战</span>
          </button>

          <button
            onClick={() => setActiveTab('review')}
            className={`px-3 py-1.5 rounded-lg transition flex items-center gap-1.5 ${
              activeTab === 'review'
                ? 'bg-amber-600 text-white font-bold shadow-sm'
                : 'text-stone-300 hover:text-white hover:bg-stone-800'
            }`}
          >
            <span>📜</span>
            <span className="hidden sm:inline">棋谱复盘</span>
            <span className="sm:hidden">复盘</span>
          </button>
        </nav>

        {/* Right Tools & Admin Status */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          {/* Sound Toggle */}
          <button
            onClick={onToggleSound}
            title={soundEnabled ? '静音' : '开启音效'}
            className="p-2 rounded-xl bg-stone-900 hover:bg-stone-800 text-stone-300 border border-stone-800 transition"
          >
            {soundEnabled ? '🔊' : '🔇'}
          </button>

          {/* Member Score Button */}
          <button
            onClick={onOpenMemberModal}
            className="px-2.5 py-1.5 sm:px-3 sm:py-2 rounded-xl bg-stone-900 hover:bg-stone-800 border border-stone-700 text-amber-300 text-xs font-bold transition flex items-center gap-1"
            title="积记分加成员（需管理密码）"
          >
            <span className="hidden sm:inline">👥</span>
            <span>积记分</span>
          </button>

          {/* Admin Status Gate Pill */}
          <button
            onClick={onOpenAdminModal}
            className={`px-2.5 py-1.5 rounded-xl text-xs font-medium border transition flex items-center gap-1.5 ${
              isAdmin
                ? 'bg-emerald-950/80 border-emerald-600 text-emerald-300'
                : 'bg-stone-900 border-stone-700 text-stone-400 hover:text-stone-200'
            }`}
            title={isAdmin ? '当前已拥有管理权限' : '点击输入密码解锁管理权限'}
          >
            <svg
              className={`w-3.5 h-3.5 ${isAdmin ? 'text-emerald-400' : 'text-stone-400'}`}
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              {isAdmin ? (
                <path
                  fillRule="evenodd"
                  d="M10 2a5 5 0 00-5 5v2a2 2 0 00-2 2v5a2 2 0 002 2h10a2 2 0 002-2v-5a2 2 0 00-2-2H7V7a3 3 0 016 0zm-3 7V7a3 3 0 016 0v2H7z"
                  clipRule="evenodd"
                />
              ) : (
                <path
                  fillRule="evenodd"
                  d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z"
                  clipRule="evenodd"
                />
              )}
            </svg>
            <span className="hidden md:inline">
              {isAdmin ? '管理员(已解锁)' : '管理解锁'}
            </span>
          </button>

          {/* App / Packaging Button */}
          <button
            onClick={onOpenPackagingModal}
            className="px-2.5 py-1.5 sm:px-3 sm:py-2 rounded-xl bg-gradient-to-r from-amber-700 to-amber-800 hover:from-amber-600 hover:to-amber-700 text-white text-xs font-bold transition flex items-center gap-1.5 shadow-md shadow-amber-950"
            title="下载为独立 App 或打包原生 iOS / Android 安装包"
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
            <span className="hidden sm:inline">下载App</span>
            <span className="sm:hidden">App</span>
          </button>
        </div>
      </div>
    </header>
  );
};
