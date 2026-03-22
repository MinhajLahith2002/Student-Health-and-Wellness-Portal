import React, { useState } from 'react';
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
  ArrowRight,
  User,
  ExternalLink
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useNavigate } from 'react-router-dom';
import { MOCK_ORDERS, MOCK_MEDICINES } from '../../../constants/mockPharmacyData';
import { cn } from '../../../lib/utils';

const OrderManagement = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('New');
  const [selectedOrder, setSelectedOrder] = useState(null);

  const tabs = ['New', 'Processing', 'Dispatched', 'Delivered'];

  const filteredOrders = MOCK_ORDERS.filter(order => {
    if (activeTab === 'New') return order.status === "PENDING" || order.status === "VERIFIED";
    if (activeTab === 'Processing') return order.status === "PACKED";
    if (activeTab === 'Dispatched') return order.status === "DISPATCHED";
    if (activeTab === 'Delivered') return order.status === "DELIVERED";
    return false;
  });

  const currentOrder = MOCK_ORDERS.find(o => o.id === selectedOrder);

  const handleStatusUpdate = (id, nextStatus) => {
    // Simulate status update
    alert(`Order ${id} status updated to ${nextStatus}`);
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
              />
            </div>
            <button className="p-3 bg-slate-100 text-slate-600 rounded-xl hover:bg-slate-200 transition-all">
              <Filter className="w-5 h-5" />
            </button>
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

            <div className="space-y-4">
              <AnimatePresence mode="popLayout">
                {filteredOrders.map((order) => (
                  <motion.button
                    layout
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    key={order.id}
                    onClick={() => setSelectedOrder(order.id)}
                    className={cn(
                      "w-full p-6 rounded-[32px] border-2 text-left transition-all flex flex-col gap-4 group",
                      selectedOrder === order.id 
                        ? "border-emerald-500 bg-emerald-50/50" 
                        : "border-white bg-white hover:border-emerald-200 shadow-sm"
                    )}
                  >
                    <div className="flex justify-between items-start">
                      <div className="flex items-center gap-4">
                        <div className={cn(
                          "w-12 h-12 rounded-2xl flex items-center justify-center transition-colors",
                          selectedOrder === order.id ? "bg-emerald-600 text-white" : "bg-slate-100 text-slate-400"
                        )}>
                          <Package className="w-6 h-6" />
                        </div>
                        <div>
                          <h3 className={cn("font-bold", selectedOrder === order.id ? "text-emerald-900" : "text-slate-900")}>
                            Order {order.id}
                          </h3>
                          <p className="text-xs text-slate-500">{order.studentName}</p>
                        </div>
                      </div>
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                        {new Date(order.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                    
                    <div className="flex items-center justify-between pt-4 border-t border-slate-200/50">
                      <div className="flex items-center gap-1.5">
                        <Clock className="w-3 h-3 text-slate-400" />
                        <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                          {order.items.length} Items • ${order.total}
                        </span>
                      </div>
                      <ChevronRight className={cn(
                        "w-5 h-5 transition-transform",
                        selectedOrder === order.id ? "text-emerald-600 translate-x-1" : "text-slate-300"
                      )} />
                    </div>
                  </motion.button>
                ))}
              </AnimatePresence>

              {filteredOrders.length === 0 && (
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
                  key={currentOrder.id}
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
                            <h2 className="text-3xl font-bold text-slate-900">Order {currentOrder.id}</h2>
                            <p className="text-slate-500 font-medium">Student: {currentOrder.studentName}</p>
                            <p className="text-xs text-slate-400 font-bold uppercase tracking-widest mt-1">
                              Placed on {new Date(currentOrder.date).toLocaleString()}
                            </p>
                          </div>
                        </div>
                        <div className="flex gap-3">
                          <button className="p-4 bg-slate-100 text-slate-600 rounded-2xl hover:bg-slate-200 transition-all">
                            <Phone className="w-6 h-6" />
                          </button>
                          <button className="p-4 bg-slate-100 text-slate-600 rounded-2xl hover:bg-slate-200 transition-all">
                            <MessageSquare className="w-6 h-6" />
                          </button>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                        {/* Order Items */}
                        <div className="space-y-6">
                          <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest">Order Items</h3>
                          <div className="space-y-4">
                            {currentOrder.items.map((item, idx) => {
                              const med = MOCK_MEDICINES.find(m => m.id === item.medicineId);
                              return (
                                <div key={idx} className="p-4 bg-slate-50 rounded-2xl border border-slate-100 flex gap-4 group">
                                  <div className="w-16 h-16 bg-white rounded-xl overflow-hidden shadow-sm shrink-0">
                                    <img src={med?.image} alt={med?.name} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <div className="flex justify-between items-start">
                                      <h4 className="font-bold text-slate-900 truncate">{med?.name}</h4>
                                      <p className="font-bold text-slate-900">${(item.price * item.quantity).toFixed(2)}</p>
                                    </div>
                                    <p className="text-xs text-slate-500">{item.quantity} x ${item.price}</p>
                                    {med?.requiresPrescription && (
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
                                  <p className="text-sm text-slate-500">{currentOrder.studentId}</p>
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
                              {currentOrder.status === "PENDING" || currentOrder.status === "VERIFIED" ? (
                                <button 
                                  onClick={() => handleStatusUpdate(currentOrder.id, "PACKED")}
                                  className="w-full py-5 bg-emerald-600 text-white rounded-2xl font-bold text-lg flex items-center justify-center gap-3 hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-100"
                                >
                                  <Package className="w-6 h-6" /> Mark as Packed
                                </button>
                              ) : currentOrder.status === "PACKED" ? (
                                <button 
                                  onClick={() => handleStatusUpdate(currentOrder.id, "DISPATCHED")}
                                  className="w-full py-5 bg-blue-600 text-white rounded-2xl font-bold text-lg flex items-center justify-center gap-3 hover:bg-blue-700 transition-all shadow-lg shadow-blue-100"
                                >
                                  <Truck className="w-6 h-6" /> Mark as Dispatched
                                </button>
                              ) : currentOrder.status === "DISPATCHED" ? (
                                <button 
                                  onClick={() => handleStatusUpdate(currentOrder.id, "DELIVERED")}
                                  className="w-full py-5 bg-slate-900 text-white rounded-2xl font-bold text-lg flex items-center justify-center gap-3 hover:bg-slate-800 transition-all shadow-lg shadow-slate-200"
                                >
                                  <CheckCircle2 className="w-6 h-6" /> Mark as Delivered
                                </button>
                              ) : (
                                <div className="p-6 bg-emerald-50 rounded-3xl border border-emerald-100 flex items-center gap-4">
                                  <div className="w-12 h-12 bg-emerald-500 rounded-2xl flex items-center justify-center text-white">
                                    <CheckCircle2 className="w-6 h-6" />
                                  </div>
                                  <div>
                                    <p className="text-emerald-900 font-bold">Order Delivered</p>
                                    <p className="text-xs text-emerald-700/70">Completed on Feb 28, 2026</p>
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
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
    </div>
  );
};

export default OrderManagement;