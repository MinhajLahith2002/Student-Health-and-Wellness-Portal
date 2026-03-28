import React, { useEffect, useState } from 'react';
import { Search, Upload, Package, ShieldAlert, MapPin, ShoppingBag, ArrowRight, Clock, CheckCircle2, ChevronRight } from 'lucide-react';
import { motion } from 'motion/react';
import { Link, useNavigate } from 'react-router-dom';
import { apiFetch } from '../../../lib/api';

const QuickActionCard = ({ icon, title, description, to }) => (
  <Link to={to} className="block">
    <motion.div 
      whileHover={{ scale: 1.02, translateY: -4 }}
      className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-all group"
    >
      <div className="w-12 h-12 bg-emerald-50 rounded-xl flex items-center justify-center mb-4 group-hover:bg-emerald-100 transition-colors">
        {React.createElement(icon, { className: 'w-6 h-6 text-emerald-600' })}
      </div>
      <h3 className="text-lg font-semibold text-slate-900 mb-1">{title}</h3>
      <p className="text-sm text-slate-500 leading-relaxed">{description}</p>
    </motion.div>
  </Link>
);

const PharmacyDashboard = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [ongoingOrders, setOngoingOrders] = useState([]);
  const [popularMedicines, setPopularMedicines] = useState([]);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/student/pharmacy/search?q=${encodeURIComponent(searchQuery)}`);
    }
  };

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const [ordersData, medData] = await Promise.all([
          apiFetch('/orders?limit=10'),
          apiFetch('/medicines?limit=8')
        ]);
        if (!active) return;
        const orders = Array.isArray(ordersData?.orders) ? ordersData.orders : [];
        setOngoingOrders(orders.filter((o) => o.status !== 'Delivered' && o.status !== 'Cancelled'));
        setPopularMedicines(Array.isArray(medData?.medicines) ? medData.medicines.slice(0, 4) : []);
      } catch (err) {
        if (active) setError(err.message || 'Failed to load pharmacy dashboard');
      }
    })();
    return () => {
      active = false;
    };
  }, []);

  return (
    <div className="min-h-screen bg-slate-50 pb-20">
      {/* Top Banner & Search */}
      <div className="bg-white border-b border-slate-200 pt-36 pb-20 px-6">
        <div className="max-w-7xl mx-auto">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-10"
          >
            <h1 className="text-4xl font-bold text-slate-900 mb-4">Campus Pharmacy</h1>
            <p className="text-lg text-slate-600 max-w-2xl mx-auto">
              Your health, simplified. Order medicines, upload prescriptions, and get expert advice right on campus.
            </p>
          </motion.div>

          <form onSubmit={handleSearch} className="max-w-2xl mx-auto relative">
            <div className="relative group">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 group-focus-within:text-emerald-500 transition-colors" />
              <input 
                type="text"
                placeholder="Search for medicines, vitamins, or health products..."
                className="w-full pl-12 pr-4 py-4 bg-slate-100 border-none rounded-2xl focus:ring-2 focus:ring-emerald-500 focus:bg-white transition-all text-lg"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </form>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mt-12 max-w-7xl mx-auto">
            <QuickActionCard 
              icon={Search} 
              title="Search" 
              description="Find medicines" 
              to="/student/pharmacy/search" 
            />
            <QuickActionCard 
              icon={Upload} 
              title="Upload" 
              description="Prescriptions" 
              to="/student/pharmacy/upload-prescription" 
            />
            <QuickActionCard 
              icon={Package} 
              title="Orders" 
              description="Track delivery" 
              to="/student/pharmacy/orders" 
            />
            <QuickActionCard 
              icon={ShieldAlert} 
              title="First-Aid" 
              description="Emergency guide" 
              to="/student/pharmacy/first-aid" 
            />
            <QuickActionCard 
              icon={MapPin} 
              title="Locator" 
              description="Nearby stores" 
              to="/student/pharmacy/locator" 
            />
            <QuickActionCard 
              icon={ShoppingBag} 
              title="Products" 
              description="Health & Wellness" 
              to="/student/pharmacy/products" 
            />
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-12 space-y-16">
        {/* Ongoing Orders */}
        {ongoingOrders.length > 0 && (
          <section>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-slate-900">Ongoing Orders</h2>
              <Link to="/student/pharmacy/orders" className="text-emerald-600 font-medium flex items-center hover:underline">
                View All <ArrowRight className="ml-1 w-4 h-4" />
              </Link>
            </div>
            <div className="flex overflow-x-auto pb-4 gap-6 no-scrollbar">
              {ongoingOrders.map((order) => (
                <motion.div 
                  key={order._id}
                  whileHover={{ y: -4 }}
                  className="min-w-[320px] bg-white p-6 rounded-2xl border border-slate-200 shadow-sm"
                >
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Order {order.orderId || order._id}</span>
                      <h3 className="font-semibold text-slate-900">{(order.items || []).length} Items</h3>
                    </div>
                    <span className="px-3 py-1 bg-emerald-50 text-emerald-700 text-xs font-bold rounded-full">
                      {order.status}
                    </span>
                  </div>
                  <div className="flex items-center text-sm text-slate-500 mb-6">
                    <Clock className="w-4 h-4 mr-2" />
                    Estimated delivery: 30 mins
                  </div>
                  <Link 
                    to={`/student/pharmacy/order/${order._id}`}
                    className="w-full py-3 bg-slate-900 text-white rounded-xl font-medium flex items-center justify-center hover:bg-slate-800 transition-colors"
                  >
                    Track Order
                  </Link>
                </motion.div>
              ))}
            </div>
          </section>
        )}

        {/* Popular Medicines */}
        <section>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-slate-900">Popular Medicines</h2>
            <Link to="/student/pharmacy/search" className="text-emerald-600 font-medium flex items-center hover:underline">
              Browse All <ArrowRight className="ml-1 w-4 h-4" />
            </Link>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {popularMedicines.map((med) => (
              <motion.div 
                key={med._id}
                whileHover={{ y: -4 }}
                className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm group"
              >
                <div className="aspect-[4/3] bg-slate-100 relative overflow-hidden">
                  <img 
                    src={med.image} 
                    alt={med.name} 
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    referrerPolicy="no-referrer"
                  />
                  {med.requiresPrescription && (
                    <div className="absolute top-2 right-2 px-2 py-1 bg-amber-100 text-amber-700 text-[10px] font-bold rounded-md flex items-center">
                      <CheckCircle2 className="w-3 h-3 mr-1" /> Rx Required
                    </div>
                  )}
                </div>
                <div className="p-4">
                  <h3 className="font-bold text-slate-900">{med.name}</h3>
                  <p className="text-xs text-slate-500 mb-3">{med.strength} • {med.manufacturer}</p>
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-emerald-600">${med.price}</span>
                    <Link 
                      to={`/student/pharmacy/medicine/${med._id}`}
                      className="p-2 bg-slate-50 rounded-lg text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 transition-all"
                    >
                      <ChevronRight className="w-5 h-5" />
                    </Link>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </section>
        {error && <p className="text-sm text-rose-600">{error}</p>}

        {/* Health Tips */}
        <section className="bg-emerald-900 rounded-3xl p-8 md:p-12 text-white relative overflow-hidden">
          <div className="relative z-10 max-w-2xl">
            <h2 className="text-3xl font-bold mb-4">Stay Healthy This Semester</h2>
            <p className="text-emerald-100 mb-8 text-lg">
              Get free health consultations and wellness tips from our campus experts. 
              Book a session today or browse our health guides.
            </p>
            <div className="flex flex-wrap gap-4">
              <button className="px-6 py-3 bg-white text-emerald-900 rounded-xl font-bold hover:bg-emerald-50 transition-colors">
                Read Health Guides
              </button>
              <button className="px-6 py-3 bg-emerald-800 text-white rounded-xl font-bold border border-emerald-700 hover:bg-emerald-700 transition-colors">
                Book Consultation
              </button>
            </div>
          </div>
          <div className="absolute right-0 bottom-0 top-0 w-1/3 bg-gradient-to-l from-emerald-800/50 to-transparent hidden md:block" />
        </section>
      </div>
    </div>
  );
};

export default PharmacyDashboard;