import React, { useState, useEffect } from 'react';
import { 
  X, 
  Video, 
  Copy, 
  Check, 
  Share2, 
  Mail, 
  MessageCircle, 
  ExternalLink, 
  RefreshCw, 
  Sparkles, 
  Calendar, 
  Clock, 
  UserCheck, 
  Save,
  Radio,
  PlayCircle,
  PlusCircle,
  Loader2
} from 'lucide-react';
import { TrainingRecord } from '../types';
import { 
  generateRandomMeetCode, 
  formatMeetUrl, 
  getTemplateMessage, 
  GOOGLE_MEET_INSTANT_NEW 
} from '../services/trainingService';
import { createRealGoogleMeetEvent } from '../services/googleCalendarService';
import confetti from 'canvas-confetti';

interface MeetLinkModalProps {
  isOpen: boolean;
  onClose: () => void;
  training: TrainingRecord | null;
  onSaveMeetLink?: (id: string, link: string) => void;
}

export const MeetLinkModal: React.FC<MeetLinkModalProps> = ({
  isOpen,
  onClose,
  training,
  onSaveMeetLink
}) => {
  const [clientName, setClientName] = useState(training?.clientName || '');
  const [trainingDate, setTrainingDate] = useState(training?.trainingDate || '');
  const [trainingTime, setTrainingTime] = useState(training?.trainingTime || '11:00 AM');
  const [trainerName, setTrainerName] = useState(training?.assignedPerson || 'Support Trainer');
  const [meetLink, setMeetLink] = useState(training?.meetLink || generateRandomMeetCode());
  const [copied, setCopied] = useState(false);
  const [linkCopied, setLinkCopied] = useState(false);
  const [savedStatus, setSavedStatus] = useState(false);
  const [isSchedulingGoogleCalendar, setIsSchedulingGoogleCalendar] = useState(false);
  const [calendarNotice, setCalendarNotice] = useState<string | null>(null);

  useEffect(() => {
    if (training) {
      setClientName(training.clientName);
      setTrainingDate(training.trainingDate);
      setTrainingTime(training.trainingTime || '11:00 AM');
      setTrainerName(training.assignedPerson || '');
      setMeetLink(training.meetLink ? formatMeetUrl(training.meetLink) : generateRandomMeetCode());
    } else {
      setMeetLink(generateRandomMeetCode());
    }
  }, [training]);

  if (!isOpen) return null;

  const handleScheduleRealGoogleMeet = async () => {
    if (!clientName) {
      alert('Please enter a Client Name before scheduling.');
      return;
    }

    setIsSchedulingGoogleCalendar(true);
    setCalendarNotice(null);

    try {
      const res = await createRealGoogleMeetEvent({
        clientName,
        ticketId: training?.ticketId,
        trainingDate,
        trainingTime,
        pm: trainerName,
        assignedPerson: training?.assignedPerson,
        package: training?.package
      });

      setMeetLink(res.meetLink);
      if (training && onSaveMeetLink) {
        onSaveMeetLink(training.id, res.meetLink);
      }

      setCalendarNotice(`Meeting scheduled on Google Calendar! Real Meet link: ${res.meetLink}`);
      confetti({ particleCount: 50, spread: 70, origin: { y: 0.6 } });
    } catch (err: any) {
      console.error('Google Calendar Error:', err);
      alert(`Google Calendar Schedule Error: ${err.message}`);
    } finally {
      setIsSchedulingGoogleCalendar(false);
    }
  };

  const formattedMeetLink = formatMeetUrl(meetLink);
  const messageText = getTemplateMessage(
    clientName,
    trainingDate,
    trainingTime,
    trainerName,
    formattedMeetLink
  );

  const handleCopyMessage = () => {
    navigator.clipboard.writeText(messageText);
    setCopied(true);
    confetti({ particleCount: 40, spread: 60, origin: { y: 0.8 } });
    setTimeout(() => setCopied(false), 2500);
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(formattedMeetLink);
    setLinkCopied(true);
    setTimeout(() => setLinkCopied(false), 2000);
  };

  const handleGenerateNewLink = () => {
    const fresh = generateRandomMeetCode();
    setMeetLink(fresh);
    if (training && onSaveMeetLink) {
      onSaveMeetLink(training.id, fresh);
    }
  };

  const handleStartInstantGoogleMeet = () => {
    // Open Google Meet to start an instant official room
    window.open(GOOGLE_MEET_INSTANT_NEW, '_blank');
  };

  const handleOpenCurrentMeet = () => {
    window.open(formattedMeetLink, '_blank');
  };

  const handleSaveToRecord = () => {
    if (training && onSaveMeetLink) {
      onSaveMeetLink(training.id, formattedMeetLink);
      setSavedStatus(true);
      setTimeout(() => setSavedStatus(false), 2000);
    }
  };

  const getCleanPhone = (rawPhone?: string) => {
    if (!rawPhone) return '';
    let digits = rawPhone.replace(/[^0-9]/g, '');
    if (digits.length === 11 && digits.startsWith('01')) {
      digits = '88' + digits;
    }
    return digits;
  };

  const handleWhatsAppWeb = () => {
    const encoded = encodeURIComponent(messageText);
    const phone = getCleanPhone(training?.clientPhone);
    const url = phone
      ? `https://web.whatsapp.com/send?phone=${phone}&text=${encoded}`
      : `https://web.whatsapp.com/send?text=${encoded}`;
    window.open(url, '_blank');
  };

  const handleWhatsAppApp = () => {
    const encoded = encodeURIComponent(messageText);
    const phone = getCleanPhone(training?.clientPhone);
    const url = phone
      ? `https://api.whatsapp.com/send?phone=${phone}&text=${encoded}`
      : `https://api.whatsapp.com/send?text=${encoded}`;
    window.open(url, '_blank');
  };

  const handleEmail = () => {
    const subject = encodeURIComponent(`Tipsoi HRM Training Session - ${clientName}`);
    const body = encodeURIComponent(messageText);
    window.open(`mailto:${training?.clientEmail || ''}?subject=${subject}&body=${body}`, '_blank');
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto no-scrollbar bg-slate-950/85 backdrop-blur-sm flex items-center justify-center p-3 sm:p-6">
      <div className="bg-slate-900 border border-slate-700/80 rounded-2xl w-full max-w-3xl text-white shadow-2xl overflow-hidden my-auto animate-in fade-in zoom-in-95 duration-150 no-scrollbar max-h-[92vh] flex flex-col">
        
        {/* Header */}
        <div className="px-6 py-3.5 bg-gradient-to-r from-slate-900 via-slate-800 to-emerald-950/60 border-b border-slate-700/80 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-emerald-500 to-teal-500 flex items-center justify-center shadow-lg shadow-emerald-500/20 text-slate-950 font-bold">
              <Video className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <span>Google Meet Link &amp; Client Invitation</span>
                <span className="px-2 py-0.5 rounded-full text-[10px] bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                  Google Meet
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                Official Google Meet Generator and Client Invitation Dispatch
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

        {/* Content - Clean auto-sizing layout with no internal scrollbars */}
        <div className="p-5 sm:p-6 space-y-4 overflow-y-auto no-scrollbar flex-1">
          
          {/* Quick Details Inputs Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-slate-800/50 p-3 rounded-xl border border-slate-700/60">
            <div>
              <label className="block text-[11px] font-semibold text-slate-300 uppercase tracking-wider mb-1">
                Client Name
              </label>
              <input
                type="text"
                value={clientName}
                onChange={(e) => setClientName(e.target.value)}
                placeholder="e.g. Acme Corporation"
                className="w-full px-3 py-1.5 bg-slate-900 text-xs text-slate-100 border border-slate-700 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-300 uppercase tracking-wider mb-1">
                Trainer
              </label>
              <input
                type="text"
                value={trainerName}
                onChange={(e) => setTrainerName(e.target.value)}
                placeholder="e.g. Shahin / Musa / Nirob"
                className="w-full px-3 py-1.5 bg-slate-900 text-xs text-slate-100 border border-slate-700 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-300 uppercase tracking-wider mb-1 flex items-center gap-1">
                <Calendar className="w-3 h-3 text-emerald-400" /> Date
              </label>
              <input
                type="text"
                value={trainingDate}
                onChange={(e) => setTrainingDate(e.target.value)}
                placeholder="e.g. 28-Aug-2026 or 2026-08-28"
                className="w-full px-3 py-1.5 bg-slate-900 text-xs text-slate-100 border border-slate-700 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-300 uppercase tracking-wider mb-1 flex items-center gap-1">
                <Clock className="w-3 h-3 text-emerald-400" /> Time
              </label>
              <input
                type="text"
                value={trainingTime}
                onChange={(e) => setTrainingTime(e.target.value)}
                placeholder="e.g. 11:30 AM / 3:00 PM"
                className="w-full px-3 py-1.5 bg-slate-900 text-xs text-slate-100 border border-slate-700 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              />
            </div>
          </div>

          {/* Authentic Google Meet Link Generator Box */}
          <div className="bg-slate-950/70 p-3.5 rounded-xl border border-emerald-500/30 space-y-2.5">
            
            {/* Real Google Calendar Integration Banner */}
            <div className="bg-gradient-to-r from-emerald-950/80 to-slate-900 border border-emerald-500/40 p-2.5 rounded-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2.5">
              <div>
                <h4 className="text-xs font-bold text-emerald-300 flex items-center gap-1.5">
                  <Calendar className="w-4 h-4 text-emerald-400" />
                  <span>Google Calendar Meeting Integration</span>
                </h4>
                <p className="text-[11px] text-slate-300 mt-0.5">
                  Creates an authentic Google Calendar event under your logged-in Google account with a real Google Meet link.
                </p>
              </div>
              <button
                disabled={isSchedulingGoogleCalendar}
                onClick={handleScheduleRealGoogleMeet}
                id="schedule-google-calendar-meet-btn"
                className="px-3 py-1.5 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-bold text-xs rounded-xl shadow-lg shadow-emerald-500/20 flex items-center gap-2 transition-all transform active:scale-95 whitespace-nowrap cursor-pointer shrink-0"
              >
                {isSchedulingGoogleCalendar ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Connecting Calendar...</span>
                  </>
                ) : (
                  <>
                    <Video className="w-3.5 h-3.5" />
                    <span>Create Real Google Meet Link</span>
                  </>
                )}
              </button>
            </div>

            {calendarNotice && (
              <div className="bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 px-3 py-1.5 rounded-lg text-xs font-medium">
                {calendarNotice}
              </div>
            )}

            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pt-0.5">
              <label className="text-xs font-bold text-emerald-300 flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse"></span>
                Official Google Meet Link
              </label>

              <div className="flex items-center gap-2">
                <button
                  onClick={handleGenerateNewLink}
                  className="text-xs text-emerald-400 hover:text-emerald-300 font-semibold flex items-center gap-1.5 px-2 py-1 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 transition-colors"
                >
                  <RefreshCw className="w-3 h-3" /> New Meet Code
                </button>

                <button
                  onClick={handleStartInstantGoogleMeet}
                  className="text-xs text-teal-300 hover:text-teal-200 font-semibold flex items-center gap-1.5 px-2 py-1 rounded-lg bg-teal-500/10 hover:bg-teal-500/20 border border-teal-500/30 transition-colors"
                  title="Open meet.google.com/new to create instant room"
                >
                  <PlayCircle className="w-3 h-3" /> Start Google Meet
                </button>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
              <div className="relative flex-1">
                <input
                  type="text"
                  value={meetLink}
                  onChange={(e) => setMeetLink(e.target.value)}
                  placeholder="https://meet.google.com/xxx-yyyy-zzz"
                  className="w-full pl-3 pr-9 py-2 bg-slate-950 font-mono text-xs text-emerald-400 border border-emerald-500/50 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none shadow-inner"
                />
                <button
                  onClick={handleCopyLink}
                  title="Copy link only"
                  className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-white"
                >
                  {linkCopied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                </button>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={handleOpenCurrentMeet}
                  className="px-3 py-2 bg-emerald-600 hover:bg-emerald-500 text-slate-950 font-bold rounded-xl text-xs flex items-center gap-1.5 transition-colors whitespace-nowrap shadow-md shadow-emerald-600/20"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  <span>Join / Open Meet</span>
                </button>

                {training && onSaveMeetLink && (
                  <button
                    onClick={handleSaveToRecord}
                    className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-emerald-300 border border-slate-700 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors whitespace-nowrap"
                  >
                    {savedStatus ? <Check className="w-3.5 h-3.5 text-emerald-300" /> : <Save className="w-3.5 h-3.5" />}
                    <span>{savedStatus ? 'Saved' : 'Save'}</span>
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Formatted Message Template Box */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs font-bold text-slate-200 flex items-center gap-2">
                <span>Official Invitation Letter / Message Format</span>
                <span className="px-2 py-0.5 text-[10px] bg-emerald-500/10 text-emerald-300 border border-emerald-500/20 rounded-md font-medium">
                  Complete Message
                </span>
              </label>
              <span className="text-[11px] text-slate-400">Ready to send to client</span>
            </div>

            <div className="relative">
              <textarea
                readOnly
                rows={messageText.split('\n').length || 18}
                value={messageText}
                className="w-full p-4 bg-slate-950/90 text-slate-200 font-sans text-xs border border-slate-700/80 rounded-xl focus:outline-none leading-relaxed select-all no-scrollbar resize-none overflow-hidden"
              />
              <button
                onClick={handleCopyMessage}
                id="copy-invitation-message-btn"
                className="absolute top-3 right-3 px-3 py-1.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs rounded-lg shadow-lg flex items-center gap-1.5 transition-all transform active:scale-95 cursor-pointer z-10"
              >
                {copied ? (
                  <>
                    <Check className="w-3.5 h-3.5" />
                    <span>Copied!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>Copy Full Message</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Quick Action Share Channels */}
          <div className="pt-2 border-t border-slate-800 flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={handleWhatsAppWeb}
                id="whatsapp-web-modal-btn"
                className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-slate-950 font-bold border border-emerald-400/40 rounded-xl text-xs flex items-center gap-1.5 transition-all shadow-md shadow-emerald-600/20 cursor-pointer"
                title="Send invitation link directly via WhatsApp Web browser"
              >
                <MessageCircle className="w-4 h-4 text-slate-950 fill-slate-950/20" />
                <span>WhatsApp Web</span>
              </button>

              <button
                onClick={handleWhatsAppApp}
                className="px-3 py-1.5 bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 border border-emerald-500/30 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer"
                title="Send via WhatsApp Application / Mobile"
              >
                <MessageCircle className="w-4 h-4 text-emerald-400" />
                <span>WhatsApp App</span>
              </button>

              <button
                onClick={handleEmail}
                className="px-3 py-1.5 bg-sky-600/20 hover:bg-sky-600/30 text-sky-300 border border-sky-500/30 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer"
              >
                <Mail className="w-4 h-4 text-sky-400" />
                <span>Email Client</span>
              </button>
            </div>

            <button
              onClick={onClose}
              className="px-4 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium rounded-xl transition-colors cursor-pointer"
            >
              Close Window
            </button>
          </div>

        </div>
      </div>
    </div>
  );
};
