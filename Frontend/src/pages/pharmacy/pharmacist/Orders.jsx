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
  Loader2,
  FileText,
  Plus,
  Trash2
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { cn } from '../../../lib/utils';
import { apiFetch } from '../../../lib/api';

const OrderManagement = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [activeTab, setActiveTab] = useState('New');
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [orders, setOrders] = useState([]);
  const [orderTypeFilter, setOrderTypeFilter] = useState('Direct');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState(false);
  const [error, setError] = useState('');
  const [medicines, setMedicines] = useState([]);
  const [pricingDraft, setPricingDraft] = useState([]);
  const [pricingForm, setPricingForm] = useState({ medicineId: '', quantity: 1, price: '' });
  const [pricingNotes, setPricingNotes] = useState('');

  const tabs = ['New', 'Processing', 'Dispatched', 'Delivered'];

  useEffect(() => {
    const requestedType = searchParams.get('type');
    if (['Direct', 'Prescription'].includes(requestedType)) {
      setOrderTypeFilter(requestedType);
      setSelectedOrder(null);
    }
  }, [searchParams]);

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

  useEffect(() => {
    let active = true;

    const loadMedicines = async () => {
      try {
        const data = await apiFetch('/medicines?limit=500');
        if (!active) return;
        setMedicines(Array.isArray(data?.medicines) ? data.medicines.filter((medicine) => medicine.stock > 0) : []);
      } catch {
        if (active) setMedicines([]);
      }
    };

    loadMedicines();
    return () => {
      active = false;
    };
  }, []);

  const filteredOrders = useMemo(() => {
    return orders.filter((order) => {
      const status = order.status || '';
      const orderType = order.orderType || (order.prescriptionId ? 'Prescription' : 'Direct');
      const matchesType = orderTypeFilter === 'All' || orderType === orderTypeFilter;
      const matchesTab =
        (activeTab === 'New' && ['Pricing Pending', 'Pending', 'Verified'].includes(status)) ||
        (activeTab === 'Processing' && status === 'Packed') ||
        (activeTab === 'Dispatched' && status === 'Dispatched') ||
        (activeTab === 'Delivered' && status === 'Delivered');

      const query = searchQuery.trim().toLowerCase();
      const matchesSearch =
        !query ||
        (order.orderId || order._id || '').toLowerCase().includes(query) ||
        (order.studentName || '').toLowerCase().includes(query);

      return matchesType && matchesTab && matchesSearch;
    });
  }, [orders, orderTypeFilter, activeTab, searchQuery]);

  useEffect(() => {
    if (!selectedOrder && filteredOrders.length > 0) {
      setSelectedOrder(filteredOrders[0]._id);
    }
  }, [filteredOrders, selectedOrder]);

  const currentOrder = useMemo(
    () => orders.find((order) => order._id === selectedOrder),
    [orders, selectedOrder]
  );
  const currentOrderType = currentOrder?.orderType || (currentOrder?.prescriptionId ? 'Prescription' : 'Direct');
  const getOrderLabel = (order) => order?.orderId || order?._id || 'Pending ID';
  const getPricingSummary = (order) => {
    if (order?.status !== 'Pricing Pending') return '';
    if ((order.items || []).length > 0) return '';

    return 'No priced inventory items are attached yet. Confirm medicine availability and pricing before packing.';
  };
  const selectedMedicine = medicines.find((medicine) => medicine._id === pricingForm.medicineId);
  const pricingDraftTotal = pricingDraft.reduce((sum, item) => sum + (Number(item.price) * Number(item.quantity)), 0);

  useEffect(() => {
    setPricingDraft([]);
    setPricingNotes('');
    setPricingForm({ medicineId: '', quantity: 1, price: '' });
  }, [selectedOrder]);

  const handleMedicineSelect = (medicineId) => {
    const medicine = medicines.find((item) => item._id === medicineId);
    setPricingForm({
      medicineId,
      quantity: 1,
      price: medicine ? String(medicine.price) : ''
    });
  };

  const addPricingItem = () => {
    if (!selectedMedicine) return;
    const quantity = Math.max(1, Number(pricingForm.quantity) || 1);
    const price = Math.max(0, Number(pricingForm.price) || 0);
    const safeQuantity = Math.min(quantity, selectedMedicine.stock);

    setPricingDraft((current) => [
      ...current,
      {
        medicineId: selectedMedicine._id,
        name: selectedMedicine.name,
        stock: selectedMedicine.stock,
        quantity: safeQuantity,
        price,
        requiresPrescription: selectedMedicine.requiresPrescription
      }
    ]);
    setPricingForm({ medicineId: '', quantity: 1, price: '' });
  };

  const removePricingItem = (indexToRemove) => {
    setPricingDraft((current) => current.filter((_, index) => index !== indexToRemove));
  };

  const submitPricing = async () => {
    if (!currentOrder || pricingDraft.length === 0) return;

    try {
      setIsUpdating(true);
      setError('');
      await apiFetch(`/orders/${currentOrder._id}/pricing`, {
        method: 'PUT',
        body: JSON.stringify({
          items: pricingDraft.map(({ medicineId, quantity, price }) => ({ medicineId, quantity, price })),
          deliveryFee: 2.5,
          pricingNotes
        })
      });
      setPricingDraft([]);
      setPricingNotes('');
      await refreshOrders(currentOrder._id);
    } catch (err) {
      setError(err.message || 'Failed to resolve pricing');
    } finally {
      setIsUpdating(false);
    }
  };

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
            <div className="flex bg-slate-100 p-1.5 rounded-2xl">
              {['Direct', 'Prescription'].map((type) => (
                <button
                  key={type}
                  onClick={() => {
                    setOrderTypeFilter(type);
                    setSelectedOrder(null);
                  }}
                  className={cn(
                    'px-4 py-2 rounded-xl text-sm font-bold transition-all whitespace-nowrap',
                    orderTypeFilter === type ? 'bg-white text-emerald-700 shadow-sm' : 'text-slate-500 hover:text-slate-700'
                  )}
                >
                  {type}
                </button>
              ))}
            </div>
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
            <div className="grid grid-cols-4 border-b border-slate-200 mb-6">
              {tabs.map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={cn(
                    "px-2 py-3 text-[11px] font-bold uppercase tracking-wider transition-all relative whitespace-nowrap",
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
                      "w-full p-5 rounded-3xl border-2 text-left transition-all flex flex-col gap-4 group",
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
                          {(order.orderType || (order.prescriptionId ? 'Prescription' : 'Direct')) === 'Prescription'
                            ? <FileText className="w-6 h-6" />
                            : <Package className="w-6 h-6" />}
                        </div>
                        <div className="min-w-0">
                          <h3 className={cn("font-bold text-lg leading-tight break-words", selectedOrder === order._id ? "text-emerald-900" : "text-slate-900")}>
                            Order {getOrderLabel(order)}
                          </h3>
                          <p className="text-xs text-slate-500">{order.studentName}</p>
                          <span className={cn(
                            'mt-2 inline-flex px-2 py-0.5 rounded-full text-[8px] font-bold uppercase tracking-wider border',
                            (order.orderType || (order.prescriptionId ? 'Prescription' : 'Direct')) === 'Prescription'
                              ? 'bg-blue-50 text-blue-700 border-blue-100'
                              : 'bg-emerald-50 text-emerald-700 border-emerald-100'
                          )}>
                            {(order.orderType || (order.prescriptionId ? 'Prescription' : 'Direct'))} order
                          </span>
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
                          {(order.items || []).length} Items | {order.status === 'Pricing Pending' ? 'Pricing pending' : `$${Number(order.total || 0).toFixed(2)}`}
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
                    {orderTypeFilter === 'Prescription'
                      ? <FileText className="w-8 h-8 text-slate-200" />
                      : <Package className="w-8 h-8 text-slate-200" />}
                  </div>
                  <p className="text-slate-500 font-medium">No {activeTab.toLowerCase()} {orderTypeFilter.toLowerCase()} orders</p>
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
                            {currentOrderType === 'Prescription' ? <FileText className="w-10 h-10" /> : <Package className="w-10 h-10" />}
                          </div>
                          <div>
                            <div className="flex items-center gap-3 flex-wrap">
                              <h2 className="text-3xl font-bold text-slate-900">Order {getOrderLabel(currentOrder)}</h2>
                              <span className={cn(
                                'px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border',
                                currentOrderType === 'Prescription'
                                  ? 'bg-blue-50 text-blue-700 border-blue-100'
                                  : 'bg-emerald-50 text-emerald-700 border-emerald-100'
                              )}>
                                {currentOrderType} order
                              </span>
                            </div>
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
                          {(currentOrder.items || []).length > 0 ? currentOrder.items.map((item, idx) => {
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
                            }) : (
                              <div className="p-5 bg-amber-50 rounded-2xl border border-amber-100">
                                <div className="flex gap-3">
                                  <FileText className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                                  <div>
                                    <p className="font-bold text-amber-950">Pricing review needed</p>
                                    <p className="text-sm text-amber-700 mt-1">
                                      {getPricingSummary(currentOrder)}
                                    </p>
                                    {currentOrder.prescriptionId?.notes && (
                                      <p className="text-xs text-amber-700/80 italic mt-3">"{currentOrder.prescriptionId.notes}"</p>
                                    )}
                                  </div>
                                </div>
                                <div className="mt-5 space-y-4 border-t border-amber-100 pt-5">
                                  <div className="grid grid-cols-1 md:grid-cols-[1fr_80px_96px_auto] gap-3">
                                    <select
                                      value={pricingForm.medicineId}
                                      onChange={(event) => handleMedicineSelect(event.target.value)}
                                      className="min-w-0 rounded-xl border border-amber-200 bg-white px-3 py-3 text-sm font-semibold text-slate-800 outline-none focus:ring-2 focus:ring-amber-300"
                                    >
                                      <option value="">Select available medicine</option>
                                      {medicines.map((medicine) => (
                                        <option key={medicine._id} value={medicine._id}>
                                          {medicine.name} | stock {medicine.stock} | ${Number(medicine.price || 0).toFixed(2)}
                                        </option>
                                      ))}
                                    </select>
                                    <input
                                      type="number"
                                      min="1"
                                      max={selectedMedicine?.stock || 1}
                                      value={pricingForm.quantity}
                                      onChange={(event) => setPricingForm((current) => ({ ...current, quantity: event.target.value }))}
                                      className="rounded-xl border border-amber-200 bg-white px-3 py-3 text-sm font-semibold text-slate-800 outline-none focus:ring-2 focus:ring-amber-300"
                                      aria-label="Quantity"
                                    />
                                    <input
                                      type="number"
                                      min="0"
                                      step="0.01"
                                      value={pricingForm.price}
                                      onChange={(event) => setPricingForm((current) => ({ ...current, price: event.target.value }))}
                                      className="rounded-xl border border-amber-200 bg-white px-3 py-3 text-sm font-semibold text-slate-800 outline-none focus:ring-2 focus:ring-amber-300"
                                      aria-label="Unit price"
                                    />
                                    <button
                                      type="button"
                                      onClick={addPricingItem}
                                      disabled={!selectedMedicine || isUpdating}
                                      className="rounded-xl bg-amber-600 px-4 py-3 text-sm font-bold text-white disabled:opacity-50"
                                    >
                                      <Plus className="w-4 h-4" />
                                    </button>
                                  </div>

                                  {pricingDraft.length > 0 && (
                                    <div className="space-y-2">
                                      {pricingDraft.map((item, index) => (
                                        <div key={`${item.medicineId}-${index}`} className="flex items-center justify-between gap-3 rounded-xl bg-white px-3 py-3 text-sm border border-amber-100">
                                          <div className="min-w-0">
                                            <p className="font-bold text-slate-900 truncate">{item.name}</p>
                                            <p className="text-xs text-slate-500">{item.quantity} x ${Number(item.price).toFixed(2)}</p>
                                          </div>
                                          <button
                                            type="button"
                                            onClick={() => removePricingItem(index)}
                                            className="p-2 rounded-lg text-rose-600 hover:bg-rose-50"
                                            aria-label="Remove priced item"
                                          >
                                            <Trash2 className="w-4 h-4" />
                                          </button>
                                        </div>
                                      ))}
                                    </div>
                                  )}

                                  <textarea
                                    value={pricingNotes}
                                    onChange={(event) => setPricingNotes(event.target.value)}
                                    placeholder="Optional pricing note for this order"
                                    className="w-full rounded-xl border border-amber-200 bg-white px-3 py-3 text-sm text-slate-800 outline-none focus:ring-2 focus:ring-amber-300 min-h-20"
                                  />

                                  <div className="flex items-center justify-between gap-3">
                                    <p className="text-sm font-bold text-amber-900">
                                      Draft total: ${(pricingDraftTotal + 2.5).toFixed(2)}
                                    </p>
                                    <button
                                      type="button"
                                      onClick={submitPricing}
                                      disabled={pricingDraft.length === 0 || isUpdating}
                                      className="rounded-xl bg-slate-900 px-5 py-3 text-sm font-bold text-white disabled:opacity-50"
                                    >
                                      {isUpdating ? 'Saving...' : 'Confirm pricing'}
                                    </button>
                                  </div>
                                </div>
                              </div>
                            )}
                          </div>
                          <div className="p-6 bg-slate-900 rounded-2xl text-white flex justify-between items-center">
                            <span className="font-bold text-slate-400">Total Amount</span>
                            <span className="text-2xl font-bold text-emerald-400">
                              {currentOrder.status === 'Pricing Pending' ? 'Pending' : `$${currentOrder.total.toFixed(2)}`}
                            </span>
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
                              {currentOrder.status === 'Pricing Pending' ? (
                                <div className="p-5 bg-amber-50 rounded-2xl border border-amber-100 text-sm font-semibold text-amber-800">
                                  Add priced medicine items before packing this prescription order.
                                </div>
                              ) : currentOrder.status === 'Pending' || currentOrder.status === 'Verified' ? (
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
