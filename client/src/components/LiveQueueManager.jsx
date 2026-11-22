import React, { useState } from 'react';
import axios from 'axios';
import { Users, Plus, CheckCircle, Trash2, ArrowRightCircle, AlertCircle, Clock } from 'lucide-react';

const JOB_TYPES = [
  'B&W printing',
  'Colour printing',
  'Photocopy',
  'Scanning',
  'Spiral binding'
];

export default function LiveQueueManager({ queue = [], onQueueUpdated }) {
  const [customerName, setCustomerName] = useState('');
  const [jobType, setJobType] = useState('B&W printing');
  const [pages, setPages] = useState(15);
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isAdvancing, setIsAdvancing] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);

  const handleAddCustomer = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await axios.post('/api/live-queue', {
        customer_name: customerName.trim() || undefined,
        job_type: jobType,
        pages: Number(pages) || 10,
        notes: notes.trim()
      });
      setCustomerName('');
      setNotes('');
      setShowAddForm(false);
      if (onQueueUpdated) onQueueUpdated();
    } catch (err) {
      console.error('Error adding to live queue:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAdvanceQueue = async () => {
    setIsAdvancing(true);
    try {
      await axios.post('/api/live-queue/advance');
      if (onQueueUpdated) onQueueUpdated();
    } catch (err) {
      console.error('Error advancing queue:', err);
    } finally {
      setIsAdvancing(false);
    }
  };

  const handleUpdateStatus = async (id, status) => {
    try {
      await axios.patch(`/api/live-queue/${id}`, { status });
      if (onQueueUpdated) onQueueUpdated();
    } catch (err) {
      console.error('Error updating status:', err);
    }
  };

  const handleDelete = async (id) => {
    try {
      await axios.delete(`/api/live-queue/${id}`);
      if (onQueueUpdated) onQueueUpdated();
    } catch (err) {
      console.error('Error deleting item:', err);
    }
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
      {/* Top Header */}
      <div className="p-5 border-b border-slate-100 flex flex-wrap items-center justify-between gap-3 bg-slate-50/60">
        <div className="flex items-center space-x-2.5">
          <div className="p-2 rounded-lg bg-purple-50 text-purple-600">
            <Users className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h2 className="text-base font-semibold text-slate-900">Live Counter Queue</h2>
              <span className="text-xs bg-purple-100 text-purple-700 font-bold px-2 py-0.5 rounded-full">
                {queue.length} Active
              </span>
            </div>
            <p className="text-xs text-slate-500">
              Real-time physical counter state managed by the shopkeeper (distinguished from historical records)
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={() => setShowAddForm(!showAddForm)}
            className="flex items-center space-x-1.5 text-xs font-semibold px-3 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors shadow-2xs"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Ticket</span>
          </button>
          <button
            onClick={handleAdvanceQueue}
            disabled={isAdvancing || queue.length === 0}
            className="flex items-center space-x-1.5 text-xs font-semibold px-3 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg transition-colors disabled:opacity-40 shadow-2xs"
            title="Complete current in-progress job and start next waiting"
          >
            <ArrowRightCircle className="w-3.5 h-3.5" />
            <span>Advance Next</span>
          </button>
        </div>
      </div>

      {/* Inline Form to Add Customer */}
      {showAddForm && (
        <form onSubmit={handleAddCustomer} className="p-4 bg-indigo-50/40 border-b border-indigo-100 grid grid-cols-1 sm:grid-cols-5 gap-3">
          <div>
            <label className="block text-[11px] font-semibold text-slate-600 uppercase mb-1">Customer / Roll #</label>
            <input
              type="text"
              placeholder="e.g. Roll #12 Sahil"
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
              className="w-full text-xs rounded-lg border border-slate-300 px-2.5 py-1.5 bg-white"
            />
          </div>
          <div>
            <label className="block text-[11px] font-semibold text-slate-600 uppercase mb-1">Job Type</label>
            <select
              value={jobType}
              onChange={(e) => setJobType(e.target.value)}
              className="w-full text-xs rounded-lg border border-slate-300 px-2.5 py-1.5 bg-white"
            >
              {JOB_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-[11px] font-semibold text-slate-600 uppercase mb-1">Pages</label>
            <input
              type="number"
              min="1"
              value={pages}
              onChange={(e) => setPages(e.target.value)}
              className="w-full text-xs rounded-lg border border-slate-300 px-2.5 py-1.5 bg-white"
            />
          </div>
          <div>
            <label className="block text-[11px] font-semibold text-slate-600 uppercase mb-1">Notes / Instructions</label>
            <input
              type="text"
              placeholder="e.g. Double sided, green cover"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full text-xs rounded-lg border border-slate-300 px-2.5 py-1.5 bg-white"
            />
          </div>
          <div className="flex items-end space-x-2">
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full text-xs font-semibold py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors"
            >
              {isSubmitting ? 'Adding...' : 'Issue Ticket'}
            </button>
            <button
              type="button"
              onClick={() => setShowAddForm(false)}
              className="text-xs px-2.5 py-1.5 border border-slate-300 text-slate-600 rounded-lg hover:bg-slate-100"
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      {/* Queue Items Table */}
      <div className="overflow-x-auto">
        {queue.length === 0 ? (
          <div className="p-8 text-center text-slate-400">
            <Users className="w-8 h-8 mx-auto mb-2 text-slate-300" />
            <p className="text-sm font-medium text-slate-600">Counter Queue is Free</p>
            <p className="text-xs text-slate-400 mt-0.5">
              No customers are currently waiting in line. Click "Add Ticket" to queue a walk-in order.
            </p>
          </div>
        ) : (
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider font-semibold border-b border-slate-200">
              <tr>
                <th className="px-4 py-3">Ticket</th>
                <th className="px-4 py-3">Customer</th>
                <th className="px-4 py-3">Job Category</th>
                <th className="px-4 py-3">Volume</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Queued At</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {queue.map((item, idx) => (
                <tr
                  key={item._id}
                  className={`hover:bg-slate-50/80 transition-colors ${
                    item.status === 'in_progress' ? 'bg-amber-50/40 font-medium' : ''
                  }`}
                >
                  <td className="px-4 py-3 font-mono font-bold text-indigo-700">
                    {item.ticket_number || `T-${101 + idx}`}
                  </td>
                  <td className="px-4 py-3 font-semibold text-slate-800">
                    {item.customer_name}
                    {item.notes && <span className="block text-[10px] text-slate-400 font-normal">{item.notes}</span>}
                  </td>
                  <td className="px-4 py-3 text-slate-700">
                    <span className="inline-block px-2 py-0.5 rounded text-[11px] bg-slate-100 font-medium">
                      {item.job_type}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-slate-600">
                    {item.pages} pgs ({item.copies} cpy)
                  </td>
                  <td className="px-4 py-3">
                    {item.status === 'in_progress' ? (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-amber-100 text-amber-800 animate-pulse">
                        <Clock className="w-3 h-3" /> In Progress
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-slate-100 text-slate-700">
                        Waiting (#{idx + 1})
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-slate-400 font-mono text-[11px]">
                    {new Date(item.createdAt || Date.now()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </td>
                  <td className="px-4 py-3 text-right space-x-1">
                    {item.status === 'waiting' && (
                      <button
                        onClick={() => handleUpdateStatus(item._id, 'in_progress')}
                        className="px-2 py-1 text-[11px] font-medium text-amber-700 bg-amber-50 hover:bg-amber-100 rounded"
                        title="Mark actively printing"
                      >
                        Start
                      </button>
                    )}
                    <button
                      onClick={() => handleUpdateStatus(item._id, 'completed')}
                      className="px-2 py-1 text-[11px] font-medium text-emerald-700 bg-emerald-50 hover:bg-emerald-100 rounded"
                      title="Mark finished"
                    >
                      Done
                    </button>
                    <button
                      onClick={() => handleDelete(item._id)}
                      className="p-1 text-slate-400 hover:text-red-600 rounded transition-colors"
                      title="Remove ticket"
                    >
                      <Trash2 className="w-3.5 h-3.5 inline" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
