import React, { useEffect, useMemo, useState } from 'react';
import {
  Package,
  Search,
  ChevronRight,
  RefreshCcw,
  Truck,
  CheckCircle2,
  XCircle,
  Clock,
  ArrowRight,
  Loader2,
  FileText,
  AlertCircle
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useNavigate, Link } from 'react-router-dom';
import { cn } from '../../../lib/utils';
import { apiFetch, resolveAssetUrl } from '../../../lib/api';

const ORDER_TABS = ['All', 'Ongoing', 'Delivered', 'Cancelled'];
const PRESCRIPTION_TABS = ['All', 'Pending', 'Approved', 'Rejected'];

function getOrderStatusColor(status) {
  switch (status) {
    case 'Delivered':
      return 'bg-[#e8f7f5] text-emerald-700 border-emerald-100';
    case 'Cancelled':
      return 'bg-rose-50 text-rose-700 border-rose-100';
    case 'Pending':
      return 'bg-amber-50 text-amber-700 border-amber-100';
    default:
      return 'bg-[#e8f4f8] text-blue-700 border-blue-100';
  }
}

function getOrderStatusIcon(status) {
  switch (status) {
    case 'Delivered':
      return CheckCircle2;
    case 'Cancelled':
      return XCircle;
    case 'Pending':
      return Clock;
    default:
      return Truck;
  }
}

function getPrescriptionStatusColor(status) {
  switch (status) {
    case 'Approved':
      return 'bg-[#e8f7f5] text-emerald-700 border-emerald-100';
    case 'Rejected':
      return 'bg-rose-50 text-rose-700 border-rose-100';
    default:
      return 'bg-amber-50 text-amber-700 border-amber-100';
  }
}

function getEntityId(value) {
  if (!value) return '';
  if (typeof value === 'string') return value;
  return value._id || value.id || '';
}

const OrderHistory = () => {
  const navigate = useNavigate();
  const [viewMode, setViewMode] = useState('Orders');
  const [activeTab, setActiveTab] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [orders, setOrders] = useState([]);
  const [prescriptions, setPrescriptions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    setActiveTab('All');
  }, [viewMode]);

  useEffect(() => {
    let active = true;

    const loadActivity = async () => {
      setLoading(true);
      setError('');
      try {
        const [ordersData, prescriptionsData] = await Promise.all([
          apiFetch('/orders?limit=200'),
          apiFetch('/prescriptions?limit=200')
        ]);

        if (!active) return;

        setOrders(Array.isArray(ordersData?.orders) ? ordersData.orders : []);
        setPrescriptions(Array.isArray(prescriptionsData?.prescriptions) ? prescriptionsData.prescriptions : []);
      } catch (err) {
        if (!active) return;
        setError(err.message || 'Failed to load pharmacy activity');
      } finally {
        if (active) setLoading(false);
      }
    };

    loadActivity();
    return () => {
      active = false;
    };
  }, []);

  const tabs = viewMode === 'Orders' ? ORDER_TABS : PRESCRIPTION_TABS;

  const filteredOrders = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();

    return orders.filter((order) => {
      const orderType = order.orderType || (order.prescriptionId ? 'Prescription' : 'Direct');
      if (orderType !== 'Direct') return false;

      const matchesTab =
        activeTab === 'All' ||
        (activeTab === 'Ongoing' && !['Delivered', 'Cancelled'].includes(order.status)) ||
        (activeTab === 'Delivered' && order.status === 'Delivered') ||
        (activeTab === 'Cancelled' && order.status === 'Cancelled');

      const matchesSearch =
        !query ||
        (order.orderId || order._id || '').toLowerCase().includes(query) ||
        (order.items || []).some((item) => (item.name || '').toLowerCase().includes(query));

      return matchesTab && matchesSearch;
    });
  }, [orders, activeTab, searchQuery]);

  const filteredPrescriptions = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();

    return prescriptions.filter((prescription) => {
      const matchesTab = activeTab === 'All' || prescription.status === activeTab;
      const matchesSearch =
        !query ||
        (prescription._id || '').toLowerCase().includes(query) ||
        (prescription.notes || '').toLowerCase().includes(query) ||
        (prescription.doctorName || '').toLowerCase().includes(query);

      return matchesTab && matchesSearch;
    });
  }, [prescriptions, activeTab, searchQuery]);

  return (
    <div className="pharmacy-shell pt-28 pb-20 px-6">
      <div className="max-w-5xl mx-auto">
        <header className="mb-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div>
            <h1 className="text-4xl font-bold text-primary-text tracking-tight mb-2">Pharmacy Activity</h1>
            <p className="text-secondary-text">Track your live medicine orders and uploaded prescriptions.</p>
          </div>
          <div className="flex flex-col md:flex-row items-center gap-4 w-full md:w-auto">
            <div className="flex bg-[#e6f0f4] p-1.5 rounded-2xl w-full md:w-auto">
              {['Orders', 'Prescriptions'].map((mode) => (
                <button
                  key={mode}
                  onClick={() => setViewMode(mode)}
                  className={cn(
                    'px-6 py-2 rounded-xl text-sm font-bold transition-all whitespace-nowrap',
                    viewMode === mode ? 'bg-white text-accent-primary shadow-sm' : 'text-secondary-text hover:text-slate-700'
                  )}
                >
                  {mode}
                </button>
              ))}
            </div>
            <div className="relative w-full md:w-72">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-secondary-text/80" />
              <input
                type="text"
                placeholder={`Search ${viewMode.toLowerCase()}...`}
                className="w-full pl-12 pr-4 py-3 bg-white border border-slate-200 rounded-2xl text-sm focus:ring-2 focus:ring-accent-primary focus:border-accent-primary transition-all shadow-sm"
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
              />
            </div>
          </div>
        </header>

        <div className="flex border-b border-slate-200 mb-8 overflow-x-auto no-scrollbar">
          {tabs.map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={cn(
                'px-8 py-4 text-sm font-bold uppercase tracking-wider transition-all relative whitespace-nowrap',
                activeTab === tab ? 'text-accent-primary' : 'text-secondary-text/80 hover:text-secondary-text'
              )}
            >
              {tab}
              {activeTab === tab && (
                <motion.div
                  layoutId="activeOrderTab"
                  className="absolute bottom-0 left-0 right-0 h-0.5 bg-accent-primary"
                />
              )}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="text-center py-20 bg-white rounded-3xl border border-slate-200 border-dashed">
            <Loader2 className="w-8 h-8 text-accent-primary animate-spin mx-auto mb-4" />
            <p className="text-secondary-text font-medium">Loading pharmacy activity...</p>
          </div>
        ) : (
          <div className="space-y-6">
            <AnimatePresence mode="popLayout">
              {viewMode === 'Orders'
                ? filteredOrders.map((order) => {
                    const StatusIcon = getOrderStatusIcon(order.status);

                    return (
                      <motion.div
                        layout
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        key={order._id}
                        className="pharmacy-panel overflow-hidden hover:shadow-md transition-all group"
                      >
                        <div className="p-6 md:p-8 flex flex-col md:flex-row md:items-center justify-between gap-6">
                          <div className="flex items-start gap-6">
                            <div className={cn('w-16 h-16 rounded-2xl flex items-center justify-center shrink-0', getOrderStatusColor(order.status).split(' ')[0])}>
                              <Package className="w-8 h-8" />
                            </div>
                            <div>
                              <div className="flex items-center gap-3 mb-1 flex-wrap">
                                <h3 className="text-lg font-bold text-primary-text">Order {order.orderId || order._id}</h3>
                                <span className={cn('px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border', getOrderStatusColor(order.status))}>
                                  <StatusIcon className="w-3 h-3 inline mr-1 -mt-0.5" /> {order.status}
                                </span>
                              </div>
                              <p className="text-sm text-secondary-text mb-4">
                                Placed on {new Date(order.createdAt).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
                              </p>
                              <div className="flex flex-wrap gap-2">
                                {(order.items || []).slice(0, 4).map((item, index) => (
                                  <span key={`${order._id}-${index}`} className="inline-flex items-center px-3 py-1.5 bg-[#eff6f9] rounded-full text-xs font-semibold text-secondary-text">
                                    {item.name} x{item.quantity}
                                  </span>
                                ))}
                              </div>
                            </div>
                          </div>

                          <div className="flex flex-col items-end gap-4">
                            <div className="text-right">
                              <p className="text-xs font-bold text-secondary-text/80 uppercase tracking-wider mb-1">Total Amount</p>
                              <p className="text-2xl font-bold text-primary-text">${Number(order.total || 0).toFixed(2)}</p>
                            </div>
                            <div className="flex gap-3 w-full md:w-auto">
                              <button
                                onClick={() => navigate('/student/pharmacy/products')}
                                className="flex-1 md:flex-none px-6 py-3 bg-[#eff6f9] text-primary-text rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-[#e6f0f4] transition-all border border-slate-100"
                              >
                                <RefreshCcw className="w-4 h-4 text-accent-primary" /> Reorder
                              </button>
                              <Link
                                to={`/student/pharmacy/order/${order._id}`}
                                className="flex-1 md:flex-none px-6 py-3 bg-accent-primary text-white rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-[#105f72] transition-all shadow-lg shadow-cyan-100"
                              >
                                Track <ChevronRight className="w-4 h-4" />
                              </Link>
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    );
                  })
                : filteredPrescriptions.map((prescription) => {
                    const linkedOrder = orders.find((order) => getEntityId(order.prescriptionId) === prescription._id);
                    const prescriptionTitle = linkedOrder ? `Order ${linkedOrder.orderId || linkedOrder._id}` : 'Prescription';

                    return (
                    <motion.div
                      layout
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      key={prescription._id}
                      className="pharmacy-panel overflow-hidden hover:shadow-md transition-all group p-6 md:p-8"
                    >
                      <div className="flex flex-col md:flex-row justify-between gap-6">
                        <div className="flex gap-6">
                          <div className="w-20 h-28 bg-[#e6f0f4] rounded-2xl overflow-hidden shadow-inner border border-slate-200 relative shrink-0 flex items-center justify-center">
                            {prescription.fileMimeType === 'application/pdf' ? (
                              <FileText className="w-10 h-10 text-accent-primary" />
                            ) : resolveAssetUrl(prescription.imageUrl) ? (
                              <img src={resolveAssetUrl(prescription.imageUrl)} alt="Prescription" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                            ) : (
                              <FileText className="w-10 h-10 text-slate-300" />
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-3 mb-2 flex-wrap">
                              <h3 className="text-xl font-bold text-primary-text truncate">{prescriptionTitle}</h3>
                              <span className={cn('px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border', getPrescriptionStatusColor(prescription.status))}>
                                {prescription.status}
                              </span>
                            </div>
                            <p className="text-sm text-secondary-text mb-4 line-clamp-2 italic">
                              "{prescription.notes || 'No notes provided'}"
                            </p>
                            <div className="flex items-center gap-4 text-xs font-bold text-secondary-text/80 flex-wrap">
                              <span className="flex items-center gap-1.5 uppercase tracking-widest">
                                <Clock className="w-3.5 h-3.5" /> {new Date(prescription.createdAt).toLocaleDateString()}
                              </span>
                              {prescription.doctorName && (
                                <span className="uppercase tracking-widest">Doctor: {prescription.doctorName}</span>
                              )}
                            </div>
                          </div>
                        </div>

                        <div className="flex flex-col md:items-end justify-center gap-4">
                          {prescription.status === 'Approved' ? (
                            <div className="space-y-3 w-full">
                              <p className="text-xs font-bold text-accent-primary uppercase tracking-widest text-center md:text-right">
                                {linkedOrder ? 'Approved and order created' : 'Approved - waiting for pharmacy order'}
                              </p>
                              <Link
                                to={linkedOrder ? `/student/pharmacy/order/${linkedOrder._id}` : `/student/pharmacy/prescription/${prescription._id}/track`}
                                className="w-full px-8 py-4 bg-accent-primary text-white rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-[#105f72] transition-all shadow-lg shadow-cyan-100"
                              >
                                Track Order <ChevronRight className="w-4 h-4" />
                              </Link>
                            </div>
                          ) : prescription.status === 'Rejected' ? (
                            <div className="p-4 bg-rose-50 rounded-2xl border border-rose-100 max-w-xs">
                              <p className="text-xs font-bold text-rose-900 mb-1 flex items-center gap-1.5">
                                <XCircle className="w-3 h-3" /> Rejection Reason
                              </p>
                              <p className="text-[10px] text-rose-700 italic">{prescription.rejectionReason || 'The pharmacist rejected this prescription.'}</p>
                            </div>
                          ) : (
                            <div className="p-4 bg-amber-50 rounded-2xl border border-amber-100 max-w-xs">
                              <p className="text-xs font-bold text-amber-900 flex items-center gap-2">
                                <AlertCircle className="w-3 h-3" /> Verification in progress...
                              </p>
                              <p className="text-[10px] text-amber-700 mt-1">Our pharmacists are reviewing your document.</p>
                            </div>
                          )}
                        </div>
                      </div>
                    </motion.div>
                    );
                  })}
            </AnimatePresence>

            {(viewMode === 'Orders' ? filteredOrders : filteredPrescriptions).length === 0 && (
              <div className="text-center py-20 bg-white rounded-3xl border border-slate-200 border-dashed">
                <div className="w-20 h-20 bg-[#eff6f9] rounded-full flex items-center justify-center mx-auto mb-6">
                  {viewMode === 'Orders' ? <Package className="w-10 h-10 text-slate-200" /> : <FileText className="w-10 h-10 text-slate-200" />}
                </div>
                <h2 className="text-2xl font-bold text-primary-text mb-2">No {viewMode.toLowerCase()} found</h2>
                <p className="text-secondary-text">You have no {viewMode.toLowerCase()} in this category yet.</p>
                <Link
                  to={viewMode === 'Orders' ? '/student/pharmacy/products' : '/student/pharmacy/upload-prescription'}
                  className="mt-6 inline-flex items-center text-accent-primary font-bold hover:underline"
                >
                  {viewMode === 'Orders' ? 'Start Shopping' : 'Upload Prescription'} <ArrowRight className="ml-2 w-4 h-4" />
                </Link>
              </div>
            )}
          </div>
        )}

        {error && <p className="mt-6 text-sm text-rose-600">{error}</p>}
      </div>
    </div>
  );
};

export default OrderHistory;
