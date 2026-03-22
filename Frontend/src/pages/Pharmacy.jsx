import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  Search, 
  Pill, 
  ShoppingCart, 
  Truck, 
  ShieldCheck, 
  ChevronRight,
  Plus,
  Filter,
  Star,
  X,
  Upload,
  CheckCircle2,
  Package,
  Clock,
  MapPin
} from "lucide-react";

export default function PharmacyStore() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [isPrescriptionModalOpen, setIsPrescriptionModalOpen] = useState(false);
  const [isTrackOrderOpen, setIsTrackOrderOpen] = useState(false);
  const [cart, setCart] = useState([]);
  const [isCheckoutSuccess, setIsCheckoutSuccess] = useState(false);

  const categories = ["All", "Prescription", "Pain Relief", "Vitamins", "First Aid", "Skincare"];
  
  const products = [
    { 
      id: 1,
      name: "Paracetamol 500mg", 
      price: "$4.50", 
      category: "Pain Relief", 
      rating: 4.8, 
      image: "https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?auto=format&fit=crop&q=80&w=400",
      description: "Effective relief for mild to moderate pain including headache, migraine, neuralgia, toothache, sore throat, period pain, and relief of fever.",
      dosage: "Adults: 1-2 tablets every 4-6 hours. Do not exceed 8 tablets in 24 hours.",
      sideEffects: ["Nausea", "Allergic reactions", "Skin rash"],
      stock: 50
    },
    { 
      id: 2,
      name: "Vitamin C 1000mg", 
      price: "$12.99", 
      category: "Vitamins", 
      rating: 4.9, 
      image: "https://images.unsplash.com/photo-1616671285410-090636737397?auto=format&fit=crop&q=80&w=400",
      description: "High-strength Vitamin C supplement to support immune system health and collagen formation for the normal function of skin.",
      dosage: "One tablet daily dissolved in a glass of water.",
      sideEffects: ["Stomach cramps", "Diarrhea", "Heartburn"],
      stock: 35
    },
    { 
      id: 3,
      name: "Adhesive Bandages", 
      price: "$3.25", 
      category: "First Aid", 
      rating: 4.7, 
      image: "https://images.unsplash.com/photo-1583947581924-860bda3a44f0?auto=format&fit=crop&q=80&w=400",
      description: "Flexible fabric bandages that move with you. Breathable material and non-stick pad for comfortable healing.",
      dosage: "Apply to clean, dry skin. Change daily or when pad becomes wet.",
      sideEffects: ["Skin irritation from adhesive"],
      stock: 100
    },
    { 
      id: 4,
      name: "Antiseptic Cream", 
      price: "$6.80", 
      category: "First Aid", 
      rating: 4.6, 
      image: "https://images.unsplash.com/photo-1626285861696-9f0bf5a49c6d?auto=format&fit=crop&q=80&w=400",
      description: "Dual-action antiseptic cream that helps prevent infection and supports the natural healing of minor cuts, grazes, and burns.",
      dosage: "Apply a small amount to the affected area 2-3 times daily.",
      sideEffects: ["Burning sensation", "Itching", "Redness"],
      stock: 25
    },
    { 
      id: 5,
      name: "Amoxicillin 500mg", 
      price: "$15.00", 
      category: "Prescription", 
      rating: 4.5, 
      image: "https://images.unsplash.com/photo-1550572017-ed20015a0b63?auto=format&fit=crop&q=80&w=400",
      description: "A penicillin antibiotic used to treat various bacterial infections. Requires a valid prescription.",
      dosage: "As directed by your physician. Usually one capsule every 8 hours.",
      sideEffects: ["Nausea", "Vomiting", "Diarrhea", "Thrush"],
      stock: 15
    },
  ];

  const filteredProducts = useMemo(() => {
    return products.filter(p => {
      const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                           p.category.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCategory = selectedCategory === "All" || p.category === selectedCategory;
      return matchesSearch && matchesCategory;
    });
  }, [searchQuery, selectedCategory]);

  const addToCart = (product) => {
    setCart([...cart, product]);
    // Show success feedback
  };

  const handleCheckout = () => {
    setIsCheckoutSuccess(true);
    setCart([]);
    setTimeout(() => setIsCheckoutSuccess(false), 3000);
  };

  return (
    <div className="pt-28 pb-12 px-6 max-w-7xl mx-auto min-h-screen bg-primary-bg">
      <header className="mb-16">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-8 mb-12">
          <div>
            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-accent-green/10 text-accent-green text-[10px] font-bold uppercase tracking-widest mb-6"
            >
              <ShieldCheck className="w-3 h-3" /> Campus Verified Pharmacy
            </motion.div>
            <h1 className="text-5xl md:text-6xl font-semibold mb-4 tracking-tight text-primary-text text-balance">Campus Pharmacy</h1>
            <p className="text-xl text-secondary-text leading-relaxed text-balance">Trusted medicines, delivered to your dorm.</p>
          </div>
          <div className="flex gap-4">
            <button 
              onClick={() => setIsTrackOrderOpen(true)}
              className="apple-button-secondary flex items-center gap-2 px-6"
            >
              <Truck className="w-5 h-5" /> Track Order
            </button>
            <button 
              onClick={() => setIsPrescriptionModalOpen(true)}
              className="apple-button-primary flex items-center gap-2 px-6 bg-accent-green hover:bg-[#27AE60]"
            >
              <Plus className="w-5 h-5" /> Upload Prescription
            </button>
          </div>
        </div>

        <div className="flex flex-col md:flex-row gap-6 items-center">
          <div className="relative flex-1 w-full">
            <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-secondary-text w-5 h-5" />
            <input 
              type="text" 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search for medicines, vitamins, or health products..." 
              className="apple-input pl-14 py-5 text-xl w-full border-none bg-white/60 backdrop-blur-sm rounded-2xl shadow-sm focus:ring-2 focus:ring-accent-green/20 transition-all"
            />
          </div>
          <div className="relative group">
            <button className="apple-button-secondary flex items-center gap-2 px-6 py-5">
              <ShoppingCart className="w-5 h-5" /> Cart ({cart.length})
            </button>
            {cart.length > 0 && (
              <div className="absolute right-0 top-full mt-2 w-72 bg-white rounded-2xl shadow-2xl border border-border-gray/20 p-4 z-50 hidden group-hover:block">
                <h4 className="font-bold mb-4">Your Cart</h4>
                <div className="space-y-3 mb-4 max-h-60 overflow-y-auto">
                  {cart.map((item, i) => (
                    <div key={i} className="flex justify-between items-center text-sm">
                      <span>{item.name}</span>
                      <span className="font-bold">{item.price}</span>
                    </div>
                  ))}
                </div>
                <div className="border-t pt-3 flex justify-between items-center mb-4">
                  <span className="font-bold">Total</span>
                  <span className="text-lg font-bold text-accent-green">
                    ${cart.reduce((acc, curr) => acc + parseFloat(curr.price.replace('$', '')), 0).toFixed(2)}
                  </span>
                </div>
                <button 
                  onClick={handleCheckout}
                  className="w-full apple-button-primary bg-accent-green py-3"
                >
                  Checkout
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Categories */}
      <div className="flex gap-4 overflow-x-auto pb-6 mb-16 no-scrollbar">
        {categories.map((cat, idx) => (
          <button 
            key={idx}
            onClick={() => setSelectedCategory(cat)}
            className={`px-8 py-2.5 rounded-full font-semibold text-sm whitespace-nowrap transition-all duration-300 ${
              selectedCategory === cat ? 'bg-accent-green text-white shadow-lg shadow-accent-green/20' : 'bg-white text-secondary-text border border-border-gray/30 hover:bg-secondary-bg'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Product Grid */}
      <section>
        <div className="flex justify-between items-center mb-10">
          <h2 className="text-3xl font-semibold text-primary-text tracking-tight">
            {selectedCategory === "All" ? "Popular Products" : `${selectedCategory} Products`}
          </h2>
          <div className="flex items-center gap-2 text-secondary-text text-sm font-medium">
            <Filter className="w-4 h-4" />
            <span>Showing {filteredProducts.length} results</span>
          </div>
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
          {filteredProducts.map((product, idx) => (
            <motion.div 
              key={product.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.05 }}
              whileHover={{ y: -10 }}
              className="apple-card overflow-hidden group border-none bg-white/60 backdrop-blur-sm cursor-pointer"
              onClick={() => setSelectedProduct(product)}
            >
              <div className="h-56 overflow-hidden bg-secondary-bg relative">
                <img 
                  src={product.image} 
                  alt={product.name} 
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                  referrerPolicy="no-referrer"
                />
                <div className="absolute top-4 right-4">
                  <div className="bg-white/90 backdrop-blur-md px-2 py-1 rounded-lg flex items-center gap-1 shadow-sm">
                    <Star className="w-3 h-3 fill-warning text-warning" />
                    <span className="text-[10px] font-bold text-primary-text">{product.rating}</span>
                  </div>
                </div>
              </div>
              <div className="p-8">
                <p className="text-[10px] font-bold text-accent-green uppercase tracking-widest mb-3">{product.category}</p>
                <h3 className="font-semibold text-xl mb-4 text-primary-text tracking-tight">{product.name}</h3>
                <div className="flex items-center justify-between">
                  <span className="text-2xl font-bold text-primary-text">{product.price}</span>
                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      addToCart(product);
                    }}
                    className="w-12 h-12 bg-accent-green text-white rounded-full flex items-center justify-center shadow-lg shadow-accent-green/20 hover:scale-110 transition-transform"
                  >
                    <Plus className="w-6 h-6" />
                  </button>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
        {filteredProducts.length === 0 && (
          <div className="text-center py-20">
            <div className="w-20 h-20 bg-secondary-bg rounded-full flex items-center justify-center mx-auto mb-6">
              <Search className="w-10 h-10 text-secondary-text" />
            </div>
            <h3 className="text-2xl font-semibold text-primary-text mb-2">No products found</h3>
            <p className="text-secondary-text">Try adjusting your search or category filter.</p>
          </div>
        )}
      </section>

      {/* Prescription Banner */}
      <section className="mt-24 apple-card p-16 bg-gradient-to-r from-accent-green to-emerald-700 text-white border-none relative overflow-hidden shadow-2xl shadow-accent-green/20">
        <div className="relative z-10 max-w-2xl">
          <h2 className="text-4xl md:text-5xl font-semibold mb-8 tracking-tight">Need a prescription refill?</h2>
          <p className="text-xl text-white/80 mb-10 leading-relaxed text-balance">
            Upload your prescription from a campus doctor and we'll have it ready for pickup or delivery within 2 hours.
          </p>
          <button 
            onClick={() => setIsPrescriptionModalOpen(true)}
            className="bg-white text-accent-green px-10 py-4 rounded-full font-bold text-lg transition-transform hover:scale-105 active:scale-95 shadow-xl shadow-black/10"
          >
            Upload Now
          </button>
        </div>
        <div className="absolute right-[-5%] top-[-10%] bottom-[-10%] w-1/2 opacity-10 hidden lg:block">
          <Pill className="w-full h-full rotate-12" />
        </div>
      </section>

      {/* Medicine Details Modal */}
      <AnimatePresence>
        {selectedProduct && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedProduct(null)}
              className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative w-full max-w-4xl bg-white rounded-[32px] shadow-2xl overflow-hidden flex flex-col md:flex-row max-h-[90vh]"
            >
              <button 
                onClick={() => setSelectedProduct(null)}
                className="absolute top-6 right-6 z-10 w-10 h-10 bg-white/80 backdrop-blur-md rounded-full flex items-center justify-center shadow-sm hover:bg-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
              
              <div className="w-full md:w-1/2 h-64 md:h-auto bg-secondary-bg">
                <img 
                  src={selectedProduct.image} 
                  alt={selectedProduct.name} 
                  className="w-full h-full object-cover"
                  referrerPolicy="no-referrer"
                />
              </div>
              
              <div className="w-full md:w-1/2 p-10 overflow-y-auto">
                <p className="text-xs font-bold text-accent-green uppercase tracking-widest mb-4">{selectedProduct.category}</p>
                <h2 className="text-4xl font-semibold mb-6 tracking-tight text-primary-text">{selectedProduct.name}</h2>
                <div className="flex items-center gap-6 mb-8">
                  <span className="text-3xl font-bold text-primary-text">{selectedProduct.price}</span>
                  <div className="flex items-center gap-1 px-3 py-1 bg-warning/10 text-warning rounded-lg">
                    <Star className="w-4 h-4 fill-current" />
                    <span className="font-bold text-sm">{selectedProduct.rating}</span>
                  </div>
                  <span className="text-sm text-secondary-text font-medium">{selectedProduct.stock} in stock</span>
                </div>
                
                <div className="space-y-8 mb-10">
                  <div>
                    <h4 className="font-bold text-sm uppercase tracking-widest text-secondary-text mb-3">Description</h4>
                    <p className="text-primary-text/80 leading-relaxed">{selectedProduct.description}</p>
                  </div>
                  <div>
                    <h4 className="font-bold text-sm uppercase tracking-widest text-secondary-text mb-3">Dosage</h4>
                    <p className="text-primary-text/80 leading-relaxed">{selectedProduct.dosage}</p>
                  </div>
                  <div>
                    <h4 className="font-bold text-sm uppercase tracking-widest text-secondary-text mb-3">Side Effects</h4>
                    <ul className="list-disc list-inside text-primary-text/80 space-y-1">
                      {selectedProduct.sideEffects.map((effect, i) => (
                        <li key={i}>{effect}</li>
                      ))}
                    </ul>
                  </div>
                </div>
                
                <button 
                  onClick={() => {
                    addToCart(selectedProduct);
                    setSelectedProduct(null);
                  }}
                  className="w-full apple-button-primary bg-accent-green py-5 text-lg flex items-center justify-center gap-3"
                >
                  <ShoppingCart className="w-6 h-6" /> Add to Cart
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Prescription Upload Modal */}
      <AnimatePresence>
        {isPrescriptionModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsPrescriptionModalOpen(false)}
              className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative w-full max-w-xl bg-white rounded-[32px] shadow-2xl p-10"
            >
              <button 
                onClick={() => setIsPrescriptionModalOpen(false)}
                className="absolute top-6 right-6 w-10 h-10 bg-secondary-bg rounded-full flex items-center justify-center hover:bg-border-gray/20 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
              
              <div className="text-center mb-10">
                <div className="w-20 h-20 bg-accent-green/10 rounded-3xl flex items-center justify-center mx-auto mb-6 text-accent-green">
                  <Upload className="w-10 h-10" />
                </div>
                <h2 className="text-3xl font-semibold mb-3 tracking-tight">Upload Prescription</h2>
                <p className="text-secondary-text">Our pharmacists will verify it within 15 minutes.</p>
              </div>
              
              <div className="border-2 border-dashed border-border-gray/40 rounded-3xl p-12 text-center mb-8 hover:border-accent-green/40 transition-colors cursor-pointer group">
                <input type="file" className="hidden" id="prescription-upload" />
                <label htmlFor="prescription-upload" className="cursor-pointer">
                  <Upload className="w-12 h-12 text-border-gray group-hover:text-accent-green transition-colors mx-auto mb-4" />
                  <p className="font-bold text-primary-text mb-1">Click to upload or drag & drop</p>
                  <p className="text-xs text-secondary-text">PDF, JPG or PNG (Max 10MB)</p>
                </label>
              </div>
              
              <div className="space-y-4 mb-10">
                <div className="flex items-center gap-3 text-sm text-secondary-text">
                  <CheckCircle2 className="w-4 h-4 text-accent-green" />
                  <span>Secure & HIPAA compliant</span>
                </div>
                <div className="flex items-center gap-3 text-sm text-secondary-text">
                  <CheckCircle2 className="w-4 h-4 text-accent-green" />
                  <span>Verified by licensed pharmacists</span>
                </div>
              </div>
              
              <button 
                onClick={() => setIsPrescriptionModalOpen(false)}
                className="w-full apple-button-primary bg-accent-green py-5 text-lg"
              >
                Submit for Verification
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Track Order Modal */}
      <AnimatePresence>
        {isTrackOrderOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsTrackOrderOpen(false)}
              className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative w-full max-w-2xl bg-white rounded-[32px] shadow-2xl p-10"
            >
              <button 
                onClick={() => setIsTrackOrderOpen(false)}
                className="absolute top-6 right-6 w-10 h-10 bg-secondary-bg rounded-full flex items-center justify-center hover:bg-border-gray/20 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
              
              <h2 className="text-3xl font-semibold mb-8 tracking-tight">Track Your Order</h2>
              
              <div className="apple-card p-6 bg-secondary-bg/50 border-none mb-10">
                <div className="flex justify-between items-center mb-6">
                  <div>
                    <p className="text-[10px] font-bold text-secondary-text uppercase tracking-widest mb-1">Order #CH-88291</p>
                    <h3 className="text-xl font-bold">In Transit</h3>
                  </div>
                  <div className="text-right">
                    <p className="text-[10px] font-bold text-secondary-text uppercase tracking-widest mb-1">Estimated Arrival</p>
                    <h3 className="text-xl font-bold text-accent-green">15 - 20 mins</h3>
                  </div>
                </div>
                
                <div className="relative pt-8 pb-4">
                  <div className="absolute top-0 left-0 w-full h-1 bg-border-gray/30 rounded-full">
                    <div className="h-full bg-accent-green w-3/4 rounded-full relative">
                      <div className="absolute right-0 top-1/2 -translate-y-1/2 w-4 h-4 bg-white border-4 border-accent-green rounded-full shadow-lg"></div>
                    </div>
                  </div>
                  <div className="flex justify-between mt-4">
                    <div className="flex flex-col items-center gap-2">
                      <Package className="w-5 h-5 text-accent-green" />
                      <span className="text-[10px] font-bold uppercase">Packed</span>
                    </div>
                    <div className="flex flex-col items-center gap-2">
                      <ShieldCheck className="w-5 h-5 text-accent-green" />
                      <span className="text-[10px] font-bold uppercase">Verified</span>
                    </div>
                    <div className="flex flex-col items-center gap-2">
                      <Truck className="w-5 h-5 text-accent-green" />
                      <span className="text-[10px] font-bold uppercase">On Way</span>
                    </div>
                    <div className="flex flex-col items-center gap-2 opacity-30">
                      <CheckCircle2 className="w-5 h-5" />
                      <span className="text-[10px] font-bold uppercase">Delivered</span>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="space-y-6">
                <div className="flex gap-4">
                  <div className="w-10 h-10 rounded-full bg-accent-green/10 flex items-center justify-center text-accent-green shrink-0">
                    <Clock className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="font-bold text-sm">12:45 PM - Out for delivery</p>
                    <p className="text-xs text-secondary-text">Rider Alex is on his way to North Dormitory</p>
                  </div>
                </div>
                <div className="flex gap-4">
                  <div className="w-10 h-10 rounded-full bg-accent-green/10 flex items-center justify-center text-accent-green shrink-0">
                    <MapPin className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="font-bold text-sm">12:30 PM - Picked up from Campus Pharmacy</p>
                    <p className="text-xs text-secondary-text">Order has been verified and picked up</p>
                  </div>
                </div>
              </div>
              
              <button 
                onClick={() => setIsTrackOrderOpen(false)}
                className="w-full apple-button-primary bg-accent-primary py-5 mt-10"
              >
                Close Tracking
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Checkout Success Toast */}
      <AnimatePresence>
        {isCheckoutSuccess && (
          <motion.div 
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 50 }}
            className="fixed bottom-10 left-1/2 -translate-x-1/2 z-[200] bg-accent-green text-white px-8 py-4 rounded-2xl shadow-2xl flex items-center gap-3"
          >
            <CheckCircle2 className="w-6 h-6" />
            <span className="font-bold">Order placed successfully!</span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}