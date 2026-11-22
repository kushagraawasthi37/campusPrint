import React, { useState } from 'react';
import { Database, Search, Filter } from 'lucide-react';

export default function JobHistoryTable({ jobs = [], total = 0 }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('All');

  // Filter jobs locally for rapid responsiveness
  const filteredJobs = jobs.filter((job) => {
    const matchesSearch =
      job.job_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      job.device.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = filterType === 'All' || job.job_type === filterType;
    return matchesSearch && matchesType;
  });

  const formatDuration = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}m ${secs}s`;
  };

  const formatTime = (dateStr) => {
    try {
      const d = new Date(dateStr);
      return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    } catch (e) {
      return dateStr;
    }
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
      {/* Header and Controls */}
      <div className="p-5 border-b border-slate-100 flex flex-wrap items-center justify-between gap-4 bg-slate-50/60">
        <div className="flex items-center space-x-2.5">
          <div className="p-2 rounded-lg bg-slate-100 text-slate-700">
            <Database className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h2 className="text-base font-semibold text-slate-900">Historical Jobs Log</h2>
              <span className="text-xs bg-slate-200 text-slate-700 font-bold px-2 py-0.5 rounded-full">
                {jobs.length} loaded
              </span>
            </div>
            <p className="text-xs text-slate-500">
              Synthetic observation dataset across one business day (09:00 - 18:00)
            </p>
          </div>
        </div>

        {/* Filter & Search Bar */}
        <div className="flex flex-wrap items-center gap-2 text-xs">
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-slate-400" />
            <input
              type="text"
              placeholder="Search Job ID, Device..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-8 pr-3 py-1.5 rounded-lg border border-slate-300 bg-white focus:outline-hidden focus:ring-1 focus:ring-indigo-500"
            />
          </div>

          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="px-2.5 py-1.5 rounded-lg border border-slate-300 bg-white focus:outline-hidden focus:ring-1 focus:ring-indigo-500"
          >
            <option value="All">All Job Types</option>
            <option value="B&W printing">B&W printing</option>
            <option value="Colour printing">Colour printing</option>
            <option value="Photocopy">Photocopy</option>
            <option value="Scanning">Scanning</option>
            <option value="Spiral binding">Spiral binding</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider font-semibold border-b border-slate-200">
            <tr>
              <th className="px-4 py-3">Job ID</th>
              <th className="px-4 py-3">Arrival</th>
              <th className="px-4 py-3">Service Window</th>
              <th className="px-4 py-3">Job Category</th>
              <th className="px-4 py-3">Volume</th>
              <th className="px-4 py-3">Service Time</th>
              <th className="px-4 py-3">Queue Ahead</th>
              <th className="px-4 py-3">Device</th>
              <th className="px-4 py-3 text-right">Amount</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filteredJobs.length === 0 ? (
              <tr>
                <td colSpan="9" className="text-center py-8 text-slate-400">
                  No printing records match the selected criteria.
                </td>
              </tr>
            ) : (
              filteredJobs.map((job) => (
                <tr key={job._id || job.job_id} className="hover:bg-slate-50/80 transition-colors">
                  <td className="px-4 py-3 font-mono font-bold text-indigo-700">
                    {job.job_id}
                  </td>
                  <td className="px-4 py-3 font-mono text-slate-600">
                    {formatTime(job.arrival_time)}
                  </td>
                  <td className="px-4 py-3 font-mono text-slate-500 text-[11px]">
                    {formatTime(job.service_start)} → {formatTime(job.service_end)}
                  </td>
                  <td className="px-4 py-3 text-slate-800">
                    <span className="inline-block px-2 py-0.5 rounded text-[11px] bg-indigo-50 text-indigo-700 font-medium">
                      {job.job_type}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-slate-600">
                    {job.pages} pgs ({job.copies} cpy)
                  </td>
                  <td className="px-4 py-3 font-mono font-bold text-slate-800">
                    {formatDuration(job.duration_seconds)}
                  </td>
                  <td className="px-4 py-3">
                    <span className="inline-block font-mono px-2 py-0.5 rounded bg-slate-100 text-slate-700 text-[11px]">
                      {job.queue_ahead} ahead
                    </span>
                  </td>
                  <td className="px-4 py-3 text-slate-600 text-[11px]">
                    {job.device}
                  </td>
                  <td className="px-4 py-3 text-right font-mono font-bold text-emerald-700">
                    ₹{job.amount}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
