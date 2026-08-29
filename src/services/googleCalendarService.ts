/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import configJson from '../../firebase-applet-config.json';
import { signInWithGoogle } from '../lib/firebase';
import { formatMeetUrl } from './trainingService';

const GOOGLE_CLIENT_ID = configJson.oAuthClientId || '';
const CALENDAR_SCOPE = 'https://www.googleapis.com/auth/calendar.events https://www.googleapis.com/auth/calendar';
const TOKEN_STORAGE_KEY = 'tipsoi_google_calendar_access_token';
const TOKEN_EXPIRY_KEY = 'tipsoi_google_calendar_token_expires_at';

declare global {
  interface Window {
    google?: any;
  }
}

/**
 * Load Google Identity Services library if not already loaded
 */
export async function ensureGisScriptLoaded(): Promise<boolean> {
  if (typeof window === 'undefined') return false;
  if (window.google?.accounts?.oauth2) return true;

  return new Promise((resolve) => {
    const existing = document.querySelector('script[src*="accounts.google.com/gsi/client"]');
    if (existing) {
      existing.addEventListener('load', () => resolve(true));
      setTimeout(() => resolve(!!window.google?.accounts?.oauth2), 1500);
      return;
    }

    const script = document.createElement('script');
    script.src = 'https://accounts.google.com/gsi/client';
    script.async = true;
    script.defer = true;
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.head.appendChild(script);
  });
}

/**
 * Get stored OAuth token if valid
 */
export function getSavedCalendarToken(): string | null {
  try {
    const token = localStorage.getItem(TOKEN_STORAGE_KEY);
    const expiry = localStorage.getItem(TOKEN_EXPIRY_KEY);
    if (!token) return null;
    if (expiry && Date.now() > parseInt(expiry, 10)) {
      localStorage.removeItem(TOKEN_STORAGE_KEY);
      localStorage.removeItem(TOKEN_EXPIRY_KEY);
      return null;
    }
    return token;
  } catch {
    return null;
  }
}

/**
 * Save OAuth token with expiration
 */
export function saveCalendarToken(token: string, expiresInSeconds: number = 3599): void {
  try {
    localStorage.setItem(TOKEN_STORAGE_KEY, token);
    localStorage.setItem(TOKEN_EXPIRY_KEY, (Date.now() + (expiresInSeconds - 60) * 1000).toString());
  } catch {
    // Ignore storage issues
  }
}

/**
 * Remove saved OAuth token
 */
export function clearSavedCalendarToken(): void {
  try {
    localStorage.removeItem(TOKEN_STORAGE_KEY);
    localStorage.removeItem(TOKEN_EXPIRY_KEY);
  } catch {
    // Ignore storage issues
  }
}

/**
 * Request OAuth Access Token from user via Google Identity Services Token Client
 */
export const requestGoogleCalendarToken = async (forcePrompt: boolean = false): Promise<string> => {
  // 1. Return valid saved token if not forcing fresh authorization
  if (!forcePrompt) {
    const saved = getSavedCalendarToken();
    if (saved) return saved;
  }

  // 2. Ensure Google Identity Services script is available
  await ensureGisScriptLoaded();

  if (!GOOGLE_CLIENT_ID) {
    throw new Error('Google OAuth Client ID is not configured in firebase-applet-config.json.');
  }

  // 3. Request token via Google Identity Services (GIS)
  if (window.google?.accounts?.oauth2) {
    return new Promise<string>((resolve, reject) => {
      try {
        const tokenClient = window.google.accounts.oauth2.initTokenClient({
          client_id: GOOGLE_CLIENT_ID,
          scope: CALENDAR_SCOPE,
          prompt: forcePrompt ? 'consent' : '',
          callback: (response: any) => {
            if (response.error) {
              console.error('GIS Error:', response);
              reject(new Error(response.error_description || response.error || 'Google Authorization failed'));
              return;
            }
            if (response.access_token) {
              const expiresIn = response.expires_in ? parseInt(response.expires_in, 10) : 3599;
              saveCalendarToken(response.access_token, expiresIn);
              resolve(response.access_token);
            } else {
              reject(new Error('No access token returned from Google.'));
            }
          },
          error_callback: (err: any) => {
            console.error('GIS Error callback:', err);
            reject(new Error(err?.message || 'Google Sign-in popup was cancelled or blocked. Please allow popups.'));
          }
        });

        tokenClient.requestAccessToken({ prompt: forcePrompt ? 'consent' : '' });
      } catch (err: any) {
        reject(new Error(err.message || 'Failed to initialize Google OAuth Token Client.'));
      }
    });
  }

  // 4. Fallback to Firebase Google Sign-In with Calendar scope
  try {
    const { accessToken } = await signInWithGoogle();
    if (accessToken) {
      saveCalendarToken(accessToken, 3599);
      return accessToken;
    }
  } catch (err: any) {
    console.warn('Firebase sign-in fallback failed:', err);
  }

  throw new Error('Google authentication service is loading. Please try clicking the button again.');
};

/**
 * Format Date to RFC3339 / ISO 8601 with local timezone offset
 */
function formatToISOWithOffset(date: Date): string {
  const pad = (n: number) => String(Math.floor(Math.abs(n))).padStart(2, '0');
  const tzOffset = -date.getTimezoneOffset();
  const sign = tzOffset >= 0 ? '+' : '-';
  const offsetHours = pad(tzOffset / 60);
  const offsetMinutes = pad(tzOffset % 60);

  const year = date.getFullYear();
  const month = pad(date.getMonth() + 1);
  const day = pad(date.getDate());
  const hours = pad(date.getHours());
  const mins = pad(date.getMinutes());
  const secs = pad(date.getSeconds());

  return `${year}-${month}-${day}T${hours}:${mins}:${secs}${sign}${offsetHours}:${offsetMinutes}`;
}

/**
 * Parse any date/time string into robust start and end dates
 */
export function parseDateTimeToISO(dateStr?: string, timeStr?: string): { startISO: string; endISO: string; timeZone: string } {
  const userTZ = Intl.DateTimeFormat().resolvedOptions().timeZone || 'Asia/Dhaka';
  let targetDate = new Date();

  if (dateStr && typeof dateStr === 'string' && dateStr.trim()) {
    const raw = dateStr.trim();

    // Check YYYY-MM-DD
    if (/^\d{4}-\d{2}-\d{2}$/.test(raw)) {
      const parts = raw.split('-');
      const y = parseInt(parts[0], 10);
      const m = parseInt(parts[1], 10) - 1;
      const d = parseInt(parts[2], 10);
      targetDate = new Date(y, m, d);
    }
    // Check DD/MM/YYYY or DD-MM-YYYY
    else if (/^\d{1,2}[/-]\d{1,2}[/-]\d{2,4}$/.test(raw)) {
      const parts = raw.split(/[/-]/);
      const d = parseInt(parts[0], 10);
      const m = parseInt(parts[1], 10) - 1;
      let y = parseInt(parts[2], 10);
      if (y < 100) y += 2000;
      targetDate = new Date(y, m, d);
    }
    // Check DD-Mon-YYYY (e.g. 28-Aug-2026 or 28 Aug 2026)
    else if (/^\d{1,2}[-\s/][A-Za-z]{3,9}[-\s/]\d{2,4}$/.test(raw)) {
      const monthMap: Record<string, number> = {
        jan: 0, feb: 1, mar: 2, apr: 3, may: 4, jun: 5,
        jul: 6, aug: 7, sep: 8, oct: 9, nov: 10, dec: 11
      };
      const match = raw.match(/^(\d{1,2})[-\s/]([A-Za-z]{3,9})[-\s/](\d{2,4})$/);
      if (match) {
        const d = parseInt(match[1], 10);
        const mKey = match[2].slice(0, 3).toLowerCase();
        const m = monthMap[mKey] ?? 0;
        let y = parseInt(match[3], 10);
        if (y < 100) y += 2000;
        targetDate = new Date(y, m, d);
      }
    } else {
      const parsed = new Date(raw);
      if (!isNaN(parsed.getTime())) {
        targetDate = parsed;
      }
    }
  }

  if (isNaN(targetDate.getTime())) {
    targetDate = new Date();
  }

  let hours = 11;
  let minutes = 0;

  if (timeStr && typeof timeStr === 'string' && timeStr.trim()) {
    const cleanTime = timeStr.trim().toUpperCase();
    const isPM = cleanTime.includes('PM');
    const isAM = cleanTime.includes('AM');
    const timeMatch = cleanTime.match(/(\d{1,2}):?(\d{2})?/);
    if (timeMatch) {
      hours = parseInt(timeMatch[1], 10);
      minutes = timeMatch[2] ? parseInt(timeMatch[2], 10) : 0;
      if (isPM && hours < 12) hours += 12;
      if (isAM && hours === 12) hours = 0;
    }
  }

  const startDate = new Date(targetDate.getFullYear(), targetDate.getMonth(), targetDate.getDate(), hours, minutes, 0);
  const endDate = new Date(startDate.getTime() + 60 * 60 * 1000); // 1 hour session

  return {
    startISO: formatToISOWithOffset(startDate),
    endISO: formatToISOWithOffset(endDate),
    timeZone: userTZ
  };
}

export interface CreateCalendarEventParams {
  clientName: string;
  ticketId?: string;
  trainingDate?: string;
  trainingTime?: string;
  pm?: string;
  assignedPerson?: string;
  package?: string;
  clientEmail?: string;
}

export interface GoogleCalendarEventResult {
  eventId: string;
  meetLink: string;
  calendarEventUrl: string;
  summary: string;
  isCalendarSynced: boolean;
  organizerEmail?: string;
}

/**
 * Creates a REAL Google Calendar event with authentic Google Meet link in the logged-in user's Google Calendar.
 */
export const createRealGoogleMeetEvent = async (
  params: CreateCalendarEventParams
): Promise<GoogleCalendarEventResult> => {
  const { startISO, endISO, timeZone } = parseDateTimeToISO(
    params.trainingDate || '',
    params.trainingTime || '11:00 AM'
  );

  const eventSummary = `Tipsoi Training: ${params.clientName}${params.ticketId ? ` (${params.ticketId})` : ''}`;
  const eventDescription = [
    `🎯 Client Training Session: ${params.clientName}`,
    `👤 Client Name: ${params.clientName}`,
    `📦 Package: ${params.package || 'Standard'}`,
    `🎫 Ticket ID: ${params.ticketId || 'N/A'}`,
    `👨‍💼 Assigned Person (KAM): ${params.assignedPerson || 'N/A'}`,
    `👨‍🏫 Trainer / PM: ${params.pm || 'N/A'}`,
    ``,
    `━━━━━━━━━━━━━━━━━━━━━━━━━━━`,
    `Created via Tipsoi Training Management System`,
    `Google Meet video conference will be active at the scheduled time.`
  ].join('\n');

  // Step 1: Obtain Google OAuth Access Token
  let token = await requestGoogleCalendarToken();

  // Helper function to call the Google Calendar API
  const makeCalendarApiCall = async (authToken: string) => {
    const requestId = `tipsoi_meet_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
    const attendeesList: Array<{ email: string }> = [];
    if (params.clientEmail && params.clientEmail.includes('@')) {
      attendeesList.push({ email: params.clientEmail.trim() });
    }

    const payload: any = {
      summary: eventSummary,
      description: eventDescription,
      start: {
        dateTime: startISO,
        timeZone: timeZone
      },
      end: {
        dateTime: endISO,
        timeZone: timeZone
      },
      conferenceData: {
        createRequest: {
          requestId: requestId,
          conferenceSolutionKey: {
            type: 'hangoutsMeet'
          }
        }
      },
      reminders: {
        useDefault: false,
        overrides: [
          { method: 'popup', minutes: 15 },
          { method: 'email', minutes: 60 }
        ]
      }
    };

    if (attendeesList.length > 0) {
      payload.attendees = attendeesList;
    }

    return await fetch(
      'https://www.googleapis.com/calendar/v3/calendars/primary/events?conferenceDataVersion=1',
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      }
    );
  };

  let response = await makeCalendarApiCall(token);

  // If token expired (401), clear saved token and prompt fresh token once
  if (response.status === 401) {
    clearSavedCalendarToken();
    token = await requestGoogleCalendarToken(true);
    response = await makeCalendarApiCall(token);
  }

  if (!response.ok) {
    const errorBody = await response.json().catch(() => ({}));
    const errorMsg = errorBody.error?.message || `Google Calendar API error (HTTP ${response.status})`;
    throw new Error(errorMsg);
  }

  const data = await response.json();

  // Extract Real Google Meet URL
  let realMeetLink = data.hangoutLink;
  if (!realMeetLink && data.conferenceData?.entryPoints) {
    const videoEntry = data.conferenceData.entryPoints.find(
      (ep: any) => ep.entryPointType === 'video'
    );
    if (videoEntry) {
      realMeetLink = videoEntry.uri;
    }
  }

  if (!realMeetLink) {
    // If Google Meet conference creation was queued by Google, provide conferenceData or link
    if (data.conferenceData?.conferenceId) {
      realMeetLink = `https://meet.google.com/${data.conferenceData.conferenceId}`;
    } else {
      throw new Error('Google Calendar event was created, but Google Meet link was not returned by Google API.');
    }
  }

  return {
    eventId: data.id,
    meetLink: formatMeetUrl(realMeetLink),
    calendarEventUrl: data.htmlLink || `https://calendar.google.com/calendar/r/eventedit/${data.id}`,
    summary: data.summary || eventSummary,
    isCalendarSynced: true,
    organizerEmail: data.organizer?.email || data.creator?.email
  };
};

/**
 * Generate Google Calendar Web Template URL as an auxiliary manual link
 */
export const getGoogleCalendarWebUrl = (params: CreateCalendarEventParams, meetLink: string): string => {
  const { startISO, endISO } = parseDateTimeToISO(params.trainingDate, params.trainingTime);
  const startCompact = startISO.replace(/[-:]/g, '').replace(/\.\d{3}/, '').replace(/\+\d{2}\d{2}/, 'Z');
  const endCompact = endISO.replace(/[-:]/g, '').replace(/\.\d{3}/, '').replace(/\+\d{2}\d{2}/, 'Z');

  const title = encodeURIComponent(`Tipsoi Training: ${params.clientName}${params.ticketId ? ` (${params.ticketId})` : ''}`);
  const details = encodeURIComponent(
    `Client Training Session: ${params.clientName}\nTrainer: ${params.pm || 'N/A'}\nKAM: ${params.assignedPerson || 'N/A'}\nPackage: ${params.package || 'N/A'}\nMeet Link: ${meetLink}`
  );

  return `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${title}&dates=${startCompact}/${endCompact}&details=${details}&location=${encodeURIComponent(meetLink)}`;
};
