/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import * as XLSX from 'xlsx';
import { TrainingRecord, TrainingStatus } from '../types';
import { formatTrainingDate } from '../utils/dateUtils';

export interface ExcelImportResult {
  records: TrainingRecord[];
  successCount: number;
  errorMessages: string[];
}

/**
 * Parses uploaded Excel (.xlsx, .xls) or CSV file into TrainingRecord array
 */
export const parseExcelOrCsvFile = async (file: File): Promise<ExcelImportResult> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });
        
        const firstSheetName = workbook.SheetNames[0];
        if (!firstSheetName) {
          resolve({ records: [], successCount: 0, errorMessages: ['Excel file is empty or has no valid sheets.'] });
          return;
        }

        const worksheet = workbook.Sheets[firstSheetName];
        const rawJson: any[] = XLSX.utils.sheet_to_json(worksheet, { defval: '' });

        if (!rawJson || rawJson.length === 0) {
          resolve({ records: [], successCount: 0, errorMessages: ['No data rows found in Excel sheet.'] });
          return;
        }

        const importedRecords: TrainingRecord[] = [];
        const errors: string[] = [];

        rawJson.forEach((row, index) => {
          const rowNum = index + 2; // header is row 1
          
          // Find matching values regardless of exact column casing
          const clientName = findValue(row, ['Client Name', 'Client', 'Company Name', 'Name', 'Company', 'Customer']);
          const ticketId = findValue(row, ['Ticket ID', 'Ticket', 'TicketId', 'ID', 'Ticket No']);
          const assignedPerson = findValue(row, ['Assigned Person', 'Assigned KAM', 'Assigned', 'KAM', 'Assigned To']);
          const pkg = findValue(row, ['Package', 'Plan', 'Pkg']);
          const manpowerSubmission = findValue(row, ['Manpower Submission', 'Manpower', 'Submission', 'Staff Submission']);
          const trainingDate = findValue(row, ['Training Date', 'Date', 'Schedule Date']);
          const trainingTime = findValue(row, ['Training Time', 'Time', 'Schedule Time']);
          const pm = findValue(row, ['PM', 'Trainer', 'PM / Trainer', 'Project Manager']);
          const statusRaw = findValue(row, ['Status', 'Training Status']);
          const meetLink = findValue(row, ['Meet Link', 'Google Meet', 'Link', 'Meeting Link']);

          if (!clientName) {
            errors.push(`Row ${rowNum}: Missing Client Name (Skipped).`);
            return;
          }

          let normalizedStatus: TrainingStatus = 'To-Do';
          if (statusRaw) {
            const stUpper = statusRaw.trim().toUpperCase();
            if (stUpper.includes('DONE') || stUpper.includes('COMPLETE')) normalizedStatus = 'Done';
            else if (stUpper.includes('ONGOING') || stUpper.includes('IN PROGRESS')) normalizedStatus = 'Ongoing';
            else if (stUpper.includes('HOLD') || stUpper.includes('PAUSE')) normalizedStatus = 'Hold';
            else if (stUpper.includes('CANCEL') || stUpper.includes('WO CANCLE')) normalizedStatus = 'Cancel';
            else if (stUpper.includes('TICKET')) normalizedStatus = 'Ticket Sub Due';
            else if (stUpper.includes('W/O CANCLE')) normalizedStatus = 'W/O Cancle';
          }

          const uniqueId = typeof crypto !== 'undefined' && crypto.randomUUID
            ? `excel_${crypto.randomUUID()}`
            : `excel_${Date.now()}_${index}_${Math.random().toString(36).substring(2, 9)}_${Math.random().toString(36).substring(2, 9)}`;

          const record: TrainingRecord = {
            id: uniqueId,
            clientName: clientName.toString().trim(),
            ticketId: ticketId ? ticketId.toString().trim() : `TK-${1000 + index}`,
            assignedPerson: assignedPerson ? assignedPerson.toString().trim() : 'Unassigned',
            package: pkg ? pkg.toString().trim() : 'Standard',
            manpowerSubmission: manpowerSubmission ? manpowerSubmission.toString().trim() : 'Pending',
            trainingDate: trainingDate ? formatTrainingDate(trainingDate.toString().trim()) : 'TBD',
            trainingTime: trainingTime ? trainingTime.toString().trim() : '11:00 AM',
            pm: pm ? pm.toString().trim() : 'Shahin',
            status: normalizedStatus,
            meetLink: meetLink ? meetLink.toString().trim() : undefined,
            createdAt: new Date().toISOString()
          };

          importedRecords.push(record);
        });

        resolve({
          records: importedRecords,
          successCount: importedRecords.length,
          errorMessages: errors
        });

      } catch (err: any) {
        reject(new Error(`Failed to parse Excel file: ${err.message}`));
      }
    };

    reader.onerror = () => {
      reject(new Error('File reading error. Please select a valid Excel or CSV file.'));
    };

    reader.readAsArrayBuffer(file);
  });
};

/**
 * Helper to match object key flexibly
 */
function findValue(row: Record<string, any>, possibleKeys: string[]): any {
  const rowKeys = Object.keys(row);
  for (const pKey of possibleKeys) {
    const exact = rowKeys.find(k => k.trim().toLowerCase() === pKey.toLowerCase());
    if (exact && row[exact] !== undefined && row[exact] !== null && row[exact] !== '') {
      return row[exact];
    }
  }
  return '';
}

/**
 * Exports current trainings dataset to .xlsx format
 */
export const exportTrainingsToExcel = (trainings: TrainingRecord[]) => {
  const exportData = trainings.map((t, i) => ({
    'SL': i + 1,
    'Client Name': t.clientName,
    'Ticket ID': t.ticketId,
    'Trainer': t.assignedPerson,
    'Package': t.package,
    'Manpower Submission': t.manpowerSubmission || 'N/A',
    'Training Date': t.trainingDate,
    'Training Time': t.trainingTime || '11:00 AM',
    'KAM/PM': t.pm,
    'Status': t.status,
    'Google Meet Link': t.meetLink || ''
  }));

  const worksheet = XLSX.utils.json_to_sheet(exportData);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Clients');

  const fileName = `Tipsoi_Client_Training_List_${new Date().toISOString().slice(0, 10)}.xlsx`;
  XLSX.writeFile(workbook, fileName);
};

/**
 * Downloads a sample Excel Template for users to fill in
 */
export const downloadSampleExcelTemplate = () => {
  const sampleData = [
    {
      'Client Name': 'Acme Global Logistics',
      'Ticket ID': 'TK-5001',
      'Trainer': 'Fahad',
      'Package': 'Customized',
      'Manpower Submission': 'Submitted',
      'Training Date': '30/08/2026',
      'Training Time': '11:30 AM',
      'KAM/PM': 'Shahin',
      'Status': 'To-Do',
      'Google Meet Link': 'https://meet.google.com/abc-defg-hij'
    },
    {
      'Client Name': 'Apex Digital Group',
      'Ticket ID': 'TK-5002',
      'Trainer': 'Mehedi',
      'Package': 'Standard',
      'Manpower Submission': 'Pending',
      'Training Date': '31/08/2026',
      'Training Time': '03:00 PM',
      'KAM/PM': 'Musa',
      'Status': 'Ongoing',
      'Google Meet Link': ''
    }
  ];

  const worksheet = XLSX.utils.json_to_sheet(sampleData);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Sample_Import_Template');

  XLSX.writeFile(workbook, 'Tipsoi_Client_Import_Sample_Template.xlsx');
};
