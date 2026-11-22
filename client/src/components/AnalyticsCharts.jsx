import React from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  AreaChart,
  Area,
  Cell
} from 'recharts';
import { BarChart3, Clock, TrendingUp } from 'lucide-react';

const COLORS = ['#6366f1', '#8b5cf6', '#ec4899', '#f97316', '#10b981'];

export default function AnalyticsCharts({ jobTypeMetrics = [], busiestHours = [] }) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Chart 1: Average Duration by Job Type */}
      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-2">
            <div className="p-1.5 rounded-lg bg-indigo-50 text-indigo-600">
              <BarChart3 className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-slate-900">Average Duration by Job Type</h3>
              <p className="text-xs text-slate-500">Arithmetic mean execution duration (minutes)</p>
            </div>
          </div>
          <span className="text-[11px] font-mono text-slate-400">data.csv</span>
        </div>

        <div className="h-64 w-full">
          {jobTypeMetrics.length === 0 ? (
            <div className="h-full flex items-center justify-center text-xs text-slate-400">
              No historical job records loaded
            </div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={jobTypeMetrics} margin={{ top: 10, right: 10, left: -20, bottom: 20 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis
                  dataKey="job_type"
                  tick={{ fontSize: 11, fill: '#64748b' }}
                  angle={-15}
                  textAnchor="end"
                  interval={0}
                />
                <YAxis
                  unit="m"
                  tick={{ fontSize: 11, fill: '#64748b' }}
                />
                <Tooltip
                  formatter={(value) => [`${value} minutes`, 'Avg Duration']}
                  contentStyle={{
                    backgroundColor: '#ffffff',
                    borderRadius: '8px',
                    borderColor: '#e2e8f0',
                    fontSize: '12px'
                  }}
                />
                <Bar dataKey="avgDurationMinutes" radius={[4, 4, 0, 0]}>
                  {jobTypeMetrics.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
        <div className="mt-2 flex flex-wrap gap-2 text-[11px] text-slate-500 justify-center">
          {jobTypeMetrics.map((item, idx) => (
            <span key={item.job_type} className="inline-flex items-center gap-1">
              <span className="w-2 h-2 rounded-full" style={{ backgroundColor: COLORS[idx % COLORS.length] }}></span>
              {item.job_type}: <strong>{item.avgDurationMinutes}m</strong>
            </span>
          ))}
        </div>
      </div>

      {/* Chart 2: Busiest Hours Distribution */}
      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-2">
            <div className="p-1.5 rounded-lg bg-emerald-50 text-emerald-600">
              <Clock className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-slate-900">Busiest Hours Footfall (09:00 - 18:00)</h3>
              <p className="text-xs text-slate-500">Student arrival volume across academic business day</p>
            </div>
          </div>
          <span className="text-[11px] font-mono text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded font-medium">
            Peak: 10:00 &amp; 14:00
          </span>
        </div>

        <div className="h-64 w-full">
          {busiestHours.length === 0 ? (
            <div className="h-full flex items-center justify-center text-xs text-slate-400">
              No hourly footfall data loaded
            </div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={busiestHours} margin={{ top: 10, right: 10, left: -20, bottom: 20 }}>
                <defs>
                  <linearGradient id="hourColor" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis
                  dataKey="hour"
                  tickFormatter={(hour) => `${hour}:00`}
                  tick={{ fontSize: 11, fill: '#64748b' }}
                />
                <YAxis
                  allowDecimals={false}
                  tick={{ fontSize: 11, fill: '#64748b' }}
                />
                <Tooltip
                  formatter={(value, name) => [
                    name === 'jobCount' ? `${value} jobs arrived` : `${value}m`,
                    name === 'jobCount' ? 'Arrivals' : 'Avg Duration'
                  ]}
                  labelFormatter={(hour) => `${hour}:00 - ${hour + 1}:00`}
                  contentStyle={{
                    backgroundColor: '#ffffff',
                    borderRadius: '8px',
                    borderColor: '#e2e8f0',
                    fontSize: '12px'
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="jobCount"
                  stroke="#10b981"
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#hourColor)"
                />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </div>
        <p className="text-[11px] text-slate-400 text-center mt-2">
          Notice morning peak (10:00–11:00) during lecture prep and afternoon rush (14:00–16:00) for lab submissions.
        </p>
      </div>
    </div>
  );
}
