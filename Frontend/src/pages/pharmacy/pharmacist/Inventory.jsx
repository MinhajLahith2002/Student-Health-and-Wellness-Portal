import React, { useEffect, useState, useMemo } from 'react';
import { 
  Search, 
  Filter, 
  Plus, 
  Edit2, 
  Trash2, 
  AlertTriangle, 
  CheckCircle2, 
  ChevronRight, 
  MoreVertical,
  ArrowUpDown,
  Download,
  Upload,
  ChevronLeft
} from 'lucide-react';
import { motion } from 'motion/react';
import { useNavigate } from 'react-router-dom';
import { cn } from '../../../lib/utils';
import { apiFetch } from '../../../lib/api';

const InventoryManagement = () => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [medicines, setMedicines] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const categories = ['All', 'Pain Relief', 'Antibiotics', 'Allergy', 'Cold & Flu', 'Vitamins'];

  useEffect(() => {
    let active = true;
    (async () => {
      setLoading(true);
      setError('');
      try {
        const data = await apiFetch('/medicines?limit=200');
        if (!active) return;
        setMedicines(Array.isArray(data?.medicines) ? data.medicines : []);
      } catch (err) {
        if (!active) return;
        setError(err.message || 'Failed to load medicines');
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, []);

  const filteredMedicines = useMemo(() => {
    return medicines.filter((med) => {
      const matchesSearch = med.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                           med.manufacturer.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCategory = selectedCategory === 'All' || med.category === selectedCategory;
      return matchesSearch && matchesCategory;
    });
  }, [medicines, searchQuery, selectedCategory]);

  const lowStockItems = useMemo(() => 
    medicines.filter((m) => m.stock <= m.reorderLevel),
    [medicines]
  );

  const handleDelete = async (id) => {
    try {
      await apiFetch(`/medicines/${id}`, { method: 'DELETE' });
      setMedicines((prev) => prev.filter((m) => m._id !== id));
    } catch (err) {
      setError(err.message || 'Delete failed');
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 pb-20">
      {/* Header */}
      <div className="bg-white border-b border-slate-200 sticky top-0 z-30 px-8 py-6">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row gap-6 items-center justify-between">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => navigate('/pharmacist/dashboard')}
              className="p-2 hover:bg-slate-100 rounded-full transition-colors text-slate-600"
            >
              <ChevronLeft className="w-6 h-6" />
            </button>
            <div>
              <h1 className="text-2xl font-bold text-slate-900">Inventory Management</h1>
              <p className="text-sm text-slate-500">Manage stock levels, pricing, and medicine details.</p>
            </div>
          </div>
          
          <div className="flex gap-3 w-full md:w-auto">
            <button className="flex-1 md:flex-none flex items-center justify-center gap-2 px-6 py-3 bg-white border border-slate-200 text-slate-600 rounded-xl font-bold hover:bg-slate-50 transition-all">
              <Download className="w-4 h-4" /> Export
            </button>
            <button className="flex-1 md:flex-none flex items-center justify-center gap-2 px-6 py-3 bg-white border border-slate-200 text-slate-600 rounded-xl font-bold hover:bg-slate-50 transition-all">
              <Upload className="w-4 h-4" /> Bulk Import
            </button>
            <button 
              onClick={() => navigate('/pharmacist/medicines/new')}
              className="flex-1 md:flex-none flex items-center justify-center gap-2 px-6 py-3 bg-emerald-600 text-white rounded-xl font-bold hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-100"
            >
              <Plus className="w-5 h-5" /> Add New
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-8 py-10">
        {/* Low Stock Alert Banner */}
        {lowStockItems.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8 p-6 rounded-2xl border-2 border-amber-200 bg-amber-50 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
          >
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-amber-100 flex items-center justify-center shrink-0">
                <AlertTriangle className="w-6 h-6 text-amber-600" />
              </div>
              <div>
                <h3 className="font-bold text-slate-900 text-lg">Low Stock Alert</h3>
                <p className="text-sm text-slate-600 mt-0.5">
                  {lowStockItems.length} medicine{lowStockItems.length > 1 ? 's' : ''} below reorder level. Restock soon to avoid shortages.
                </p>
                <div className="flex flex-wrap gap-2 mt-3">
                  {lowStockItems.map((item) => (
                    <span key={item._id} className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-amber-100 text-amber-800 rounded-lg text-xs font-bold">
                      {item.name}: <span className="text-rose-600">{item.stock}</span> left (min: {item.reorderLevel})
                    </span>
                  ))}
                </div>
              </div>
            </div>
            <button
              onClick={() => navigate(`/pharmacist/medicines/edit/${lowStockItems[0]._id}`)}
              className="shrink-0 px-6 py-3 bg-amber-600 text-white rounded-xl font-bold text-sm hover:bg-amber-700 transition-all"
            >
              Restock Now
            </button>
          </motion.div>
        )}

        {/* Filters & Search */}
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm mb-8 flex flex-col md:flex-row gap-4 items-center">
          <div className="flex-1 relative w-full">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
            <input 
              type="text"
              placeholder="Search by medicine name, manufacturer..."
              className="w-full pl-12 pr-4 py-3 bg-slate-50 border-none rounded-xl focus:ring-2 focus:ring-emerald-500 transition-all"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <div className="flex gap-2 w-full md:w-auto overflow-x-auto no-scrollbar">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={cn(
                  "px-6 py-3 rounded-xl text-sm font-bold whitespace-nowrap transition-all border-2",
                  selectedCategory === cat 
                    ? "bg-emerald-50 border-emerald-500 text-emerald-700" 
                    : "bg-white border-slate-50 text-slate-500 hover:border-emerald-200"
                )}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Inventory Table */}
        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-slate-50/50">
                  <th className="px-8 py-5 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                    <div className="flex items-center gap-2 cursor-pointer hover:text-slate-600">
                      Medicine Name <ArrowUpDown className="w-3 h-3" />
                    </div>
                  </th>
                  <th className="px-8 py-5 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Category</th>
                  <th className="px-8 py-5 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Stock Level</th>
                  <th className="px-8 py-5 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Price</th>
                  <th className="px-8 py-5 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Status</th>
                  <th className="px-8 py-5 text-[10px] font-bold text-slate-400 uppercase tracking-widest text-right">Actions</th>
                 </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredMedicines.map((med) => (
                  <tr key={med._id} className={cn(
                    "hover:bg-slate-50 transition-colors group",
                    med.stock <= med.reorderLevel ? "bg-amber-50/30" : ""
                  )}>
                    <td className="px-8 py-6">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-slate-100 rounded-xl overflow-hidden shrink-0">
                          <img src={med.image} alt={med.name} className="w-full h-full object-cover" />
                        </div>
                        <div>
                          <p className="font-bold text-slate-900">{med.name}</p>
                          <p className="text-xs text-slate-500">{med.strength} • {med.manufacturer}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-8 py-6">
                      <span className="px-3 py-1 bg-slate-100 text-slate-600 text-[10px] font-bold rounded-full uppercase tracking-wider">
                        {med.category}
                      </span>
                    </td>
                    <td className="px-8 py-6">
                      <div className="flex flex-col gap-1">
                        <div className="flex items-center gap-2">
                          <span className={cn(
                            "font-bold text-lg",
                            med.stock <= med.reorderLevel ? "text-amber-600" : "text-slate-900"
                          )}>
                            {med.stock}
                          </span>
                          <span className="text-xs text-slate-400">/ {med.reorderLevel} min</span>
                        </div>
                        <div className="w-24 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                          <div 
                            className={cn(
                              "h-full rounded-full transition-all",
                              med.stock <= med.reorderLevel ? "bg-amber-500" : "bg-emerald-500"
                            )}
                            style={{ width: `${Math.min(100, (med.stock / (med.reorderLevel * 2)) * 100)}%` }}
                          />
                        </div>
                      </div>
                    </td>
                    <td className="px-8 py-6">
                      <span className="font-bold text-slate-900">${med.price}</span>
                    </td>
                    <td className="px-8 py-6">
                      {med.stock <= med.reorderLevel ? (
                        <div className="flex items-center gap-1.5 text-amber-600">
                          <AlertTriangle className="w-4 h-4" />
                          <span className="text-[10px] font-bold uppercase tracking-wider">Low Stock</span>
                        </div>
                      ) : (
                        <div className="flex items-center gap-1.5 text-emerald-600">
                          <CheckCircle2 className="w-4 h-4" />
                          <span className="text-[10px] font-bold uppercase tracking-wider">Healthy</span>
                        </div>
                      )}
                    </td>
                    <td className="px-8 py-6 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button 
                          onClick={() => navigate(`/pharmacist/medicines/edit/${med._id}`)}
                          className="p-2 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-all"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button onClick={() => handleDelete(med._id)} className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-all">
                          <Trash2 className="w-4 h-4" />
                        </button>
                        <button className="p-2 text-slate-400 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-all">
                          <MoreVertical className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          
          {/* Pagination */}
          <div className="p-8 bg-slate-50/50 border-t border-slate-100 flex items-center justify-between">
            <p className="text-sm text-slate-500">
              Showing <span className="font-bold text-slate-900">1</span> to <span className="font-bold text-slate-900">{filteredMedicines.length}</span> of <span className="font-bold text-slate-900">{filteredMedicines.length}</span> medicines
            </p>
            <div className="flex gap-2">
              <button disabled className="px-4 py-2 bg-white border border-slate-200 text-slate-400 rounded-lg text-sm font-bold cursor-not-allowed">Previous</button>
              <button className="px-4 py-2 bg-white border border-slate-200 text-slate-900 rounded-lg text-sm font-bold hover:bg-slate-50 transition-all">Next</button>
            </div>
          </div>
        </div>
        {loading && <p className="text-sm text-slate-500 mt-4">Loading inventory...</p>}
        {error && <p className="text-sm text-rose-600 mt-4">{error}</p>}
      </div>
    </div>
  );
};

export default InventoryManagement;