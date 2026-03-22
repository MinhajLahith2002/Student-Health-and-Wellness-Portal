import React, { useState } from 'react';
import { 
  Package, 
  Search, 
  Filter, 
  ChevronRight, 
  RefreshCcw, 
  Truck, 
  CheckCircle2, 
  XCircle,
  Clock,
  ChevronLeft,
  ArrowRight
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useNavigate, Link } from 'react-router-dom';
import { MOCK_ORDERS, MOCK_MEDICINES } from '../../../constants/mockPharmacyData';
import { cn } from '../../../lib/utils';

const OrderHistory = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');

  const tabs = ['All', 'Ongoing', 'Delivered', 'Cancelled'];

  const filteredOrders = MOCK_ORDERS.filter(order => {
    const matchesTab = 
      activeTab === 'All' || 
      (activeTab === 'Ongoing' && order.status !== "DELIVERED" && order.status !== "CANCELLED") ||
      (activeTab === 'Delivered' && order.status === "DELIVERED") ||
      (activeTab === 'Cancelled' && order.status === "CANCELLED");
    
    const matchesSearch = order.id.toLowerCase().includes(searchQuery.toLowerCase());
    
    return matchesTab && matchesSearch;
  });

  const getStatusColor = (status) => {
    switch (status) {
      case "DELIVERED": return 'bg-emerald-50 text-emerald-700 border-emerald-100';
      case "CANCELLED": return 'bg-rose-50 text-rose-700 border-rose-100';
      case "PENDING": return 'bg-amber-50 text-amber-700 border-amber-100';
      default: return 'bg-blue-50 text-blue-700 border-blue-100';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case "DELIVERED": return CheckCircle2;
      case "CANCELLED": return XCircle;
      case "PENDING": return Clock;
      default: return Truck;
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 pb-20">
      {/* Header */}
      <div className="bg-white border-b border-slate-200 sticky top-0 z-30 px-6 py-4">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => navigate('/student/pharmacy')}
              className="p-2 hover:bg-slate-100 rounded-full transition-colors text-slate-600"
            >
              <ChevronLeft className="w-6 h-6" />
            </button>
            <h1 className="text-xl font-bold text-slate-900">Order History</h1>
          </div>
          <div className="relative hidden md:block">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input 
              type="text"
              placeholder="Search order ID..."
              className="pl-10 pr-4 py-2 bg-slate-100 border-none rounded-xl text-sm focus:ring-2 focus:ring-emerald-500 transition-all w-64"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-6 py-10">
        {/* Tabs */}
        <div className="flex border-b border-slate-200 mb-8 overflow-x-auto no-scrollbar">
          {tabs.map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={cn(
                "px-8 py-4 text-sm font-bold uppercase tracking-wider transition-all relative whitespace-nowrap",
                activeTab === tab ? "text-emerald-600" : "text-slate-400 hover:text-slate-600"
              )}
            >
              {tab}
              {activeTab === tab && (
                <motion.div 
                  layoutId="activeOrderTab"
                  className="absolute bottom-0 left-0 right-0 h-0.5 bg-emerald-600" 
                />
              )}
            </button>
          ))}
        </div>

        {/* Order List */}
        <div className="space-y-6">
          <AnimatePresence mode="popLayout">
            {filteredOrders.map((order) => {
              const StatusIcon = getStatusIcon(order.status);
              return (
                <motion.div 
                  layout
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  key={order.id}
                  className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden hover:shadow-md transition-all group"
                >
                  <div className="p-6 md:p-8 flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div className="flex items-start gap-6">
                      <div className={cn(
                        "w-16 h-16 rounded-2xl flex items-center justify-center shrink-0",
                        getStatusColor(order.status).split(' ')[0]
                      )}>
                        <Package className="w-8 h-8" />
                      </div>
                      <div>
                        <div className="flex items-center gap-3 mb-1">
                          <h3 className="text-lg font-bold text-slate-900">Order {order.id}</h3>
                          <span className={cn(
                            "px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border",
                            getStatusColor(order.status)
                          )}>
                            <StatusIcon className="w-3 h-3 inline mr-1 -mt-0.5" /> {order.status}
                          </span>
                        </div>
                        <p className="text-sm text-slate-500 mb-4">
                          Placed on {new Date(order.date).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
                        </p>
                        <div className="flex -space-x-3 overflow-hidden">
                          {order.items.map((item, idx) => {
                            const med = MOCK_MEDICINES.find(m => m.id === item.medicineId);
                            return (
                              <div key={idx} className="inline-block h-10 w-10 rounded-full ring-4 ring-white bg-slate-100 overflow-hidden">
                                <img src={med?.image} alt={med?.name} className="h-full w-full object-cover" referrerPolicy="no-referrer" />
                              </div>
                            );
                          })}
                          {order.items.length > 3 && (
                            <div className="flex items-center justify-center h-10 w-10 rounded-full ring-4 ring-white bg-slate-200 text-[10px] font-bold text-slate-600">
                              +{order.items.length - 3}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-col items-end gap-4">
                      <div className="text-right">
                        <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Total Amount</p>
                        <p className="text-2xl font-bold text-slate-900">${order.total.toFixed(2)}</p>
                      </div>
                      <div className="flex gap-3 w-full md:w-auto">
                        <button 
                          onClick={() => navigate(`/student/pharmacy/checkout`)}
                          className="flex-1 md:flex-none px-6 py-3 bg-slate-50 text-slate-900 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-slate-100 transition-all border border-slate-100"
                        >
                          <RefreshCcw className="w-4 h-4 text-emerald-600" /> Reorder
                        </button>
                        <Link 
                          to={`/student/pharmacy/order/${order.id}`}
                          className="flex-1 md:flex-none px-6 py-3 bg-emerald-600 text-white rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-100"
                        >
                          Track <ChevronRight className="w-4 h-4" />
                        </Link>
                      </div>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>

          {filteredOrders.length === 0 && (
            <div className="text-center py-20 bg-white rounded-3xl border border-slate-200 border-dashed">
              <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-6">
                <Package className="w-10 h-10 text-slate-200" />
              </div>
              <h2 className="text-2xl font-bold text-slate-900 mb-2">No orders found</h2>
              <p className="text-slate-500">You haven't placed any orders in this category yet.</p>
              <Link 
                to="/student/pharmacy/search"
                className="mt-6 inline-flex items-center text-emerald-600 font-bold hover:underline"
              >
                Start Shopping <ArrowRight className="ml-2 w-4 h-4" />
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default OrderHistory;