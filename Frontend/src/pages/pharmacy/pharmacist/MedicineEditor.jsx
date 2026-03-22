import React, { useState, useEffect } from 'react';
import { 
  ChevronLeft, 
  Save, 
  X, 
  Upload, 
  Plus, 
  Trash2, 
  ShieldCheck, 
  Info, 
  AlertCircle,
  CheckCircle2,
  Loader2,
  Image as ImageIcon
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useParams, useNavigate } from 'react-router-dom';
import { MOCK_MEDICINES } from '../../../constants/mockPharmacyData';
import { cn } from '../../../lib/utils';

const MedicineEditor = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEditing = !!id;

  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    strength: '',
    manufacturer: '',
    price: '',
    category: 'Pain Relief',
    stock: '',
    reorderLevel: '',
    requiresPrescription: false,
    description: '',
    usage: '',
    sideEffects: '',
    storage: '',
    image: '',
    genericAlternatives: []
  });

  useEffect(() => {
    if (isEditing) {
      const med = MOCK_MEDICINES.find(m => m.id === id);
      if (med) {
        setFormData({
          name: med.name,
          strength: med.strength,
          manufacturer: med.manufacturer,
          price: med.price.toString(),
          category: med.category,
          stock: med.stock.toString(),
          reorderLevel: med.reorderLevel.toString(),
          requiresPrescription: med.requiresPrescription,
          description: med.description,
          usage: med.usage,
          sideEffects: med.sideEffects,
          storage: med.storage,
          image: med.image || '',
          genericAlternatives: med.genericAlternatives || []
        });
      }
    }
  }, [id, isEditing]);

  const handleInputChange = (e) => {
    const { name, value, type } = e.target;
    const val = type === 'checkbox' ? e.target.checked : value;
    setFormData(prev => ({ ...prev, [name]: val }));
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 2000));
    setIsSaving(false);
    setIsSuccess(true);
    setTimeout(() => {
      navigate('/pharmacist/inventory');
    }, 2000);
  };

  return (
    <div className="min-h-screen bg-slate-50 pb-20">
      {/* Header */}
      <div className="bg-white border-b border-slate-200 sticky top-0 z-30 px-8 py-6">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => navigate('/pharmacist/inventory')}
              className="p-2 hover:bg-slate-100 rounded-full transition-colors text-slate-600"
            >
              <ChevronLeft className="w-6 h-6" />
            </button>
            <h1 className="text-2xl font-bold text-slate-900">
              {isEditing ? 'Edit Medicine' : 'Add New Medicine'}
            </h1>
          </div>
          <div className="flex gap-3">
            <button 
              onClick={() => navigate('/pharmacist/inventory')}
              className="px-6 py-3 bg-white border border-slate-200 text-slate-600 rounded-xl font-bold hover:bg-slate-50 transition-all"
            >
              Cancel
            </button>
            <button 
              onClick={handleSave}
              disabled={isSaving}
              className="px-8 py-3 bg-emerald-600 text-white rounded-xl font-bold hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-100 flex items-center gap-2"
            >
              {isSaving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
              {isSaving ? 'Saving...' : 'Save Medicine'}
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-8 py-10">
        <AnimatePresence>
          {isSuccess && (
            <motion.div 
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="mb-8 p-6 bg-emerald-50 border border-emerald-100 rounded-3xl flex items-center gap-4 text-emerald-700"
            >
              <CheckCircle2 className="w-6 h-6" />
              <p className="font-bold">Medicine {isEditing ? 'updated' : 'added'} successfully! Redirecting...</p>
            </motion.div>
          )}
        </AnimatePresence>

        <form onSubmit={handleSave} className="grid grid-cols-1 lg:grid-cols-3 gap-10">
          {/* Left: Image & Quick Stats */}
          <div className="lg:col-span-1 space-y-8">
            <section className="bg-white rounded-[40px] border border-slate-200 shadow-sm p-8">
              <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-6">Medicine Image</h3>
              <div className="aspect-square bg-slate-50 rounded-3xl border-2 border-dashed border-slate-200 flex flex-col items-center justify-center relative overflow-hidden group cursor-pointer hover:border-emerald-400 transition-all">
                {formData.image ? (
                  <>
                    <img src={formData.image} alt="Preview" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                    <div className="absolute inset-0 bg-slate-900/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <Upload className="w-10 h-10 text-white" />
                    </div>
                  </>
                ) : (
                  <>
                    <ImageIcon className="w-12 h-12 text-slate-300 mb-4" />
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Upload Image</p>
                  </>
                )}
              </div>
              <p className="text-[10px] text-slate-400 text-center mt-4">Recommended: 800x800px JPG or PNG</p>
            </section>

            <section className="bg-white rounded-[40px] border border-slate-200 shadow-sm p-8">
              <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-6">Quick Settings</h3>
              <div className="space-y-6">
                <label className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl cursor-pointer hover:bg-slate-100 transition-all">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-amber-600 shadow-sm">
                      <ShieldCheck className="w-5 h-5" />
                    </div>
                    <span className="font-bold text-slate-700">Prescription Required</span>
                  </div>
                  <input 
                    type="checkbox" 
                    name="requiresPrescription"
                    checked={formData.requiresPrescription}
                    onChange={handleInputChange}
                    className="w-6 h-6 rounded-lg text-emerald-600 focus:ring-emerald-500 border-slate-300"
                  />
                </label>

                <div className="p-6 bg-emerald-50 rounded-3xl border border-emerald-100">
                  <div className="flex gap-3 mb-3">
                    <Info className="w-5 h-5 text-emerald-600 shrink-0" />
                    <p className="text-xs font-bold text-emerald-900 leading-tight">
                      Generic Alternatives
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {formData.genericAlternatives.map((alt, i) => (
                      <span key={i} className="px-2 py-1 bg-white text-emerald-700 text-[10px] font-bold rounded-md border border-emerald-200 flex items-center gap-1">
                        {alt} 
                        <X 
                          className="w-3 h-3 cursor-pointer" 
                          onClick={() => setFormData(prev => ({ ...prev, genericAlternatives: prev.genericAlternatives.filter((_, idx) => idx !== i) }))} 
                        />
                      </span>
                    ))}
                    <button 
                      type="button"
                      className="px-2 py-1 bg-emerald-600 text-white text-[10px] font-bold rounded-md flex items-center gap-1 hover:bg-emerald-700"
                    >
                      <Plus className="w-3 h-3" /> Add
                    </button>
                  </div>
                </div>
              </div>
            </section>
          </div>

          {/* Right: Detailed Form */}
          <div className="lg:col-span-2 space-y-8">
            <section className="bg-white rounded-[40px] border border-slate-200 shadow-sm p-10">
              <h3 className="text-lg font-bold text-slate-900 mb-8">Basic Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">Medicine Name</label>
                  <input 
                    type="text" 
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    placeholder="e.g., Paracetamol"
                    className="w-full p-4 bg-slate-50 border-none rounded-2xl focus:ring-2 focus:ring-emerald-500 transition-all font-bold text-slate-700"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">Strength / Dosage</label>
                  <input 
                    type="text" 
                    name="strength"
                    value={formData.strength}
                    onChange={handleInputChange}
                    placeholder="e.g., 500mg"
                    className="w-full p-4 bg-slate-50 border-none rounded-2xl focus:ring-2 focus:ring-emerald-500 transition-all font-bold text-slate-700"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">Manufacturer</label>
                  <input 
                    type="text" 
                    name="manufacturer"
                    value={formData.manufacturer}
                    onChange={handleInputChange}
                    placeholder="e.g., GSK Pharmaceuticals"
                    className="w-full p-4 bg-slate-50 border-none rounded-2xl focus:ring-2 focus:ring-emerald-500 transition-all font-bold text-slate-700"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">Category</label>
                  <select 
                    name="category"
                    value={formData.category}
                    onChange={handleInputChange}
                    className="w-full p-4 bg-slate-50 border-none rounded-2xl focus:ring-2 focus:ring-emerald-500 transition-all font-bold text-slate-700"
                  >
                    <option value="Pain Relief">Pain Relief</option>
                    <option value="Antibiotics">Antibiotics</option>
                    <option value="Allergy">Allergy</option>
                    <option value="Cold & Flu">Cold & Flu</option>
                    <option value="Vitamins">Vitamins</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">Price ($)</label>
                  <input 
                    type="number" 
                    name="price"
                    value={formData.price}
                    onChange={handleInputChange}
                    placeholder="0.00"
                    step="0.01"
                    className="w-full p-4 bg-slate-50 border-none rounded-2xl focus:ring-2 focus:ring-emerald-500 transition-all font-bold text-slate-700"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">Stock</label>
                    <input 
                      type="number" 
                      name="stock"
                      value={formData.stock}
                      onChange={handleInputChange}
                      placeholder="0"
                      className="w-full p-4 bg-slate-50 border-none rounded-2xl focus:ring-2 focus:ring-emerald-500 transition-all font-bold text-slate-700"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">Reorder Level</label>
                    <input 
                      type="number" 
                      name="reorderLevel"
                      value={formData.reorderLevel}
                      onChange={handleInputChange}
                      placeholder="10"
                      className="w-full p-4 bg-slate-50 border-none rounded-2xl focus:ring-2 focus:ring-emerald-500 transition-all font-bold text-slate-700"
                    />
                  </div>
                </div>
              </div>
            </section>

            <section className="bg-white rounded-[40px] border border-slate-200 shadow-sm p-10">
              <h3 className="text-lg font-bold text-slate-900 mb-8">Medical Information</h3>
              <div className="space-y-8">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">Description</label>
                  <textarea 
                    name="description"
                    value={formData.description}
                    onChange={handleInputChange}
                    placeholder="Brief overview of the medicine..."
                    className="w-full p-4 bg-slate-50 border-none rounded-2xl focus:ring-2 focus:ring-emerald-500 transition-all min-h-[100px]"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">Usage Instructions</label>
                  <textarea 
                    name="usage"
                    value={formData.usage}
                    onChange={handleInputChange}
                    placeholder="How should the patient take this medicine?"
                    className="w-full p-4 bg-slate-50 border-none rounded-2xl focus:ring-2 focus:ring-emerald-500 transition-all min-h-[100px]"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">Side Effects</label>
                  <textarea 
                    name="sideEffects"
                    value={formData.sideEffects}
                    onChange={handleInputChange}
                    placeholder="Common side effects to watch out for..."
                    className="w-full p-4 bg-slate-50 border-none rounded-2xl focus:ring-2 focus:ring-emerald-500 transition-all min-h-[100px]"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">Storage</label>
                  <textarea 
                    name="storage"
                    value={formData.storage}
                    onChange={handleInputChange}
                    placeholder="Storage conditions (e.g., room temperature, refrigerate)..."
                    className="w-full p-4 bg-slate-50 border-none rounded-2xl focus:ring-2 focus:ring-emerald-500 transition-all min-h-[80px]"
                  />
                </div>
              </div>
            </section>
          </div>
        </form>
      </div>
    </div>
  );
};

export default MedicineEditor;