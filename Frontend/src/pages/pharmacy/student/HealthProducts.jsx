import React, { useEffect, useState, useMemo } from 'react';
import { 
  Search, 
  ShoppingCart, 
  Heart, 
  ChevronRight, 
  Filter, 
  Star, 
  Info,
  ChevronLeft,
  ArrowRight,
  Plus
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Link } from 'react-router-dom';
import { cn } from '../../../lib/utils';
import { apiFetch } from '../../../lib/api';

const HealthProducts = () => {
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [cartCount, setCartCount] = useState(() => {
    try {
      const parsed = JSON.parse(localStorage.getItem('pharmacy_cart') || '[]');
      return Array.isArray(parsed)
        ? parsed.reduce((sum, item) => sum + (Number(item.quantity) || 1), 0)
        : 0;
    } catch {
      return 0;
    }
  });
  const [products, setProducts] = useState([]);
  const [error, setError] = useState('');

  const categories = ['All', 'Vitamins', 'First Aid', 'Personal Care', 'Hygiene', 'Wellness'];

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const data = await apiFetch('/medicines?limit=200');
        if (!active) return;
        setProducts(Array.isArray(data?.medicines) ? data.medicines : []);
      } catch (err) {
        if (active) setError(err.message || 'Failed to load products');
      }
    })();
    return () => {
      active = false;
    };
  }, []);

  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      const matchesCategory = selectedCategory === 'All' || p.category === selectedCategory;
      const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                           p.manufacturer.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesCategory && matchesSearch;
    });
  }, [products, selectedCategory, searchQuery]);

  const addToCart = (product) => {
    const key = 'pharmacy_cart';
    let current = [];
    try {
      const parsed = JSON.parse(localStorage.getItem(key) || '[]');
      if (Array.isArray(parsed)) current = parsed;
    } catch {
      current = [];
    }
    const existing = current.find((c) => (c._id || c.id) === product._id);
    const next = existing
      ? current.map((c) =>
          (c._id || c.id) === product._id ? { ...c, quantity: (c.quantity || 1) + 1 } : c
        )
      : [...current, { ...product, quantity: 1 }];
    localStorage.setItem(key, JSON.stringify(next));
    setCartCount(next.reduce((sum, item) => sum + (Number(item.quantity) || 1), 0));
  };

  return (
    <div className="min-h-screen bg-slate-50 pt-28 pb-20 px-6">
      <div className="max-w-7xl mx-auto">
        <header className="mb-12 flex flex-col lg:flex-row justify-between items-start lg:items-center gap-8">
          <div>
            <h1 className="text-5xl font-bold text-slate-900 tracking-tight mb-3">Health Products</h1>
            <p className="text-lg text-slate-500 max-w-xl leading-relaxed">Explore our curated selection of vitamins, wellness essentials, and personal care products.</p>
          </div>
          
          <div className="flex items-center gap-4 w-full lg:w-auto">
            <div className="relative flex-1 lg:w-96">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
              <input 
                type="text"
                placeholder="Search products..."
                className="w-full pl-12 pr-4 py-4 bg-white border border-slate-200 rounded-2xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 shadow-sm transition-all"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            
            <Link 
              to="/student/pharmacy/checkout" 
              className="relative p-4 bg-white border border-slate-200 rounded-2xl hover:bg-slate-50 transition-all shadow-sm text-slate-600 group"
            >
              <ShoppingCart className="w-6 h-6 group-hover:scale-110 transition-transform" />
              <span className="absolute -top-2 -right-2 w-6 h-6 bg-emerald-600 text-white text-[10px] font-bold rounded-full flex items-center justify-center border-2 border-white shadow-lg">
                {cartCount}
              </span>
            </Link>
          </div>
        </header>

        {/* Category Chips */}
        <div className="flex overflow-x-auto pb-6 gap-3 no-scrollbar mb-8">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={cn(
                "px-8 py-3 rounded-2xl text-sm font-bold whitespace-nowrap transition-all border-2",
                selectedCategory === cat 
                  ? "bg-emerald-600 text-white border-emerald-600 shadow-lg shadow-emerald-100" 
                  : "bg-white text-slate-600 border-white hover:border-emerald-200 shadow-sm"
              )}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Product Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
          <AnimatePresence mode="popLayout">
            {filteredProducts.map((product) => (
              <motion.div 
                layout
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                key={product._id}
                className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-sm hover:shadow-xl transition-all group flex flex-col"
              >
                <div className="aspect-square bg-slate-50 relative overflow-hidden">
                  <img 
                    src={product.image} 
                    alt={product.name} 
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                    referrerPolicy="no-referrer"
                  />
                  <div className="absolute top-4 right-4 flex flex-col gap-2">
                    <button className="p-3 bg-white/90 backdrop-blur-sm rounded-full text-slate-400 hover:text-rose-500 transition-colors shadow-sm">
                      <Heart className="w-5 h-5" />
                    </button>
                  </div>
                  <div className="absolute bottom-4 left-4 px-3 py-1.5 bg-white/90 backdrop-blur-sm text-slate-900 text-[10px] font-bold rounded-full flex items-center shadow-sm">
                    <Star className="w-3 h-3 text-amber-500 mr-1 fill-amber-500" /> 4.7 (Live)
                  </div>
                </div>
                
                <div className="p-8 flex-1 flex flex-col">
                  <div className="mb-6">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[10px] font-bold text-emerald-600 uppercase tracking-widest">{product.category}</span>
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{product.manufacturer}</span>
                    </div>
                    <h3 className="text-xl font-bold text-slate-900 mb-2 group-hover:text-emerald-600 transition-colors">{product.name}</h3>
                    <p className="text-sm text-slate-500 leading-relaxed line-clamp-2">{product.description}</p>
                  </div>

                  <div className="mt-auto flex items-center justify-between">
                    <div className="flex flex-col">
                      <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Price</span>
                      <span className="text-2xl font-bold text-slate-900">${product.price}</span>
                    </div>
                    <button onClick={() => addToCart(product)} className="w-14 h-14 bg-emerald-600 text-white rounded-2xl flex items-center justify-center hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-100">
                      <Plus className="w-6 h-6" />
                    </button>
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>

        {filteredProducts.length === 0 && (
          <div className="text-center py-20 bg-white rounded-3xl border border-slate-200 border-dashed">
            <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-6">
              <Search className="w-10 h-10 text-slate-200" />
            </div>
            <h2 className="text-2xl font-bold text-slate-900 mb-2">No products found</h2>
            <p className="text-slate-500">Try adjusting your search or category to find what you're looking for.</p>
            <button 
              onClick={() => {
                setSelectedCategory('All');
                setSearchQuery('');
              }}
              className="mt-6 text-emerald-600 font-bold hover:underline"
            >
              Clear all filters
            </button>
          </div>
        )}
        {error && <p className="mt-4 text-sm text-rose-600">{error}</p>}

        {/* Promo Banner */}
        <section className="mt-20 bg-slate-900 rounded-[40px] p-12 md:p-20 text-white relative overflow-hidden">
          <div className="relative z-10 max-w-2xl">
            <span className="px-4 py-1 bg-emerald-600 text-white text-xs font-bold rounded-full uppercase tracking-widest mb-6 inline-block">
              Student Special
            </span>
            <h2 className="text-4xl md:text-5xl font-bold mb-6 leading-tight">Bundle & Save on Wellness Essentials</h2>
            <p className="text-slate-400 mb-10 text-lg leading-relaxed">
              Create your own custom wellness bundle and get up to 25% off. 
              Perfect for exam season or staying healthy during the winter months.
            </p>
            <button className="px-10 py-5 bg-white text-slate-900 rounded-2xl font-bold hover:bg-emerald-50 transition-all flex items-center gap-3">
              Build Your Bundle <ArrowRight className="w-5 h-5" />
            </button>
          </div>
          <div className="absolute right-0 bottom-0 top-0 w-1/2 bg-gradient-to-l from-emerald-500/10 to-transparent hidden lg:block" />
          <div className="absolute -right-20 -bottom-20 w-96 h-96 bg-emerald-600/10 rounded-full blur-3xl" />
        </section>
      </div>
    </div>
  );
};

export default HealthProducts;
