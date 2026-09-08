import React, { useState, useEffect } from 'react';
import {
  ShieldAlert,
  Plus,
  Trash2,
  AlertOctagon,
  CheckCircle2,
  Sparkles,
  Search,
  Sliders,
  HelpCircle,
} from 'lucide-react';
import { DisallowedRule } from '../types';

interface CompliancePolicySettingsViewProps {
  onRulesUpdated?: () => void;
}

export const CompliancePolicySettingsView: React.FC<CompliancePolicySettingsViewProps> = ({
  onRulesUpdated,
}) => {
  const [rules, setRules] = useState<DisallowedRule[]>([]);
  const [loading, setLoading] = useState(true);
  const [newKeyword, setNewKeyword] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Live test input
  const [testInput, setTestInput] = useState('');
  const [testResult, setTestResult] = useState<{ isBlocked: boolean; matchedRule?: string } | null>(null);

  const fetchRules = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/compliance/rules');
      const data = await res.json();
      if (data.success) {
        setRules(data.data || []);
      }
    } catch (e) {
      console.error('Error loading rules:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRules();
  }, []);

  const handleAddRule = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newKeyword.trim()) return;

    setIsSubmitting(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    try {
      const res = await fetch('/api/compliance/rules', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          keyword: newKeyword.trim(),
          description: newDesc.trim() || 'Kurumsal onaylanmayan ürün/hizmet',
        }),
      });
      const data = await res.json();
      if (data.success) {
        setSuccessMsg(`"${newKeyword}" başarıyla yasaklı ürünler listesine eklendi.`);
        setNewKeyword('');
        setNewDesc('');
        await fetchRules();
        if (onRulesUpdated) onRulesUpdated();
      } else {
        setErrorMsg(data.error || 'Kural eklenemedi');
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Hata oluştu');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteRule = async (id: string, keyword: string) => {
    if (!confirm(`"${keyword}" kuralını silmek istediğinize emin misiniz?`)) return;

    try {
      const res = await fetch(`/api/compliance/rules/${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.success) {
        setSuccessMsg(`"${keyword}" kuralı kaldırıldı.`);
        await fetchRules();
        if (onRulesUpdated) onRulesUpdated();
      }
    } catch (err) {
      console.error('Kural silinemedi:', err);
    }
  };

  // Quick preset keyword adder
  const addPresetKeyword = (kw: string, desc: string) => {
    setNewKeyword(kw);
    setNewDesc(desc);
  };

  // Run instant live compliance test on user keystroke
  useEffect(() => {
    if (!testInput.trim()) {
      setTestResult(null);
      return;
    }
    const lower = testInput.toLowerCase();
    const matched = rules.find((r) => lower.includes(r.keyword.toLowerCase()));
    if (matched) {
      setTestResult({ isBlocked: true, matchedRule: matched.keyword });
    } else {
      setTestResult({ isBlocked: false });
    }
  }, [testInput, rules]);

  return (
    <div className="space-y-4">
      {/* Top Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-5">
        <div className="flex items-start gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-rose-500/15 border border-rose-500/30 flex items-center justify-center text-rose-400 shrink-0 mt-0.5">
            <AlertOctagon className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-bold text-white">Yasaklı & Kabul Edilmeyecek Ürünler Yönetimi</h2>
              <span className="text-[11px] bg-rose-500/20 text-rose-300 border border-rose-500/40 px-2 py-0.5 rounded-full font-mono font-bold">
                {rules.length} Kural Aktif
              </span>
            </div>
            <p className="text-xs text-slate-300 mt-1 max-w-2xl leading-relaxed">
              Tüm Türkiye şubelerinde geçerli olmak üzere; burada tanımlanan ürün veya anahtar kelimelerden{' '}
              <strong className="text-rose-400">tek bir kalem dahi bir faturada geçerse</strong>, Gemini OCR motoru faturanın tamamını otomatik olarak kurumsal redde düşürür ve 'Uygun Olmayan Faturalar' havuzuna kaydeder.
            </p>
          </div>
        </div>
      </div>

      {/* Add New Rule Form */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-3">
        <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
          <Plus className="w-4 h-4 text-emerald-400" />
          Yeni Yasaklı Ürün / Kategori Girişi
        </h3>

        {errorMsg && (
          <div className="p-2.5 bg-rose-500/10 border border-rose-500/30 rounded-lg text-rose-300 text-xs">
            {errorMsg}
          </div>
        )}

        {successMsg && (
          <div className="p-2.5 bg-emerald-500/10 border border-emerald-500/30 rounded-lg text-emerald-300 text-xs flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4" />
            <span>{successMsg}</span>
          </div>
        )}

        <form onSubmit={handleAddRule} className="space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            <div>
              <label className="block text-slate-300 font-medium mb-1">Yasaklı Ürün / Kelime (Keyword) *</label>
              <input
                type="text"
                value={newKeyword}
                onChange={(e) => setNewKeyword(e.target.value)}
                placeholder="Örn: Tekel, Alkol, Bira, Puro, Bahis, Sayısal Loto..."
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white placeholder-slate-500 focus:outline-none focus:border-rose-500"
                required
              />
            </div>

            <div>
              <label className="block text-slate-300 font-medium mb-1">Açıklama / Şirket Gerekçesi</label>
              <input
                type="text"
                value={newDesc}
                onChange={(e) => setNewDesc(e.target.value)}
                placeholder="Örn: Kurumsal gider politikası gereği tütün/alkol kabul edilmez"
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white placeholder-slate-500 focus:outline-none focus:border-rose-500"
              />
            </div>
          </div>

          {/* Preset Chips */}
          <div className="flex items-center gap-1.5 flex-wrap pt-1">
            <span className="text-[11px] text-slate-400 font-medium mr-1">Hızlı Öneriler:</span>
            {[
              { kw: 'Tekel', desc: 'Tekel bayii harcamaları' },
              { kw: 'Alkol', desc: 'Alkollü içecekler' },
              { kw: 'Bira', desc: 'Bira ve mayalı içecekler' },
              { kw: 'Şarap', desc: 'Şarap ve likör' },
              { kw: 'Rakı', desc: 'Yüksek alkollü içecekler' },
              { kw: 'Viski', desc: 'Distile alkollü içecekler' },
              { kw: 'Sigara', desc: 'Tütün mamulleri' },
              { kw: 'Tütün', desc: 'Nargile ve tütün ürünleri' },
              { kw: 'Puro', desc: 'Tütün ürünleri' },
              { kw: 'Piyango', desc: 'Milli piyango ve şans oyunları' },
              { kw: 'İddaa', desc: 'Bahis ve kumar harcamaları' },
              { kw: 'Bahis', desc: 'Bahis oyunları' },
            ].map((preset) => (
              <button
                key={preset.kw}
                type="button"
                onClick={() => addPresetKeyword(preset.kw, preset.desc)}
                className="text-[10px] bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 px-2 py-1 rounded-md transition"
              >
                + {preset.kw}
              </button>
            ))}
          </div>

          <div className="flex justify-end pt-1">
            <button
              type="submit"
              disabled={isSubmitting || !newKeyword.trim()}
              className="bg-rose-500 hover:bg-rose-600 disabled:opacity-50 text-white font-bold text-xs px-4 py-2 rounded-xl transition flex items-center gap-1.5"
            >
              <Plus className="w-4 h-4" />
              <span>Yasaklı Kuralı Kaydet</span>
            </button>
          </div>
        </form>
      </div>

      {/* Live Compliance Simulator / Test Box */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-2">
        <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-amber-400" />
          Canlı Kural Testi & Simülatörü
        </h3>
        <p className="text-[11px] text-slate-400">
          Bir fiş metni veya ürün adı yazarak kural motorunun bunu engelleyip engellemeyeceğini anında deneyin:
        </p>

        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            value={testInput}
            onChange={(e) => setTestInput(e.target.value)}
            placeholder="Örn: Karabük Tekel Büfe, Efes Malt, Ofis Kağıdı, Marlboro..."
            className="w-full bg-slate-800 border border-slate-700 rounded-lg pl-9 pr-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500"
          />
        </div>

        {testResult && (
          <div
            className={`p-3 rounded-xl border text-xs flex items-center gap-2.5 ${
              testResult.isBlocked
                ? 'bg-rose-500/15 border-rose-500/40 text-rose-200'
                : 'bg-emerald-500/15 border-emerald-500/40 text-emerald-200'
            }`}
          >
            {testResult.isBlocked ? (
              <>
                <AlertOctagon className="w-5 h-5 text-rose-400 shrink-0" />
                <div>
                  <span className="font-bold block">FATURA TAMAMEN REDDEDİLİR!</span>
                  <span>
                    "{testResult.matchedRule}" yasaklı kuralı tetiklendi. Tek bir ürün hatalı olduğunda bile tüm fatura 'Uygun Olmayan Faturalar' havuzuna düşer.
                  </span>
                </div>
              </>
            ) : (
              <>
                <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
                <div>
                  <span className="font-bold block">UYGUN / GEÇERLİ HARCAMA</span>
                  <span>Girilen metinde kurumsal yasaklı ürün kuralına takılan hiçbir kelime bulunamadı.</span>
                </div>
              </>
            )}
          </div>
        )}
      </div>

      {/* Active Rules List */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-bold text-white uppercase tracking-wider">
            Yürürlükteki Kurumsal Yasaklı Kelimeler ({rules.length})
          </h3>
          <span className="text-[11px] text-slate-400 font-mono">Tüm Şubeler İçin Aktif</span>
        </div>

        {loading ? (
          <div className="py-8 text-center text-xs text-slate-400">Kurallar yükleniyor...</div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5">
            {rules.map((rule) => (
              <div
                key={rule.id}
                className="bg-slate-950/70 border border-rose-500/20 hover:border-rose-500/50 rounded-xl p-3 flex items-start justify-between gap-2 transition"
              >
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-rose-500" />
                    <span className="text-xs font-bold text-white">{rule.keyword}</span>
                  </div>
                  {rule.description && (
                    <p className="text-[11px] text-slate-400 mt-1 leading-snug">
                      {rule.description}
                    </p>
                  )}
                  <span className="text-[10px] text-slate-500 font-mono mt-1 block">
                    Eklenme: {rule.addedAt?.split('T')[0] || 'Sistem Tanımlı'}
                  </span>
                </div>

                <button
                  type="button"
                  onClick={() => handleDeleteRule(rule.id, rule.keyword)}
                  className="text-slate-500 hover:text-rose-400 p-1 transition"
                  title="Kuralı Sil"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
