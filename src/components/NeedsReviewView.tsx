import React, { useState } from 'react';
import {
  AlertCircle,
  Building2,
  CheckCircle2,
  ArrowRight,
  Search,
  Calendar,
  CreditCard,
  FileText,
  Trash2,
  Layers,
  Sparkles,
  HelpCircle,
  Plus,
  Clock,
  ShieldCheck,
} from 'lucide-react';
import { Receipt, ExpenseCategory, BranchInfo } from '../types';

interface NeedsReviewViewProps {
  receipts: Receipt[];
  branches: BranchInfo[];
  onAssignBranch: (id: string, branch: string, category?: ExpenseCategory, notes?: string) => Promise<void>;
  onBatchAssignBranch: (ids: string[], branch: string) => Promise<void>;
  onDeleteReceipt: (id: string) => void;
  onOpenScanner: () => void;
  onRefresh: () => void;
  onNavigateToBranches?: () => void;
}

const CATEGORIES: ExpenseCategory[] = [
  'Market & Gıda',
  'Restoran & Cafe',
  'Ulaşım & Akaryakıt',
  'Fatura & Abonelikler',
  'Ofis & Kırtasiye',
  'Sağlık & Eczane',
  'Giyim & Yaşam',
  'Elektronik & Donanım',
  'Diğer',
];

export const NeedsReviewView: React.FC<NeedsReviewViewProps> = ({
  receipts,
  branches,
  onAssignBranch,
  onBatchAssignBranch,
  onDeleteReceipt,
  onOpenScanner,
  onRefresh,
  onNavigateToBranches,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [batchTargetBranch, setBatchTargetBranch] = useState(branches[0]?.name || 'Karabük Şubesi');
  const [isBatchProcessing, setIsBatchProcessing] = useState(false);

  // Per-receipt assignment draft state: { [receiptId]: { branch: string, category: ExpenseCategory, notes: string } }
  const [drafts, setDrafts] = useState<Record<string, { branch: string; category: ExpenseCategory; notes: string }>>({});
  const [assigningId, setAssigningId] = useState<string | null>(null);
  const [feedbackMessage, setFeedbackMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  // Filter only receipts that need review or have no valid branch
  const pendingReceipts = receipts.filter(
    (r) =>
      r.needsReview === true ||
      !r.branch ||
      r.branch === 'Belirtilmemiş' ||
      r.branch === 'Şube Belirtilmemiş' ||
      r.branch.trim() === ''
  );

  // Filter by search term
  const filteredReceipts = pendingReceipts.filter((r) => {
    const term = searchTerm.toLowerCase();
    return (
      r.merchant.toLowerCase().includes(term) ||
      (r.docNumber && r.docNumber.toLowerCase().includes(term)) ||
      (r.notes && r.notes.toLowerCase().includes(term)) ||
      r.category.toLowerCase().includes(term) ||
      r.totalAmount.toString().includes(term)
    );
  });

  const totalPendingAmount = pendingReceipts.reduce((sum, r) => sum + (r.totalAmount || 0), 0);

  const getDraft = (receipt: Receipt) => {
    if (drafts[receipt.id]) return drafts[receipt.id];
    return {
      branch: branches[0]?.name || 'Karabük Şubesi',
      category: receipt.category || 'Market & Gıda',
      notes: receipt.notes || '',
    };
  };

  const updateDraft = (receiptId: string, updates: Partial<{ branch: string; category: ExpenseCategory; notes: string }>) => {
    setDrafts((prev) => ({
      ...prev,
      [receiptId]: {
        ...(prev[receiptId] || {
          branch: branches[0]?.name || 'Karabük Şubesi',
          category: 'Market & Gıda',
          notes: '',
        }),
        ...updates,
      },
    }));
  };

  const handleSingleAssign = async (receipt: Receipt) => {
    const draft = getDraft(receipt);
    if (!draft.branch || draft.branch.trim() === '') {
      setFeedbackMessage({ text: 'Lütfen harcamanın aktarılacağı bir şube seçiniz.', type: 'error' });
      return;
    }

    setAssigningId(receipt.id);
    try {
      await onAssignBranch(receipt.id, draft.branch, draft.category, draft.notes);
      setFeedbackMessage({
        text: `"${receipt.merchant}" belgesi başarıyla "${draft.branch}" şubesine ve "${draft.category}" kategorisine aktarıldı!`,
        type: 'success',
      });
      // Remove from selectedIds if present
      setSelectedIds((prev) => prev.filter((id) => id !== receipt.id));
      setTimeout(() => setFeedbackMessage(null), 4000);
    } catch (e: any) {
      setFeedbackMessage({ text: 'Şube aktarımı sırasında hata: ' + (e.message || 'Bilinmeyen hata'), type: 'error' });
    } finally {
      setAssigningId(null);
    }
  };

  const handleBatchAssign = async () => {
    if (selectedIds.length === 0) return;
    if (!batchTargetBranch) {
      setFeedbackMessage({ text: 'Lütfen toplu aktarım için şube seçiniz.', type: 'error' });
      return;
    }

    setIsBatchProcessing(true);
    try {
      await onBatchAssignBranch(selectedIds, batchTargetBranch);
      setFeedbackMessage({
        text: `${selectedIds.length} adet belge başarıyla "${batchTargetBranch}" şubesine aktarıldı!`,
        type: 'success',
      });
      setSelectedIds([]);
      setTimeout(() => setFeedbackMessage(null), 4000);
    } catch (e: any) {
      setFeedbackMessage({ text: 'Toplu aktarım hatası: ' + e.message, type: 'error' });
    } finally {
      setIsBatchProcessing(false);
    }
  };

  const handleSelectAll = () => {
    if (selectedIds.length === filteredReceipts.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(filteredReceipts.map((r) => r.id));
    }
  };

  const toggleSelectOne = (id: string) => {
    setSelectedIds((prev) => (prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]));
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-amber-950/50 via-slate-900 to-slate-900 border border-amber-500/30 rounded-2xl p-4 sm:p-6 shadow-xl relative overflow-hidden">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/30 flex items-center justify-center shadow-inner">
                <HelpCircle className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-xl font-bold text-white tracking-tight">Kontrol Edilecekler</h1>
                  <span className="px-2.5 py-0.5 text-xs font-semibold bg-amber-500/20 text-amber-300 border border-amber-500/40 rounded-full">
                    {pendingReceipts.length} Belge Bekliyor
                  </span>
                </div>
                <p className="text-xs text-slate-400 mt-0.5">
                  Şube bilgisi eksik veya tespit edilememiş belgeler • Şube seçildiğinde anında ilgili şubenin kategorisine aktarılır
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={onOpenScanner}
              className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 shadow-lg shadow-emerald-950/50 transition active:scale-95"
            >
              <Plus className="w-4 h-4" />
              Yeni Fiş Tara
            </button>
            {onNavigateToBranches && (
              <button
                onClick={onNavigateToBranches}
                className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition"
              >
                <Building2 className="w-4 h-4 text-amber-400" />
                Şubeleri Yönet
              </button>
            )}
          </div>
        </div>

        {/* Metrics Bar */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-5 pt-4 border-t border-slate-800/80">
          <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-3 flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-amber-500/10 text-amber-400 flex items-center justify-center">
              <Clock className="w-4 h-4" />
            </div>
            <div>
              <span className="text-[11px] text-slate-400 block font-medium">Kontrol Bekleyen Fiş</span>
              <span className="text-base font-bold text-white">{pendingReceipts.length} Adet</span>
            </div>
          </div>

          <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-3 flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <span className="text-[11px] text-slate-400 block font-medium">Atama Bekleyen Tutar</span>
              <span className="text-base font-bold text-emerald-400">
                {totalPendingAmount.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} ₺
              </span>
            </div>
          </div>

          <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-3 flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-blue-500/10 text-blue-400 flex items-center justify-center">
              <Building2 className="w-4 h-4" />
            </div>
            <div>
              <span className="text-[11px] text-slate-400 block font-medium">Aktarılabilir Şubeler</span>
              <span className="text-base font-bold text-blue-400">{branches.length} Aktif Şube</span>
            </div>
          </div>
        </div>
      </div>

      {/* Feedback Toast */}
      {feedbackMessage && (
        <div
          className={`p-3.5 rounded-xl border flex items-center gap-2.5 text-xs font-medium animate-fadeIn ${
            feedbackMessage.type === 'success'
              ? 'bg-emerald-950/80 border-emerald-500 text-emerald-200'
              : 'bg-rose-950/80 border-rose-500 text-rose-200'
          }`}
        >
          {feedbackMessage.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          ) : (
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
          )}
          <span>{feedbackMessage.text}</span>
        </div>
      )}

      {/* Filter & Batch Actions Bar */}
      {pendingReceipts.length > 0 && (
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-3 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Firma adı, tutar, kategori veya fiş no ile ara..."
              className="w-full bg-slate-800 border border-slate-700/80 rounded-lg pl-9 pr-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500"
            />
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <label className="flex items-center gap-1.5 text-xs text-slate-300 cursor-pointer select-none px-2.5 py-1.5 bg-slate-800/80 hover:bg-slate-800 border border-slate-700 rounded-lg transition">
              <input
                type="checkbox"
                checked={selectedIds.length === filteredReceipts.length && filteredReceipts.length > 0}
                onChange={handleSelectAll}
                className="w-3.5 h-3.5 accent-amber-500 rounded cursor-pointer"
              />
              <span>Tümünü Seç ({selectedIds.length})</span>
            </label>

            {selectedIds.length > 0 && (
              <div className="flex items-center gap-2 bg-amber-950/40 border border-amber-500/40 px-2.5 py-1 rounded-lg animate-fadeIn">
                <select
                  value={batchTargetBranch}
                  onChange={(e) => setBatchTargetBranch(e.target.value)}
                  className="bg-slate-900 border border-amber-500/50 rounded px-2 py-1 text-xs text-white focus:outline-none"
                >
                  {branches.map((b) => (
                    <option key={b.id} value={b.name}>
                      {b.name}
                    </option>
                  ))}
                </select>
                <button
                  onClick={handleBatchAssign}
                  disabled={isBatchProcessing}
                  className="px-2.5 py-1 bg-amber-600 hover:bg-amber-500 disabled:opacity-50 text-white text-xs font-semibold rounded flex items-center gap-1 transition"
                >
                  <ArrowRight className="w-3.5 h-3.5" />
                  {isBatchProcessing ? 'Aktarılıyor...' : `Seçilenleri Aktar (${selectedIds.length})`}
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Receipts List */}
      {filteredReceipts.length === 0 ? (
        <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-10 text-center space-y-4">
          <div className="w-14 h-14 rounded-2xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 flex items-center justify-center mx-auto shadow-inner">
            <CheckCircle2 className="w-7 h-7" />
          </div>
          <div className="max-w-md mx-auto space-y-1.5">
            <h3 className="text-base font-bold text-white">Tüm Belgeler Şubelerine Atanmış Durumda!</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              {pendingReceipts.length === 0
                ? 'Kontrol bekleyen veya şube bilgisi eksik olan hiçbir fiş/fatura bulunmuyor. Tüm harcamalar ilgili şubelerin bütçe ve gider kayıtlarına eksiksiz işlenmiştir.'
                : 'Arama kriterlerinize uygun kontrol bekleyen belge bulunamadı.'}
            </p>
          </div>
          <div className="pt-2">
            <button
              onClick={onOpenScanner}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-semibold inline-flex items-center gap-1.5 transition shadow-lg shadow-emerald-950/40"
            >
              <Plus className="w-4 h-4" />
              Yeni Fiş Tara veya Yükle
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-3.5">
          {filteredReceipts.map((receipt) => {
            const draft = getDraft(receipt);
            const isSelected = selectedIds.includes(receipt.id);
            const isAssigning = assigningId === receipt.id;

            return (
              <div
                key={receipt.id}
                className={`bg-slate-900 border rounded-2xl p-4 transition-all ${
                  isSelected ? 'border-amber-500/70 shadow-lg shadow-amber-950/20' : 'border-slate-800 hover:border-slate-700'
                }`}
              >
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                  {/* Left: Checkbox + Receipt Summary */}
                  <div className="flex items-start gap-3 flex-1 min-w-0">
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => toggleSelectOne(receipt.id)}
                      className="w-4 h-4 accent-amber-500 rounded mt-1 cursor-pointer shrink-0"
                    />

                    <div className="space-y-1.5 flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-bold text-sm text-white truncate">{receipt.merchant}</span>
                        <span className="px-2 py-0.5 text-[10px] font-semibold bg-slate-800 text-slate-300 border border-slate-700 rounded">
                          {receipt.docType}
                        </span>
                        <span className="px-2 py-0.5 text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40 rounded flex items-center gap-1">
                          <AlertCircle className="w-3 h-3" />
                          Şube Bekliyor
                        </span>
                        {receipt.isNonCompliant && (
                          <span className="px-2 py-0.5 text-[10px] font-bold bg-rose-500/20 text-rose-300 border border-rose-500/40 rounded">
                            Politika Reddi
                          </span>
                        )}
                      </div>

                      {/* Review reason warning */}
                      <div className="text-xs text-amber-300/90 bg-amber-950/30 border border-amber-500/20 rounded-lg px-2.5 py-1 flex items-center gap-1.5">
                        <AlertCircle className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                        <span>{receipt.reviewReason || 'Fiş üzerinde şube bilgisi eksik. Lütfen ilgili şubeyi seçiniz.'}</span>
                      </div>

                      {/* Document Details row */}
                      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-400 pt-0.5">
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3.5 h-3.5 text-slate-500" />
                          {receipt.date} {receipt.time || ''}
                        </span>
                        <span className="flex items-center gap-1">
                          <CreditCard className="w-3.5 h-3.5 text-slate-500" />
                          {receipt.paymentMethod}
                        </span>
                        {receipt.docNumber && (
                          <span className="flex items-center gap-1">
                            <FileText className="w-3.5 h-3.5 text-slate-500" />
                            No: {receipt.docNumber}
                          </span>
                        )}
                        <span className="text-slate-300 font-medium">
                          Mevcut Kategori: <strong className="text-white">{receipt.category}</strong>
                        </span>
                      </div>

                      {/* Items preview */}
                      {receipt.items && receipt.items.length > 0 && (
                        <div className="text-[11px] text-slate-400 bg-slate-800/40 rounded-lg px-2.5 py-1.5 max-w-xl">
                          <span className="font-medium text-slate-300">Kalemler ({receipt.items.length}): </span>
                          {receipt.items.map((it, idx) => (
                            <span key={idx} className="mr-2">
                              {it.name} ({it.totalPrice.toLocaleString('tr-TR')} ₺){idx < receipt.items.length - 1 ? ',' : ''}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Right: Amount & Quick Assignment Form */}
                  <div className="flex flex-col sm:flex-row lg:flex-col xl:flex-row items-start sm:items-center lg:items-end xl:items-center gap-3 shrink-0 pt-2 lg:pt-0 border-t lg:border-t-0 border-slate-800">
                    <div className="text-right sm:text-left lg:text-right">
                      <span className="text-[10px] text-slate-400 block">Harcama Tutarı</span>
                      <span className="text-base font-extrabold text-emerald-400">
                        {receipt.totalAmount.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} ₺
                      </span>
                    </div>

                    {/* Interactive Branch Assignment Dropdown & Button */}
                    <div className="bg-slate-800/80 border border-slate-700/80 rounded-xl p-2.5 flex flex-wrap sm:flex-nowrap items-center gap-2 w-full sm:w-auto">
                      {/* Branch Selection */}
                      <div>
                        <label className="block text-[10px] text-slate-400 font-medium mb-0.5">Aktarılacak Şube:</label>
                        <select
                          value={draft.branch}
                          onChange={(e) => updateDraft(receipt.id, { branch: e.target.value })}
                          className="bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white font-medium focus:outline-none focus:border-amber-500 w-44"
                        >
                          {branches.map((b) => (
                            <option key={b.id} value={b.name}>
                              {b.name} ({b.city})
                            </option>
                          ))}
                        </select>
                      </div>

                      {/* Category Confirmation */}
                      <div>
                        <label className="block text-[10px] text-slate-400 font-medium mb-0.5">Kategori:</label>
                        <select
                          value={draft.category}
                          onChange={(e) => updateDraft(receipt.id, { category: e.target.value as ExpenseCategory })}
                          className="bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white font-medium focus:outline-none focus:border-amber-500 w-36"
                        >
                          {CATEGORIES.map((cat) => (
                            <option key={cat} value={cat}>
                              {cat}
                            </option>
                          ))}
                        </select>
                      </div>

                      {/* Action Button: Transfer */}
                      <div className="self-end">
                        <button
                          type="button"
                          onClick={() => handleSingleAssign(receipt)}
                          disabled={isAssigning}
                          className="px-3 py-1.5 bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-500 hover:to-amber-400 text-white text-xs font-bold rounded-lg shadow-md shadow-amber-950/40 flex items-center gap-1.5 transition active:scale-95 disabled:opacity-50"
                        >
                          <ArrowRight className="w-3.5 h-3.5" />
                          {isAssigning ? 'Aktarılıyor...' : 'Şubeye Aktar'}
                        </button>
                      </div>

                      {/* Delete */}
                      <div className="self-end">
                        <button
                          type="button"
                          onClick={() => onDeleteReceipt(receipt.id)}
                          title="Fişi Sil"
                          className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-slate-800 transition"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
