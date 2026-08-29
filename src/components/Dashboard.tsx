import React, { useState } from 'react';
import { 
  Calendar, 
  Clock, 
  Video, 
  CheckCircle2, 
  AlertCircle, 
  Users, 
  Sparkles, 
  ChevronRight, 
  Phone, 
  Mail, 
  Filter, 
  ArrowUpRight, 
  PlusCircle, 
  Edit3, 
  Trash2,
  Share2,
  Building2,
  Award,
  Layers,
  PauseCircle,
  PlayCircle,
  UserCheck
} from 'lucide-react';
import { TrainingRecord, TrainingStatus, AppDropdownSettings } from '../types';
import { DEFAULT_DROPDOWN_SETTINGS } from '../data/initialTrainings';
import confetti from 'canvas-confetti';

interface DashboardProps {
  trainings: TrainingRecord[];
  onOpenAddModal: () => void;
  onOpenMeetModal: (training: TrainingRecord) => void;
  onUpdateStatus: (id: string, status: TrainingStatus) => void;
  onEdit: (training: TrainingRecord) => void;
  onDelete: (id: string) => void;
  searchQuery: string;
  settings?: AppDropdownSettings;
}

export const Dashboard: React.FC<DashboardProps> = ({
  trainings,
  onOpenAddModal,
  onOpenMeetModal,
  onUpdateStatus,
  onEdit,
  onDelete,
  searchQuery,
  settings = DEFAULT_DROPDOWN_SETTINGS
}) => {
  const pmList = settings.pms?.length ? settings.pms : DEFAULT_DROPDOWN_SETTINGS.pms;
  const trainerList = settings.assignedPersons?.length ? settings.assignedPersons : DEFAULT_DROPDOWN_SETTINGS.assignedPersons;
  const statusList = settings.statuses?.length ? settings.statuses : DEFAULT_DROPDOWN_SETTINGS.statuses;

  const [selectedTrainer, setSelectedTrainer] = useState<string>('All');
  const [selectedKam, setSelectedKam] = useState<string>('All');
  const [selectedStatus, setSelectedStatus] = useState<string>('All');

  // Helper to parse diverse date formats into YYYY-MM-DD
  const getNormalizedDateStr = (dateStr: string): string => {
    if (!dateStr) return '';
    const trimmed = dateStr.trim();
    if (!trimmed) return '';
    if (/^\d{4}-\d{2}-\d{2}/.test(trimmed)) {
      return trimmed.substring(0, 10);
    }
    const parts = trimmed.split(/[-/\s]+/);
    if (parts.length === 3) {
      let day = parts[0].padStart(2, '0');
      let monthStr = parts[1].toLowerCase();
      let year = parts[2];
      if (year.length === 2) year = '20' + year;
      
      const monthMap: Record<string, string> = {
        jan: '01', feb: '02', mar: '03', apr: '04', may: '05', jun: '06',
        jul: '07', aug: '08', sep: '09', oct: '10', nov: '11', dec: '12',
        '01':'01', '02':'02', '03':'03', '04':'04', '05':'05', '06':'06',
        '07':'07', '08':'08', '09':'09', '10':'10', '11':'11', '12':'12'
      };
      const month = monthMap[monthStr] || '01';
      return `${year}-${month}-${day}`;
    }
    const d = new Date(trimmed);
    if (!isNaN(d.getTime())) {
      const y = d.getFullYear();
      const m = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      return `${y}-${m}-${day}`;
    }
    return trimmed;
  };

  const getTodayISO = () => {
    const now = new Date();
    const y = now.getFullYear();
    const m = String(now.getMonth() + 1).padStart(2, '0');
    const d = String(now.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  };

  const todayISO = getTodayISO();

  const isToday = (dateStr: string) => {
    if (!dateStr) return false;
    const norm = getNormalizedDateStr(dateStr);
    return norm === todayISO || dateStr.toLowerCase().includes('today');
  };

  const isUpcoming = (dateStr: string) => {
    if (!dateStr) return false;
    if (isToday(dateStr)) return false;
    const norm = getNormalizedDateStr(dateStr);
    return norm > todayISO;
  };

  // Filter trainings
  const filteredList = trainings.filter(item => {
    if (selectedTrainer !== 'All' && item.assignedPerson !== selectedTrainer) return false;
    if (selectedKam !== 'All' && item.pm !== selectedKam) return false;
    if (selectedStatus !== 'All' && item.status !== selectedStatus) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      const matchName = item.clientName.toLowerCase().includes(q);
      const matchTicket = (item.ticketId || '').toLowerCase().includes(q);
      const matchTrainer = (item.assignedPerson || '').toLowerCase().includes(q);
      const matchKam = (item.pm || '').toLowerCase().includes(q);
      const matchPackage = (item.package || '').toLowerCase().includes(q);
      if (!matchName && !matchTicket && !matchTrainer && !matchKam && !matchPackage) return false;
    }
    return true;
  });

  const todayTrainings = filteredList.filter(item => isToday(item.trainingDate));
  const upcomingTrainings = filteredList.filter(item => isUpcoming(item.trainingDate));
  
  // KPI Metrics
  const totalCount = trainings.length;
  const doneCount = trainings.filter(t => t.status === 'Done').length;
  const holdCount = trainings.filter(t => t.status === 'Hold').length;
  const todoCount = trainings.filter(t => t.status === 'To-Do' || t.status === 'Ongoing').length;
  const todayTotalCount = trainings.filter(t => isToday(t.trainingDate)).length;

  const handleMarkDone = (id: string) => {
    onUpdateStatus(id, 'Done');
    confetti({ particleCount: 50, spread: 60, origin: { y: 0.7 } });
  };

  const getStatusBadge = (status: TrainingStatus) => {
    switch (status) {
      case 'Done':
        return <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">Done</span>;
      case 'Hold':
        return <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-amber-500/20 text-amber-300 border border-amber-500/30">Hold</span>;
      case 'To-Do':
        return <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-blue-500/20 text-blue-300 border border-blue-500/30">To-Do</span>;
      case 'Ongoing':
        return <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-purple-500/20 text-purple-300 border border-purple-500/30">Ongoing</span>;
      case 'Cancel':
      case 'W/O Cancle':
        return <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-rose-500/20 text-rose-300 border border-rose-500/30">Cancelled</span>;
      default:
        return <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-slate-700 text-slate-300">{status}</span>;
    }
  };

  return (
    <div className="space-y-6 pb-12">
      
      {/* Top Banner / Greeting */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-emerald-950/60 border border-slate-800 rounded-2xl p-6 shadow-xl relative overflow-hidden">
        <div className="absolute right-0 top-0 w-96 h-96 bg-emerald-500/5 rounded-full blur-3xl pointer-events-none" />
        
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="px-2.5 py-0.5 rounded-md bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-xs font-semibold flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
                Live Training Schedule
              </span>
              <span className="text-xs text-slate-400">
                Today: {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric', year: 'numeric' })}
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              Tipsoi HRM Training Dashboard
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 mt-1 max-w-2xl">
              Manage client training sessions, generate Google Meet links with customized invitations, and monitor trainer performance metrics in real-time.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={onOpenAddModal}
              className="px-4 py-2.5 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-slate-950 font-bold text-xs rounded-xl shadow-lg shadow-emerald-500/20 flex items-center gap-2 transition-all transform active:scale-95 cursor-pointer whitespace-nowrap"
            >
              <PlusCircle className="w-4 h-4" />
              <span>Schedule New Training</span>
            </button>
          </div>
        </div>
      </div>

      {/* KPI Metric Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Today Card */}
        <div className="bg-gradient-to-br from-emerald-950/40 via-slate-900 to-slate-900 border border-emerald-500/30 rounded-2xl p-4 shadow-lg hover:border-emerald-500/50 transition-all group">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-emerald-300 uppercase tracking-wider">Today's Training</span>
            <div className="w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
              <Calendar className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-extrabold text-white">{todayTotalCount}</span>
            <span className="text-xs text-emerald-400 font-medium">scheduled today</span>
          </div>
          <p className="text-[11px] text-slate-400 mt-1">Ready for meeting link generation</p>
        </div>

        {/* Upcoming Card */}
        <div className="bg-gradient-to-br from-blue-950/30 via-slate-900 to-slate-900 border border-blue-500/20 rounded-2xl p-4 shadow-lg hover:border-blue-500/40 transition-all group">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-blue-300 uppercase tracking-wider">Upcoming</span>
            <div className="w-8 h-8 rounded-lg bg-blue-500/20 text-blue-400 flex items-center justify-center">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-extrabold text-white">{upcomingTrainings.length}</span>
            <span className="text-xs text-blue-400 font-medium">pipeline</span>
          </div>
          <p className="text-[11px] text-slate-400 mt-1">Future confirmed sessions</p>
        </div>

        {/* Completed Card */}
        <div className="bg-gradient-to-br from-teal-950/30 via-slate-900 to-slate-900 border border-teal-500/20 rounded-2xl p-4 shadow-lg hover:border-teal-500/40 transition-all group">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-teal-300 uppercase tracking-wider">Completed (Done)</span>
            <div className="w-8 h-8 rounded-lg bg-teal-500/20 text-teal-400 flex items-center justify-center">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-extrabold text-white">{doneCount}</span>
            <span className="text-xs text-teal-400 font-medium">of {totalCount} total</span>
          </div>
          <p className="text-[11px] text-slate-400 mt-1">{totalCount > 0 ? `${Math.round((doneCount / totalCount) * 100)}% completion rate` : ''}</p>
        </div>

        {/* Hold / Pending Card */}
        <div className="bg-gradient-to-br from-amber-950/30 via-slate-900 to-slate-900 border border-amber-500/20 rounded-2xl p-4 shadow-lg hover:border-amber-500/40 transition-all group">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-amber-300 uppercase tracking-wider">Hold / To-Do</span>
            <div className="w-8 h-8 rounded-lg bg-amber-500/20 text-amber-400 flex items-center justify-center">
              <AlertCircle className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-extrabold text-white">{holdCount + todoCount}</span>
            <span className="text-xs text-amber-400 font-medium">need attention</span>
          </div>
          <p className="text-[11px] text-slate-400 mt-1">{holdCount} on hold, {todoCount} pending</p>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-900 border border-slate-800 p-3.5 rounded-xl text-xs">
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-emerald-400" />
          <span className="font-semibold text-slate-300">Filters:</span>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Trainer Filter */}
          <div className="flex items-center gap-1.5">
            <span className="text-slate-400">Trainer:</span>
            <select
              value={selectedTrainer}
              onChange={(e) => setSelectedTrainer(e.target.value)}
              className="bg-slate-800 text-slate-200 border border-slate-700 px-2.5 py-1 rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-500 text-xs cursor-pointer"
            >
              <option value="All">All Trainers</option>
              {trainerList.map((t) => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
          </div>

          {/* KAM/PM Filter */}
          <div className="flex items-center gap-1.5">
            <span className="text-slate-400">KAM/PM:</span>
            <select
              value={selectedKam}
              onChange={(e) => setSelectedKam(e.target.value)}
              className="bg-slate-800 text-slate-200 border border-slate-700 px-2.5 py-1 rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-500 text-xs cursor-pointer"
            >
              <option value="All">All KAM/PMs</option>
              {pmList.map((k) => (
                <option key={k} value={k}>{k}</option>
              ))}
            </select>
          </div>

          {/* Status Filter */}
          <div className="flex items-center gap-1.5">
            <span className="text-slate-400">Status:</span>
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="bg-slate-800 text-slate-200 border border-slate-700 px-2.5 py-1 rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-500 text-xs cursor-pointer"
            >
              <option value="All">All Statuses</option>
              {statusList.map((st) => (
                <option key={st} value={st}>{st}</option>
              ))}
            </select>
          </div>

          {(selectedTrainer !== 'All' || selectedKam !== 'All' || selectedStatus !== 'All') && (
            <button
              onClick={() => { setSelectedTrainer('All'); setSelectedKam('All'); setSelectedStatus('All'); }}
              className="text-xs text-rose-400 hover:underline"
            >
              Reset
            </button>
          )}
        </div>
      </div>

      {/* ======================================================== */}
      {/* SECTION 1: TODAY'S TRAININGS */}
      {/* ======================================================== */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-3 h-3 rounded-full bg-emerald-400 animate-ping" />
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <span>Today's Trainings</span>
              <span className="px-2 py-0.5 text-xs font-extrabold rounded-full bg-emerald-500 text-slate-950">
                {todayTrainings.length}
              </span>
            </h2>
          </div>
          <span className="text-xs text-slate-400 hidden sm:inline">
            Click 'Generate Training Link' to prepare client invitation
          </span>
        </div>

        {todayTrainings.length === 0 ? (
          <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-8 text-center space-y-3">
            <div className="w-12 h-12 rounded-full bg-slate-800 text-slate-400 flex items-center justify-center mx-auto">
              <Calendar className="w-6 h-6" />
            </div>
            <h3 className="text-sm font-semibold text-slate-200">No training sessions scheduled for today with current filters</h3>
            <p className="text-xs text-slate-400 max-w-md mx-auto">
              You can click "Schedule New Training" above to add a customer training session for today.
            </p>
            <button
              onClick={onOpenAddModal}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-emerald-400 text-xs font-semibold rounded-lg border border-slate-700 transition-colors"
            >
              <PlusCircle className="w-4 h-4" /> Add Today's Training
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {todayTrainings.map((item) => (
              <div 
                key={item.id}
                className="bg-slate-900 border border-slate-800 hover:border-emerald-500/40 rounded-2xl p-5 shadow-xl transition-all relative flex flex-col justify-between group"
              >
                <div>
                  {/* Top line with Time, Trainer and Status */}
                  <div className="flex items-center justify-between gap-2 mb-3">
                    <div className="flex items-center gap-2">
                      <span className="px-2.5 py-1 rounded-lg bg-emerald-500/10 text-emerald-300 border border-emerald-500/20 text-xs font-bold flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5 text-emerald-400" />
                        {item.trainingTime || 'Time TBD'}
                      </span>
                      {item.ticketId && (
                        <span className="px-2 py-0.5 rounded-md bg-slate-800 text-slate-300 text-[10px] font-mono border border-slate-700">
                          {item.ticketId}
                        </span>
                      )}
                    </div>
                    {getStatusBadge(item.status)}
                  </div>

                  {/* Client Name */}
                  <h3 className="text-base font-bold text-white group-hover:text-emerald-300 transition-colors flex items-center gap-2">
                    <Building2 className="w-4 h-4 text-slate-400" />
                    {item.clientName}
                  </h3>

                  {/* Details tags */}
                  <div className="grid grid-cols-2 gap-2 my-3 text-xs">
                    <div className="bg-slate-950/60 p-2 rounded-lg border border-slate-800">
                      <span className="text-[10px] uppercase font-bold text-slate-400 block">Trainer</span>
                      <span className="font-semibold text-emerald-300 flex items-center gap-1 mt-0.5">
                        <UserCheck className="w-3.5 h-3.5" />
                        {item.assignedPerson || 'Not Assigned'}
                      </span>
                    </div>

                    <div className="bg-slate-950/60 p-2 rounded-lg border border-slate-800">
                      <span className="text-[10px] uppercase font-bold text-slate-400 block">KAM / PM</span>
                      <span className="font-medium text-slate-200 truncate block mt-0.5">
                        {item.pm || 'Team'}
                      </span>
                    </div>
                  </div>

                  {/* Package & Remarks */}
                  <div className="space-y-1.5 text-xs text-slate-300">
                    <div className="flex items-center gap-1.5">
                      <span className="text-slate-400 text-[11px]">Package:</span>
                      <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-200 text-[11px] font-medium border border-slate-700">
                        {item.package}
                      </span>
                    </div>
                    {item.remarks && (
                      <p className="text-xs text-slate-400 bg-slate-950/40 p-2 rounded-lg border border-slate-800/80 italic">
                        "{item.remarks}"
                      </p>
                    )}
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="pt-4 mt-3 border-t border-slate-800/80 flex flex-wrap items-center justify-between gap-2">
                  
                  {/* GENERATE TRAINING LINK BUTTON (CRITICAL REQUEST) */}
                  <button
                    onClick={() => onOpenMeetModal(item)}
                    id={`generate-link-${item.id}`}
                    className="px-3 py-1.5 bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500 hover:from-emerald-400 hover:to-cyan-400 text-slate-950 font-bold text-xs rounded-xl shadow-md shadow-emerald-500/20 flex items-center gap-1.5 transition-all transform active:scale-95 cursor-pointer"
                  >
                    <Video className="w-4 h-4" />
                    <span>Generate Training Link</span>
                  </button>

                  <div className="flex items-center gap-1.5">
                    {item.status !== 'Done' && (
                      <button
                        onClick={() => handleMarkDone(item.id)}
                        title="Mark as Done"
                        className="p-1.5 rounded-lg text-emerald-400 hover:bg-emerald-500/20 hover:text-emerald-300 border border-emerald-500/30 transition-colors"
                      >
                        <CheckCircle2 className="w-4 h-4" />
                      </button>
                    )}
                    <button
                      onClick={() => onEdit(item)}
                      title="Edit details"
                      className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                    >
                      <Edit3 className="w-4 h-4" />
                    </button>
                  </div>

                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ======================================================== */}
      {/* SECTION 2: UPCOMING TRAININGS */}
      {/* ======================================================== */}
      <div className="space-y-3 pt-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <Clock className="w-5 h-5 text-blue-400" />
            <span>Upcoming Trainings</span>
            <span className="px-2 py-0.5 text-xs font-extrabold rounded-full bg-blue-500/20 text-blue-300 border border-blue-500/30">
              {upcomingTrainings.length}
            </span>
          </h2>
          <span className="text-xs text-slate-400">Scheduled for tomorrow and next days</span>
        </div>

        {upcomingTrainings.length === 0 ? (
          <div className="bg-slate-900/40 border border-slate-800 rounded-xl p-6 text-center text-xs text-slate-400">
            No upcoming trainings found matching the current filters.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
            {upcomingTrainings.map((item) => (
              <div 
                key={item.id}
                className="bg-slate-900/90 border border-slate-800 hover:border-slate-700 rounded-xl p-4 shadow-md flex flex-col justify-between transition-all hover:bg-slate-800/40"
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="px-2 py-0.5 rounded bg-blue-500/10 text-blue-300 border border-blue-500/20 text-[11px] font-semibold flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      {item.trainingDate}
                    </span>
                    <span className="text-[11px] font-medium text-slate-400 flex items-center gap-1">
                      <Clock className="w-3 h-3 text-slate-400" />
                      {item.trainingTime || 'TBD'}
                    </span>
                  </div>

                  <h4 className="text-sm font-bold text-white mb-2 truncate" title={item.clientName}>
                    {item.clientName}
                  </h4>

                  <div className="space-y-1 text-xs text-slate-300">
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="text-slate-400">Trainer:</span>
                      <span className="font-semibold text-emerald-300">{item.assignedPerson || '-'}</span>
                    </div>
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="text-slate-400">Package:</span>
                      <span className="text-slate-200 truncate max-w-[140px]">{item.package}</span>
                    </div>
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="text-slate-400">KAM/PM:</span>
                      <span className="text-slate-300">{item.pm || '-'}</span>
                    </div>
                  </div>
                </div>

                <div className="pt-3 mt-3 border-t border-slate-800 flex items-center justify-between gap-2">
                  <button
                    onClick={() => onOpenMeetModal(item)}
                    className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-emerald-300 border border-emerald-500/30 text-xs font-semibold rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <Video className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Generate Link</span>
                  </button>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => onEdit(item)}
                      title="Edit"
                      className="p-1 text-slate-400 hover:text-white"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => onDelete(item.id)}
                      title="Delete"
                      className="p-1 text-slate-500 hover:text-rose-400"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

    </div>
  );
};
