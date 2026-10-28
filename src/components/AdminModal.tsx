import React, { useState } from 'react';
import { verifyAdminPassword } from '../utils/storage';

interface AdminModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const AdminModal: React.FC<AdminModalProps> = ({ isOpen, onClose, onSuccess }) => {
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!password.trim()) {
      setError('请输入管理密码！');
      return;
    }

    setLoading(true);
    const isValid = await verifyAdminPassword(password);
    setLoading(false);

    if (isValid) {
      setError('');
      setPassword('');
      onSuccess();
      onClose();
    } else {
      setError('密码错误！请重新输入。');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fade-in">
      <div className="w-full max-w-md rounded-2xl bg-stone-900 border border-amber-800/60 p-6 shadow-2xl">
        <div className="flex items-center justify-between pb-3 border-b border-stone-800">
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-lg bg-amber-950/80 text-amber-400 border border-amber-800/50">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            </span>
            <h3 className="text-lg font-bold text-stone-100">管理员权限验证</h3>
          </div>
          <button
            onClick={onClose}
            className="text-stone-400 hover:text-white p-1 rounded-lg hover:bg-stone-800 transition"
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-5 space-y-4">
          <p className="text-sm text-stone-300 leading-relaxed">
            仅系统管理员可添加/减少成员、创建比赛与执棋。请输入管理员专属密钥：
          </p>

          <div>
            <label className="block text-xs font-medium text-amber-300 mb-1">
              管理密码（Passcode）
            </label>
            <input
              type="password"
              value={password}
              onChange={e => {
                setPassword(e.target.value);
                if (error) setError('');
              }}
              placeholder="请输入管理员密码..."
              className="w-full px-4 py-2.5 rounded-xl bg-stone-950 border border-stone-700 focus:border-amber-500 focus:outline-none text-white text-sm"
              autoFocus
            />
            {error && <p className="mt-1.5 text-xs text-red-400">{error}</p>}
          </div>

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
              disabled={loading}
              className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-500 hover:to-amber-600 text-white text-sm font-bold shadow-lg shadow-amber-950 transition disabled:opacity-50"
            >
              {loading ? '正在验证...' : '解锁权限'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
