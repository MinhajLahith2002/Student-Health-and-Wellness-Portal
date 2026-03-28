import React, { useState } from 'react';
import { 
  Search, 
  Filter, 
  Shield, 
  Clock, 
  User, 
  Activity, 
  Download, 
  ChevronLeft, 
  ChevronRight,
  AlertCircle,
  CheckCircle2,
  Lock,
  Trash2,
  RefreshCw,
  ExternalLink
} from 'lucide-react';
import { motion } from 'motion/react';
import { cn } from '../../lib/utils';

const MOCK_LOGS = [
  { id: 1, timestamp: "2026-02-28 13:45:22", user: "Admin User", action: "Role Change", details: "Changed role of John Doe from Student to Doctor", ip: "192.168.1.1", level: "info" },
  { id: 2, timestamp: "2026-02-28 13:30:15", user: "Dr. Sarah Smith", action: "Login", details: "Successful login via Web", ip: "192.168.1.45", level: "success" },
  { id: 3, timestamp: "2026-02-28 12:15:00", user: "System", action: "Backup", details: "Daily system backup completed", ip: "Internal", level: "success" },
  { id: 4, timestamp: "2026-02-28 11:50:33", user: "Unknown", action: "Failed Login", details: "Multiple failed login attempts for user 'admin'", ip: "45.12.33.102", level: "error" },
  { id: 5, timestamp: "2026-02-28 10:20:11", user: "Admin User", action: "Delete", details: "Deleted resource 'Managing Exam Stress'", ip: "192.168.1.1", level: "warning" },
  { id: 6, timestamp: "2026-02-28 09:45:55", user: "Emily Wilson", action: "Update", details: "Updated inventory for 'Paracetamol'", ip: "192.168.1.22", level: "info" },
  { id: 7, timestamp: "2026-02-28 08:30:00", user: "System", action: "Maintenance", details: "Scheduled maintenance started", ip: "Internal", level: "info" },
];

const AuditLogs = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedLevel, setSelectedLevel] = useState("All Levels");

  const levels = ["All Levels", "info", "success", "warning", "error"];

  const filteredLogs = MOCK_LOGS.filter(log => {
    const matchesSearch = log.user.toLowerCase().includes(searchQuery.toLowerCase()) || 
                         log.details.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         log.action.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesLevel = selectedLevel === "All Levels" || log.level === selectedLevel;
    return matchesSearch && matchesLevel;
  });

  return (
    <>
      <div className="space-y-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <h1 className="text-4xl font-bold text-slate-900 tracking-tight">Audit Logs</h1>
            <p className="text-slate-500 mt-2 text-lg">Track all critical system events for security and compliance.</p>
          </div>
          <div className="flex items-center gap-3">
            <button className="px-6 py-3 bg-white border border-slate-100 text-slate-600 rounded-full font-bold hover:bg-slate-50 transition-all shadow-sm flex items-center gap-2">
              <Download className="w-4 h-4" />
              Export CSV
            </button>
            <button className="p-3 bg-blue-600 text-white rounded-full hover:bg-blue-700 transition-all shadow-lg shadow-blue-100">
              <RefreshCw className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex flex-col md:flex-row gap-4 items-center">
          <div className="relative flex-1 w-full">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input 
              type="text"
              placeholder="Search by user, action, or details..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-11 pr-4 py-3 bg-slate-50 border-none rounded-xl text-sm focus:ring-2 focus:ring-blue-600/20 transition-all outline-none"
            />
          </div>
          <div className="flex gap-4 w-full md:w-auto">
            <div className="relative w-full md:w-48">
              <Filter className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <select 
                value={selectedLevel}
                onChange={(e) => setSelectedLevel(e.target.value)}
                className="w-full pl-11 pr-4 py-3 bg-slate-50 border-none rounded-xl text-sm font-bold text-slate-600 outline-none focus:ring-2 focus:ring-blue-600/20 appearance-none"
              >
                {levels.map(level => <option key={level} value={level}>{level.charAt(0).toUpperCase() + level.slice(1)}</option>)}
              </select>
            </div>
          </div>
        </div>

        {/* Logs Table */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/50 border-b border-slate-100">
                  <th className="px-8 py-5 text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em]">Timestamp</th>
                  <th className="px-8 py-5 text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em]">User</th>
                  <th className="px-8 py-5 text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em]">Action</th>
                  <th className="px-8 py-5 text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em]">Details</th>
                  <th className="px-8 py-5 text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em]">IP Address</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {filteredLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50/50 transition-colors group">
                    <td className="px-8 py-5">
                      <div className="flex items-center gap-3">
                        <Clock className="w-3.5 h-3.5 text-slate-300" />
                        <span className="text-xs font-medium text-slate-500">{log.timestamp}</span>
                      </div>
                    </td>
                    <td className="px-8 py-5">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-slate-100 rounded-lg flex items-center justify-center text-slate-500">
                          <User className="w-4 h-4" />
                        </div>
                        <span className="text-sm font-bold text-slate-900">{log.user}</span>
                      </div>
                    </td>
                    <td className="px-8 py-5">
                      <span className={cn(
                        "px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider",
                        log.level === 'success' ? "bg-emerald-50 text-emerald-600" :
                        log.level === 'error' ? "bg-rose-50 text-rose-600" :
                        log.level === 'warning' ? "bg-amber-50 text-amber-600" :
                        "bg-blue-50 text-blue-600"
                      )}>
                        {log.action}
                      </span>
                    </td>
                    <td className="px-8 py-5">
                      <p className="text-sm text-slate-600 font-medium max-w-md truncate" title={log.details}>
                        {log.details}
                      </p>
                    </td>
                    <td className="px-8 py-5">
                      <span className="text-xs font-mono text-slate-400 bg-slate-50 px-2 py-1 rounded-md">
                        {log.ip}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="p-6 border-t border-slate-50 flex items-center justify-between">
            <p className="text-xs text-slate-400 font-bold uppercase tracking-widest">
              Showing 1 to {filteredLogs.length} of 1,482 entries
            </p>
            <div className="flex items-center gap-2">
              <button className="p-2 text-slate-400 hover:text-blue-600 disabled:opacity-50" disabled>
                <ChevronLeft className="w-5 h-5" />
              </button>
              <button className="w-8 h-8 bg-blue-600 text-white rounded-lg text-xs font-bold">1</button>
              <button className="w-8 h-8 hover:bg-slate-50 text-slate-600 rounded-lg text-xs font-bold transition-colors">2</button>
              <button className="w-8 h-8 hover:bg-slate-50 text-slate-600 rounded-lg text-xs font-bold transition-colors">3</button>
              <button className="p-2 text-slate-400 hover:text-blue-600">
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default AuditLogs;