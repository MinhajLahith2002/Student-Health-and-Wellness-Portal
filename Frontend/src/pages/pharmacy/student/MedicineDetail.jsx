import React, { useEffect, useMemo, useState } from 'react';
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
  Loader2
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../../../lib/utils';
import { apiFetch } from '../../../lib/api';
import { addItemToCart, getCartCount, getProductFallbackImage, getProductImage, getProductPlaceholderImage } from '../../../lib/pharmacyCart';

const MedicineDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [quantity, setQuantity] = useState(1);
  const [activeTab, setActiveTab] = useState('usage');
  const [medicine, setMedicine] = useState(null);
  const [relatedMedicines, setRelatedMedicines] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [cartCount, setCartCount] = useState(() => getCartCount());
  const [isGenericSwitched, setIsGenericSwitched] = useState(false);

  useEffect(() => {
    let active = true;

    const loadMedicine = async () => {
      setLoading(true);
      setError('');
      try {
        const medicineData = await apiFetch(`/medicines/${id}`);
        if (!active) return;
        setMedicine(medicineData);

        const relatedData = await apiFetch(`/medicines?category=${encodeURIComponent(medicineData.category)}&limit=4`);
        if (!active) return;
        const related = Array.isArray(relatedData?.medicines)
          ? relatedData.medicines.filter((item) => item._id !== medicineData._id).slice(0, 4)
          : [];
        setRelatedMedicines(related);
      } catch (err) {
        if (active) setError(err.message || 'Failed to load medicine details');
      } finally {
        if (active) setLoading(false);
      }
    };

    loadMedicine();
    return () => {
      active = false;
    };
  }, [id]);

  const subtotal = useMemo(() => {
    if (!medicine) return 0;
    return (Number(medicine.price) || 0) * quantity;
  }, [medicine, quantity]);

  const addCurrentMedicineToCart = (nextQuantity = quantity) => {
    if (!medicine) return;
    const nextItems = addItemToCart(medicine, nextQuantity);
    setCartCount(nextItems.reduce((sum, item) => sum + (Number(item.quantity) || 1), 0));
  };

  if (loading) {
    return (
      <div className="pharmacy-shell flex items-center justify-center p-6">
        <div className="text-center">
          <Loader2 className="w-8 h-8 text-accent-primary animate-spin mx-auto mb-4" />
          <p className="text-secondary-text font-medium">Loading medicine details...</p>
        </div>
      </div>
    );
  }

  if (!medicine) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6 text-center">
        <div className="w-20 h-20 bg-[#e6f0f4] rounded-full flex items-center justify-center mb-6">
          <AlertCircle className="w-10 h-10 text-slate-300" />
        </div>
        <h2 className="text-2xl font-bold text-primary-text mb-2">Medicine not found</h2>
        <p className="text-secondary-text mb-8">The medicine you're looking for might have been removed or is unavailable.</p>
        <button
          onClick={() => navigate('/student/pharmacy/products')}
          className="px-8 py-3 bg-accent-primary text-white rounded-xl font-bold hover:bg-[#105f72] transition-all"
        >
          Back to Catalog
        </button>
        {error && <p className="mt-4 text-sm text-rose-600">{error}</p>}
      </div>
    );
  }

  return (
    <div className="pharmacy-shell pb-20">
      <div className="px-6 pt-28">
        <div className="max-w-7xl mx-auto pharmacy-hero flex items-center justify-between">
          <button
            onClick={() => navigate(-1)}
            className="p-2 hover:bg-[#e6f0f4] rounded-full transition-colors text-secondary-text"
          >
            <ChevronLeft className="w-6 h-6" />
          </button>
          <div className="flex items-center gap-4">
            <Link to="/student/pharmacy/checkout" className="relative p-2 hover:bg-[#e6f0f4] rounded-full transition-colors text-secondary-text">
              <ShoppingCart className="w-6 h-6" />
              <span className="absolute top-0 right-0 min-w-5 h-5 px-1 bg-accent-primary text-white text-[10px] font-bold rounded-full flex items-center justify-center border-2 border-white">
                {cartCount}
              </span>
            </Link>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-10">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} className="space-y-6">
            <div className="aspect-square pharmacy-panel overflow-hidden relative group">
              {medicine.image || medicine.imageUrl ? (
                <img
                  src={getProductImage(medicine)}
                  alt={medicine.name}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                  referrerPolicy="no-referrer"
                  onError={(event) => {
                    const fallbackImage = getProductFallbackImage(medicine);
                    if (fallbackImage && event.currentTarget.src !== fallbackImage) {
                      event.currentTarget.src = fallbackImage;
                      return;
                    }
                    event.currentTarget.onerror = null;
                    event.currentTarget.src = getProductPlaceholderImage(medicine);
                  }}
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-slate-300">
                  <AlertCircle className="w-16 h-16" />
                </div>
              )}
              {medicine.requiresPrescription && (
                <div className="absolute top-6 left-6 px-4 py-2 bg-amber-100/90 backdrop-blur-sm text-amber-700 text-xs font-bold rounded-full flex items-center shadow-sm">
                  <ShieldCheck className="w-4 h-4 mr-2" /> Prescription Required
                </div>
              )}
            </div>

            {Array.isArray(medicine.genericAlternatives) && medicine.genericAlternatives.length > 0 && (
              <motion.div whileHover={{ scale: 1.01 }} className="bg-[#e8f7f5] border border-emerald-100 rounded-2xl p-6 flex items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center text-accent-primary shadow-sm">
                    <CheckCircle2 className="w-6 h-6" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <h4 className="font-bold text-emerald-900">Generic Alternatives</h4>
                      <span className="px-2 py-0.5 bg-accent-primary text-white text-[10px] font-bold rounded-full uppercase tracking-wider">
                        {medicine.genericAlternatives.length} option{medicine.genericAlternatives.length > 1 ? 's' : ''}
                      </span>
                    </div>
                    <p className="text-sm text-emerald-700/80">{medicine.genericAlternatives.join(', ')}</p>
                  </div>
                </div>
                <button
                  onClick={() => setIsGenericSwitched((current) => !current)}
                  className={cn(
                    'px-4 py-2 rounded-lg font-bold text-sm transition-all',
                    isGenericSwitched ? 'bg-accent-primary text-white' : 'bg-white text-accent-primary hover:bg-emerald-100'
                  )}
                >
                  {isGenericSwitched ? 'Noted' : 'Review'}
                </button>
              </motion.div>
            )}
          </motion.div>

          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-8">
            <div>
              <div className="flex items-center gap-2 mb-2 flex-wrap">
                <span className="px-3 py-1 bg-[#e6f0f4] text-secondary-text text-[10px] font-bold rounded-full uppercase tracking-widest">
                  {medicine.category}
                </span>
                <div className={cn(
                  'flex items-center gap-1 px-2 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider',
                  medicine.stock > 20 ? 'bg-[#e8f7f5] text-emerald-700' : medicine.stock > 0 ? 'bg-amber-50 text-amber-700' : 'bg-rose-50 text-rose-700'
                )}>
                  <div className={cn('w-1.5 h-1.5 rounded-full', medicine.stock > 20 ? 'bg-accent-green' : medicine.stock > 0 ? 'bg-amber-500' : 'bg-rose-500')} />
                  {medicine.stock > 20 ? 'In Stock' : medicine.stock > 0 ? `Only ${medicine.stock} left` : 'Out of Stock'}
                </div>
              </div>
              <h1 className="text-4xl font-bold text-primary-text mb-2">{medicine.name}</h1>
              <p className="text-lg text-secondary-text">{[medicine.strength, medicine.manufacturer].filter(Boolean).join(' | ')}</p>
              <div className="mt-6 flex items-baseline gap-2">
                <span className="text-4xl font-bold text-primary-text">${medicine.price}</span>
                <span className="text-secondary-text/80 text-sm">per pack</span>
              </div>
            </div>

            <div className="pharmacy-panel p-6 space-y-6">
              <div className="flex items-center justify-between gap-6 flex-wrap">
                <div className="space-y-1">
                  <p className="text-sm font-bold text-secondary-text/80 uppercase tracking-wider">Quantity</p>
                  <div className="flex items-center gap-4 bg-[#eff6f9] p-1 rounded-xl w-fit">
                    <button
                      onClick={() => setQuantity(Math.max(1, quantity - 1))}
                      className="w-10 h-10 flex items-center justify-center bg-white rounded-lg text-secondary-text hover:text-accent-primary shadow-sm transition-colors"
                    >
                      <Minus className="w-4 h-4" />
                    </button>
                    <span className="w-8 text-center font-bold text-primary-text">{quantity}</span>
                    <button
                      onClick={() => setQuantity(quantity + 1)}
                      className="w-10 h-10 flex items-center justify-center bg-white rounded-lg text-secondary-text hover:text-accent-primary shadow-sm transition-colors"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-bold text-secondary-text/80 uppercase tracking-wider">Subtotal</p>
                  <p className="text-2xl font-bold text-accent-primary">${subtotal.toFixed(2)}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <button
                  onClick={() => {
                    addCurrentMedicineToCart();
                    navigate('/student/pharmacy/checkout');
                  }}
                  disabled={medicine.stock === 0}
                  className="py-4 pharmacy-secondary disabled:bg-[#e6f0f4] disabled:text-secondary-text disabled:shadow-none"
                >
                  Buy Now
                </button>
                <button
                  onClick={() => addCurrentMedicineToCart()}
                  disabled={medicine.stock === 0}
                  className="py-4 pharmacy-primary flex items-center justify-center gap-2 disabled:bg-[#e6f0f4] disabled:text-secondary-text disabled:shadow-none"
                >
                  <ShoppingCart className="w-5 h-5" /> Add to Cart
                </button>
              </div>

              {medicine.requiresPrescription && (
                <div className="p-4 bg-amber-50 rounded-xl border border-amber-100 flex gap-3">
                  <Info className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                  <div>
                      <p className="text-sm font-bold text-amber-900">Prescription Required</p>
                      <p className="text-xs text-amber-700/80 leading-relaxed">
                       This medicine requires an approved prescription before checkout. You can
                        <Link to="/student/pharmacy/upload-prescription" className="underline font-bold ml-1">upload now</Link>.
                      </p>
                    </div>
                  </div>
              )}
            </div>

            <div className="space-y-4">
              <div className="flex border-b border-slate-200 overflow-x-auto">
                {['usage', 'sideEffects', 'storage'].map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={cn(
                      'px-6 py-4 text-sm font-bold uppercase tracking-wider transition-all relative whitespace-nowrap',
                      activeTab === tab ? 'text-accent-primary' : 'text-secondary-text/80 hover:text-secondary-text'
                    )}
                  >
                    {tab.replace(/([A-Z])/g, ' $1')}
                    {activeTab === tab && <motion.div layoutId="activeTab" className="absolute bottom-0 left-0 right-0 h-0.5 bg-accent-primary" />}
                  </button>
                ))}
              </div>
              <div className="pharmacy-panel p-6 min-h-[200px]">
                <AnimatePresence mode="wait">
                  <motion.div key={activeTab} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-4">
                    {activeTab === 'usage' && (
                      <div className="space-y-4">
                        <div className="flex gap-3">
                          <div className="w-8 h-8 bg-[#e8f7f5] rounded-lg flex items-center justify-center text-accent-primary shrink-0">
                            <Info className="w-4 h-4" />
                          </div>
                          <div>
                            <p className="font-bold text-primary-text mb-1">Description</p>
                            <p className="text-secondary-text leading-relaxed">{medicine.description || 'No description available.'}</p>
                          </div>
                        </div>
                        <div className="flex gap-3">
                          <div className="w-8 h-8 bg-[#e8f7f5] rounded-lg flex items-center justify-center text-accent-primary shrink-0">
                            <Clock className="w-4 h-4" />
                          </div>
                          <div>
                            <p className="font-bold text-primary-text mb-1">How to use</p>
                            <p className="text-secondary-text leading-relaxed">{medicine.usage || 'Usage instructions are not available.'}</p>
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
                          <p className="font-bold text-primary-text mb-1">Common Side Effects</p>
                          <p className="text-secondary-text leading-relaxed">{medicine.sideEffects || 'No side-effect information provided.'}</p>
                        </div>
                      </div>
                    )}
                    {activeTab === 'storage' && (
                      <div className="flex gap-3">
                        <div className="w-8 h-8 bg-[#e8f4f8] rounded-lg flex items-center justify-center text-blue-600 shrink-0">
                          <Thermometer className="w-4 h-4" />
                        </div>
                        <div>
                          <p className="font-bold text-primary-text mb-1">Storage Instructions</p>
                          <p className="text-secondary-text leading-relaxed">{medicine.storage || 'No storage instructions provided.'}</p>
                        </div>
                      </div>
                    )}
                  </motion.div>
                </AnimatePresence>
              </div>
            </div>
          </motion.div>
        </div>

        {relatedMedicines.length > 0 && (
          <section className="mt-20">
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-2xl font-bold text-primary-text">Similar Medicines</h2>
              <Link to="/student/pharmacy/products" className="text-accent-primary font-bold flex items-center hover:underline">
                View All <ArrowRight className="ml-2 w-4 h-4" />
              </Link>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              {relatedMedicines.map((related) => (
                <motion.div key={related._id} whileHover={{ y: -4 }} className="pharmacy-card overflow-hidden group">
                  <Link to={`/student/pharmacy/medicine/${related._id}`} className="aspect-[4/3] bg-[#e6f0f4] relative overflow-hidden block">
                    {related.image || related.imageUrl ? (
                      <img
                        src={getProductImage(related)}
                        alt={related.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        referrerPolicy="no-referrer"
                        onError={(event) => {
                          const fallbackImage = getProductFallbackImage(related);
                          if (fallbackImage && event.currentTarget.src !== fallbackImage) {
                            event.currentTarget.src = fallbackImage;
                            return;
                          }
                          event.currentTarget.onerror = null;
                          event.currentTarget.src = getProductPlaceholderImage(related);
                        }}
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-slate-300">
                        <AlertCircle className="w-10 h-10" />
                      </div>
                    )}
                  </Link>
                  <div className="p-4">
                    <h3 className="font-bold text-primary-text">{related.name}</h3>
                    <p className="text-xs text-secondary-text mb-3">{related.strength}</p>
                    <div className="flex items-center justify-between gap-3">
                      <span className="font-bold text-accent-primary">${related.price}</span>
                      <Link to={`/student/pharmacy/medicine/${related._id}`} className="p-2 bg-[#e8f7f5] text-accent-primary rounded-lg hover:bg-emerald-100 transition-colors">
                        <Plus className="w-4 h-4" />
                      </Link>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </section>
        )}

        {error && <p className="mt-6 text-sm text-rose-600">{error}</p>}
      </div>
    </div>
  );
};

export default MedicineDetail;
