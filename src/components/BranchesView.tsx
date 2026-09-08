import React, { useState, useEffect } from 'react';
import {
  Building2,
  Plus,
  TrendingUp,
  AlertTriangle,
  Receipt as ReceiptIcon,
  ShieldAlert,
  MapPin,
  UserCheck,
  CheckCircle2,
  Search,
  FileSpreadsheet,
  HelpCircle,
  ArrowRight,
} from 'lucide-react';
import { BranchInfo, Receipt } from '../types';

interface BranchesViewProps {
  receipts: Receipt[];
  onSelectBranchFilter: (branchName: string) => void;
  onOpenScannerForBranch: (branchName: string) => void;
  onNavigateToReview?: () => void;
}

export const BranchesView: React.FC<BranchesViewProps> = ({
  receipts,
  onSelectBranchFilter,
  onOpenScannerForBranch,
  onNavigateToReview,
}) => {
  const [branches, setBranches] = useState<BranchInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  // New Branch Form
  const [newName, setNewName] = useState('');
  const [newCity, setNewCity] = useState('');
  const [newCode, setNewCode] = useState('');
  const [newManager, setNewManager] = useState('');
  const [newAddress, setNewAddress] = useState('');
  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const fetchBranches = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/branches');
      const data = await res.json();
      if (data.success) {
        setBranches(data.data || []);
      }
    } catch (e) {
      console.error('Error fetching branches:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBranches();
  }, [receipts]);

  // Aggregate stats per branch dynamically from receipts list
  const branchStats = branches.map((b) => {
    const branchReceipts = receipts.filter(
      (r) => (r.branch || '').toLowerCase() === b.name.toLowerCase()
    );
    const approvedReceipts = branchReceipts.filter((r) => !r.isNonCompliant);
    const nonCompliantReceipts = branchReceipts.filter((r) => r.isNonCompliant);

    const totalSpending = approvedReceipts.reduce((acc, r) => acc + (Number(r.totalAmount) || 0), 0);
    const rejectedSpending = nonCompliantReceipts.reduce((acc, r) => acc + (Number(r.totalAmount) || 0), 0);

    return {
      ...b,
      totalSpending,
      rejectedSpending,
      receiptCount: branchReceipts.length,
      approvedCount: approvedReceipts.length,
      nonCompliantCount: nonCompliantReceipts.length,
    };
  });

  // Filtered branches
  const filteredBranches = branchStats.filter(
    (b) =>
      b.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      b.city.toLowerCase().includes(searchTerm.toLowerCase()) ||
      b.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (b.manager && b.manager.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const totalAllSpending = branchStats.reduce((sum, b) => sum + b.totalSpending, 0);
  const totalAllReceipts = receipts.length;
  const totalAllRejected = receipts.filter((r) => r.isNonCompliant).length;

  const handleAddBranch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim() || !newCity.trim()) {
      setErrorMsg('Lütfen en az Şube Adı ve Şehir bilgilerini doldurunuz.');
      return;
    }

    setSaving(true);
    setErrorMsg(null);
    try {
      const res = await fetch('/api/branches', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newName.trim(),
          city: newCity.trim(),
          code: newCode.trim() || undefined,
          manager: newManager.trim() || undefined,
          address: newAddress.trim() || undefined,
        }),
      });
      const data = await res.json();
      if (data.success) {
        await fetchBranches();
        setIsAddModalOpen(false);
        setNewName('');
        setNewCity('');
        setNewCode('');
        setNewManager('');
        setNewAddress('');
      } else {
        setErrorMsg(data.error || 'Şube eklenemedi');
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Hata oluştu');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Header Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-5">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shrink-0">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-white">Türkiye Geneli Şube & Gider Takibi</h2>
                <span className="text-[11px] bg-slate-800 text-slate-300 border border-slate-700 px-2 py-0.5 rounded-full font-mono">
                  {branches.length} Aktif Şube
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Karabük Şubesi başta olmak üzere tüm şubelerin faturaları, onaylanan giderleri ve reddedilen uygunsuz harcamaları
              </p>
            </div>
          </div>

          <button
            onClick={() => setIsAddModalOpen(true)}
            className="flex items-center gap-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs px-4 py-2 rounded-xl transition shadow-md shadow-emerald-500/20 whitespace-nowrap"
          >
            <Plus className="w-4 h-4" />
            <span>Yeni Şube Ekle</span>
          </button>
        </div>

        {/* Aggregate KPI Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4 pt-4 border-t border-slate-800">
          <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-800/80">
            <span className="text-[11px] text-slate-400 block">Şubelerin Toplam Harcaması</span>
            <span className="text-lg font-extrabold text-emerald-400 font-mono mt-0.5 block">
              ₺{totalAllSpending.toLocaleString('tr-TR', { minimumFractionDigits: 2 })}
            </span>
            <span className="text-[10px] text-slate-500">Onaylanan net gider</span>
          </div>

          <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-800/80">
            <span className="text-[11px] text-slate-400 block">İşlenen Fiş / Fatura</span>
            <span className="text-lg font-extrabold text-white font-mono mt-0.5 block">
              {totalAllReceipts} Adet
            </span>
            <span className="text-[10px] text-slate-500">OCR ile taranan tüm belgeler</span>
          </div>

          <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-800/80">
            <span className="text-[11px] text-slate-400 block">Reddedilen / Uygunsuz</span>
            <span className="text-lg font-extrabold text-rose-400 font-mono mt-0.5 block">
              {totalAllRejected} Fatura
            </span>
            <span className="text-[10px] text-rose-400/70">Tekel/alkol kural ihlali</span>
          </div>

          <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-800/80">
            <span className="text-[11px] text-slate-400 block">Öne Çıkan Şube</span>
            <span className="text-sm font-bold text-amber-300 mt-1 block truncate">
              {branchStats.sort((a, b) => b.totalSpending - a.totalSpending)[0]?.name || 'Karabük Şubesi'}
            </span>
            <span className="text-[10px] text-slate-500">En yüksek işlem hacmi</span>
          </div>
        </div>
      </div>

      {/* Unassigned Receipts Banner */}
      {(() => {
        const unassignedReceipts = receipts.filter(
          (r) => r.needsReview || !r.branch || r.branch === 'Belirtilmemiş' || r.branch === 'Şube Belirtilmemiş'
        );
        const unassignedTotal = unassignedReceipts.reduce((sum, r) => sum + (r.totalAmount || 0), 0);

        if (unassignedReceipts.length === 0 || !onNavigateToReview) return null;

        return (
          <div className="bg-gradient-to-r from-amber-950/40 via-slate-900 to-slate-900 border border-amber-500/40 rounded-2xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-md shadow-amber-950/20">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center shrink-0 border border-amber-500/30">
                <HelpCircle className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h4 className="text-sm font-bold text-white">Şube Ataması Bekleyen Belgeler</h4>
                  <span className="text-xs font-semibold bg-amber-500/20 text-amber-300 border border-amber-500/40 px-2 py-0.5 rounded-full">
                    {unassignedReceipts.length} Belge (₺{unassignedTotal.toLocaleString('tr-TR', { minimumFractionDigits: 2 })})
                  </span>
                </div>
                <p className="text-xs text-slate-400 mt-0.5">
                  Belgelerinde şube adı tespit edilemeyen harcamalar 'Kontrol Edilecekler' havuzunda tutuluyor.
                </p>
              </div>
            </div>
            <button
              onClick={onNavigateToReview}
              className="px-3.5 py-2 bg-amber-600 hover:bg-amber-500 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 shrink-0 shadow-sm"
            >
              <span>Kontrol Edilecekleri Aç</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        );
      })()}

      {/* Search Bar */}
      <div className="flex items-center gap-3 bg-slate-900 border border-slate-800 rounded-xl p-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Şube adı, şehir veya şube kodu ile ara..."
            className="w-full bg-slate-800 border border-slate-700/80 rounded-lg pl-9 pr-3 py-1.5 text-xs text-white placeholder-slate-400 focus:outline-none focus:border-emerald-500"
          />
        </div>
        <span className="text-xs text-slate-400 whitespace-nowrap">
          {filteredBranches.length} şube listeleniyor
        </span>
      </div>

      {/* Branches Grid */}
      {loading ? (
        <div className="py-12 text-center text-slate-400 text-xs">
          Şube bilgileri yükleniyor...
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
          {filteredBranches.map((branch) => {
            const isKarabuk = branch.name.toLowerCase().includes('karabük');

            return (
              <div
                key={branch.id}
                className={`bg-slate-900 border rounded-2xl p-4 transition space-y-3 ${
                  isKarabuk
                    ? 'border-emerald-500/50 shadow-md shadow-emerald-950/20 bg-gradient-to-br from-slate-900 to-emerald-950/20'
                    : 'border-slate-800 hover:border-slate-700'
                }`}
              >
                {/* Branch Header */}
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2.5">
                    <div
                      className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold text-xs ${
                        isKarabuk
                          ? 'bg-emerald-500 text-slate-950'
                          : 'bg-slate-800 border border-slate-700 text-slate-200'
                      }`}
                    >
                      <Building2 className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="text-sm font-bold text-white">{branch.name}</h3>
                        {isKarabuk && (
                          <span className="bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-[10px] font-bold px-1.5 py-0.2 rounded">
                            ANA ŞUBE
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2 text-[11px] text-slate-400 mt-0.5">
                        <span className="flex items-center gap-1">
                          <MapPin className="w-3 h-3 text-slate-500" />
                          {branch.city}
                        </span>
                        <span className="font-mono text-slate-500">#{branch.code}</span>
                      </div>
                    </div>
                  </div>

                  {branch.nonCompliantCount > 0 && (
                    <span className="bg-rose-500/15 border border-rose-500/30 text-rose-300 text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
                      <ShieldAlert className="w-3 h-3 text-rose-400" />
                      {branch.nonCompliantCount} Uygunsuz
                    </span>
                  )}
                </div>

                {/* Spending Numbers */}
                <div className="grid grid-cols-2 gap-2 bg-slate-950/50 p-2.5 rounded-xl border border-slate-800/80 text-xs">
                  <div>
                    <span className="text-[10px] text-slate-400 block">Onaylanan Net Gider</span>
                    <span className="text-sm font-extrabold text-emerald-400 font-mono block mt-0.5">
                      ₺{branch.totalSpending.toLocaleString('tr-TR', { minimumFractionDigits: 2 })}
                    </span>
                    <span className="text-[10px] text-slate-500">{branch.approvedCount} Onaylı Fatura</span>
                  </div>

                  <div>
                    <span className="text-[10px] text-slate-400 block">Kabul Edilmeyen</span>
                    <span className="text-sm font-extrabold text-rose-400 font-mono block mt-0.5">
                      ₺{branch.rejectedSpending.toLocaleString('tr-TR', { minimumFractionDigits: 2 })}
                    </span>
                    <span className="text-[10px] text-rose-400/80 font-medium">
                      {branch.nonCompliantCount > 0 ? `${branch.nonCompliantCount} Reddedildi` : 'Sıfır İhlal'}
                    </span>
                  </div>
                </div>

                {/* Manager / Address footer */}
                <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1">
                  <div className="flex items-center gap-1.5 truncate max-w-[200px]">
                    <UserCheck className="w-3.5 h-3.5 text-slate-500" />
                    <span>Sorumlu: <strong className="text-slate-300">{branch.manager || 'Atanmadı'}</strong></span>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => onSelectBranchFilter(branch.name)}
                      className="bg-slate-800 hover:bg-slate-700 text-slate-200 text-[11px] font-semibold px-2.5 py-1 rounded-lg border border-slate-700 transition flex items-center gap-1"
                    >
                      <ReceiptIcon className="w-3 h-3 text-emerald-400" />
                      <span>Faturaları Gör ({branch.receiptCount})</span>
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Add Branch Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Building2 className="w-5 h-5 text-emerald-400" />
                <h3 className="font-bold text-sm text-white">Yeni Şube Kaydı</h3>
              </div>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="text-slate-400 hover:text-white text-xs"
              >
                Kapat
              </button>
            </div>

            {errorMsg && (
              <div className="p-2.5 bg-rose-500/10 border border-rose-500/30 rounded-lg text-rose-300 text-xs flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            <form onSubmit={handleAddBranch} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-300 font-medium mb-1">Şube Adı *</label>
                <input
                  type="text"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="Örn: Karabük Şubesi, Adana Seyhan Şubesi..."
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-slate-300 font-medium mb-1">Şehir *</label>
                  <input
                    type="text"
                    value={newCity}
                    onChange={(e) => setNewCity(e.target.value)}
                    placeholder="Örn: Karabük, İstanbul"
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-medium mb-1">Şube Kodu</label>
                  <input
                    type="text"
                    value={newCode}
                    onChange={(e) => setNewCode(e.target.value)}
                    placeholder="Örn: KBK-01"
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-medium mb-1">Şube Müdürü / Sorumlusu</label>
                <input
                  type="text"
                  value={newManager}
                  onChange={(e) => setNewManager(e.target.value)}
                  placeholder="Örn: Ahmet Yılmaz"
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-medium mb-1">Adres / Lokasyon</label>
                <textarea
                  rows={2}
                  value={newAddress}
                  onChange={(e) => setNewAddress(e.target.value)}
                  placeholder="Şube açık adresi..."
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-3 py-1.5 rounded-lg text-slate-400 hover:text-white bg-slate-800"
                >
                  İptal
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-4 py-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold"
                >
                  {saving ? 'Kaydediliyor...' : 'Şubeyi Kaydet'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
