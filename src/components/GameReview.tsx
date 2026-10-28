import React, { useState, useEffect } from 'react';
import { Move } from '../types/chess';
import { exportToPGN } from '../utils/chessEngine';

interface GameReviewProps {
  moves: Move[];
  currentStepIndex: number;
  redPlayerName: string;
  blackPlayerName: string;
  resultStr: string;
  onJumpToStep: (index: number) => void;
  onExitReview?: () => void;
}

export const GameReview: React.FC<GameReviewProps> = ({
  moves,
  currentStepIndex,
  redPlayerName,
  blackPlayerName,
  resultStr,
  onJumpToStep,
  onExitReview,
}) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [playSpeed, setPlaySpeed] = useState<number>(1500); // 1.5s
  const [copied, setCopied] = useState(false);

  // Auto-play timer
  useEffect(() => {
    let timer: NodeJS.Timeout | null = null;
    if (isPlaying) {
      timer = setInterval(() => {
        if (currentStepIndex < moves.length - 1) {
          onJumpToStep(currentStepIndex + 1);
        } else {
          setIsPlaying(false);
        }
      }, playSpeed);
    }
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [isPlaying, currentStepIndex, moves.length, playSpeed, onJumpToStep]);

  // Export PGN download
  const handleDownloadPGN = () => {
    const pgnContent = exportToPGN(moves, redPlayerName, blackPlayerName, resultStr);
    const blob = new Blob([pgnContent], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `棋谱_${redPlayerName}_VS_${blackPlayerName}_${Date.now()}.pgn`;
    link.click();
    URL.revokeObjectURL(url);
  };

  // Export TXT download
  const handleDownloadTXT = () => {
    let txt = `【中国象棋棋谱】\n`;
    txt += `红方：${redPlayerName}\n黑方：${blackPlayerName}\n赛果：${resultStr}\n`;
    txt += `日期：${new Date().toLocaleDateString()}\n\n着法记录：\n`;
    for (let i = 0; i < moves.length; i += 2) {
      const round = Math.floor(i / 2) + 1;
      const redMove = moves[i]?.notation || '';
      const blackMove = moves[i + 1]?.notation || '';
      txt += `${round}. ${redMove}    ${blackMove}\n`;
    }
    const blob = new Blob([txt], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `象棋棋谱_${redPlayerName}_对_${blackPlayerName}.txt`;
    link.click();
    URL.revokeObjectURL(url);
  };

  // Copy notation to clipboard
  const handleCopyNotation = () => {
    let txt = `${redPlayerName} (红) VS ${blackPlayerName} (黑) [${resultStr}]\n`;
    for (let i = 0; i < moves.length; i += 2) {
      const round = Math.floor(i / 2) + 1;
      const redMove = moves[i]?.notation || '';
      const blackMove = moves[i + 1]?.notation || '';
      txt += `${round}. ${redMove} ${blackMove}  `;
    }
    navigator.clipboard.writeText(txt).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  return (
    <div className="rounded-2xl bg-stone-900 border border-stone-800 shadow-xl overflow-hidden flex flex-col h-full text-stone-100">
      {/* Title Header */}
      <div className="p-3.5 sm:p-4 border-b border-stone-800 bg-stone-950 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="p-1.5 rounded-lg bg-amber-950 text-amber-400 border border-amber-800/40">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
            </svg>
          </span>
          <div>
            <h4 className="text-sm font-bold text-amber-300">
              棋谱复盘与步法拆解
            </h4>
            <p className="text-[11px] text-stone-400">
              当前进度：第 {currentStepIndex + 1} / {moves.length} 手
            </p>
          </div>
        </div>

        {onExitReview && (
          <button
            onClick={onExitReview}
            className="text-xs px-2.5 py-1 rounded-lg bg-stone-800 hover:bg-stone-700 text-stone-300 transition"
          >
            返回对弈
          </button>
        )}
      </div>

      {/* Stepper Controls Bar */}
      <div className="p-3 bg-stone-950/60 border-b border-stone-800 flex items-center justify-between gap-1 sm:gap-2">
        <button
          onClick={() => {
            setIsPlaying(false);
            onJumpToStep(-1);
          }}
          disabled={currentStepIndex <= -1}
          title="开局初始盘面"
          className="p-2 rounded-lg bg-stone-800 hover:bg-stone-700 disabled:opacity-40 disabled:hover:bg-stone-800 text-stone-200 transition"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 19l-7-7 7-7m8 14l-7-7 7-7" />
          </svg>
        </button>

        <button
          onClick={() => {
            setIsPlaying(false);
            onJumpToStep(Math.max(-1, currentStepIndex - 1));
          }}
          disabled={currentStepIndex <= -1}
          title="后退一手"
          className="p-2 rounded-lg bg-stone-800 hover:bg-stone-700 disabled:opacity-40 disabled:hover:bg-stone-800 text-stone-200 transition"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
          </svg>
        </button>

        {/* Play/Pause */}
        <button
          onClick={() => setIsPlaying(!isPlaying)}
          disabled={moves.length === 0}
          className={`px-3 py-2 rounded-lg text-xs font-bold flex items-center gap-1.5 transition ${
            isPlaying
              ? 'bg-amber-600 text-white'
              : 'bg-stone-800 hover:bg-stone-700 text-amber-300'
          }`}
        >
          {isPlaying ? (
            <>
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zM7 8a1 1 0 012 0v4a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v4a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
              <span>暂停</span>
            </>
          ) : (
            <>
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
              </svg>
              <span>自动演示</span>
            </>
          )}
        </button>

        <button
          onClick={() => {
            setIsPlaying(false);
            onJumpToStep(Math.min(moves.length - 1, currentStepIndex + 1));
          }}
          disabled={currentStepIndex >= moves.length - 1}
          title="前进一手"
          className="p-2 rounded-lg bg-stone-800 hover:bg-stone-700 disabled:opacity-40 disabled:hover:bg-stone-800 text-stone-200 transition"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
          </svg>
        </button>

        <button
          onClick={() => {
            setIsPlaying(false);
            onJumpToStep(moves.length - 1);
          }}
          disabled={currentStepIndex >= moves.length - 1}
          title="终局盘面"
          className="p-2 rounded-lg bg-stone-800 hover:bg-stone-700 disabled:opacity-40 disabled:hover:bg-stone-800 text-stone-200 transition"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 5l7 7-7 7M5 5l7 7-7 7" />
          </svg>
        </button>

        {/* Speed toggle */}
        <select
          value={playSpeed}
          onChange={e => setPlaySpeed(Number(e.target.value))}
          className="text-[11px] bg-stone-900 border border-stone-700 text-stone-300 rounded px-1.5 py-1"
        >
          <option value={2000}>慢速 2s</option>
          <option value={1200}>正常 1.2s</option>
          <option value={600}>快速 0.6s</option>
        </select>
      </div>

      {/* Move List / Timeline */}
      <div className="flex-1 overflow-y-auto p-3 max-h-64 sm:max-h-80 space-y-1">
        {moves.length === 0 ? (
          <div className="p-8 text-center text-xs text-stone-500">
            暂无落子记录，开始对弈后即可步步追踪
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-1 text-xs font-serif">
            {Array.from({ length: Math.ceil(moves.length / 2) }).map((_, roundIdx) => {
              const redMoveIdx = roundIdx * 2;
              const blackMoveIdx = roundIdx * 2 + 1;
              const redMove = moves[redMoveIdx];
              const blackMove = moves[blackMoveIdx];

              const isRedCurrent = currentStepIndex === redMoveIdx;
              const isBlackCurrent = currentStepIndex === blackMoveIdx;

              return (
                <React.Fragment key={roundIdx}>
                  {/* Red Move Cell */}
                  <div
                    onClick={() => {
                      setIsPlaying(false);
                      onJumpToStep(redMoveIdx);
                    }}
                    className={`p-1.5 rounded-lg flex items-center justify-between cursor-pointer transition ${
                      isRedCurrent
                        ? 'bg-red-950/80 border border-red-500 text-red-200 font-bold shadow-sm'
                        : 'bg-stone-950/60 hover:bg-stone-800 text-stone-300 border border-transparent'
                    }`}
                  >
                    <span className="text-[10px] text-stone-500 font-mono w-5">
                      {roundIdx + 1}.
                    </span>
                    <span className="text-red-400 font-bold tracking-wider">
                      {redMove ? redMove.notation : '-'}
                    </span>
                    {redMove?.captured && (
                      <span className="text-[10px] text-amber-500" title="吃子">
                        ⚔️
                      </span>
                    )}
                  </div>

                  {/* Black Move Cell */}
                  <div
                    onClick={() => {
                      if (blackMove) {
                        setIsPlaying(false);
                        onJumpToStep(blackMoveIdx);
                      }
                    }}
                    className={`p-1.5 rounded-lg flex items-center justify-between cursor-pointer transition ${
                      isBlackCurrent
                        ? 'bg-amber-950/80 border border-amber-500 text-amber-200 font-bold shadow-sm'
                        : 'bg-stone-950/60 hover:bg-stone-800 text-stone-300 border border-transparent'
                    }`}
                  >
                    <span className="text-stone-300 font-bold tracking-wider">
                      {blackMove ? blackMove.notation : '-'}
                    </span>
                    {blackMove?.captured && (
                      <span className="text-[10px] text-amber-500" title="吃子">
                        ⚔️
                      </span>
                    )}
                  </div>
                </React.Fragment>
              );
            })}
          </div>
        )}
      </div>

      {/* Export Toolbar */}
      <div className="p-3 border-t border-stone-800 bg-stone-950 flex flex-wrap gap-2 items-center justify-between">
        <div className="flex gap-2">
          <button
            onClick={handleDownloadPGN}
            disabled={moves.length === 0}
            className="px-2.5 py-1.5 rounded-lg bg-stone-800 hover:bg-stone-700 disabled:opacity-40 text-stone-200 text-xs font-medium flex items-center gap-1.5 transition"
            title="下载标准象棋 PGN 格式棋谱文件"
          >
            <svg className="w-3.5 h-3.5 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
            导出 PGN
          </button>

          <button
            onClick={handleDownloadTXT}
            disabled={moves.length === 0}
            className="px-2.5 py-1.5 rounded-lg bg-stone-800 hover:bg-stone-700 disabled:opacity-40 text-stone-200 text-xs font-medium flex items-center gap-1.5 transition"
            title="下载纯文本棋谱文档"
          >
            <svg className="w-3.5 h-3.5 text-stone-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            导出文本
          </button>
        </div>

        <button
          onClick={handleCopyNotation}
          disabled={moves.length === 0}
          className="px-3 py-1.5 rounded-lg bg-amber-700 hover:bg-amber-600 disabled:opacity-40 text-white text-xs font-bold flex items-center gap-1.5 transition"
        >
          {copied ? '✅ 已复制着法' : '复制全盘棋谱'}
        </button>
      </div>
    </div>
  );
};
