import React, { useState } from 'react';
import { usePWAInstall } from '../hooks/usePWAInstall';

interface AppPackagingModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AppPackagingModal: React.FC<AppPackagingModalProps> = ({ isOpen, onClose }) => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [activeTab, setActiveTab] = useState<'pwa' | 'capacitor' | 'screens'>('pwa');
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  if (!isOpen) return null;

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedCode(id);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  const capacitorCommands = `
# 1. 安装 Capacitor 原生包装支持组件
npm install @capacitor/core @capacitor/cli @capacitor/ios @capacitor/android

# 2. 初始化原生项目配置
npx cap init "楚汉象棋" "com.chuhan.xiangqi" --web-dir dist

# 3. 构建前端产物并同步到 iOS 和 Android 原生工程
npm run build
npx cap add ios
npx cap add android
npx cap sync

# 4. 在 Xcode 或 Android Studio 中一键打包生成 IPA / APK 安装包
npx cap open ios      # 启动 Xcode 打包发布 App Store 或生成 Ad-Hoc ipa
npx cap open android  # 启动 Android Studio 直接导出 Release APK / AAB
`.trim();

  const capacitorConfig = `{
  "appId": "com.chuhan.xiangqi",
  "appName": "楚汉象棋",
  "webDir": "dist",
  "bundledWebRuntime": false,
  "server": {
    "androidScheme": "https"
  }
}`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-sm animate-fade-in">
      <div className="w-full max-w-2xl max-h-[92vh] rounded-2xl bg-stone-900 border border-amber-800/70 shadow-2xl overflow-hidden flex flex-col text-stone-100">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-stone-800 bg-stone-950 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="p-2 rounded-xl bg-amber-950 text-amber-400 border border-amber-800/50">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
              </svg>
            </span>
            <div>
              <h3 className="text-lg font-bold text-stone-100">
                全平台客户端与原生 App 打包部署支持
              </h3>
              <p className="text-xs text-stone-400">
                支持 PWA 离线安装、iOS (Safari / Xcode) 与 Android 原生 APK 打包
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

        {/* Tabs */}
        <div className="flex border-b border-stone-800 bg-stone-950/70 px-4 text-xs font-bold">
          <button
            onClick={() => setActiveTab('pwa')}
            className={`py-3 px-4 border-b-2 transition ${
              activeTab === 'pwa'
                ? 'border-amber-500 text-amber-300'
                : 'border-transparent text-stone-400 hover:text-stone-200'
            }`}
          >
            📱 一键安装为独立 App (PWA)
          </button>
          <button
            onClick={() => setActiveTab('capacitor')}
            className={`py-3 px-4 border-b-2 transition ${
              activeTab === 'capacitor'
                ? 'border-amber-500 text-amber-300'
                : 'border-transparent text-stone-400 hover:text-stone-200'
            }`}
          >
            📦 打包为原生 iOS / Android (APK)
          </button>
          <button
            onClick={() => setActiveTab('screens')}
            className={`py-3 px-4 border-b-2 transition ${
              activeTab === 'screens'
                ? 'border-amber-500 text-amber-300'
                : 'border-transparent text-stone-400 hover:text-stone-200'
            }`}
          >
            📐 平板 / 手机 / Surface Duo 适配说明
          </button>
        </div>

        {/* Tab Contents */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
          {activeTab === 'pwa' && (
            <div className="space-y-5">
              <div className="p-4 rounded-xl bg-gradient-to-r from-amber-950/70 to-stone-950 border border-amber-800/60 flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="flex items-center gap-3 text-center sm:text-left">
                  <img src="/icon.svg" alt="App Icon" className="w-14 h-14 rounded-2xl shadow-lg border border-amber-700/60" />
                  <div>
                    <h4 className="font-bold text-stone-100 text-base">楚汉争雄 - 中国象棋天梯赛</h4>
                    <p className="text-xs text-stone-400">免应用商店下载，像原生 App 一样秒开、支持离线棋谱复盘</p>
                  </div>
                </div>

                {isInstalled ? (
                  <span className="px-4 py-2 rounded-xl bg-emerald-950 border border-emerald-600/60 text-emerald-300 text-xs font-bold">
                    ✅ 已在原生应用模式中运行
                  </span>
                ) : isInstallable ? (
                  <button
                    onClick={install}
                    className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-500 hover:to-amber-600 text-white font-bold text-sm shadow-lg shadow-amber-950 transition flex items-center gap-2 flex-shrink-0"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                    </svg>
                    立即安装到桌面/手机
                  </button>
                ) : (
                  <span className="text-xs text-stone-400 bg-stone-900 px-3 py-1.5 rounded-lg border border-stone-800">
                    可使用浏览器菜单「添加到主屏幕」
                  </span>
                )}
              </div>

              {/* iOS Guide */}
              <div className="p-4 rounded-xl bg-stone-950 border border-stone-800 space-y-3">
                <h4 className="text-sm font-bold text-amber-300 flex items-center gap-2">
                  <span>🍎</span>
                  <span>iPhone / iPad (iOS Safari) 安装指南</span>
                </h4>
                <ol className="text-xs text-stone-300 space-y-2 list-decimal list-inside leading-relaxed">
                  <li>在 iPhone 或 iPad 上使用 <strong>Safari 浏览器</strong> 打开本站。</li>
                  <li>点击底部的 <strong>分享图标</strong>（带有向上箭头的方框 <span className="inline-block px-1 bg-stone-800 rounded">⎋</span>）。</li>
                  <li>在弹出的分享菜单中向下滑动，选择 <strong>「添加到主屏幕」 (Add to Home Screen)</strong>。</li>
                  <li>点击右上角「添加」，桌面即会生成带有传统中国象棋「帥」印图标的原生全屏应用！</li>
                </ol>
              </div>

              {/* Android Guide */}
              <div className="p-4 rounded-xl bg-stone-950 border border-stone-800 space-y-3">
                <h4 className="text-sm font-bold text-emerald-300 flex items-center gap-2">
                  <span>🤖</span>
                  <span>Android (Chrome / Edge / 鸿蒙系统) 安装指南</span>
                </h4>
                <ol className="text-xs text-stone-300 space-y-2 list-decimal list-inside leading-relaxed">
                  <li>使用 Chrome 或手机自带现代浏览器打开本页面。</li>
                  <li>点击页面右上角或上方的「安装 App」按钮，或点击浏览器右上角「⋮」菜单。</li>
                  <li>选择 <strong>「安装应用」</strong> 或 <strong>「添加到桌面」</strong> 即可。</li>
                </ol>
              </div>
            </div>
          )}

          {activeTab === 'capacitor' && (
            <div className="space-y-4">
              <p className="text-xs text-stone-300 leading-relaxed">
                本应用已完全支持利用 <strong>Capacitor</strong> 一键将其封装编译为 iOS 原生应用（可在 Xcode 中签署打包为 <code>.ipa</code>）与 Android 原生应用（可在 Android Studio 中直接一键构建 <code>.apk</code> 或 <code>.aab</code> 上架 Google Play / 华为应用市场）。
              </p>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-xs font-bold text-amber-300">构建指令（直接在终端执行）</span>
                  <button
                    onClick={() => copyToClipboard(capacitorCommands, 'cmd')}
                    className="text-xs px-2 py-0.5 rounded bg-stone-800 hover:bg-stone-700 text-stone-300 transition"
                  >
                    {copiedCode === 'cmd' ? '已复制！' : '复制代码'}
                  </button>
                </div>
                <pre className="p-3.5 rounded-xl bg-stone-950 border border-stone-800 text-[11px] font-mono text-emerald-300 overflow-x-auto leading-relaxed">
                  {capacitorCommands}
                </pre>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-xs font-bold text-amber-300">capacitor.config.json 配置模版</span>
                  <button
                    onClick={() => copyToClipboard(capacitorConfig, 'json')}
                    className="text-xs px-2 py-0.5 rounded bg-stone-800 hover:bg-stone-700 text-stone-300 transition"
                  >
                    {copiedCode === 'json' ? '已复制！' : '复制代码'}
                  </button>
                </div>
                <pre className="p-3.5 rounded-xl bg-stone-950 border border-stone-800 text-[11px] font-mono text-amber-200 overflow-x-auto">
                  {capacitorConfig}
                </pre>
              </div>
            </div>
          )}

          {activeTab === 'screens' && (
            <div className="space-y-4 text-xs text-stone-300 leading-relaxed">
              <div className="p-4 rounded-xl bg-stone-950 border border-stone-800 space-y-2">
                <h4 className="font-bold text-amber-300 text-sm">📱 手机与折叠屏适配 (iPhone, Android, Duo)</h4>
                <p>
                  • <strong>iPhone / 单屏手机</strong>：棋盘自适应宽度填满屏幕，所有走子控制、计时器及胜负弹窗均为单手可触达的大触控区设计。
                </p>
                <p>
                  • <strong>Surface Duo / 折叠屏双屏模式</strong>：利用 CSS Flex/Grid 响应式特性，在展开双屏（Dual-screen）模式下，左侧主屏呈现 9x10 高保真木质棋盘，右侧屏幕自动展示完整棋谱时间轴、AI 裁决走势及天梯榜，天然如同双屏专业裁判台！
                </p>
              </div>

              <div className="p-4 rounded-xl bg-stone-950 border border-stone-800 space-y-2">
                <h4 className="font-bold text-amber-300 text-sm">💻 平板电脑与大屏桌面 (iPad, Mac, Windows)</h4>
                <p>
                  • <strong>iPad / 平板横屏</strong>：分栏式大师视窗，左侧为双方棋手战绩与用时，居中为大棋盘，右侧为复盘拆解步谱。
                </p>
                <p>
                  • <strong>4K / 高清大屏</strong>：高精度矢量与 Canvas 自适应缩放，无任何模糊失真。
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-stone-800 bg-stone-950 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-200 text-sm font-medium transition"
          >
            知道了
          </button>
        </div>
      </div>
    </div>
  );
};
