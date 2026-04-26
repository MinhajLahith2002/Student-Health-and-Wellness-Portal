import React, { useEffect, useMemo, useState } from 'react';
import {
  AlertCircle,
  CheckCircle2,
  ChevronLeft,
  Clock,
  FileText,
  Loader2,
  MapPin,
  Package,
  ShieldCheck,
  Truck
} from 'lucide-react';
import { motion } from 'motion/react';
import { useNavigate, useParams } from 'react-router-dom';
import { cn } from '../../../lib/utils';
import { apiFetch } from '../../../lib/api';

const PRESCRIPTION_STAGES = [
  { id: 'uploaded', label: 'Uploaded', step: 0 },
  { id: 'approved', label: 'Approved', step: 1 },
  { id: 'order', label: 'Order Created', step: 2 },
  { id: 'packed', label: 'Packed', step: 3 },
  { id: 'dispatched', label: 'Dispatched', step: 4 },
  { id: 'delivered', label: 'Delivered', step: 5 }
];

const ORDER_STATUS_STEP = {
  'Pricing Pending': 1,
  Pending: 2,
  Verified: 2,
  Packed: 3,
  Dispatched: 4,
  Delivered: 5,
  Cancelled: -1
};

function getEntityId(value) {
  if (!value) return '';
  if (typeof value === 'string') return value;
  return value._id || value.id || '';
}

function getPrescriptionStep(prescription, linkedOrder) {
  if (linkedOrder) return ORDER_STATUS_STEP[linkedOrder.status] ?? 2;
  if (prescription?.status === 'Approved') return 1;
  if (prescription?.status === 'Rejected') return -1;
  return 0;
}

function getStatusText(prescription, linkedOrder) {
  if (linkedOrder?.status === 'Delivered') return 'Delivered';
  if (linkedOrder?.status === 'Dispatched') return 'Out for delivery';
  if (linkedOrder?.status === 'Packed') return 'Packed and waiting for dispatch';
  if (linkedOrder?.status === 'Pricing Pending') return 'Approved. Pharmacy is checking medicine availability and final price.';
  if (linkedOrder) return 'Order created and waiting for pharmacy processing';
  if (prescription?.status === 'Approved') return 'Approved and waiting for medicine preparation';
  if (prescription?.status === 'Rejected') return prescription.rejectionReason || 'Prescription rejected';
  return 'Prescription verification in progress';
}

function formatDate(value) {
  if (!value) return 'Not available';
  return new Date(value).toLocaleString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit'
  });
}

const PrescriptionTracking = () => {
  const { prescriptionId } = useParams();
  const navigate = useNavigate();
  const [prescription, setPrescription] = useState(null);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;

    const loadTracking = async (showLoader = false) => {
      if (showLoader) setLoading(true);
      setError('');
      try {
        const [prescriptionData, ordersData] = await Promise.all([
          apiFetch(`/prescriptions/${prescriptionId}`),
          apiFetch('/orders?limit=200')
        ]);

        if (!active) return;
        setPrescription(prescriptionData);
        setOrders(Array.isArray(ordersData?.orders) ? ordersData.orders : []);
      } catch (err) {
        if (!active) return;
        setError(err.message || 'Failed to load prescription tracking');
      } finally {
        if (active) setLoading(false);
      }
    };

    loadTracking(true);
    const intervalId = window.setInterval(() => loadTracking(false), 15000);

    return () => {
      active = false;
      window.clearInterval(intervalId);
    };
  }, [prescriptionId]);

  const linkedOrder = useMemo(
    () => orders.find((order) => getEntityId(order.prescriptionId) === prescriptionId),
    [orders, prescriptionId]
  );

  const currentStep = getPrescriptionStep(prescription, linkedOrder);
  const progressWidth = useMemo(() => {
    if (currentStep <= 0) return 0;
    return (currentStep / (PRESCRIPTION_STAGES.length - 1)) * 100;
  }, [currentStep]);

  if (loading) {
    return (
      <div className="pharmacy-shell flex items-center justify-center p-6 min-h-[60vh]">
        <div className="text-center">
          <Loader2 className="w-8 h-8 text-accent-primary animate-spin mx-auto mb-4" />
          <p className="text-secondary-text font-medium">Loading prescription tracking...</p>
        </div>
      </div>
    );
  }

  if (!prescription) {
    return (
      <div className="pharmacy-shell flex flex-col items-center justify-center p-6 text-center min-h-[60vh]">
        <div className="w-20 h-20 bg-[#e6f0f4] rounded-full flex items-center justify-center mb-6">
          <AlertCircle className="w-10 h-10 text-slate-300" />
        </div>
        <h2 className="text-2xl font-bold text-primary-text mb-2">Tracking unavailable</h2>
        <p className="text-secondary-text mb-8">This prescription could not be loaded.</p>
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
      <div className="max-w-5xl mx-auto px-6 pt-28 pb-10 space-y-8">
        <header className="pharmacy-panel p-6 md:p-8">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="flex items-start gap-4">
              <button
                onClick={() => navigate(-1)}
                className="p-2 bg-[#eff6f9] hover:bg-[#e6f0f4] rounded-full transition-colors text-secondary-text shrink-0"
              >
                <ChevronLeft className="w-6 h-6" />
              </button>
              <div>
                <p className="text-xs font-bold text-accent-primary uppercase tracking-[0.24em] mb-2">
                  Live prescription tracking
                </p>
                <h1 className="text-3xl md:text-4xl font-bold text-primary-text">Track Order</h1>
                <p className="text-sm text-secondary-text mt-2">
                  Prescription #{prescription._id}
                </p>
              </div>
            </div>
            <span className={cn(
              'px-4 py-2 rounded-full text-xs font-bold uppercase tracking-wider border w-fit',
              prescription.status === 'Approved' && 'bg-emerald-50 text-emerald-700 border-emerald-100',
              prescription.status === 'Rejected' && 'bg-rose-50 text-rose-700 border-rose-100',
              prescription.status === 'Pending' && 'bg-amber-50 text-amber-700 border-amber-100'
            )}>
              {linkedOrder ? linkedOrder.status : prescription.status}
            </span>
          </div>
        </header>

        {currentStep === -1 ? (
          <section className="pharmacy-panel p-8 border border-rose-100 bg-rose-50/80">
            <div className="flex gap-4">
              <AlertCircle className="w-8 h-8 text-rose-600 shrink-0" />
              <div>
                <h2 className="text-xl font-bold text-rose-900">Prescription Rejected</h2>
                <p className="text-sm text-rose-700 mt-2">{getStatusText(prescription, linkedOrder)}</p>
              </div>
            </div>
          </section>
        ) : (
          <section className="pharmacy-panel p-8 md:p-10">
            <div className="relative flex justify-between gap-3 overflow-x-auto pb-2">
              <div className="absolute top-6 left-0 right-0 h-1 bg-[#e6f0f4] z-0" />
              <motion.div
                initial={false}
                animate={{ width: `${progressWidth}%` }}
                className="absolute top-6 left-0 h-1 bg-accent-green z-0 transition-all duration-700"
              />
              {PRESCRIPTION_STAGES.map((stage) => {
                const isCompleted = currentStep > stage.step;
                const isCurrent = currentStep === stage.step;

                return (
                  <div key={stage.id} className="relative z-10 min-w-24 flex flex-col items-center gap-4">
                    <motion.div
                      initial={false}
                      animate={{
                        scale: isCurrent ? 1.12 : 1,
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
                    <p className={cn(
                      'text-center text-xs font-bold uppercase tracking-wider',
                      isCompleted || isCurrent ? 'text-accent-primary' : 'text-secondary-text/80'
                    )}>
                      {stage.label}
                    </p>
                  </div>
                );
              })}
            </div>
          </section>
        )}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <section className="md:col-span-2 pharmacy-panel p-8">
            <h2 className="text-xl font-bold text-primary-text mb-6">Current Status</h2>
            <div className="flex gap-4">
              <div className="w-12 h-12 bg-[#e8f7f5] rounded-2xl flex items-center justify-center text-accent-primary shrink-0">
                {linkedOrder ? <Truck className="w-6 h-6" /> : <Package className="w-6 h-6" />}
              </div>
              <div>
                <p className="font-bold text-primary-text">{getStatusText(prescription, linkedOrder)}</p>
                <p className="text-sm text-secondary-text mt-2">
                  This page refreshes automatically every 15 seconds. Once the pharmacy creates the order, delivery updates will appear here.
                </p>
              </div>
            </div>

            {linkedOrder && (
              <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-4 bg-[#eff6f9] rounded-2xl">
                  <p className="text-xs font-bold text-secondary-text uppercase tracking-wider mb-1">Order</p>
                  <p className="font-bold text-primary-text">{linkedOrder.orderId || linkedOrder._id}</p>
                </div>
                <div className="p-4 bg-[#eff6f9] rounded-2xl">
                  <p className="text-xs font-bold text-secondary-text uppercase tracking-wider mb-1">Total</p>
                  <p className="font-bold text-primary-text">${Number(linkedOrder.total || 0).toFixed(2)}</p>
                </div>
              </div>
            )}
          </section>

          <section className="pharmacy-panel p-8">
            <h2 className="text-xl font-bold text-primary-text mb-6">Details</h2>
            <div className="space-y-5">
              <div className="flex gap-3">
                <FileText className="w-5 h-5 text-accent-primary shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-bold text-primary-text">Prescription Uploaded</p>
                  <p className="text-xs text-secondary-text">{formatDate(prescription.createdAt)}</p>
                </div>
              </div>
              {prescription.verifiedAt && (
                <div className="flex gap-3">
                  <ShieldCheck className="w-5 h-5 text-accent-primary shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-bold text-primary-text">Approved</p>
                    <p className="text-xs text-secondary-text">{formatDate(prescription.verifiedAt)}</p>
                  </div>
                </div>
              )}
              {linkedOrder?.address && (
                <div className="flex gap-3">
                  <MapPin className="w-5 h-5 text-accent-primary shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-bold text-primary-text">Delivery Address</p>
                    <p className="text-xs text-secondary-text">{linkedOrder.address}</p>
                  </div>
                </div>
              )}
            </div>
          </section>
        </div>

        {error && <p className="text-sm text-rose-600">{error}</p>}
      </div>
    </div>
  );
};

export default PrescriptionTracking;
