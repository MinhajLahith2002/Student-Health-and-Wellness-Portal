import React, { useEffect, useMemo, useState } from 'react';
import { 
  Package, 
  Truck, 
  CheckCircle2, 
  Clock, 
  Search, 
  Filter, 
  ChevronRight, 
  MoreVertical,
  MapPin,
  Phone,
  MessageSquare,
  ChevronLeft,
  User,
  Loader2
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useNavigate } from 'react-router-dom';
import { cn } from '../../../lib/utils';
import { apiFetch } from '../../../lib/api';

const OrderManagement = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('New');
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [orders, setOrders] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState(false);
  const [error, setError] = useState('');

  const tabs = ['New', 'Processing', 'Dispatched', 'Delivered'];

  useEffect(() => {
    let active = true;

    const loadOrders = async ({ silent = false } = {}) => {
      if (!silent) setLoading(true);
      setError('');
      try {
        const data = await apiFetch('/orders/all?limit=200');
        if (!active) return;
        const nextOrders = Array.isArray(data?.orders) ? data.orders : [];
        setOrders(nextOrders);
        setSelectedOrder((current) => {
          if (current && nextOrders.some((order) => order._id === current)) {
            return current;
          }
          return nextOrders[0]?._id || null;
        });
      } catch (err) {
        if (!active) return;
        setError(err.message || 'Failed to load orders');
      } finally {
        if (active && !silent) setLoading(false);
      }
    };

    loadOrders();

    const intervalId = setInterval(() => {
      loadOrders({ silent: true });
    }, 15000);

    const handleFocus = () => {
      loadOrders({ silent: true });
    };

    window.addEventListener('focus', handleFocus);
    document.addEventListener('visibilitychange', handleFocus);

    return () => {
      active = false;
      clearInterval(intervalId);
      window.removeEventListener('focus', handleFocus);
      document.removeEventListener('visibilitychange', handleFocus);
    };
  }, []);

  const filteredOrders = useMemo(() => {
    return orders.filter((order) => {
      const status = order.status || '';
      const matchesTab =
        (activeTab === 'New' && ['Pending', 'Verified'].includes(status)) ||
        (activeTab === 'Processing' && status === 'Packed') ||
        (activeTab === 'Dispatched' && status === 'Dispatched') ||
        (activeTab === 'Delivered' && status === 'Delivered');

      const query = searchQuery.trim().toLowerCase();
      const matchesSearch =
        !query ||
        (order.orderId || order._id || '').toLowerCase().includes(query) ||
        (order.studentName || '').toLowerCase().includes(query);

      return matchesTab && matchesSearch;
    });
  }, [orders, activeTab, searchQuery]);

  const currentOrder = useMemo(
    () => orders.find((order) => order._id === selectedOrder),
    [orders, selectedOrder]
  );

  const refreshOrders = async (preferredId = selectedOrder) => {
    const data = await apiFetch('/orders/all?limit=200');
    const nextOrders = Array.isArray(data?.orders) ? data.orders : [];
    setOrders(nextOrders);
    if (preferredId && nextOrders.some((order) => order._id === preferredId)) {
      setSelectedOrder(preferredId);
    } else if (nextOrders.length > 0) {
      setSelectedOrder(nextOrders[0]._id);
    } else {
      setSelectedOrder(null);
    }
  };

  const handleStatusUpdate = async (id, nextStatus) => {
    try {
      setIsUpdating(true);
      setError('');
      await apiFetch(`/orders/${id}/status`, {
        method: 'PUT',
        body: JSON.stringify({ status: nextStatus })
      });
      await refreshOrders(id);
    } catch (err) {
      setError(err.message || 'Failed to update order status');
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 pb-20">
      {/* Header */}
      <div className="bg-white border-b border-slate-200 sticky top-0 z-30 px-8 py-6">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => navigate('/pharmacist/dashboard')}
              className="p-2 hover:bg-slate-100 rounded-full transition-colors text-slate-600"
            >
              <ChevronLeft className="w-6 h-6" />
            </button>
            <div>
              <h1 className="text-2xl font-bold text-slate-900">Order Management</h1>
              <p className="text-sm text-slate-500">Track and process medicine orders from students.</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="relative hidden md:block">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input 
                type="text"
                placeholder="Search order ID or student..."
                className="pl-10 pr-4 py-2 bg-slate-100 border-none rounded-xl text-sm focus:ring-2 focus:ring-emerald-500 transition-all w-64"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <div className="px-4 py-3 bg-slate-100 text-slate-600 rounded-xl text-sm font-bold flex items-center gap-2">
              <Filter className="w-5 h-5" />
              {filteredOrders.length} shown
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-8 py-10">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
          {/* Left: Order List */}
          <div className="lg:col-span-1 space-y-6">
            <div className="flex border-b border-slate-200 mb-6 overflow-x-auto no-scrollbar">
              {tabs.map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={cn(
                    "px-6 py-4 text-sm font-bold uppercase tracking-wider transition-all relative whitespace-nowrap",
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

            {loading && (
              <div className="text-center py-20 bg-white rounded-[32px] border border-slate-200 border-dashed">
                <Loader2 className="w-8 h-8 text-emerald-600 animate-spin mx-auto mb-4" />
                <p className="text-slate-500 font-medium">Loading orders...</p>
              </div>
            )}
            <div className="space-y-4">
              <AnimatePresence mode="popLayout">
                {!loading && filteredOrders.map((order) => (
                  <motion.button
                    layout
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    key={order._id}
                    onClick={() => setSelectedOrder(order._id)}
                    className={cn(
                      "w-full p-6 rounded-[32px] border-2 text-left transition-all flex flex-col gap-4 group",
                      selectedOrder === order._id 
                        ? "border-emerald-500 bg-emerald-50/50" 
                        : "border-white bg-white hover:border-emerald-200 shadow-sm"
                    )}
                  >
                    <div className="flex justify-between items-start">
                      <div className="flex items-center gap-4">
                        <div className={cn(
                          "w-12 h-12 rounded-2xl flex items-center justify-center transition-colors",
                          selectedOrder === order._id ? "bg-emerald-600 text-white" : "bg-slate-100 text-slate-400"
                        )}>
                          <Package className="w-6 h-6" />
                        </div>
                        <div>
                          <h3 className={cn("font-bold", selectedOrder === order._id ? "text-emerald-900" : "text-slate-900")}>
                            Order {order.orderId || order._id}
                          </h3>
                          <p className="text-xs text-slate-500">{order.studentName}</p>
                        </div>
                      </div>
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                        {new Date(order.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                    
                    <div className="flex items-center justify-between pt-4 border-t border-slate-200/50">
                      <div className="flex items-center gap-1.5">
                        <Clock className="w-3 h-3 text-slate-400" />
                        <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                          {order.items.length} Items | ${Number(order.total || 0).toFixed(2)}
                        </span>
                      </div>
                      <ChevronRight className={cn(
                        "w-5 h-5 transition-transform",
                        selectedOrder === order._id ? "text-emerald-600 translate-x-1" : "text-slate-300"
                      )} />
                    </div>
                  </motion.button>
                ))}
              </AnimatePresence>

              {!loading && filteredOrders.length === 0 && (
                <div className="text-center py-20 bg-white rounded-[32px] border border-slate-200 border-dashed">
                  <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Package className="w-8 h-8 text-slate-200" />
                  </div>
                  <p className="text-slate-500 font-medium">No {activeTab.toLowerCase()} orders</p>
                </div>
              )}
            </div>
          </div>

          {/* Right: Order Detail */}
          <div className="lg:col-span-2">
            <AnimatePresence mode="wait">
              {currentOrder ? (
                <motion.div
                  key={currentOrder._id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="space-y-8"
                >
                  <div className="bg-white rounded-[40px] border border-slate-200 shadow-sm overflow-hidden">
                    <div className="p-10">
                      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10">
                        <div className="flex items-center gap-6">
                          <div className="w-20 h-20 bg-emerald-50 rounded-3xl flex items-center justify-center text-emerald-600">
                            <Package className="w-10 h-10" />
                          </div>
                          <div>
                            <h2 className="text-3xl font-bold text-slate-900">Order {currentOrder.orderId || currentOrder._id}</h2>
                            <p className="text-slate-500 font-medium">Student: {currentOrder.studentName}</p>
                            <p className="text-xs text-slate-400 font-bold uppercase tracking-widest mt-1">
                              Placed on {new Date(currentOrder.createdAt).toLocaleString()}
                            </p>
                          </div>
                        </div>
                        <div className="flex gap-3">
                          {currentOrder.studentPhone ? (
                            <a
                              href={`tel:${currentOrder.studentPhone}`}
                              className="p-4 bg-slate-100 text-slate-600 rounded-2xl hover:bg-slate-200 transition-all"
                              aria-label="Call student"
                            >
                              <Phone className="w-6 h-6" />
                            </a>
                          ) : (
                            <div className="p-4 bg-slate-100 text-slate-300 rounded-2xl cursor-not-allowed" aria-hidden="true">
                              <Phone className="w-6 h-6" />
                            </div>
                          )}
                          {currentOrder.studentEmail ? (
                            <a
                              href={`mailto:${currentOrder.studentEmail}`}
                              className="p-4 bg-slate-100 text-slate-600 rounded-2xl hover:bg-slate-200 transition-all"
                              aria-label="Email student"
                            >
                              <MessageSquare className="w-6 h-6" />
                            </a>
                          ) : (
                            <div className="p-4 bg-slate-100 text-slate-300 rounded-2xl cursor-not-allowed" aria-hidden="true">
                              <MessageSquare className="w-6 h-6" />
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                        {/* Order Items */}
                        <div className="space-y-6">
                          <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest">Order Items</h3>
                          <div className="space-y-4">
                            {currentOrder.items.map((item, idx) => {
                              return (
                                <div key={idx} className="p-4 bg-slate-50 rounded-2xl border border-slate-100 flex gap-4 group">
                                  <div className="flex-1 min-w-0">
                                    <div className="flex justify-between items-start">
                                      <h4 className="font-bold text-slate-900 truncate">{item.name}</h4>
                                      <p className="font-bold text-slate-900">${(item.price * item.quantity).toFixed(2)}</p>
                                    </div>
                                    <p className="text-xs text-slate-500">{item.quantity} x ${item.price}</p>
                                    {item.requiresPrescription && (
                                      <span className="text-[8px] font-bold text-emerald-600 uppercase tracking-wider bg-emerald-50 px-1.5 py-0.5 rounded mt-1 inline-block">Rx Verified</span>
                                    )}
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                          <div className="p-6 bg-slate-900 rounded-2xl text-white flex justify-between items-center">
                            <span className="font-bold text-slate-400">Total Amount</span>
                            <span className="text-2xl font-bold text-emerald-400">${currentOrder.total.toFixed(2)}</span>
                          </div>
                        </div>

                        {/* Delivery & Actions */}
                        <div className="space-y-8">
                          <div className="space-y-6">
                            <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest">Delivery Details</h3>
                            <div className="p-6 bg-slate-50 rounded-3xl border border-slate-100 space-y-4">
                              <div className="flex items-start gap-4">
                                <MapPin className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                                <div>
                                  <p className="font-bold text-slate-900">Address</p>
                                  <p className="text-sm text-slate-500">{currentOrder.address}</p>
                                </div>
                              </div>
                              <div className="flex items-start gap-4">
                                <User className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                                <div>
                                  <p className="font-bold text-slate-900">Student ID</p>
                                  <p className="text-sm text-slate-500">{currentOrder.studentId?.studentId || currentOrder.studentId?._id || currentOrder.studentId || 'N/A'}</p>
                                </div>
                              </div>
                              <div className="flex items-start gap-4">
                                <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                                <div>
                                  <p className="font-bold text-slate-900">Payment Method</p>
                                  <p className="text-sm text-slate-500">{currentOrder.paymentMethod}</p>
                                </div>
                              </div>
                            </div>
                          </div>

                          <div className="space-y-4">
                            <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest">Update Status</h3>
                            <div className="grid grid-cols-1 gap-3">
                              {currentOrder.status === 'Pending' || currentOrder.status === 'Verified' ? (
                                <button 
                                  onClick={() => handleStatusUpdate(currentOrder._id, 'Packed')}
                                  disabled={isUpdating}
                                  className="w-full py-5 bg-emerald-600 text-white rounded-2xl font-bold text-lg flex items-center justify-center gap-3 hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-100 disabled:opacity-60"
                                >
                                  {isUpdating ? <Loader2 className="w-6 h-6 animate-spin" /> : <Package className="w-6 h-6" />} Mark as Packed
                                </button>
                              ) : currentOrder.status === 'Packed' ? (
                                <button 
                                  onClick={() => handleStatusUpdate(currentOrder._id, 'Dispatched')}
                                  disabled={isUpdating}
                                  className="w-full py-5 bg-blue-600 text-white rounded-2xl font-bold text-lg flex items-center justify-center gap-3 hover:bg-blue-700 transition-all shadow-lg shadow-blue-100 disabled:opacity-60"
                                >
                                  {isUpdating ? <Loader2 className="w-6 h-6 animate-spin" /> : <Truck className="w-6 h-6" />} Mark as Dispatched
                                </button>
                              ) : currentOrder.status === 'Dispatched' ? (
                                <button 
                                  onClick={() => handleStatusUpdate(currentOrder._id, 'Delivered')}
                                  disabled={isUpdating}
                                  className="w-full py-5 bg-slate-900 text-white rounded-2xl font-bold text-lg flex items-center justify-center gap-3 hover:bg-slate-800 transition-all shadow-lg shadow-slate-200 disabled:opacity-60"
                                >
                                  {isUpdating ? <Loader2 className="w-6 h-6 animate-spin" /> : <CheckCircle2 className="w-6 h-6" />} Mark as Delivered
                                </button>
                              ) : (
                                <div className="p-6 bg-emerald-50 rounded-3xl border border-emerald-100 flex items-center gap-4">
                                  <div className="w-12 h-12 bg-emerald-500 rounded-2xl flex items-center justify-center text-white">
                                    <CheckCircle2 className="w-6 h-6" />
                                  </div>
                                  <div>
                                    <p className="text-emerald-900 font-bold">Order Delivered</p>
                                    <p className="text-xs text-emerald-700/70">
                                      {`Completed on ${new Date(currentOrder.deliveredAt || currentOrder.updatedAt || currentOrder.createdAt).toLocaleDateString()}`}
                                    </p>
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                  {error && <p className="text-sm text-rose-600">{error}</p>}
                </motion.div>
              ) : (
                <div className="bg-white rounded-[40px] border border-slate-200 border-dashed p-32 text-center">
                  <div className="w-24 h-24 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-8">
                    <Package className="w-12 h-12 text-slate-200" />
                  </div>
                  <h2 className="text-3xl font-bold text-slate-900 mb-4">Select an Order</h2>
                  <p className="text-slate-500 max-w-sm mx-auto text-lg">
                    Choose an order from the list to view details and update its status.
                  </p>
                </div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
      {!currentOrder && error && <p className="max-w-7xl mx-auto px-8 text-sm text-rose-600">{error}</p>}
    </div>
  );
};

export default OrderManagement;
