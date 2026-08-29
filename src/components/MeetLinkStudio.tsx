import React, { useState } from 'react';
import { 
  Video, 
  Copy, 
  Check, 
  Mail, 
  MessageCircle, 
  ExternalLink, 
  RefreshCw, 
  Sparkles, 
  Calendar, 
  Clock, 
  CheckCircle2,
  Share2,
  PlayCircle,
  Loader2,
  AlertCircle
} from 'lucide-react';
import { TrainingRecord } from '../types';
import { 
  generateRandomMeetCode, 
  formatMeetUrl, 
  getTemplateMessage, 
  GOOGLE_MEET_INSTANT_NEW 
} from '../services/trainingService';
import { createRealGoogleMeetEvent, getGoogleCalendarWebUrl } from '../services/googleCalendarService';
import { TRAINERS_LIST } from '../data/initialTrainings';
import confetti from 'canvas-confetti';

interface MeetLinkStudioProps {
  trainings: TrainingRecord[];
  onOpenAddModal: () => void;
}

export const MeetLinkStudio: React.FC<MeetLinkStudioProps> = ({ trainings }) => {
  // Filter trainings to only "Today" and "Upcoming" trainings
  const todayAndUpcomingTrainings = React.useMemo(() => {
    return trainings.filter(item => {
      if (!item.trainingDate) return false;
      const status = (item.status || '').toLowerCase();
      if (status.includes('cancle') || status.includes('cancel') || status.includes('done') || status === 'completed') {
        return false;
      }
      return true;
    });
  }, [trainings]);

  const initialPhone = todayAndUpcomingTrainings[0]?.clientPhone || trainings[0]?.clientPhone || '';
  const [selectedClient, setSelectedClient] = useState<string>(todayAndUpcomingTrainings[0]?.clientName || trainings[0]?.clientName || 'Acme Ltd');
  const [clientPhone, setClientPhone] = useState<string>(initialPhone);
  const [trainingDate, setTrainingDate] = useState<string>('28-Aug-2026');
  const [trainingTime, setTrainingTime] = useState<string>('11:00 AM');
  const [trainerName, setTrainerName] = useState<string>('Shahin');
  const [meetLink, setMeetLink] = useState<string>(generateRandomMeetCode());
  const [copied, setCopied] = useState<boolean>(false);
  const [linkCopied, setLinkCopied] = useState<boolean>(false);
  const [isSchedulingCalendar, setIsSchedulingCalendar] = useState<boolean>(false);
  const [calendarNotice, setCalendarNotice] = useState<string | null>(null);
  const [calendarError, setCalendarError] = useState<string | null>(null);
  const [calendarUrl, setCalendarUrl] = useState<string | null>(null);

  const handleSelectClient = (name: string) => {
    setSelectedClient(name);
    const found = trainings.find(t => t.clientName === name);
    if (found) {
      setTrainingDate(found.trainingDate || '28-Aug-2026');
      setTrainingTime(found.trainingTime || '11:00 AM');
      setTrainerName(found.pm || 'Shahin');
      setClientPhone(found.clientPhone || '');
      if (found.meetLink) {
        setMeetLink(formatMeetUrl(found.meetLink));
      }
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
    const phone = getCleanPhone(clientPhone);
    const url = phone
      ? `https://web.whatsapp.com/send?phone=${phone}&text=${encoded}`
      : `https://web.whatsapp.com/send?text=${encoded}`;
    window.open(url, '_blank');
  };

  const handleWhatsAppApp = () => {
    const encoded = encodeURIComponent(messageText);
    const phone = getCleanPhone(clientPhone);
    const url = phone
      ? `https://api.whatsapp.com/send?phone=${phone}&text=${encoded}`
      : `https://api.whatsapp.com/send?text=${encoded}`;
    window.open(url, '_blank');
  };

  const handleScheduleGoogleCalendar = async () => {
    if (!selectedClient) {
      alert('Please select or enter a Client Name first.');
      return;
    }

    setIsSchedulingCalendar(true);
    setCalendarNotice(null);
    setCalendarError(null);

    try {
      const found = trainings.find(t => t.clientName === selectedClient);
      const res = await createRealGoogleMeetEvent({
        clientName: selectedClient,
        ticketId: found?.ticketId,
        trainingDate: trainingDate,
        trainingTime: trainingTime,
        pm: trainerName,
        assignedPerson: found?.assignedPerson,
        package: found?.package,
        clientEmail: found?.clientEmail
      });

      setMeetLink(res.meetLink);
      setCalendarUrl(res.calendarEventUrl);
      setCalendarNotice(`✅ Google Calendar event scheduled with real Google Meet: ${res.meetLink}`);
      confetti({ particleCount: 50, spread: 70, origin: { y: 0.6 } });
    } catch (err: any) {
      console.error('Calendar Error:', err);
      setCalendarError(err?.message || 'Failed to schedule Google Calendar event');
    } finally {
      setIsSchedulingCalendar(false);
    }
  };

  const formattedMeetLink = formatMeetUrl(meetLink);
  const messageText = getTemplateMessage(
    selectedClient,
    trainingDate,
    trainingTime,
    trainerName,
    formattedMeetLink
  );

  const handleCopyMessage = () => {
    navigator.clipboard.writeText(messageText);
    setCopied(true);
    confetti({ particleCount: 30, spread: 60, origin: { y: 0.7 } });
    setTimeout(() => setCopied(false), 2000);
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(formattedMeetLink);
    setLinkCopied(true);
    setTimeout(() => setLinkCopied(false), 2000);
  };

  const handleNewLink = () => {
    setMeetLink(generateRandomMeetCode());
  };

  const handleStartInstantGoogleMeet = () => {
    window.open(GOOGLE_MEET_INSTANT_NEW, '_blank');
  };

  return (
    <div className="space-y-6 pb-12 max-w-5xl mx-auto">
      
      {/* Header */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-emerald-950/60 border border-slate-800 rounded-2xl p-6 shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded-md bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-xs font-semibold flex items-center gap-1.5">
              <Video className="w-3.5 h-3.5 text-emerald-400" />
              Tipsoi Meet Link &amp; Invitation Studio
            </span>
          </div>
          <h1 className="text-2xl font-extrabold text-white tracking-tight">
            Original Google Meet Link &amp; Client Notification Generator
          </h1>
          <p className="text-xs text-slate-300 mt-1">
            Generate authentic Google Meet links and easily dispatch official invitations via WhatsApp and Email.
          </p>
        </div>

        <button
          onClick={handleStartInstantGoogleMeet}
          className="px-4 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs rounded-xl shadow-lg shadow-emerald-500/20 flex items-center gap-2 transition-all transform active:scale-95 whitespace-nowrap cursor-pointer"
        >
          <PlayCircle className="w-4 h-4" />
          <span>Launch Google Meet</span>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Form Controls */}
        <div className="lg:col-span-5 bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4">
          <h3 className="text-sm font-bold text-white flex items-center gap-2 border-b border-slate-800 pb-3">
            <Sparkles className="w-4 h-4 text-emerald-400" />
            <span>Customize Invitation Details</span>
          </h3>

          {/* Client Selection */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Select Client from Today &amp; Upcoming Trainings
            </label>
            <input
              type="text"
              list="client-suggestions"
              value={selectedClient}
              onChange={(e) => handleSelectClient(e.target.value)}
              placeholder="e.g. Select client name"
              className="w-full px-3 py-2 bg-slate-950 text-xs text-slate-100 border border-slate-700 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none"
            />
            <datalist id="client-suggestions">
              {todayAndUpcomingTrainings.map((t) => (
                <option key={t.id} value={t.clientName} />
              ))}
            </datalist>
          </div>

          {/* Client Phone for WhatsApp */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Client WhatsApp / Phone Number
            </label>
            <input
              type="text"
              value={clientPhone}
              onChange={(e) => setClientPhone(e.target.value)}
              placeholder="e.g. 01712345678"
              className="w-full px-3 py-2 bg-slate-950 text-xs text-slate-100 border border-slate-700 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none"
            />
          </div>

          {/* Trainer */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Trainer (PM)
            </label>
            <select
              value={trainerName}
              onChange={(e) => setTrainerName(e.target.value)}
              className="w-full px-3 py-2 bg-slate-950 text-xs text-slate-100 border border-slate-700 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none"
            >
              {TRAINERS_LIST.map((t) => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
          </div>

          {/* Date & Time */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Training Date
              </label>
              <input
                type="text"
                value={trainingDate}
                onChange={(e) => setTrainingDate(e.target.value)}
                placeholder="28-Aug-2026"
                className="w-full px-3 py-2 bg-slate-950 text-xs text-slate-100 border border-slate-700 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Training Time
              </label>
              <input
                type="text"
                value={trainingTime}
                onChange={(e) => setTrainingTime(e.target.value)}
                placeholder="11:00 AM"
                className="w-full px-3 py-2 bg-slate-950 text-xs text-slate-100 border border-slate-700 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              />
            </div>
          </div>

          {/* Google Calendar Real Meet Integration */}
          <div className="bg-gradient-to-r from-emerald-950/70 to-slate-950 border border-emerald-500/40 p-3.5 rounded-xl space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-emerald-300 flex items-center gap-1.5">
                <Calendar className="w-4 h-4 text-emerald-400" />
                Google Calendar Integration
              </span>
              <span className="text-[10px] bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded border border-emerald-500/30">
                Real Google Meet
              </span>
            </div>
            <p className="text-[11px] text-slate-300">
              Create an event on your logged-in Google Calendar and automatically generate a real Google Meet link.
            </p>
            <button
              disabled={isSchedulingCalendar}
              onClick={handleScheduleGoogleCalendar}
              id="studio-schedule-google-calendar-btn"
              className="w-full py-2 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-bold text-xs rounded-xl shadow-lg shadow-emerald-500/20 flex items-center justify-center gap-2 transition-all transform active:scale-95 cursor-pointer disabled:opacity-50"
            >
              {isSchedulingCalendar ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Scheduling on Google Calendar...</span>
                </>
              ) : (
                <>
                  <Video className="w-3.5 h-3.5" />
                  <span>Generate Real Google Meet Link</span>
                </>
              )}
            </button>

            {calendarError && (
              <div className="text-[11px] text-rose-300 bg-rose-500/10 p-2 rounded-lg border border-rose-500/20 space-y-1">
                <div className="flex items-center gap-1 font-semibold text-rose-200">
                  <AlertCircle className="w-3.5 h-3.5" />
                  <span>Error connecting Calendar</span>
                </div>
                <p>{calendarError}</p>
                <button
                  onClick={handleScheduleGoogleCalendar}
                  className="mt-1 px-2 py-0.5 bg-rose-500/20 hover:bg-rose-500/30 rounded text-[10px] font-semibold text-rose-200"
                >
                  Retry
                </button>
              </div>
            )}

            {calendarNotice && (
              <div className="text-[11px] text-emerald-300 bg-emerald-500/10 p-2 rounded-lg border border-emerald-500/20 space-y-1">
                <p className="flex items-center gap-1.5 font-medium">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  <span>{calendarNotice}</span>
                </p>
                {calendarUrl && (
                  <a
                    href={calendarUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-block mt-1 text-[11px] text-emerald-400 hover:underline font-semibold"
                  >
                    Open in Google Calendar ↗
                  </a>
                )}
              </div>
            )}
          </div>

          {/* Google Meet Link */}
          <div className="space-y-1.5 pt-2 border-t border-slate-800">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-emerald-300 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
                Official Google Meet Link
              </label>
              <button
                onClick={handleNewLink}
                className="text-[11px] text-emerald-400 hover:text-emerald-300 flex items-center gap-1"
              >
                <RefreshCw className="w-3 h-3" /> New Meet Code
              </button>
            </div>
            <input
              type="text"
              value={meetLink}
              onChange={(e) => setMeetLink(e.target.value)}
              placeholder="https://meet.google.com/xxx-yyyy-zzz"
              className="w-full px-3 py-2 bg-slate-950 font-mono text-xs text-emerald-400 border border-emerald-500/40 rounded-xl focus:outline-none"
            />
          </div>

          {/* Quick Buttons */}
          <div className="flex items-center gap-2 pt-2">
            <button
              onClick={handleCopyLink}
              className="flex-1 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium rounded-xl border border-slate-700 flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
            >
              {linkCopied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{linkCopied ? 'Link Copied!' : 'Copy Link Only'}</span>
            </button>

            <a
              href={formattedMeetLink}
              target="_blank"
              rel="noreferrer"
              className="px-3 py-2 bg-emerald-600 hover:bg-emerald-500 text-slate-950 font-bold text-xs rounded-xl flex items-center gap-1.5 transition-colors shadow-md shadow-emerald-600/20"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              <span>Join Meet</span>
            </a>
          </div>

        </div>

        {/* Right Preview Output */}
        <div className="lg:col-span-7 bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-3 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Share2 className="w-4 h-4 text-emerald-400" />
                <span>Official Invitation Letter / Message Format</span>
              </h3>
              <span className="text-xs text-emerald-400 font-medium bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-md">
                Full Message Preview
              </span>
            </div>

            <div className="relative mt-3">
              <textarea
                readOnly
                rows={messageText.split('\n').length || 18}
                value={messageText}
                className="w-full p-4 bg-slate-950 text-slate-200 font-sans text-xs border border-slate-700/80 rounded-xl focus:outline-none leading-relaxed select-all no-scrollbar resize-none overflow-hidden"
              />
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
            <button
              onClick={handleCopyMessage}
              id="copy-studio-message-btn"
              className="px-4 py-2.5 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-bold text-xs rounded-xl shadow-lg shadow-emerald-500/20 flex items-center gap-2 transition-all transform active:scale-95 cursor-pointer"
            >
              {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
              <span>{copied ? 'Copied to Clipboard!' : 'Copy Full Message'}</span>
            </button>

            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={handleWhatsAppWeb}
                id="whatsapp-web-studio-btn"
                className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 text-slate-950 font-bold border border-emerald-400/40 rounded-xl text-xs flex items-center gap-1.5 transition-all shadow-md shadow-emerald-600/20 cursor-pointer"
                title="Send invitation directly via WhatsApp Web in browser"
              >
                <MessageCircle className="w-4 h-4 text-slate-950 fill-slate-950/20" />
                <span>WhatsApp Web</span>
              </button>

              <button
                onClick={handleWhatsAppApp}
                className="px-3.5 py-2 bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 border border-emerald-500/30 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
                title="Open WhatsApp Application"
              >
                <MessageCircle className="w-3.5 h-3.5" />
                <span>WhatsApp App</span>
              </button>

              <button
                onClick={() => {
                  const subject = encodeURIComponent(`Tipsoi HRM Training Session - ${selectedClient}`);
                  const body = encodeURIComponent(messageText);
                  window.open(`mailto:?subject=${subject}&body=${body}`, '_blank');
                }}
                className="px-3.5 py-2 bg-sky-600/20 hover:bg-sky-600/30 text-sky-300 border border-sky-500/30 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <Mail className="w-3.5 h-3.5" />
                <span>Email</span>
              </button>
            </div>
          </div>

        </div>

      </div>

    </div>
  );
};
