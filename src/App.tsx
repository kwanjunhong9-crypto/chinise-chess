/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import {
  BoardGrid,
  Position,
  PieceColor,
  Move,
  Player,
  MatchType,
  GameResult,
  MatchRecord,
  AIEvaluation,
} from './types/chess';
import {
  createInitialBoard,
  cloneBoard,
  getLegalMoves,
  isCheck,
  hasAnyLegalMoves,
  toChineseNotation,
  toICCSNotation,
  boardToFEN,
} from './utils/chessEngine';
import {
  evaluateBoard,
  calculateEloDelta,
  generateAIMatchSummary,
} from './utils/aiJudge';
import {
  getStoredPlayers,
  findPlayerByName,
  getAdminStatus,
  setAdminStatus,
  saveMatchRecordAsync,
  syncPlayersFromServer,
  syncMatchesFromServer,
} from './utils/storage';
import { sounds } from './utils/audio';

import { Navbar } from './components/Navbar';
import { ChessBoard } from './components/ChessBoard';
import { GameReview } from './components/GameReview';
import { Leaderboard } from './components/Leaderboard';
import { AdminModal } from './components/AdminModal';
import { MemberManagerModal } from './components/MemberManagerModal';
import { MatchSetupModal } from './components/MatchSetupModal';
import { GameOverModal } from './components/GameOverModal';
import { PlayerProfileModal } from './components/PlayerProfileModal';
import { AppPackagingModal } from './components/AppPackagingModal';

export default function App() {
  // Navigation tabs: 'board' | 'leaderboard' | 'review'
  const [activeTab, setActiveTab] = useState<'board' | 'leaderboard' | 'review'>('board');

  // Admin authentication state
  const [isAdmin, setIsAdmin] = useState<boolean>(getAdminStatus());
  const [showAdminModal, setShowAdminModal] = useState(false);
  const [showMemberModal, setShowMemberModal] = useState(false);
  const [showMatchModal, setShowMatchModal] = useState(false);
  const [showPackagingModal, setShowPackagingModal] = useState(false);
  const [selectedPlayerForProfile, setSelectedPlayerForProfile] = useState<Player | null>(null);

  // Sound state
  const [soundEnabled, setSoundEnabled] = useState(sounds.isEnabled());

  // Members list
  const [players, setPlayers] = useState<Player[]>(getStoredPlayers());

  // Match Configuration
  const [matchType, setMatchType] = useState<MatchType>('ranked');
  const [redPlayer, setRedPlayer] = useState<Player>(players[0] || {
    id: 'p_1',
    name: '王天一',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150',
    rating: 2180,
    highestRating: 2210,
    matchesPlayed: 45,
    wins: 35,
    losses: 4,
    draws: 6,
    tierTitle: '特级大师',
    createdAt: Date.now(),
  });
  const [blackPlayer, setBlackPlayer] = useState<Player>(players[1] || {
    id: 'p_2',
    name: '郑惟桐',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150',
    rating: 2150,
    highestRating: 2165,
    matchesPlayed: 42,
    wins: 31,
    losses: 5,
    draws: 6,
    tierTitle: '特级大师',
    createdAt: Date.now(),
  });

  // Time controls
  const [timeControl, setTimeControl] = useState({ minutes: 15, increment: 5 });
  const [redTimeLeft, setRedTimeLeft] = useState<number>(15 * 60);
  const [blackTimeLeft, setBlackTimeLeft] = useState<number>(15 * 60);
  const [isTimerRunning, setIsTimerRunning] = useState<boolean>(false);

  // Chess Game State
  const [board, setBoard] = useState<BoardGrid>(createInitialBoard());
  const [activeColor, setActiveColor] = useState<PieceColor>('red');
  const [selectedPos, setSelectedPos] = useState<Position | null>(null);
  const [legalMoves, setLegalMoves] = useState<Position[]>([]);
  const [moves, setMoves] = useState<Move[]>([]);
  const [capturedPieces, setCapturedPieces] = useState<{ red: string[]; black: string[] }>({
    red: [],
    black: [],
  });
  const [isFlipped, setIsFlipped] = useState(false);

  // Replay Step index (-1 means initial board, 0..moves.length-1)
  const [reviewStepIndex, setReviewStepIndex] = useState<number>(-1);

  // AI Position Evaluation
  const [aiEval, setAiEval] = useState<AIEvaluation>(evaluateBoard(board));

  // Game Result & Settlement Modal
  const [gameResult, setGameResult] = useState<GameResult | null>(null);
  const [aiMatchSummary, setAiMatchSummary] = useState<string>('');
  const [isGameOverModalOpen, setIsGameOverModalOpen] = useState(false);

  // Toast alert
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  // Timer Tick
  useEffect(() => {
    let timer: NodeJS.Timeout | null = null;
    if (isTimerRunning && timeControl.minutes > 0 && !gameResult) {
      timer = setInterval(() => {
        if (activeColor === 'red') {
          setRedTimeLeft(prev => {
            if (prev <= 1) {
              handleGameOver('black', 'timeout');
              return 0;
            }
            return prev - 1;
          });
        } else {
          setBlackTimeLeft(prev => {
            if (prev <= 1) {
              handleGameOver('red', 'timeout');
              return 0;
            }
            return prev - 1;
          });
        }
      }, 1000);
    }
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [isTimerRunning, activeColor, timeControl.minutes, gameResult]);

  // Update AI evaluation on board change
  useEffect(() => {
    setAiEval(evaluateBoard(board));
  }, [board]);

  // Initial server sync & periodic background polling for multi-admin collaboration
  useEffect(() => {
    // Immediate initial sync
    syncPlayersFromServer().then(list => {
      if (list && list.length > 0) {
        setPlayers(list);
      }
    });
    syncMatchesFromServer();

    // Poll every 5 seconds so changes made by other admins appear automatically
    const interval = setInterval(() => {
      syncPlayersFromServer().then(list => {
        if (list && list.length > 0) {
          setPlayers(list);
        }
      });
      syncMatchesFromServer();
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  const refreshPlayerData = async () => {
    const list = await syncPlayersFromServer();
    setPlayers(list);
    // Sync current match player references if updated
    const currentRed = list.find(p => p.id === redPlayer.id) || list[0];
    const currentBlack = list.find(p => p.id === blackPlayer.id) || list[1];
    if (currentRed) setRedPlayer(currentRed);
    if (currentBlack) setBlackPlayer(currentBlack);
  };

  // Toggle Sound
  const handleToggleSound = () => {
    const next = sounds.toggleSound();
    setSoundEnabled(next);
    showToast(next ? '🔊 棋子与裁决音效已开启' : '🔇 已开启静音模式');
  };

  // Start a new match
  const handleStartMatch = (config: {
    type: MatchType;
    redPlayer: Player;
    blackPlayer: Player;
    timeLimitMinutes: number;
    incrementSeconds: number;
  }) => {
    setMatchType(config.type);
    setRedPlayer(config.redPlayer);
    setBlackPlayer(config.blackPlayer);
    setTimeControl({
      minutes: config.timeLimitMinutes,
      increment: config.incrementSeconds,
    });
    setRedTimeLeft(config.timeLimitMinutes * 60);
    setBlackTimeLeft(config.timeLimitMinutes * 60);
    setIsTimerRunning(config.timeLimitMinutes > 0);

    // Reset board
    const newBoard = createInitialBoard();
    setBoard(newBoard);
    setActiveColor('red');
    setSelectedPos(null);
    setLegalMoves([]);
    setMoves([]);
    setCapturedPieces({ red: [], black: [] });
    setGameResult(null);
    setReviewStepIndex(-1);
    setIsGameOverModalOpen(false);
    setActiveTab('board');

    showToast(`对弈开始！【红方】${config.redPlayer.name} VS 【黑方】${config.blackPlayer.name}`);
  };

  // Settle Game & Calculate Elo
  const handleGameOver = (
    winner: PieceColor | 'draw',
    reason: GameResult['reason'] | 'timeout'
  ) => {
    setIsTimerRunning(false);

    // Calculate Elo delta
    let redDelta = 0;
    let blackDelta = 0;

    let playerUpdates: any[] | undefined = undefined;

    if (matchType === 'ranked') {
      const { redDelta: rD, blackDelta: bD } = calculateEloDelta(
        redPlayer.rating,
        blackPlayer.rating,
        winner
      );
      redDelta = rD;
      blackDelta = bD;

      const updatedRedRating = redPlayer.rating + redDelta;
      const updatedBlackRating = blackPlayer.rating + blackDelta;

      playerUpdates = [
        {
          id: redPlayer.id,
          rating: updatedRedRating,
          matchesPlayed: redPlayer.matchesPlayed + 1,
          wins: redPlayer.wins + (winner === 'red' ? 1 : 0),
          losses: redPlayer.losses + (winner === 'black' ? 1 : 0),
          draws: redPlayer.draws + (winner === 'draw' ? 1 : 0),
        },
        {
          id: blackPlayer.id,
          rating: updatedBlackRating,
          matchesPlayed: blackPlayer.matchesPlayed + 1,
          wins: blackPlayer.wins + (winner === 'black' ? 1 : 0),
          losses: blackPlayer.losses + (winner === 'red' ? 1 : 0),
          draws: blackPlayer.draws + (winner === 'draw' ? 1 : 0),
        },
      ];
    }

    const finalResult: GameResult = {
      winner,
      reason: reason === 'timeout' ? 'resigned' : reason,
      redEloDelta: redDelta,
      blackEloDelta: blackDelta,
    };

    setGameResult(finalResult);

    const winnerName = winner === 'red' ? redPlayer.name : winner === 'black' ? blackPlayer.name : '和局';
    const loserName = winner === 'red' ? blackPlayer.name : redPlayer.name;
    const summary = generateAIMatchSummary(winnerName, loserName, moves.length, winner);
    setAiMatchSummary(summary);

    // Save complete match record & persist to server
    const matchRecord: MatchRecord = {
      id: `match_${Date.now()}`,
      type: matchType,
      redPlayerId: redPlayer.id,
      redPlayerName: redPlayer.name,
      blackPlayerId: blackPlayer.id,
      blackPlayerName: blackPlayer.name,
      winner,
      reason: reason === 'checkmate' ? '将死（绝杀）' : reason === 'stalemate' ? '困毙' : reason === 'ai_adjudication' ? 'AI裁决' : reason === 'draw_agreement' ? '协议和局' : '常规胜负',
      redEloBefore: redPlayer.rating,
      redEloAfter: redPlayer.rating + redDelta,
      blackEloBefore: blackPlayer.rating,
      blackEloAfter: blackPlayer.rating + blackDelta,
      redEloDelta: redDelta,
      blackEloDelta: blackDelta,
      moves,
      date: new Date().toLocaleDateString('zh-CN'),
      timestamp: Date.now(),
      durationSeconds: (timeControl.minutes * 60 * 2) - redTimeLeft - blackTimeLeft,
      aiAnalysis: summary,
    };

    saveMatchRecordAsync(matchRecord, playerUpdates).then(() => {
      refreshPlayerData();
    });
    setIsGameOverModalOpen(true);
  };

  // Square Click & Piece Movement Handler
  const handleSquareClick = (r: number, c: number) => {
    if (gameResult) {
      showToast('本局对弈已结束，可点击复盘或新开一局！');
      return;
    }

    // If a piece is already selected and target is a legal move
    if (selectedPos) {
      const isLegal = legalMoves.some(m => m.r === r && m.c === c);
      if (isLegal) {
        // Execute move!
        const fromPos = selectedPos;
        const toPos = { r, c };
        const movingPiece = board[fromPos.r][fromPos.c]!;
        const targetPiece = board[toPos.r][toPos.c];

        const notation = toChineseNotation(board, fromPos, toPos);
        const iccs = toICCSNotation(fromPos, toPos);
        const fenBefore = boardToFEN(board, activeColor);

        // Update board
        const nextBoard = cloneBoard(board);
        nextBoard[toPos.r][toPos.c] = movingPiece;
        nextBoard[fromPos.r][fromPos.c] = null;

        const nextActiveColor: PieceColor = activeColor === 'red' ? 'black' : 'red';
        const fenAfter = boardToFEN(nextBoard, nextActiveColor);
        const isTargetCheck = isCheck(nextBoard, nextActiveColor);

        const newMove: Move = {
          from: fromPos,
          to: toPos,
          piece: movingPiece,
          captured: targetPiece,
          notation,
          iccs,
          isCheck: isTargetCheck,
          fenBefore,
          fenAfter,
          timestamp: Date.now(),
        };

        const updatedMoves = [...moves, newMove];
        setMoves(updatedMoves);
        setBoard(nextBoard);
        setActiveColor(nextActiveColor);
        setSelectedPos(null);
        setLegalMoves([]);
        setReviewStepIndex(updatedMoves.length - 1);

        // Update captured tray
        if (targetPiece) {
          sounds.playCapture();
          setCapturedPieces(prev => ({
            ...prev,
            [movingPiece.color]: [...prev[movingPiece.color], targetPiece.type],
          }));
        } else {
          sounds.playMove();
        }

        // Add increment to player's clock
        if (timeControl.increment > 0) {
          if (activeColor === 'red') {
            setRedTimeLeft(prev => prev + timeControl.increment);
          } else {
            setBlackTimeLeft(prev => prev + timeControl.increment);
          }
        }

        // Play Check audio / alert
        if (isTargetCheck) {
          sounds.playCheck();
          showToast(`⚠️ 【${movingPiece.color === 'red' ? '红方' : '黑方'}】将军！`);
        }

        // Win/Loss Detection
        // 1. Did the move capture the King?
        if (targetPiece && targetPiece.type === 'k') {
          handleGameOver(movingPiece.color, 'king_captured');
          return;
        }

        // 2. Does the opponent have ANY legal moves left?
        const opponentHasMoves = hasAnyLegalMoves(nextBoard, nextActiveColor);
        if (!opponentHasMoves) {
          if (isTargetCheck) {
            // Checkmate! (绝杀)
            handleGameOver(movingPiece.color, 'checkmate');
          } else {
            // Stalemate! (困毙) In Chinese Chess, player with NO legal moves LOSES!
            handleGameOver(movingPiece.color, 'stalemate');
          }
          return;
        }

        return;
      }
    }

    // Selecting a piece
    const piece = board[r][c];
    if (piece) {
      if (piece.color === activeColor) {
        setSelectedPos({ r, c });
        const movesAvailable = getLegalMoves(board, { r, c });
        setLegalMoves(movesAvailable);
      } else {
        showToast(`当前轮到【${activeColor === 'red' ? '红方' : '黑方'}】执子落棋！`);
      }
    } else {
      setSelectedPos(null);
      setLegalMoves([]);
    }
  };

  // Jump to specific step in Replay Mode
  const handleJumpToStep = (index: number) => {
    setReviewStepIndex(index);
    if (index === -1) {
      setBoard(createInitialBoard());
    } else if (moves[index]) {
      // Restore board at this step
      const tempBoard = createInitialBoard();
      for (let i = 0; i <= index; i++) {
        const m = moves[i];
        tempBoard[m.to.r][m.to.c] = tempBoard[m.from.r][m.from.c];
        tempBoard[m.from.r][m.from.c] = null;
      }
      setBoard(tempBoard);
    }
  };

  // AI Adjudication Button
  const handleAIAdjudicate = () => {
    if (gameResult) return;
    const currentEval = evaluateBoard(board);
    if (currentEval.score > 400) {
      handleGameOver('red', 'ai_adjudication');
      showToast('AI 裁判判定：红方子力与局势已达绝对胜势，判红胜！');
    } else if (currentEval.score < -400) {
      handleGameOver('black', 'ai_adjudication');
      showToast('AI 裁判判定：黑方子力与局势已达绝对胜势，判黑胜！');
    } else {
      handleGameOver('draw', 'ai_adjudication');
      showToast('AI 裁判判定：双方子力均等无必胜机会，裁定和棋！');
    }
  };

  // Format seconds to MM:SS
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const lastMove = moves.length > 0 ? moves[moves.length - 1] : null;

  return (
    <div className="min-h-screen bg-stone-900 text-stone-100 flex flex-col font-sans selection:bg-amber-700 selection:text-white">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-50 py-2.5 px-5 rounded-2xl bg-amber-950/95 border-2 border-amber-500/80 text-amber-200 text-xs sm:text-sm font-bold shadow-2xl backdrop-blur-md animate-bounce flex items-center gap-2">
          <span>📢</span>
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Top Navbar */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        isAdmin={isAdmin}
        onOpenAdminModal={() => setShowAdminModal(true)}
        onOpenMemberModal={() => setShowMemberModal(true)}
        onOpenMatchModal={() => setShowMatchModal(true)}
        onOpenPackagingModal={() => setShowPackagingModal(true)}
        soundEnabled={soundEnabled}
        onToggleSound={handleToggleSound}
      />

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-2 sm:p-4 md:p-6 flex flex-col">
        {/* VIEW 1: LEADERBOARD TAB */}
        {activeTab === 'leaderboard' && (
          <Leaderboard
            players={players}
            onSelectPlayer={player => setSelectedPlayerForProfile(player)}
            onOpenMatchSetup={() => setShowMatchModal(true)}
            onOpenMemberManager={() => setShowMemberModal(true)}
            isAdmin={isAdmin}
          />
        )}

        {/* VIEW 2: LIVE CHESSBOARD & REFEREE TAB */}
        {activeTab === 'board' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 lg:gap-6 items-start flex-1">
            {/* Left Column (Desktop) / Top Banner: Red & Black Player Dossiers & Clocks */}
            <div className="lg:col-span-3 space-y-4 order-2 lg:order-1">
              {/* Match Header Card */}
              <div className="p-4 rounded-2xl bg-stone-950 border border-stone-800 shadow-xl space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-stone-400 uppercase tracking-wider">
                    对弈赛制
                  </span>
                  <span
                    className={`text-xs px-2.5 py-0.5 rounded-full font-bold ${
                      matchType === 'ranked'
                        ? 'bg-amber-950 text-amber-300 border border-amber-700/60'
                        : 'bg-blue-950 text-blue-300 border border-blue-700/60'
                    }`}
                  >
                    {matchType === 'ranked' ? '🏆 天梯排位赛' : '⚔️ 普通匹配赛'}
                  </span>
                </div>

                {/* Black Player Card */}
                <div
                  className={`p-3 rounded-xl border transition flex items-center justify-between ${
                    activeColor === 'black' && !gameResult
                      ? 'bg-amber-950/40 border-amber-500 shadow-md ring-1 ring-amber-500/50'
                      : 'bg-stone-900/60 border-stone-800'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <img
                      src={blackPlayer.avatar}
                      alt={blackPlayer.name}
                      className="w-10 h-10 rounded-xl border border-stone-700 object-cover"
                    />
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="w-2.5 h-2.5 rounded-full bg-stone-700 inline-block" />
                        <strong className="text-sm font-bold text-stone-100">
                          {blackPlayer.name}
                        </strong>
                      </div>
                      <span className="text-[11px] text-stone-400 font-mono">
                        {blackPlayer.tierTitle} · {blackPlayer.rating}分
                      </span>
                    </div>
                  </div>

                  {/* Timer */}
                  <div className="text-right">
                    <span
                      className={`text-lg font-black font-mono block ${
                        blackTimeLeft < 60 && timeControl.minutes > 0
                          ? 'text-red-400 animate-pulse'
                          : 'text-stone-200'
                      }`}
                    >
                      {timeControl.minutes > 0 ? formatTime(blackTimeLeft) : '无时限'}
                    </span>
                    {activeColor === 'black' && !gameResult && (
                      <span className="text-[10px] text-amber-400 font-bold">思考中...</span>
                    )}
                  </div>
                </div>

                {/* VS Divider with Turn Status */}
                <div className="flex items-center justify-center gap-2 py-1">
                  <div className="h-px bg-stone-800 flex-1" />
                  <span className="text-xs font-serif font-black text-amber-400 px-2 py-0.5 rounded bg-stone-900 border border-stone-800">
                    {gameResult
                      ? '对局终了'
                      : activeColor === 'red'
                      ? '轮到红方走子'
                      : '轮到黑方走子'}
                  </span>
                  <div className="h-px bg-stone-800 flex-1" />
                </div>

                {/* Red Player Card */}
                <div
                  className={`p-3 rounded-xl border transition flex items-center justify-between ${
                    activeColor === 'red' && !gameResult
                      ? 'bg-red-950/40 border-red-500 shadow-md ring-1 ring-red-500/50'
                      : 'bg-stone-900/60 border-stone-800'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <img
                      src={redPlayer.avatar}
                      alt={redPlayer.name}
                      className="w-10 h-10 rounded-xl border border-red-900/60 object-cover"
                    />
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="w-2.5 h-2.5 rounded-full bg-red-600 inline-block" />
                        <strong className="text-sm font-bold text-red-200">
                          {redPlayer.name}
                        </strong>
                      </div>
                      <span className="text-[11px] text-stone-400 font-mono">
                        {redPlayer.tierTitle} · {redPlayer.rating}分
                      </span>
                    </div>
                  </div>

                  {/* Timer */}
                  <div className="text-right">
                    <span
                      className={`text-lg font-black font-mono block ${
                        redTimeLeft < 60 && timeControl.minutes > 0
                          ? 'text-red-400 animate-pulse'
                          : 'text-stone-200'
                      }`}
                    >
                      {timeControl.minutes > 0 ? formatTime(redTimeLeft) : '无时限'}
                    </span>
                    {activeColor === 'red' && !gameResult && (
                      <span className="text-[10px] text-red-400 font-bold">思考中...</span>
                    )}
                  </div>
                </div>
              </div>

              {/* AI Real-time Evaluation Bar */}
              <div className="p-4 rounded-2xl bg-stone-950 border border-stone-800 shadow-xl space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-stone-300 flex items-center gap-1.5">
                    <span>🤖</span>
                    <span>AI 实时局势推演</span>
                  </span>
                  <span className="text-xs font-mono font-bold text-amber-400">
                    红方胜率 {aiEval.winProbabilityRed}%
                  </span>
                </div>

                {/* Two-tone progress bar */}
                <div className="w-full h-3 rounded-full bg-stone-800 overflow-hidden flex border border-stone-700">
                  <div
                    className="h-full bg-gradient-to-r from-red-600 to-red-500 transition-all duration-500"
                    style={{ width: `${aiEval.winProbabilityRed}%` }}
                  />
                  <div
                    className="h-full bg-stone-700 transition-all duration-500"
                    style={{ width: `${100 - aiEval.winProbabilityRed}%` }}
                  />
                </div>

                <p className="text-xs text-stone-400 text-center font-serif">
                  {aiEval.statusText}
                </p>

                {/* AI Referee Quick Action */}
                <button
                  onClick={handleAIAdjudicate}
                  disabled={!!gameResult}
                  className="w-full py-2 rounded-xl bg-amber-950/60 hover:bg-amber-900/80 disabled:opacity-40 text-amber-200 border border-amber-700/60 text-xs font-bold transition flex items-center justify-center gap-1.5"
                >
                  <svg className="w-4 h-4 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span>AI 裁判判定终局（自动计分）</span>
                </button>
              </div>

              {/* Match Tools (Resign / Draw / Flip) */}
              <div className="p-3.5 rounded-2xl bg-stone-950 border border-stone-800 grid grid-cols-3 gap-2">
                <button
                  onClick={() => setIsFlipped(!isFlipped)}
                  className="py-2 px-1 rounded-xl bg-stone-900 hover:bg-stone-800 text-stone-300 text-xs font-medium transition text-center"
                  title="翻转棋盘红黑视角"
                >
                  🔄 翻转棋盘
                </button>

                <button
                  onClick={() => {
                    if (confirm(`【${activeColor === 'red' ? '红方' : '黑方'}】确定要认输吗？`)) {
                      handleGameOver(activeColor === 'red' ? 'black' : 'red', 'resigned');
                    }
                  }}
                  disabled={!!gameResult}
                  className="py-2 px-1 rounded-xl bg-stone-900 hover:bg-red-950/70 hover:text-red-300 disabled:opacity-40 text-stone-300 text-xs font-medium transition text-center"
                >
                  🏳️ 认输
                </button>

                <button
                  onClick={() => {
                    if (confirm('双方是否同意协议和棋？')) {
                      handleGameOver('draw', 'draw_agreement');
                    }
                  }}
                  disabled={!!gameResult}
                  className="py-2 px-1 rounded-xl bg-stone-900 hover:bg-stone-800 disabled:opacity-40 text-stone-300 text-xs font-medium transition text-center"
                >
                  🤝 提和
                </button>
              </div>
            </div>

            {/* Center Column: Interactive Chessboard */}
            <div className="lg:col-span-6 flex flex-col items-center justify-center order-1 lg:order-2">
              <ChessBoard
                board={board}
                selectedPos={selectedPos}
                legalMoves={legalMoves}
                lastMove={lastMove ? { from: lastMove.from, to: lastMove.to } : null}
                isFlipped={isFlipped}
                isAdmin={isAdmin}
                activeColor={activeColor}
                onSquareClick={handleSquareClick}
                onAdminPrompt={() => setShowAdminModal(true)}
              />
            </div>

            {/* Right Column: Live Move Timeline & Review Switcher */}
            <div className="lg:col-span-3 order-3 h-full">
              <GameReview
                moves={moves}
                currentStepIndex={reviewStepIndex}
                redPlayerName={redPlayer.name}
                blackPlayerName={blackPlayer.name}
                resultStr={
                  gameResult
                    ? gameResult.winner === 'red'
                      ? '1-0 红胜'
                      : gameResult.winner === 'black'
                      ? '0-1 黑胜'
                      : '1/2-1/2 和棋'
                    : '* 对弈中'
                }
                onJumpToStep={handleJumpToStep}
              />
            </div>
          </div>
        )}

        {/* VIEW 3: FULL REPLAY TAB */}
        {activeTab === 'review' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start flex-1 max-w-5xl mx-auto w-full">
            <div className="lg:col-span-7 flex justify-center">
              <ChessBoard
                board={board}
                selectedPos={null}
                legalMoves={[]}
                lastMove={
                  reviewStepIndex >= 0 && moves[reviewStepIndex]
                    ? { from: moves[reviewStepIndex].from, to: moves[reviewStepIndex].to }
                    : null
                }
                isFlipped={isFlipped}
                isAdmin={false}
                activeColor="red"
                onSquareClick={() => {}}
              />
            </div>

            <div className="lg:col-span-5 h-[560px]">
              <GameReview
                moves={moves}
                currentStepIndex={reviewStepIndex}
                redPlayerName={redPlayer.name}
                blackPlayerName={blackPlayer.name}
                resultStr={
                  gameResult
                    ? gameResult.winner === 'red'
                      ? '1-0 红胜'
                      : gameResult.winner === 'black'
                      ? '0-1 黑胜'
                      : '1/2-1/2 和棋'
                    : '* 对局复盘'
                }
                onJumpToStep={handleJumpToStep}
                onExitReview={() => setActiveTab('board')}
              />
            </div>
          </div>
        )}
      </main>

      {/* Admin Verification Modal */}
      <AdminModal
        isOpen={showAdminModal}
        onClose={() => setShowAdminModal(false)}
        onSuccess={() => {
          setIsAdmin(true);
          showToast('✅ 管理员权限验证成功！已解锁执棋与赛事控制');
        }}
      />

      {/* Member Management Modal ("积记分加成员") */}
      <MemberManagerModal
        isOpen={showMemberModal}
        isAdmin={isAdmin}
        onClose={() => setShowMemberModal(false)}
        onRequireAdmin={() => {
          setShowMemberModal(false);
          setShowAdminModal(true);
        }}
        onDataChanged={refreshPlayerData}
      />

      {/* Match Setup Modal ("开排位 / 匹配") */}
      <MatchSetupModal
        isOpen={showMatchModal}
        isAdmin={isAdmin}
        initialType="ranked"
        onClose={() => setShowMatchModal(false)}
        onRequireAdmin={() => {
          setShowMatchModal(false);
          setShowAdminModal(true);
        }}
        onStartMatch={handleStartMatch}
      />

      {/* Game Over Settlement Modal (Elo, Confetti, AI review) */}
      {gameResult && (
        <GameOverModal
          isOpen={isGameOverModalOpen}
          matchType={matchType}
          redPlayer={redPlayer}
          blackPlayer={blackPlayer}
          result={gameResult}
          moveCount={moves.length}
          aiSummary={aiMatchSummary}
          onClose={() => setIsGameOverModalOpen(false)}
          onStartReview={() => {
            setIsGameOverModalOpen(false);
            setActiveTab('review');
            setReviewStepIndex(moves.length - 1);
          }}
          onGoToLeaderboard={() => {
            setIsGameOverModalOpen(false);
            setActiveTab('leaderboard');
          }}
          onNewMatch={() => {
            setIsGameOverModalOpen(false);
            setShowMatchModal(true);
          }}
        />
      )}

      {/* Player Profile Modal */}
      <PlayerProfileModal
        player={selectedPlayerForProfile}
        onClose={() => setSelectedPlayerForProfile(null)}
        onLoadMatchToReplay={match => {
          setMoves(match.moves);
          setRedPlayer(findPlayerByName(match.redPlayerName) || redPlayer);
          setBlackPlayer(findPlayerByName(match.blackPlayerName) || blackPlayer);
          setReviewStepIndex(match.moves.length - 1);
          handleJumpToStep(match.moves.length - 1);
          setActiveTab('review');
          showToast(`已加载【${match.redPlayerName} VS ${match.blackPlayerName}】历史棋谱`);
        }}
      />

      {/* Native App Packaging & PWA Modal */}
      <AppPackagingModal
        isOpen={showPackagingModal}
        onClose={() => setShowPackagingModal(false)}
      />
    </div>
  );
}
