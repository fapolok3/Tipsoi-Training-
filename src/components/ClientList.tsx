import React, { useState, useMemo } from 'react';
import { 
  Users, 
  Search, 
  Filter, 
  Video, 
  Edit3, 
  Trash2, 
  CheckCircle2, 
  Building2, 
  Calendar, 
  Clock, 
  Tag, 
  Download, 
  ChevronLeft, 
  ChevronRight, 
  ExternalLink,
  Phone,
  MessageSquare,
  FileSpreadsheet,
  AlertTriangle,
  X
} from 'lucide-react';
import { TrainingRecord, TrainingStatus, AppDropdownSettings } from '../types';
import { DEFAULT_DROPDOWN_SETTINGS } from '../data/initialTrainings';
import { exportTrainingsToExcel } from '../services/excelService';
import { formatTrainingDate } from '../utils/dateUtils';

interface ClientListProps {
  trainings: TrainingRecord[];
  onOpenAddModal: () => void;
  onOpenMeetModal: (training: TrainingRecord) => void;
  onUpdateStatus: (id: string, status: TrainingStatus) => void;
  onEdit: (training: TrainingRecord) => void;
  onDelete: (id: string) => void;
  onBulkDelete?: (ids: string[]) => void;
  onOpenExcelModal?: () => void;
  searchQuery?: string;
  settings?: AppDropdownSettings;
}

export const ClientList: React.FC<ClientListProps> = ({
  trainings,
  onOpenAddModal,
  onOpenMeetModal,
  onUpdateStatus,
  onEdit,
  onDelete,
  onBulkDelete,
  onOpenExcelModal,
  searchQuery = '',
  settings = DEFAULT_DROPDOWN_SETTINGS
}) => {
  const assignedList = settings.assignedPersons?.length ? settings.assignedPersons : DEFAULT_DROPDOWN_SETTINGS.assignedPersons;
  const packagesList = settings.packages?.length ? settings.packages : DEFAULT_DROPDOWN_SETTINGS.packages;
  const pmList = settings.pms?.length ? settings.pms : DEFAULT_DROPDOWN_SETTINGS.pms;
  const statusList = settings.statuses?.length ? settings.statuses : DEFAULT_DROPDOWN_SETTINGS.statuses;

  const [searchTerm, setSearchTerm] = useState('');
  const [trainerFilter, setTrainerFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState('All');
  const [packageFilter, setPackageFilter] = useState('All');
  const [kamFilter, setKamFilter] = useState('All');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState<number>(10);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  // Delete Confirmation Modal State (solves window.confirm blocked in preview iframe)
  const [deleteConfirmModal, setDeleteConfirmModal] = useState<{
    isOpen: boolean;
    type: 'single' | 'bulk';
    id?: string;
    clientName?: string;
    count?: number;
  }>({
    isOpen: false,
    type: 'single'
  });

  const handleOpenSingleDeleteModal = (id: string, clientName: string, e?: React.MouseEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    setDeleteConfirmModal({
      isOpen: true,
      type: 'single',
      id,
      clientName
    });
  };

  const handleOpenBulkDeleteModal = () => {
    if (selectedIds.length === 0) return;
    setDeleteConfirmModal({
      isOpen: true,
      type: 'bulk',
      count: selectedIds.length
    });
  };

  const handleConfirmDeleteAction = () => {
    if (deleteConfirmModal.type === 'single' && deleteConfirmModal.id) {
      onDelete(deleteConfirmModal.id);
      setSelectedIds(prev => prev.filter(i => i !== deleteConfirmModal.id));
    } else if (deleteConfirmModal.type === 'bulk' && selectedIds.length > 0) {
      if (onBulkDelete) {
        onBulkDelete(selectedIds);
      } else {
        selectedIds.forEach(id => onDelete(id));
      }
      setSelectedIds([]);
    }
    setDeleteConfirmModal({ isOpen: false, type: 'single' });
  };

  const effectiveSearch = (searchTerm || searchQuery).trim().toLowerCase();

  const filteredTrainings = useMemo(() => {
    const seen = new Set<string>();
    return trainings.filter(item => {
      if (!item || !item.id) return false;
      const strId = String(item.id);
      if (seen.has(strId)) return false;
      seen.add(strId);

      if (trainerFilter !== 'All' && item.pm !== trainerFilter) return false;
      if (statusFilter !== 'All' && item.status !== statusFilter) return false;
      if (packageFilter !== 'All' && item.package !== packageFilter) return false;
      if (kamFilter !== 'All' && item.assignedPerson !== kamFilter) return false;

      if (effectiveSearch) {
        const q = effectiveSearch;
        const matchName = item.clientName.toLowerCase().includes(q);
        const matchTicket = (item.ticketId || '').toLowerCase().includes(q);
        const matchTrainer = (item.pm || '').toLowerCase().includes(q);
        const matchKam = (item.assignedPerson || '').toLowerCase().includes(q);
        const matchPkg = (item.package || '').toLowerCase().includes(q);
        const matchRemarks = (item.remarks || '').toLowerCase().includes(q);
        if (!matchName && !matchTicket && !matchTrainer && !matchKam && !matchPkg && !matchRemarks) return false;
      }
      return true;
    });
  }, [trainings, effectiveSearch, trainerFilter, statusFilter, packageFilter, kamFilter]);

  const totalPages = Math.ceil(filteredTrainings.length / itemsPerPage) || 1;
  const paginatedList = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredTrainings.slice(start, start + itemsPerPage);
  }, [filteredTrainings, currentPage, itemsPerPage]);

  const handleExportCSV = () => {
    const headers = ['Client Name', 'Ticket ID', 'Trainer', 'KAM/PM', 'Package', 'Training Date', 'Training Time', 'Status', 'Meet Link', 'Remarks'];
    const rows = filteredTrainings.map(t => [
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
    link.setAttribute('download', `tipsoi_clients_list.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
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
        return <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-rose-500/20 text-rose-300 border border-rose-500/30">Cancel</span>;
      default:
        return <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-slate-800 text-slate-300">{status}</span>;
    }
  };

  return (
    <div className="space-y-5 pb-12">
      
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-extrabold text-white flex items-center gap-2">
            <Users className="w-6 h-6 text-emerald-400" />
            <span>All Customer Training Records</span>
            <span className="px-2.5 py-0.5 text-xs rounded-full bg-slate-800 text-slate-300 border border-slate-700">
              {filteredTrainings.length}
            </span>
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Search, filter by trainer, status, or package, and generate training meeting links
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {onOpenExcelModal && (
            <button
              onClick={onOpenExcelModal}
              id="upload-excel-btn"
              className="px-3 py-2 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-xs font-semibold rounded-xl flex items-center gap-1.5 transition-colors cursor-pointer"
              title="Upload clients from Excel or CSV file"
            >
              <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
              <span>Upload Excel / CSV</span>
            </button>
          )}

          <button
            onClick={() => exportTrainingsToExcel(trainings)}
            id="export-excel-btn"
            className="px-3 py-2 bg-slate-800 hover:bg-slate-750 text-slate-300 border border-slate-700 text-xs font-semibold rounded-xl flex items-center gap-1.5 transition-colors cursor-pointer"
            title="Download full client list in Excel format"
          >
            <Download className="w-4 h-4 text-emerald-400" />
            <span>Export Excel</span>
          </button>

          <button
            onClick={onOpenAddModal}
            id="add-client-modal-btn"
            className="px-3.5 py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-bold rounded-xl shadow-lg shadow-emerald-500/20 flex items-center gap-1.5 transition-all cursor-pointer"
          >
            <span>+ Add Client</span>
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl space-y-3">
        
        {/* Top line search */}
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by client name, ticket ID, trainer name, KAM, package, remarks..."
            value={searchTerm}
            onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
            className="w-full pl-10 pr-4 py-2 bg-slate-950 text-xs text-slate-100 placeholder-slate-400 border border-slate-700 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none"
          />
        </div>

        {/* Dropdown Filters */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-xs">
          <div>
            <label className="text-[11px] text-slate-400 block mb-1">KAM/PM</label>
            <select
              value={trainerFilter}
              onChange={(e) => { setTrainerFilter(e.target.value); setCurrentPage(1); }}
              className="w-full px-2.5 py-1.5 bg-slate-950 text-slate-200 border border-slate-700 rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-500 text-xs"
            >
              <option value="All">All KAM/PMs</option>
              {pmList.map((t) => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-[11px] text-slate-400 block mb-1">Status</label>
            <select
              value={statusFilter}
              onChange={(e) => { setStatusFilter(e.target.value); setCurrentPage(1); }}
              className="w-full px-2.5 py-1.5 bg-slate-950 text-slate-200 border border-slate-700 rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-500 text-xs"
            >
              <option value="All">All Statuses</option>
              {statusList.map((st) => (
                <option key={st} value={st}>{st}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-[11px] text-slate-400 block mb-1">Package</label>
            <select
              value={packageFilter}
              onChange={(e) => { setPackageFilter(e.target.value); setCurrentPage(1); }}
              className="w-full px-2.5 py-1.5 bg-slate-950 text-slate-200 border border-slate-700 rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-500 text-xs"
            >
              <option value="All">All Packages</option>
              {packagesList.map((p) => (
                <option key={p} value={p}>{p}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-[11px] text-slate-400 block mb-1">Trainer</label>
            <select
              value={kamFilter}
              onChange={(e) => { setKamFilter(e.target.value); setCurrentPage(1); }}
              className="w-full px-2.5 py-1.5 bg-slate-950 text-slate-200 border border-slate-700 rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-500 text-xs"
            >
              <option value="All">All Trainers</option>
              {assignedList.map((k) => (
                <option key={k} value={k}>{k}</option>
              ))}
            </select>
          </div>
        </div>

      </div>

      {/* Bulk Action Banner when items are selected */}
      {selectedIds.length > 0 && (
        <div className="bg-rose-500/10 border border-rose-500/30 p-3 rounded-xl flex flex-wrap items-center justify-between gap-2 text-xs animate-fade-in">
          <div className="flex items-center gap-2 text-rose-300 font-semibold">
            <Trash2 className="w-4 h-4 text-rose-400" />
            <span>{selectedIds.length} of {filteredTrainings.length} item(s) selected</span>
          </div>
          <div className="flex items-center gap-2">
            {selectedIds.length < filteredTrainings.length && (
              <button
                onClick={() => setSelectedIds(filteredTrainings.map(item => item.id))}
                className="px-3 py-1 bg-slate-800 hover:bg-slate-700 text-emerald-300 font-medium rounded-lg transition-colors cursor-pointer border border-slate-700"
              >
                Select All ({filteredTrainings.length})
              </button>
            )}
            <button
              onClick={() => setSelectedIds([])}
              className="px-3 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg transition-colors cursor-pointer border border-slate-700"
            >
              Deselect All
            </button>
            <button
              onClick={handleOpenBulkDeleteModal}
              className="px-3.5 py-1.5 bg-rose-600 hover:bg-rose-500 text-white font-bold rounded-lg shadow-lg shadow-rose-600/20 flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Delete Selected ({selectedIds.length})</span>
            </button>
          </div>
        </div>
      )}

      {/* Table Data */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl shadow-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-950 text-[11px] uppercase tracking-wider text-slate-400 border-b border-slate-800">
              <tr>
                <th className="px-3 py-3.5 text-center w-10">
                  <input
                    type="checkbox"
                    title="Select All Records"
                    checked={filteredTrainings.length > 0 && filteredTrainings.every(item => selectedIds.includes(item.id))}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setSelectedIds(filteredTrainings.map(item => item.id));
                      } else {
                        setSelectedIds([]);
                      }
                    }}
                    className="w-4 h-4 rounded border-slate-700 bg-slate-950 text-emerald-500 focus:ring-emerald-500 cursor-pointer"
                  />
                </th>
                <th className="px-4 py-3.5 font-bold text-slate-200">Client Name</th>
                <th className="px-3 py-3.5 font-bold text-slate-200">Ticket ID</th>
                <th className="px-3 py-3.5 font-bold text-slate-200">Package</th>
                <th className="px-3 py-3.5 font-bold text-emerald-400">Training Date</th>
                <th className="px-3 py-3.5 font-bold text-cyan-400">Training Time</th>
                <th className="px-3 py-3.5 font-bold text-slate-200">KAM/PM</th>
                <th className="px-3 py-3.5 font-bold text-slate-200">Trainer</th>
                <th className="px-3 py-3.5 font-bold text-slate-200">Status</th>
                <th className="px-4 py-3.5 text-right font-bold text-slate-200">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {paginatedList.length === 0 ? (
                <tr>
                  <td colSpan={10} className="text-center py-10 text-slate-400">
                    No matching records found.
                  </td>
                </tr>
              ) : (
                paginatedList.map((row, idx) => (
                  <tr key={row.id ? String(row.id) : `row-${idx}`} className={`hover:bg-slate-800/40 transition-colors ${selectedIds.includes(row.id) ? 'bg-emerald-500/5' : ''}`}>
                    <td className="px-3 py-3 text-center">
                      <input
                        type="checkbox"
                        checked={selectedIds.includes(row.id)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedIds(prev => [...prev, row.id]);
                          } else {
                            setSelectedIds(prev => prev.filter(id => id !== row.id));
                          }
                        }}
                        className="w-4 h-4 rounded border-slate-700 bg-slate-950 text-emerald-500 focus:ring-emerald-500 cursor-pointer"
                      />
                    </td>
                    <td className="px-4 py-3 font-semibold text-white">
                      <div className="flex items-center gap-1.5">
                        <Building2 className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" />
                        <span className="truncate max-w-[200px]" title={row.clientName}>{row.clientName}</span>
                      </div>
                      {row.remarks && (
                        <p className="text-[10px] text-slate-400 font-normal truncate max-w-[220px] mt-0.5">
                          {row.remarks}
                        </p>
                      )}
                    </td>
                    <td className="px-3 py-3 font-mono text-[11px] text-slate-400">
                      {row.ticketId || '-'}
                    </td>
                    <td className="px-3 py-3">
                      <span className="px-2 py-0.5 rounded bg-slate-800 text-[11px] text-slate-200 border border-slate-700 whitespace-nowrap">
                        {row.package}
                      </span>
                    </td>
                    {/* Training Date Column */}
                    <td className="px-3 py-3 whitespace-nowrap">
                      <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-slate-800/80 border border-slate-700/60 text-xs font-semibold text-emerald-300">
                        <Calendar className="w-3.5 h-3.5 text-emerald-400" />
                        <span>{formatTrainingDate(row.trainingDate)}</span>
                      </div>
                    </td>
                    {/* Training Time Column */}
                    <td className="px-3 py-3 whitespace-nowrap">
                      <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-slate-800/80 border border-slate-700/60 text-xs font-mono text-cyan-300">
                        <Clock className="w-3.5 h-3.5 text-cyan-400" />
                        <span>{row.trainingTime || '11:00 AM'}</span>
                      </div>
                    </td>
                    <td className="px-3 py-3">
                      <span className="font-semibold text-emerald-300 whitespace-nowrap">
                        {row.pm}
                      </span>
                    </td>
                    <td className="px-3 py-3 text-slate-300 whitespace-nowrap">
                      {row.assignedPerson || '-'}
                    </td>
                    <td className="px-3 py-3">
                      {getStatusBadge(row.status)}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => onOpenMeetModal(row)}
                          title="Generate Training Link"
                          className="px-2 py-1 bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/30 rounded-lg text-[11px] font-semibold flex items-center gap-1 transition-colors cursor-pointer"
                        >
                          <Video className="w-3 h-3 text-emerald-400" />
                          <span className="hidden sm:inline">Link</span>
                        </button>
                        <button
                          onClick={() => onEdit(row)}
                          title="Edit Record"
                          className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={(e) => handleOpenSingleDeleteModal(row.id, row.clientName, e)}
                          title="Delete Record"
                          type="button"
                          className="p-1.5 text-rose-400 hover:text-white hover:bg-rose-600/30 border border-rose-500/20 rounded-lg transition-all cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Bar */}
        <div className="px-4 py-3 bg-slate-950/80 border-t border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-slate-400">
          <div className="flex items-center gap-4">
            <div>
              Showing {filteredTrainings.length === 0 ? 0 : (currentPage - 1) * itemsPerPage + 1} to {Math.min(currentPage * itemsPerPage, filteredTrainings.length)} of {filteredTrainings.length} records
            </div>

            <div className="flex items-center gap-1.5">
              <span>Rows per page:</span>
              <select
                value={itemsPerPage}
                onChange={(e) => {
                  setItemsPerPage(Number(e.target.value));
                  setCurrentPage(1);
                }}
                className="bg-slate-900 text-slate-200 border border-slate-700 px-2 py-1 rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-500 text-xs cursor-pointer"
              >
                <option value={5}>5</option>
                <option value={10}>10</option>
                <option value={20}>20</option>
                <option value={50}>50</option>
                <option value={100}>100</option>
              </select>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              disabled={currentPage <= 1}
              onClick={() => setCurrentPage(p => p - 1)}
              className="p-1.5 rounded-lg border border-slate-700 bg-slate-800 text-slate-300 disabled:opacity-30 disabled:cursor-not-allowed hover:bg-slate-700"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="px-2 font-semibold text-slate-200">
              Page {currentPage} of {totalPages}
            </span>
            <button
              disabled={currentPage >= totalPages}
              onClick={() => setCurrentPage(p => p + 1)}
              className="p-1.5 rounded-lg border border-slate-700 bg-slate-800 text-slate-300 disabled:opacity-30 disabled:cursor-not-allowed hover:bg-slate-700"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Delete Confirmation Popup Modal (Works in preview iframe) */}
      {deleteConfirmModal.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in zoom-in-95 duration-150">
          <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-2xl space-y-4 text-white">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-rose-500/20 border border-rose-500/30 flex items-center justify-center text-rose-400 shrink-0">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">
                  {deleteConfirmModal.type === 'single' ? 'ডিলিট কনফার্মেশন' : 'সিলেক্টেড রেকর্ড ডিলিট কনফার্মেশন'}
                </h3>
                <p className="text-xs text-rose-400 font-medium">আপনি কি নিশ্চিত যে আপনি এটি মুছে ফেলতে চান?</p>
              </div>
            </div>

            <div className="bg-slate-950/80 rounded-xl p-4 border border-slate-800 text-xs text-slate-300 leading-relaxed">
              {deleteConfirmModal.type === 'single' ? (
                <span>
                  আপনি কি নিশ্চিত যে আপনি <strong className="text-emerald-400">{deleteConfirmModal.clientName || 'এই ক্লায়েন্ট'}</strong>-এর ট্রেনিং রেকর্ডটি ডিলিট করতে চান?
                </span>
              ) : (
                <span>
                  আপনি কি নিশ্চিত যে আপনি <strong className="text-rose-400">{deleteConfirmModal.count}</strong> টি সিলেক্টেড রেকর্ড স্থায়ীভাবে ডিলিট করতে চান?
                </span>
              )}
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setDeleteConfirmModal({ isOpen: false, type: 'single' })}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition-colors cursor-pointer"
              >
                বাতিল (Cancel)
              </button>
              <button
                type="button"
                onClick={handleConfirmDeleteAction}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold shadow-lg shadow-rose-600/30 transition-all cursor-pointer flex items-center gap-1.5"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Confirm Delete</span>
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
