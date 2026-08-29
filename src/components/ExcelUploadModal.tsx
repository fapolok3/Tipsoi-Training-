/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef } from 'react';
import { 
  X, 
  FileSpreadsheet, 
  Upload, 
  FileText, 
  CheckCircle2, 
  AlertCircle, 
  Download, 
  Loader2,
  Trash2,
  Sparkles
} from 'lucide-react';
import { TrainingRecord } from '../types';
import { parseExcelOrCsvFile, downloadSampleExcelTemplate, ExcelImportResult } from '../services/excelService';
import { formatTrainingDate } from '../utils/dateUtils';

interface ExcelUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImportSuccess: (records: TrainingRecord[]) => void;
}

export const ExcelUploadModal: React.FC<ExcelUploadModalProps> = ({
  isOpen,
  onClose,
  onImportSuccess
}) => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isParsing, setIsParsing] = useState(false);
  const [parseResult, setParseResult] = useState<ExcelImportResult | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleFileChange = async (file: File) => {
    if (!file.name.match(/\.(xlsx|xls|csv)$/i)) {
      alert('Please upload a valid Excel (.xlsx, .xls) or CSV file.');
      return;
    }

    setSelectedFile(file);
    setIsParsing(true);
    setParseResult(null);

    try {
      const result = await parseExcelOrCsvFile(file);
      setParseResult(result);
    } catch (err: any) {
      alert(err.message || 'Failed to read file.');
    } finally {
      setIsParsing(false);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileChange(e.dataTransfer.files[0]);
    }
  };

  const handleSaveImported = () => {
    if (parseResult && parseResult.records.length > 0) {
      onImportSuccess(parseResult.records);
      onClose();
      // Reset state
      setSelectedFile(null);
      setParseResult(null);
    }
  };

  const handleClear = () => {
    setSelectedFile(null);
    setParseResult(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-3xl text-white shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        
        {/* Modal Header */}
        <div className="px-6 py-4 bg-gradient-to-r from-slate-900 via-slate-800 to-emerald-950/60 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-500 to-teal-500 flex items-center justify-center shadow-lg shadow-emerald-500/20 text-slate-950 font-bold">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <span>Batch Upload Clients from Excel / CSV</span>
                <span className="px-2 py-0.5 rounded-full text-[10px] bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                  .XLSX / .CSV
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                Bulk upload multiple client training schedules instantly
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

        {/* Content */}
        <div className="p-6 space-y-5">
          
          {/* Action Header: Download Template */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-slate-800/40 p-3.5 rounded-xl border border-slate-700/50">
            <div className="flex items-center gap-2.5">
              <Sparkles className="w-4 h-4 text-emerald-400 shrink-0" />
              <p className="text-xs text-slate-300">
                Need the standard column structure? Download our pre-formatted sample Excel file.
              </p>
            </div>
            <button
              onClick={downloadSampleExcelTemplate}
              className="px-3 py-1.5 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-xs font-semibold rounded-lg flex items-center gap-1.5 transition-colors whitespace-nowrap cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download Excel Template</span>
            </button>
          </div>

          {/* Upload Dropzone */}
          {!selectedFile ? (
            <div
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-all ${
                dragActive
                  ? 'border-emerald-500 bg-emerald-500/10 scale-[0.99]'
                  : 'border-slate-700 hover:border-emerald-500/60 bg-slate-950/50 hover:bg-slate-950/80'
              }`}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".xlsx, .xls, .csv"
                onChange={(e) => e.target.files?.[0] && handleFileChange(e.target.files[0])}
                className="hidden"
              />
              <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-slate-800 flex items-center justify-center text-emerald-400">
                <Upload className="w-6 h-6" />
              </div>
              <h3 className="text-sm font-bold text-white">
                Drag &amp; Drop Excel / CSV file here
              </h3>
              <p className="text-xs text-slate-400 mt-1">
                Supports <strong className="text-emerald-300">.xlsx</strong>, <strong className="text-emerald-300">.xls</strong>, and <strong className="text-emerald-300">.csv</strong> formats
              </p>
              <button
                type="button"
                className="mt-4 px-4 py-2 bg-slate-800 hover:bg-slate-750 text-emerald-300 border border-slate-700 text-xs font-semibold rounded-xl inline-flex items-center gap-2 cursor-pointer"
              >
                Browse Files
              </button>
            </div>
          ) : (
            <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-4 space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <div className="flex items-center gap-3">
                  <FileText className="w-6 h-6 text-emerald-400" />
                  <div>
                    <h4 className="text-xs font-bold text-white">{selectedFile.name}</h4>
                    <p className="text-[11px] text-slate-400">
                      {(selectedFile.size / 1024).toFixed(1)} KB
                    </p>
                  </div>
                </div>
                <button
                  onClick={handleClear}
                  className="p-1.5 text-slate-400 hover:text-red-400 rounded-lg hover:bg-slate-800 transition-colors"
                  title="Remove file"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>

              {isParsing && (
                <div className="flex items-center justify-center py-6 gap-2 text-xs text-emerald-400 font-semibold">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Parsing Excel rows...</span>
                </div>
              )}

              {parseResult && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                      Parsed {parseResult.successCount} Client Record(s) Ready for Import
                    </span>
                  </div>

                  {parseResult.errorMessages.length > 0 && (
                    <div className="bg-amber-500/10 border border-amber-500/30 rounded-lg p-3 text-[11px] text-amber-300 space-y-1 max-h-24 overflow-y-auto">
                      <p className="font-bold flex items-center gap-1">
                        <AlertCircle className="w-3.5 h-3.5" /> Parsing Warnings:
                      </p>
                      {parseResult.errorMessages.map((msg, i) => (
                        <p key={i}>• {msg}</p>
                      ))}
                    </div>
                  )}

                  {/* Preview Table */}
                  <div className="max-h-56 overflow-y-auto border border-slate-800 rounded-lg">
                    <table className="w-full text-left text-[11px] text-slate-300">
                      <thead className="bg-slate-800 text-slate-200 sticky top-0 uppercase font-semibold text-[10px]">
                        <tr>
                          <th className="p-2">Client Name</th>
                          <th className="p-2">Ticket ID</th>
                          <th className="p-2">Trainer</th>
                          <th className="p-2">Package</th>
                          <th className="p-2 text-emerald-400">Training Date</th>
                          <th className="p-2 text-cyan-400">Training Time</th>
                          <th className="p-2">KAM/PM</th>
                          <th className="p-2">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800/60">
                        {parseResult.records.map((r, i) => (
                          <tr key={i} className="hover:bg-slate-900/60">
                            <td className="p-2 font-medium text-white">{r.clientName}</td>
                            <td className="p-2 font-mono text-emerald-400">{r.ticketId}</td>
                            <td className="p-2">{r.assignedPerson}</td>
                            <td className="p-2">{r.package}</td>
                            <td className="p-2 text-emerald-300 font-semibold">{formatTrainingDate(r.trainingDate)}</td>
                            <td className="p-2 text-cyan-300 font-mono">{r.trainingTime || '11:00 AM'}</td>
                            <td className="p-2">{r.pm}</td>
                            <td className="p-2">
                              <span className="px-1.5 py-0.5 rounded text-[9px] bg-slate-800 border border-slate-700">
                                {r.status}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Buttons */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
            <button
              onClick={onClose}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold rounded-xl transition-colors"
            >
              Cancel
            </button>
            <button
              disabled={!parseResult || parseResult.records.length === 0}
              onClick={handleSaveImported}
              className={`px-5 py-2 text-slate-950 font-bold text-xs rounded-xl shadow-lg flex items-center gap-2 transition-all ${
                parseResult && parseResult.records.length > 0
                  ? 'bg-emerald-500 hover:bg-emerald-400 shadow-emerald-500/20 cursor-pointer'
                  : 'bg-slate-700 text-slate-500 cursor-not-allowed opacity-50'
              }`}
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Import {parseResult?.records.length || 0} Clients to Database</span>
            </button>
          </div>

        </div>

      </div>
    </div>
  );
};
