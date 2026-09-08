import React, { useState } from 'react';
import {
  X,
  Download,
  ExternalLink,
  FileText,
  Image as ImageIcon,
  ZoomIn,
  ZoomOut,
  RotateCw,
  Building2,
  Calendar,
  CreditCard,
  AlertOctagon,
  HelpCircle,
  CheckCircle2,
  Receipt as ReceiptIcon,
} from 'lucide-react';
import { Receipt } from '../types';

interface DocumentAttachmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  receipt: Receipt | null;
}

export const DocumentAttachmentModal: React.FC<DocumentAttachmentModalProps> = ({
  isOpen,
  onClose,
  receipt,
}) => {
  const [zoom, setZoom] = useState<number>(100);
  const [rotation, setRotation] = useState<number>(0);

  if (!isOpen || !receipt) return null;

  const attachment = receipt.attachment;
  const isPdf =
    attachment?.fileType === 'application/pdf' ||
    attachment?.fileName?.toLowerCase().endsWith('.pdf') ||
    attachment?.fileData?.startsWith('data:application/pdf');

  const hasRawFile = Boolean(attachment?.fileData || receipt.imageUrl);
  const fileData = attachment?.fileData || receipt.imageUrl || '';
  const fileName =
    attachment?.fileName ||
    (isPdf
      ? `fatura_${receipt.docNumber || receipt.id}.pdf`
      : `fis_${receipt.docNumber || receipt.id}.jpg`);

  const fileSizeStr = attachment?.fileSize
    ? `${(attachment.fileSize / 1024).toFixed(1)} KB`
    : 'Belge Eki';

  const isRejected = receipt.isNonCompliant || receipt.approvalStatus === 'rejected';
  const isNeedsReview =
    receipt.needsReview ||
    !receipt.branch ||
    receipt.branch === 'Belirtilmemiş' ||
    receipt.branch === 'Şube Belirtilmemiş';

  // Trigger file download
  const handleDownload = () => {
    if (fileData && fileData.startsWith('data:')) {
      const link = document.createElement('a');
      link.href = fileData;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } else {
      // Generate printable digital voucher for download
      const printContent = `
        <!DOCTYPE html>
        <html>
        <head>
          <title>${fileName}</title>
          <style>
            body { font-family: monospace; padding: 24px; max-width: 450px; margin: auto; border: 1px dashed #ccc; }
            h2 { text-align: center; margin-bottom: 4px; }
            .center { text-align: center; font-size: 12px; }
            .divider { border-top: 1px dashed #333; margin: 12px 0; }
            .row { display: flex; justify-content: space-between; font-size: 13px; margin: 4px 0; }
            .bold { font-weight: bold; }
            .total { font-size: 16px; font-weight: bold; }
          </style>
        </head>
        <body>
          <h2>${receipt.merchant}</h2>
          <div class="center">${receipt.branch || 'Şube Belirtilmemiş'}</div>
          <div class="center">${receipt.docType} No: ${receipt.docNumber || receipt.id}</div>
          <div class="center">Tarih: ${receipt.date} ${receipt.time || ''}</div>
          <div class="divider"></div>
          ${(receipt.items || [])
            .map(
              (it) => `
            <div class="row">
              <span>${it.name} ${it.quantity > 1 ? `(${it.quantity}x)` : ''}</span>
              <span>₺${Number(it.totalPrice).toFixed(2)}</span>
            </div>
          `
            )
            .join('')}
          <div class="divider"></div>
          <div class="row">
            <span>KDV Tutarı:</span>
            <span>₺${Number(receipt.taxAmount || 0).toFixed(2)}</span>
          </div>
          <div class="row total">
            <span>TOPLAM TUTAR:</span>
            <span>₺${Number(receipt.totalAmount).toFixed(2)}</span>
          </div>
          <div class="divider"></div>
          <div class="center">Ödeme: ${receipt.paymentMethod}</div>
          <div class="center" style="margin-top: 8px; font-size: 10px;">GİB E-ARŞİV / ELEKTRONİK DÖKÜM ASLI</div>
        </body>
        </html>
      `;
      const blob = new Blob([printContent], { type: 'text/html' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${fileName}.html`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    }
  };

  const handleOpenNewWindow = () => {
    if (fileData && fileData.startsWith('data:')) {
      const win = window.open();
      if (win) {
        if (isPdf) {
          win.document.write(
            `<iframe src="${fileData}" frameborder="0" style="border:0; top:0; left:0; bottom:0; right:0; width:100%; height:100%;" allowfullscreen></iframe>`
          );
        } else {
          win.document.write(
            `<img src="${fileData}" style="max-width:100%; display:block; margin:auto;" />`
          );
        }
      }
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-950/85 backdrop-blur-md animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-700/80 rounded-2xl w-full max-w-4xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Header Bar */}
        <div className="flex items-center justify-between px-4 sm:px-6 py-3.5 border-b border-slate-800 bg-slate-950/60">
          <div className="flex items-center gap-3 min-w-0">
            <div
              className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border ${
                isPdf
                  ? 'bg-rose-500/15 border-rose-500/40 text-rose-400'
                  : 'bg-teal-500/15 border-teal-500/40 text-teal-400'
              }`}
            >
              {isPdf ? <FileText className="w-5 h-5" /> : <ImageIcon className="w-5 h-5" />}
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h3 className="text-sm sm:text-base font-bold text-white truncate max-w-[220px] sm:max-w-md">
                  {fileName}
                </h3>
                <span
                  className={`text-[10px] font-bold px-2 py-0.5 rounded-full border uppercase ${
                    isPdf
                      ? 'bg-rose-500/20 text-rose-300 border-rose-500/30'
                      : 'bg-teal-500/20 text-teal-300 border-teal-500/30'
                  }`}
                >
                  {isPdf ? 'PDF Belgesi' : 'Görsel / Resim'}
                </span>
                <span className="text-[11px] text-slate-400 font-mono hidden sm:inline">
                  ({fileSizeStr})
                </span>
              </div>
              <p className="text-xs text-slate-400 truncate mt-0.5">
                {receipt.merchant} • {receipt.date} • ₺
                {Number(receipt.totalAmount).toLocaleString('tr-TR', { minimumFractionDigits: 2 })}
              </p>
            </div>
          </div>

          {/* Controls & Close */}
          <div className="flex items-center gap-2">
            {!isPdf && hasRawFile && (
              <div className="hidden sm:flex items-center bg-slate-800 border border-slate-700 rounded-lg p-0.5">
                <button
                  onClick={() => setZoom((z) => Math.max(50, z - 25))}
                  className="p-1.5 text-slate-400 hover:text-white transition"
                  title="Küçült"
                >
                  <ZoomOut className="w-4 h-4" />
                </button>
                <span className="text-[11px] font-mono text-slate-300 px-1.5">{zoom}%</span>
                <button
                  onClick={() => setZoom((z) => Math.min(200, z + 25))}
                  className="p-1.5 text-slate-400 hover:text-white transition"
                  title="Büyüt"
                >
                  <ZoomIn className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setRotation((r) => (r + 90) % 360)}
                  className="p-1.5 text-slate-400 hover:text-white transition border-l border-slate-700 ml-1"
                  title="Döndür"
                >
                  <RotateCw className="w-4 h-4" />
                </button>
              </div>
            )}

            {fileData && (
              <button
                onClick={handleOpenNewWindow}
                className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-300 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg transition"
                title="Ayrı Sekmede Aç"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                <span>Yeni Sekme</span>
              </button>
            )}

            <button
              onClick={handleDownload}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-emerald-300 bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/30 rounded-lg transition shadow-sm"
              title="Orijinal Formatında İndir"
            >
              <Download className="w-3.5 h-3.5" />
              <span>İndir</span>
            </button>

            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-lg transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-auto p-4 sm:p-6 bg-slate-950 flex flex-col items-center justify-center min-h-[380px]">
          {isPdf && fileData ? (
            <div className="w-full h-[620px] rounded-xl overflow-hidden border border-slate-800 bg-slate-900 shadow-inner flex flex-col">
              <iframe
                src={fileData}
                title={fileName}
                className="w-full h-full border-0 rounded-xl"
              />
            </div>
          ) : !isPdf && fileData ? (
            <div className="w-full max-h-[620px] overflow-auto flex items-center justify-center p-2">
              <img
                src={fileData}
                alt={fileName}
                style={{
                  transform: `scale(${zoom / 100}) rotate(${rotation}deg)`,
                  transition: 'transform 0.15s ease-out',
                }}
                className="max-h-[580px] max-w-full rounded-lg object-contain border border-slate-800 shadow-xl"
              />
            </div>
          ) : (
            /* Digital Structured Voucher Preview for records without raw file */
            <div className="w-full max-w-md bg-white text-slate-900 rounded-xl p-6 shadow-2xl font-mono text-xs border border-slate-300">
              <div className="text-center pb-3 border-b-2 border-dashed border-slate-400">
                <div className="font-bold text-base tracking-wider">{receipt.merchant}</div>
                <div className="text-[11px] text-slate-600 font-sans mt-0.5">
                  {receipt.branch || 'Şube Belirtilmemiş'}
                </div>
                <div className="text-[10px] text-slate-500 mt-1">
                  T.C. Hazine ve Maliye Bakanlığı e-Belge Dökümü
                </div>
                <div className="text-[11px] font-semibold mt-1">
                  {receipt.docType} No: {receipt.docNumber || receipt.id}
                </div>
              </div>

              <div className="py-2.5 border-b border-dashed border-slate-300 text-[11px] space-y-1">
                <div className="flex justify-between">
                  <span className="text-slate-500">Tarih & Saat:</span>
                  <span>
                    {receipt.date} {receipt.time || ''}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Ödeme Yolu:</span>
                  <span>{receipt.paymentMethod}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Kategori:</span>
                  <span className="font-sans font-medium">{receipt.category}</span>
                </div>
              </div>

              <div className="py-3 border-b-2 border-dashed border-slate-400 space-y-2">
                <div className="font-bold text-[11px] text-slate-700 flex justify-between pb-1 border-b border-slate-200">
                  <span>ÜRÜN / HİZMET ADI</span>
                  <span>TUTAR (TL)</span>
                </div>
                {(receipt.items && receipt.items.length > 0 ? receipt.items : [
                  { name: 'Kurumsal Harcama Kalemi', quantity: 1, unitPrice: receipt.totalAmount, totalPrice: receipt.totalAmount }
                ]).map((item, i) => (
                  <div key={i} className="flex justify-between text-[11px]">
                    <div className="pr-2">
                      <span className="font-semibold">{item.name}</span>
                      {item.quantity && item.quantity > 1 && (
                        <span className="text-slate-500 ml-1">({item.quantity} adet)</span>
                      )}
                    </div>
                    <span className="font-bold shrink-0">
                      ₺{Number(item.totalPrice).toFixed(2)}
                    </span>
                  </div>
                ))}
              </div>

              <div className="pt-3 space-y-1.5">
                <div className="flex justify-between text-[11px] text-slate-600">
                  <span>KDV (%{receipt.taxRate || 10}):</span>
                  <span>₺{Number(receipt.taxAmount || 0).toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-base font-extrabold text-slate-950 pt-1 border-t border-slate-300">
                  <span>TOPLAM:</span>
                  <span>₺{Number(receipt.totalAmount).toLocaleString('tr-TR', { minimumFractionDigits: 2 })}</span>
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-dashed border-slate-300 text-center text-[10px] text-slate-500 space-y-0.5">
                <div>Kayıt ID: {receipt.id}</div>
                <div>Şifrelenmiş Mali Arşiv Kaydı</div>
              </div>
            </div>
          )}
        </div>

        {/* Footer Info Bar */}
        <div className="px-4 sm:px-6 py-3 border-t border-slate-800 bg-slate-950/80 flex items-center justify-between flex-wrap gap-2 text-xs">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5 text-slate-400">
              <Building2 className="w-3.5 h-3.5 text-emerald-400" />
              <span>Şube: <strong className="text-white">{receipt.branch || 'Belirtilmemiş'}</strong></span>
            </div>

            {isRejected ? (
              <span className="text-rose-400 flex items-center gap-1 font-semibold">
                <AlertOctagon className="w-3.5 h-3.5" />
                Kurumsal Politika Reddi
              </span>
            ) : isNeedsReview ? (
              <span className="text-amber-400 flex items-center gap-1 font-semibold">
                <HelpCircle className="w-3.5 h-3.5" />
                Şube Ataması Bekleniyor
              </span>
            ) : (
              <span className="text-emerald-400 flex items-center gap-1 font-semibold">
                <CheckCircle2 className="w-3.5 h-3.5" />
                Şube Onaylı
              </span>
            )}
          </div>

          <div className="text-[11px] text-slate-500 font-mono">
            {attachment?.fileType || (isPdf ? 'application/pdf' : 'image/jpeg')} • Orijinal Belge Eki
          </div>
        </div>
      </div>
    </div>
  );
};
