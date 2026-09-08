import React, { useState } from 'react';
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
} from 'lucide-react';
import { Receipt, ExpenseCategory, DocumentType } from '../types';

interface ReceiptsListProps {
  receipts: Receipt[];
  onDeleteReceipt: (id: string) => void;
  onOpenScanner: () => void;
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
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('Tümü');
  const [selectedDocType, setSelectedDocType] = useState<string>('Tümü');
  const [expandedId, setExpandedId] = useState<string | null>(null);

  // Categories list for filter
  const categories = ['Tümü', ...Array.from(new Set(receipts.map((r) => r.category)))];
  const docTypes = ['Tümü', 'Fiş', 'Fatura', 'E-Fatura', 'Makbuz'];

  // Filtered receipts
  const filtered = receipts.filter((r) => {
    const matchesSearch =
      r.merchant.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (r.docNumber && r.docNumber.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (r.notes && r.notes.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesCategory = selectedCategory === 'Tümü' || r.category === selectedCategory;
    const matchesDocType = selectedDocType === 'Tümü' || r.docType === selectedDocType;

    return matchesSearch && matchesCategory && matchesDocType;
  });

  const totalFilteredAmount = filtered.reduce((acc, r) => acc + (Number(r.totalAmount) || 0), 0);

  const toggleExpand = (id: string) => {
    setExpandedId(expandedId === id ? null : id);
  };

  return (
    <div className="space-y-4">
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
              placeholder="Firma, fiş no veya ürün ara..."
              className="w-full bg-slate-800/80 border border-slate-700/80 rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder-slate-400 focus:outline-none focus:border-emerald-500"
            />
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
          Toplam <span className="text-white font-semibold">{filtered.length}</span> fiş / fatura
        </div>
        <div>
          Filtrelenen Toplam:{' '}
          <span className="text-emerald-400 font-bold text-sm">
            ₺{totalFilteredAmount.toLocaleString('tr-TR', { minimumFractionDigits: 2 })}
          </span>
        </div>
      </div>

      {/* Receipts Cards List */}
      {filtered.length === 0 ? (
        <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-10 text-center space-y-3">
          <div className="w-12 h-12 rounded-full bg-slate-800 text-slate-500 flex items-center justify-center mx-auto">
            <FileText className="w-6 h-6" />
          </div>
          <p className="text-sm font-semibold text-slate-300">Henüz Fiş veya Fatura Bulunmuyor</p>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            Kamera ile fiş çekerek veya dosya yükleyerek OCR ile otomatik veri girişi yapabilirsiniz.
          </p>
          <button
            onClick={onOpenScanner}
            className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-950 bg-emerald-400 hover:bg-emerald-300 px-4 py-2 rounded-xl transition"
          >
            <ReceiptIcon className="w-4 h-4" />
            İlk Fişi Tara
          </button>
        </div>
      ) : (
        <div className="space-y-2.5">
          {filtered.map((receipt) => {
            const isExpanded = expandedId === receipt.id;
            const categoryStyle =
              CATEGORY_COLORS[receipt.category] || 'bg-slate-500/10 text-slate-400 border-slate-500/20';

            return (
              <div
                key={receipt.id}
                className={`bg-slate-900 border transition rounded-xl overflow-hidden ${
                  receipt.isUnusualExpense
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
                    <div className="w-9 h-9 rounded-xl bg-slate-800 border border-slate-700/80 flex items-center justify-center text-slate-300 shrink-0 mt-0.5">
                      <ReceiptIcon className="w-4 h-4 text-emerald-400" />
                    </div>

                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="text-sm font-semibold text-white truncate max-w-[200px] sm:max-w-md">
                          {receipt.merchant}
                        </h3>
                        <span className={`text-[10px] font-medium border px-2 py-0.5 rounded-full ${categoryStyle}`}>
                          {receipt.category}
                        </span>
                        <span className="text-[10px] bg-slate-800 text-slate-400 px-1.5 py-0.5 rounded">
                          {receipt.docType}
                        </span>
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

                      {/* Unusual Expense Alert Pill */}
                      {receipt.isUnusualExpense && (
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
                      <div className="text-sm sm:text-base font-bold text-white font-mono">
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
                              <div className="text-slate-300 font-medium">
                                {item.name}
                                {item.quantity && item.quantity > 1 && (
                                  <span className="text-slate-500 text-[11px] ml-1.5 font-normal">
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
                      <div className="flex items-center gap-1.5 text-slate-400">
                        <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                        <span>Şifreli Kayıt ID: {receipt.id}</span>
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
