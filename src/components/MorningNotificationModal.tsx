import React, { useState, useEffect } from 'react';
import {
  Bell,
  X,
  Smartphone,
  CheckCircle2,
  AlertTriangle,
  Receipt as ReceiptIcon,
  Calendar,
  Sparkles,
  ShieldCheck,
  Send,
  Volume2,
} from 'lucide-react';
import { DailySummary } from '../types';

interface MorningNotificationModalProps {
  isOpen: boolean;
  onClose: () => void;
  dailySummary: DailySummary | null;
}

export const MorningNotificationModal: React.FC<MorningNotificationModalProps> = ({
  isOpen,
  onClose,
  dailySummary,
}) => {
  const [permissionState, setPermissionState] = useState<string>('default');
  const [notificationSent, setNotificationSent] = useState(false);
  const [logs, setLogs] = useState<any[]>([]);

  useEffect(() => {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      setPermissionState(Notification.permission);
    }

    if (isOpen) {
      fetch('/api/logs')
        .then((res) => res.json())
        .then((data) => {
          if (data.success) setLogs(data.data || []);
        })
        .catch((e) => console.error(e));
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const requestPermission = async () => {
    if ('Notification' in window) {
      try {
        const perm = await Notification.requestPermission();
        setPermissionState(perm);
        if (perm === 'granted') {
          triggerBrowserNotification();
        }
      } catch (err) {
        console.error(err);
      }
    }
  };

  const triggerBrowserNotification = () => {
    if (!dailySummary) return;

    setNotificationSent(true);

    if ('Notification' in window && Notification.permission === 'granted') {
      try {
        const title = dailySummary.hasUnusualExpense
          ? '⚠️ Sabah Harcama Özeti (Olağandışı Harcama Uyarısı!)'
          : '🌅 Günaydın! Günlük Harcama Özetiniz Hazır';

        const body = `Fiş Adedi: ${dailySummary.receiptCount} | Toplam: ₺${dailySummary.totalAmount.toLocaleString('tr-TR')} | En Yüksek: ${dailySummary.topCategory}`;

        new Notification(title, {
          body,
          icon: '/favicon.ico',
        });
      } catch (e) {
        console.error('Push notification trigger error', e);
      }
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/75 backdrop-blur-sm overflow-y-auto text-slate-100">
      <div className="bg-slate-900 border border-slate-800 w-full max-w-xl rounded-2xl shadow-2xl overflow-hidden my-auto max-h-[92vh] flex flex-col">
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-900/90">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-amber-500/20 text-amber-400 flex items-center justify-center">
              <Bell className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                Sabah Günlük Özeti & Mobil Bildirim
              </h2>
              <p className="text-xs text-slate-400">
                Her sabah saat 08:30'da cep telefonunuza iletilen günlük bütçe bülteni
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-5 overflow-y-auto flex-1 space-y-5">
          {/* Push Permission & Status Box */}
          <div className="bg-slate-800/60 border border-slate-700/60 rounded-xl p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <Smartphone className="w-5 h-5 text-teal-400 shrink-0" />
              <div className="text-xs">
                <span className="font-semibold text-white block">Mobil Cihaz Bildirim İzni</span>
                <span className="text-slate-400">
                  {permissionState === 'granted'
                    ? '✅ Bildirimler etkin. Her sabah özet bildiriminiz telefonunuza gönderilecek.'
                    : 'Bildirim izni vererek her sabah saat 08:30\'da özeti mobil cihazınızda görün.'}
                </span>
              </div>
            </div>

            {permissionState !== 'granted' ? (
              <button
                onClick={requestPermission}
                className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-bold px-3 py-1.5 rounded-lg whitespace-nowrap transition"
              >
                Bildirimlere İzin Ver
              </button>
            ) : (
              <button
                onClick={triggerBrowserNotification}
                className="bg-slate-700 hover:bg-slate-600 text-slate-200 text-xs font-semibold px-3 py-1.5 rounded-lg whitespace-nowrap transition flex items-center gap-1.5"
              >
                <Send className="w-3.5 h-3.5 text-amber-400" />
                Test Bildirimi Gönder
              </button>
            )}
          </div>

          {notificationSent && (
            <div className="p-2.5 bg-emerald-500/15 border border-emerald-500/30 rounded-xl text-emerald-300 text-xs flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span>Sabah özeti mobil bildirim olarak başarıyla simüle edildi ve gönderildi.</span>
            </div>
          )}

          {/* Morning Notification Live Preview Card */}
          {dailySummary && (
            <div className="space-y-2">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                Mobil Bildirim Kartı Görünümü (Her Sabah Saat 08:30)
              </span>

              <div className="bg-gradient-to-br from-slate-950 to-slate-900 border border-slate-700/80 rounded-2xl p-4 shadow-xl space-y-3 relative overflow-hidden">
                {/* Top notification bar */}
                <div className="flex items-center justify-between text-[11px] text-slate-400 pb-2 border-b border-slate-800">
                  <div className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
                    <span className="font-semibold text-slate-300">Gider & Fiş Düzenleyici</span>
                    <span>• Şimdi</span>
                  </div>
                  <span className="text-amber-400 font-medium">🌅 Sabah Raporu</span>
                </div>

                {/* Main Notification Metrics Grid */}
                <div className="grid grid-cols-3 gap-2 py-1">
                  <div className="bg-slate-800/70 p-2.5 rounded-xl text-center">
                    <span className="text-[10px] text-slate-400 block font-medium">İşlenen Fiş</span>
                    <span className="text-base font-extrabold text-white font-mono">
                      {dailySummary.receiptCount} Adet
                    </span>
                  </div>

                  <div className="bg-slate-800/70 p-2.5 rounded-xl text-center">
                    <span className="text-[10px] text-slate-400 block font-medium">Toplam Tutar</span>
                    <span className="text-base font-extrabold text-emerald-400 font-mono">
                      ₺{dailySummary.totalAmount.toLocaleString('tr-TR', { minimumFractionDigits: 2 })}
                    </span>
                  </div>

                  <div className="bg-slate-800/70 p-2.5 rounded-xl text-center">
                    <span className="text-[10px] text-slate-400 block font-medium">En Yüksek Kategori</span>
                    <span className="text-xs font-bold text-amber-300 truncate block mt-0.5">
                      {dailySummary.topCategory}
                    </span>
                  </div>
                </div>

                {/* Anomaly / Unusual Spend Warning in Notification */}
                {dailySummary.hasUnusualExpense ? (
                  <div className="bg-rose-500/15 border border-rose-500/30 rounded-xl p-2.5 text-xs text-rose-200 flex items-start gap-2">
                    <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                    <div>
                      <span className="font-bold text-rose-300 block">
                        ⚠️ Dikkat: Olağandışı Yüksek Harcama Tespit Edildi!
                      </span>
                      <span className="text-[11px] text-rose-200/90">
                        {dailySummary.unusualExpenses[0]?.merchant} firmasında ₺
                        {dailySummary.unusualExpenses[0]?.amount.toLocaleString('tr-TR')} tutarında harcama yapıldı.
                      </span>
                    </div>
                  </div>
                ) : (
                  <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-2 text-xs text-emerald-300 flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>Harcamalarınız normal seviyede, bütçe sınırları aşılmadı.</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* End of Day Transaction Logs (Her gün sonunda işlem yaptıklarını kaydetsin) */}
          <div className="space-y-2 pt-2 border-t border-slate-800">
            <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              Gün Sonu İşlem Günlüğü (Audit Log)
            </h3>
            <p className="text-[11px] text-slate-400">
              Günün her anında kaydedilen fiş, tarama ve yedekleme hareketleri şifreli olarak günlüğe yazılır.
            </p>

            <div className="max-h-48 overflow-y-auto space-y-1.5 pr-1">
              {logs.slice(0, 10).map((l, i) => (
                <div
                  key={l.id || i}
                  className="bg-slate-800/40 border border-slate-800 rounded-lg p-2 flex items-center justify-between text-[11px]"
                >
                  <div className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                    <span className="text-slate-300 font-medium font-mono">{l.action}</span>
                    {l.details?.merchant && (
                      <span className="text-slate-400">({l.details.merchant})</span>
                    )}
                  </div>
                  <div className="text-slate-500 text-[10px]">
                    {new Date(l.timestamp).toLocaleTimeString('tr-TR')}
                  </div>
                </div>
              ))}
              {logs.length === 0 && (
                <div className="text-center py-4 text-xs text-slate-500">
                  Kayıtlı işlem günlüğü bulunamadı.
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-800 bg-slate-900/90 flex justify-end">
          <button
            onClick={onClose}
            className="bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold px-4 py-2 rounded-xl transition"
          >
            Kapat
          </button>
        </div>
      </div>
    </div>
  );
};
