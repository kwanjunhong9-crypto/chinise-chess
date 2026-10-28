import React, { useState, useEffect } from 'react';
import { Player } from '../types/chess';
import {
  addMemberAsync,
  deleteMemberAsync,
  updateMemberAsync,
  getStoredPlayers,
  syncPlayersFromServer,
} from '../utils/storage';
import { getTierTitleByRating } from '../utils/aiJudge';

interface MemberManagerModalProps {
  isOpen: boolean;
  isAdmin: boolean;
  onClose: () => void;
  onRequireAdmin: () => void;
  onDataChanged: () => void;
}

export const MemberManagerModal: React.FC<MemberManagerModalProps> = ({
  isOpen,
  isAdmin,
  onClose,
  onRequireAdmin,
  onDataChanged,
}) => {
  const [players, setPlayers] = useState<Player[]>(getStoredPlayers());
  const [name, setName] = useState('');
  const [rating, setRating] = useState<number>(1500);
  const [note, setNote] = useState('');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; msg: string } | null>(null);

  // Editing existing member state
  const [editingPlayerId, setEditingPlayerId] = useState<string | null>(null);
  const [editRating, setEditRating] = useState<number>(1500);

  // Sync latest from server on open
  useEffect(() => {
    if (isOpen) {
      syncPlayersFromServer().then(list => {
        setPlayers(list);
      });
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const refreshList = async () => {
    const list = await syncPlayersFromServer();
    setPlayers(list);
    onDataChanged();
  };

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAdmin) {
      onRequireAdmin();
      return;
    }

    if (!name.trim()) {
      setFeedback({ type: 'error', msg: '请输入成员姓名！' });
      return;
    }

    setLoading(true);
    const res = await addMemberAsync(name.trim(), Number(rating) || 1500, note.trim());
    setLoading(false);

    if (res.success) {
      setFeedback({ type: 'success', msg: `${res.message}（已同步至云端数据库）` });
      setName('');
      setRating(1500);
      setNote('');
      await refreshList();
    } else {
      setFeedback({ type: 'error', msg: res.message });
    }
  };

  const handleDelete = async (id: string, playerName: string) => {
    if (!isAdmin) {
      onRequireAdmin();
      return;
    }
    if (confirm(`确定要移除成员「${playerName}」吗？其他管理员也将同步此变更。`)) {
      setLoading(true);
      await deleteMemberAsync(id);
      setLoading(false);
      setFeedback({ type: 'success', msg: `已移除成员「${playerName}」（已同步全平台）` });
      await refreshList();
    }
  };

  const handleSaveEdit = async (id: string) => {
    if (!isAdmin) {
      onRequireAdmin();
      return;
    }
    setLoading(true);
    await updateMemberAsync(id, { rating: Number(editRating) });
    setLoading(false);
    setEditingPlayerId(null);
    setFeedback({ type: 'success', msg: '积分已更新并保存至云端！' });
    await refreshList();
  };

  const filteredPlayers = players.filter(p =>
    p.name.toLowerCase().includes(search.toLowerCase()) ||
    p.tierTitle.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
      <div className="w-full max-w-2xl max-h-[90vh] rounded-2xl bg-stone-900 border border-amber-800/60 flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-4 sm:p-5 border-b border-stone-800 bg-stone-950/60">
          <div className="flex items-center gap-3">
            <span className="p-2 rounded-xl bg-amber-950 text-amber-400 border border-amber-800/50">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </span>
            <div>
              <h3 className="text-lg font-bold text-stone-100 flex items-center gap-2">
                棋社成员与积记分管理
                {isAdmin ? (
                  <span className="text-[11px] px-2 py-0.5 rounded-full bg-emerald-950 border border-emerald-600/50 text-emerald-400">
                    管理员已认证
                  </span>
                ) : (
                  <span className="text-[11px] px-2 py-0.5 rounded-full bg-red-950 border border-red-600/50 text-red-400">
                    未解锁（仅管理员可增减）
                  </span>
                )}
              </h3>
              <p className="text-xs text-stone-400">
                云端同步保存 · 所有管理员均可实时查看修改数据
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-stone-400 hover:text-white p-2 rounded-lg hover:bg-stone-800 transition"
          >
            ✕
          </button>
        </div>

        {/* Content body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
          {/* Feedback message banner */}
          {feedback && (
            <div
              className={`p-3 rounded-xl text-sm flex items-center justify-between ${
                feedback.type === 'success'
                  ? 'bg-emerald-950/80 border border-emerald-700/60 text-emerald-200'
                  : 'bg-red-950/80 border border-red-700/60 text-red-200'
              }`}
            >
              <span>{feedback.msg}</span>
              <button onClick={() => setFeedback(null)} className="text-xs opacity-70 hover:opacity-100">
                ✕
              </button>
            </div>
          )}

          {/* Add Member Form (Admin only) */}
          <div className="p-4 rounded-xl bg-stone-950 border border-stone-800 space-y-3">
            <h4 className="text-sm font-bold text-amber-300 flex items-center gap-2">
              <svg className="w-4 h-4 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
              </svg>
              添加新成员（积记分加成员）
            </h4>

            {!isAdmin ? (
              <div className="py-3 px-4 rounded-lg bg-amber-950/30 border border-amber-900/40 flex items-center justify-between">
                <span className="text-xs text-amber-300">
                  ⚠️ 只有懂密码的管理员可以增加或减少成员与调整积分
                </span>
                <button
                  onClick={onRequireAdmin}
                  className="px-3 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-500 text-white text-xs font-bold transition"
                >
                  输入管理密码解锁
                </button>
              </div>
            ) : (
              <form onSubmit={handleAdd} className="grid grid-cols-1 sm:grid-cols-12 gap-3 pt-1">
                <div className="sm:col-span-4">
                  <label className="block text-xs text-stone-400 mb-1">选手姓名 *</label>
                  <input
                    type="text"
                    value={name}
                    onChange={e => setName(e.target.value)}
                    placeholder="如：许银川、张三"
                    className="w-full px-3 py-2 rounded-lg bg-stone-900 border border-stone-700 text-stone-100 text-sm focus:border-amber-500 focus:outline-none"
                    required
                  />
                </div>
                <div className="sm:col-span-3">
                  <label className="block text-xs text-stone-400 mb-1">初始积分 (Elo)</label>
                  <input
                    type="number"
                    value={rating}
                    onChange={e => setRating(Number(e.target.value))}
                    min="800"
                    max="2800"
                    className="w-full px-3 py-2 rounded-lg bg-stone-900 border border-stone-700 text-stone-100 text-sm focus:border-amber-500 focus:outline-none"
                  />
                </div>
                <div className="sm:col-span-3">
                  <label className="block text-xs text-stone-400 mb-1">称号/备注</label>
                  <input
                    type="text"
                    value={note}
                    onChange={e => setNote(e.target.value)}
                    placeholder="如：青年队主力"
                    className="w-full px-3 py-2 rounded-lg bg-stone-900 border border-stone-700 text-stone-100 text-sm focus:border-amber-500 focus:outline-none"
                  />
                </div>
                <div className="sm:col-span-2 flex items-end">
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-2 px-3 rounded-lg bg-amber-600 hover:bg-amber-500 text-white text-sm font-bold shadow-md transition disabled:opacity-50"
                  >
                    {loading ? '保存中...' : '+ 添加'}
                  </button>
                </div>
              </form>
            )}
          </div>

          {/* Members List */}
          <div className="space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <h4 className="text-sm font-bold text-stone-200">
                现有成员名单（共 {players.length} 人 · 自动云端持久化）
              </h4>
              <input
                type="text"
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="搜索成员姓名或头衔..."
                className="px-3 py-1.5 rounded-lg bg-stone-950 border border-stone-800 text-xs text-stone-200 w-full sm:w-56 focus:border-amber-500 focus:outline-none"
              />
            </div>

            <div className="divide-y divide-stone-800 rounded-xl bg-stone-950 border border-stone-800 max-h-72 overflow-y-auto">
              {filteredPlayers.length === 0 ? (
                <div className="p-6 text-center text-xs text-stone-500">
                  没有找到匹配的成员
                </div>
              ) : (
                filteredPlayers.map((p, idx) => {
                  const { title } = getTierTitleByRating(p.rating);
                  const isEditing = editingPlayerId === p.id;

                  return (
                    <div
                      key={p.id}
                      className="p-3 sm:px-4 flex items-center justify-between hover:bg-stone-900/60 transition gap-2"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <span className="text-xs font-mono text-stone-500 w-5 text-center">
                          {idx + 1}
                        </span>
                        <img
                          src={p.avatar}
                          alt={p.name}
                          className="w-8 h-8 rounded-full border border-stone-700 object-cover flex-shrink-0"
                        />
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-sm text-stone-100 truncate">
                              {p.name}
                            </span>
                            <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-950/80 text-amber-300 border border-amber-800/40">
                              {title}
                            </span>
                          </div>
                          <p className="text-[11px] text-stone-400 truncate">
                            {p.matchesPlayed} 战 / {p.wins}胜 {p.losses}负 {p.draws}和
                          </p>
                        </div>
                      </div>

                      {/* Right actions */}
                      <div className="flex items-center gap-2 flex-shrink-0">
                        {isEditing ? (
                          <div className="flex items-center gap-1.5">
                            <input
                              type="number"
                              value={editRating}
                              onChange={e => setEditRating(Number(e.target.value))}
                              className="w-20 px-2 py-1 text-xs rounded bg-stone-800 border border-amber-600 text-white"
                            />
                            <button
                              onClick={() => handleSaveEdit(p.id)}
                              disabled={loading}
                              className="px-2 py-1 text-xs rounded bg-emerald-600 text-white font-medium"
                            >
                              保存
                            </button>
                            <button
                              onClick={() => setEditingPlayerId(null)}
                              className="px-2 py-1 text-xs rounded bg-stone-700 text-stone-300"
                            >
                              取消
                            </button>
                          </div>
                        ) : (
                          <>
                            <div className="text-right mr-2">
                              <span className="text-sm font-black font-mono text-amber-400">
                                {p.rating}
                              </span>
                              <span className="text-[10px] text-stone-500 block">Elo积分</span>
                            </div>

                            {isAdmin && (
                              <div className="flex items-center gap-1">
                                <button
                                  onClick={() => {
                                    setEditingPlayerId(p.id);
                                    setEditRating(p.rating);
                                  }}
                                  title="调整积分"
                                  className="p-1.5 rounded-lg text-stone-400 hover:text-amber-400 hover:bg-stone-800 transition"
                                >
                                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                                  </svg>
                                </button>
                                <button
                                  onClick={() => handleDelete(p.id, p.name)}
                                  title="移除成员"
                                  className="p-1.5 rounded-lg text-stone-400 hover:text-red-400 hover:bg-stone-800 transition"
                                >
                                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                  </svg>
                                </button>
                              </div>
                            )}
                          </>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-stone-800 bg-stone-950 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-200 text-sm font-medium transition"
          >
            完成并关闭
          </button>
        </div>
      </div>
    </div>
  );
};
