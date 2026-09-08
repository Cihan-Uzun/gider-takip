import React, { useState } from 'react';
import {
  Clock,
  Play,
  CheckCircle2,
  FileText,
  AlertCircle,
  Archive,
  Calendar,
  Sparkles,
  ShieldCheck,
  Download,
} from 'lucide-react';
import { MonthlyReport, Receipt } from '../types';
import { generateMonthlyPDF } from '../utils/pdfExport';

interface BatchQueue2100Props {
  queueItems: any[];
  lastBatchRun: string;
  onRunBatch: () => Promise<void>;
  receipts: Receipt[];
  monthlyReport: MonthlyReport | null;
}

export const BatchQueue2100: React.FC<BatchQueue2100Props> = ({
  queueItems,
  lastBatchRun,
  onRunBatch,
  receipts,
  monthlyReport,
}) => {
  const [isRunning, setIsRunning] = useState(false);
  const [lastResultMessage, setLastResultMessage] = useState<string | null>(null);

  const handleManualRun = async () => {
    setIsRunning(true);
    setLastResultMessage(null);
    try {
      await onRunBatch();
      setLastResultMessage('21:00 toplu taraması başarıyla tamamlandı. Belgeler şifreli veritabanına işlendi.');
    } catch (e: any) {
      setLastResultMessage('Hata oluştu: ' + e.message);
    } finally {
      setIsRunning(false);
    }
  };

  const handleExportPDF = () => {
    if (monthlyReport) {
      generateMonthlyPDF(monthlyReport, receipts);
    }
  };

  return (
    <div className="space-y-4">
      {/* 21:00 Automation Hero Banner */}
      <div className="bg-gradient-to-br from-slate-900 via-slate-900 to-indigo-950 border border-slate-800 rounded-2xl p-5 text-white relative overflow-hidden">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 relative z-10">
          <div className="space-y-1.5 max-w-md">
            <div className="inline-flex items-center gap-1.5 bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 text-[11px] font-semibold px-2.5 py-0.5 rounded-full">
              <Clock className="w-3 h-3 text-indigo-400" />
              <span>Günlük 21:00 Otomatik OCR Taraması</span>
            </div>
            <h2 className="text-base sm:text-lg font-bold">Saat 21:00 Toplu Tarama Kuyruğu</h2>
            <p className="text-xs text-slate-300 leading-relaxed">
              Gün içinde kamerayla veya yükleyerek eklediğiniz fiş, fatura, e-fatura ve makbuzlar her gün saat 21:00 itibariyle otomatik taranır, kategorize edilir ve şifreli veritabanında saklanır.
            </p>
          </div>

          <div className="flex flex-col gap-2 w-full sm:w-auto shrink-0">
            <button
              onClick={handleManualRun}
              disabled={isRunning || queueItems.length === 0}
              className="flex items-center justify-center gap-2 bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-slate-950 font-bold text-xs px-4 py-2.5 rounded-xl shadow-lg shadow-amber-500/10 transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Play className={`w-4 h-4 ${isRunning ? 'animate-spin' : ''}`} />
              <span>{isRunning ? 'Toplu Tarama Yapılıyor...' : '21:00 Taramasını Şimdi Çalıştır'}</span>
            </button>

            {monthlyReport && (
              <button
                onClick={handleExportPDF}
                className="flex items-center justify-center gap-2 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-semibold text-xs px-4 py-2 rounded-xl transition"
              >
                <Download className="w-4 h-4 text-emerald-400" />
                <span>Gün Sonu PDF Raporu İndir</span>
              </button>
            )}
          </div>
        </div>

        {/* Status Indicators */}
        <div className="mt-4 pt-3 border-t border-slate-800/80 flex flex-wrap items-center gap-4 text-xs text-slate-400">
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
            <span>Son Otomatik Tarama: <strong className="text-slate-200">{new Date(lastBatchRun).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })}</strong></span>
          </div>
          <div className="flex items-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            <span>Şifreli Veritabanı (AES-256-GCM)</span>
          </div>
          <div className="flex items-center gap-1.5 ml-auto">
            <Archive className="w-3.5 h-3.5 text-indigo-400" />
            <span>Kuyrukta: <strong className="text-amber-300 font-mono">{queueItems.length} Belge</strong></span>
          </div>
        </div>
      </div>

      {lastResultMessage && (
        <div className="p-3 bg-emerald-500/15 border border-emerald-500/30 rounded-xl text-emerald-300 text-xs flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{lastResultMessage}</span>
        </div>
      )}

      {/* Queue List Cards */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-2">
            <FileText className="w-4 h-4 text-amber-400" />
            21:00'de Taranacak Belgeler Listesi ({queueItems.length})
          </h3>
          <span className="text-[11px] text-slate-500">
            Otomatik Zamanlayıcı: Her gün 21:00'de tetiklenir
          </span>
        </div>

        {queueItems.length === 0 ? (
          <div className="p-8 text-center bg-slate-950/40 rounded-xl border border-slate-800/80 space-y-2">
            <div className="w-10 h-10 rounded-full bg-slate-800 text-slate-500 flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-5 h-5 text-emerald-400" />
            </div>
            <p className="text-xs font-semibold text-slate-300">
              Kuyrukta Bekleyen Belge Yok
            </p>
            <p className="text-[11px] text-slate-500 max-w-sm mx-auto">
              Gün içinde fiş tararken "Saat 21:00 Taramasına Ekle" butonuna basarak belgelerinizi bu kuyrukta biriktirebilirsiniz.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-slate-800">
            {queueItems.map((item, idx) => (
              <div key={item.id || idx} className="py-3 flex items-center justify-between text-xs">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-amber-500/10 text-amber-400 flex items-center justify-center font-bold">
                    #{idx + 1}
                  </div>
                  <div>
                    <div className="font-semibold text-white">{item.previewName}</div>
                    <div className="text-[11px] text-slate-400 flex items-center gap-2 mt-0.5">
                      <span>Eklenme: {new Date(item.addedAt).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })}</span>
                      <span>•</span>
                      <span className="text-amber-400">{item.docType || 'Fiş'}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-[11px] bg-amber-500/20 text-amber-300 border border-amber-500/40 px-2 py-0.5 rounded-full font-medium">
                    21:00 Bekliyor
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* How it works note */}
      <div className="p-4 bg-slate-900/60 border border-slate-800/80 rounded-xl text-xs text-slate-400 space-y-2">
        <h4 className="font-semibold text-slate-300 flex items-center gap-1.5">
          <Sparkles className="w-3.5 h-3.5 text-amber-400" />
          21:00 Gün Sonu Otomasyonu Nasıl Çalışır?
        </h4>
        <ul className="list-disc list-inside space-y-1 text-[11px] text-slate-400">
          <li>Gün boyunca aldığınız fiş veya e-faturaları anında işleyebilir ya da bu kuyruğa atabilirsiniz.</li>
          <li>Saat tam 21:00 olduğunda arka plandaki OCR motoru kuyruktaki tüm belgeleri tek seferde tarar.</li>
          <li>Kategorileri ayırır, KDV ve toplam tutarları hesaplar ve şifreli veritabanına ekler.</li>
          <li>Ertesi sabah saat 08:30'da cep telefonunuza dünün harcama özeti bildirim olarak iletilir.</li>
        </ul>
      </div>
    </div>
  );
};
