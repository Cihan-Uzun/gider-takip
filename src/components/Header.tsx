import React from 'react';
import { ShieldCheck, Bell, Cloud, Smartphone, Sparkles, RefreshCw } from 'lucide-react';
import { SystemStatus } from '../types';

interface HeaderProps {
  systemStatus: SystemStatus | null;
  onOpenNotifications: () => void;
  onOpenCloudSync: () => void;
  onOpen2100Queue: () => void;
  pendingQueueCount: number;
  hasUnusualSpendToday: boolean;
  refreshing: boolean;
  onRefresh: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  systemStatus,
  onOpenNotifications,
  onOpenCloudSync,
  onOpen2100Queue,
  pendingQueueCount,
  hasUnusualSpendToday,
  refreshing,
  onRefresh,
}) => {
  return (
    <header className="sticky top-0 z-30 bg-slate-900/95 backdrop-blur-md border-b border-slate-800 text-white px-4 py-3">
      <div className="max-w-6xl mx-auto flex items-center justify-between gap-2">
        {/* Brand & Title */}
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-emerald-500 to-teal-400 flex items-center justify-center text-slate-950 font-bold shadow-sm shadow-emerald-500/20">
            <span className="text-base font-extrabold tracking-tighter">₺</span>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base sm:text-lg font-bold tracking-tight text-white leading-tight">
                Gider & Fiş Düzenleyici
              </h1>
              <span className="hidden sm:inline-flex items-center gap-1 text-[11px] font-medium bg-emerald-950/80 text-emerald-400 border border-emerald-800/60 rounded-full px-2 py-0.5">
                <ShieldCheck className="w-3 h-3 text-emerald-400" />
                AES-256 Şifreli
              </span>
            </div>
            <p className="text-[11px] text-slate-400 leading-tight">
              OCR Fiş Tarama • 21:00 Otomasyonu • Bulut Arşiv
            </p>
          </div>
        </div>

        {/* Right Actions */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          {/* Refresh Button */}
          <button
            onClick={onRefresh}
            title="Verileri Güncelle"
            className="p-2 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded-lg transition"
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin text-emerald-400' : ''}`} />
          </button>

          {/* 21:00 Queue Badge Button */}
          <button
            onClick={onOpen2100Queue}
            className={`flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1.5 rounded-lg border transition ${
              pendingQueueCount > 0
                ? 'bg-amber-500/10 border-amber-500/40 text-amber-300 hover:bg-amber-500/20 animate-pulse'
                : 'bg-slate-800/80 border-slate-700 text-slate-300 hover:bg-slate-800'
            }`}
          >
            <span className="text-[11px]">⏰ 21:00</span>
            {pendingQueueCount > 0 && (
              <span className="bg-amber-500 text-slate-950 text-[10px] font-bold px-1.5 rounded-full">
                {pendingQueueCount}
              </span>
            )}
          </button>

          {/* Morning Notification Button */}
          <button
            onClick={onOpenNotifications}
            className="relative p-2 text-slate-300 hover:text-white hover:bg-slate-800 rounded-lg border border-slate-700/80 transition"
            title="Sabah Günlük Özeti ve Bildirimler"
          >
            <Bell className="w-4 h-4" />
            {hasUnusualSpendToday && (
              <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-rose-500 rounded-full ring-2 ring-slate-900 animate-ping" />
            )}
          </button>

          {/* Cloud & Device Sync Status */}
          <button
            onClick={onOpenCloudSync}
            className="flex items-center gap-1.5 text-xs text-slate-300 bg-slate-800 hover:bg-slate-700/90 border border-slate-700 px-2.5 py-1.5 rounded-lg transition"
            title="Bulut Eşitleme & Cihazlar"
          >
            <Cloud className="w-3.5 h-3.5 text-teal-400" />
            <span className="hidden md:inline text-[11px] font-medium">Bulut Senkronize</span>
            <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
          </button>
        </div>
      </div>
    </header>
  );
};
