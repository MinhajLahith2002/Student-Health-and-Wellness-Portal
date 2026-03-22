import React, { useState } from 'react';
import { 
  Search, 
  Filter, 
  Plus, 
  MoreVertical, 
  Edit2, 
  Trash2, 
  ChevronLeft, 
  ChevronRight,
  BookOpen,
  Video,
  FileText,
  Eye,
  CheckCircle2,
  XCircle,
  ExternalLink,
  Upload,
  Image as ImageIcon
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import AdminLayout from '../../components/admin/AdminLayout';
import { cn } from '../../lib/utils';

const MOCK_RESOURCES = [
  { id: 1, title: "Managing Exam Stress", type: "Article", category: "Mental Health", status: "Published", lastUpdated: "2026-02-20", author: "Dr. Sarah Smith" },
  { id: 2, title: "Healthy Eating on a Budget", type: "Video", category: "Nutrition", status: "Published", lastUpdated: "2026-02-18", author: "Emily Wilson" },
  { id: 3, title: "Understanding Flu Symptoms", type: "Article", category: "General Health", status: "Draft", lastUpdated: "2026-02-25", author: "Dr. Sarah Smith" },
  { id: 4, title: "Daily Meditation Guide", type: "Video", category: "Mental Health", status: "Published", lastUpdated: "2026-02-15", author: "Michael Chen" },
  { id: 5, title: "Campus Safety Tips", type: "Article", category: "Safety", status: "Published", lastUpdated: "2026-02-10", author: "Admin" },
];

const HealthResources = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedType, setSelectedType] = useState("All Types");
  const [showAddModal, setShowAddModal] = useState(false);

  const types = ["All Types", "Article", "Video", "Infographic"];

  const filteredResources = MOCK_RESOURCES.filter(res => {
    const matchesSearch = res.title.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesType = selectedType === "All Types" || res.type === selectedType;
    return matchesSearch && matchesType;
  });

  return (
    <AdminLayout>
      <div className="space-y-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <h1 className="text-4xl font-bold text-slate-900 tracking-tight">Health Resources</h1>
            <p className="text-slate-500 mt-2 text-lg">Publish and manage self-help articles, videos, and guides.</p>
          </div>
          <button 
            onClick={() => setShowAddModal(true)}
            className="px-8 py-4 bg-blue-600 text-white rounded-full font-bold hover:bg-blue-700 transition-all shadow-lg shadow-blue-100 flex items-center gap-2"
          >
            <Plus className="w-5 h-5" />
            Add New Resource
          </button>
        </div>

        {/* Filters & Search */}
        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex flex-col md:flex-row gap-4 items-center">
          <div className="relative flex-1 w-full">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input 
              type="text"
              placeholder="Search resources by title..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-11 pr-4 py-3 bg-slate-50 border-none rounded-xl text-sm focus:ring-2 focus:ring-blue-600/20 transition-all outline-none"
            />
          </div>
          <div className="flex gap-4 w-full md:w-auto">
            <div className="relative w-full md:w-48">
              <Filter className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <select 
                value={selectedType}
                onChange={(e) => setSelectedType(e.target.value)}
                className="w-full pl-11 pr-4 py-3 bg-slate-50 border-none rounded-xl text-sm font-bold text-slate-600 outline-none focus:ring-2 focus:ring-blue-600/20 appearance-none"
              >
                {types.map(type => <option key={type} value={type}>{type}</option>)}
              </select>
            </div>
          </div>
        </div>

        {/* Resources Table */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/50 border-b border-slate-100">
                  <th className="px-8 py-5 text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em]">Resource</th>
                  <th className="px-8 py-5 text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em]">Category</th>
                  <th className="px-8 py-5 text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em]">Status</th>
                  <th className="px-8 py-5 text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em]">Last Updated</th>
                  <th className="px-8 py-5 text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] text-right">Actions</th>
                 </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {filteredResources.map((res) => (
                  <tr key={res.id} className="hover:bg-slate-50/50 transition-colors group">
                    <td className="px-8 py-5">
                      <div className="flex items-center gap-4">
                        <div className={cn(
                          "w-10 h-10 rounded-xl flex items-center justify-center",
                          res.type === 'Article' ? "bg-blue-50 text-blue-600" : "bg-emerald-50 text-emerald-600"
                        )}>
                          {res.type === 'Article' ? <FileText className="w-5 h-5" /> : <Video className="w-5 h-5" />}
                        </div>
                        <div>
                          <p className="text-sm font-bold text-slate-900">{res.title}</p>
                          <p className="text-xs text-slate-500 font-medium">{res.type} • by {res.author}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-8 py-5">
                      <span className="text-xs font-bold text-slate-600 bg-slate-100 px-3 py-1 rounded-full">{res.category}</span>
                    </td>
                    <td className="px-8 py-5">
                      <div className="flex items-center gap-2">
                        <div className={cn(
                          "w-2 h-2 rounded-full",
                          res.status === 'Published' ? "bg-emerald-500" : "bg-amber-500"
                        )} />
                        <span className={cn(
                          "text-xs font-bold",
                          res.status === 'Published' ? "text-emerald-600" : "text-amber-600"
                        )}>
                          {res.status}
                        </span>
                      </div>
                    </td>
                    <td className="px-8 py-5">
                      <p className="text-xs text-slate-500 font-medium">{res.lastUpdated}</p>
                    </td>
                    <td className="px-8 py-5 text-right">
                      <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all">
                          <Eye className="w-4 h-4" />
                        </button>
                        <button className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all">
                          <Edit2 className="w-4 h-4" />
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
        </div>
      </div>

      {/* Add Resource Modal Placeholder */}
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
              className="relative w-full max-w-4xl bg-white rounded-[40px] shadow-2xl overflow-hidden"
            >
              <div className="p-10 max-h-[90vh] overflow-y-auto no-scrollbar">
                <div className="flex justify-between items-center mb-10">
                  <h2 className="text-3xl font-bold text-slate-900 tracking-tight">Add New Resource</h2>
                  <button onClick={() => setShowAddModal(false)} className="p-2 hover:bg-slate-100 rounded-full transition-colors">
                    <XCircle className="w-6 h-6 text-slate-400" />
                  </button>
                </div>

                <form className="space-y-10">
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
                    {/* Left: Metadata */}
                    <div className="lg:col-span-1 space-y-8">
                      <div className="space-y-2">
                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Featured Image</label>
                        <div className="aspect-video bg-slate-50 rounded-2xl border-2 border-dashed border-slate-200 flex flex-col items-center justify-center group cursor-pointer hover:border-blue-400 transition-all">
                          <ImageIcon className="w-8 h-8 text-slate-300 mb-2" />
                          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Upload Cover</p>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Type</label>
                        <select className="w-full px-4 py-3 bg-slate-50 border-none rounded-xl focus:ring-2 focus:ring-blue-600/20 transition-all outline-none font-bold text-slate-600">
                          <option>Article</option>
                          <option>Video</option>
                          <option>Infographic</option>
                        </select>
                      </div>

                      <div className="space-y-2">
                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Category</label>
                        <select className="w-full px-4 py-3 bg-slate-50 border-none rounded-xl focus:ring-2 focus:ring-blue-600/20 transition-all outline-none font-bold text-slate-600">
                          <option>Mental Health</option>
                          <option>Nutrition</option>
                          <option>General Health</option>
                          <option>Safety</option>
                        </select>
                      </div>

                      <div className="p-6 bg-blue-50 rounded-3xl border border-blue-100">
                        <div className="flex items-center gap-3 mb-2">
                          <CheckCircle2 className="w-5 h-5 text-blue-600" />
                          <span className="text-xs font-bold text-blue-900 uppercase tracking-widest">Publish Settings</span>
                        </div>
                        <label className="flex items-center justify-between mt-4 cursor-pointer">
                          <span className="text-xs font-bold text-slate-600">Publish Immediately</span>
                          <input type="checkbox" className="w-5 h-5 rounded text-blue-600 focus:ring-blue-600 border-slate-300" />
                        </label>
                      </div>
                    </div>

                    {/* Right: Content */}
                    <div className="lg:col-span-2 space-y-8">
                      <div className="space-y-2">
                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Resource Title</label>
                        <input type="text" className="w-full px-6 py-4 bg-slate-50 border-none rounded-2xl focus:ring-2 focus:ring-blue-600/20 transition-all outline-none font-bold text-slate-900 text-xl" placeholder="e.g. 10 Tips for Better Sleep" />
                      </div>

                      <div className="space-y-2">
                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Content Editor</label>
                        <div className="w-full min-h-[400px] bg-slate-50 rounded-2xl p-8 border border-slate-100">
                          <p className="text-slate-400 font-medium italic">Start typing your content here... (Rich text editor placeholder)</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="pt-6 flex gap-4">
                    <button type="button" onClick={() => setShowAddModal(false)} className="px-10 py-5 bg-slate-100 text-slate-600 rounded-[24px] font-bold hover:bg-slate-200 transition-all">Cancel</button>
                    <button type="submit" className="flex-1 py-5 bg-blue-600 text-white rounded-[24px] font-bold hover:bg-blue-700 transition-all shadow-lg shadow-blue-100">Create Resource</button>
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

export default HealthResources;