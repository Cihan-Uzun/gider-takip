import React, { useState } from 'react';
import {
  Target,
  AlertTriangle,
  TrendingUp,
  Sliders,
  CheckCircle2,
  AlertCircle,
  Sparkles,
} from 'lucide-react';
import { ExpenseCategory, MonthlyReport, Receipt } from '../types';

interface BudgetAnalyticsViewProps {
  monthlyReport: MonthlyReport | null;
  receipts: Receipt[];
}

interface BudgetTarget {
  category: ExpenseCategory;
  limit: number;
}

const DEFAULT_BUDGETS: BudgetTarget[] = [
  { category: 'Market & Gıda', limit: 8000 },
  { category: 'Ulaşım & Akaryakıt', limit: 5000 },
  { category: 'Restoran & Cafe', limit: 4000 },
  { category: 'Fatura & Abonelikler', limit: 3000 },
  { category: 'Elektronik & Donanım', limit: 10000 },
  { category: 'Ofis & Kırtasiye', limit: 2500 },
  { category: 'Sağlık & Eczane', limit: 2000 },
  { category: 'Giyim & Yaşam', limit: 3500 },
];

export const BudgetAnalyticsView: React.FC<BudgetAnalyticsViewProps> = ({
  monthlyReport,
  receipts,
}) => {
  const [budgets, setBudgets] = useState<BudgetTarget[]>(() => {
    const saved = localStorage.getItem('budget_targets_v1');
    return saved ? JSON.parse(saved) : DEFAULT_BUDGETS;
  });

  const [editingCat, setEditingCat] = useState<ExpenseCategory | null>(null);
  const [newLimitInput, setNewLimitInput] = useState<number>(5000);

  const saveNewLimit = (category: ExpenseCategory) => {
    const updated = budgets.map((b) => (b.category === category ? { ...b, limit: newLimitInput } : b));
    setBudgets(updated);
    localStorage.setItem('budget_targets_v1', JSON.stringify(updated));
    setEditingCat(null);
  };

  // Find all unusual expenses
  const unusualExpenses = receipts.filter(
    (r) => r.isUnusualExpense || Number(r.totalAmount) >= 4000
  );

  return (
    <div className="space-y-5">
      {/* Unusual Expenses Alert Box */}
      {unusualExpenses.length > 0 && (
        <div className="bg-amber-500/10 border border-amber-500/30 rounded-2xl p-4 sm:p-5 text-amber-200 space-y-3">
          <div className="flex items-center gap-2 text-amber-300">
            <AlertTriangle className="w-5 h-5 text-amber-400" />
            <h3 className="text-sm font-bold">
              Olağandışı Yüksek Harcama Uyarıları ({unusualExpenses.length} Adet)
            </h3>
          </div>
          <p className="text-xs text-amber-200/80 leading-relaxed">
            Sistem yapay zeka analizi ile rutin harcama standartlarınızın belirgin şekilde üzerinde olan ve bütçenizi riske atabilecek işlemleri işaretlemiştir.
          </p>

          <div className="space-y-2 pt-1">
            {unusualExpenses.map((exp) => (
              <div
                key={exp.id}
                className="bg-slate-900/80 border border-amber-500/30 rounded-xl p-3 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-white text-xs">{exp.merchant}</span>
                    <span className="text-[10px] bg-amber-500/20 text-amber-300 px-2 py-0.5 rounded-full border border-amber-500/40">
                      {exp.category}
                    </span>
                    <span className="text-[11px] text-slate-400">{exp.date}</span>
                  </div>
                  <div className="text-[11px] text-amber-300/90 mt-1">
                    ⚠️ {exp.unusualReason || 'Ortalamanın 3 katı üzerinde tekil harcama tespiti.'}
                  </div>
                </div>

                <div className="font-mono font-bold text-amber-400 text-sm whitespace-nowrap">
                  ₺{Number(exp.totalAmount).toLocaleString('tr-TR', { minimumFractionDigits: 2 })}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Budget Goals Section */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Target className="w-4 h-4 text-emerald-400" />
              Kategori Bazlı Bütçe Yönetimi
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Harcama limitlerinizi belirleyin, aşım durumlarında anında bildirim alın
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
          {budgets.map((b) => {
            const catData = monthlyReport?.categoryBreakdown.find((c) => c.category === b.category);
            const spent = catData?.total || 0;
            const percent = b.limit > 0 ? Math.round((spent / b.limit) * 100) : 0;
            const isExceeded = spent > b.limit;
            const remaining = b.limit - spent;

            return (
              <div
                key={b.category}
                className={`p-3.5 rounded-xl border transition ${
                  isExceeded
                    ? 'bg-rose-950/20 border-rose-500/40'
                    : 'bg-slate-800/40 border-slate-800 hover:border-slate-700'
                }`}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-xs font-semibold text-white">{b.category}</span>
                  <div className="flex items-center gap-1.5">
                    {editingCat === b.category ? (
                      <div className="flex items-center gap-1">
                        <input
                          type="number"
                          value={newLimitInput}
                          onChange={(e) => setNewLimitInput(Number(e.target.value))}
                          className="w-20 bg-slate-900 border border-slate-700 rounded px-1.5 py-0.5 text-xs text-white"
                        />
                        <button
                          onClick={() => saveNewLimit(b.category)}
                          className="bg-emerald-500 text-slate-950 text-[10px] font-bold px-2 py-0.5 rounded"
                        >
                          Tamam
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => {
                          setEditingCat(b.category);
                          setNewLimitInput(b.limit);
                        }}
                        className="text-[11px] text-slate-400 hover:text-emerald-400 transition"
                      >
                        Bütçe: ₺{b.limit.toLocaleString('tr-TR')} ✎
                      </button>
                    )}
                  </div>
                </div>

                {/* Progress Bar */}
                <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden mb-2">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${
                      isExceeded
                        ? 'bg-rose-500'
                        : percent > 80
                        ? 'bg-amber-400'
                        : 'bg-emerald-400'
                    }`}
                    style={{ width: `${Math.min(percent, 100)}%` }}
                  />
                </div>

                <div className="flex items-center justify-between text-[11px]">
                  <span className="text-slate-400 font-mono">
                    Harcanan: ₺{spent.toLocaleString('tr-TR')} (%{percent})
                  </span>

                  <span
                    className={`font-semibold font-mono ${
                      isExceeded ? 'text-rose-400' : 'text-emerald-400'
                    }`}
                  >
                    {isExceeded
                      ? `₺${Math.abs(remaining).toLocaleString('tr-TR')} Aşıldı!`
                      : `₺${remaining.toLocaleString('tr-TR')} Kaldı`}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
