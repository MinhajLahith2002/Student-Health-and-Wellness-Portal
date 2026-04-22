import React, { useEffect, useMemo, useState } from 'react';
import {
  Search,
  ShoppingCart,
  ChevronRight,
  Star,
  Plus,
  Loader2,
  AlertCircle,
  CheckCircle2
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Link, useSearchParams } from 'react-router-dom';
import { cn } from '../../../lib/utils';
import { apiFetch } from '../../../lib/api';
import { addItemToCart, getCartCount, getProductFallbackImage, getProductImage, getProductPlaceholderImage } from '../../../lib/pharmacyCart';

const ProductCatalog = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialQuery = searchParams.get('q') || '';
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [searchQuery, setSearchQuery] = useState(initialQuery);
  const [cartCount, setCartCount] = useState(() => getCartCount());
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;

    const loadProducts = async () => {
      setLoading(true);
      setError('');
      try {
        const data = await apiFetch('/medicines?limit=200');
        if (!active) return;
        setProducts(Array.isArray(data?.medicines) ? data.medicines : []);
      } catch (err) {
        if (active) setError(err.message || 'Failed to load products');
      } finally {
        if (active) setLoading(false);
      }
    };

    loadProducts();
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    const queryFromUrl = searchParams.get('q') || '';
    setSearchQuery(queryFromUrl);
  }, [searchParams]);

  const categories = useMemo(() => {
    const uniqueCategories = Array.from(new Set(products.map((product) => product.category).filter(Boolean))).sort();
    return ['All', ...uniqueCategories];
  }, [products]);

  const filteredProducts = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    return products.filter((product) => {
      const matchesCategory = selectedCategory === 'All' || product.category === selectedCategory;
      const matchesSearch =
        !query ||
        [product.name, product.manufacturer, product.category, product.description, product.strength]
          .filter(Boolean)
          .some((value) => value.toLowerCase().includes(query));

      return matchesCategory && matchesSearch;
    });
  }, [products, selectedCategory, searchQuery]);

  const handleSearchChange = (value) => {
    setSearchQuery(value);

    if (value.trim()) {
      setSearchParams({ q: value });
      return;
    }

    setSearchParams({});
  };

  const handleAddToCart = (product) => {
    const nextItems = addItemToCart(product, 1);
    setCartCount(nextItems.reduce((sum, item) => sum + (Number(item.quantity) || 1), 0));
  };

  return (
    <div className="pharmacy-shell pt-28 pb-20 px-6">
      <div className="max-w-7xl mx-auto space-y-10">
        <header className="pharmacy-hero">
          <div className="relative z-10 flex flex-col lg:flex-row justify-between items-start lg:items-center gap-8">
            <div>
              <div className="pharmacy-pill bg-[#e8f7f5] text-accent-primary mb-4">Student Product Catalog</div>
              <h1 className="text-5xl font-bold text-primary-text tracking-tight mb-3">Pharmacy Catalog</h1>
              <p className="text-lg text-secondary-text max-w-2xl leading-relaxed">
                Explore medicines and wellness essentials in one modern storefront, then open any item to review full details before adding it to your cart.
              </p>
            </div>

            <div className="flex items-center gap-4 w-full lg:w-auto">
              <div className="relative flex-1 lg:w-[28rem]">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-secondary-text/75" />
                <input
                  type="text"
                  placeholder="Search medicines, categories, or brands..."
                  className="pharmacy-search"
                  value={searchQuery}
                  onChange={(e) => handleSearchChange(e.target.value)}
                />
              </div>

              <Link to="/student/pharmacy/checkout" className="relative pharmacy-secondary px-4 py-4">
                <ShoppingCart className="w-6 h-6" />
                <span className="absolute -top-2 -right-2 min-w-6 h-6 px-1 bg-accent-primary text-white text-[10px] font-bold rounded-full flex items-center justify-center border-2 border-white shadow-lg">
                  {cartCount}
                </span>
              </Link>
            </div>
          </div>
        </header>

        <div className="flex overflow-x-auto pb-2 gap-3 no-scrollbar">
          {categories.map((category) => (
            <button
              key={category}
              onClick={() => setSelectedCategory(category)}
              className={cn(
                'px-6 py-3 rounded-full text-sm font-bold whitespace-nowrap transition-all border',
                selectedCategory === category
                  ? 'bg-accent-primary text-white border-accent-primary shadow-[0_12px_30px_rgba(20,116,139,0.22)]'
                  : 'bg-white/88 text-secondary-text border-white/80 hover:border-[#bfe0e7] shadow-[0_10px_24px_rgba(10,40,60,0.06)]'
              )}
            >
              {category}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="py-24 text-center">
            <Loader2 className="w-8 h-8 text-accent-primary animate-spin mx-auto mb-4" />
            <p className="text-secondary-text font-medium">Loading catalog...</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
            <AnimatePresence mode="popLayout">
              {filteredProducts.map((product) => (
                <motion.article
                  layout
                  initial={{ opacity: 0, scale: 0.96 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.96 }}
                  key={product._id}
                  className="pharmacy-card overflow-hidden group flex flex-col"
                >
                  <Link to={`/student/pharmacy/medicine/${product._id}`} className="aspect-[1/0.92] bg-[linear-gradient(180deg,#f9fcfd_0%,#edf6f8_100%)] relative overflow-hidden block">
                    {product.image || product.imageUrl ? (
                      <img
                        src={getProductImage(product)}
                        alt={product.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                        referrerPolicy="no-referrer"
                        onError={(event) => {
                          const fallbackImage = getProductFallbackImage(product);
                          if (fallbackImage && event.currentTarget.src !== fallbackImage) {
                            event.currentTarget.src = fallbackImage;
                            return;
                          }
                          event.currentTarget.onerror = null;
                          event.currentTarget.src = getProductPlaceholderImage(product);
                        }}
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-slate-300">
                        <AlertCircle className="w-12 h-12" />
                      </div>
                    )}
                    {product.requiresPrescription && (
                      <div className="absolute bottom-4 left-4 px-3 py-1.5 bg-amber-100/90 backdrop-blur-sm text-amber-700 text-[10px] font-bold rounded-full flex items-center shadow-sm">
                        <CheckCircle2 className="w-3 h-3 mr-1" /> Rx Required
                      </div>
                    )}
                  </Link>

                  <div className="p-8 flex-1 flex flex-col">
                    <div className="mb-6">
                      <div className="flex items-center justify-between gap-3 mb-2">
                        <span className="text-[10px] font-bold text-accent-primary uppercase tracking-widest">{product.category}</span>
                        <span className="text-[10px] font-bold text-secondary-text uppercase tracking-widest">{product.manufacturer}</span>
                      </div>
                      <Link to={`/student/pharmacy/medicine/${product._id}`} className="block">
                        <h3 className="text-xl font-bold text-primary-text mb-2 group-hover:text-accent-primary transition-colors">{product.name}</h3>
                      </Link>
                      <p className="text-sm text-secondary-text mb-3">{[product.strength, product.manufacturer].filter(Boolean).join(' | ')}</p>
                      <p className="text-sm text-secondary-text leading-relaxed line-clamp-2">{product.description}</p>
                    </div>

                    <div className="mt-auto space-y-4">
                      <div className="flex items-center justify-between">
                        <div className="flex flex-col">
                          <span className="text-xs font-bold text-secondary-text uppercase tracking-wider">Price</span>
                          <span className="text-2xl font-bold text-primary-text">${product.price}</span>
                        </div>
                        <div className="flex items-center gap-2 px-3 py-2 bg-[#eef7fa] rounded-full">
                          <Star className="w-4 h-4 text-amber-500 fill-amber-500" />
                          <span className="text-sm font-semibold text-primary-text">Stock: {product.stock}</span>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <Link to={`/student/pharmacy/medicine/${product._id}`} className="pharmacy-secondary py-3 px-4">
                          View Details <ChevronRight className="w-4 h-4" />
                        </Link>
                        <button
                          type="button"
                          disabled={product.stock === 0}
                          onClick={() => handleAddToCart(product)}
                          className={cn(
                            'py-3 px-4 rounded-2xl font-bold flex items-center justify-center gap-2 transition-all',
                            product.stock > 0
                              ? 'bg-accent-primary text-white hover:bg-[#105f72] shadow-[0_14px_30px_rgba(20,116,139,0.22)]'
                              : 'bg-[#e6f0f4] text-secondary-text cursor-not-allowed'
                          )}
                        >
                          <Plus className="w-4 h-4" /> Add
                        </button>
                      </div>
                    </div>
                  </div>
                </motion.article>
              ))}
            </AnimatePresence>
          </div>
        )}

        {!loading && filteredProducts.length === 0 && (
          <div className="text-center py-20 pharmacy-panel border-dashed border-[#cfe0e6]">
            <div className="w-20 h-20 bg-[#eff7fa] rounded-full flex items-center justify-center mx-auto mb-6">
              <Search className="w-10 h-10 text-slate-300" />
            </div>
            <h2 className="text-2xl font-bold text-primary-text mb-2">No products found</h2>
            <p className="text-secondary-text">Try adjusting your search or category to find what you're looking for.</p>
            <button
              onClick={() => {
                setSelectedCategory('All');
                handleSearchChange('');
              }}
              className="mt-6 text-accent-primary font-bold hover:underline"
            >
              Clear all filters
            </button>
          </div>
        )}

        {error && <p className="mt-4 text-sm text-rose-600">{error}</p>}
      </div>
    </div>
  );
};

export default ProductCatalog;
