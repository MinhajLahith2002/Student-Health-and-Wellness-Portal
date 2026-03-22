import React, { useState } from 'react';
import { 
  Search, 
  Filter, 
  Plus, 
  MoreVertical, 
  Edit2, 
  ShieldAlert, 
  Trash2, 
  ChevronLeft, 
  ChevronRight,
  UserPlus,
  Mail,
  Calendar,
  Shield,
  CheckCircle2,
  XCircle,
  ExternalLink
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import AdminLayout from '../../components/admin/AdminLayout';
import { cn } from '../../lib/utils';

const MOCK_USERS = [
  { id: 1, name: "John Doe", email: "john@example.com", role: "Student", status: "Active", lastActive: "2 mins ago", avatar: "JD" },
  { id: 2, name: "Dr. Sarah Smith", email: "sarah@example.com", role: "Doctor", status: "Active", lastActive: "15 mins ago", avatar: "SS" },
  { id: 3, name: "Michael Chen", email: "michael@example.com", role: "Counselor", status: "Suspended", lastActive: "2 days ago", avatar: "MC" },
  { id: 4, name: "Emily Wilson", email: "emily@example.com", role: "Pharmacist", status: "Active", lastActive: "1 hour ago", avatar: "EW" },
  { id: 5, name: "Robert Brown", email: "robert@example.com", role: "Student", status: "Active", lastActive: "5 mins ago", avatar: "RB" },
  { id: 6, name: "Lisa Garcia", email: "lisa@example.com", role: "Doctor", status: "Active", lastActive: "10 mins ago", avatar: "LG" },
  { id: 7, name: "David Miller", email: "david@example.com", role: "Admin", status: "Active", lastActive: "Just now", avatar: "DM" },
];

const UserDirectory = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedRole, setSelectedRole] = useState("All Roles");
  const [showAddModal, setShowAddModal] = useState(false);

  const roles = ["All Roles", "Student", "Doctor", "Counselor", "Pharmacist", "Admin"];

  const filteredUsers = MOCK_USERS.filter(user => {
    const matchesSearch = user.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                         user.email.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesRole = selectedRole === "All Roles" || user.role === selectedRole;
    return matchesSearch && matchesRole;
  });

  return (
    <AdminLayout>
      <div className="space-y-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <h1 className="text-4xl font-bold text-slate-900 tracking-tight">User Directory</h1>
            <p className="text-slate-500 mt-2 text-lg">Manage all platform users and their permissions.</p>
          </div>
          <button 
            onClick={() => setShowAddModal(true)}
            className="px-8 py-4 bg-blue-600 text-white rounded-full font-bold hover:bg-blue-700 transition-all shadow-lg shadow-blue-100 flex items-center gap-2"
          >
            <UserPlus className="w-5 h-5" />
            Add New User
          </button>
        </div>

        {/* Filters & Search */}
        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex flex-col md:flex-row gap-4 items-center">
          <div className="relative flex-1 w-full">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input 
              type="text"
              placeholder="Search by name or email..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-11 pr-4 py-3 bg-slate-50 border-none rounded-xl text-sm focus:ring-2 focus:ring-blue-600/20 transition-all outline-none"
            />
          </div>
          <div className="flex gap-4 w-full md:w-auto">
            <div className="relative w-full md:w-48">
              <Filter className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <select 
                value={selectedRole}
                onChange={(e) => setSelectedRole(e.target.value)}
                className="w-full pl-11 pr-4 py-3 bg-slate-50 border-none rounded-xl text-sm font-bold text-slate-600 outline-none focus:ring-2 focus:ring-blue-600/20 appearance-none"
              >
                {roles.map(role => <option key={role} value={role}>{role}</option>)}
              </select>
            </div>
          </div>
        </div>

        {/* User Table */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/50 border-b border-slate-100">
                  <th className="px-8 py-5 text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em]">User</th>
                  <th className="px-8 py-5 text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em]">Role</th>
                  <th className="px-8 py-5 text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em]">Status</th>
                  <th className="px-8 py-5 text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em]">Last Active</th>
                  <th className="px-8 py-5 text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] text-right">Actions</th>
                 </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {filteredUsers.map((user) => (
                  <tr key={user.id} className="hover:bg-slate-50/50 transition-colors group">
                    <td className="px-8 py-5">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-bold text-sm">
                          {user.avatar}
                        </div>
                        <div>
                          <p className="text-sm font-bold text-slate-900">{user.name}</p>
                          <p className="text-xs text-slate-500 font-medium">{user.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-8 py-5">
                      <span className={cn(
                        "px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider",
                        user.role === 'Admin' ? "bg-blue-50 text-blue-600" :
                        user.role === 'Doctor' ? "bg-emerald-50 text-emerald-600" :
                        user.role === 'Counselor' ? "bg-purple-50 text-purple-600" :
                        user.role === 'Pharmacist' ? "bg-amber-50 text-amber-600" :
                        "bg-slate-100 text-slate-600"
                      )}>
                        {user.role}
                      </span>
                    </td>
                    <td className="px-8 py-5">
                      <div className="flex items-center gap-2">
                        <div className={cn(
                          "w-2 h-2 rounded-full",
                          user.status === 'Active' ? "bg-emerald-500" : "bg-rose-500"
                        )} />
                        <span className={cn(
                          "text-xs font-bold",
                          user.status === 'Active' ? "text-emerald-600" : "text-rose-600"
                        )}>
                          {user.status}
                        </span>
                      </div>
                    </td>
                    <td className="px-8 py-5">
                      <p className="text-xs text-slate-500 font-medium">{user.lastActive}</p>
                    </td>
                    <td className="px-8 py-5 text-right">
                      <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all">
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-all">
                          <ShieldAlert className="w-4 h-4" />
                        </button>
                        <button className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-all">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="p-6 border-t border-slate-50 flex items-center justify-between">
            <p className="text-xs text-slate-400 font-bold uppercase tracking-widest">
              Showing 1 to {filteredUsers.length} of {MOCK_USERS.length} entries
            </p>
            <div className="flex items-center gap-2">
              <button className="p-2 text-slate-400 hover:text-blue-600 disabled:opacity-50" disabled>
                <ChevronLeft className="w-5 h-5" />
              </button>
              <button className="w-8 h-8 bg-blue-600 text-white rounded-lg text-xs font-bold">1</button>
              <button className="w-8 h-8 hover:bg-slate-50 text-slate-600 rounded-lg text-xs font-bold transition-colors">2</button>
              <button className="p-2 text-slate-400 hover:text-blue-600">
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Add User Modal Placeholder */}
      <AnimatePresence>
        {showAddModal && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-6">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowAddModal(false)}
              className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-xl bg-white rounded-[32px] shadow-2xl overflow-hidden"
            >
              <div className="p-10">
                <div className="flex justify-between items-center mb-8">
                  <h2 className="text-3xl font-bold text-slate-900 tracking-tight">Add New User</h2>
                  <button onClick={() => setShowAddModal(false)} className="p-2 hover:bg-slate-100 rounded-full transition-colors">
                    <XCircle className="w-6 h-6 text-slate-400" />
                  </button>
                </div>

                <form className="space-y-6">
                  <div className="grid grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Full Name</label>
                      <input type="text" className="w-full px-4 py-3 bg-slate-50 border-none rounded-xl focus:ring-2 focus:ring-blue-600/20 transition-all outline-none font-medium" placeholder="e.g. John Doe" />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Email Address</label>
                      <input type="email" className="w-full px-4 py-3 bg-slate-50 border-none rounded-xl focus:ring-2 focus:ring-blue-600/20 transition-all outline-none font-medium" placeholder="e.g. john@example.com" />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Assign Role</label>
                    <div className="grid grid-cols-3 gap-3">
                      {roles.slice(1).map(role => (
                        <label key={role} className="relative flex items-center justify-center p-4 bg-slate-50 rounded-xl cursor-pointer hover:bg-slate-100 transition-all border-2 border-transparent has-[:checked]:border-blue-600 has-[:checked]:bg-blue-50">
                          <input type="radio" name="role" className="hidden" />
                          <span className="text-xs font-bold text-slate-600">{role}</span>
                        </label>
                      ))}
                    </div>
                  </div>

                  <div className="pt-6 flex gap-4">
                    <button type="button" onClick={() => setShowAddModal(false)} className="flex-1 py-4 bg-slate-100 text-slate-600 rounded-2xl font-bold hover:bg-slate-200 transition-all">Cancel</button>
                    <button type="submit" className="flex-1 py-4 bg-blue-600 text-white rounded-2xl font-bold hover:bg-blue-700 transition-all shadow-lg shadow-blue-100">Create User</button>
                  </div>
                </form>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </AdminLayout>
  );
};

export default UserDirectory;