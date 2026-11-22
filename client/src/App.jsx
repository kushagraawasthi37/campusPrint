import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Header from './components/Header';
import KpiCards from './components/KpiCards';
import WaitTimeEstimator from './components/WaitTimeEstimator';
import LiveQueueManager from './components/LiveQueueManager';
import AnalyticsCharts from './components/AnalyticsCharts';
import CsvUploader from './components/CsvUploader';
import JobHistoryTable from './components/JobHistoryTable';
import { LayoutDashboard, Calculator, Users, UploadCloud, Database } from 'lucide-react';

export default function App() {
  const [stats, setStats] = useState(null);
  const [jobTypeMetrics, setJobTypeMetrics] = useState([]);
  const [busiestHours, setBusiestHours] = useState([]);
  const [jobs, setJobs] = useState([]);
  const [liveQueue, setLiveQueue] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('dashboard'); // dashboard | estimator | queue | upload | history

  const fetchAllData = async () => {
    setIsLoading(true);
    try {
      const [statsRes, metricsRes, hoursRes, jobsRes, queueRes] = await Promise.all([
        axios.get('/api/stats'),
        axios.get('/api/stats/by-job-type'),
        axios.get('/api/stats/busiest-hours'),
        axios.get('/api/jobs?limit=100'),
        axios.get('/api/live-queue')
      ]);

      if (statsRes.data?.success) setStats(statsRes.data.data);
      if (metricsRes.data?.success) setJobTypeMetrics(metricsRes.data.metrics);
      if (hoursRes.data?.success) setBusiestHours(hoursRes.data.hours);
      if (jobsRes.data?.success) setJobs(jobsRes.data.jobs);
      if (queueRes.data?.success) setLiveQueue(queueRes.data.queue);
    } catch (err) {
      console.error('Error fetching dashboard data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAllData();
  }, []);

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <Header onRefresh={fetchAllData} isRefreshing={isLoading} />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        {/* KPI Cards Row */}
        <KpiCards
          stats={stats}
          liveQueueCount={liveQueue.length}
          nextEstimate={stats?.nextCustomerEstimate}
        />

        {/* View Switcher Navigation Tabs */}
        <div className="border-b border-slate-200">
          <nav className="flex space-x-6 text-sm font-medium" aria-label="Tabs">
            <button
              onClick={() => setActiveTab('dashboard')}
              className={`pb-3 border-b-2 flex items-center space-x-2 transition-colors ${
                activeTab === 'dashboard'
                  ? 'border-indigo-600 text-indigo-600 font-bold'
                  : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
              }`}
            >
              <LayoutDashboard className="w-4 h-4" />
              <span>Full Dashboard</span>
            </button>

            <button
              onClick={() => setActiveTab('estimator')}
              className={`pb-3 border-b-2 flex items-center space-x-2 transition-colors ${
                activeTab === 'estimator'
                  ? 'border-indigo-600 text-indigo-600 font-bold'
                  : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
              }`}
            >
              <Calculator className="w-4 h-4" />
              <span>Wait-Time Estimator</span>
            </button>

            <button
              onClick={() => setActiveTab('queue')}
              className={`pb-3 border-b-2 flex items-center space-x-2 transition-colors ${
                activeTab === 'queue'
                  ? 'border-indigo-600 text-indigo-600 font-bold'
                  : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
              }`}
            >
              <Users className="w-4 h-4" />
              <span>Live Queue Manager</span>
              {liveQueue.length > 0 && (
                <span className="bg-purple-100 text-purple-700 text-xs px-1.5 py-0.2 rounded-full font-bold">
                  {liveQueue.length}
                </span>
              )}
            </button>

            <button
              onClick={() => setActiveTab('upload')}
              className={`pb-3 border-b-2 flex items-center space-x-2 transition-colors ${
                activeTab === 'upload'
                  ? 'border-indigo-600 text-indigo-600 font-bold'
                  : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
              }`}
            >
              <UploadCloud className="w-4 h-4" />
              <span>CSV Ingestion</span>
            </button>

            <button
              onClick={() => setActiveTab('history')}
              className={`pb-3 border-b-2 flex items-center space-x-2 transition-colors ${
                activeTab === 'history'
                  ? 'border-indigo-600 text-indigo-600 font-bold'
                  : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
              }`}
            >
              <Database className="w-4 h-4" />
              <span>Job History ({jobs.length})</span>
            </button>
          </nav>
        </div>

        {/* Tab Content Display */}
        {activeTab === 'dashboard' && (
          <div className="space-y-6">
            <WaitTimeEstimator
              historicalAverages={stats?.averagesByJobType}
              liveQueue={liveQueue}
            />

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              <div className="lg:col-span-12">
                <LiveQueueManager
                  queue={liveQueue}
                  onQueueUpdated={fetchAllData}
                />
              </div>
            </div>

            <AnalyticsCharts
              jobTypeMetrics={jobTypeMetrics}
              busiestHours={busiestHours}
            />

            <JobHistoryTable jobs={jobs} total={stats?.totalJobs || 0} />
          </div>
        )}

        {activeTab === 'estimator' && (
          <div className="space-y-6">
            <WaitTimeEstimator
              historicalAverages={stats?.averagesByJobType}
              liveQueue={liveQueue}
            />
          </div>
        )}

        {activeTab === 'queue' && (
          <div className="space-y-6">
            <LiveQueueManager
              queue={liveQueue}
              onQueueUpdated={fetchAllData}
            />
          </div>
        )}

        {activeTab === 'upload' && (
          <div className="space-y-6">
            <CsvUploader onUploadComplete={fetchAllData} />
          </div>
        )}

        {activeTab === 'history' && (
          <div className="space-y-6">
            <JobHistoryTable jobs={jobs} total={stats?.totalJobs || 0} />
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-200 bg-white py-4 mt-8">
        <div className="max-w-7xl mx-auto px-4 text-center text-xs text-slate-500">
          CampusPrint • Prototype Queue Estimator for NIT Srinagar Campus Zone • Synthetic Dataset Disclaimer Enforced
        </div>
      </footer>
    </div>
  );
}
