import React, { useState, useEffect } from 'react';
import {
  Receipt as ReceiptIcon,
  Clock,
  PieChart,
  Target,
  Bell,
  Cloud,
  Camera,
  Plus,
  ShieldCheck,
  Smartphone,
  Calendar,
  Building2,
  AlertOctagon,
  Sliders,
  HelpCircle,
  FolderOpen,
  Paperclip,
} from 'lucide-react';
import { Header } from './components/Header';
import { ReceiptsList } from './components/ReceiptsList';
import { OCRScannerModal } from './components/OCRScannerModal';
import { BatchQueue2100 } from './components/BatchQueue2100';
import { MonthlyReportsView } from './components/MonthlyReportsView';
import { BudgetAnalyticsView } from './components/BudgetAnalyticsView';
import { MorningNotificationModal } from './components/MorningNotificationModal';
import { AnnualBackupModal } from './components/AnnualBackupModal';
import { BranchesView } from './components/BranchesView';
import { NeedsReviewView } from './components/NeedsReviewView';
import { NonCompliantInvoicesView } from './components/NonCompliantInvoicesView';
import { CompliancePolicySettingsView } from './components/CompliancePolicySettingsView';
import { DocumentAttachmentModal } from './components/DocumentAttachmentModal';
import { BatchFolderScannerModal } from './components/BatchFolderScannerModal';
import { Receipt, MonthlyReport, DailySummary, SystemStatus, DocumentType, BranchInfo, ExpenseCategory } from './types';

export default function App() {
  const [activeTab, setActiveTab] = useState<
    'receipts' | 'branches' | 'needs_review' | 'non_compliant' | 'rules' | 'batch2100' | 'monthly' | 'budget'
  >('receipts');
  const [receipts, setReceipts] = useState<Receipt[]>([]);
  const [branches, setBranches] = useState<BranchInfo[]>([]);
  const [queueItems, setQueueItems] = useState<any[]>([]);
  const [monthlyReport, setMonthlyReport] = useState<MonthlyReport | null>(null);
  const [dailySummary, setDailySummary] = useState<DailySummary | null>(null);
  const [systemStatus, setSystemStatus] = useState<SystemStatus | null>(null);
  const [currentMonth, setCurrentMonth] = useState(() => new Date().toISOString().substring(0, 7));
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [branchFilterForReceipts, setBranchFilterForReceipts] = useState<string>('Tümü');
  const [scannerInitialBranch, setScannerInitialBranch] = useState<string>('Karabük Şubesi');

  // Modals
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [isNotificationModalOpen, setIsNotificationModalOpen] = useState(false);
  const [isCloudModalOpen, setIsCloudModalOpen] = useState(false);
  const [selectedReceiptForAttachment, setSelectedReceiptForAttachment] = useState<Receipt | null>(null);
  const [isFolderScannerOpen, setIsFolderScannerOpen] = useState(false);

  // Initial Data Load
  const fetchData = async () => {
    try {
      setRefreshing(true);
      const safeFetchJson = async (url: string) => {
        try {
          const res = await fetch(url);
          const ct = res.headers.get('content-type') || '';
          if (ct.includes('application/json')) {
            return await res.json();
          }
          return { success: false, notJson: true };
        } catch {
          return { success: false };
        }
      };

      const [recRes, queueRes, monthRes, dailyRes, sysRes, branchRes] = await Promise.all([
        safeFetchJson('/api/receipts'),
        safeFetchJson('/api/receipts/queue'),
        safeFetchJson(`/api/reports/monthly?month=${currentMonth}`),
        safeFetchJson('/api/reports/daily-summary'),
        safeFetchJson('/api/system/status'),
        safeFetchJson('/api/branches'),
      ]);

      if (recRes.success) setReceipts(recRes.data || []);
      if (queueRes.success) setQueueItems(queueRes.data || []);
      if (monthRes.success) setMonthlyReport(monthRes.data || null);
      if (dailyRes.success) setDailySummary(dailyRes.data || null);
      if (sysRes) setSystemStatus(sysRes);
      if (branchRes?.success && branchRes.data) setBranches(branchRes.data);
    } catch (e) {
      console.error('Error fetching data:', e);
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [currentMonth]);

  // Handle Save Receipt from OCR
  const handleSaveReceipt = async (receiptData: Partial<Receipt>) => {
    const res = await fetch('/api/receipts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(receiptData),
    });
    const data = await res.json();
    if (data.success) {
      await fetchData();
    } else {
      throw new Error(data.error || 'Fiş kaydedilemedi');
    }
  };

  // Handle Delete Receipt
  const handleDeleteReceipt = async (id: string) => {
    const res = await fetch(`/api/receipts/${id}`, { method: 'DELETE' });
    const data = await res.json();
    if (data.success) {
      setReceipts((prev) => prev.filter((r) => r.id !== id));
      fetchData();
    }
  };

  // Handle Add to 21:00 Queue
  const handleQueueFor2100 = async (item: { name: string; imageBase64: string; docType: DocumentType; branch?: string }) => {
    const res = await fetch('/api/receipts/queue', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(item),
    });
    const data = await res.json();
    if (data.success) {
      await fetchData();
    } else {
      throw new Error(data.error || 'Kuyruğa eklenemedi');
    }
  };

  // Run 21:00 Batch Process
  const handleRunBatch2100 = async () => {
    const res = await fetch('/api/receipts/run-batch-2100', { method: 'POST' });
    const data = await res.json();
    if (data.success) {
      await fetchData();
    } else {
      throw new Error(data.error || 'Toplu tarama başarısız');
    }
  };

  // Handle Assign Single Receipt to Branch
  const handleAssignBranch = async (id: string, branch: string, category?: ExpenseCategory, notes?: string) => {
    const res = await fetch(`/api/receipts/${id}/assign-branch`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ branch, category, notes }),
    });
    const data = await res.json();
    if (!data.success) {
      throw new Error(data.error || 'Şube ataması yapılamadı');
    }
    await fetchData();
  };

  // Handle Batch Assign Receipts to Branch
  const handleBatchAssignBranch = async (ids: string[], branch: string) => {
    const res = await fetch('/api/receipts/batch-assign-branch', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ids, branch }),
    });
    const data = await res.json();
    if (!data.success) {
      throw new Error(data.error || 'Toplu şube ataması yapılamadı');
    }
    await fetchData();
  };

  const rejectedReceiptsCount = receipts.filter(
    (r) => r.isNonCompliant || r.approvalStatus === 'rejected'
  ).length;

  const needsReviewCount = receipts.filter(
    (r) => r.needsReview || !r.branch || r.branch === 'Belirtilmemiş' || r.branch === 'Şube Belirtilmemiş'
  ).length;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col antialiased selection:bg-emerald-500 selection:text-slate-950">
      {/* Top Header */}
      <Header
        systemStatus={systemStatus}
        onOpenNotifications={() => setIsNotificationModalOpen(true)}
        onOpenCloudSync={() => setIsCloudModalOpen(true)}
        onOpen2100Queue={() => setActiveTab('batch2100')}
        pendingQueueCount={queueItems.length}
        hasUnusualSpendToday={Boolean(dailySummary?.hasUnusualExpense)}
        refreshing={refreshing}
        onRefresh={fetchData}
      />

      {/* Main Container */}
      <main className="flex-1 max-w-6xl w-full mx-auto px-3 sm:px-6 py-4 sm:py-6 pb-24 md:pb-8 space-y-4">
        {/* Navigation Tabs (Desktop & Tablet) */}
        <div className="flex items-center justify-between border-b border-slate-800/80 pb-2">
          <div className="flex items-center gap-1 sm:gap-2 overflow-x-auto no-scrollbar py-0.5">
            <button
              onClick={() => {
                setBranchFilterForReceipts('Tümü');
                setActiveTab('receipts');
              }}
              className={`flex items-center gap-1.5 sm:gap-2 px-3 py-2 rounded-xl text-xs sm:text-sm font-semibold transition whitespace-nowrap ${
                activeTab === 'receipts'
                  ? 'bg-slate-800 text-white border border-slate-700 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
              }`}
            >
              <ReceiptIcon className="w-4 h-4 text-emerald-400" />
              <span>Fişler & Faturalar</span>
              <span className="text-[10px] bg-slate-900 text-slate-400 px-1.5 py-0.5 rounded-full font-mono">
                {receipts.length}
              </span>
            </button>

            {/* Corporate Branches Tab */}
            <button
              onClick={() => setActiveTab('branches')}
              className={`flex items-center gap-1.5 sm:gap-2 px-3 py-2 rounded-xl text-xs sm:text-sm font-semibold transition whitespace-nowrap ${
                activeTab === 'branches'
                  ? 'bg-slate-800 text-white border border-slate-700 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
              }`}
            >
              <Building2 className="w-4 h-4 text-blue-400" />
              <span>Tüm Şubeler</span>
              <span className="text-[10px] bg-blue-500/20 text-blue-300 px-1.5 py-0.5 rounded-full font-mono">
                Türkiye
              </span>
            </button>

            {/* Needs Review / Unassigned Branch Tab */}
            <button
              onClick={() => setActiveTab('needs_review')}
              className={`flex items-center gap-1.5 sm:gap-2 px-3 py-2 rounded-xl text-xs sm:text-sm font-semibold transition whitespace-nowrap ${
                activeTab === 'needs_review'
                  ? 'bg-amber-950/70 text-amber-200 border border-amber-500/50 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
              }`}
            >
              <HelpCircle className="w-4 h-4 text-amber-400" />
              <span>Kontrol Edilecekler</span>
              {needsReviewCount > 0 ? (
                <span className="text-[10px] bg-amber-500 text-slate-950 font-black px-1.5 py-0.2 rounded-full shadow-sm">
                  {needsReviewCount}
                </span>
              ) : (
                <span className="text-[10px] bg-slate-800 text-slate-400 px-1.5 py-0.5 rounded-full font-mono">
                  0
                </span>
              )}
            </button>

            {/* Non-Compliant / Rejected Tab */}
            <button
              onClick={() => setActiveTab('non_compliant')}
              className={`flex items-center gap-1.5 sm:gap-2 px-3 py-2 rounded-xl text-xs sm:text-sm font-semibold transition whitespace-nowrap ${
                activeTab === 'non_compliant'
                  ? 'bg-rose-950/60 text-rose-200 border border-rose-500/50 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
              }`}
            >
              <AlertOctagon className="w-4 h-4 text-rose-400" />
              <span>Uygun Olmayan Faturalar</span>
              {rejectedReceiptsCount > 0 && (
                <span className="text-[10px] bg-rose-500 text-white font-bold px-1.5 py-0.2 rounded-full animate-pulse">
                  {rejectedReceiptsCount}
                </span>
              )}
            </button>

            {/* Compliance Policy Settings Tab */}
            <button
              onClick={() => setActiveTab('rules')}
              className={`flex items-center gap-1.5 sm:gap-2 px-3 py-2 rounded-xl text-xs sm:text-sm font-semibold transition whitespace-nowrap ${
                activeTab === 'rules'
                  ? 'bg-slate-800 text-white border border-slate-700 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
              }`}
            >
              <Sliders className="w-4 h-4 text-amber-400" />
              <span>Kural Yönetimi</span>
            </button>

            <button
              onClick={() => setActiveTab('batch2100')}
              className={`flex items-center gap-1.5 sm:gap-2 px-3 py-2 rounded-xl text-xs sm:text-sm font-semibold transition whitespace-nowrap ${
                activeTab === 'batch2100'
                  ? 'bg-slate-800 text-white border border-slate-700 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
              }`}
            >
              <Clock className="w-4 h-4 text-amber-400" />
              <span>21:00 Tarama</span>
              {queueItems.length > 0 && (
                <span className="text-[10px] bg-amber-500/20 text-amber-300 border border-amber-500/40 px-1.5 py-0.5 rounded-full font-bold">
                  {queueItems.length}
                </span>
              )}
            </button>

            <button
              onClick={() => setActiveTab('monthly')}
              className={`flex items-center gap-1.5 sm:gap-2 px-3 py-2 rounded-xl text-xs sm:text-sm font-semibold transition whitespace-nowrap ${
                activeTab === 'monthly'
                  ? 'bg-slate-800 text-white border border-slate-700 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
              }`}
            >
              <PieChart className="w-4 h-4 text-teal-400" />
              <span>Aylık Rapor & PDF</span>
            </button>

            <button
              onClick={() => setActiveTab('budget')}
              className={`flex items-center gap-1.5 sm:gap-2 px-3 py-2 rounded-xl text-xs sm:text-sm font-semibold transition whitespace-nowrap ${
                activeTab === 'budget'
                  ? 'bg-slate-800 text-white border border-slate-700 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
              }`}
            >
              <Target className="w-4 h-4 text-indigo-400" />
              <span>Bütçe & Analiz</span>
              {dailySummary?.hasUnusualExpense && (
                <span className="w-2 h-2 rounded-full bg-rose-500"></span>
              )}
            </button>
          </div>

          {/* Quick Scanner Actions in Desktop */}
          <div className="hidden sm:flex items-center gap-2 shrink-0">
            <button
              onClick={() => setIsFolderScannerOpen(true)}
              className="flex items-center gap-1.5 bg-slate-800 hover:bg-slate-700 text-emerald-300 border border-emerald-500/40 text-xs font-semibold px-3 py-2 rounded-xl transition"
              title="Bilgisayarınızdaki klasörün içindeki tüm evrakları (PDF ve görselleri) toplu tarayın"
            >
              <FolderOpen className="w-4 h-4 text-emerald-400" />
              <span>📁 Klasör Tara</span>
            </button>

            <button
              onClick={() => {
                setScannerInitialBranch('Karabük Şubesi');
                setIsScannerOpen(true);
              }}
              className="flex items-center gap-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-bold px-4 py-2 rounded-xl shadow-md shadow-emerald-500/20 transition"
            >
              <Camera className="w-4 h-4" />
              <span>Yeni Fiş / Fatura Tara</span>
            </button>
          </div>
        </div>

        {/* Tab Contents */}
        {isLoading ? (
          <div className="py-20 text-center space-y-3">
            <div className="w-10 h-10 border-2 border-emerald-400 border-t-transparent rounded-full animate-spin mx-auto" />
            <p className="text-xs text-slate-400">Şifreli kurumsal veritabanından fişler ve şubeler yükleniyor...</p>
          </div>
        ) : (
          <div>
            {activeTab === 'receipts' && (
              <ReceiptsList
                receipts={receipts}
                onDeleteReceipt={handleDeleteReceipt}
                onOpenScanner={() => setIsScannerOpen(true)}
                initialBranchFilter={branchFilterForReceipts}
                onNavigateToReview={() => setActiveTab('needs_review')}
                onViewAttachment={(r) => setSelectedReceiptForAttachment(r)}
                onOpenFolderScanner={() => setIsFolderScannerOpen(true)}
              />
            )}

            {activeTab === 'branches' && (
              <BranchesView
                receipts={receipts}
                onSelectBranchFilter={(branchName) => {
                  setBranchFilterForReceipts(branchName);
                  setActiveTab('receipts');
                }}
                onOpenScannerForBranch={(branchName) => {
                  setScannerInitialBranch(branchName);
                  setIsScannerOpen(true);
                }}
                onNavigateToReview={() => setActiveTab('needs_review')}
              />
            )}

            {activeTab === 'needs_review' && (
              <NeedsReviewView
                receipts={receipts}
                branches={branches}
                onAssignBranch={handleAssignBranch}
                onBatchAssignBranch={handleBatchAssignBranch}
                onDeleteReceipt={handleDeleteReceipt}
                onOpenScanner={() => setIsScannerOpen(true)}
                onRefresh={fetchData}
                onNavigateToBranches={() => setActiveTab('branches')}
                onViewAttachment={(r) => setSelectedReceiptForAttachment(r)}
                onOpenFolderScanner={() => setIsFolderScannerOpen(true)}
              />
            )}

            {activeTab === 'non_compliant' && (
              <NonCompliantInvoicesView
                receipts={receipts}
                onDeleteReceipt={handleDeleteReceipt}
                onOpenComplianceSettings={() => setActiveTab('rules')}
                onViewAttachment={(r) => setSelectedReceiptForAttachment(r)}
              />
            )}

            {activeTab === 'rules' && (
              <CompliancePolicySettingsView
                onRulesUpdated={() => fetchData()}
              />
            )}

            {activeTab === 'batch2100' && (
              <BatchQueue2100
                queueItems={queueItems}
                lastBatchRun={systemStatus?.batch2100.lastRunAt || new Date().toISOString()}
                onRunBatch={handleRunBatch2100}
                receipts={receipts}
                monthlyReport={monthlyReport}
              />
            )}

            {activeTab === 'monthly' && (
              <MonthlyReportsView
                monthlyReport={monthlyReport}
                receipts={receipts}
                currentMonth={currentMonth}
                onChangeMonth={(m) => setCurrentMonth(m)}
              />
            )}

            {activeTab === 'budget' && (
              <BudgetAnalyticsView
                monthlyReport={monthlyReport}
                receipts={receipts}
              />
            )}
          </div>
        )}
      </main>

      {/* Floating Action Button (Mobile First) */}
      <div className="fixed bottom-16 right-4 sm:bottom-6 sm:right-6 z-40">
        <button
          onClick={() => {
            setScannerInitialBranch('Karabük Şubesi');
            setIsScannerOpen(true);
          }}
          className="flex items-center gap-2 bg-gradient-to-r from-emerald-400 to-teal-400 hover:from-emerald-300 hover:to-teal-300 text-slate-950 font-bold text-xs sm:text-sm px-4 py-3 sm:px-5 sm:py-3.5 rounded-2xl shadow-xl shadow-emerald-500/25 transition transform hover:scale-105 active:scale-95"
        >
          <Camera className="w-5 h-5" />
          <span className="font-extrabold tracking-tight">Fiş / Fatura Tara (OCR)</span>
        </button>
      </div>

      {/* Mobile Bottom Navigation Bar */}
      <div className="md:hidden fixed bottom-0 inset-x-0 bg-slate-900/95 backdrop-blur-md border-t border-slate-800 z-30 px-2 py-1.5 flex items-center justify-around text-[10px]">
        <button
          onClick={() => {
            setBranchFilterForReceipts('Tümü');
            setActiveTab('receipts');
          }}
          className={`flex flex-col items-center gap-1 p-1.5 rounded-lg transition ${
            activeTab === 'receipts' ? 'text-emerald-400 font-bold' : 'text-slate-400'
          }`}
        >
          <ReceiptIcon className="w-4 h-4" />
          <span>Fişler</span>
        </button>

        <button
          onClick={() => setActiveTab('branches')}
          className={`flex flex-col items-center gap-1 p-1.5 rounded-lg transition ${
            activeTab === 'branches' ? 'text-blue-400 font-bold' : 'text-slate-400'
          }`}
        >
          <Building2 className="w-4 h-4" />
          <span>Şubeler</span>
        </button>

        <button
          onClick={() => setActiveTab('needs_review')}
          className={`flex flex-col items-center gap-1 p-1.5 rounded-lg transition relative ${
            activeTab === 'needs_review' ? 'text-amber-400 font-bold' : 'text-slate-400'
          }`}
        >
          <HelpCircle className="w-4 h-4" />
          <span>Kontrol</span>
          {needsReviewCount > 0 && (
            <span className="absolute top-0 right-1 w-2 h-2 bg-amber-500 rounded-full" />
          )}
        </button>

        <button
          onClick={() => setActiveTab('non_compliant')}
          className={`flex flex-col items-center gap-1 p-1.5 rounded-lg transition relative ${
            activeTab === 'non_compliant' ? 'text-rose-400 font-bold' : 'text-slate-400'
          }`}
        >
          <AlertOctagon className="w-4 h-4" />
          <span>Uygunsuz</span>
          {rejectedReceiptsCount > 0 && (
            <span className="absolute top-0 right-1 w-2 h-2 bg-rose-500 rounded-full animate-ping" />
          )}
        </button>

        <button
          onClick={() => setActiveTab('batch2100')}
          className={`flex flex-col items-center gap-1 p-1.5 rounded-lg transition relative ${
            activeTab === 'batch2100' ? 'text-amber-400 font-bold' : 'text-slate-400'
          }`}
        >
          <Clock className="w-4 h-4" />
          <span>21:00 Kuyruk</span>
          {queueItems.length > 0 && (
            <span className="absolute top-0 right-1 w-2 h-2 bg-amber-500 rounded-full" />
          )}
        </button>

        <button
          onClick={() => setActiveTab('monthly')}
          className={`flex flex-col items-center gap-1 p-1.5 rounded-lg transition ${
            activeTab === 'monthly' ? 'text-teal-400 font-bold' : 'text-slate-400'
          }`}
        >
          <PieChart className="w-4 h-4" />
          <span>Rapor</span>
        </button>
      </div>

      {/* Modals */}
      <OCRScannerModal
        isOpen={isScannerOpen}
        onClose={() => setIsScannerOpen(false)}
        onSaveReceipt={handleSaveReceipt}
        onQueueFor2100={handleQueueFor2100}
        initialBranch={scannerInitialBranch}
      />

      <MorningNotificationModal
        isOpen={isNotificationModalOpen}
        onClose={() => setIsNotificationModalOpen(false)}
        dailySummary={dailySummary}
      />

      <AnnualBackupModal
        isOpen={isCloudModalOpen}
        onClose={() => setIsCloudModalOpen(false)}
        receipts={receipts}
      />

      <DocumentAttachmentModal
        receipt={selectedReceiptForAttachment}
        onClose={() => setSelectedReceiptForAttachment(null)}
      />

      <BatchFolderScannerModal
        isOpen={isFolderScannerOpen}
        onClose={() => setIsFolderScannerOpen(false)}
        onBatchComplete={() => {
          fetchData();
        }}
      />
    </div>
  );
}
