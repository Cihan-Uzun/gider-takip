import React, { useState } from 'react';
import {
  FileText,
  Download,
  Calendar,
  PieChart as PieChartIcon,
  TrendingUp,
  Receipt as ReceiptIcon,
  CheckCircle2,
  ArrowUpRight,
  ArrowDownRight,
} from 'lucide-react';
import { MonthlyReport, Receipt } from '../types';
import { generateMonthlyPDF } from '../utils/pdfExport';

interface MonthlyReportsViewProps {
  monthlyReport: MonthlyReport | null;
  receipts: Receipt[];
  currentMonth: string;
  onChangeMonth: (month: string) => void;
}

export const MonthlyReportsView: React.FC<MonthlyReportsViewProps> = ({
  monthlyReport,
  receipts,
  currentMonth,
  onChangeMonth,
}) => {
  const [isExporting, setIsExporting] = useState(false);

  if (!monthlyReport) {
    return (
      <div className="p-8 text-center text-slate-400 bg-slate-900 rounded-2xl border border-slate-800">
        Rapor verileri yükleniyor...
      </div>
    );
  }

  const handleDownloadPDF = () => {
    setIsExporting(true);
    try {
      generateMonthlyPDF(monthlyReport, receipts);
    } catch (e) {
      console.error(e);
    } finally {
      setIsExporting(false);
    }
  };

  const topCategory = monthlyReport.categoryBreakdown[0];
  const avgPerReceipt =
    monthlyReport.totalReceipts > 0
      ? monthlyReport.totalSpending / monthlyReport.totalReceipts
      : 0;

  return (
    <div className="space-y-4">
      {/* Header with Month Selector & PDF Button */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-teal-500/10 border border-teal-500/20 text-teal-400 flex items-center justify-center shrink-0">
            <Calendar className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-white leading-tight">
              Aylık Harcama Raporu
            </h2>
            <p className="text-xs text-slate-400">
              {monthlyReport.monthName} Dönemi Kategori Analizi
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <input
            type="month"
            value={currentMonth}
            onChange={(e) => onChangeMonth(e.target.value)}
            className="bg-slate-800 border border-slate-700 text-white rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-emerald-500 font-semibold"
          />

          <button
            onClick={handleDownloadPDF}
            disabled={isExporting}
            className="flex items-center justify-center gap-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs px-4 py-2 rounded-xl shadow-lg shadow-emerald-500/20 transition whitespace-nowrap disabled:opacity-50"
          >
            <Download className="w-4 h-4" />
            <span>{isExporting ? 'Oluşturuluyor...' : 'PDF Olarak İndir & Arşivle'}</span>
          </button>
        </div>
      </div>

      {/* 3 Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {/* Total Spend */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-1">
          <span className="text-[11px] font-medium text-slate-400 uppercase tracking-wider block">
            Aylık Toplam Harcama
          </span>
          <div className="text-xl sm:text-2xl font-black text-white font-mono">
            ₺{monthlyReport.totalSpending.toLocaleString('tr-TR', { minimumFractionDigits: 2 })}
          </div>
          <div className="flex items-center gap-1 text-[11px] text-emerald-400 font-medium pt-1">
            <ArrowUpRight className="w-3.5 h-3.5 text-emerald-400" />
            <span>Toplam {monthlyReport.totalReceipts} belge işlendi</span>
          </div>
        </div>

        {/* Top Category */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-1">
          <span className="text-[11px] font-medium text-slate-400 uppercase tracking-wider block">
            En Yüksek Harcama Kategorisi
          </span>
          <div className="text-lg sm:text-xl font-bold text-amber-400 truncate">
            {topCategory ? topCategory.category : 'Veri Yok'}
          </div>
          <div className="text-[11px] text-slate-400 font-mono pt-1">
            {topCategory
              ? `₺${topCategory.total.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} (%${topCategory.percentage})`
              : '-'}
          </div>
        </div>

        {/* Avg per receipt */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-1">
          <span className="text-[11px] font-medium text-slate-400 uppercase tracking-wider block">
            Fiş Başı Ortalama Tutar
          </span>
          <div className="text-lg sm:text-xl font-bold text-teal-300 font-mono">
            ₺{avgPerReceipt.toLocaleString('tr-TR', { minimumFractionDigits: 2 })}
          </div>
          <div className="text-[11px] text-slate-400 pt-1">
            Toplam {monthlyReport.categoryBreakdown.length} farklı kategori
          </div>
        </div>
      </div>

      {/* Category Breakdown Progress Bars */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider flex items-center gap-2">
            <PieChartIcon className="w-4 h-4 text-emerald-400" />
            Kategorilere Göre Harcama Dağılımı
          </h3>
          <span className="text-xs text-slate-400 font-mono">
            Genel Toplam: ₺{monthlyReport.totalSpending.toLocaleString('tr-TR')}
          </span>
        </div>

        {/* Visual Stacked Bar */}
        {monthlyReport.totalSpending > 0 && (
          <div className="w-full h-3 bg-slate-800 rounded-full overflow-hidden flex shadow-inner">
            {monthlyReport.categoryBreakdown.map((cat, i) => (
              <div
                key={i}
                style={{
                  width: `${cat.percentage}%`,
                  backgroundColor: cat.color,
                }}
                title={`${cat.category}: %${cat.percentage}`}
                className="h-full transition-all duration-500 hover:opacity-80"
              />
            ))}
          </div>
        )}

        {/* Categories Detail Table */}
        <div className="space-y-2.5 pt-1">
          {monthlyReport.categoryBreakdown.map((cat) => (
            <div
              key={cat.category}
              className="bg-slate-800/50 hover:bg-slate-800/80 border border-slate-800 rounded-xl p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2 transition"
            >
              <div className="flex items-center gap-2.5">
                <span
                  className="w-3 h-3 rounded-full shrink-0"
                  style={{ backgroundColor: cat.color }}
                />
                <span className="text-xs font-semibold text-white">{cat.category}</span>
                <span className="text-[11px] text-slate-400 font-normal">
                  ({cat.count} fiş/fatura)
                </span>
              </div>

              <div className="flex items-center justify-between sm:justify-end gap-4 text-xs">
                {/* Progress bar inside line */}
                <div className="w-24 hidden sm:block bg-slate-700 h-1.5 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full"
                    style={{ width: `${cat.percentage}%`, backgroundColor: cat.color }}
                  />
                </div>

                <div className="text-[11px] font-medium text-slate-400 w-10 text-right">
                  %{cat.percentage}
                </div>

                <div className="font-bold text-white font-mono text-xs w-28 text-right">
                  ₺{cat.total.toLocaleString('tr-TR', { minimumFractionDigits: 2 })}
                </div>
              </div>
            </div>
          ))}

          {monthlyReport.categoryBreakdown.length === 0 && (
            <div className="py-6 text-center text-xs text-slate-500">
              Bu ay için henüz harcama kaydı bulunmuyor.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
