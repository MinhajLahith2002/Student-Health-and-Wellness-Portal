import React, { useEffect, useMemo, useState } from 'react';
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
  ArrowRight,
  Loader2,
  XCircle
} from 'lucide-react';
import { motion } from 'motion/react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { cn } from '../../../lib/utils';
import { apiFetch } from '../../../lib/api';

const STATUS_TO_STEP = {
  Pending: 0,
  Verified: 1,
  Packed: 2,
  Dispatched: 3,
  Delivered: 4,
  Cancelled: -1
};

const TRACKING_STAGES = [
  { id: 'verified', label: 'Prescription / Order Review', step: 1 },
  { id: 'packed', label: 'Packed', step: 2 },
  { id: 'dispatched', label: 'Dispatched', step: 3 },
  { id: 'delivered', label: 'Delivered', step: 4 }
];

function formatCurrency(value) {
  return `$${Number(value || 0).toFixed(2)}`;
}

function formatOrderDate(value) {
  if (!value) return 'Not available';

  return new Date(value).toLocaleString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit'
  });
}

function getStatusPillClass(status) {
  switch (status) {
    case 'Delivered':
      return 'bg-emerald-50 text-emerald-700 border-emerald-100';
    case 'Cancelled':
      return 'bg-rose-50 text-rose-700 border-rose-100';
    case 'Pending':
      return 'bg-amber-50 text-amber-700 border-amber-100';
    default:
      return 'bg-[#e8f4f8] text-blue-700 border-blue-100';
  }
}

function getOrderProgressMessage(order) {
  switch (order?.status) {
    case 'Delivered':
      return order?.deliveredAt ? `Delivered on ${formatOrderDate(order.deliveredAt)}` : 'Delivered successfully';
    case 'Dispatched':
      return 'Your order is on the way to your delivery location.';
    case 'Packed':
      return 'Your medicines are packed and waiting for dispatch.';
    case 'Verified':
      return 'The pharmacist reviewed your order and moved it into processing.';
    case 'Cancelled':
      return order?.cancellationReason || 'This order was cancelled before delivery.';
    case 'Pending':
    default:
      return 'Your order is waiting for pharmacist review.';
  }
}

const OrderTracking = () => {
  const { orderId } = useParams();
  const navigate = useNavigate();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;

    const loadOrder = async () => {
      setLoading(true);
      setError('');
      try {
        const data = await apiFetch(`/orders/${orderId}`);
        if (!active) return;
        setOrder(data);
      } catch (err) {
        if (!active) return;
        setError(err.message || 'Failed to load order tracking');
      } finally {
        if (active) setLoading(false);
      }
    };

    loadOrder();
    return () => {
      active = false;
    };
  }, [orderId]);

  const currentStageIndex = useMemo(() => STATUS_TO_STEP[order?.status] ?? 0, [order?.status]);
  const isPrescriptionOrder = Boolean(order?.prescriptionId);
  const supportEmail = order?.studentId?.email || order?.studentEmail || '';
  const supportPhone = order?.studentId?.phone || order?.studentPhone || '';
  const progressWidth = useMemo(() => {
    if (!order || currentStageIndex <= 1) return 0;
    return ((currentStageIndex - 1) / (TRACKING_STAGES.length - 1)) * 100;
  }, [currentStageIndex, order]);

  if (loading) {
    return (
      <div className="pharmacy-shell flex items-center justify-center p-6 min-h-[60vh]">
        <div className="text-center">
          <Loader2 className="w-8 h-8 text-accent-primary animate-spin mx-auto mb-4" />
          <p className="text-secondary-text font-medium">Loading order details...</p>
        </div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="pharmacy-shell flex flex-col items-center justify-center p-6 text-center min-h-[60vh]">
        <div className="w-20 h-20 bg-[#e6f0f4] rounded-full flex items-center justify-center mb-6">
          <AlertCircle className="w-10 h-10 text-slate-300" />
        </div>
        <h2 className="text-2xl font-bold text-primary-text mb-2">Order not found</h2>
        <p className="text-secondary-text mb-8">The order you are trying to track is unavailable.</p>
        <button
          onClick={() => navigate('/student/pharmacy/orders')}
          className="px-8 py-3 bg-accent-primary text-white rounded-xl font-bold hover:bg-[#105f72] transition-all"
        >
          Back to Activity
        </button>
        {error && <p className="mt-4 text-sm text-rose-600">{error}</p>}
      </div>
    );
  }

  return (
    <div className="pharmacy-shell pb-20">
      <div className="pharmacy-hero sticky top-0 z-30 px-6 py-4">
        <div className="max-w-4xl mx-auto flex items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate(-1)}
              className="p-2 hover:bg-[#e6f0f4] rounded-full transition-colors text-secondary-text"
            >
              <ChevronLeft className="w-6 h-6" />
            </button>
            <div>
              <h1 className="text-xl font-bold text-primary-text">Track Order</h1>
              <p className="text-xs text-secondary-text font-bold uppercase tracking-wider">
                Order {order.orderId || order._id}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3 flex-wrap justify-end">
            {isPrescriptionOrder && (
              <span className="px-3 py-1 bg-[#e8f4f8] text-blue-700 text-[10px] font-bold rounded-lg border border-blue-100 uppercase tracking-wider">
                Prescription Order
              </span>
            )}
            <span className={cn('px-4 py-1.5 text-xs font-bold rounded-full border', getStatusPillClass(order.status))}>
              {order.status}
            </span>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-6 py-10 space-y-8">
        {order.status === 'Cancelled' ? (
          <section className="pharmacy-panel p-8 border border-rose-100 bg-rose-50/80">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center shrink-0">
                <XCircle className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-rose-900">Order Cancelled</h2>
                <p className="text-sm text-rose-700 mt-2">{getOrderProgressMessage(order)}</p>
              </div>
            </div>
          </section>
        ) : (
          <section className="pharmacy-panel p-10">
            <div className="relative flex justify-between gap-4">
              <div className="absolute top-6 left-0 right-0 h-1 bg-[#e6f0f4] z-0" />
              <motion.div
                initial={false}
                animate={{ width: `${progressWidth}%` }}
                className="absolute top-6 left-0 h-1 bg-accent-green z-0 transition-all duration-700"
              />

              {TRACKING_STAGES.map((stage) => {
                const isCompleted = currentStageIndex > stage.step;
                const isCurrent = currentStageIndex === stage.step;

                return (
                  <div key={stage.id} className="relative z-10 flex flex-col items-center gap-4">
                    <motion.div
                      initial={false}
                      animate={{
                        scale: isCurrent ? 1.15 : 1,
                        backgroundColor: isCompleted || isCurrent ? '#10b981' : '#f1f5f9',
                        borderColor: isCompleted || isCurrent ? '#10b981' : '#e2e8f0'
                      }}
                      className={cn(
                        'w-12 h-12 rounded-full border-4 flex items-center justify-center transition-colors',
                        isCurrent && 'shadow-lg shadow-emerald-200 ring-4 ring-emerald-50'
                      )}
                    >
                      {isCompleted ? (
                        <CheckCircle2 className="w-6 h-6 text-white" />
                      ) : isCurrent ? (
                        <motion.div animate={{ opacity: [1, 0.5, 1] }} transition={{ repeat: Infinity, duration: 2 }}>
                          <Clock className="w-6 h-6 text-white" />
                        </motion.div>
                      ) : (
                        <div className="w-2 h-2 rounded-full bg-slate-300" />
                      )}
                    </motion.div>
                    <div className="text-center">
                      <p
                        className={cn(
                          'text-xs font-bold uppercase tracking-wider',
                          isCompleted || isCurrent ? 'text-accent-primary' : 'text-secondary-text/80'
                        )}
                      >
                        {stage.label}
                      </p>
                      {isCurrent && <p className="text-[10px] text-emerald-500 font-bold mt-1">In Progress</p>}
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        )}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="md:col-span-2 space-y-8">
            <section className="pharmacy-panel overflow-hidden">
              <div className="p-6 border-b border-slate-100 flex items-center justify-between">
                <h2 className="text-lg font-bold text-primary-text">Order Items</h2>
                {isPrescriptionOrder && (
                  <div className="flex items-center gap-2 text-accent-primary">
                    <ShieldCheck className="w-4 h-4" />
                    <span className="text-xs font-bold uppercase tracking-wider">Prescription attached</span>
                  </div>
                )}
              </div>
              <div className="divide-y divide-slate-100">
                {(order.items || []).map((item, index) => (
                  <div key={`${item.medicineId || item.name}-${index}`} className="p-6 flex gap-4">
                    <div className="w-16 h-16 bg-[#e6f0f4] rounded-xl shrink-0 flex items-center justify-center text-accent-primary font-black text-lg">
                      {(item.name || 'M').slice(0, 1).toUpperCase()}
                    </div>
                    <div className="flex-1">
                      <div className="flex justify-between items-start gap-4">
                        <h3 className="font-bold text-primary-text">{item.name}</h3>
                        <p className="font-bold text-primary-text">{formatCurrency((item.price || 0) * (item.quantity || 0))}</p>
                      </div>
                      <p className="text-xs text-secondary-text">
                        {item.quantity} x {formatCurrency(item.price)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
              <div className="p-6 bg-[#eff6f9] flex justify-between items-center">
                <span className="font-bold text-secondary-text">Total Amount</span>
                <span className="text-xl font-bold text-accent-primary">{formatCurrency(order.total)}</span>
              </div>
            </section>

            <section className="pharmacy-panel p-8">
              <h2 className="text-lg font-bold text-primary-text mb-6 flex items-center gap-2">
                <MapPin className="w-5 h-5 text-accent-primary" /> Delivery Information
              </h2>
              <div className="space-y-6">
                <div className="flex gap-4">
                  <div className="w-10 h-10 bg-[#e6f0f4] rounded-xl flex items-center justify-center text-secondary-text/80 shrink-0">
                    <Truck className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-primary-text">Delivery Address</p>
                    <p className="text-sm text-secondary-text">{order.address || 'No address recorded'}</p>
                  </div>
                </div>
                <div className="flex gap-4">
                  <div className="w-10 h-10 bg-[#e6f0f4] rounded-xl flex items-center justify-center text-secondary-text/80 shrink-0">
                    <Clock className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-primary-text">Latest Update</p>
                    <p className="text-sm text-secondary-text">{getOrderProgressMessage(order)}</p>
                    <p className="text-xs text-secondary-text/80 mt-1">Placed on {formatOrderDate(order.createdAt)}</p>
                  </div>
                </div>
              </div>
            </section>
          </div>

          <div className="space-y-6">
            <section className="pharmacy-panel p-8">
              <h2 className="text-lg font-bold text-primary-text mb-6">Need Help?</h2>
              <div className="space-y-4">
                {supportEmail ? (
                  <a
                    href={`mailto:${supportEmail}`}
                    className="w-full py-4 bg-[#eff6f9] text-primary-text rounded-xl font-bold flex items-center justify-center gap-3 hover:bg-[#e6f0f4] transition-all"
                  >
                    <MessageSquare className="w-5 h-5 text-accent-primary" /> Contact Pharmacy
                  </a>
                ) : (
                  <div className="w-full py-4 bg-[#eff6f9] text-secondary-text rounded-xl font-bold flex items-center justify-center gap-3">
                    <MessageSquare className="w-5 h-5 text-secondary-text/70" /> Contact details unavailable
                  </div>
                )}
                {supportPhone ? (
                  <a
                    href={`tel:${supportPhone}`}
                    className="w-full py-4 bg-[#eff6f9] text-primary-text rounded-xl font-bold flex items-center justify-center gap-3 hover:bg-[#e6f0f4] transition-all"
                  >
                    <AlertCircle className="w-5 h-5 text-rose-500" /> Call Support
                  </a>
                ) : (
                  <Link
                    to="/student/pharmacy/orders"
                    className="w-full py-4 bg-[#eff6f9] text-primary-text rounded-xl font-bold flex items-center justify-center gap-3 hover:bg-[#e6f0f4] transition-all"
                  >
                    <AlertCircle className="w-5 h-5 text-rose-500" /> Back to Order Activity
                  </Link>
                )}
              </div>
            </section>

            <section className="bg-emerald-900 rounded-3xl p-8 text-white">
              <ShieldCheck className="w-10 h-10 text-emerald-400 mb-4" />
              <h3 className="text-xl font-bold mb-2">Safe Delivery</h3>
              <p className="text-emerald-100/70 text-sm leading-relaxed mb-6">
                Pharmacy updates are now tied to your real order status from the backend.
              </p>
              <Link to="/student/pharmacy/first-aid" className="text-sm font-bold flex items-center hover:underline">
                Emergency First-Aid <ArrowRight className="ml-2 w-4 h-4" />
              </Link>
            </section>

            {error && <p className="text-sm text-rose-600">{error}</p>}
          </div>
        </div>
      </div>
    </div>
  );
};

export default OrderTracking;
