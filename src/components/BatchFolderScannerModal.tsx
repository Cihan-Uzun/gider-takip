import React, { useState, useRef } from 'react';
import {
  FolderOpen,
  X,
  FileText,
  Image as ImageIcon,
  Upload,
  CheckCircle2,
  AlertOctagon,
  HelpCircle,
  Loader2,
  Building2,
  Sparkles,
  ArrowRight,
  RefreshCw,
  FolderCheck,
  Eye,
} from 'lucide-react';
import { BranchInfo, DocumentType, ExpenseCategory, PaymentMethod, Receipt, ReceiptAttachment } from '../types';

interface BatchFolderScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  branches: BranchInfo[];
  onBatchSaveSuccess: () => Promise<void>;
  onOpenAttachment?: (receipt: Receipt) => void;
}

interface ScannedItem {
  id: string;
  file: File | null;
  fileName: string;
  fileType: string;
  fileSize: number;
  fileData: string;
  status: 'pending' | 'scanning' | 'success' | 'error';
  errorMessage?: string;
  extractedReceipt?: Partial<Receipt>;
}

export const BatchFolderScannerModal: React.FC<BatchFolderScannerModalProps> = ({
  isOpen,
  onClose,
  branches,
  onBatchSaveSuccess,
  onOpenAttachment,
}) => {
  const folderInputRef = useRef<HTMLInputElement>(null);
  const multiFileInputRef = useRef<HTMLInputElement>(null);

  const [folderName, setFolderName] = useState<string>('');
  const [items, setItems] = useState<ScannedItem[]>([]);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const [selectedDefaultBranch, setSelectedDefaultBranch] = useState<string>('auto');
  const [isSavingAll, setIsSavingAll] = useState<boolean>(false);
  const [saveReport, setSaveReport] = useState<{
    total: number;
    approved: number;
    needsReview: number;
    rejected: number;
  } | null>(null);

  if (!isOpen) return null;

  // Read file as Data URL
  const readFileAsDataUrl = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  // Handle files selected from folder input or multi-file input
  const handleFilesSelected = async (fileList: FileList | null, detectedFolder?: string) => {
    if (!fileList || fileList.length === 0) return;

    const validExtensions = ['.pdf', '.jpg', '.jpeg', '.png', '.webp', '.bmp', '.tiff'];
    const filteredFiles = Array.from(fileList).filter((file) => {
      const name = file.name.toLowerCase();
      return validExtensions.some((ext) => name.endsWith(ext)) || file.type.startsWith('image/') || file.type === 'application/pdf';
    });

    if (filteredFiles.length === 0) {
      alert('Seçilen klasörde desteklenen formatta (PDF, JPG, PNG) fatura veya fiş belgesi bulunamadı.');
      return;
    }

    // Determine folder name from webkitRelativePath or custom folder
    let inferredFolderName = detectedFolder || 'Seçilen Klasör';
    if (filteredFiles[0]?.webkitRelativePath) {
      const parts = filteredFiles[0].webkitRelativePath.split('/');
      if (parts.length > 1) {
        inferredFolderName = parts[0];
      }
    }
    setFolderName(inferredFolderName);
    setSaveReport(null);

    const initialItems: ScannedItem[] = await Promise.all(
      filteredFiles.map(async (file, idx) => {
        const fileData = await readFileAsDataUrl(file);
        return {
          id: `folder-item-${Date.now()}-${idx}`,
          file,
          fileName: file.name,
          fileType: file.type || (file.name.endsWith('.pdf') ? 'application/pdf' : 'image/jpeg'),
          fileSize: file.size,
          fileData,
          status: 'pending',
        };
      })
    );

    setItems(initialItems);
  };

  // Load sample folder with 4 mock documents for immediate 1-click test
  const handleLoadSampleFolder = () => {
    setFolderName('Eylül_2026_Masraf_Klasörü');
    setSaveReport(null);

    const today = new Date().toISOString().split('T')[0];

    // Create realistic sample documents (SVG data URLs representing real invoices & receipts)
    const createSampleVoucherDataUrl = (title: string, branch: string, amount: string, isPdf = false) => {
      const svg = `
        <svg xmlns="http://www.w3.org/2000/svg" width="600" height="800" viewBox="0 0 600 800" style="background:#ffffff; font-family: sans-serif;">
          <rect width="600" height="800" fill="#ffffff"/>
          <rect x="20" y="20" width="560" height="760" fill="none" stroke="#e2e8f0" stroke-width="2" rx="12"/>
          <rect x="20" y="20" width="560" height="80" fill="${isPdf ? '#991b1b' : '#047857'}" rx="12"/>
          <text x="50" y="70" font-size="24" font-weight="bold" fill="#ffffff">${title}</text>
          <text x="500" y="70" font-size="16" font-weight="bold" fill="#ffffff">${isPdf ? 'E-FATURA' : 'PERAKENDE FİŞ'}</text>
          <text x="50" y="140" font-size="16" fill="#334155" font-weight="bold">Şube: ${branch || 'Belirtilmemiş (Merkez Depo)'}</text>
          <text x="50" y="170" font-size="14" fill="#64748b">Tarih: ${today} 14:30</text>
          <text x="50" y="200" font-size="14" fill="#64748b">Belge No: EF-2026-${Math.floor(100000 + Math.random() * 900000)}</text>
          <line x1="50" y1="230" x2="550" y2="230" stroke="#cbd5e1" stroke-width="1.5" stroke-dasharray="4"/>
          <text x="50" y="280" font-size="18" font-weight="bold" fill="#0f172a">1. Kurumsal Harcama ve Tüketim Hizmeti</text>
          <text x="480" y="280" font-size="18" font-weight="bold" fill="#0f172a">${amount} ₺</text>
          <line x1="50" y1="620" x2="550" y2="620" stroke="#cbd5e1" stroke-width="2"/>
          <text x="50" y="670" font-size="22" font-weight="bold" fill="#0f172a">GENEL TOPLAM:</text>
          <text x="420" y="670" font-size="24" font-weight="black" fill="${isPdf ? '#991b1b' : '#047857'}">${amount} ₺</text>
          <text x="50" y="740" font-size="12" fill="#94a3b8">Bu belge mali mühür ile onaylanmış elektronik arşiv suretidir.</text>
        </svg>
      `;
      return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
    };

    const sampleFiles: ScannedItem[] = [
      {
        id: 'sample-doc-1',
        file: null,
        fileName: 'Karabuk_Subesi_Shell_Yakit_Fisi.pdf',
        fileType: 'application/pdf',
        fileSize: 245000,
        fileData: createSampleVoucherDataUrl('Shell & Turcas Petrol A.Ş.', 'Karabük Şubesi', '2.350,00', true),
        status: 'pending',
      },
      {
        id: 'sample-doc-2',
        file: null,
        fileName: 'Subesiz_Migros_Ofis_Mutfak.jpg',
        fileType: 'image/jpeg',
        fileSize: 184000,
        fileData: createSampleVoucherDataUrl('Migros Ticaret A.Ş.', '', '1.120,00', false),
        status: 'pending',
      },
      {
        id: 'sample-doc-3',
        file: null,
        fileName: 'Turkcell_Kurumsal_Fiber_E-Fatura.pdf',
        fileType: 'application/pdf',
        fileSize: 312000,
        fileData: createSampleVoucherDataUrl('Turkcell İletişim Hizmetleri A.Ş.', 'Karabük Şubesi', '640,00', true),
        status: 'pending',
      },
      {
        id: 'sample-doc-4',
        file: null,
        fileName: 'Karabuk_Tekel_Bira_Tütün_Fisi.jpg',
        fileType: 'image/jpeg',
        fileSize: 156000,
        fileData: createSampleVoucherDataUrl('Karabük Tekel & Büfe Şarküteri', 'Karabük Şubesi', '760,00', false),
        status: 'pending',
      },
    ];

    setItems(sampleFiles);
  };

  // Run OCR scanning on all loaded items
  const handleStartBatchScan = async () => {
    if (items.length === 0) return;
    setIsProcessing(true);
    setCurrentIndex(0);

    const updatedList = [...items];

    for (let i = 0; i < updatedList.length; i++) {
      setCurrentIndex(i + 1);
      const current = updatedList[i];

      // Mark as scanning
      current.status = 'scanning';
      setItems([...updatedList]);

      try {
        const response = await fetch('/api/receipts/ocr', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            imageBase64: current.fileData,
            mimeType: current.fileType,
            fileName: current.fileName,
          }),
        });

        const data = await response.json();
        if (!data.success) {
          throw new Error(data.error || 'OCR okunamadı');
        }

        const ocrData = data.data;

        // Apply default branch if selected and OCR didn't detect one
        let finalBranch = ocrData.branch || '';
        let needsReview = Boolean(ocrData.needsReview);

        if (selectedDefaultBranch !== 'auto' && (!finalBranch || finalBranch.trim() === '')) {
          finalBranch = selectedDefaultBranch;
          needsReview = false;
        }

        const fullReceipt: Partial<Receipt> = {
          ...ocrData,
          branch: finalBranch,
          needsReview: needsReview || !finalBranch || finalBranch.trim() === '',
          imageUrl: current.fileType.startsWith('image/') ? current.fileData : undefined,
          attachment: {
            fileName: current.fileName,
            fileType: current.fileType,
            fileSize: current.fileSize,
            fileData: current.fileData,
            uploadedAt: new Date().toISOString(),
          },
        };

        current.status = 'success';
        current.extractedReceipt = fullReceipt;
      } catch (err: any) {
        current.status = 'error';
        current.errorMessage = err.message || 'Tarama hatası';
      }

      setItems([...updatedList]);
    }

    setIsProcessing(false);
  };

  // Save all successfully extracted receipts in batch via /api/receipts/batch-import
  const handleSaveAllToSystem = async () => {
    const readyItems = items.filter((it) => it.status === 'success' && it.extractedReceipt);
    if (readyItems.length === 0) {
      alert('Sisteme kaydedilecek taranmış evrak bulunmuyor.');
      return;
    }

    setIsSavingAll(true);
    try {
      const receiptsPayload = readyItems.map((it) => it.extractedReceipt);

      const res = await fetch('/api/receipts/batch-import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ receipts: receiptsPayload }),
      });

      const resData = await res.json();
      if (!resData.success) {
        throw new Error(resData.error || 'Toplu kayıt başarısız');
      }

      setSaveReport({
        total: resData.importedCount,
        approved: resData.approvedCount,
        needsReview: resData.needsReviewCount,
        rejected: resData.rejectedCount,
      });

      await onBatchSaveSuccess();
    } catch (error: any) {
      alert('Toplu aktarım hatası: ' + error.message);
    } finally {
      setIsSavingAll(false);
    }
  };

  const completedCount = items.filter((it) => it.status === 'success').length;
  const errorCount = items.filter((it) => it.status === 'error').length;
  const progressPercent = items.length > 0 ? Math.round((currentIndex / items.length) * 100) : 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-950/85 backdrop-blur-md animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-700/80 rounded-2xl w-full max-w-4xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Hidden inputs for folder and multi-file selection */}
        <input
          type="file"
          ref={folderInputRef}
          // @ts-ignore
          webkitdirectory=""
          directory=""
          multiple
          className="hidden"
          onChange={(e) => handleFilesSelected(e.target.files)}
        />
        <input
          type="file"
          ref={multiFileInputRef}
          multiple
          accept=".pdf,image/*"
          className="hidden"
          onChange={(e) => handleFilesSelected(e.target.files)}
        />

        {/* Modal Header */}
        <div className="flex items-center justify-between px-5 sm:px-6 py-4 border-b border-slate-800 bg-slate-950/60">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/15 border border-emerald-500/40 text-emerald-400 flex items-center justify-center shrink-0">
              <FolderOpen className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base sm:text-lg font-bold text-white">
                  Lokal Klasörden Toplu Evrak Tarama
                </h3>
                <span className="text-[10px] bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-2 py-0.5 rounded-full font-bold">
                  PDF & Görsel Destekli
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Bilgisayarınızdan seçeceğiniz klasördeki tüm fiş ve faturalar tek seferde taranır ve ekleriyle sisteme kaydedilir.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-lg transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Action / Selection Bar */}
        <div className="px-5 sm:px-6 py-3 bg-slate-950/40 border-b border-slate-800 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2 flex-wrap">
            <button
              type="button"
              onClick={() => folderInputRef.current?.click()}
              disabled={isProcessing || isSavingAll}
              className="inline-flex items-center gap-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-bold px-3.5 py-2 rounded-xl transition shadow-sm disabled:opacity-50"
            >
              <FolderOpen className="w-4 h-4" />
              <span>Bilgisayarımdan Klasör Seç</span>
            </button>

            <button
              type="button"
              onClick={() => multiFileInputRef.current?.click()}
              disabled={isProcessing || isSavingAll}
              className="inline-flex items-center gap-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-semibold px-3 py-2 rounded-xl transition disabled:opacity-50"
            >
              <Upload className="w-3.5 h-3.5 text-slate-400" />
              <span>Çoklu Dosya Seç</span>
            </button>

            <button
              type="button"
              onClick={handleLoadSampleFolder}
              disabled={isProcessing || isSavingAll}
              className="inline-flex items-center gap-1.5 bg-indigo-500/15 hover:bg-indigo-500/25 border border-indigo-500/40 text-indigo-300 text-xs font-semibold px-3 py-2 rounded-xl transition disabled:opacity-50"
              title="Klasör akışını hemen denemek için 4 adet örnek evrak yükler"
            >
              <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
              <span>🧪 Örnek Klasör Yükle (4 Evrak)</span>
            </button>
          </div>

          {/* Default Branch Config */}
          <div className="flex items-center gap-2 text-xs">
            <span className="text-slate-400 font-medium whitespace-nowrap">Varsayılan Şube:</span>
            <select
              value={selectedDefaultBranch}
              onChange={(e) => setSelectedDefaultBranch(e.target.value)}
              disabled={isProcessing || isSavingAll}
              className="bg-slate-800 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-emerald-500"
            >
              <option value="auto">Otomatik Algıla (Şubesizler Kontrol Havuzuna)</option>
              {branches.map((b) => (
                <option key={b.id} value={b.name}>
                  {b.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Main Content Area */}
        <div className="flex-1 overflow-auto p-5 sm:p-6 space-y-4">
          {/* If No Items Selected Yet */}
          {items.length === 0 ? (
            <div
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => {
                e.preventDefault();
                handleFilesSelected(e.dataTransfer.files, 'Sürüklenen Klasör');
              }}
              className="border-2 border-dashed border-slate-700/80 hover:border-emerald-500/60 rounded-2xl p-10 text-center transition flex flex-col items-center justify-center bg-slate-950/30"
            >
              <div className="w-16 h-16 rounded-2xl bg-slate-800 text-slate-400 flex items-center justify-center mb-3">
                <FolderOpen className="w-8 h-8 text-emerald-400" />
              </div>
              <h4 className="text-base font-semibold text-white">
                Fatura / Fiş Klasörünü Buraya Sürükleyin veya Seçin
              </h4>
              <p className="text-xs text-slate-400 max-w-md mt-1.5">
                Klasörün içindeki tüm <strong>PDF</strong>, <strong>JPG</strong> ve <strong>PNG</strong> evrakları otomatik tespit edilir. Orijinal dosyalar bozulmadan detay ekinde saklanır.
              </p>
              <div className="mt-5 flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => folderInputRef.current?.click()}
                  className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-bold px-4 py-2.5 rounded-xl transition"
                >
                  Klasör Gözat...
                </button>
                <button
                  type="button"
                  onClick={handleLoadSampleFolder}
                  className="bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 text-xs font-semibold px-4 py-2.5 rounded-xl transition"
                >
                  Örnek Klasörü Göster
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Folder Status Summary */}
              <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-3.5 flex items-center justify-between flex-wrap gap-3">
                <div className="flex items-center gap-2.5">
                  <FolderCheck className="w-5 h-5 text-emerald-400" />
                  <div>
                    <div className="text-xs font-bold text-white flex items-center gap-2">
                      <span>📁 {folderName}</span>
                      <span className="text-[10px] bg-slate-800 text-slate-300 px-2 py-0.5 rounded-full font-mono">
                        {items.length} adet evrak
                      </span>
                    </div>
                    <div className="text-[11px] text-slate-400 mt-0.5">
                      {completedCount} tamamlandı • {errorCount} hata • {items.length - completedCount - errorCount} bekliyor
                    </div>
                  </div>
                </div>

                {/* Batch Action Buttons */}
                <div className="flex items-center gap-2">
                  {!saveReport && (
                    <>
                      <button
                        type="button"
                        onClick={handleStartBatchScan}
                        disabled={isProcessing || isSavingAll}
                        className="inline-flex items-center gap-1.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-bold px-3.5 py-2 rounded-xl transition disabled:opacity-50"
                      >
                        {isProcessing ? (
                          <>
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            <span>Taranıyor ({currentIndex}/{items.length})</span>
                          </>
                        ) : (
                          <>
                            <RefreshCw className="w-3.5 h-3.5" />
                            <span>{completedCount > 0 ? 'Tekrar Tara' : 'Klasörü Tara ve Ayrıştır'}</span>
                          </>
                        )}
                      </button>

                      {completedCount > 0 && (
                        <button
                          type="button"
                          onClick={handleSaveAllToSystem}
                          disabled={isSavingAll || isProcessing}
                          className="inline-flex items-center gap-1.5 bg-teal-500 hover:bg-teal-400 text-slate-950 text-xs font-bold px-3.5 py-2 rounded-xl transition disabled:opacity-50 shadow-md"
                        >
                          {isSavingAll ? (
                            <>
                              <Loader2 className="w-3.5 h-3.5 animate-spin" />
                              <span>Kaydediliyor...</span>
                            </>
                          ) : (
                            <>
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              <span>{completedCount} Evrağı Sisteme Kaydet</span>
                            </>
                          )}
                        </button>
                      )}
                    </>
                  )}
                </div>
              </div>

              {/* Progress Bar */}
              {isProcessing && (
                <div className="bg-slate-950 border border-slate-800 rounded-xl p-3 space-y-1.5">
                  <div className="flex justify-between text-xs text-slate-300 font-medium">
                    <span>Yapay Zeka OCR ve Kurumsal Uygunluk Taraması...</span>
                    <span className="font-mono text-emerald-400">
                      {currentIndex} / {items.length} (%{progressPercent})
                    </span>
                  </div>
                  <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-emerald-500 transition-all duration-300 rounded-full"
                      style={{ width: `${progressPercent}%` }}
                    />
                  </div>
                </div>
              )}

              {/* Success Report Card */}
              {saveReport && (
                <div className="bg-emerald-950/40 border border-emerald-500/50 rounded-xl p-4 text-emerald-200 animate-in fade-in">
                  <div className="flex items-center gap-2 text-sm font-bold text-emerald-300">
                    <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                    <span>Klasördeki {saveReport.total} Adet Evrak Başarıyla Sisteme Aktarıldı!</span>
                  </div>
                  <div className="grid grid-cols-3 gap-2 mt-3 text-xs">
                    <div className="bg-slate-900/80 border border-slate-800 rounded-lg p-2.5">
                      <div className="text-slate-400 text-[11px]">Şubeye Atanan (Onaylı)</div>
                      <div className="text-emerald-400 font-mono text-base font-bold mt-0.5">
                        {saveReport.approved} Adet
                      </div>
                    </div>
                    <div className="bg-slate-900/80 border border-slate-800 rounded-lg p-2.5">
                      <div className="text-slate-400 text-[11px]">Kontrol Edilecek (Şubesiz)</div>
                      <div className="text-amber-400 font-mono text-base font-bold mt-0.5">
                        {saveReport.needsReview} Adet
                      </div>
                    </div>
                    <div className="bg-slate-900/80 border border-slate-800 rounded-lg p-2.5">
                      <div className="text-slate-400 text-[11px]">Kurumsal Reddedilen</div>
                      <div className="text-rose-400 font-mono text-base font-bold mt-0.5">
                        {saveReport.rejected} Adet
                      </div>
                    </div>
                  </div>
                  <div className="mt-3 flex justify-end gap-2">
                    <button
                      type="button"
                      onClick={onClose}
                      className="bg-emerald-500 text-slate-950 text-xs font-bold px-4 py-2 rounded-xl hover:bg-emerald-400 transition"
                    >
                      Tamamla ve Listeye Git
                    </button>
                  </div>
                </div>
              )}

              {/* Items List */}
              <div className="space-y-2 max-h-[440px] overflow-auto pr-1">
                {items.map((item, idx) => {
                  const isPdf = item.fileType === 'application/pdf' || item.fileName.toLowerCase().endsWith('.pdf');
                  const r = item.extractedReceipt;
                  const isRejected = r?.isNonCompliant || r?.approvalStatus === 'rejected';
                  const isNeedsReview = r?.needsReview || !r?.branch || r?.branch === 'Belirtilmemiş';

                  return (
                    <div
                      key={item.id}
                      className={`bg-slate-950/70 border rounded-xl p-3 flex items-center justify-between gap-3 transition ${
                        item.status === 'scanning'
                          ? 'border-emerald-500/60 bg-emerald-950/10 shadow-sm'
                          : item.status === 'error'
                          ? 'border-rose-500/50 bg-rose-950/10'
                          : isRejected
                          ? 'border-rose-500/40 bg-rose-950/15'
                          : isNeedsReview && item.status === 'success'
                          ? 'border-amber-500/40 bg-amber-950/10'
                          : 'border-slate-800 hover:border-slate-700'
                      }`}
                    >
                      {/* Left: File details */}
                      <div className="flex items-center gap-3 min-w-0">
                        <div
                          className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 border ${
                            isPdf
                              ? 'bg-rose-500/15 border-rose-500/30 text-rose-400'
                              : 'bg-teal-500/15 border-teal-500/30 text-teal-400'
                          }`}
                        >
                          {isPdf ? <FileText className="w-4 h-4" /> : <ImageIcon className="w-4 h-4" />}
                        </div>

                        <div className="min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-xs font-bold text-white truncate max-w-[180px] sm:max-w-xs">
                              {item.fileName}
                            </span>
                            <span
                              className={`text-[9px] font-bold px-1.5 py-0.2 rounded border uppercase ${
                                isPdf
                                  ? 'bg-rose-500/20 text-rose-300 border-rose-500/30'
                                  : 'bg-teal-500/20 text-teal-300 border-teal-500/30'
                              }`}
                            >
                              {isPdf ? 'PDF' : 'Görsel'}
                            </span>
                            <span className="text-[10px] text-slate-500 font-mono">
                              ({(item.fileSize / 1024).toFixed(0)} KB)
                            </span>
                          </div>

                          {/* Extracted Details */}
                          {item.status === 'success' && r && (
                            <div className="flex items-center gap-2 text-[11px] text-slate-300 mt-1 flex-wrap">
                              <span className="font-semibold text-white">{r.merchant}</span>
                              <span className="text-slate-500">•</span>
                              <span>{r.date}</span>
                              <span className="text-slate-500">•</span>
                              <span className="text-emerald-400 font-bold font-mono">
                                ₺{Number(r.totalAmount || 0).toLocaleString('tr-TR', { minimumFractionDigits: 2 })}
                              </span>

                              {/* Branch pill */}
                              {isNeedsReview ? (
                                <span className="text-[10px] bg-amber-500/20 text-amber-300 border border-amber-500/40 px-2 py-0.2 rounded-full flex items-center gap-1 font-bold">
                                  <HelpCircle className="w-2.5 h-2.5" />
                                  Şube Atanacak (Kontrol)
                                </span>
                              ) : (
                                <span className="text-[10px] bg-slate-800 text-emerald-300 border border-emerald-500/30 px-2 py-0.2 rounded-full flex items-center gap-1">
                                  <Building2 className="w-2.5 h-2.5" />
                                  {r.branch}
                                </span>
                              )}

                              {/* Policy violation alert */}
                              {isRejected && (
                                <span className="text-[10px] bg-rose-500/20 text-rose-300 border border-rose-500/40 px-2 py-0.2 rounded-full flex items-center gap-1 font-bold">
                                  <AlertOctagon className="w-2.5 h-2.5" />
                                  Politika Reddi (Tekel/Alkol)
                                </span>
                              )}
                            </div>
                          )}

                          {item.status === 'error' && (
                            <div className="text-[11px] text-rose-400 mt-1">
                              Hata: {item.errorMessage}
                            </div>
                          )}

                          {item.status === 'pending' && (
                            <div className="text-[11px] text-slate-500 mt-1">
                              Taramaya hazır bekliyor
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Right: Status Indicator & Quick Preview */}
                      <div className="flex items-center gap-2 shrink-0">
                        {item.status === 'scanning' && (
                          <div className="flex items-center gap-1.5 text-xs text-emerald-400">
                            <Loader2 className="w-4 h-4 animate-spin" />
                            <span className="hidden sm:inline">Ayrıştırılıyor...</span>
                          </div>
                        )}

                        {item.status === 'success' && (
                          <div className="flex items-center gap-2">
                            {r && onOpenAttachment && (
                              <button
                                type="button"
                                onClick={() => onOpenAttachment(r as Receipt)}
                                className="p-1.5 text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-lg transition"
                                title="Ekli Evrağı Önizle"
                              >
                                <Eye className="w-3.5 h-3.5" />
                              </button>
                            )}
                            <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                          </div>
                        )}

                        {item.status === 'error' && (
                          <span className="text-xs text-rose-400 font-bold">Hata</span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Footer info */}
        <div className="px-5 sm:px-6 py-3 border-t border-slate-800 bg-slate-950/80 flex items-center justify-between text-xs text-slate-400">
          <div>
            📁 Lokal klasör seçimi tarayıcınız tarafından güvenli şekilde okunur ve evrak asılları şifreli arşivlenir.
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white transition"
          >
            Kapat
          </button>
        </div>
      </div>
    </div>
  );
};
