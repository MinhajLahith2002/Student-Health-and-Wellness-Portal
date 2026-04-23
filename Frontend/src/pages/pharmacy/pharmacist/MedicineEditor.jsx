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
import { useForm } from '../../../hooks/useForm';
import { apiFetch, resolveAssetUrl } from '../../../lib/api';
import { cn } from '../../../lib/utils';

const MEDICINE_CATEGORIES = ['Pain Relief', 'Antibiotics', 'Allergy', 'Cold & Flu', 'Vitamins', 'First Aid', 'Personal Care', 'Hygiene', 'Wellness'];

const MedicineEditor = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEditing = !!id;

  const [selectedFile, setSelectedFile] = useState(null);
  const [newAlt, setNewAlt] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState('');

  const validate = (values) => {
    const errors = {};
    if (!values.name?.trim()) errors.name = 'Medicine name is required';
    if (!values.strength?.trim()) errors.strength = 'Strength is required';
    if (!values.manufacturer?.trim()) errors.manufacturer = 'Manufacturer is required';
    if (!values.price || isNaN(Number(values.price)) || Number(values.price) < 0) {
      errors.price = 'Price must be a positive number';
    }
    if (!values.stock || isNaN(Number(values.stock)) || Number(values.stock) < 0) {
      errors.stock = 'Stock must be a non-negative integer';
    }
    if (!values.category) errors.category = 'Category is required';
    if (!values.description?.trim()) errors.description = 'Description is required';
    if (!values.usage?.trim()) errors.usage = 'Usage instructions are required';
    return errors;
  };

  const {
    values,
    errors,
    touched,
    handleChange,
    handleBlur,
    handleSubmit,
    setValues,
    setFieldValue
  } = useForm({
    name: '',
    strength: '',
    manufacturer: '',
    price: '',
    category: 'Pain Relief',
    stock: '',
    reorderLevel: '20',
    requiresPrescription: false,
    description: '',
    usage: '',
    sideEffects: '',
    storage: '',
    image: '',
    genericAlternatives: []
  }, validate);

  useEffect(() => {
    if (!isEditing) return;
    let active = true;
    (async () => {
      try {
        const med = await apiFetch(`/medicines/${id}`);
        if (!active) return;
        setValues({
          name: med.name || '',
          strength: med.strength || '',
          manufacturer: med.manufacturer || '',
          price: String(med.price ?? ''),
          category: med.category || 'Pain Relief',
          stock: String(med.stock ?? ''),
          reorderLevel: String(med.reorderLevel ?? '20'),
          requiresPrescription: !!med.requiresPrescription,
          description: med.description || '',
          usage: med.usage || '',
          sideEffects: med.sideEffects || '',
          storage: med.storage || '',
          image: med.image || '',
          genericAlternatives: Array.isArray(med.genericAlternatives) ? med.genericAlternatives : []
        });
      } catch (err) {
        if (active) setError(err.message || 'Failed to load medicine');
      }
    })();
    return () => {
      active = false;
    };
  }, [id, isEditing, setValues]);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setSelectedFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setFieldValue('image', reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleAddAlt = () => {
    if (newAlt.trim()) {
      setFieldValue('genericAlternatives', [...values.genericAlternatives, newAlt.trim()]);
      setNewAlt('');
    }
  };

  const handleSave = async (e) => {
    if (e) e.preventDefault();
    
    handleSubmit(async (data) => {
      setError('');
      setIsSaving(true);
      try {
        const formDataPayload = new FormData();
        
        // Append all text fields
        formDataPayload.append('name', data.name.trim());
        formDataPayload.append('strength', data.strength.trim());
        formDataPayload.append('manufacturer', data.manufacturer.trim());
        formDataPayload.append('price', String(data.price));
        formDataPayload.append('category', data.category);
        formDataPayload.append('stock', String(data.stock));
        formDataPayload.append('reorderLevel', String(data.reorderLevel || 20));
        formDataPayload.append('requiresPrescription', String(!!data.requiresPrescription));
        formDataPayload.append('description', data.description.trim());
        formDataPayload.append('usage', data.usage.trim());
        formDataPayload.append('sideEffects', data.sideEffects?.trim() || '');
        formDataPayload.append('storage', data.storage?.trim() || '');
        
        formDataPayload.append('genericAlternatives', JSON.stringify(data.genericAlternatives));

        if (selectedFile) {
          formDataPayload.append('image', selectedFile);
        } else if (data.image && typeof data.image === 'string' && !data.image.startsWith('data:')) {
          formDataPayload.append('image', data.image);
        }

        if (isEditing) {
          await apiFetch(`/medicines/${id}`, {
            method: 'PUT',
            body: formDataPayload
          });
        } else {
          await apiFetch('/medicines', {
            method: 'POST',
            body: formDataPayload
          });
        }
        setIsSaving(false);
        setIsSuccess(true);
        setTimeout(() => navigate('/pharmacist/inventory'), 1200);
      } catch (err) {
        setIsSaving(false);
        setError(err.message || 'Failed to save medicine');
        console.error("Save Error:", err);
      }
    });
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
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-8 p-6 bg-rose-50 border border-rose-100 rounded-3xl text-rose-700"
            >
              <p className="font-bold">{error}</p>
            </motion.div>
          )}
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
              <input 
                type="file" 
                id="medicine-image" 
                className="hidden" 
                accept="image/*"
                onChange={handleFileChange}
              />
              <div 
                onClick={() => document.getElementById('medicine-image')?.click()}
                className={cn(
                  "aspect-square bg-slate-50 rounded-3xl border-2 border-dashed border-slate-200 flex flex-col items-center justify-center relative overflow-hidden group cursor-pointer hover:border-emerald-400 transition-all",
                  errors.image && "border-rose-500 bg-rose-50/10"
                )}
              >
                {values.image ? (
                  <>
                    <img src={resolveAssetUrl(values.image)} alt="Preview" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
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
                    checked={values.requiresPrescription}
                    onChange={handleChange}
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
                  <div className="space-y-3">
                    <div className="flex flex-wrap gap-2">
                      {values.genericAlternatives.map((alt, i) => (
                        <span key={i} className="px-2 py-1 bg-white text-emerald-700 text-[10px] font-bold rounded-md border border-emerald-200 flex items-center gap-1">
                          {alt} 
                          <X 
                            className="w-3 h-3 cursor-pointer" 
                            onClick={() => setFieldValue('genericAlternatives', values.genericAlternatives.filter((_, idx) => idx !== i))} 
                          />
                        </span>
                      ))}
                    </div>
                    <div className="flex gap-2 text-xs">
                      <input 
                        type="text"
                        value={newAlt}
                        onChange={(e) => setNewAlt(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddAlt())}
                        placeholder="Add alternative..."
                        className="flex-1 px-2 py-1 bg-white border border-emerald-100 rounded-md focus:ring-1 focus:ring-emerald-500 outline-none"
                      />
                      <button 
                        type="button"
                        onClick={handleAddAlt}
                        className="px-2 py-1 bg-emerald-600 text-white font-bold rounded-md hover:bg-emerald-700 flex items-center gap-1"
                      >
                        <Plus className="w-3 h-3" /> Add
                      </button>
                    </div>
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
                    value={values.name}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    placeholder="e.g., Paracetamol"
                    className={cn(
                      "w-full p-4 bg-slate-50 border-2 border-transparent rounded-2xl focus:ring-2 focus:ring-emerald-500 transition-all font-bold text-slate-700",
                      errors.name && touched.name && "border-rose-500 bg-rose-50/10 ring-2 ring-rose-500/20"
                    )}
                  />
                  {errors.name && touched.name && <p className="text-rose-500 text-[10px] font-bold px-2">{errors.name}</p>}
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">Strength / Dosage</label>
                  <input 
                    type="text" 
                    name="strength"
                    value={values.strength}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    placeholder="e.g., 500mg"
                    className={cn(
                      "w-full p-4 bg-slate-50 border-2 border-transparent rounded-2xl focus:ring-2 focus:ring-emerald-500 transition-all font-bold text-slate-700",
                      errors.strength && touched.strength && "border-rose-500 bg-rose-50/10 ring-2 ring-rose-500/20"
                    )}
                  />
                  {errors.strength && touched.strength && <p className="text-rose-500 text-[10px] font-bold px-2">{errors.strength}</p>}
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">Manufacturer</label>
                  <input 
                    type="text" 
                    name="manufacturer"
                    value={values.manufacturer}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    placeholder="e.g., GSK Pharmaceuticals"
                    className={cn(
                      "w-full p-4 bg-slate-50 border-2 border-transparent rounded-2xl focus:ring-2 focus:ring-emerald-500 transition-all font-bold text-slate-700",
                      errors.manufacturer && touched.manufacturer && "border-rose-500 bg-rose-50/10 ring-2 ring-rose-500/20"
                    )}
                  />
                  {errors.manufacturer && touched.manufacturer && <p className="text-rose-500 text-[10px] font-bold px-2">{errors.manufacturer}</p>}
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">Category</label>
                  <select 
                    name="category"
                    value={values.category}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    className={cn(
                      "w-full p-4 bg-slate-50 border-2 border-transparent rounded-2xl focus:ring-2 focus:ring-emerald-500 transition-all font-bold text-slate-700",
                      errors.category && touched.category && "border-rose-500 bg-rose-50/10 ring-2 ring-rose-500/20"
                    )}
                  >
                    {MEDICINE_CATEGORIES.map((category) => (
                      <option key={category} value={category}>{category}</option>
                    ))}
                  </select>
                  {errors.category && touched.category && <p className="text-rose-500 text-[10px] font-bold px-2">{errors.category}</p>}
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">Price ($)</label>
                  <input 
                    type="number" 
                    name="price"
                    value={values.price}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    placeholder="0.00"
                    step="0.01"
                    className={cn(
                      "w-full p-4 bg-slate-50 border-2 border-transparent rounded-2xl focus:ring-2 focus:ring-emerald-500 transition-all font-bold text-slate-700",
                      errors.price && touched.price && "border-rose-500 bg-rose-50/10 ring-2 ring-rose-500/20"
                    )}
                  />
                  {errors.price && touched.price && <p className="text-rose-500 text-[10px] font-bold px-2">{errors.price}</p>}
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">Stock</label>
                    <input 
                      type="number" 
                      name="stock"
                      value={values.stock}
                      onChange={handleChange}
                      onBlur={handleBlur}
                      placeholder="0"
                      className={cn(
                        "w-full p-4 bg-slate-50 border-2 border-transparent rounded-2xl focus:ring-2 focus:ring-emerald-500 transition-all font-bold text-slate-700",
                        errors.stock && touched.stock && "border-rose-500 bg-rose-50/10 ring-2 ring-rose-500/20"
                      )}
                    />
                    {errors.stock && touched.stock && <p className="text-rose-500 text-[10px] font-bold px-2">{errors.stock}</p>}
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">Reorder Level</label>
                    <input 
                      type="number" 
                      name="reorderLevel"
                      value={values.reorderLevel}
                      onChange={handleChange}
                      onBlur={handleBlur}
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
                    value={values.description}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    placeholder="Brief overview of the medicine..."
                    className={cn(
                      "w-full p-4 bg-slate-50 border-2 border-transparent rounded-2xl focus:ring-2 focus:ring-emerald-500 transition-all min-h-[100px]",
                      errors.description && touched.description && "border-rose-500 bg-rose-50/10 ring-2 ring-rose-500/20"
                    )}
                  />
                  {errors.description && touched.description && <p className="text-rose-500 text-[10px] font-bold px-2">{errors.description}</p>}
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">Usage Instructions</label>
                  <textarea 
                    name="usage"
                    value={values.usage}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    placeholder="How should the patient take this medicine?"
                    className={cn(
                      "w-full p-4 bg-slate-50 border-2 border-transparent rounded-2xl focus:ring-2 focus:ring-emerald-500 transition-all min-h-[100px]",
                      errors.usage && touched.usage && "border-rose-500 bg-rose-50/10 ring-2 ring-rose-500/20"
                    )}
                  />
                  {errors.usage && touched.usage && <p className="text-rose-500 text-[10px] font-bold px-2">{errors.usage}</p>}
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">Side Effects</label>
                  <textarea 
                    name="sideEffects"
                    value={values.sideEffects}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    placeholder="Common side effects to watch out for..."
                    className="w-full p-4 bg-slate-50 border-none rounded-2xl focus:ring-2 focus:ring-emerald-500 transition-all min-h-[100px]"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">Storage</label>
                  <textarea 
                    name="storage"
                    value={values.storage}
                    onChange={handleChange}
                    onBlur={handleBlur}
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
