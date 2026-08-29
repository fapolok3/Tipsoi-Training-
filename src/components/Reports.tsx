import React, { useState } from 'react';
import { 
  BarChart3, 
  Award, 
  CheckCircle2, 
  TrendingUp, 
  Download, 
  Users, 
  Package, 
  PieChart, 
  Calendar, 
  UserCheck, 
  Layers, 
  Sparkles,
  ArrowUpRight,
  Filter,
  FileSpreadsheet
} from 'lucide-react';
import { TrainingRecord, TrainerMetric } from '../types';

interface ReportsProps {
  trainings: TrainingRecord[];
  onOpenMeetModal: (training: TrainingRecord) => void;
}

export const Reports: React.FC<ReportsProps> = ({ trainings, onOpenMeetModal }) => {
  const [timeFilter, setTimeFilter] = useState<'all' | 'month' | 'year'>('all');
  const [selectedTrainerDetail, setSelectedTrainerDetail] = useState<string | null>(null);

  // Compute Trainer metrics
  const trainerMap = new Map<string, TrainerMetric>();

  trainings.forEach(t => {
    const trainerName = t.assignedPerson?.trim() || 'Unassigned';
    if (!trainerMap.has(trainerName)) {
      trainerMap.set(trainerName, {
        name: trainerName,
        total: 0,
        done: 0,
        hold: 0,
        todo: 0,
        ongoing: 0,
        cancelled: 0
      });
    }

    const metric = trainerMap.get(trainerName)!;
    metric.total += 1;
    if (t.status === 'Done') metric.done += 1;
    else if (t.status === 'Hold') metric.hold += 1;
    else if (t.status === 'To-Do') metric.todo += 1;
    else if (t.status === 'Ongoing') metric.ongoing += 1;
    else if (t.status === 'Cancel' || t.status === 'W/O Cancle') metric.cancelled += 1;
  });

  const trainerMetrics = Array.from(trainerMap.values()).sort((a, b) => b.done - a.done);

  // Compute KAM / PM metrics
  const kamMap = new Map<string, { name: string; total: number; done: number; hold: number }>();
  trainings.forEach(t => {
    const kam = t.pm?.trim() || 'Unassigned';
    if (!kamMap.has(kam)) {
      kamMap.set(kam, { name: kam, total: 0, done: 0, hold: 0 });
    }
    const k = kamMap.get(kam)!;
    k.total += 1;
    if (t.status === 'Done') k.done += 1;
    else if (t.status === 'Hold') k.hold += 1;
  });
  const kamMetrics = Array.from(kamMap.values()).sort((a, b) => b.total - a.total);

  // Compute Package Distribution
  const packageMap = new Map<string, number>();
  trainings.forEach(t => {
    const pkg = t.package?.trim() || 'Other';
    packageMap.set(pkg, (packageMap.get(pkg) || 0) + 1);
  });
  const packageMetrics = Array.from(packageMap.entries()).sort((a, b) => b[1] - a[1]);

  // Overall Totals
  const totalTrainings = trainings.length;
  const totalDone = trainings.filter(t => t.status === 'Done').length;
  const totalHold = trainings.filter(t => t.status === 'Hold').length;
  const totalTodo = trainings.filter(t => t.status === 'To-Do' || t.status === 'Ongoing').length;
  const totalCancel = trainings.filter(t => t.status === 'Cancel' || t.status === 'W/O Cancle').length;
  const completionRate = totalTrainings > 0 ? Math.round((totalDone / totalTrainings) * 100) : 0;

  // Export CSV function
  const handleExportCSV = () => {
    const headers = ['Client Name', 'Ticket ID', 'Trainer', 'KAM/PM', 'Package', 'Training Date', 'Training Time', 'Status', 'Meet Link', 'Remarks'];
    const rows = trainings.map(t => [
      `"${t.clientName.replace(/"/g, '""')}"`,
      `"${(t.ticketId || '').replace(/"/g, '""')}"`,
      `"${(t.assignedPerson || '').replace(/"/g, '""')}"`,
      `"${(t.pm || '').replace(/"/g, '""')}"`,
      `"${(t.package || '').replace(/"/g, '""')}"`,
      `"${t.trainingDate || ''}"`,
      `"${t.trainingTime || ''}"`,
      `"${t.status || ''}"`,
      `"${t.meetLink || ''}"`,
      `"${(t.remarks || '').replace(/"/g, '""')}"`
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `tipsoi_training_report_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6 pb-12">
      
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-indigo-950/50 border border-slate-800 rounded-2xl p-6 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded-md bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 text-xs font-semibold flex items-center gap-1.5">
              <BarChart3 className="w-3.5 h-3.5 text-indigo-400" />
              Executive Training Analytics
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            Training &amp; Trainer Performance Report
          </h1>
          <p className="text-xs sm:text-sm text-slate-300 mt-1">
            Total training breakdown, trainer delivery leaderboard, package metrics, and status analytics.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={handleExportCSV}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-semibold rounded-xl flex items-center gap-2 transition-all shadow-md cursor-pointer"
          >
            <Download className="w-4 h-4 text-emerald-400" />
            <span>Export CSV Report</span>
          </button>
        </div>
      </div>

      {/* Primary KPI Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        
        {/* Total Training Given */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg">
          <div className="flex items-center justify-between text-xs text-slate-400 font-semibold mb-2">
            <span>TOTAL TRAININGS</span>
            <div className="w-7 h-7 rounded-lg bg-indigo-500/10 text-indigo-400 flex items-center justify-center">
              <Layers className="w-4 h-4" />
            </div>
          </div>
          <div className="text-3xl font-extrabold text-white">{totalTrainings}</div>
          <p className="text-[11px] text-slate-400 mt-1">Total recorded client sessions</p>
        </div>

        {/* Successfully Completed */}
        <div className="bg-slate-900 border border-emerald-500/20 rounded-2xl p-5 shadow-lg">
          <div className="flex items-center justify-between text-xs text-emerald-400 font-semibold mb-2">
            <span>COMPLETED (DONE)</span>
            <div className="w-7 h-7 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="text-3xl font-extrabold text-emerald-400">{totalDone}</div>
          <p className="text-[11px] text-slate-400 mt-1">{completionRate}% of all sessions delivered</p>
        </div>

        {/* Hold Count */}
        <div className="bg-slate-900 border border-amber-500/20 rounded-2xl p-5 shadow-lg">
          <div className="flex items-center justify-between text-xs text-amber-400 font-semibold mb-2">
            <span>ON HOLD</span>
            <div className="w-7 h-7 rounded-lg bg-amber-500/10 text-amber-400 flex items-center justify-center">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="text-3xl font-extrabold text-amber-400">{totalHold}</div>
          <p className="text-[11px] text-slate-400 mt-1">Awaiting client reschedule</p>
        </div>

        {/* Top Trainer */}
        <div className="bg-slate-900 border border-purple-500/20 rounded-2xl p-5 shadow-lg">
          <div className="flex items-center justify-between text-xs text-purple-400 font-semibold mb-2">
            <span>TOP TRAINER</span>
            <div className="w-7 h-7 rounded-lg bg-purple-500/10 text-purple-400 flex items-center justify-center">
              <Award className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-extrabold text-purple-300 truncate">
            {trainerMetrics[0]?.name || 'N/A'}
          </div>
          <p className="text-[11px] text-slate-400 mt-1">{trainerMetrics[0]?.done || 0} trainings completed</p>
        </div>

      </div>

      {/* ======================================================== */}
      {/* SECTION: TRAINER PERFORMANCE BREAKDOWN */}
      {/* ======================================================== */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-4">
          <div>
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <UserCheck className="w-5 h-5 text-emerald-400" />
              <span>Trainer Performance Breakdown</span>
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Rankings of Trainers by successfully delivered sessions and current workload
            </p>
          </div>
        </div>

        {/* Visual Bar Chart Leaderboard */}
        <div className="space-y-3 pt-2">
          {trainerMetrics.map((trainer, index) => {
            const maxDone = trainerMetrics[0]?.done || 1;
            const percentage = Math.round((trainer.done / maxDone) * 100);

            return (
              <div 
                key={trainer.name}
                className="bg-slate-950/60 border border-slate-800 hover:border-slate-700 p-4 rounded-xl space-y-2 transition-colors"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-3">
                    <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                      index === 0 ? 'bg-amber-400 text-slate-950 shadow-md shadow-amber-400/20' :
                      index === 1 ? 'bg-slate-300 text-slate-950' :
                      index === 2 ? 'bg-amber-700 text-white' :
                      'bg-slate-800 text-slate-400'
                    }`}>
                      {index + 1}
                    </span>
                    <div>
                      <span className="font-bold text-sm text-white">{trainer.name}</span>
                      <span className="text-[11px] text-slate-400 ml-2">Total Assigned: {trainer.total}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 text-xs">
                    <span className="px-2 py-0.5 rounded-md bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-bold">
                      {trainer.done} Done
                    </span>
                    {trainer.hold > 0 && (
                      <span className="px-2 py-0.5 rounded-md bg-amber-500/20 text-amber-300 text-[11px]">
                        {trainer.hold} Hold
                      </span>
                    )}
                    {trainer.todo > 0 && (
                      <span className="px-2 py-0.5 rounded-md bg-blue-500/20 text-blue-300 text-[11px]">
                        {trainer.todo} To-Do
                      </span>
                    )}
                  </div>
                </div>

                {/* Progress bar */}
                <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden flex">
                  <div 
                    style={{ width: `${percentage}%` }}
                    className="h-full bg-gradient-to-r from-emerald-500 to-teal-400 rounded-full transition-all duration-500" 
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Grid: KAM & Package Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Trainer Performance */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Users className="w-4 h-4 text-sky-400" />
              <span>KAM/PM Breakdown</span>
            </h3>
            <span className="text-xs text-slate-400">{kamMetrics.length} KAM/PMs</span>
          </div>

          <div className="space-y-2.5 max-h-96 overflow-y-auto pr-1">
            {kamMetrics.map((kam) => (
              <div 
                key={kam.name}
                className="flex items-center justify-between p-3 bg-slate-950/60 rounded-xl border border-slate-800/80 text-xs"
              >
                <span className="font-semibold text-slate-200">{kam.name}</span>
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-bold">
                    {kam.done} Done
                  </span>
                  <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-300">
                    {kam.total} Total
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Package Distribution */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Package className="w-4 h-4 text-amber-400" />
              <span>Package Distribution</span>
            </h3>
            <span className="text-xs text-slate-400">Total: {totalTrainings}</span>
          </div>

          <div className="space-y-2.5 max-h-96 overflow-y-auto pr-1">
            {packageMetrics.map(([pkg, count]) => {
              const pct = Math.round((count / totalTrainings) * 100);
              return (
                <div 
                  key={pkg}
                  className="p-3 bg-slate-950/60 rounded-xl border border-slate-800/80 space-y-1.5 text-xs"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-slate-200">{pkg}</span>
                    <span className="text-emerald-400 font-bold">{count} ({pct}%)</span>
                  </div>
                  <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
                    <div 
                      style={{ width: `${pct}%` }} 
                      className="h-full bg-emerald-500 rounded-full" 
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

      </div>

    </div>
  );
};
