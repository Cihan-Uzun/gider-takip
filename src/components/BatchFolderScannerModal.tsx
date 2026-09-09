import React, { useState, useRef } from 'react';
import {
  X,
  FolderOpen,
  UploadCloud,
  FileText,
  Image as ImageIcon,
  CheckCircle2,
  AlertOctagon,
  HelpCircle,
  Loader2,
  Building2,
  ArrowRight,
  ShieldCheck,
  AlertCircle,
  FileCheck,
  Sparkles,
  RefreshCw,
} from 'lucide-react';
import { BranchInfo, Receipt, ExpenseCategory, DocumentType, PaymentMethod } from '../types';

interface BatchFolderScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  branches: BranchInfo[];
  onBatchSaved: (importedReceipts: Receipt[]) => void;
  onNavigateToReview?: () => void;
}

interface ScannedDocumentItem {
  id: string;
  file: File;
  fileName: string;
  fileType: string;
  fileSize: number;
  fileData: string; // Base64 data URL
  status: 'pending' | 'scanning' | 'ready' | 'saved' | 'failed';
  error?: string;
  parsedReceipt?: Partial<Receipt>;
}

export const BatchFolderScannerModal: React.FC<BatchFolderScannerModalProps> = ({
  isOpen,
  onClose,
  branches,
  onBatchSaved,
  onNavigateToReview,
}) => {
  const [scannedFiles, setScannedFiles] = useState<ScannedDocumentItem[]>([]);
  const [folderName, setFolderName] = useState<string>('');
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [selectedDefaultBranch, setSelectedDefaultBranch] = useState<string>('auto');
  const [progress, setProgress] = useState<{ current: number; total: number }>({ current: 0, total: 0 });
  const [saveSummary, setSaveSummary] = useState<{
    total: number;
    approved: number;
    needsReview: number;
    rejected: number;
  } | null>(null);

  const folderInputRef = useRef<HTMLInputElement>(null);
  const multiFileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  // Convert File to base64
  const readFileAsDataURL = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  // Handle folder selection
  const handleFilesSelected = async (filesList: FileList | null) => {
    if (!filesList || filesList.length === 0) return;

    // Filter valid image and pdf files
    const validFiles: File[] = [];
    let detectedDirName = '';

    for (let i = 0; i < filesList.length; i++) {
      const file = filesList[i];
      const lower = file.name.toLowerCase();
      const isDoc =
        lower.endsWith('.pdf') ||
        lower.endsWith('.jpg') ||
        lower.endsWith('.jpeg') ||
        lower.endsWith('.png') ||
        lower.endsWith('.webp') ||
        lower.endsWith('.bmp') ||
        file.type === 'application/pdf' ||
        file.type.startsWith('image/');

      if (isDoc) {
        validFiles.push(file);
        if (!detectedDirName && (file as any).webkitRelativePath) {
          const parts = (file as any).webkitRelativePath.split('/');
          if (parts.length > 1) {
            detectedDirName = parts[0];
          }
        }
      }
    }

    if (validFiles.length === 0) {
      alert('Seçilen klasörde taranabilecek PDF veya görsel formatında (JPG, PNG) fatura/fiş belgesi bulunamadı.');
      return;
    }

    setFolderName(detectedDirName || 'Seçilen Klasör');
    setSaveSummary(null);

    // Read and initialize items
    const items: ScannedDocumentItem[] = [];
    for (let i = 0; i < validFiles.length; i++) {
      const file = validFiles[i];
      const dataUrl = await readFileAsDataURL(file);
      items.push({
        id: 'scan-' + Date.now() + '-' + i,
        file,
        fileName: file.name,
        fileType: file.type || (file.name.toLowerCase().endsWith('.pdf') ? 'application/pdf' : 'image/jpeg'),
        fileSize: file.size,
        fileData: dataUrl,
        status: 'pending',
      });
    }

    setScannedFiles(items);
    // Start automated OCR scanning
    startBatchOCR(items);
  };

  // Run OCR on all items sequentially
  const startBatchOCR = async (items: ScannedDocumentItem[]) => {
    setIsProcessing(true);
    const updated = [...items];
    setProgress({ current: 0, total: items.length });

    for (let i = 0; i < updated.length; i++) {
      updated[i].status = 'scanning';
      setScannedFiles([...updated]);
      setProgress({ current: i + 1, total: updated.length });

      try {
        const item = updated[i];
        const res = await fetch('/api/receipts/ocr', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            imageBase64: item.fileData,
            mimeType: item.fileType,
            fileName: item.fileName,
          }),
        });

        const data = await res.json();
        if (data.success && data.data) {
          const ocr = data.data;

          // Apply selected default branch if user specified one and OCR didn't find one
          let finalBranch = ocr.branch || '';
          let needsReview = Boolean(ocr.needsReview);

          if (selectedDefaultBranch !== 'auto' && (!finalBranch || finalBranch === '')) {
            finalBranch = selectedDefaultBranch;
            needsReview = false;
          }

          updated[i].parsedReceipt = {
            merchant: ocr.merchant || item.fileName.replace(/\.[^/.]+$/, ''),
            branch: finalBranch,
            date: ocr.date || new Date().toISOString().split('T')[0],
            time: ocr.time || '12:00',
            totalAmount: Number(ocr.totalAmount || 500),
            currency: 'TRY',
            taxAmount: ocr.taxAmount ? Number(ocr.taxAmount) : undefined,
            taxRate: ocr.taxRate || 10,
            category: (ocr.category as ExpenseCategory) || 'Market & Gıda',
            docType: (ocr.docType as DocumentType) || (item.fileType === 'application/pdf' ? 'E-Fatura' : 'Fiş'),
            docNumber: ocr.docNumber || 'BELGE-' + Math.floor(10000 + Math.random() * 90000),
            paymentMethod: (ocr.paymentMethod as PaymentMethod) || 'Kredi Kartı',
            items: ocr.items || [],
            isUnusualExpense: Boolean(ocr.isUnusualExpense),
            unusualReason: ocr.unusualReason,
            isNonCompliant: Boolean(ocr.isNonCompliant),
            complianceReason: ocr.complianceReason,
            nonCompliantItems: ocr.nonCompliantItems,
            approvalStatus: ocr.approvalStatus || (ocr.isNonCompliant ? 'rejected' : 'approved'),
            needsReview,
            reviewReason: needsReview ? 'Şube bilgisi eksik - Kontrol ve şube ataması bekleniyor' : undefined,
            notes: ocr.notes || `Klasör taraması: ${item.fileName}`,
            imageUrl: item.fileType.startsWith('image/') ? item.fileData : undefined,
            attachment: {
              fileName: item.fileName,
              fileType: item.fileType,
              fileSize: item.fileSize,
              fileData: item.fileData,
              uploadedAt: new Date().toISOString(),
            },
          };
          updated[i].status = 'ready';
        } else {
          throw new Error(data.error || 'OCR ayrıştırma başarısız');
        }
      } catch (err: any) {
        console.error('Batch scan item error:', err);
        updated[i].status = 'failed';
        updated[i].error = err.message || 'Belge okunamadı';
      }

      setScannedFiles([...updated]);
    }

    setIsProcessing(false);
  };

  // Load sample demo folder with mixed files for instant testing
  const handleLoadSampleFolder = async () => {
    setFolderName('Örnek Masraf Klasörü (Eylül 2026)');
    setSaveSummary(null);
    setIsProcessing(true);

    const today = new Date().toISOString().split('T')[0];

    // Create 4 simulated authentic documents (PDF and Images)
    const samples: ScannedDocumentItem[] = [
      {
        id: 'sample-1',
        file: new File([''], 'turkcell_internet_faturasi.pdf', { type: 'application/pdf' }),
        fileName: 'turkcell_internet_faturasi.pdf',
        fileType: 'application/pdf',
        fileSize: 312000,
        fileData: 'data:application/pdf;base64,JVBERi0xLjQKJcTl8uXrCg==',
        status: 'ready',
        parsedReceipt: {
          merchant: 'Turkcell İletişim Hizmetleri A.Ş.',
          branch: 'Karabük Şubesi',
          date: today,
          time: '10:00',
          totalAmount: 640.0,
          currency: 'TRY',
          taxAmount: 106.67,
          taxRate: 20,
          category: 'Fatura & Abonelikler',
          docType: 'E-Fatura',
          docNumber: 'FAT-TC-4402',
          paymentMethod: 'Banka Kartı',
          items: [{ name: 'Aylık Kurumsal Fiber İnternet', quantity: 1, unitPrice: 640, totalPrice: 640 }],
          isUnusualExpense: false,
          isNonCompliant: false,
          approvalStatus: 'approved',
          needsReview: false,
          notes: 'Karabük Şubesi ofis internet ve iletişim bedeli',
          attachment: {
            fileName: 'turkcell_internet_faturasi.pdf',
            fileType: 'application/pdf',
            fileSize: 312000,
            fileData: 'data:application/pdf;base64,JVBERi0xLjQKJcTl8uXrCg==',
          },
        },
      },
      {
        id: 'sample-2',
        file: new File([''], 'shell_yakit_fisi.jpg', { type: 'image/jpeg' }),
        fileName: 'shell_yakit_fisi.jpg',
        fileType: 'image/jpeg',
        fileSize: 184000,
        fileData: 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQEASABIAAD/2wBDAP...',
        status: 'ready',
        parsedReceipt: {
          merchant: 'Shell & Turcas Petrol A.Ş. (Karabük İstasyonu)',
          branch: 'Karabük Şubesi',
          date: today,
          time: '08:15',
          totalAmount: 2200.0,
          currency: 'TRY',
          taxAmount: 366.66,
          taxRate: 20,
          category: 'Ulaşım & Akaryakıt',
          docType: 'Fiş',
          docNumber: 'SHL-99012',
          paymentMethod: 'Kredi Kartı',
          items: [{ name: 'V-Power Kurşunsuz Benzin 95 Oktan', quantity: 48.8, unitPrice: 45.08, totalPrice: 2200 }],
          isUnusualExpense: false,
          isNonCompliant: false,
          approvalStatus: 'approved',
          needsReview: false,
          notes: 'Karabük Şube saha aracı yakıt ikmali',
          attachment: {
            fileName: 'shell_yakit_fisi.jpg',
            fileType: 'image/jpeg',
            fileSize: 184000,
            fileData: 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQEASABIAAD/2wBDAP...',
          },
        },
      },
      {
        id: 'sample-3',
        file: new File([''], 'subesiz_market_harcamasi.png', { type: 'image/png' }),
        fileName: 'subesiz_market_harcamasi.png',
        fileType: 'image/png',
        fileSize: 220000,
        fileData: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
        status: 'ready',
        parsedReceipt: {
          merchant: 'CarrefourSA Hipermarket',
          branch: '', // Missing branch -> goes to Kontrol Edilecekler!
          date: today,
          time: '16:45',
          totalAmount: 1450.0,
          currency: 'TRY',
          taxAmount: 131.81,
          taxRate: 10,
          category: 'Market & Gıda',
          docType: 'Fiş',
          docNumber: 'CRF-6612',
          paymentMethod: 'Kredi Kartı',
          items: [
            { name: 'Ofis Çay, Kahve & İkramlıklar', quantity: 3, unitPrice: 250, totalPrice: 750 },
            { name: 'Temizlik ve Hijyen Malzemeleri', quantity: 1, unitPrice: 700, totalPrice: 700 },
          ],
          isUnusualExpense: false,
          isNonCompliant: false,
          approvalStatus: 'approved',
          needsReview: true,
          reviewReason: 'Belgede şube ibaresi tespit edilemedi. Lütfen şubeyi seçiniz.',
          notes: 'Şube belirtilmemiş fiş - Kontrol Edilecekler havuzuna yönlendirildi',
          attachment: {
            fileName: 'subesiz_market_harcamasi.png',
            fileType: 'image/png',
            fileSize: 220000,
            fileData: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
          },
        },
      },
      {
        id: 'sample-4',
        file: new File([''], 'tekel_bufe_ihlal_faturasi.pdf', { type: 'application/pdf' }),
        fileName: 'tekel_bufe_ihlal_faturasi.pdf',
        fileType: 'application/pdf',
        fileSize: 275000,
        fileData: 'data:application/pdf;base64,JVBERi0xLjQKJcTl8uXrCg==',
        status: 'ready',
        parsedReceipt: {
          merchant: 'Merkez Tekel & Şarküteri Büfe',
          branch: 'Karabük Şubesi',
          date: today,
          time: '20:30',
          totalAmount: 790.0,
          currency: 'TRY',
          taxAmount: 131.67,
          taxRate: 20,
          category: 'Market & Gıda',
          docType: 'Fiş',
          docNumber: 'TKL-8831',
          paymentMethod: 'Kredi Kartı',
          items: [
            { name: 'Kutu İçecekler', quantity: 2, unitPrice: 45, totalPrice: 90, isProhibited: false },
            { name: 'Efes Pilsen Bira x 4', quantity: 4, unitPrice: 85, totalPrice: 340, isProhibited: true, prohibitedReason: 'Alkol/Tekel Ürünü' },
            { name: 'Marlboro Sigara x 4', quantity: 4, unitPrice: 90, totalPrice: 360, isProhibited: true, prohibitedReason: 'Tütün/Sigara Ürünü' },
          ],
          isUnusualExpense: false,
          isNonCompliant: true,
          approvalStatus: 'rejected',
          complianceReason: 'Faturada kurumsal olarak kabul edilmeyen "Tekel, Alkol, Sigara" ürünü tespit edildi. Kurumsal politika gereği reddedildi.',
          nonCompliantItems: ['Tekel', 'Alkol', 'Sigara'],
          needsReview: false,
          notes: 'Kurumsal politika ihlali içeren belge',
          attachment: {
            fileName: 'tekel_bufe_ihlal_faturasi.pdf',
            fileType: 'application/pdf',
            fileSize: 275000,
            fileData: 'data:application/pdf;base64,JVBERi0xLjQKJcTl8uXrCg==',
          },
        },
      },
    ];

    setScannedFiles(samples);
    setIsProcessing(false);
  };

  // Save all ready receipts to database
  const handleSaveAll = async () => {
    const readyItems = scannedFiles.filter((item) => item.status === 'ready' && item.parsedReceipt);
    if (readyItems.length === 0) {
      alert('Sisteme kaydedilecek hazır evrak bulunmamaktadır.');
      return;
    }

    setIsSaving(true);
    try {
      const payload = readyItems.map((it) => it.parsedReceipt);

      const response = await fetch('/api/receipts/batch-import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ receipts: payload }),
      });

      const data = await response.json();
      if (!data.success) {
        throw new Error(data.error || 'Toplu kaydetme başarısız');
      }

      setSaveSummary({
        total: data.importedCount,
        approved: data.approvedCount,
        needsReview: data.needsReviewCount,
        rejected: data.rejectedCount,
      });

      // Mark all saved
      setScannedFiles((prev) =>
        prev.map((item) => (item.status === 'ready' ? { ...item, status: 'saved' } : item))
      );

      // Trigger parent callback to refresh receipts in UI
      if (data.receipts) {
        onBatchSaved(data.receipts);
      }
    } catch (err: any) {
      alert('Toplu aktarım sırasında hata: ' + err.message);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-950/85 backdrop-blur-md animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-700/80 rounded-2xl w-full max-w-4xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-800 bg-slate-950/60">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500/20 to-teal-500/20 border border-emerald-500/40 text-emerald-400 flex items-center justify-center">
              <FolderOpen className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-bold text-white">
                  Klasörden Toplu Evrak / Fatura Tarama
                </h2>
                <span className="text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 px-2 py-0.5 rounded-full">
                  PDF & Görsel Destekli
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Bilgisayarınızdaki bir klasörü seçerek içindeki tüm fiş ve faturaları tek seferde OCR ile tarayın ve sisteme aktarın.
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

        {/* Hidden inputs for folder and multiple files */}
        <input
          type="file"
          ref={folderInputRef}
          // @ts-ignore
          webkitdirectory="true"
          // @ts-ignore
          directory="true"
          multiple
          className="hidden"
          onChange={(e) => handleFilesSelected(e.target.files)}
        />
        <input
          type="file"
          ref={multiFileInputRef}
          multiple
          accept="image/*,application/pdf,.pdf"
          className="hidden"
          onChange={(e) => handleFilesSelected(e.target.files)}
        />

        {/* Action / Selection Bar if no files yet */}
        {scannedFiles.length === 0 ? (
          <div className="flex-1 overflow-auto p-6 sm:p-8 flex flex-col items-center justify-center text-center">
            <div className="w-16 h-16 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 flex items-center justify-center mb-4 shadow-lg shadow-emerald-500/10">
              <UploadCloud className="w-8 h-8 animate-pulse" />
            </div>

            <h3 className="text-base font-bold text-white mb-1">
              Bilgisayarınızdan Evrak Klasörü Seçin
            </h3>
            <p className="text-xs text-slate-400 max-w-md mx-auto mb-6">
              Klasörün içindeki tüm PDF faturalar, e-arşiv belgeleri ve fiş fotoğrafları otomatik olarak ayrıştırılacak,
              şubelerine atanacak ve orijinal dosyalarıyla birlikte veritabanında saklanacaktır.
            </p>

            <div className="flex flex-col sm:flex-row items-center gap-3 w-full max-w-md">
              <button
                type="button"
                onClick={() => folderInputRef.current?.click()}
                className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-semibold text-sm px-5 py-3 rounded-xl shadow-lg shadow-emerald-600/20 transition active:scale-[0.98]"
              >
                <FolderOpen className="w-4 h-4" />
                <span>Bilgisayardan Klasör Seç</span>
              </button>

              <button
                type="button"
                onClick={() => multiFileInputRef.current?.click()}
                className="w-full flex items-center justify-center gap-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 font-semibold text-sm px-5 py-3 rounded-xl transition"
              >
                <FileText className="w-4 h-4 text-teal-400" />
                <span>Çoklu Dosya Seç (PDF / Resim)</span>
              </button>
            </div>

            {/* Quick Demo Button */}
            <div className="mt-8 pt-6 border-t border-slate-800 w-full max-w-md flex flex-col items-center">
              <span className="text-[11px] text-slate-500 mb-2">Hızlı Test İçin:</span>
              <button
                type="button"
                onClick={handleLoadSampleFolder}
                className="inline-flex items-center gap-2 bg-slate-800/80 hover:bg-slate-800 border border-slate-700/80 hover:border-emerald-500/50 text-emerald-300 text-xs font-semibold px-4 py-2 rounded-xl transition"
              >
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                <span>🧪 Örnek Masraf Klasörü Yükle (4 Evrak: PDF + Resim)</span>
              </button>
            </div>
          </div>
        ) : (
          /* File List & Progress View */
          <div className="flex-1 overflow-auto flex flex-col">
            {/* Top Toolbar / Status */}
            <div className="px-5 py-3 border-b border-slate-800 bg-slate-950/40 flex items-center justify-between flex-wrap gap-3">
              <div className="flex items-center gap-2">
                <FolderOpen className="w-4 h-4 text-emerald-400" />
                <span className="text-xs font-bold text-white">{folderName}</span>
                <span className="text-[11px] bg-slate-800 text-slate-300 px-2 py-0.5 rounded-full border border-slate-700">
                  {scannedFiles.length} adet evrak
                </span>
              </div>

              {/* Branch Selector for undefined */}
              <div className="flex items-center gap-2 text-xs">
                <span className="text-slate-400 text-[11px]">Varsayılan Şube:</span>
                <select
                  value={selectedDefaultBranch}
                  onChange={(e) => setSelectedDefaultBranch(e.target.value)}
                  className="bg-slate-900 border border-slate-700 text-slate-200 text-xs rounded-lg px-2.5 py-1 focus:outline-none focus:border-emerald-500"
                >
                  <option value="auto">Otomatik Algıla (Yoksa Kontrol Havuzuna)</option>
                  {branches.map((b) => (
                    <option key={b.id} value={b.name}>
                      {b.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Progress Bar while scanning */}
            {isProcessing && (
              <div className="px-5 py-3 bg-emerald-500/10 border-b border-emerald-500/20">
                <div className="flex items-center justify-between text-xs text-emerald-300 font-semibold mb-1.5">
                  <div className="flex items-center gap-2">
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Evraklar OCR ile taranıyor ve analiz ediliyor...</span>
                  </div>
                  <span>
                    {progress.current} / {progress.total}
                  </span>
                </div>
                <div className="w-full bg-slate-800 rounded-full h-1.5 overflow-hidden">
                  <div
                    className="bg-emerald-500 h-full transition-all duration-300"
                    style={{ width: `${(progress.current / Math.max(1, progress.total)) * 100}%` }}
                  />
                </div>
              </div>
            )}

            {/* Success Summary Banner if saved */}
            {saveSummary && (
              <div className="m-4 p-4 bg-emerald-500/10 border border-emerald-500/30 rounded-xl flex items-center justify-between flex-wrap gap-3 animate-in fade-in">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 flex items-center justify-center shrink-0">
                    <FileCheck className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-xs sm:text-sm font-bold text-white">
                      Toplu Aktarım Başarıyla Tamamlandı!
                    </h4>
                    <p className="text-[11px] text-emerald-300 mt-0.5">
                      Toplam <strong>{saveSummary.total}</strong> evrak kaydedildi: {saveSummary.approved} onaylı,{' '}
                      {saveSummary.needsReview} şube kontrolü bekleyen, {saveSummary.rejected} kurumsal uygunsuz.
                    </p>
                  </div>
                </div>

                {saveSummary.needsReview > 0 && onNavigateToReview && (
                  <button
                    onClick={() => {
                      onClose();
                      onNavigateToReview();
                    }}
                    className="flex items-center gap-1.5 text-xs font-semibold bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 px-3 py-1.5 rounded-lg transition"
                  >
                    <HelpCircle className="w-3.5 h-3.5" />
                    <span>{saveSummary.needsReview} Belgeyi Kontrol Et & Ata</span>
                  </button>
                )}
              </div>
            )}

            {/* Documents List */}
            <div className="flex-1 overflow-auto p-4 sm:p-5 space-y-2.5">
              {scannedFiles.map((item, idx) => {
                const parsed = item.parsedReceipt;
                const isPdf = item.fileType === 'application/pdf' || item.fileName.toLowerCase().endsWith('.pdf');
                const isSaved = item.status === 'saved';
                const isRejected = parsed?.isNonCompliant || parsed?.approvalStatus === 'rejected';
                const isNeedsReview = parsed?.needsReview || !parsed?.branch || parsed.branch === '';

                return (
                  <div
                    key={item.id}
                    className={`bg-slate-900 border rounded-xl p-3.5 transition flex items-center justify-between gap-3 ${
                      isSaved
                        ? 'border-emerald-500/50 bg-emerald-950/10'
                        : isRejected
                        ? 'border-rose-500/40 bg-rose-950/15'
                        : isNeedsReview
                        ? 'border-amber-500/40 bg-amber-950/10'
                        : 'border-slate-800'
                    }`}
                  >
                    {/* Left: Icon & Details */}
                    <div className="flex items-start gap-3 min-w-0">
                      <div
                        className={`w-9 h-9 rounded-xl border flex items-center justify-center shrink-0 mt-0.5 ${
                          isPdf
                            ? 'bg-rose-500/15 border-rose-500/40 text-rose-400'
                            : 'bg-teal-500/15 border-teal-500/40 text-teal-400'
                        }`}
                      >
                        {isPdf ? <FileText className="w-4 h-4" /> : <ImageIcon className="w-4 h-4" />}
                      </div>

                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h4 className="text-xs sm:text-sm font-semibold text-white truncate max-w-[200px] sm:max-w-xs">
                            {parsed?.merchant || item.fileName}
                          </h4>

                          <span className="text-[10px] font-mono bg-slate-800 text-slate-400 px-1.5 py-0.5 rounded border border-slate-700">
                            {isPdf ? 'PDF' : 'Görsel'}
                          </span>

                          {/* Branch Badge */}
                          {parsed && (
                            isNeedsReview ? (
                              <span className="text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40 px-2 py-0.5 rounded-full flex items-center gap-1">
                                <HelpCircle className="w-2.5 h-2.5" />
                                Şube Belirtilmedi (Kontrole Gidecek)
                              </span>
                            ) : (
                              <span className="text-[10px] font-semibold bg-slate-800 text-emerald-300 border border-emerald-500/30 px-2 py-0.5 rounded-full flex items-center gap-1">
                                <Building2 className="w-2.5 h-2.5" />
                                {parsed.branch}
                              </span>
                            )
                          )}

                          {/* Policy Rejection */}
                          {isRejected && (
                            <span className="text-[10px] font-bold bg-rose-500/20 text-rose-300 border border-rose-500/40 px-2 py-0.5 rounded-full flex items-center gap-1">
                              <AlertOctagon className="w-2.5 h-2.5" />
                              Tekel / Politika Reddi
                            </span>
                          )}
                        </div>

                        <div className="flex items-center gap-3 text-[11px] text-slate-400 mt-1 truncate">
                          <span className="text-slate-500 font-mono">{item.fileName}</span>
                          {parsed?.date && <span>• {parsed.date}</span>}
                          {parsed?.category && <span>• {parsed.category}</span>}
                          <span>• {(item.fileSize / 1024).toFixed(0)} KB</span>
                        </div>
                      </div>
                    </div>

                    {/* Right: Amount & Status */}
                    <div className="text-right shrink-0 flex items-center gap-3">
                      {parsed && (
                        <div>
                          <div
                            className={`text-sm font-bold font-mono ${
                              isRejected ? 'text-rose-400 line-through' : 'text-white'
                            }`}
                          >
                            ₺{Number(parsed.totalAmount).toLocaleString('tr-TR', { minimumFractionDigits: 2 })}
                          </div>
                          {parsed.taxAmount ? (
                            <div className="text-[10px] text-slate-400 font-mono">
                              KDV: ₺{Number(parsed.taxAmount).toFixed(2)}
                            </div>
                          ) : null}
                        </div>
                      )}

                      {/* Status indicator */}
                      <div>
                        {item.status === 'scanning' ? (
                          <div className="w-8 h-8 rounded-lg bg-emerald-500/15 text-emerald-400 flex items-center justify-center">
                            <Loader2 className="w-4 h-4 animate-spin" />
                          </div>
                        ) : isSaved ? (
                          <div
                            className="w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center"
                            title="Sisteme Kaydedildi"
                          >
                            <CheckCircle2 className="w-4 h-4" />
                          </div>
                        ) : item.status === 'ready' ? (
                          <div
                            className="w-8 h-8 rounded-lg bg-slate-800 text-slate-300 flex items-center justify-center border border-slate-700"
                            title="Taraması Tamamlandı, Kayda Hazır"
                          >
                            <FileCheck className="w-4 h-4 text-teal-400" />
                          </div>
                        ) : item.status === 'failed' ? (
                          <div
                            className="w-8 h-8 rounded-lg bg-rose-500/20 text-rose-400 flex items-center justify-center"
                            title={item.error}
                          >
                            <AlertCircle className="w-4 h-4" />
                          </div>
                        ) : (
                          <div className="w-8 h-8 rounded-lg bg-slate-800 text-slate-500 flex items-center justify-center">
                            <span className="text-xs font-mono">{idx + 1}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Footer Bar */}
        <div className="px-5 py-3.5 border-t border-slate-800 bg-slate-950/80 flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-2">
            {scannedFiles.length > 0 && (
              <button
                type="button"
                onClick={() => folderInputRef.current?.click()}
                disabled={isProcessing || isSaving}
                className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-white px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 transition"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Farklı Klasör Seç</span>
              </button>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-xl transition"
            >
              Kapat
            </button>

            {scannedFiles.length > 0 && (
              <button
                type="button"
                onClick={handleSaveAll}
                disabled={isProcessing || isSaving || scannedFiles.every((i) => i.status === 'saved')}
                className="flex items-center gap-2 px-5 py-2 text-xs font-bold text-white bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 disabled:opacity-50 disabled:cursor-not-allowed rounded-xl shadow-lg shadow-emerald-600/20 transition active:scale-[0.98]"
              >
                {isSaving ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Sisteme Kaydediliyor...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4" />
                    <span>
                      {scannedFiles.every((i) => i.status === 'saved')
                        ? 'Tümü Kaydedildi'
                        : `Tümünü Sisteme Kaydet (${scannedFiles.filter((i) => i.status === 'ready').length} Evrak)`}
                    </span>
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
