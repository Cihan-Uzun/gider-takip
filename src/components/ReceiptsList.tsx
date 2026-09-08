import React, { useState, useEffect } from 'react';
import {
  Search,
  Filter,
  Receipt as ReceiptIcon,
  Calendar,
  Tag,
  CreditCard,
  AlertTriangle,
  ChevronDown,
  ChevronUp,
  Trash2,
  FileText,
  ShieldCheck,
  Building2,
  AlertOctagon,
  HelpCircle,
  AlertCircle,
} from 'lucide-react';
import { Receipt, ExpenseCategory, DocumentType } from '../types';

interface ReceiptsListProps {
  receipts: Receipt[];
  onDeleteReceipt: (id: string) => void;
  onOpenScanner: () => void;
  initialBranchFilter?: string;
  onNavigateToReview?: () => void;
}

const CATEGORY_COLORS: { [key: string]: string } = {
  'Market & Gıda': 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
  'Restoran & Cafe': 'bg-amber-500/10 text-amber-400 border-amber-500/20',
  'Ulaşım & Akaryakıt': 'bg-blue-500/10 text-blue-400 border-blue-500/20',
  'Fatura & Abonelikler': 'bg-purple-500/10 text-purple-400 border-purple-500/20',
  'Ofis & Kırtasiye': 'bg-pink-500/10 text-pink-400 border-pink-500/20',
  'Sağlık & Eczane': 'bg-rose-500/10 text-rose-400 border-rose-500/20',
  'Giyim & Yaşam': 'bg-teal-500/10 text-teal-400 border-teal-500/20',
  'Elektronik & Donanım': 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20',
  'Diğer': 'bg-slate-500/10 text-slate-400 border-slate-500/20',
};

export const ReceiptsList: React.FC<ReceiptsListProps> = ({
  receipts,
  onDeleteReceipt,
  onOpenScanner,
  initialBranchFilter = 'Tümü',
  onNavigateToReview,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('Tümü');
  const [selectedDocType, setSelectedDocType] = useState<string>('Tümü');
  const [selectedBranch, setSelectedBranch] = useState<string>(initialBranchFilter);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  useEffect(() => {
    if (initialBranchFilter) {
      setSelectedBranch(initialBranchFilter);
    }
  }, [initialBranchFilter]);

  // Categories and branches list for filter
  const categories = ['Tümü', ...Array.from(new Set(receipts.map((r) => r.category)))];
  const docTypes = ['Tümü', 'Fiş', 'Fatura', 'E-Fatura', 'Makbuz'];
  const branches = ['Tümü', ...Array.from(new Set(receipts.map((r) => r.branch || 'Karabük Şubesi')))];

  // Filtered receipts
  const filtered = receipts.filter((r) => {
    const rBranch = r.branch || 'Karabük Şubesi';
    const matchesSearch =
      r.merchant.toLowerCase().includes(searchTerm.toLowerCase()) ||
      rBranch.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (r.docNumber && r.docNumber.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (r.notes && r.notes.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesCategory = selectedCategory === 'Tümü' || r.category === selectedCategory;
    const matchesDocType = selectedDocType === 'Tümü' || r.docType === selectedDocType;
    const matchesBranch = selectedBranch === 'Tümü' || rBranch === selectedBranch;

    return matchesSearch && matchesCategory && matchesDocType && matchesBranch;
  });

  const totalFilteredAmount = filtered.reduce((acc, r) => acc + (Number(r.totalAmount) || 0), 0);

  const toggleExpand = (id: string) => {
    setExpandedId(expandedId === id ? null : id);
  };

  const pendingReviewCount = receipts.filter(
    (r) => r.needsReview || !r.branch || r.branch === 'Belirtilmemiş' || r.branch === 'Şube Belirtilmemiş'
  ).length;

  return (
    <div className="space-y-4">
      {/* Pending Review Notice Banner */}
      {pendingReviewCount > 0 && onNavigateToReview && (
        <div className="bg-amber-500/10 border border-amber-500/30 rounded-2xl p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs shadow-md shadow-amber-950/20">
          <div className="flex items-center gap-2.5 text-amber-200">
            <div className="w-7 h-7 rounded-lg bg-amber-500/20 text-amber-400 flex items-center justify-center shrink-0">
              <HelpCircle className="w-4 h-4" />
            </div>
            <div>
              <span className="font-bold text-amber-300">
                {pendingReviewCount} adet belgenin şube bilgisi eksik!
              </span>
              <p className="text-[11px] text-amber-200/80 mt-0.5">
                Şube seçimi yapılmadığı için 'Kontrol Edilecekler' alanında bekletiliyor. İlgili şubeyi ve kategoriyi atayabilirsiniz.
              </p>
            </div>
          </div>
          <button
            onClick={onNavigateToReview}
            className="px-3 py-1.5 bg-amber-600 hover:bg-amber-500 text-white rounded-lg text-xs font-bold transition shrink-0 self-start sm:self-auto flex items-center gap-1"
          >
            Kontrol Et & Şubeye Ata →
          </button>
        </div>
      )}

      {/* Top Filter & Search Bar */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-3">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          {/* Search Box */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Firma, şube (Karabük vb.), fiş no veya ürün ara..."
              className="w-full bg-slate-800/80 border border-slate-700/80 rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder-slate-400 focus:outline-none focus:border-emerald-500"
            />
          </div>

          {/* Branch Filter Dropdown */}
          <div className="flex items-center gap-1.5 bg-slate-800/80 border border-slate-700/80 rounded-xl px-3 py-1.5">
            <Building2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <select
              value={selectedBranch}
              onChange={(e) => setSelectedBranch(e.target.value)}
              className="bg-transparent text-xs text-white font-medium focus:outline-none cursor-pointer"
            >
              {branches.map((b) => (
                <option key={b} value={b} className="bg-slate-900 text-white">
                  {b === 'Tümü' ? 'Tüm Şubeler' : b}
                </option>
              ))}
            </select>
          </div>

          {/* Quick Scan CTA */}
          <button
            onClick={onOpenScanner}
            className="flex items-center justify-center gap-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-bold px-4 py-2 rounded-xl shadow-md shadow-emerald-500/20 transition whitespace-nowrap"
          >
            <ReceiptIcon className="w-4 h-4" />
            <span>Fiş / Fatura Tara</span>
          </button>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-2 pt-1">
          <div className="flex items-center gap-1 overflow-x-auto pb-1 max-w-full no-scrollbar">
            <span className="text-[11px] text-slate-400 font-medium mr-1 flex items-center gap-1">
              <Filter className="w-3 h-3" /> Kategori:
            </span>
            {categories.slice(0, 6).map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`text-[11px] px-2.5 py-1 rounded-lg border transition whitespace-nowrap ${
                  selectedCategory === cat
                    ? 'bg-emerald-500/20 border-emerald-500/50 text-emerald-300 font-medium'
                    : 'bg-slate-800/60 border-slate-700/50 text-slate-400 hover:text-slate-200'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-1 ml-auto">
            <span className="text-[11px] text-slate-400 font-medium mr-1">Tür:</span>
            {docTypes.map((dt) => (
              <button
                key={dt}
                onClick={() => setSelectedDocType(dt)}
                className={`text-[11px] px-2 py-0.5 rounded-lg border transition ${
                  selectedDocType === dt
                    ? 'bg-teal-500/20 border-teal-500/50 text-teal-300 font-medium'
                    : 'bg-slate-800/40 border-slate-700/50 text-slate-400 hover:text-slate-200'
                }`}
              >
                {dt}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Filter Stats Bar */}
      <div className="flex items-center justify-between px-1 text-xs text-slate-400">
        <div>
          {selectedBranch !== 'Tümü' && (
            <span className="text-emerald-400 font-semibold mr-2">[{selectedBranch}]</span>
          )}
          Toplam <span className="text-white font-semibold">{filtered.length}</span> fiş / fatura
        </div>
        <div>
          Gider Toplamı:{' '}
          <span className="text-emerald-400 font-mono font-bold">
            ₺{totalFilteredAmount.toLocaleString('tr-TR', { minimumFractionDigits: 2 })}
          </span>
        </div>
      </div>

      {/* Receipts List */}
      {filtered.length === 0 ? (
        <div className="text-center py-16 bg-slate-900/50 border border-slate-800 rounded-2xl p-6">
          <div className="w-12 h-12 rounded-2xl bg-slate-800 text-slate-500 flex items-center justify-center mx-auto mb-3">
            <ReceiptIcon className="w-6 h-6" />
          </div>
          <h3 className="text-sm font-semibold text-white">Kayıtlı Belge Bulunamadı</h3>
          <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
            Filtreleme kriterlerine uyan fiş veya fatura yok. Yeni bir makbuz veya fiş tarayarak başlayabilirsiniz.
          </p>
          <button
            onClick={onOpenScanner}
            className="mt-4 inline-flex items-center gap-2 bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/30 text-emerald-300 text-xs font-semibold px-4 py-2 rounded-xl transition"
          >
            <ReceiptIcon className="w-4 h-4" />
            <span>Fiş Tara</span>
          </button>
        </div>
      ) : (
        <div className="space-y-2.5">
          {filtered.map((receipt) => {
            const isExpanded = expandedId === receipt.id;
            const categoryStyle =
              CATEGORY_COLORS[receipt.category] || 'bg-slate-500/10 text-slate-400 border-slate-500/20';
            const isNeedsReview =
              receipt.needsReview ||
              !receipt.branch ||
              receipt.branch === 'Belirtilmemiş' ||
              receipt.branch === 'Şube Belirtilmemiş';
            const receiptBranch = isNeedsReview ? 'Şube Belirtilmemiş' : (receipt.branch || 'Karabük Şubesi');
            const isRejected = receipt.isNonCompliant || receipt.approvalStatus === 'rejected';

            return (
              <div
                key={receipt.id}
                className={`bg-slate-900 border transition rounded-xl overflow-hidden ${
                  isRejected
                    ? 'border-rose-500/50 bg-rose-950/20 shadow-sm shadow-rose-500/5'
                    : isNeedsReview
                    ? 'border-amber-500/40 shadow-sm shadow-amber-500/5'
                    : receipt.isUnusualExpense
                    ? 'border-amber-500/50 shadow-sm shadow-amber-500/5'
                    : 'border-slate-800 hover:border-slate-700'
                }`}
              >
                {/* Main Card Row */}
                <div
                  onClick={() => toggleExpand(receipt.id)}
                  className="p-3.5 cursor-pointer flex items-center justify-between gap-3 select-none"
                >
                  <div className="flex items-start gap-3 min-w-0">
                    <div
                      className={`w-9 h-9 rounded-xl border flex items-center justify-center shrink-0 mt-0.5 ${
                        isRejected
                          ? 'bg-rose-500/15 border-rose-500/40 text-rose-400'
                          : isNeedsReview
                          ? 'bg-amber-500/15 border-amber-500/40 text-amber-400'
                          : 'bg-slate-800 border-slate-700/80 text-slate-300'
                      }`}
                    >
                      {isRejected ? (
                        <AlertOctagon className="w-4 h-4 text-rose-400" />
                      ) : isNeedsReview ? (
                        <HelpCircle className="w-4 h-4 text-amber-400" />
                      ) : (
                        <ReceiptIcon className="w-4 h-4 text-emerald-400" />
                      )}
                    </div>

                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="text-sm font-semibold text-white truncate max-w-[200px] sm:max-w-md">
                          {receipt.merchant}
                        </h3>

                        {/* Branch badge */}
                        {isNeedsReview ? (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              onNavigateToReview?.();
                            }}
                            className="text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40 hover:bg-amber-500/30 px-2 py-0.5 rounded-full flex items-center gap-1 transition"
                            title="Şube bilgisi eksik - Kontrol Edilecekler alanında ata"
                          >
                            <AlertCircle className="w-2.5 h-2.5" />
                            Şube Bekliyor (Ata)
                          </button>
                        ) : (
                          <span className="text-[10px] font-semibold bg-slate-800 text-emerald-300 border border-emerald-500/30 px-2 py-0.5 rounded-full flex items-center gap-1">
                            <Building2 className="w-2.5 h-2.5" />
                            {receiptBranch}
                          </span>
                        )}

                        <span className={`text-[10px] font-medium border px-2 py-0.5 rounded-full ${categoryStyle}`}>
                          {receipt.category}
                        </span>
                        <span className="text-[10px] bg-slate-800 text-slate-400 px-1.5 py-0.5 rounded">
                          {receipt.docType}
                        </span>

                        {/* Rejected Pill */}
                        {isRejected && (
                          <span className="text-[10px] bg-rose-500/20 text-rose-300 border border-rose-500/40 font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
                            <AlertOctagon className="w-3 h-3 text-rose-400" />
                            Kurumsal Politika Reddi
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-3 text-[11px] text-slate-400 mt-1">
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3 h-3 text-slate-500" />
                          {receipt.date} {receipt.time || ''}
                        </span>
                        <span className="flex items-center gap-1">
                          <CreditCard className="w-3 h-3 text-slate-500" />
                          {receipt.paymentMethod}
                        </span>
                        {receipt.docNumber && (
                          <span className="hidden sm:inline text-slate-500 font-mono text-[10px]">
                            #{receipt.docNumber}
                          </span>
                        )}
                      </div>

                      {/* Compliance Failure Alert Pill */}
                      {isRejected && receipt.complianceReason && (
                        <div className="inline-flex items-center gap-1 text-[11px] text-rose-300 bg-rose-500/15 border border-rose-500/40 px-2.5 py-1 rounded-md mt-1.5">
                          <AlertOctagon className="w-3.5 h-3.5 text-rose-400 shrink-0" />
                          <span>{receipt.complianceReason}</span>
                        </div>
                      )}

                      {/* Unusual Expense Alert Pill */}
                      {receipt.isUnusualExpense && !isRejected && (
                        <div className="inline-flex items-center gap-1 text-[11px] text-amber-300 bg-amber-500/10 border border-amber-500/30 px-2 py-0.5 rounded-md mt-1.5">
                          <AlertTriangle className="w-3 h-3 text-amber-400" />
                          <span>{receipt.unusualReason || 'Olağandışı Yüksek Harcama!'}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Right: Amount & Toggle */}
                  <div className="text-right shrink-0 flex items-center gap-3">
                    <div>
                      <div
                        className={`text-sm sm:text-base font-bold font-mono ${
                          isRejected ? 'text-rose-400 line-through' : 'text-white'
                        }`}
                      >
                        ₺{Number(receipt.totalAmount).toLocaleString('tr-TR', { minimumFractionDigits: 2 })}
                      </div>
                      {receipt.taxAmount ? (
                        <div className="text-[10px] text-slate-400 font-mono">
                          KDV (%{receipt.taxRate || 10}): ₺{Number(receipt.taxAmount).toFixed(2)}
                        </div>
                      ) : null}
                    </div>

                    <button
                      type="button"
                      className="p-1 text-slate-400 hover:text-white transition"
                    >
                      {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* Expanded Details */}
                {isExpanded && (
                  <div className="px-4 pb-4 pt-2 border-t border-slate-800/80 bg-slate-950/40 text-xs space-y-3">
                    {/* Items table */}
                    {receipt.items && receipt.items.length > 0 && (
                      <div>
                        <h4 className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
                          Ürün / Kalem Detayları:
                        </h4>
                        <div className="bg-slate-900 rounded-lg p-2 border border-slate-800 divide-y divide-slate-800">
                          {receipt.items.map((item, idx) => (
                            <div key={idx} className="py-1.5 flex items-center justify-between text-xs">
                              <div className="text-slate-300 font-medium flex items-center gap-2">
                                <span>{item.name}</span>
                                {item.isProhibited && (
                                  <span className="text-[10px] bg-rose-500 text-white font-bold px-1.5 py-0.2 rounded">
                                    KURUMSAL YASAKLI
                                  </span>
                                )}
                                {item.quantity && item.quantity > 1 && (
                                  <span className="text-slate-500 text-[11px] font-normal">
                                    ({item.quantity} adet × ₺{item.unitPrice})
                                  </span>
                                )}
                              </div>
                              <div className="text-emerald-400 font-mono font-semibold">
                                ₺{Number(item.totalPrice).toLocaleString('tr-TR', { minimumFractionDigits: 2 })}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {receipt.notes && (
                      <div className="text-slate-400 bg-slate-900/60 p-2 rounded-lg border border-slate-800 text-[11px]">
                        <span className="font-semibold text-slate-300">Not: </span>
                        {receipt.notes}
                      </div>
                    )}

                    {/* Metadata & Actions */}
                    <div className="flex items-center justify-between pt-1 text-[11px] text-slate-500">
                      <div className="flex items-center gap-3 text-slate-400">
                        <div className="flex items-center gap-1.5">
                          <Building2 className="w-3.5 h-3.5 text-emerald-400" />
                          <span>Şube: {receiptBranch}</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                          <span>Şifreli Kayıt ID: {receipt.id}</span>
                        </div>
                      </div>

                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          if (confirm(`"${receipt.merchant}" fişini silmek istediğinize emin misiniz?`)) {
                            onDeleteReceipt(receipt.id);
                          }
                        }}
                        className="text-rose-400 hover:text-rose-300 flex items-center gap-1 p-1 hover:bg-rose-500/10 rounded transition"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>Sil</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
