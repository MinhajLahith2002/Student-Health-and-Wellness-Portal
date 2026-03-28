import React, { useMemo } from 'react';
import { 
  Package, 
  Truck, 
  CheckCircle2, 
  Clock, 
  MapPin, 
  ChevronLeft, 
  MessageSquare, 
  ShieldCheck,
  AlertCircle,
  ArrowRight
} from 'lucide-react';
import { motion } from 'motion/react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { MOCK_ORDERS, MOCK_MEDICINES } from '../../../constants/mockPharmacyData';
import { cn } from '../../../lib/utils';

const OrderTracking = () => {
  const { orderId } = useParams();
  const navigate = useNavigate();

  const order = useMemo(() => MOCK_ORDERS.find(o => o.id === orderId) || MOCK_ORDERS[0], [orderId]);

  const stages = [
    { id: 'verified', label: 'Prescription Verified', status: "VERIFIED" },
    { id: 'packed', label: 'Packed', status: "PACKED" },
    { id: 'dispatched', label: 'Dispatched', status: "DISPATCHED" },
    { id: 'delivered', label: 'Delivered', status: "DELIVERED" }
  ];

  const currentStageIndex = useMemo(() => {
    const statusOrder = [
      "PENDING",
      "VERIFIED",
      "PACKED",
      "DISPATCHED",
      "DELIVERED"
    ];
    return statusOrder.indexOf(order.status);
  }, [order.status]);

  return (
    <div className="min-h-screen bg-slate-50 pb-20">
      {/* Header */}
      <div className="bg-white border-b border-slate-200 sticky top-0 z-30 px-6 py-4">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => navigate(-1)}
              className="p-2 hover:bg-slate-100 rounded-full transition-colors text-slate-600"
            >
              <ChevronLeft className="w-6 h-6" />
            </button>
            <div>
              <h1 className="text-xl font-bold text-slate-900">Track Order</h1>
              <p className="text-xs text-slate-500 font-bold uppercase tracking-wider">Order {order.id}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {order.isPrescription && (
              <span className="px-3 py-1 bg-blue-50 text-blue-700 text-[10px] font-bold rounded-lg border border-blue-100 uppercase tracking-wider">
                Prescription Order
              </span>
            )}
            <span className="px-4 py-1.5 bg-emerald-50 text-emerald-700 text-xs font-bold rounded-full border border-emerald-100">
              {order.status}
            </span>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-6 py-10 space-y-8">
        {/* Progress Tracker */}
        <section className="bg-white rounded-3xl border border-slate-200 shadow-sm p-10">
          <div className="relative flex justify-between">
            {/* Connecting Line */}
            <div className="absolute top-6 left-0 right-0 h-1 bg-slate-100 z-0" />
            <motion.div 
              initial={{ width: 0 }}
              animate={{ width: `${(Math.max(0, currentStageIndex - 1) / (stages.length - 1)) * 100}%` }}
              className="absolute top-6 left-0 h-1 bg-emerald-500 z-0 transition-all duration-1000"
            />

            {stages.map((stage, index) => {
              const isCompleted = currentStageIndex > index + 1;
              const isCurrent = currentStageIndex === index + 1;
              
              return (
                <div key={stage.id} className="relative z-10 flex flex-col items-center gap-4">
                  <motion.div 
                    initial={false}
                    animate={{ 
                      scale: isCurrent ? 1.2 : 1,
                      backgroundColor: isCompleted || isCurrent ? '#10b981' : '#f1f5f9',
                      borderColor: isCompleted || isCurrent ? '#10b981' : '#e2e8f0'
                    }}
                    className={cn(
                      "w-12 h-12 rounded-full border-4 flex items-center justify-center transition-colors",
                      isCurrent && "shadow-lg shadow-emerald-200 ring-4 ring-emerald-50"
                    )}
                  >
                    {isCompleted ? (
                      <CheckCircle2 className="w-6 h-6 text-white" />
                    ) : isCurrent ? (
                      <motion.div 
                        animate={{ opacity: [1, 0.5, 1] }}
                        transition={{ repeat: Infinity, duration: 2 }}
                      >
                        <Clock className="w-6 h-6 text-white" />
                      </motion.div>
                    ) : (
                      <div className="w-2 h-2 rounded-full bg-slate-300" />
                    )}
                  </motion.div>
                  <div className="text-center">
                    <p className={cn(
                      "text-xs font-bold uppercase tracking-wider",
                      isCompleted || isCurrent ? "text-emerald-600" : "text-slate-400"
                    )}>
                      {stage.label}
                    </p>
                    {isCurrent && <p className="text-[10px] text-emerald-500 font-bold mt-1">In Progress</p>}
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Order Details */}
          <div className="md:col-span-2 space-y-8">
            <section className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="p-6 border-b border-slate-100 flex items-center justify-between">
                <h2 className="text-lg font-bold text-slate-900">Order Items</h2>
                {order.isPrescription && (
                  <div className="flex items-center gap-2 text-emerald-600">
                    <ShieldCheck className="w-4 h-4" />
                    <span className="text-xs font-bold uppercase tracking-wider">Verified by Pharmacist</span>
                  </div>
                )}
              </div>
              <div className="divide-y divide-slate-100">
                {order.items.map((item, idx) => {
                  const med = MOCK_MEDICINES.find(m => m.id === item.medicineId);
                  return (
                    <div key={idx} className="p-6 flex gap-4">
                      <div className="w-16 h-16 bg-slate-100 rounded-xl overflow-hidden shrink-0">
                        <img src={med?.image} alt={med?.name} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                      </div>
                      <div className="flex-1">
                        <div className="flex justify-between items-start">
                          <h3 className="font-bold text-slate-900">{med?.name}</h3>
                          <p className="font-bold text-slate-900">${(item.price * item.quantity).toFixed(2)}</p>
                        </div>
                        <p className="text-xs text-slate-500">{item.quantity} x ${item.price}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
              <div className="p-6 bg-slate-50 flex justify-between items-center">
                <span className="font-bold text-slate-500">Total Amount</span>
                <span className="text-xl font-bold text-emerald-600">${order.total.toFixed(2)}</span>
              </div>
            </section>

            {/* Delivery Info */}
            <section className="bg-white rounded-3xl border border-slate-200 shadow-sm p-8">
              <h2 className="text-lg font-bold text-slate-900 mb-6 flex items-center gap-2">
                <MapPin className="w-5 h-5 text-emerald-600" /> Delivery Information
              </h2>
              <div className="space-y-6">
                <div className="flex gap-4">
                  <div className="w-10 h-10 bg-slate-100 rounded-xl flex items-center justify-center text-slate-400 shrink-0">
                    <Truck className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-slate-900">Delivery Address</p>
                    <p className="text-sm text-slate-500">{order.address}</p>
                  </div>
                </div>
                <div className="flex gap-4">
                  <div className="w-10 h-10 bg-slate-100 rounded-xl flex items-center justify-center text-slate-400 shrink-0">
                    <Clock className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-slate-900">Estimated Delivery</p>
                    <p className="text-sm text-slate-500">Today, 11:45 AM - 12:15 PM</p>
                  </div>
                </div>
              </div>
              
              {/* Map Placeholder */}
              <div className="mt-8 aspect-video bg-slate-100 rounded-2xl border border-slate-200 overflow-hidden relative group cursor-pointer">
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="text-center">
                    <MapPin className="w-8 h-8 text-emerald-600 mx-auto mb-2 group-hover:scale-110 transition-transform" />
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Real-time tracking available</p>
                  </div>
                </div>
                <div className="absolute bottom-4 left-4 right-4 p-4 bg-white/90 backdrop-blur-sm rounded-xl border border-white/20 shadow-lg">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-emerald-100 rounded-full flex items-center justify-center text-emerald-600">
                        <Truck className="w-5 h-5" />
                      </div>
                      <div>
                        <p className="text-xs font-bold text-slate-900">Courier: Alex Chen</p>
                        <p className="text-[10px] text-slate-500">On his way to you</p>
                      </div>
                    </div>
                    <button className="p-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors">
                      <MessageSquare className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            </section>
          </div>

          {/* Sidebar Actions */}
          <div className="space-y-6">
            <section className="bg-white rounded-3xl border border-slate-200 shadow-sm p-8">
              <h2 className="text-lg font-bold text-slate-900 mb-6">Need Help?</h2>
              <div className="space-y-4">
                <button className="w-full py-4 bg-slate-50 text-slate-900 rounded-xl font-bold flex items-center justify-center gap-3 hover:bg-slate-100 transition-all">
                  <MessageSquare className="w-5 h-5 text-emerald-600" /> Contact Pharmacist
                </button>
                <button className="w-full py-4 bg-slate-50 text-slate-900 rounded-xl font-bold flex items-center justify-center gap-3 hover:bg-slate-100 transition-all">
                  <AlertCircle className="w-5 h-5 text-rose-500" /> Report an Issue
                </button>
              </div>
            </section>

            <section className="bg-emerald-900 rounded-3xl p-8 text-white">
              <ShieldCheck className="w-10 h-10 text-emerald-400 mb-4" />
              <h3 className="text-xl font-bold mb-2">Safe Delivery</h3>
              <p className="text-emerald-100/70 text-sm leading-relaxed mb-6">
                All our deliveries are handled by verified campus staff with strict hygiene protocols.
              </p>
              <Link to="/student/pharmacy/first-aid" className="text-sm font-bold flex items-center hover:underline">
                Emergency First-Aid <ArrowRight className="ml-2 w-4 h-4" />
              </Link>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OrderTracking;