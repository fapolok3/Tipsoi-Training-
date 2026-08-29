/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Sidebar } from './components/Sidebar';
import { Navbar } from './components/Navbar';
import { Dashboard } from './components/Dashboard';
import { ClientList } from './components/ClientList';
import { Reports } from './components/Reports';
import { MeetLinkStudio } from './components/MeetLinkStudio';
import { Settings } from './components/Settings';
import { MeetLinkModal } from './components/MeetLinkModal';
import { AddClientModal } from './components/AddClientModal';
import { AuthModal } from './components/AuthModal';
import { ExcelUploadModal } from './components/ExcelUploadModal';
import { TrainingRecord, TrainingStatus, UserProfile, AppDropdownSettings } from './types';
import { DEFAULT_DROPDOWN_SETTINGS } from './data/initialTrainings';
import { 
  fetchTrainings, 
  saveTraining, 
  updateTrainingStatus, 
  deleteTrainingRecord,
  deleteMultipleTrainingRecords,
  fetchDropdownSettings,
  saveDropdownSettings,
  resetDropdownSettings
} from './services/trainingService';
import { auth, logoutUser } from './lib/firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { Loader2, RefreshCw, CheckCircle2, X } from 'lucide-react';

export default function App() {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'clients' | 'reports' | 'generator' | 'settings'>('dashboard');
  const [trainings, setTrainings] = useState<TrainingRecord[]>([]);
  const [dropdownSettings, setDropdownSettings] = useState<AppDropdownSettings>(DEFAULT_DROPDOWN_SETTINGS);
  const [loading, setLoading] = useState<boolean>(true);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [toastMessage, setToastMessage] = useState<{ title: string; desc?: string } | null>(null);

  const showToast = (title: string, desc?: string) => {
    setToastMessage({ title, desc });
    setTimeout(() => setToastMessage(null), 4000);
  };
  
  // Sidebar state
  const [isSidebarOpen, setIsSidebarOpen] = useState<boolean>(true);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState<boolean>(false);

  // Modals
  const [isAddModalOpen, setIsAddModalOpen] = useState<boolean>(false);
  const [editRecord, setEditRecord] = useState<TrainingRecord | null>(null);
  
  const [isMeetModalOpen, setIsMeetModalOpen] = useState<boolean>(false);
  const [selectedTrainingForMeet, setSelectedTrainingForMeet] = useState<TrainingRecord | null>(null);
  
  const [isAuthModalOpen, setIsAuthModalOpen] = useState<boolean>(false);
  const [isExcelModalOpen, setIsExcelModalOpen] = useState<boolean>(false);
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);

  const deduplicateList = (list: TrainingRecord[]): TrainingRecord[] => {
    const seen = new Set<string>();
    return list.filter(item => {
      if (!item || !item.id) return false;
      const key = String(item.id);
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  };

  // Load Data
  const loadData = async (isManualSync = false) => {
    if (isManualSync) setIsSyncing(true);
    else setLoading(true);

    try {
      const [trainingsData, settingsData] = await Promise.all([
        fetchTrainings(),
        fetchDropdownSettings()
      ]);
      setTrainings(deduplicateList(trainingsData));
      if (settingsData) {
        setDropdownSettings(settingsData);
      }
    } catch (err) {
      console.error('Error loading data:', err);
    } finally {
      setLoading(false);
      setIsSyncing(false);
    }
  };

  useEffect(() => {
    loadData();

    // Listen to Firebase Auth
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        setCurrentUser({
          uid: user.uid,
          email: user.email,
          displayName: user.displayName,
          photoURL: user.photoURL,
          role: 'admin'
        });
      }
    });

    return () => unsubscribe();
  }, []);

  // Handlers for Trainings
  const handleSaveTraining = async (record: Omit<TrainingRecord, 'id'> & { id?: string }) => {
    const saved = await saveTraining(record);
    setTrainings(prev => {
      const idx = prev.findIndex(item => item.id === saved.id);
      if (idx >= 0) {
        const next = [...prev];
        next[idx] = saved;
        return deduplicateList(next);
      }
      return deduplicateList([saved, ...prev]);
    });
    showToast('Success!', `Training record for "${saved.clientName}" saved successfully.`);
  };

  const handleBatchImportExcel = async (records: TrainingRecord[]) => {
    if (records.length === 0) return;
    const savedList: TrainingRecord[] = [];
    for (let i = 0; i < records.length; i++) {
      const rec = records[i];
      // Ensure absolute unique ID for imported record
      const uniqueId = `excel_${Date.now()}_${i}_${Math.random().toString(36).substring(2, 8)}_${Math.random().toString(36).substring(2, 8)}`;
      const saved = await saveTraining({ ...rec, id: uniqueId });
      savedList.push(saved);
    }
    setTrainings(prev => deduplicateList([...savedList, ...prev]));
    showToast('Import Successful! 🎉', `${records.length} client training records uploaded & synced successfully.`);
  };

  const handleUpdateStatus = async (id: string, status: TrainingStatus) => {
    await updateTrainingStatus(id, status);
    setTrainings(prev => prev.map(t => t.id === id ? { ...t, status } : t));
  };

  const handleDelete = async (id: string) => {
    setTrainings(prev => prev.filter(t => String(t.id) !== String(id)));
    await deleteTrainingRecord(String(id));
    showToast('Record Deleted', 'Training record was successfully deleted from Firebase.');
  };

  const handleBulkDelete = async (ids: string[]) => {
    if (ids.length === 0) return;
    const idSet = new Set(ids.map(String));
    setTrainings(prev => prev.filter(t => !idSet.has(String(t.id))));
    await deleteMultipleTrainingRecords(ids);
    showToast('Records Deleted', `${ids.length} training records were deleted successfully.`);
  };

  // Handlers for Dropdown Settings
  const handleUpdateDropdownSettings = async (newSettings: AppDropdownSettings) => {
    await saveDropdownSettings(newSettings);
    setDropdownSettings(newSettings);
  };

  const handleResetDropdownSettings = async () => {
    const reset = await resetDropdownSettings();
    setDropdownSettings(reset);
  };

  const handleOpenMeetModal = (training: TrainingRecord) => {
    setSelectedTrainingForMeet(training);
    setIsMeetModalOpen(true);
  };

  const handleSaveMeetLinkToRecord = async (id: string, link: string) => {
    const target = trainings.find(t => t.id === id);
    if (target) {
      const updated = { ...target, meetLink: link };
      await saveTraining(updated);
      setTrainings(prev => prev.map(t => t.id === id ? updated : t));
    }
  };

  const handleEditRecord = (training: TrainingRecord) => {
    setEditRecord(training);
    setIsAddModalOpen(true);
  };

  const handleCloseAddModal = () => {
    setIsAddModalOpen(false);
    setEditRecord(null);
  };

  const handleLogout = async () => {
    await logoutUser();
    setCurrentUser(null);
  };

  // Calculations for badges
  const todayISO = '2026-08-28';
  const todayCount = trainings.filter(t => 
    t.trainingDate === todayISO || t.trainingDate?.toLowerCase().includes('28-aug')
  ).length;

  const upcomingCount = trainings.filter(t => 
    (t.status === 'To-Do' || t.status === 'Ongoing') && !t.trainingDate?.toLowerCase().includes('28-aug')
  ).length;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans selection:bg-emerald-500 selection:text-slate-950 flex flex-col">
      
      {/* Slide Bar / Sidebar */}
      <Sidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onOpenAddModal={() => { setEditRecord(null); setIsAddModalOpen(true); }}
        todayCount={todayCount}
        upcomingCount={upcomingCount}
        totalCount={trainings.length}
        isOpen={isSidebarOpen}
        onToggle={() => setIsSidebarOpen(!isSidebarOpen)}
        isMobileOpen={isMobileSidebarOpen}
        onMobileClose={() => setIsMobileSidebarOpen(false)}
        user={currentUser}
      />

      {/* Main Content Area (offset by sidebar width on desktop) */}
      <div className={`flex-1 flex flex-col transition-all duration-300 ${
        isSidebarOpen ? 'md:pl-64' : 'md:pl-0'
      }`}>
        
        {/* Top Header */}
        <Navbar
          onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
          onOpenMobileSidebar={() => setIsMobileSidebarOpen(true)}
          onOpenAddModal={() => { setEditRecord(null); setIsAddModalOpen(true); }}
          onOpenAuthModal={() => setIsAuthModalOpen(true)}
          onOpenMeetStudio={() => setActiveTab('generator')}
          onOpenSettings={() => setActiveTab('settings')}
          user={currentUser}
          onLogout={handleLogout}
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          onSync={() => loadData(true)}
          isSyncing={isSyncing}
        />

        {/* Dynamic Page Views */}
        <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
          {loading ? (
            <div className="flex flex-col items-center justify-center min-h-[50vh] space-y-4">
              <Loader2 className="w-10 h-10 text-emerald-400 animate-spin" />
              <p className="text-sm font-semibold text-slate-300">Loading Tipsoi Training Portal Database...</p>
            </div>
          ) : (
            <>
              {activeTab === 'dashboard' && (
                <Dashboard
                  trainings={trainings}
                  onOpenAddModal={() => { setEditRecord(null); setIsAddModalOpen(true); }}
                  onOpenMeetModal={handleOpenMeetModal}
                  onUpdateStatus={handleUpdateStatus}
                  onEdit={handleEditRecord}
                  onDelete={handleDelete}
                  searchQuery={searchQuery}
                  settings={dropdownSettings}
                />
              )}

              {activeTab === 'clients' && (
                <ClientList
                  trainings={trainings}
                  onOpenAddModal={() => { setEditRecord(null); setIsAddModalOpen(true); }}
                  onOpenMeetModal={handleOpenMeetModal}
                  onUpdateStatus={handleUpdateStatus}
                  onEdit={handleEditRecord}
                  onDelete={handleDelete}
                  onBulkDelete={handleBulkDelete}
                  onOpenExcelModal={() => setIsExcelModalOpen(true)}
                  searchQuery={searchQuery}
                  settings={dropdownSettings}
                />
              )}

              {activeTab === 'reports' && (
                <Reports
                  trainings={trainings}
                  onOpenMeetModal={handleOpenMeetModal}
                />
              )}

              {activeTab === 'generator' && (
                <MeetLinkStudio
                  trainings={trainings}
                  onOpenAddModal={() => { setEditRecord(null); setIsAddModalOpen(true); }}
                />
              )}

              {activeTab === 'settings' && (
                <Settings
                  settings={dropdownSettings}
                  onUpdateSettings={handleUpdateDropdownSettings}
                  onResetSettings={handleResetDropdownSettings}
                />
              )}
            </>
          )}
        </main>

        {/* Footer */}
        <footer className="border-t border-slate-900 bg-slate-950/80 py-5 text-center text-xs text-slate-400 mt-auto">
          <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-3">
            <p>© {new Date().getFullYear()} Tipsoi HRM Training &amp; Support System. All rights reserved.</p>
            <div className="flex items-center gap-3">
              <button 
                onClick={() => loadData(true)}
                className="text-slate-400 hover:text-emerald-400 transition-colors flex items-center gap-1.5 cursor-pointer"
                title="Refresh database"
              >
                <RefreshCw className={`w-3 h-3 ${isSyncing ? 'animate-spin' : ''}`} /> Refresh Data
              </button>
            </div>
          </div>
        </footer>

      </div>

      {/* Modals */}
      <MeetLinkModal
        isOpen={isMeetModalOpen}
        onClose={() => setIsMeetModalOpen(false)}
        training={selectedTrainingForMeet}
        onSaveMeetLink={handleSaveMeetLinkToRecord}
      />

      <AddClientModal
        isOpen={isAddModalOpen}
        onClose={handleCloseAddModal}
        onSave={handleSaveTraining}
        editRecord={editRecord}
        settings={dropdownSettings}
      />

      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        onLoginSuccess={(user) => setCurrentUser(user)}
      />

      <ExcelUploadModal
        isOpen={isExcelModalOpen}
        onClose={() => setIsExcelModalOpen(false)}
        onImportSuccess={handleBatchImportExcel}
      />

      {/* Global Success Notification Toast */}
      {toastMessage && (
        <div className="fixed top-6 right-6 z-50 flex items-start gap-3 p-4 rounded-2xl bg-slate-900 border-2 border-emerald-500/80 shadow-2xl shadow-emerald-950/80 max-w-md animate-bounce-short">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400 shrink-0">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <div className="flex-1 pr-2">
            <h4 className="text-base font-bold text-emerald-400">{toastMessage.title}</h4>
            {toastMessage.desc && (
              <p className="text-xs text-slate-200 mt-1 leading-relaxed">{toastMessage.desc}</p>
            )}
          </div>
          <button
            onClick={() => setToastMessage(null)}
            type="button"
            className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

    </div>
  );
}
