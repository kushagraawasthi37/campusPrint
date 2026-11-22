import React, { useState } from 'react';
import axios from 'axios';
import { UploadCloud, CheckCircle, AlertOctagon, FileSpreadsheet, RefreshCw, AlertCircle } from 'lucide-react';

export default function CsvUploader({ onUploadComplete }) {
  const [file, setFile] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [result, setResult] = useState(null);
  const [errorMessage, setErrorMessage] = useState('');

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
      setResult(null);
      setErrorMessage('');
    }
  };

  const handleUpload = async (e) => {
    e.preventDefault();
    if (!file) {
      setErrorMessage('Please select a CSV file first');
      return;
    }

    const formData = new FormData();
    formData.append('file', file);

    setIsUploading(true);
    setErrorMessage('');
    setResult(null);

    try {
      const res = await axios.post('/api/jobs/upload-csv', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setResult(res.data);
      if (onUploadComplete) onUploadComplete();
    } catch (err) {
      setErrorMessage(err.response?.data?.error || err.message || 'CSV upload failed');
    } finally {
      setIsUploading(false);
    }
  };

  const handleSeedDefault = async () => {
    setIsUploading(true);
    setErrorMessage('');
    setResult(null);
    try {
      const res = await axios.post('/api/jobs/seed');
      setResult({
        success: true,
        summary: {
          totalRows: res.data.count,
          validCount: res.data.count,
          invalidCount: 0,
          status: 'COMPLETE_SUCCESS'
        },
        message: 'Synthetic development baseline (25 records) loaded successfully.'
      });
      if (onUploadComplete) onUploadComplete();
    } catch (err) {
      setErrorMessage(err.response?.data?.error || 'Failed to seed synthetic dataset');
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
      <div className="p-5 border-b border-slate-100 flex flex-wrap items-center justify-between gap-3 bg-slate-50/60">
        <div className="flex items-center space-x-2.5">
          <div className="p-2 rounded-lg bg-blue-50 text-blue-600">
            <UploadCloud className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-semibold text-slate-900">CSV Ingestion &amp; Strict Row Validator</h2>
            <p className="text-xs text-slate-500">
              Validates job IDs, timestamps, numeric bounds, and logical ordering. Never silently discards invalid rows.
            </p>
          </div>
        </div>

        <button
          onClick={handleSeedDefault}
          disabled={isUploading}
          className="text-xs font-semibold px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg transition-colors flex items-center space-x-1.5"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isUploading ? 'animate-spin' : ''}`} />
          <span>Reset to Baseline (data.csv)</span>
        </button>
      </div>

      <div className="p-6 space-y-6">
        {/* Upload Form */}
        <form onSubmit={handleUpload} className="flex flex-col sm:flex-row items-center gap-3">
          <label className="w-full sm:flex-1 flex items-center justify-center sm:justify-start px-4 py-2.5 border border-dashed border-slate-300 hover:border-indigo-400 rounded-lg cursor-pointer bg-slate-50 hover:bg-indigo-50/30 transition-all text-xs text-slate-600">
            <FileSpreadsheet className="w-4 h-4 mr-2 text-indigo-500 shrink-0" />
            <span className="truncate">{file ? file.name : 'Choose CSV file (data.csv or invalid_test_data.csv)'}</span>
            <input
              type="file"
              accept=".csv"
              onChange={handleFileChange}
              className="hidden"
            />
          </label>

          <button
            type="submit"
            disabled={!file || isUploading}
            className="w-full sm:w-auto px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold transition-colors disabled:opacity-40 flex items-center justify-center space-x-1.5"
          >
            <UploadCloud className="w-4 h-4" />
            <span>{isUploading ? 'Validating...' : 'Upload & Validate'}</span>
          </button>
        </form>

        {/* Global Error Banner */}
        {errorMessage && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-xs text-red-700 flex items-start space-x-2">
            <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Validation Result Summary */}
        {result && (
          <div className="space-y-4">
            <div className={`p-4 rounded-xl border flex flex-wrap items-center justify-between gap-3 text-xs ${
              result.summary?.invalidCount === 0
                ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                : 'bg-amber-50 border-amber-200 text-amber-900'
            }`}>
              <div className="flex items-center space-x-2">
                {result.summary?.invalidCount === 0 ? (
                  <CheckCircle className="w-5 h-5 text-emerald-600" />
                ) : (
                  <AlertOctagon className="w-5 h-5 text-amber-600" />
                )}
                <div>
                  <p className="font-bold text-sm">
                    {result.summary?.status === 'COMPLETE_SUCCESS'
                      ? 'All Records Passed Validation'
                      : 'Validation Completed With Deliberate Errors Detected'}
                  </p>
                  <p className="text-[11px] opacity-80">
                    Total rows processed: {result.summary?.totalRows} • Valid: {result.summary?.validCount} • Rejected: {result.summary?.invalidCount}
                  </p>
                </div>
              </div>
              <span className="font-mono text-xs px-2.5 py-1 rounded-full bg-white/80 font-bold border border-current">
                {result.summary?.validCount} / {result.summary?.totalRows} Accepted
              </span>
            </div>

            {/* Row-Level Errors Table */}
            {result.errors && result.errors.length > 0 && (
              <div className="border border-red-200 rounded-xl overflow-hidden bg-red-50/20">
                <div className="bg-red-50/80 px-4 py-2.5 border-b border-red-200 flex items-center justify-between text-xs font-semibold text-red-900">
                  <span className="flex items-center gap-1.5">
                    <AlertOctagon className="w-4 h-4 text-red-600" />
                    Row-Level Validation Error Log ({result.errors.length} violations)
                  </span>
                  <span className="text-[11px] font-normal text-red-700">Records were rejected rather than silently discarded</span>
                </div>
                <div className="max-h-60 overflow-y-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-red-100/40 text-red-800 font-semibold uppercase text-[10px] tracking-wider border-b border-red-200">
                      <tr>
                        <th className="px-4 py-2">Row #</th>
                        <th className="px-4 py-2">Field</th>
                        <th className="px-4 py-2">Received Value</th>
                        <th className="px-4 py-2">Validation Violation Reason</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-red-100">
                      {result.errors.map((err, idx) => (
                        <tr key={idx} className="hover:bg-red-50/50">
                          <td className="px-4 py-2 font-mono font-bold text-red-800">
                            Row {err.rowNumber}
                          </td>
                          <td className="px-4 py-2 font-mono text-slate-700">
                            {err.field}
                          </td>
                          <td className="px-4 py-2 font-mono text-red-600 truncate max-w-xs">
                            {String(err.value) || '<empty>'}
                          </td>
                          <td className="px-4 py-2 text-slate-700">
                            {err.reason}
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
      </div>
    </div>
  );
}
