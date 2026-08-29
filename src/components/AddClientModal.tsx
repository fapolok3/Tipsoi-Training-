import React, { useState, useEffect } from 'react';
import { 
  X, 
  UserPlus, 
  Building2, 
  Ticket, 
  User, 
  Package, 
  Calendar, 
  Clock, 
  UserCheck, 
  Tag, 
  Phone, 
  Mail, 
  FileText, 
  CheckCircle2,
  Video,
  FileCheck2
} from 'lucide-react';
import { TrainingRecord, TrainingStatus, AppDropdownSettings } from '../types';
import { DEFAULT_DROPDOWN_SETTINGS } from '../data/initialTrainings';
import { generateRandomMeetCode } from '../services/trainingService';
import { createRealGoogleMeetEvent } from '../services/googleCalendarService';
import confetti from 'canvas-confetti';
import { Loader2 } from 'lucide-react';

interface AddClientModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (record: Omit<TrainingRecord, 'id'> & { id?: string }) => Promise<void>;
  editRecord?: TrainingRecord | null;
  settings?: AppDropdownSettings;
}

export const AddClientModal: React.FC<AddClientModalProps> = ({
  isOpen,
  onClose,
  onSave,
  editRecord,
  settings = DEFAULT_DROPDOWN_SETTINGS
}) => {
  const assignedList = settings.assignedPersons?.length ? settings.assignedPersons : DEFAULT_DROPDOWN_SETTINGS.assignedPersons;
  const packagesList = settings.packages?.length ? settings.packages : DEFAULT_DROPDOWN_SETTINGS.packages;
  const pmList = settings.pms?.length ? settings.pms : DEFAULT_DROPDOWN_SETTINGS.pms;
  const statusList = settings.statuses?.length ? settings.statuses : DEFAULT_DROPDOWN_SETTINGS.statuses;

  const [clientName, setClientName] = useState('');
  const [ticketId, setTicketId] = useState('');
  const [assignedPerson, setAssignedPerson] = useState(assignedList[0] || 'Taqi Yeasir');
  const [packageType, setPackageType] = useState(packagesList[0] || 'Standard');
  const [manpowerSubmission, setManpowerSubmission] = useState('');
  const [trainingDate, setTrainingDate] = useState(new Date().toISOString().split('T')[0]);
  const [trainingTime, setTrainingTime] = useState('11:00 AM');
  const [pm, setPm] = useState(pmList[0] || 'Shahin');
  const [status, setStatus] = useState<TrainingStatus>('To-Do');
  const [meetLink, setMeetLink] = useState('');
  const [clientPhone, setClientPhone] = useState('');
  const [clientEmail, setClientEmail] = useState('');
  const [contactPerson, setContactPerson] = useState('');
  const [remarks, setRemarks] = useState('');
  const [rating, setRating] = useState<number>(5);
  const [loading, setLoading] = useState(false);
  const [isSchedulingCalendar, setIsSchedulingCalendar] = useState(false);
  const [calendarSuccessMsg, setCalendarSuccessMsg] = useState<string | null>(null);

  const handleGenerateRealGoogleMeet = async () => {
    if (!clientName.trim()) {
      alert('Please enter Client Name before generating Google Meet link.');
      return;
    }
    setIsSchedulingCalendar(true);
    setCalendarSuccessMsg(null);
    try {
      const res = await createRealGoogleMeetEvent({
        clientName,
        ticketId,
        trainingDate,
        trainingTime,
        pm,
        assignedPerson,
        package: packageType,
        clientEmail
      });
      setMeetLink(res.meetLink);
      setCalendarSuccessMsg(`Created in Google Calendar (${res.meetLink})`);
      confetti({ particleCount: 40, spread: 60, origin: { y: 0.6 } });
    } catch (err: any) {
      console.error('Calendar error:', err);
      alert(`Google Calendar: ${err?.message || 'Could not schedule event'}`);
    } finally {
      setIsSchedulingCalendar(false);
    }
  };

  useEffect(() => {
    if (editRecord) {
      setClientName(editRecord.clientName || '');
      setTicketId(editRecord.ticketId || '');
      setAssignedPerson(editRecord.assignedPerson || assignedList[0] || 'Taqi Yeasir');
      setPackageType(editRecord.package || packagesList[0] || 'Standard');
      setManpowerSubmission(editRecord.manpowerSubmission || '');
      setTrainingDate(editRecord.trainingDate || new Date().toISOString().split('T')[0]);
      setTrainingTime(editRecord.trainingTime || '11:00 AM');
      setPm(editRecord.pm || pmList[0] || 'Shahin');
      setStatus(editRecord.status || 'To-Do');
      setMeetLink(editRecord.meetLink || '');
      setClientPhone(editRecord.clientPhone || '');
      setClientEmail(editRecord.clientEmail || '');
      setContactPerson(editRecord.contactPerson || '');
      setRemarks(editRecord.remarks || '');
      setRating(editRecord.rating || 5);
    } else {
      setClientName('');
      setTicketId(`S-${Math.floor(10000 + Math.random() * 90000)}`);
      setAssignedPerson(assignedList[0] || 'Taqi Yeasir');
      setPackageType(packagesList[0] || 'Standard');
      setManpowerSubmission('');
      setTrainingDate(new Date().toISOString().split('T')[0]);
      setTrainingTime('11:00 AM');
      setPm(pmList[0] || 'Shahin');
      setStatus('To-Do');
      setMeetLink('');
      setClientPhone('');
      setClientEmail('');
      setContactPerson('');
      setRemarks('');
      setRating(5);
    }
  }, [editRecord, isOpen, assignedList, packagesList, pmList]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!clientName.trim()) {
      alert('Please enter client or company name');
      return;
    }

    setLoading(true);
    try {
      await onSave({
        id: editRecord?.id,
        clientName: clientName.trim(),
        ticketId: ticketId.trim(),
        assignedPerson,
        package: packageType,
        manpowerSubmission: manpowerSubmission.trim(),
        trainingDate,
        trainingTime: trainingTime.trim(),
        pm,
        status: status as TrainingStatus,
        meetLink: meetLink || editRecord?.meetLink || '',
        clientPhone: clientPhone.trim(),
        clientEmail: clientEmail.trim(),
        contactPerson: contactPerson.trim(),
        remarks: remarks.trim(),
        rating: Number(rating)
      });
      confetti({ particleCount: 50, spread: 70, origin: { y: 0.6 } });
      onClose();
    } catch (err) {
      console.error('Save failed:', err);
      alert('Failed to save customer record. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-3xl text-white shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        
        {/* Header */}
        <div className="px-6 py-4 bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 border-b border-slate-700/80 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-500 to-teal-500 flex items-center justify-center shadow-lg shadow-emerald-500/20 text-slate-950 font-bold">
              <UserPlus className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">
                {editRecord ? 'Edit Training Session' : 'Add New Customer & Training Schedule'}
              </h2>
              <p className="text-xs text-slate-400">
                Enter client details, trainer assignment, package, and schedule
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
          
          {/* Section 1: Client Name & Ticket ID */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5 flex items-center gap-1.5">
                <Building2 className="w-3.5 h-3.5 text-emerald-400" /> Client Name *
              </label>
              <input
                type="text"
                required
                value={clientName}
                onChange={(e) => setClientName(e.target.value)}
                placeholder="e.g. Siddik Sweet Meat or Lantabur group"
                className="w-full px-3 py-2 bg-slate-950 text-xs text-slate-100 border border-slate-700 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5 flex items-center gap-1.5">
                <Ticket className="w-3.5 h-3.5 text-emerald-400" /> Ticket ID
              </label>
              <input
                type="text"
                value={ticketId}
                onChange={(e) => setTicketId(e.target.value)}
                placeholder="e.g. S-10015, R-10125, or E-10521"
                className="w-full px-3 py-2 bg-slate-950 text-xs text-slate-100 border border-slate-700 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              />
            </div>
          </div>

          {/* Section 2: Trainer & Package (Dropdown only) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5 flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 text-emerald-400" /> Trainer (Dropdown)
              </label>
              <select
                value={assignedPerson}
                onChange={(e) => setAssignedPerson(e.target.value)}
                className="w-full px-3 py-2 bg-slate-950 text-xs text-slate-100 border border-slate-700 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none cursor-pointer"
              >
                {assignedList.map((person) => (
                  <option key={person} value={person}>{person}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5 flex items-center gap-1.5">
                <Package className="w-3.5 h-3.5 text-emerald-400" /> Package (Dropdown)
              </label>
              <select
                value={packageType}
                onChange={(e) => setPackageType(e.target.value)}
                className="w-full px-3 py-2 bg-slate-950 text-xs text-slate-100 border border-slate-700 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none cursor-pointer"
              >
                {packagesList.map((pkg) => (
                  <option key={pkg} value={pkg}>{pkg}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Section 3: Training Schedule, Time & KAM/PM */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 bg-slate-800/40 p-4 rounded-xl border border-slate-700/60">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5 flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-emerald-400" /> Training Date *
              </label>
              <input
                type="date"
                required
                value={trainingDate}
                onChange={(e) => setTrainingDate(e.target.value)}
                className="w-full px-3 py-2 bg-slate-950 text-xs text-slate-100 border border-slate-700 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5 flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-emerald-400" /> Training Time
              </label>
              <input
                type="text"
                value={trainingTime}
                onChange={(e) => setTrainingTime(e.target.value)}
                placeholder="e.g. 11:00 AM, 3:00 PM"
                className="w-full px-3 py-2 bg-slate-950 text-xs text-slate-100 border border-slate-700 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5 flex items-center gap-1.5">
                <UserCheck className="w-3.5 h-3.5 text-emerald-400" /> KAM/PM (Dropdown)
              </label>
              <select
                value={pm}
                onChange={(e) => setPm(e.target.value)}
                className="w-full px-3 py-2 bg-slate-950 text-xs text-slate-100 border border-slate-700 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none cursor-pointer"
              >
                {pmList.map((trainer) => (
                  <option key={trainer} value={trainer}>{trainer}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Section 4: Status (Dropdown) & Manpower Submission */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5 flex items-center gap-1.5">
                <Tag className="w-3.5 h-3.5 text-emerald-400" /> Status (Dropdown)
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as TrainingStatus)}
                className="w-full px-3 py-2 bg-slate-950 text-xs text-slate-100 border border-slate-700 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none cursor-pointer"
              >
                {statusList.map((st) => (
                  <option key={st} value={st}>{st}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5 flex items-center gap-1.5">
                <FileCheck2 className="w-3.5 h-3.5 text-emerald-400" /> Manpower Submission
              </label>
              <input
                type="text"
                value={manpowerSubmission}
                onChange={(e) => setManpowerSubmission(e.target.value)}
                placeholder="e.g. 25-Aug-2026 or 28-Aug-2026"
                className="w-full px-3 py-2 bg-slate-950 text-xs text-slate-100 border border-slate-700 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              />
            </div>
          </div>

          {/* Section 5: Google Meet Link Generation */}
          <div className="bg-slate-950/60 p-3.5 rounded-xl border border-slate-700/80 space-y-2">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <label className="text-xs font-semibold text-emerald-300 flex items-center gap-1.5">
                <Video className="w-4 h-4 text-emerald-400" />
                <span>Google Meet Link</span>
              </label>
              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  disabled={isSchedulingCalendar}
                  onClick={handleGenerateRealGoogleMeet}
                  className="px-2.5 py-1 bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-[11px] font-bold rounded-lg transition-colors cursor-pointer flex items-center gap-1 shadow-sm disabled:opacity-50"
                  title="Creates real meeting on your logged in Google Calendar"
                >
                  {isSchedulingCalendar ? (
                    <>
                      <Loader2 className="w-3 h-3 animate-spin" />
                      <span>Scheduling...</span>
                    </>
                  ) : (
                    <>
                      <Calendar className="w-3 h-3" />
                      <span>Create on Google Calendar</span>
                    </>
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => setMeetLink(generateRandomMeetCode())}
                  className="px-2 py-1 bg-slate-800 hover:bg-slate-700 text-emerald-300 border border-slate-700 text-[11px] font-semibold rounded-lg transition-colors cursor-pointer"
                >
                  ⚡ Fast Code
                </button>
                <a
                  href="https://meet.google.com/new"
                  target="_blank"
                  rel="noreferrer"
                  className="px-2 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 text-[11px] font-medium rounded-lg transition-colors"
                >
                  meet.google.com ↗
                </a>
              </div>
            </div>
            {calendarSuccessMsg && (
              <p className="text-[11px] text-emerald-300 bg-emerald-500/10 px-2 py-1 rounded border border-emerald-500/20">
                ✅ {calendarSuccessMsg}
              </p>
            )}
            <input
              type="text"
              value={meetLink}
              onChange={(e) => setMeetLink(e.target.value)}
              placeholder="https://meet.google.com/xxx-yyyy-zzz (Auto-generated if left blank)"
              className="w-full px-3 py-2 bg-slate-950 font-mono text-xs text-emerald-400 border border-slate-700 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none"
            />
          </div>

          {/* Section 6: Optional Contact Information */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-1">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5 flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 text-slate-400" /> Contact Person (Optional)
              </label>
              <input
                type="text"
                value={contactPerson}
                onChange={(e) => setContactPerson(e.target.value)}
                placeholder="e.g. Mr. Rafiqul Islam"
                className="w-full px-3 py-2 bg-slate-950 text-xs text-slate-100 border border-slate-700 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5 flex items-center gap-1.5">
                <Phone className="w-3.5 h-3.5 text-slate-400" /> Phone Number (Optional)
              </label>
              <input
                type="text"
                value={clientPhone}
                onChange={(e) => setClientPhone(e.target.value)}
                placeholder="e.g. 017xxxxxxxx"
                className="w-full px-3 py-2 bg-slate-950 text-xs text-slate-100 border border-slate-700 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5 flex items-center gap-1.5">
                <Mail className="w-3.5 h-3.5 text-slate-400" /> Email (Optional)
              </label>
              <input
                type="email"
                value={clientEmail}
                onChange={(e) => setClientEmail(e.target.value)}
                placeholder="e.g. hr@company.com"
                className="w-full px-3 py-2 bg-slate-950 text-xs text-slate-100 border border-slate-700 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              />
            </div>
          </div>

          {/* Section 7: Remarks */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5 flex items-center gap-1.5">
              <FileText className="w-3.5 h-3.5 text-slate-400" /> Remarks / Requirements
            </label>
            <textarea
              rows={2}
              value={remarks}
              onChange={(e) => setRemarks(e.target.value)}
              placeholder="e.g. Attendance device integration, payroll formula setup, shift scheduling..."
              className="w-full px-3 py-2 bg-slate-950 text-xs text-slate-100 border border-slate-700 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none"
            />
          </div>

          {/* Footer Actions */}
          <div className="pt-4 border-t border-slate-800 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold rounded-xl transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-5 py-2 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-slate-950 font-bold text-xs rounded-xl shadow-lg shadow-emerald-500/20 flex items-center gap-2 transition-all transform active:scale-95 cursor-pointer disabled:opacity-50"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>{loading ? 'Saving...' : editRecord ? 'Update Record' : 'Save Customer & Training'}</span>
            </button>
          </div>

        </form>
      </div>
    </div>
  );
};
