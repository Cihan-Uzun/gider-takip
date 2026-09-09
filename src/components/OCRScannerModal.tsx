import React, { useState, useRef, useEffect } from 'react';
import {
  Camera,
  Upload,
  X,
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  Clock,
  FileText,
  Plus,
  Trash2,
  RefreshCw,
  Image as ImageIcon,
  Building2,
  AlertOctagon,
  ShieldAlert,
  HelpCircle,
  FolderOpen,
} from 'lucide-react';
import { Receipt, ReceiptAttachment, ExpenseCategory, DocumentType, PaymentMethod, ReceiptItem, BranchInfo, DisallowedRule } from '../types';

interface OCRScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaveReceipt: (receipt: Partial<Receipt>) => Promise<void>;
  onQueueFor2100: (data: { name: string; imageBase64: string; docType: DocumentType; branch?: string }) => Promise<void>;
  initialBranch?: string;
  onOpenFolderScanner?: () => void;
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

const DOC_TYPES: DocumentType[] = ['Fiş', 'Fatura', 'E-Fatura', 'Makbuz'];
const PAYMENT_METHODS: PaymentMethod[] = ['Kredi Kartı', 'Nakit', 'Banka Kartı', 'Havale / EFT'];

export const OCRScannerModal: React.FC<OCRScannerModalProps> = ({
  isOpen,
  onClose,
  onSaveReceipt,
  onQueueFor2100,
  initialBranch = 'Karabük Şubesi',
  onOpenFolderScanner,
}) => {
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [uploadedFileMeta, setUploadedFileMeta] = useState<{
    fileName: string;
    fileType: string;
    fileSize: number;
  } | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [scanComplete, setScanComplete] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  // Corporate Branch & Rules State
  const [branch, setBranch] = useState(initialBranch);
  const [branchesList, setBranchesList] = useState<string[]>(['Karabük Şubesi', 'İstanbul Merkez', 'Ankara Çankaya Şubesi', 'İzmir Konak Şubesi', 'Bursa Nilüfer Şubesi', 'Antalya Muratpaşa Şubesi', 'Kocaeli Gebze Şubesi']);
  const [complianceRules, setComplianceRules] = useState<DisallowedRule[]>([]);

  // Extracted Form State
  const [merchant, setMerchant] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [time, setTime] = useState('12:00');
  const [totalAmount, setTotalAmount] = useState<number | string>('');
  const [currency, setCurrency] = useState('TRY');
  const [taxAmount, setTaxAmount] = useState<number | string>('');
  const [taxRate, setTaxRate] = useState<number>(10);
  const [category, setCategory] = useState<ExpenseCategory>('Market & Gıda');
  const [docType, setDocType] = useState<DocumentType>('Fiş');
  const [docNumber, setDocNumber] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('Kredi Kartı');
  const [isUnusual, setIsUnusual] = useState(false);
  const [unusualReason, setUnusualReason] = useState('');
  const [notes, setNotes] = useState('');
  const [items, setItems] = useState<ReceiptItem[]>([]);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  // Load branches & compliance rules on open
  useEffect(() => {
    if (isOpen) {
      fetch('/api/branches')
        .then((r) => r.json())
        .then((data) => {
          if (data.success && data.data) {
            setBranchesList(data.data.map((b: BranchInfo) => b.name));
          }
        })
        .catch((e) => console.error(e));

      fetch('/api/compliance/rules')
        .then((r) => r.json())
        .then((data) => {
          if (data.success && data.data) {
            setComplianceRules(data.data);
          }
        })
        .catch((e) => console.error(e));
    }
  }, [isOpen]);

  // Evaluate Compliance dynamically
  const evaluateCurrentCompliance = () => {
    if (complianceRules.length === 0) return { isNonCompliant: false, nonCompliantItems: [], complianceReason: '' };

    const detectedNonCompliant: string[] = [];
    let matchedRuleDesc = '';

    const checkText = (text: string) => {
      const lower = (text || '').toLowerCase();
      for (const rule of complianceRules) {
        if (lower.includes(rule.keyword.toLowerCase())) {
          if (!detectedNonCompliant.includes(rule.keyword)) {
            detectedNonCompliant.push(rule.keyword);
          }
          if (!matchedRuleDesc) {
            matchedRuleDesc = rule.description || `Kurumsal yasaklı ürün: ${rule.keyword}`;
          }
        }
      }
    };

    checkText(merchant);
    checkText(notes);
    items.forEach((it) => {
      checkText(it.name);
    });

    const isNonCompliant = detectedNonCompliant.length > 0;
    const complianceReason = isNonCompliant
      ? `Faturada kurumsal olarak kabul edilmeyen "${detectedNonCompliant.join(', ')}" ürünü tespit edildi. Tek bir ürün dahi hatalı olsa kurumsal politika gereği faturanın tamamı kabul edilmez.`
      : '';

    return { isNonCompliant, nonCompliantItems: detectedNonCompliant, complianceReason };
  };

  const compliance = evaluateCurrentCompliance();

  if (!isOpen) return null;

  // Handle image and PDF file selection
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const isPdf = file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf');
      const meta = {
        fileName: file.name,
        fileType: isPdf ? 'application/pdf' : (file.type || 'image/jpeg'),
        fileSize: file.size,
      };
      setUploadedFileMeta(meta);

      const reader = new FileReader();
      reader.onload = (event) => {
        const base64 = event.target?.result as string;
        setSelectedImage(base64);
        processOCR(base64, meta.fileType, meta.fileName);
      };
      reader.readAsDataURL(file);
    }
  };

  // Run OCR with Gemini API (handles Image and PDF)
  const processOCR = async (imageBase64: string, mimeType?: string, fileName?: string) => {
    setIsScanning(true);
    setErrorMsg(null);
    setScanComplete(false);

    try {
      const response = await fetch('/api/receipts/ocr', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          imageBase64,
          mimeType: mimeType || 'image/jpeg',
          fileName: fileName || uploadedFileMeta?.fileName,
        }),
      });

      const contentType = response.headers.get('content-type') || '';
      if (!contentType.includes('application/json')) {
        throw new Error(
          'Sunucu API yanıtı alınamadı (Backend servisi bulunamadı). Eğer bu sayfayı Vercel gibi statik bir hosting üzerinde açtıysanız, backend sunucusu ve Gemini API anahtarı aktif değildir. Lütfen uygulamanın canlı Cloud Run / AI Studio bağlantısını kullanınız.'
        );
      }

      const resData = await response.json();
      if (!resData.success) {
        throw new Error(resData.error || 'OCR işlemi başarısız');
      }

      const ocr = resData.data;
      setMerchant(ocr.merchant || 'Bilinmeyen Mağaza');
      setBranch(ocr.branch || 'Karabük Şubesi');
      setDate(ocr.date || new Date().toISOString().split('T')[0]);
      setTime(ocr.time || '12:00');
      setTotalAmount(ocr.totalAmount || 0);
      setCurrency(ocr.currency || 'TRY');
      setTaxAmount(ocr.taxAmount || 0);
      setTaxRate(ocr.taxRate || 10);
      setCategory(ocr.category || 'Market & Gıda');
      setDocType(ocr.docType || (mimeType === 'application/pdf' ? 'E-Fatura' : 'Fiş'));
      setDocNumber(ocr.docNumber || '');
      setPaymentMethod(ocr.paymentMethod || 'Kredi Kartı');
      setIsUnusual(Boolean(ocr.isUnusualExpense));
      setUnusualReason(ocr.unusualReason || '');
      setNotes(ocr.notes || '');
      setItems(ocr.items || []);
      setScanComplete(true);
    } catch (err: any) {
      console.error('OCR Error:', err);
      setErrorMsg(err.message || 'Tarama sırasında bir hata oluştu');
    } finally {
      setIsScanning(false);
    }
  };

  // Quick sample receipts for immediate zero-friction testing
  const loadSampleReceipt = (type: 'market' | 'fuel' | 'tech' | 'invoice' | 'tekel_rejected' | 'no_branch') => {
    let sampleData: any;
    const today = new Date().toISOString().split('T')[0];

    if (type === 'no_branch') {
      sampleData = {
        merchant: 'Köroğlu Kırtasiye & Büro Ltd.',
        branch: '', // explicitly blank to route to Kontrol Edilecekler
        date: today,
        time: '14:20',
        totalAmount: 1450.00,
        currency: 'TRY',
        taxAmount: 241.67,
        taxRate: 20,
        category: 'Ofis & Kırtasiye',
        docType: 'Fiş',
        docNumber: 'KRT-2026-912',
        paymentMethod: 'Kredi Kartı',
        isUnusualExpense: false,
        items: [
          { name: 'A4 Fotokopi Kağıdı 5li Koli', quantity: 2, unitPrice: 420, totalPrice: 840 },
          { name: 'Tükenmez Kalem & Zımba Seti', quantity: 1, unitPrice: 260, totalPrice: 260 },
          { name: 'Klasör Dosya 10lu Paket', quantity: 1, unitPrice: 350, totalPrice: 350 },
        ],
        notes: 'Belgede şube ibaresi yer almıyor - Kontrol Edilecekler alanına aktarılacak',
      };
    } else if (type === 'tekel_rejected') {
      sampleData = {
        merchant: 'Karabük Tekel & Şarküteri Büfe',
        branch: 'Karabük Şubesi',
        date: today,
        time: '20:15',
        totalAmount: 685.00,
        currency: 'TRY',
        taxAmount: 114.16,
        taxRate: 20,
        category: 'Market & Gıda',
        docType: 'Fiş',
        docNumber: 'TKL-KBK-5510',
        paymentMethod: 'Kredi Kartı',
        isUnusualExpense: false,
        items: [
          { name: 'Maden Suyu 6lı Paket', quantity: 1, unitPrice: 45, totalPrice: 45, isProhibited: false },
          { name: 'Efes Pilsen Özel Seri 50cl x 4', quantity: 4, unitPrice: 85, totalPrice: 340, isProhibited: true, prohibitedReason: 'Alkol/Tekel Ürünü' },
          { name: 'Winston Slender Sigara x 2', quantity: 2, unitPrice: 75, totalPrice: 150, isProhibited: true, prohibitedReason: 'Tütün/Sigara Ürünü' },
          { name: 'Karışık Lüks Kuruyemiş 300g', quantity: 1, unitPrice: 150, totalPrice: 150, isProhibited: false },
        ],
        notes: 'Karabük Şubesi mesai sonrası atıştırmalık ve içecek alışverişi',
      };
    } else if (type === 'market') {
      sampleData = {
        merchant: 'Migros Ticaret A.Ş. (Karabük 100. Yıl Şubesi)',
        branch: 'Karabük Şubesi',
        date: today,
        time: '15:40',
        totalAmount: 1240.50,
        currency: 'TRY',
        taxAmount: 112.77,
        taxRate: 10,
        category: 'Market & Gıda',
        docType: 'Fiş',
        docNumber: 'MGR-7741',
        paymentMethod: 'Kredi Kartı',
        isUnusualExpense: false,
        items: [
          { name: 'Sütaş Süt 1L x 4', quantity: 4, unitPrice: 39, totalPrice: 156 },
          { name: 'Torku Süzme Peynir', quantity: 1, unitPrice: 185, totalPrice: 185 },
          { name: 'Kıyma 800g', quantity: 1, unitPrice: 480, totalPrice: 480 },
          { name: 'Manav & Sebze', quantity: 1, unitPrice: 419.5, totalPrice: 419.5 },
        ],
        notes: 'Karabük Şubesi ofis mutfak alışverişi',
      };
    } else if (type === 'fuel') {
      sampleData = {
        merchant: 'Shell & Turcas Petrol A.Ş. (Karabük İstasyonu)',
        branch: 'Karabük Şubesi',
        date: today,
        time: '08:15',
        totalAmount: 2200.00,
        currency: 'TRY',
        taxAmount: 366.66,
        taxRate: 20,
        category: 'Ulaşım & Akaryakıt',
        docType: 'Fiş',
        docNumber: 'SHL-99012',
        paymentMethod: 'Kredi Kartı',
        isUnusualExpense: false,
        items: [
          { name: 'V-Power Kurşunsuz Benzin', quantity: 48.8, unitPrice: 45.08, totalPrice: 2200 },
        ],
        notes: 'Karabük Şube saha aracı yakıt ikmali',
      };
    } else if (type === 'tech') {
      sampleData = {
        merchant: 'MediaMarkt Türkiye (Karabük AVM Şubesi)',
        branch: 'Karabük Şubesi',
        date: today,
        time: '19:20',
        totalAmount: 18500.00,
        currency: 'TRY',
        taxAmount: 3083.33,
        taxRate: 20,
        category: 'Elektronik & Donanım',
        docType: 'E-Fatura',
        docNumber: 'MM2026-00441',
        paymentMethod: 'Kredi Kartı',
        isUnusualExpense: true,
        unusualReason: '18.500 ₺ tutarında olağandışı yüksek teknoloji harcaması!',
        items: [
          { name: 'iPad Air 11 inç M2 128GB', quantity: 1, unitPrice: 18500, totalPrice: 18500 },
        ],
        notes: 'Karabük Şubesi saha çizim ve raporlama tableti',
      };
    } else {
      sampleData = {
        merchant: 'Turkcell İletişim Hizmetleri A.Ş.',
        branch: 'Karabük Şubesi',
        date: today,
        time: '10:00',
        totalAmount: 640.00,
        currency: 'TRY',
        taxAmount: 106.67,
        taxRate: 20,
        category: 'Fatura & Abonelikler',
        docType: 'Fatura',
        docNumber: 'FAT-TC-4402',
        paymentMethod: 'Banka Kartı',
        isUnusualExpense: false,
        items: [
          { name: 'Aylık Kurumsal Hat ve Fiber İnternet', quantity: 1, unitPrice: 640, totalPrice: 640 },
        ],
        notes: 'Karabük Şubesi sabit internet ve iletişim',
      };
    }

    setMerchant(sampleData.merchant);
    setBranch(sampleData.branch || 'Karabük Şubesi');
    setDate(sampleData.date);
    setTime(sampleData.time);
    setTotalAmount(sampleData.totalAmount);
    setCurrency(sampleData.currency);
    setTaxAmount(sampleData.taxAmount);
    setTaxRate(sampleData.taxRate);
    setCategory(sampleData.category as ExpenseCategory);
    setDocType(sampleData.docType as DocumentType);
    setDocNumber(sampleData.docNumber);
    setPaymentMethod(sampleData.paymentMethod as PaymentMethod);
    setIsUnusual(sampleData.isUnusualExpense);
    setUnusualReason(sampleData.unusualReason || '');
    setNotes(sampleData.notes);
    setItems(sampleData.items);
    setScanComplete(true);
    setSelectedImage('sample');
  };

  const handleSaveImmediately = async () => {
    if (!merchant || !totalAmount) {
      alert('Lütfen en az firma adı ve tutar bilgisini giriniz.');
      return;
    }

    setIsSaving(true);
    try {
      const isBranchMissing = !branch || branch.trim() === '' || branch === 'Belirtilmemiş';
      await onSaveReceipt({
        merchant,
        branch: isBranchMissing ? '' : branch.trim(),
        needsReview: isBranchMissing,
        reviewReason: isBranchMissing ? 'Şube bilgisi tespit edilemedi / belirtilmedi - Kullanıcı kontrolü bekleniyor' : undefined,
        date,
        time,
        totalAmount: Number(totalAmount),
        currency,
        taxAmount: taxAmount ? Number(taxAmount) : undefined,
        taxRate,
        category,
        docType,
        docNumber,
        paymentMethod,
        isUnusualExpense: isUnusual || Number(totalAmount) >= 4500,
        unusualReason: unusualReason || (Number(totalAmount) >= 4500 ? 'Yüksek tutarlı harcama tespiti' : undefined),
        notes,
        items,
        imageUrl: selectedImage && selectedImage !== 'sample' && !uploadedFileMeta?.fileType.includes('pdf') ? selectedImage : undefined,
        attachment: uploadedFileMeta && selectedImage && selectedImage !== 'sample' ? {
          fileName: uploadedFileMeta.fileName,
          fileType: uploadedFileMeta.fileType,
          fileSize: uploadedFileMeta.fileSize,
          fileData: selectedImage,
          uploadedAt: new Date().toISOString(),
        } : (selectedImage === 'sample' ? {
          fileName: `${docType.toLowerCase()}_${docNumber || 'ornek'}.${docType === 'E-Fatura' ? 'pdf' : 'jpg'}`,
          fileType: docType === 'E-Fatura' ? 'application/pdf' : 'image/jpeg',
          fileSize: 195000,
          uploadedAt: new Date().toISOString(),
        } : undefined),
      });
      onClose();
    } catch (e: any) {
      alert('Kaydedilirken hata oluştu: ' + e.message);
    } finally {
      setIsSaving(false);
    }
  };

  const handleQueueFor2100 = async () => {
    setIsSaving(true);
    try {
      await onQueueFor2100({
        name: merchant ? `${merchant} (${docType} - ${branch})` : `Fiş / Fatura (${docType} - ${branch})`,
        imageBase64: selectedImage && selectedImage !== 'sample' ? selectedImage : '',
        docType,
        branch: branch.trim() || 'Karabük Şubesi',
      });
      onClose();
    } catch (e: any) {
      alert('Kuyruğa eklenirken hata: ' + e.message);
    } finally {
      setIsSaving(false);
    }
  };

  const addItem = () => {
    setItems([...items, { name: 'Yeni Ürün/Kalem', quantity: 1, unitPrice: 0, totalPrice: 0 }]);
  };

  const removeItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index));
  };

  const updateItem = (index: number, field: keyof ReceiptItem, val: any) => {
    const next = [...items];
    next[index] = { ...next[index], [field]: val };
    if (field === 'quantity' || field === 'unitPrice') {
      const q = Number(next[index].quantity) || 1;
      const u = Number(next[index].unitPrice) || 0;
      next[index].totalPrice = Math.round(q * u * 100) / 100;
    }
    setItems(next);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-950/80 backdrop-blur-sm overflow-y-auto">
      <div className="bg-slate-900 border border-slate-800 w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden my-auto max-h-[95vh] flex flex-col text-slate-100">
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-900/90">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
              <Camera className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-1.5">
                OCR Fiş, Fatura & Makbuz Tarayıcı
                <span className="text-[10px] font-semibold bg-emerald-500/20 text-emerald-300 px-1.5 py-0.5 rounded">
                  Şube Destekli AI
                </span>
              </h2>
              <p className="text-xs text-slate-400">Şube tespiti ve otomatik kurumsal politika denetimi</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-4 sm:p-5 overflow-y-auto flex-1 space-y-4">
          {/* Upload and Capture Options */}
          {!scanComplete && !isScanning && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {/* Camera Trigger */}
                <label className="flex flex-col items-center justify-center p-5 border-2 border-dashed border-slate-700 hover:border-emerald-500/70 rounded-2xl bg-slate-800/40 hover:bg-slate-800/80 cursor-pointer transition group">
                  <input
                    ref={cameraInputRef}
                    type="file"
                    accept="image/*"
                    capture="environment"
                    className="hidden"
                    onChange={handleFileChange}
                  />
                  <div className="w-10 h-10 rounded-full bg-emerald-500/10 text-emerald-400 flex items-center justify-center mb-2 group-hover:scale-110 transition">
                    <Camera className="w-5 h-5" />
                  </div>
                  <span className="font-semibold text-xs text-slate-200">Kamera ile Çek</span>
                  <span className="text-[10px] text-slate-400 mt-0.5">Anlık Fotoğraf</span>
                </label>

                {/* Single File Upload Trigger */}
                <label className="flex flex-col items-center justify-center p-5 border-2 border-dashed border-slate-700 hover:border-emerald-500/70 rounded-2xl bg-slate-800/40 hover:bg-slate-800/80 cursor-pointer transition group">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*,application/pdf,.pdf"
                    className="hidden"
                    onChange={handleFileChange}
                  />
                  <div className="w-10 h-10 rounded-full bg-teal-500/10 text-teal-400 flex items-center justify-center mb-2 group-hover:scale-110 transition">
                    <Upload className="w-5 h-5" />
                  </div>
                  <span className="font-semibold text-xs text-slate-200">Tek Dosya Yükle</span>
                  <span className="text-[10px] text-slate-400 mt-0.5">PDF veya Fiş Görseli</span>
                </label>

                {/* Local Folder Batch Scanner Trigger */}
                <button
                  type="button"
                  onClick={() => {
                    if (onOpenFolderScanner) {
                      onClose();
                      onOpenFolderScanner();
                    }
                  }}
                  className="flex flex-col items-center justify-center p-5 border-2 border-dashed border-emerald-500/40 hover:border-emerald-400 rounded-2xl bg-emerald-950/20 hover:bg-emerald-900/30 cursor-pointer transition group"
                >
                  <div className="w-10 h-10 rounded-full bg-emerald-500/20 text-emerald-300 flex items-center justify-center mb-2 group-hover:scale-110 transition">
                    <FolderOpen className="w-5 h-5" />
                  </div>
                  <span className="font-semibold text-xs text-emerald-300">📁 Klasör Tara</span>
                  <span className="text-[10px] text-emerald-400/80 mt-0.5">Toplu Evrak/Fatura</span>
                </button>
              </div>

              {/* Sample Receipts Quick Selector */}
              <div className="pt-2 border-t border-slate-800">
                <p className="text-xs font-medium text-slate-400 mb-2 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                  Hemen Test Etmek İçin Örnek Belge Seçin:
                </p>
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
                  <button
                    type="button"
                    onClick={() => loadSampleReceipt('no_branch')}
                    className="col-span-2 sm:col-span-1 text-left p-2.5 rounded-lg bg-amber-950/40 hover:bg-amber-900/50 border border-amber-500/40 transition group"
                  >
                    <span className="text-xs font-bold text-amber-300 block flex items-center gap-1">
                      <HelpCircle className="w-3 h-3 text-amber-400" />
                      ❓ Şubesiz Fiş
                    </span>
                    <span className="text-[10px] text-amber-200/80 block mt-0.5">1.450 ₺ (Kontrol Edilecek)</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => loadSampleReceipt('tekel_rejected')}
                    className="col-span-2 sm:col-span-1 text-left p-2.5 rounded-lg bg-rose-950/40 hover:bg-rose-900/50 border border-rose-500/40 transition group"
                  >
                    <span className="text-xs font-bold text-rose-300 block flex items-center gap-1">
                      <AlertOctagon className="w-3 h-3 text-rose-400" />
                      🚫 Karabük Tekel
                    </span>
                    <span className="text-[10px] text-rose-200/80 block mt-0.5">685 ₺ (Kural İhlali / Red)</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => loadSampleReceipt('market')}
                    className="text-left p-2.5 rounded-lg bg-slate-800/60 hover:bg-slate-800 border border-slate-700/60 transition"
                  >
                    <span className="text-xs font-medium text-emerald-400 block">🛒 Migros</span>
                    <span className="text-[11px] text-slate-400 block">1.240,50 ₺ (Karabük)</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => loadSampleReceipt('fuel')}
                    className="text-left p-2.5 rounded-lg bg-slate-800/60 hover:bg-slate-800 border border-slate-700/60 transition"
                  >
                    <span className="text-xs font-medium text-blue-400 block">⛽ Shell Yakıt</span>
                    <span className="text-[11px] text-slate-400 block">2.200,00 ₺ (Karabük)</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => loadSampleReceipt('tech')}
                    className="text-left p-2.5 rounded-lg bg-slate-800/60 hover:bg-slate-800 border border-slate-700/60 transition"
                  >
                    <span className="text-xs font-medium text-purple-400 block">💻 iPad Tableti</span>
                    <span className="text-[11px] text-slate-400 block">18.500 ₺ (Olağandışı)</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => loadSampleReceipt('invoice')}
                    className="text-left p-2.5 rounded-lg bg-slate-800/60 hover:bg-slate-800 border border-slate-700/60 transition"
                  >
                    <span className="text-xs font-medium text-teal-400 block">⚡ Turkcell</span>
                    <span className="text-[11px] text-slate-400 block">640,00 ₺ (Fatura)</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Scanning Animation */}
          {isScanning && (
            <div className="py-12 flex flex-col items-center justify-center text-center space-y-4">
              <div className="relative w-36 h-48 border-2 border-emerald-500 rounded-xl bg-slate-800/80 flex items-center justify-center overflow-hidden shadow-lg shadow-emerald-500/10">
                <FileText className="w-16 h-16 text-slate-600" />
                <div className="absolute inset-x-0 h-1 bg-gradient-to-r from-transparent via-emerald-400 to-transparent animate-bounce shadow-sm shadow-emerald-400" />
              </div>
              <div>
                <p className="font-semibold text-sm text-emerald-400 flex items-center justify-center gap-1.5">
                  <Sparkles className="w-4 h-4 animate-spin text-emerald-300" />
                  Gemini OCR Şube ve Kalemleri Ayrıştırıyor...
                </p>
                <p className="text-xs text-slate-400 mt-1 max-w-sm">
                  Şube adı (Karabük vb.), yasaklı ürün kuralları ve KDV oranları otomatik denetleniyor
                </p>
              </div>
            </div>
          )}

          {errorMsg && (
            <div className="p-3 bg-rose-500/10 border border-rose-500/30 rounded-lg text-rose-300 text-xs flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* OCR Extracted Form - Editable */}
          {scanComplete && (
            <div className="space-y-4">
              <div className="flex items-center justify-between pb-2 border-b border-slate-800 flex-wrap gap-2">
                <div className="flex items-center gap-2 text-emerald-400 text-xs font-semibold">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>OCR Başarıyla Tamamlandı • Verileri İnceleyin</span>
                </div>

                {uploadedFileMeta && (
                  <span className="text-[11px] font-mono bg-slate-800 text-slate-300 px-2 py-0.5 rounded border border-slate-700 flex items-center gap-1.5">
                    <FileText className="w-3 h-3 text-teal-400" />
                    <span className="max-w-[160px] truncate">{uploadedFileMeta.fileName}</span>
                    <span className="text-slate-500">({(uploadedFileMeta.fileSize / 1024).toFixed(0)} KB)</span>
                  </span>
                )}

                <button
                  type="button"
                  onClick={() => {
                    setScanComplete(false);
                    setSelectedImage(null);
                    setUploadedFileMeta(null);
                  }}
                  className="text-xs text-slate-400 hover:text-slate-200 flex items-center gap-1"
                >
                  <RefreshCw className="w-3 h-3" /> Yeniden Tara
                </button>
              </div>

              {/* CRITICAL COMPLIANCE VIOLATION BANNER */}
              {compliance.isNonCompliant && (
                <div className="p-3.5 bg-rose-950/80 border-2 border-rose-500 rounded-xl text-rose-200 text-xs space-y-1.5 shadow-lg shadow-rose-950/40 animate-pulse">
                  <div className="flex items-center gap-2 text-rose-300 font-extrabold text-sm">
                    <ShieldAlert className="w-5 h-5 text-rose-400 shrink-0" />
                    <span>KURUMSAL POLİTİKA REDDİ: TEK ÜRÜN HATASI DAHİ BULUNSA FATURA KABUL EDİLEMEZ!</span>
                  </div>
                  <p className="text-xs text-rose-200 leading-relaxed">
                    Faturada onaylanmayan ürün tespit edildi:{' '}
                    <strong className="underline font-bold text-white">
                      {compliance.nonCompliantItems.join(', ')}
                    </strong>
                    . Şirket kuralı gereği, tek bir ürün yasaklı olsa bile 
                    <span className="font-extrabold text-rose-300"> faturanın tamamı kurumsal olarak reddedilir </span>
                    ve bütçe giderine yansıtılmadan 'Uygun Olmayan Faturalar' havuzunda karantinaya alınır.
                  </p>
                </div>
              )}

              {/* Unusual High Expense Banner */}
              {isUnusual && !compliance.isNonCompliant && (
                <div className="p-3 bg-amber-500/15 border border-amber-500/40 rounded-xl text-amber-200 text-xs flex items-start gap-2.5">
                  <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold text-amber-300 block">Olağandışı Yüksek Harcama Tespiti!</span>
                    <span>{unusualReason || 'Bu harcama günlük bütçenizin oldukça üzerinde görünüyor.'}</span>
                  </div>
                </div>
              )}

              {/* Branch Selector Banner */}
              <div className="bg-slate-800/80 border border-slate-700/80 rounded-xl p-3 space-y-2">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2.5">
                  <div className="flex items-center gap-2 text-xs">
                    <Building2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span className="font-semibold text-slate-200">Giderin Kaydedileceği Şube:</span>
                  </div>
                  <div className="flex items-center gap-2 w-full sm:w-auto">
                    <select
                      value={branch}
                      onChange={(e) => setBranch(e.target.value)}
                      className="bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-white font-semibold focus:outline-none focus:border-emerald-500 w-full sm:w-64"
                    >
                      <option value="">❓ Şube Belirtilmemiş (Kontrol Edilecekler)</option>
                      {branchesList.map((b) => (
                        <option key={b} value={b}>
                          {b}
                        </option>
                      ))}
                      {!branchesList.includes(branch) && branch && <option value={branch}>{branch}</option>}
                    </select>
                  </div>
                </div>

                {(!branch || branch.trim() === '') && (
                  <div className="text-[11px] text-amber-300 bg-amber-500/15 border border-amber-500/30 rounded-lg p-2.5 flex items-center gap-2">
                    <HelpCircle className="w-4 h-4 text-amber-400 shrink-0" />
                    <span>
                      <strong>Şube Belirtilmedi:</strong> Bu belge sisteme kaydedilecek fakat doğrudan bir şubeye atanmayıp <strong>'Kontrol Edilecekler'</strong> alanında tutulacaktır. Daha sonra ilgili şubeyi seçtiğinizde o şubenin bütçe ve kategorisine aktarılacaktır.
                    </span>
                  </div>
                )}
              </div>

              {/* Main Fields Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div>
                  <label className="block text-slate-400 mb-1 font-medium">Mağaza / Firma Adı</label>
                  <input
                    type="text"
                    value={merchant}
                    onChange={(e) => setMerchant(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-emerald-500 text-xs"
                    placeholder="Örn: Migros, Opet, Apple..."
                  />
                </div>

                <div>
                  <label className="block text-slate-400 mb-1 font-medium">Toplam Tutar (₺)</label>
                  <div className="relative">
                    <input
                      type="number"
                      step="0.01"
                      value={totalAmount}
                      onChange={(e) => {
                        const val = e.target.value;
                        setTotalAmount(val);
                        if (Number(val) > 4000) {
                          setIsUnusual(true);
                          setUnusualReason('4.000 ₺ üzeri yüksek tutarlı harcama');
                        }
                      }}
                      className="w-full bg-slate-800 border border-slate-700 rounded-lg pl-3 pr-12 py-2 text-white font-bold focus:outline-none focus:border-emerald-500 text-sm"
                      placeholder="0.00"
                    />
                    <span className="absolute right-3 top-2 text-slate-400 font-bold text-xs">TRY ₺</span>
                  </div>
                </div>

                <div>
                  <label className="block text-slate-400 mb-1 font-medium">Kategori</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value as ExpenseCategory)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-emerald-500 text-xs"
                  >
                    {CATEGORIES.map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-slate-400 mb-1 font-medium">Belge Türü</label>
                  <select
                    value={docType}
                    onChange={(e) => setDocType(e.target.value as DocumentType)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-emerald-500 text-xs"
                  >
                    {DOC_TYPES.map((t) => (
                      <option key={t} value={t}>
                        {t}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-slate-400 mb-1 font-medium">Tarih & Saat</label>
                  <div className="grid grid-cols-2 gap-2">
                    <input
                      type="date"
                      value={date}
                      onChange={(e) => setDate(e.target.value)}
                      className="w-full bg-slate-800 border border-slate-700 rounded-lg px-2 py-2 text-white focus:outline-none focus:border-emerald-500 text-xs"
                    />
                    <input
                      type="time"
                      value={time}
                      onChange={(e) => setTime(e.target.value)}
                      className="w-full bg-slate-800 border border-slate-700 rounded-lg px-2 py-2 text-white focus:outline-none focus:border-emerald-500 text-xs"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-slate-400 mb-1 font-medium">Ödeme Yöntemi</label>
                  <select
                    value={paymentMethod}
                    onChange={(e) => setPaymentMethod(e.target.value as PaymentMethod)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-emerald-500 text-xs"
                  >
                    {PAYMENT_METHODS.map((m) => (
                      <option key={m} value={m}>
                        {m}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-slate-400 mb-1 font-medium">KDV Tutarı & Oranı</label>
                  <div className="grid grid-cols-2 gap-2">
                    <input
                      type="number"
                      step="0.01"
                      value={taxAmount}
                      onChange={(e) => setTaxAmount(e.target.value)}
                      placeholder="KDV (₺)"
                      className="w-full bg-slate-800 border border-slate-700 rounded-lg px-2 py-2 text-white focus:outline-none focus:border-emerald-500 text-xs"
                    />
                    <select
                      value={taxRate}
                      onChange={(e) => setTaxRate(Number(e.target.value))}
                      className="w-full bg-slate-800 border border-slate-700 rounded-lg px-2 py-2 text-white focus:outline-none focus:border-emerald-500 text-xs"
                    >
                      <option value={1}>%1 KDV</option>
                      <option value={10}>%10 KDV</option>
                      <option value={20}>%20 KDV</option>
                      <option value={0}>%0 Muaf</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-slate-400 mb-1 font-medium">Fiş / Fatura No</label>
                  <input
                    type="text"
                    value={docNumber}
                    onChange={(e) => setDocNumber(e.target.value)}
                    placeholder="Örn: 004128"
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-emerald-500 text-xs"
                  />
                </div>
              </div>

              {/* Line items section */}
              <div className="pt-2">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-semibold text-slate-300">
                    Ayrıştırılan Kalemler ({items.length})
                  </span>
                  <button
                    type="button"
                    onClick={addItem}
                    className="text-[11px] text-emerald-400 hover:text-emerald-300 flex items-center gap-1"
                  >
                    <Plus className="w-3 h-3" /> Kalem Ekle
                  </button>
                </div>

                {items.length > 0 ? (
                  <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1">
                    {items.map((item, idx) => {
                      const isItemProhibited =
                        item.isProhibited ||
                        complianceRules.some((r) => item.name.toLowerCase().includes(r.keyword.toLowerCase()));

                      return (
                        <div
                          key={idx}
                          className={`flex items-center gap-2 p-1.5 rounded-lg text-xs border ${
                            isItemProhibited
                              ? 'bg-rose-950/60 border-rose-500/60 text-rose-200'
                              : 'bg-slate-800/70 border-slate-700/60'
                          }`}
                        >
                          <input
                            type="text"
                            value={item.name}
                            onChange={(e) => updateItem(idx, 'name', e.target.value)}
                            placeholder="Ürün adı"
                            className="flex-1 bg-transparent border-none text-slate-200 focus:outline-none text-xs"
                          />
                          {isItemProhibited && (
                            <span className="text-[10px] bg-rose-500 text-white font-bold px-1.5 py-0.2 rounded shrink-0">
                              YASAKLI
                            </span>
                          )}
                          <div className="flex items-center gap-1 w-24">
                            <input
                              type="number"
                              step="0.01"
                              value={item.totalPrice}
                              onChange={(e) => updateItem(idx, 'totalPrice', Number(e.target.value))}
                              className="w-full bg-slate-900 border border-slate-700 rounded px-1.5 py-0.5 text-right text-emerald-400 font-mono text-xs"
                            />
                            <span className="text-[10px] text-slate-400">₺</span>
                          </div>
                          <button
                            type="button"
                            onClick={() => removeItem(idx)}
                            className="text-slate-500 hover:text-rose-400 p-1"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <p className="text-[11px] text-slate-500 italic">Tek kalem genel toplam olarak işlendi.</p>
                )}
              </div>

              {/* Notes */}
              <div>
                <label className="block text-slate-400 mb-1 font-medium text-xs">Açıklama & Notlar</label>
                <input
                  type="text"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Gider gerekçesi veya muhasebe notu..."
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-emerald-500 text-xs"
                />
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer Actions */}
        {scanComplete && (
          <div className="p-4 border-t border-slate-800 bg-slate-900/90 flex flex-col sm:flex-row items-center justify-between gap-3">
            {/* 21:00 Queue button */}
            <button
              type="button"
              disabled={isSaving}
              onClick={handleQueueFor2100}
              className="w-full sm:w-auto flex items-center justify-center gap-2 text-xs font-medium text-amber-300 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 px-3.5 py-2.5 rounded-xl transition"
            >
              <Clock className="w-4 h-4 text-amber-400" />
              <span>Saat 21:00 Taramasına Ekle</span>
            </button>

            {/* Immediate Save button */}
            <button
              type="button"
              disabled={isSaving}
              onClick={handleSaveImmediately}
              className={`w-full sm:w-auto flex items-center justify-center gap-2 text-xs font-bold px-5 py-2.5 rounded-xl shadow-lg transition disabled:opacity-50 ${
                compliance.isNonCompliant
                  ? 'bg-rose-500 hover:bg-rose-600 text-white shadow-rose-500/20'
                  : 'bg-emerald-400 hover:bg-emerald-300 text-slate-950 shadow-emerald-500/20'
              }`}
            >
              {compliance.isNonCompliant ? (
                <>
                  <AlertOctagon className="w-4 h-4" />
                  <span>
                    {isSaving ? 'Kaydediliyor...' : "Faturayı 'Uygun Olmayan' Olarak Kaydet (Red)"}
                  </span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  <span>
                    {isSaving ? 'Şifrelenip Kaydediliyor...' : `${branch} Giderine Kaydet (Onaylı)`}
                  </span>
                </>
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
