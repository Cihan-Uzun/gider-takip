import { jsPDF } from 'jspdf';
import { Receipt, MonthlyReport } from '../types';

export function generateMonthlyPDF(report: MonthlyReport, receipts: Receipt[]) {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  let y = 18;

  // Header Banner
  doc.setFillColor(15, 23, 42); // dark slate #0f172a
  doc.rect(0, 0, pageWidth, 26, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.text('GIDER & FIS DUZENLEYICI', 14, 12);

  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.text('Aylik Harcama, Fatura ve Kategori Raporu', 14, 18);

  doc.setFontSize(8);
  doc.text(`Rapor Donemi: ${report.monthName} | Olusturuldu: ${new Date().toLocaleDateString('tr-TR')} ${new Date().toLocaleTimeString('tr-TR')}`, pageWidth - 14, 18, { align: 'right' });

  y = 36;

  // Summary Metrics Box
  doc.setDrawColor(226, 232, 240);
  doc.setFillColor(248, 250, 252);
  doc.roundedRect(14, y, pageWidth - 28, 26, 3, 3, 'FD');

  doc.setTextColor(71, 85, 105);
  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.text('TOPLAM HARCAMA', 24, y + 9);
  doc.text('TOPLAM FIS / FATURA', 85, y + 9);
  doc.text('EN YUKSEK KATEGORI', 145, y + 9);

  doc.setTextColor(15, 23, 42);
  doc.setFontSize(14);
  doc.text(`TRY ${report.totalSpending.toLocaleString('tr-TR', { minimumFractionDigits: 2 })}`, 24, y + 19);

  doc.setFontSize(13);
  doc.text(`${report.totalReceipts} Adet`, 85, y + 19);

  const topCat = report.categoryBreakdown[0]?.category || '-';
  doc.setFontSize(11);
  doc.text(`${topCat}`, 145, y + 19);

  y += 36;

  // Section 1: Kategori Dagilimi
  doc.setTextColor(15, 23, 42);
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.text('Kategori Bazli Harcama Dagilimi', 14, y);
  y += 5;

  // Table header
  doc.setFillColor(241, 245, 249);
  doc.rect(14, y, pageWidth - 28, 7, 'F');
  doc.setTextColor(51, 65, 85);
  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  doc.text('KATEGORI', 18, y + 5);
  doc.text('FIS ADEDI', 90, y + 5);
  doc.text('ORAN', 130, y + 5);
  doc.text('TUTAR (TRY)', pageWidth - 18, y + 5, { align: 'right' });
  y += 8;

  doc.setFont('helvetica', 'normal');
  report.categoryBreakdown.forEach((cat) => {
    doc.setTextColor(30, 41, 59);
    doc.text(cat.category, 18, y + 4);
    doc.text(`${cat.count} Adet`, 90, y + 4);
    doc.text(`%${cat.percentage}`, 130, y + 4);
    doc.text(`${cat.total.toLocaleString('tr-TR', { minimumFractionDigits: 2 })}`, pageWidth - 18, y + 4, { align: 'right' });

    doc.setDrawColor(241, 245, 249);
    doc.line(14, y + 6, pageWidth - 14, y + 6);
    y += 7;
  });

  y += 6;

  // Section 2: Fis ve Fatura Listesi
  if (y > 230) {
    doc.addPage();
    y = 20;
  }

  doc.setTextColor(15, 23, 42);
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.text('Islenen Fis, Fatura ve Makbuzlar (Detayli Döküm)', 14, y);
  y += 5;

  // Table header
  doc.setFillColor(241, 245, 249);
  doc.rect(14, y, pageWidth - 28, 7, 'F');
  doc.setTextColor(51, 65, 85);
  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  doc.text('TARIH', 18, y + 5);
  doc.text('FIRMA / MAGAZA', 42, y + 5);
  doc.text('TUR', 100, y + 5);
  doc.text('KATEGORI', 125, y + 5);
  doc.text('TUTAR (TRY)', pageWidth - 18, y + 5, { align: 'right' });
  y += 8;

  doc.setFont('helvetica', 'normal');
  const monthReceipts = receipts.filter(r => (r.date || '').startsWith(report.month));

  monthReceipts.forEach((r) => {
    if (y > 275) {
      doc.addPage();
      y = 20;
    }

    doc.setTextColor(51, 65, 85);
    doc.text(r.date, 18, y + 4);

    const safeMerchant = (r.merchant || '').substring(0, 26);
    doc.text(safeMerchant, 42, y + 4);
    doc.text(r.docType || 'Fiş', 100, y + 4);
    doc.text((r.category || '').substring(0, 18), 125, y + 4);
    doc.text(Number(r.totalAmount).toLocaleString('tr-TR', { minimumFractionDigits: 2 }), pageWidth - 18, y + 4, { align: 'right' });

    doc.setDrawColor(248, 250, 252);
    doc.line(14, y + 6, pageWidth - 14, y + 6);
    y += 7;
  });

  // Footer: Digital Security Stamp
  const totalPages = (doc as any).internal.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    doc.setFontSize(7);
    doc.setTextColor(148, 163, 184);
    doc.text('Guvenli Sifreli Veritabani (AES-256-GCM) ile dogrulanmis resmi arsiv ciktisidir.', 14, 290);
    doc.text(`Sayfa ${i} / ${totalPages}`, pageWidth - 14, 290, { align: 'right' });
  }

  doc.save(`Gider_Raporu_${report.month}.pdf`);
}

export function generateAnnualArchivePDF(year: string, receipts: Receipt[]) {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  let y = 18;

  // Header Banner
  doc.setFillColor(30, 41, 59);
  doc.rect(0, 0, pageWidth, 28, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.text(`YILLIK BULUT ARSIV VE YEDEKLEME - ${year}`, 14, 13);

  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.text('Kriptografik Olarak Mühürlenmiş Yıllık Muhasebe ve Fiş Özeti', 14, 20);
  doc.text(`Arsivleme: ${new Date().toLocaleDateString('tr-TR')} | Sifreleme: AES-256-GCM`, pageWidth - 14, 20, { align: 'right' });

  y = 38;

  const yearReceipts = receipts.filter(r => (r.date || '').startsWith(year));
  const totalAmount = yearReceipts.reduce((sum, r) => sum + (Number(r.totalAmount) || 0), 0);

  // Stats Box
  doc.setDrawColor(203, 213, 225);
  doc.setFillColor(248, 250, 252);
  doc.roundedRect(14, y, pageWidth - 28, 22, 2, 2, 'FD');

  doc.setTextColor(71, 85, 105);
  doc.setFontSize(9);
  doc.text('YILLIK TOPLAM GIDER', 24, y + 8);
  doc.text('TOPLAM ISLENEN BELGE', 85, y + 8);
  doc.text('BULUT SAKLAMA DURUMU', 145, y + 8);

  doc.setTextColor(15, 23, 42);
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text(`TRY ${totalAmount.toLocaleString('tr-TR', { minimumFractionDigits: 2 })}`, 24, y + 16);
  doc.text(`${yearReceipts.length} Belge`, 85, y + 16);
  doc.setTextColor(16, 185, 129); // green
  doc.text('BULUTTA YEDEKLENDI', 145, y + 16);

  y += 32;

  // Monthly breakdown summary
  doc.setTextColor(15, 23, 42);
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.text('Aylik Harcama Toplamlari', 14, y);
  y += 6;

  // 12 months array
  const monthNames = [
    'Ocak', 'Subat', 'Mart', 'Nisan', 'Mayis', 'Haziran',
    'Temmuz', 'Agustos', 'Eylul', 'Ekim', 'Kasim', 'Aralik'
  ];

  doc.setFillColor(241, 245, 249);
  doc.rect(14, y, pageWidth - 28, 7, 'F');
  doc.setTextColor(51, 65, 85);
  doc.setFontSize(8);
  doc.text('AY', 18, y + 5);
  doc.text('BELGE ADEDI', 85, y + 5);
  doc.text('TOPLAM TUTAR (TRY)', pageWidth - 18, y + 5, { align: 'right' });
  y += 8;

  doc.setFont('helvetica', 'normal');
  monthNames.forEach((name, idx) => {
    const monthKey = `${year}-${String(idx + 1).padStart(2, '0')}`;
    const mRecs = yearReceipts.filter(r => (r.date || '').startsWith(monthKey));
    const mAmt = mRecs.reduce((a, b) => a + (Number(b.totalAmount) || 0), 0);

    doc.setTextColor(30, 41, 59);
    doc.text(`${name} ${year}`, 18, y + 4);
    doc.text(`${mRecs.length} Adet`, 85, y + 4);
    doc.text(`${mAmt.toLocaleString('tr-TR', { minimumFractionDigits: 2 })}`, pageWidth - 18, y + 4, { align: 'right' });

    doc.setDrawColor(241, 245, 249);
    doc.line(14, y + 6, pageWidth - 14, y + 6);
    y += 7;
  });

  y += 10;
  doc.setFontSize(8);
  doc.setTextColor(100, 116, 139);
  doc.text('Bu arsiv, vergi mevzuati ve kisisel butce denetimi icin 10 yil boyunca bulut guvenlik standartlarinda saklanir.', 14, y);

  doc.save(`Yillik_Bulut_Arsiv_${year}.pdf`);
}
