import React, { useState, useMemo } from 'react';
import { Search, Filter, SlidersHorizontal, ShoppingCart, Heart, CheckCircle2, ChevronRight, X, AlertCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Link, useSearchParams } from 'react-router-dom';
import { MOCK_MEDICINES } from '../../../constants/mockPharmacyData';
import { cn } from '../../../lib/utils';

const MedicineSearch = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const query = searchParams.get('q') || '';
  const [searchQuery, setSearchQuery] = useState(query);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [priceRange, setPriceRange] = useState([0, 100]);
  const [showPrescriptionOnly, setShowPrescriptionOnly] = useState(false);

  const categories = ['All', 'Pain Relief', 'Antibiotics', 'Allergy', 'Cold & Flu', 'Vitamins'];

  const filteredMedicines = useMemo(() => {
    return MOCK_MEDICINES.filter(med => {
      const matchesSearch = med.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                           med.category.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCategory = selectedCategory === 'All' || med.category === selectedCategory;
      const matchesPrescription = !showPrescriptionOnly || med.requiresPrescription;
      const matchesPrice = med.price >= priceRange[0] && med.price <= priceRange[1];
      
      return matchesSearch && matchesCategory && matchesPrescription && matchesPrice;
    });
  }, [searchQuery, selectedCategory, showPrescriptionOnly, priceRange]);

  const handleSearch = (e) => {
    e.preventDefault();
    setSearchParams({ q: searchQuery });
  };

  return (
    <div className="min-h-screen bg-slate-50 pb-20">
      {/* Search Header */}
      <div className="bg-white border-b border-slate-200 sticky top-0 z-30 px-6 py-6">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row gap-4 items-center">
          <form onSubmit={handleSearch} className="flex-1 relative w-full">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
            <input 
              type="text"
              placeholder="Search medicines..."
              className="w-full pl-12 pr-4 py-3 bg-slate-100 border-none rounded-xl focus:ring-2 focus:ring-emerald-500 focus:bg-white transition-all"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </form>
          <div className="flex gap-2 w-full md:w-auto">
            <button 
              onClick={() => setIsFilterOpen(true)}
              className="flex-1 md:flex-none flex items-center justify-center gap-2 px-6 py-3 bg-slate-900 text-white rounded-xl font-medium hover:bg-slate-800 transition-colors"
            >
              <Filter className="w-4 h-4" /> Filters
            </button>
            <div className="relative">
              <Link to="/student/pharmacy/checkout" className="flex items-center justify-center w-12 h-12 bg-emerald-50 text-emerald-600 rounded-xl hover:bg-emerald-100 transition-colors">
                <ShoppingCart className="w-5 h-5" />
                <span className="absolute -top-1 -right-1 w-5 h-5 bg-emerald-600 text-white text-[10px] font-bold rounded-full flex items-center justify-center border-2 border-white">
                  2
                </span>
              </Link>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Category Chips */}
        <div className="flex overflow-x-auto pb-4 gap-2 no-scrollbar mb-8">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={cn(
                "px-6 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all",
                selectedCategory === cat 
                  ? "bg-emerald-600 text-white shadow-md shadow-emerald-200" 
                  : "bg-white text-slate-600 border border-slate-200 hover:border-emerald-300"
              )}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Results Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <AnimatePresence mode="popLayout">
            {filteredMedicines.map((med) => (
              <motion.div 
                layout
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                key={med.id}
                className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm flex flex-col group"
              >
                <Link to={`/student/pharmacy/medicine/${med.id}`} className="aspect-[4/3] bg-slate-100 relative overflow-hidden block">
                  <img 
                    src={med.image} 
                    alt={med.name} 
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    referrerPolicy="no-referrer"
                  />
                  <div className="absolute top-3 right-3 flex flex-col gap-2">
                    <button className="p-2 bg-white/90 backdrop-blur-sm rounded-full text-slate-400 hover:text-rose-500 transition-colors shadow-sm">
                      <Heart className="w-4 h-4" />
                    </button>
                  </div>
                  {med.requiresPrescription && (
                    <div className="absolute bottom-3 left-3 px-2 py-1 bg-amber-100/90 backdrop-blur-sm text-amber-700 text-[10px] font-bold rounded-md flex items-center">
                      <CheckCircle2 className="w-3 h-3 mr-1" /> Rx Required
                    </div>
                  )}
                </Link>
                <div className="p-5 flex-1 flex flex-col">
                  <div className="mb-4">
                    <h3 className="font-bold text-slate-900 text-lg group-hover:text-emerald-600 transition-colors">{med.name}</h3>
                    <p className="text-xs text-slate-500">{med.strength} • {med.manufacturer}</p>
                  </div>
                  
                  <div className="mt-auto">
                    <div className="flex items-center justify-between mb-4">
                      <span className="text-xl font-bold text-slate-900">${med.price}</span>
                      <div className="flex items-center gap-1">
                        <div className={cn(
                          "w-2 h-2 rounded-full",
                          med.stock > 20 ? "bg-emerald-500" : med.stock > 0 ? "bg-amber-500" : "bg-rose-500"
                        )} />
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                          {med.stock > 20 ? "In Stock" : med.stock > 0 ? `Only ${med.stock} left` : "Out of Stock"}
                        </span>
                      </div>
                    </div>
                    
                    <button 
                      disabled={med.stock === 0}
                      className={cn(
                        "w-full py-3 rounded-xl font-bold flex items-center justify-center gap-2 transition-all",
                        med.stock > 0 
                          ? "bg-emerald-600 text-white hover:bg-emerald-700 shadow-lg shadow-emerald-100" 
                          : "bg-slate-100 text-slate-400 cursor-not-allowed"
                      )}
                    >
                      <ShoppingCart className="w-4 h-4" /> Add to Cart
                    </button>
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>

        {filteredMedicines.length === 0 && (
          <div className="text-center py-20">
            <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <Search className="w-10 h-10 text-slate-300" />
            </div>
            <h2 className="text-2xl font-bold text-slate-900 mb-2">No medicines found</h2>
            <p className="text-slate-500">Try adjusting your search or filters to find what you're looking for.</p>
            <button 
              onClick={() => {
                setSearchQuery('');
                setSelectedCategory('All');
                setShowPrescriptionOnly(false);
                setPriceRange([0, 100]);
              }}
              className="mt-6 text-emerald-600 font-bold hover:underline"
            >
              Clear all filters
            </button>
          </div>
        )}
      </div>

      {/* Filter Sidebar */}
      <AnimatePresence>
        {isFilterOpen && (
          <>
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsFilterOpen(false)}
              className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-40"
            />
            <motion.div 
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed top-0 right-0 bottom-0 w-full max-w-sm bg-white z-50 shadow-2xl p-8 flex flex-col"
            >
              <div className="flex items-center justify-between mb-10">
                <h2 className="text-2xl font-bold text-slate-900">Filters</h2>
                <button 
                  onClick={() => setIsFilterOpen(false)}
                  className="p-2 hover:bg-slate-100 rounded-full transition-colors"
                >
                  <X className="w-6 h-6 text-slate-400" />
                </button>
              </div>

              <div className="space-y-10 flex-1 overflow-y-auto pr-2 no-scrollbar">
                {/* Categories */}
                <div>
                  <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-4">Category</h3>
                  <div className="grid grid-cols-2 gap-2">
                    {categories.map((cat) => (
                      <button
                        key={cat}
                        onClick={() => setSelectedCategory(cat)}
                        className={cn(
                          "px-4 py-2 rounded-lg text-sm font-medium border transition-all",
                          selectedCategory === cat 
                            ? "bg-emerald-50 border-emerald-200 text-emerald-700" 
                            : "bg-white border-slate-200 text-slate-600 hover:border-emerald-200"
                        )}
                      >
                        {cat}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Prescription Toggle */}
                <div>
                  <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-4">Requirements</h3>
                  <label className="flex items-center justify-between p-4 bg-slate-50 rounded-xl cursor-pointer group">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center text-amber-500 shadow-sm">
                        <AlertCircle className="w-5 h-5" />
                      </div>
                      <div>
                        <p className="font-bold text-slate-900">Prescription Only</p>
                        <p className="text-xs text-slate-500">Show only Rx medicines</p>
                      </div>
                    </div>
                    <input 
                      type="checkbox" 
                      className="w-5 h-5 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                      checked={showPrescriptionOnly}
                      onChange={(e) => setShowPrescriptionOnly(e.target.checked)}
                    />
                  </label>
                </div>

                {/* Price Range */}
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider">Price Range</h3>
                    <span className="text-sm font-bold text-emerald-600">${priceRange[0]} - ${priceRange[1]}</span>
                  </div>
                  <input 
                    type="range" 
                    min="0" 
                    max="100" 
                    step="5"
                    value={priceRange[1]}
                    onChange={(e) => setPriceRange([priceRange[0], parseInt(e.target.value)])}
                    className="w-full h-2 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-emerald-600"
                  />
                  <div className="flex justify-between mt-2 text-[10px] font-bold text-slate-400">
                    <span>$0</span>
                    <span>$100+</span>
                  </div>
                </div>
              </div>

              <div className="pt-8 mt-auto border-t border-slate-100 grid grid-cols-2 gap-4">
                <button 
                  onClick={() => {
                    setSelectedCategory('All');
                    setShowPrescriptionOnly(false);
                    setPriceRange([0, 100]);
                  }}
                  className="py-4 rounded-xl font-bold text-slate-500 hover:bg-slate-50 transition-colors"
                >
                  Reset
                </button>
                <button 
                  onClick={() => setIsFilterOpen(false)}
                  className="py-4 bg-emerald-600 text-white rounded-xl font-bold hover:bg-emerald-700 shadow-lg shadow-emerald-100 transition-all"
                >
                  Apply
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
};

export default MedicineSearch;