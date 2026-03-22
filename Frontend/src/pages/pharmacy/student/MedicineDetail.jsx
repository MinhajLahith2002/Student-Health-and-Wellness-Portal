import React, { useState, useMemo } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { 
  ChevronLeft, 
  ShoppingCart, 
  ShieldCheck, 
  Info, 
  AlertCircle, 
  Thermometer, 
  Clock, 
  CheckCircle2,
  ArrowRight,
  Plus,
  Minus,
  Heart
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { MOCK_MEDICINES } from '../../../constants/mockPharmacyData';
import { cn } from '../../../lib/utils';

const MedicineDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [quantity, setQuantity] = useState(1);
  const [activeTab, setActiveTab] = useState('usage');
  const [isGenericSwitched, setIsGenericSwitched] = useState(false);

  const medicine = useMemo(() => MOCK_MEDICINES.find(m => m.id === id), [id]);

  if (!medicine) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6 text-center">
        <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mb-6">
          <AlertCircle className="w-10 h-10 text-slate-300" />
        </div>
        <h2 className="text-2xl font-bold text-slate-900 mb-2">Medicine not found</h2>
        <p className="text-slate-500 mb-8">The medicine you're looking for might have been removed or is unavailable.</p>
        <button 
          onClick={() => navigate('/student/pharmacy/search')}
          className="px-8 py-3 bg-emerald-600 text-white rounded-xl font-bold hover:bg-emerald-700 transition-all"
        >
          Back to Search
        </button>
      </div>
    );
  }

  const relatedMedicines = MOCK_MEDICINES.filter(m => m.category === medicine.category && m.id !== medicine.id);

  return (
    <div className="min-h-screen bg-slate-50 pb-20">
      {/* Navigation Header */}
      <div className="bg-white border-b border-slate-200 sticky top-0 z-30 px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <button 
            onClick={() => navigate(-1)}
            className="p-2 hover:bg-slate-100 rounded-full transition-colors text-slate-600"
          >
            <ChevronLeft className="w-6 h-6" />
          </button>
          <div className="flex items-center gap-4">
            <button className="p-2 hover:bg-slate-100 rounded-full transition-colors text-slate-400 hover:text-rose-500">
              <Heart className="w-6 h-6" />
            </button>
            <Link to="/student/pharmacy/checkout" className="relative p-2 hover:bg-slate-100 rounded-full transition-colors text-slate-600">
              <ShoppingCart className="w-6 h-6" />
              <span className="absolute top-0 right-0 w-5 h-5 bg-emerald-600 text-white text-[10px] font-bold rounded-full flex items-center justify-center border-2 border-white">
                2
              </span>
            </Link>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-10">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          {/* Left: Image Section */}
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="space-y-6"
          >
            <div className="aspect-square bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-sm relative group">
              <img 
                src={medicine.image} 
                alt={medicine.name} 
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                referrerPolicy="no-referrer"
              />
              {medicine.requiresPrescription && (
                <div className="absolute top-6 left-6 px-4 py-2 bg-amber-100/90 backdrop-blur-sm text-amber-700 text-xs font-bold rounded-full flex items-center shadow-sm">
                  <ShieldCheck className="w-4 h-4 mr-2" /> Prescription Required
                </div>
              )}
            </div>
            
            {/* Generic Alternative Card */}
            <motion.div 
              whileHover={{ scale: 1.01 }}
              className="bg-emerald-50 border border-emerald-100 rounded-2xl p-6 flex items-center justify-between group cursor-pointer"
            >
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center text-emerald-600 shadow-sm">
                  <CheckCircle2 className="w-6 h-6" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h4 className="font-bold text-emerald-900">Generic Available</h4>
                    <span className="px-2 py-0.5 bg-emerald-600 text-white text-[10px] font-bold rounded-full uppercase tracking-wider">Save 40%</span>
                  </div>
                  <p className="text-sm text-emerald-700/70">Switch to our high-quality generic alternative.</p>
                </div>
              </div>
              <button 
                onClick={() => setIsGenericSwitched(!isGenericSwitched)}
                className={cn(
                  "px-4 py-2 rounded-lg font-bold text-sm transition-all",
                  isGenericSwitched 
                    ? "bg-emerald-600 text-white" 
                    : "bg-white text-emerald-600 hover:bg-emerald-100"
                )}
              >
                {isGenericSwitched ? 'Switched' : 'Switch'}
              </button>
            </motion.div>
          </motion.div>

          {/* Right: Info Section */}
          <motion.div 
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="space-y-8"
          >
            <div>
              <div className="flex items-center gap-2 mb-2">
                <span className="px-3 py-1 bg-slate-100 text-slate-600 text-[10px] font-bold rounded-full uppercase tracking-widest">
                  {medicine.category}
                </span>
                <div className={cn(
                  "flex items-center gap-1 px-2 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider",
                  medicine.stock > 20 ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-700"
                )}>
                  <div className={cn("w-1.5 h-1.5 rounded-full", medicine.stock > 20 ? "bg-emerald-500" : "bg-amber-500")} />
                  {medicine.stock > 20 ? "In Stock" : `Only ${medicine.stock} left`}
                </div>
              </div>
              <h1 className="text-4xl font-bold text-slate-900 mb-2">{medicine.name}</h1>
              <p className="text-lg text-slate-500">{medicine.strength} • {medicine.manufacturer}</p>
              <div className="mt-6 flex items-baseline gap-2">
                <span className="text-4xl font-bold text-slate-900">${medicine.price}</span>
                <span className="text-slate-400 text-sm">per pack</span>
              </div>
            </div>

            <div className="p-6 bg-white rounded-2xl border border-slate-200 space-y-6">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <p className="text-sm font-bold text-slate-400 uppercase tracking-wider">Quantity</p>
                  <div className="flex items-center gap-4 bg-slate-50 p-1 rounded-xl w-fit">
                    <button 
                      onClick={() => setQuantity(Math.max(1, quantity - 1))}
                      className="w-10 h-10 flex items-center justify-center bg-white rounded-lg text-slate-600 hover:text-emerald-600 shadow-sm transition-colors"
                    >
                      <Minus className="w-4 h-4" />
                    </button>
                    <span className="w-8 text-center font-bold text-slate-900">{quantity}</span>
                    <button 
                      onClick={() => setQuantity(quantity + 1)}
                      className="w-10 h-10 flex items-center justify-center bg-white rounded-lg text-slate-600 hover:text-emerald-600 shadow-sm transition-colors"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-bold text-slate-400 uppercase tracking-wider">Subtotal</p>
                  <p className="text-2xl font-bold text-emerald-600">${(medicine.price * quantity).toFixed(2)}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <button className="py-4 bg-slate-900 text-white rounded-xl font-bold hover:bg-slate-800 transition-all shadow-lg shadow-slate-200">
                  Buy Now
                </button>
                <button className="py-4 bg-emerald-600 text-white rounded-xl font-bold hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-100 flex items-center justify-center gap-2">
                  <ShoppingCart className="w-5 h-5" /> Add to Cart
                </button>
              </div>

              {medicine.requiresPrescription && (
                <div className="p-4 bg-amber-50 rounded-xl border border-amber-100 flex gap-3">
                  <Info className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-bold text-amber-900">Prescription Required</p>
                    <p className="text-xs text-amber-700/80 leading-relaxed">
                      This medicine requires a valid prescription. You can upload it during checkout or 
                      <Link to="/student/pharmacy/upload-prescription" className="underline font-bold ml-1">upload now</Link>.
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Expandable Info Sections */}
            <div className="space-y-4">
              <div className="flex border-b border-slate-200">
                {['usage', 'sideEffects', 'storage'].map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={cn(
                      "px-6 py-4 text-sm font-bold uppercase tracking-wider transition-all relative",
                      activeTab === tab ? "text-emerald-600" : "text-slate-400 hover:text-slate-600"
                    )}
                  >
                    {tab.replace(/([A-Z])/g, ' $1')}
                    {activeTab === tab && (
                      <motion.div 
                        layoutId="activeTab"
                        className="absolute bottom-0 left-0 right-0 h-0.5 bg-emerald-600" 
                      />
                    )}
                  </button>
                ))}
              </div>
              <div className="p-6 bg-white rounded-2xl border border-slate-200 min-h-[200px]">
                <AnimatePresence mode="wait">
                  <motion.div
                    key={activeTab}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="space-y-4"
                  >
                    {activeTab === 'usage' && (
                      <div className="space-y-4">
                        <div className="flex gap-3">
                          <div className="w-8 h-8 bg-emerald-50 rounded-lg flex items-center justify-center text-emerald-600 shrink-0">
                            <Info className="w-4 h-4" />
                          </div>
                          <div>
                            <p className="font-bold text-slate-900 mb-1">Description</p>
                            <p className="text-slate-600 leading-relaxed">{medicine.description}</p>
                          </div>
                        </div>
                        <div className="flex gap-3">
                          <div className="w-8 h-8 bg-emerald-50 rounded-lg flex items-center justify-center text-emerald-600 shrink-0">
                            <Clock className="w-4 h-4" />
                          </div>
                          <div>
                            <p className="font-bold text-slate-900 mb-1">How to use</p>
                            <p className="text-slate-600 leading-relaxed">{medicine.usage}</p>
                          </div>
                        </div>
                      </div>
                    )}
                    {activeTab === 'sideEffects' && (
                      <div className="flex gap-3">
                        <div className="w-8 h-8 bg-rose-50 rounded-lg flex items-center justify-center text-rose-600 shrink-0">
                          <AlertCircle className="w-4 h-4" />
                        </div>
                        <div>
                          <p className="font-bold text-slate-900 mb-1">Common Side Effects</p>
                          <p className="text-slate-600 leading-relaxed">{medicine.sideEffects}</p>
                        </div>
                      </div>
                    )}
                    {activeTab === 'storage' && (
                      <div className="flex gap-3">
                        <div className="w-8 h-8 bg-blue-50 rounded-lg flex items-center justify-center text-blue-600 shrink-0">
                          <Thermometer className="w-4 h-4" />
                        </div>
                        <div>
                          <p className="font-bold text-slate-900 mb-1">Storage Instructions</p>
                          <p className="text-slate-600 leading-relaxed">{medicine.storage}</p>
                        </div>
                      </div>
                    )}
                  </motion.div>
                </AnimatePresence>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Related Medicines */}
        {relatedMedicines.length > 0 && (
          <section className="mt-20">
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-2xl font-bold text-slate-900">Similar Medicines</h2>
              <Link to="/student/pharmacy/search" className="text-emerald-600 font-bold flex items-center hover:underline">
                View All <ArrowRight className="ml-2 w-4 h-4" />
              </Link>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              {relatedMedicines.map((med) => (
                <motion.div 
                  key={med.id}
                  whileHover={{ y: -4 }}
                  className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm group"
                >
                  <Link to={`/student/pharmacy/medicine/${med.id}`} className="aspect-[4/3] bg-slate-100 relative overflow-hidden block">
                    <img 
                      src={med.image} 
                      alt={med.name} 
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      referrerPolicy="no-referrer"
                    />
                  </Link>
                  <div className="p-4">
                    <h3 className="font-bold text-slate-900">{med.name}</h3>
                    <p className="text-xs text-slate-500 mb-3">{med.strength}</p>
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-emerald-600">${med.price}</span>
                      <button className="p-2 bg-emerald-50 text-emerald-600 rounded-lg hover:bg-emerald-100 transition-colors">
                        <Plus className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  );
};

export default MedicineDetail;