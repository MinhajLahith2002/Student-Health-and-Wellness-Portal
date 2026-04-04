import React, { useEffect, useState } from 'react';
import { Search, Upload, Package, ShieldAlert, MapPin, ShoppingBag, ArrowRight, Clock, CheckCircle2, ChevronRight } from 'lucide-react';
import { motion } from 'motion/react';
import { Link, useNavigate } from 'react-router-dom';
import { apiFetch } from '../../../lib/api';

const QuickActionCard = ({ icon, title, description, to }) => (
  <Link to={to} className="block">
    <motion.div
      whileHover={{ scale: 1.02, translateY: -4 }}
      className="pharmacy-card p-6 group"
    >
      <div className="w-14 h-14 rounded-2xl bg-[linear-gradient(135deg,#e9f8f5_0%,#e6f2f7_100%)] flex items-center justify-center mb-5 group-hover:scale-105 transition-all shadow-[0_10px_22px_rgba(20,116,139,0.12)]">
        {React.createElement(icon, { className: 'w-6 h-6 text-accent-primary' })}
      </div>
      <h3 className="text-lg font-semibold text-primary-text mb-1">{title}</h3>
      <p className="text-sm text-secondary-text leading-relaxed">{description}</p>
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
      navigate(`/student/pharmacy/products?q=${encodeURIComponent(searchQuery)}`);
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
    <div className="pharmacy-shell pb-20">
      <div className="pt-28 sm:pt-36 pb-8 px-4 sm:px-6">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="pharmacy-hero mb-10"
          >
            <div className="relative z-10 grid grid-cols-1 lg:grid-cols-[1.1fr,0.9fr] gap-8 items-center">
              <div>
                <div className="pharmacy-pill bg-[#e8f7f5] text-accent-primary mb-5">
                  SLIIT Campus Pharmacy
                </div>
                <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-primary-text mb-4 max-w-2xl">
                  Modern pharmacy care designed for everyday student health.
                </h1>
                <p className="text-base sm:text-lg text-secondary-text max-w-2xl">
                  Search medicine, upload prescriptions, track active orders, and find trusted campus-supported pharmacy access through one modern experience.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="pharmacy-soft-card p-5 bg-[linear-gradient(180deg,#ffffff_0%,#f4fbfd_100%)]">
                  <p className="text-[10px] font-bold uppercase tracking-[0.24em] text-secondary-text mb-2">Average Prep Time</p>
                  <p className="text-3xl font-bold text-primary-text">30 min</p>
                  <p className="text-sm text-secondary-text mt-2">Fast handling for routine campus orders.</p>
                </div>
                <div className="pharmacy-soft-card p-5 bg-[linear-gradient(180deg,#ffffff_0%,#f4fbfd_100%)]">
                  <p className="text-[10px] font-bold uppercase tracking-[0.24em] text-secondary-text mb-2">Prescription Review</p>
                  <p className="text-3xl font-bold text-primary-text">Verified</p>
                  <p className="text-sm text-secondary-text mt-2">Pharmacist-friendly workflow for safer dispensing.</p>
                </div>
                <div className="pharmacy-soft-card p-5 col-span-2 bg-[linear-gradient(135deg,#0d2338_0%,#13506a_58%,#0f9f8c_100%)] text-white shadow-[0_18px_40px_rgba(15,41,66,0.18)]">
                  <p className="text-[10px] font-bold uppercase tracking-[0.24em] text-cyan-100 mb-2">Student Access</p>
                  <p className="text-2xl font-bold text-white">Search, upload, order, track</p>
                  <p className="text-sm text-cyan-100 mt-2">A cleaner, more confident path from product discovery to delivery updates.</p>
                </div>
              </div>
            </div>
          </motion.div>

          <form onSubmit={handleSearch} className="max-w-3xl mx-auto relative">
            <div className="relative group">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-secondary-text/70 group-focus-within:text-accent-primary transition-colors" />
              <input
                type="text"
                placeholder="Search for medicines, vitamins, or health products..."
                className="pharmacy-search text-base sm:text-lg"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </form>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 mt-10 sm:mt-12 max-w-7xl mx-auto">
            <QuickActionCard icon={ShoppingBag} title="Catalog" description="Browse all products" to="/student/pharmacy/products" />
            <QuickActionCard icon={Upload} title="Upload" description="Send prescriptions" to="/student/pharmacy/upload-prescription" />
            <QuickActionCard icon={Package} title="Orders" description="Track deliveries" to="/student/pharmacy/orders" />
            <QuickActionCard icon={ShieldAlert} title="First-Aid" description="Emergency guidance" to="/student/pharmacy/first-aid" />
            <QuickActionCard icon={MapPin} title="Locator" description="Nearest pharmacies" to="/student/pharmacy/locator" />
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-10 sm:py-12 space-y-12 sm:space-y-16">
        {ongoingOrders.length > 0 && (
          <section>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
              <h2 className="text-2xl font-bold text-primary-text">Ongoing Orders</h2>
              <Link to="/student/pharmacy/orders" className="text-accent-primary font-medium flex items-center hover:underline">
                View All <ArrowRight className="ml-1 w-4 h-4" />
              </Link>
            </div>
            <div className="flex overflow-x-auto pb-4 gap-4 sm:gap-6 no-scrollbar">
              {ongoingOrders.map((order) => (
                <motion.div key={order._id} whileHover={{ y: -4 }} className="min-w-[280px] sm:min-w-[320px] pharmacy-card p-5 sm:p-6">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <span className="text-xs font-bold text-secondary-text uppercase tracking-wider">Order {order.orderId || order._id}</span>
                      <h3 className="font-semibold text-primary-text">{(order.items || []).length} Items</h3>
                    </div>
                    <span className="pharmacy-pill bg-[#e8f7f5] text-accent-primary">{order.status}</span>
                  </div>
                  <div className="flex items-center text-sm text-secondary-text mb-6">
                    <Clock className="w-4 h-4 mr-2" />
                    Estimated delivery: 30 mins
                  </div>
                  <Link to={`/student/pharmacy/order/${order._id}`} className="pharmacy-primary w-full">
                    Track Order
                  </Link>
                </motion.div>
              ))}
            </div>
          </section>
        )}

        <section>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
            <h2 className="text-2xl font-bold text-primary-text">Popular Medicines</h2>
            <Link to="/student/pharmacy/products" className="text-accent-primary font-medium flex items-center hover:underline">
              Browse All <ArrowRight className="ml-1 w-4 h-4" />
            </Link>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
            {popularMedicines.map((med) => (
              <motion.div key={med._id} whileHover={{ y: -4 }} className="pharmacy-card rounded-2xl overflow-hidden group">
                <div className="aspect-[4/3] bg-[#edf6f8] relative overflow-hidden">
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
                  <h3 className="font-bold text-primary-text">{med.name}</h3>
                  <p className="text-xs text-secondary-text mb-3">{[med.strength, med.manufacturer].filter(Boolean).join(' | ')}</p>
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-accent-primary">${med.price}</span>
                    <Link
                      to={`/student/pharmacy/medicine/${med._id}`}
                      className="p-2 bg-[#edf6f8] rounded-lg text-secondary-text hover:text-accent-primary hover:bg-[#e8f7f5] transition-all"
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

        <section className="rounded-[2.25rem] p-8 md:p-12 text-white relative overflow-hidden bg-[linear-gradient(135deg,#0d2338_0%,#13506a_58%,#0f9f8c_100%)] shadow-[0_28px_70px_rgba(15,41,66,0.20)]">
          <div className="relative z-10 max-w-2xl">
            <h2 className="text-3xl font-bold mb-4">Stay Healthy This Semester</h2>
            <p className="text-cyan-100 mb-8 text-lg">
              Get free health consultations and wellness tips from our campus experts.
              Book a session today or browse our health guides.
            </p>
            <div className="flex flex-wrap gap-4">
              <button className="px-6 py-3 bg-white text-primary-text rounded-xl font-bold hover:bg-cyan-50 transition-colors">
                Read Health Guides
              </button>
              <button className="px-6 py-3 bg-white/10 text-white rounded-xl font-bold border border-white/20 hover:bg-white/16 transition-colors backdrop-blur-sm">
                Book Consultation
              </button>
            </div>
          </div>
          <div className="absolute right-0 bottom-0 top-0 w-1/3 bg-gradient-to-l from-cyan-300/15 to-transparent hidden md:block" />
        </section>
      </div>
    </div>
  );
};

export default PharmacyDashboard;
