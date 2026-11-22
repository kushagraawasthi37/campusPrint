import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Calculator, AlertTriangle, ShieldCheck, Info, ChevronRight, Sliders, ArrowRight } from 'lucide-react';

const JOB_TYPES = [
  'B&W printing',
  'Colour printing',
  'Photocopy',
  'Scanning',
  'Spiral binding'
];

export default function WaitTimeEstimator({ historicalAverages, liveQueue = [] }) {
  const [queueAheadCount, setQueueAheadCount] = useState(liveQueue.length);
  const [targetJobType, setTargetJobType] = useState('B&W printing');
  const [targetPages, setTargetPages] = useState(15);
  const [bufferPercent, setBufferPercent] = useState(15);
  const [useLiveQueueJobTypes, setUseLiveQueueJobTypes] = useState(true);
  const [estimateResult, setEstimateResult] = useState(null);
  const [isCalculating, setIsCalculating] = useState(false);

  // Sync with live queue length when live queue changes and flag is active
  useEffect(() => {
    if (useLiveQueueJobTypes) {
      setQueueAheadCount(liveQueue.length);
    }
  }, [liveQueue, useLiveQueueJobTypes]);

  // Recalculate whenever inputs change
  useEffect(() => {
    const fetchEstimate = async () => {
      setIsCalculating(true);
      try {
        const queueAheadJobTypes = useLiveQueueJobTypes && liveQueue.length > 0
          ? liveQueue.map(item => item.job_type)
          : [];

        const res = await axios.post('/api/estimate', {
          queueAheadCount: Number(queueAheadCount),
          queueAheadJobTypes,
          targetJobType,
          bufferPercent: Number(bufferPercent),
          targetPages: Number(targetPages)
        });

        if (res.data?.success) {
          setEstimateResult(res.data.estimate);
        }
      } catch (err) {
        console.error('Error fetching estimate:', err);
      } finally {
        setIsCalculating(false);
      }
    };

    fetchEstimate();
  }, [queueAheadCount, targetJobType, targetPages, bufferPercent, useLiveQueueJobTypes, liveQueue]);

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
      <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/60">
        <div className="flex items-center space-x-2.5">
          <div className="p-2 rounded-lg bg-indigo-50 text-indigo-600">
            <Calculator className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-semibold text-slate-900">Waiting-Time Estimator</h2>
            <p className="text-xs text-slate-500">
              Probabilistic range projection using historical category durations &amp; queue workload
            </p>
          </div>
        </div>
        <span className="text-[11px] font-mono bg-indigo-100 text-indigo-700 font-medium px-2 py-0.5 rounded">
          FIFO Workload Model
        </span>
      </div>

      <div className="p-6 grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Input Parameters Form (Left Column) */}
        <div className="lg:col-span-5 space-y-4">
          {/* Target Job Type */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
              Customer Job Type
            </label>
            <select
              value={targetJobType}
              onChange={(e) => setTargetJobType(e.target.value)}
              className="w-full text-sm rounded-lg border border-slate-300 px-3 py-2 bg-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
            >
              {JOB_TYPES.map((type) => (
                <option key={type} value={type}>
                  {type}
                </option>
              ))}
            </select>
          </div>

          {/* Page Count */}
          <div>
            <div className="flex justify-between items-center mb-1.5">
              <label className="text-xs font-semibold text-slate-700 uppercase tracking-wider">
                Document Pages
              </label>
              {targetPages > 100 && (
                <span className="text-[11px] text-amber-600 font-medium flex items-center gap-1">
                  <AlertTriangle className="w-3 h-3" /> Heavy batch
                </span>
              )}
            </div>
            <input
              type="number"
              min="1"
              max="1000"
              value={targetPages}
              onChange={(e) => setTargetPages(Math.max(1, parseInt(e.target.value, 10) || 1))}
              className="w-full text-sm rounded-lg border border-slate-300 px-3 py-2 focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
            />
          </div>

          {/* Queue Ahead & Source */}
          <div className="p-3.5 bg-slate-50 rounded-lg border border-slate-200/80 space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-slate-700 uppercase tracking-wider">
                Customers Ahead in Queue
              </label>
              <span className="text-xs font-mono font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded">
                {queueAheadCount} in line
              </span>
            </div>

            {liveQueue.length > 0 && (
              <label className="flex items-center space-x-2 text-xs text-slate-600 cursor-pointer">
                <input
                  type="checkbox"
                  checked={useLiveQueueJobTypes}
                  onChange={(e) => setUseLiveQueueJobTypes(e.target.checked)}
                  className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                />
                <span>Sync with active live queue counter ({liveQueue.length} jobs)</span>
              </label>
            )}

            {!useLiveQueueJobTypes && (
              <div>
                <input
                  type="range"
                  min="0"
                  max="15"
                  value={queueAheadCount}
                  onChange={(e) => setQueueAheadCount(parseInt(e.target.value, 10))}
                  className="w-full accent-indigo-600"
                />
                <div className="flex justify-between text-[11px] text-slate-400">
                  <span>0 (Free Counter)</span>
                  <span>5 jobs</span>
                  <span>15 (Heavy Jam)</span>
                </div>
              </div>
            )}
          </div>

          {/* Safety Buffer Percentage */}
          <div className="p-3.5 bg-slate-50 rounded-lg border border-slate-200/80">
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-semibold text-slate-700 uppercase tracking-wider flex items-center space-x-1">
                <Sliders className="w-3.5 h-3.5 text-indigo-600" />
                <span>Configurable Safety Buffer</span>
              </label>
              <span className="text-xs font-mono font-bold text-indigo-700 bg-indigo-100 px-2 py-0.5 rounded">
                +{bufferPercent}%
              </span>
            </div>
            <input
              type="range"
              min="0"
              max="50"
              step="5"
              value={bufferPercent}
              onChange={(e) => setBufferPercent(parseInt(e.target.value, 10))}
              className="w-full accent-indigo-600"
            />
            <p className="text-[11px] text-slate-500 mt-1">
              Accounts for pendrive scanning, page alignments, payment transitions, and toner warming.
            </p>
          </div>
        </div>

        {/* Estimation Output Card (Right Column) */}
        <div className="lg:col-span-7 flex flex-col justify-between space-y-4">
          {/* Main Range Display */}
          <div className="bg-gradient-to-br from-indigo-50/80 via-white to-purple-50/40 p-6 rounded-xl border border-indigo-100 shadow-xs">
            <div className="flex items-center justify-between text-xs text-indigo-900 font-medium mb-3">
              <span className="uppercase tracking-wider font-semibold">Projected Waiting Interval</span>
              <span className="bg-white/80 border border-indigo-200 px-2 py-0.5 rounded-full text-indigo-700">
                Range Model (Non-Exact)
              </span>
            </div>

            <div className="flex items-baseline space-x-3 my-2">
              <span className="text-4xl sm:text-5xl font-black tracking-tight text-indigo-950 font-mono">
                {estimateResult?.estimatedTotalCompletionRangeMinutes?.[0] ?? 0}
                <span className="text-indigo-400 mx-1">–</span>
                {estimateResult?.estimatedTotalCompletionRangeMinutes?.[1] ?? 0}
              </span>
              <span className="text-lg font-semibold text-slate-600">Minutes</span>
            </div>

            <p className="text-xs text-slate-600 mt-1">
              Until complete handoff (Wait before service:{' '}
              <strong className="text-slate-800">
                {estimateResult?.estimatedWaitToStartRangeMinutes?.[0]}–
                {estimateResult?.estimatedWaitToStartRangeMinutes?.[1]} mins
              </strong>
              , plus execution of customer's {targetJobType}).
            </p>

            {/* Workload Breakdown Details */}
            <div className="mt-4 pt-4 border-t border-indigo-100/80 grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
              <div className="bg-white/90 p-2.5 rounded-lg border border-indigo-50">
                <span className="text-slate-400 block text-[10px] uppercase font-semibold">Queue Workload</span>
                <span className="font-mono font-bold text-slate-800 text-sm">
                  {estimateResult?.expectedWaitToStartMinutes ?? 0} mins
                </span>
              </div>
              <div className="bg-white/90 p-2.5 rounded-lg border border-indigo-50">
                <span className="text-slate-400 block text-[10px] uppercase font-semibold">Target Job Avg</span>
                <span className="font-mono font-bold text-slate-800 text-sm">
                  {estimateResult?.historicalAveragesMinutes?.[targetJobType] ?? 0} mins
                </span>
              </div>
              <div className="bg-white/90 p-2.5 rounded-lg border border-indigo-50 col-span-2 sm:col-span-1">
                <span className="text-slate-400 block text-[10px] uppercase font-semibold">Safety Buffer Added</span>
                <span className="font-mono font-bold text-emerald-700 text-sm">
                  +{bufferPercent}%
                </span>
              </div>
            </div>
          </div>

          {/* Queue Ahead Workload Breakdown */}
          {estimateResult?.breakdown && estimateResult.breakdown.length > 0 && (
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
              <h4 className="text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2 flex items-center justify-between">
                <span>Queue Workload Breakdown ({estimateResult.breakdown.length} jobs ahead)</span>
                <span className="text-[11px] text-slate-400 lowercase font-normal">FIFO order</span>
              </h4>
              <div className="max-h-32 overflow-y-auto space-y-1.5 pr-1">
                {estimateResult.breakdown.map((item, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between text-xs bg-white px-3 py-1.5 rounded-lg border border-slate-100 shadow-2xs"
                  >
                    <span className="text-slate-600 flex items-center gap-1.5">
                      <span className="font-mono font-bold text-indigo-600">#{item.position}</span>
                      <span>{item.jobType}</span>
                    </span>
                    <span className="font-mono text-slate-700 font-medium">~{item.estimatedDurationMinutes}m</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Reliability Warnings & Assumptions Notice */}
          <div className={`p-4 rounded-xl border text-xs ${
            estimateResult?.isReliable
              ? 'bg-blue-50/60 border-blue-200/80 text-blue-900'
              : 'bg-amber-50 border-amber-300 text-amber-900'
          }`}>
            <div className="flex items-start space-x-2">
              {estimateResult?.isReliable ? (
                <ShieldCheck className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
              ) : (
                <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              )}
              <div className="space-y-1">
                <p className="font-semibold">
                  {estimateResult?.isReliable ? 'Nominal Operating Conditions' : 'High Uncertainty Alert:'}
                </p>
                {estimateResult?.reliabilityWarnings?.map((warning, wIdx) => (
                  <p key={wIdx} className="text-[11px] opacity-90">
                    • {warning}
                  </p>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
