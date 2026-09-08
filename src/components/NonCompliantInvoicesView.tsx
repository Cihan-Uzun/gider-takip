import React, { useState } from 'react';
import {
  AlertOctagon,
  ShieldAlert,
  Building2,
  Calendar,
  FileText,
  CreditCard,
  Trash2,
  ChevronDown,
  ChevronUp,
  Search,
  CheckCircle2,
  AlertTriangle,
  Info,
} from 'lucide-react';
import { Receipt } from '../types';

interface NonCompliantInvoicesViewProps {
  receipts: Receipt[];
  onDeleteReceipt: (id: string) => void;
  onOpenComplianceSettings: () => void;
}

export const NonCompliantInvoicesView: React.FC<NonCompliantInvoicesViewProps> = ({
  receipts,
  onDeleteReceipt,
  onOpenComplianceSettings,
}) => {
  const [selectedBranch, setSelectedBranch] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedId, setExpandedId] = useState<string | null>(null);

  // All rejected receipts
  const rejectedReceipts = receipts.filter(
    (r) => r.isNonCompliant || r.approvalStatus === 'rejected'
  );

  // Unique branches from rejected receipts
  const branches = Array.from(new Set(rejectedReceipts.map((r) => r.branch || 'Karabük Şubesi')));

  // Filtered rejected receipts
  const filtered = rejectedReceipts.filter((r) => {
    const matchesBranch = selectedBranch === 'all' || (r.branch || 'Karabük Şubesi') === selectedBranch;
    const matchesSearch =
      r.merchant.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (r.docNumber && r.docNumber.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (r.complianceReason && r.complianceReason.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (r.nonCompliantItems && r.nonCompliantItems.some((item) => item.toLowerCase().includes(searchTerm.toLowerCase())));
    return matchesBranch && matchesSearch;
  });

  const totalRejectedAmount = filtered.reduce((sum, r) => sum + (Number(r.totalAmount) || 0), 0);

  const toggleExpand = (id: string) => {
    setExpandedId(expandedId === id ? null : id);
  };

  return (
    <div className="space-y-4">
      {/* Top Banner - Rule Explainer */}
      <div className="bg-gradient-to-r from-rose-950/70 to-slate-900 border border-rose-500/40 rounded-2xl p-4 sm:p-5 shadow-lg shadow-rose-950/20">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-rose-500/20 border border-rose-500/40 flex items-center justify-center text-rose-400 shrink-0">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-white">Uygun Olmayan & Reddedilen Faturalar</h2>
                <span className="text-[11px] bg-rose-500/20 text-rose-300 border border-rose-500/40 px-2 py-0.5 rounded-full font-mono font-bold">
                  {rejectedReceipts.length} Belge
                </span>
              </div>
              <p className="text-xs text-rose-200/90 mt-1 max-w-2xl leading-relaxed">
                <strong>Kurumsal Politika Kuralı:</strong> Tekel, alkollü içecek, tütün/sigara veya şirketçe onaylanmayan harcama tespit edildiğinde, 
                <span className="underline decoration-rose-400 font-semibold ml-1">
                  tek bir kalem dahi hatalı olsa faturanın tamamı kurumsal olarak kabul edilmez
                </span>{' '}
                ve bu havuzda karantinaya alınır.
              </p>
            </div>
          </div>

          <button
            onClick={onOpenComplianceSettings}
            className="text-xs font-semibold bg-rose-500/20 hover:bg-rose-500/30 text-rose-200 border border-rose-500/40 px-3.5 py-2 rounded-xl transition whitespace-nowrap"
          >
            Yasaklı Ürünleri Yönet
          </button>
        </div>
      </div>

      {/* KPI Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-slate-900/90 border border-rose-500/20 rounded-xl p-3.5">
          <span className="text-[11px] font-medium text-slate-400 block">Reddedilen Fatura</span>
          <span className="text-lg sm:text-xl font-extrabold text-rose-400 font-mono mt-0.5 block">
            {rejectedReceipts.length} Adet
          </span>
          <span className="text-[10px] text-slate-500 mt-0.5 block">Tüm şubeler toplamı</span>
        </div>

        <div className="bg-slate-900/90 border border-rose-500/20 rounded-xl p-3.5">
          <span className="text-[11px] font-medium text-slate-400 block">Reddedilen Tutar</span>
          <span className="text-lg sm:text-xl font-extrabold text-rose-300 font-mono mt-0.5 block">
            ₺{totalRejectedAmount.toLocaleString('tr-TR', { minimumFractionDigits: 2 })}
          </span>
          <span className="text-[10px] text-slate-500 mt-0.5 block">Kurum bütçesine yansıtılmadı</span>
        </div>

        <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-3.5">
          <span className="text-[11px] font-medium text-slate-400 block">İhlal Görülen Şubeler</span>
          <span className="text-lg sm:text-xl font-extrabold text-amber-400 font-mono mt-0.5 block">
            {branches.length} Şube
          </span>
          <span className="text-[10px] text-slate-500 mt-0.5 block">Karabük ve diğer şubeler</span>
        </div>

        <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-3.5">
          <span className="text-[11px] font-medium text-slate-400 block">Politika Durumu</span>
          <span className="text-xs font-bold text-emerald-400 mt-1 block flex items-center gap-1">
            <CheckCircle2 className="w-3.5 h-3.5" /> %100 Otomatik Denetim
          </span>
          <span className="text-[10px] text-slate-500 mt-0.5 block">Gemini OCR & Kural Motoru</span>
        </div>
      </div>

      {/* Filter & Search Controls */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-3.5 space-y-3">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Firma, ihlal edilen ürün veya fiş no ara..."
              className="w-full bg-slate-800 border border-slate-700/80 rounded-lg pl-9 pr-3 py-1.5 text-xs text-white placeholder-slate-400 focus:outline-none focus:border-rose-500"
            />
          </div>

          {/* Branch Filter Dropdown */}
          <div className="flex items-center gap-2">
            <Building2 className="w-4 h-4 text-slate-400 shrink-0" />
            <select
              value={selectedBranch}
              onChange={(e) => setSelectedBranch(e.target.value)}
              className="bg-slate-800 border border-slate-700 text-xs text-slate-200 rounded-lg px-3 py-1.5 focus:outline-none focus:border-rose-500"
            >
              <option value="all">Tüm Şubeler ({rejectedReceipts.length})</option>
              {branches.map((b) => {
                const count = rejectedReceipts.filter((r) => (r.branch || 'Karabük Şubesi') === b).length;
                return (
                  <option key={b} value={b}>
                    {b} ({count})
                  </option>
                );
              })}
            </select>
          </div>
        </div>
      </div>

      {/* Invoices List */}
      {filtered.length === 0 ? (
        <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-10 text-center space-y-2">
          <div className="w-12 h-12 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <p className="text-sm font-semibold text-slate-200">
            {selectedBranch !== 'all' ? `${selectedBranch} için uygunsuz fatura bulunamadı.` : 'Harika! Uygun olmayan fatura bulunmuyor.'}
          </p>
          <p className="text-xs text-slate-400 max-w-md mx-auto">
            Kurumsal satın alma kurallarına uymayan bir fatura veya fiş tarandığında otomatik olarak burada listelenecektir.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((receipt) => {
            const isExpanded = expandedId === receipt.id;

            return (
              <div
                key={receipt.id}
                className="bg-slate-900 border border-rose-500/40 hover:border-rose-500/70 rounded-xl overflow-hidden shadow-sm transition"
              >
                {/* Header Strip */}
                <div className="bg-rose-500/10 border-b border-rose-500/20 px-3.5 py-1.5 flex items-center justify-between text-[11px]">
                  <div className="flex items-center gap-2">
                    <span className="bg-rose-500 text-white font-bold px-2 py-0.5 rounded text-[10px] uppercase tracking-wider flex items-center gap-1">
                      <AlertOctagon className="w-3 h-3" /> Kurumsal Red
                    </span>
                    <span className="text-rose-300 font-semibold">
                      Tek ürün hatası nedeniyle faturanın tamamı kabul edilmedi
                    </span>
                  </div>

                  <span className="text-slate-400 font-mono text-[10px] flex items-center gap-1">
                    <Building2 className="w-3 h-3 text-amber-400" />
                    <strong>{receipt.branch || 'Karabük Şubesi'}</strong>
                  </span>
                </div>

                {/* Main Card Body */}
                <div
                  onClick={() => toggleExpand(receipt.id)}
                  className="p-3.5 cursor-pointer flex items-center justify-between gap-3 select-none"
                >
                  <div className="flex items-start gap-3 min-w-0">
                    <div className="w-9 h-9 rounded-xl bg-rose-500/15 border border-rose-500/30 flex items-center justify-center text-rose-400 shrink-0 mt-0.5">
                      <FileText className="w-4 h-4" />
                    </div>

                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="text-sm font-bold text-white truncate max-w-[220px] sm:max-w-md">
                          {receipt.merchant}
                        </h3>
                        <span className="text-[10px] bg-slate-800 text-slate-300 px-2 py-0.5 rounded border border-slate-700">
                          {receipt.docType}
                        </span>
                        <span className="text-[10px] bg-slate-800 text-slate-300 px-2 py-0.5 rounded border border-slate-700">
                          {receipt.category}
                        </span>
                      </div>

                      {/* Detected Prohibited Items Badges */}
                      <div className="flex items-center gap-1.5 flex-wrap mt-1.5">
                        <span className="text-[11px] text-rose-400 font-semibold flex items-center gap-1">
                          <AlertTriangle className="w-3 h-3 text-rose-400" />
                          Tespit Edilen Yasaklı Kalem(ler):
                        </span>
                        {(receipt.nonCompliantItems && receipt.nonCompliantItems.length > 0
                          ? receipt.nonCompliantItems
                          : ['Yasaklı Ürün / Tekel']
                        ).map((item, idx) => (
                          <span
                            key={idx}
                            className="bg-rose-500/20 text-rose-300 border border-rose-500/40 text-[10px] font-bold px-2 py-0.5 rounded-full"
                          >
                            {item}
                          </span>
                        ))}
                      </div>

                      <div className="flex items-center gap-3 text-[11px] text-slate-400 mt-1.5">
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3 h-3 text-slate-500" />
                          {receipt.date} {receipt.time || ''}
                        </span>
                        <span className="flex items-center gap-1">
                          <CreditCard className="w-3 h-3 text-slate-500" />
                          {receipt.paymentMethod}
                        </span>
                        {receipt.docNumber && (
                          <span className="text-slate-500 font-mono text-[10px]">
                            #{receipt.docNumber}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Right Side: Rejected Amount */}
                  <div className="text-right shrink-0 flex items-center gap-3">
                    <div>
                      <div className="text-sm sm:text-base font-extrabold text-rose-400 font-mono line-through decoration-rose-600">
                        ₺{Number(receipt.totalAmount).toLocaleString('tr-TR', { minimumFractionDigits: 2 })}
                      </div>
                      <span className="text-[10px] text-rose-400/80 font-semibold block">
                        Kabul Edilmedi (0 ₺ Gider)
                      </span>
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
                  <div className="px-4 pb-4 pt-2 border-t border-rose-500/20 bg-slate-950/60 text-xs space-y-3">
                    {/* Compliance Alert Box */}
                    <div className="p-3 bg-rose-500/10 border border-rose-500/30 rounded-lg text-rose-300 text-xs space-y-1">
                      <div className="font-bold flex items-center gap-1.5 text-rose-200">
                        <Info className="w-4 h-4 text-rose-400" />
                        Gerekçe: {receipt.complianceReason || 'Fatura içeriğinde kurumsal olarak yasaklanmış ürün veya kategori tespit edildi.'}
                      </div>
                      <p className="text-[11px] text-rose-300/80">
                        Bu fatura kurumsal muhasebe raporlarına ve bütçe giderlerine dahil edilmemiştir. Karabük Şubesi ve şirket merkez denetimi için arşivlenmektedir.
                      </p>
                    </div>

                    {/* Items table highlighting the prohibited item */}
                    {receipt.items && receipt.items.length > 0 && (
                      <div>
                        <h4 className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
                          Fatura Kalemleri & İhlal Analizi:
                        </h4>
                        <div className="bg-slate-900 rounded-lg p-2 border border-slate-800 divide-y divide-slate-800">
                          {receipt.items.map((item, idx) => {
                            const isProhibitedItem =
                              item.isProhibited ||
                              (receipt.nonCompliantItems &&
                                receipt.nonCompliantItems.some((bad) =>
                                  item.name.toLowerCase().includes(bad.toLowerCase())
                                ));

                            return (
                              <div
                                key={idx}
                                className={`py-1.5 px-2 rounded flex items-center justify-between text-xs ${
                                  isProhibitedItem ? 'bg-rose-500/15 border border-rose-500/30 text-rose-200' : 'text-slate-300'
                                }`}
                              >
                                <div className="flex items-center gap-2">
                                  {isProhibitedItem ? (
                                    <span className="w-2 h-2 rounded-full bg-rose-500 shrink-0" />
                                  ) : (
                                    <span className="w-2 h-2 rounded-full bg-slate-600 shrink-0" />
                                  )}
                                  <span className={isProhibitedItem ? 'font-bold text-rose-200' : 'font-medium'}>
                                    {item.name}
                                  </span>
                                  {isProhibitedItem && (
                                    <span className="text-[10px] bg-rose-500/30 text-rose-300 border border-rose-500/50 px-1.5 py-0.2 rounded font-bold">
                                      YASAKLI KALEM
                                    </span>
                                  )}
                                  {item.quantity && item.quantity > 1 && (
                                    <span className="text-slate-500 text-[11px] ml-1">
                                      ({item.quantity} adet × ₺{item.unitPrice})
                                    </span>
                                  )}
                                </div>
                                <div className={`font-mono font-semibold ${isProhibitedItem ? 'text-rose-400' : 'text-slate-400'}`}>
                                  ₺{Number(item.totalPrice).toLocaleString('tr-TR', { minimumFractionDigits: 2 })}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {/* Actions */}
                    <div className="flex items-center justify-between pt-2 border-t border-slate-800">
                      <span className="text-[10px] text-slate-500 font-mono">
                        Belge ID: {receipt.id} • Şube: {receipt.branch || 'Karabük Şubesi'}
                      </span>
                      <button
                        onClick={() => onDeleteReceipt(receipt.id)}
                        className="flex items-center gap-1.5 text-[11px] text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 px-2.5 py-1 rounded-lg transition"
                      >
                        <Trash2 className="w-3.5 h-3.5" /> Faturayı Sil
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
