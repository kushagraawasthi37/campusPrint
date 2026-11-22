import React from 'react';
import { Files, Clock, Users, Timer, IndianRupee } from 'lucide-react';

export default function KpiCards({ stats, liveQueueCount, nextEstimate }) {
  const totalJobs = stats?.totalJobs || 0;
  const avgMinutes = stats?.overallAverageDurationMinutes || 0;
  const totalRevenue = stats?.totalRevenue || 0;
  
  // Format minutes & seconds nicely
  const avgSec = stats?.overallAverageDurationSeconds || 0;
  const displayMins = Math.floor(avgSec / 60);
  const displaySecs = avgSec % 60;

  // Next estimate range
  const waitMin = nextEstimate?.estimatedTotalCompletionRangeMinutes?.[0] ?? 0;
  const waitMax = nextEstimate?.estimatedTotalCompletionRangeMinutes?.[1] ?? 0;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
      {/* Total Jobs */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex items-center justify-between">
        <div>
          <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">Processed Jobs</p>
          <p className="text-2xl font-bold text-slate-900 mt-1">{totalJobs}</p>
          <span className="inline-block text-[11px] text-slate-400 font-medium mt-0.5">Historical records</span>
        </div>
        <div className="w-10 h-10 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
          <Files className="w-5 h-5" />
        </div>
      </div>

      {/* Avg Duration */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex items-center justify-between">
        <div>
          <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">Avg Service Duration</p>
          <p className="text-2xl font-bold text-slate-900 mt-1">
            {displayMins}<span className="text-sm font-normal text-slate-500">m</span> {displaySecs}<span className="text-sm font-normal text-slate-500">s</span>
          </p>
          <span className="inline-block text-[11px] text-slate-400 font-medium mt-0.5">Mean per transaction</span>
        </div>
        <div className="w-10 h-10 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
          <Clock className="w-5 h-5" />
        </div>
      </div>

      {/* Live Counter Queue */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex items-center justify-between">
        <div>
          <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">Current Live Queue</p>
          <p className="text-2xl font-bold text-indigo-600 mt-1">{liveQueueCount}</p>
          <span className="inline-block text-[11px] text-slate-400 font-medium mt-0.5">Active shop counter line</span>
        </div>
        <div className="w-10 h-10 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center">
          <Users className="w-5 h-5" />
        </div>
      </div>

      {/* Next Customer Est. Wait Range */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex items-center justify-between">
        <div>
          <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">Next Est. Wait Window</p>
          <p className="text-2xl font-bold text-emerald-600 mt-1">
            {waitMin}–{waitMax} <span className="text-sm font-normal text-slate-500">mins</span>
          </p>
          <span className="inline-block text-[11px] text-slate-400 font-medium mt-0.5">Range with 15% buffer</span>
        </div>
        <div className="w-10 h-10 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
          <Timer className="w-5 h-5" />
        </div>
      </div>

      {/* Total Revenue */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex items-center justify-between">
        <div>
          <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">Sample Turnover</p>
          <p className="text-2xl font-bold text-slate-900 mt-1">
            ₹{totalRevenue.toLocaleString()}
          </p>
          <span className="inline-block text-[11px] text-slate-400 font-medium mt-0.5">Synthetic dataset</span>
        </div>
        <div className="w-10 h-10 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
          <IndianRupee className="w-5 h-5" />
        </div>
      </div>
    </div>
  );
}
