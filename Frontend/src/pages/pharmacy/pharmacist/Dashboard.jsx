import React, { useEffect, useMemo, useState } from 'react';
import {
  ClipboardList,
  Package,
  AlertTriangle,
  ChevronRight,
  Search,
  Bell,
  User,
  ArrowUpRight,
  TrendingUp,
  Activity,
  Loader2,
  Phone,
  CheckCircle2
} from 'lucide-react';
import { motion } from 'motion/react';
import { Link, useNavigate } from 'react-router-dom';
import { apiFetch } from '../../../lib/api';
import { cn } from '../../../lib/utils';

const statStyles = {
  emerald: {
    icon: 'bg-emerald-50 text-emerald-600 group-hover:bg-emerald-600 group-hover:text-white',
    chip: 'bg-emerald-50 text-emerald-700'
  },
  blue: {
    icon: 'bg-blue-50 text-blue-600 group-hover:bg-blue-600 group-hover:text-white',
    chip: 'bg-blue-50 text-blue-700'
  },
  amber: {
    icon: 'bg-amber-50 text-amber-600 group-hover:bg-amber-600 group-hover:text-white',
    chip: 'bg-amber-50 text-amber-700'
  }
};

const statusStyles = {
  Pending: 'bg-amber-50 text-amber-700 border-amber-100',
  Verified: 'bg-amber-50 text-amber-700 border-amber-100',
  Packed: 'bg-blue-50 text-blue-700 border-blue-100',
  Dispatched: 'bg-sky-50 text-sky-700 border-sky-100',
  Delivered: 'bg-emerald-50 text-emerald-700 border-emerald-100',
  Rejected: 'bg-rose-50 text-rose-700 border-rose-100',
  Approved: 'bg-emerald-50 text-emerald-700 border-emerald-100'
};

function getDisplayName(profile) {
  const rawName = (profile?.name || '').trim();
  if (!rawName) return 'Pharmacist';
  return profile?.role === 'doctor' ? rawName : rawName.replace(/^dr\.?\s+/i, '');
}

const PharmacistDashboard = () => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [profile, setProfile] = useState(null);
  const [pendingPrescriptions, setPendingPrescriptions] = useState([]);
  const [recentOrders, setRecentOrders] = useState([]);
  const [lowStockItems, setLowStockItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;

    const loadDashboard = async ({ silent = false } = {}) => {
      if (!silent) setLoading(true);
      setError('');
      try {
        const [profileData, prescriptionsData, ordersData, medicinesData] = await Promise.all([
          apiFetch('/users/profile'),
          apiFetch('/prescriptions?status=Pending&limit=10'),
          apiFetch('/orders/all?limit=10'),
          apiFetch('/medicines?limit=200')
        ]);

        if (!active) return;

        const prescriptions = Array.isArray(prescriptionsData?.prescriptions) ? prescriptionsData.prescriptions : [];
        const orders = Array.isArray(ordersData?.orders) ? ordersData.orders : [];
        const medicines = Array.isArray(medicinesData?.medicines) ? medicinesData.medicines : [];

        setProfile(profileData || null);
        setPendingPrescriptions(prescriptions);
        setRecentOrders(orders);
        setLowStockItems(medicines.filter((item) => Number(item.stock) <= Number(item.reorderLevel)));
      } catch (err) {
        if (!active) return;
        setError(err.message || 'Failed to load pharmacist dashboard');
      } finally {
        if (active && !silent) setLoading(false);
      }
    };

    loadDashboard();

    const intervalId = setInterval(() => {
      loadDashboard({ silent: true });
    }, 15000);

    const handleFocus = () => {
      if (document.visibilityState === 'visible') {
        loadDashboard({ silent: true });
      }
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
    const query = searchQuery.trim().toLowerCase();
    if (!query) return recentOrders.slice(0, 5);

    return recentOrders.filter((order) => {
      return [order.orderId, order._id, order.studentName, order.studentEmail]
        .filter(Boolean)
        .some((value) => value.toLowerCase().includes(query));
    }).slice(0, 5);
  }, [recentOrders, searchQuery]);

  const ordersToProcess = useMemo(
    () => recentOrders.filter((order) => ['Pending', 'Verified', 'Packed'].includes(order.status)),
    [recentOrders]
  );

  const stats = [
    {
      label: 'Pending Prescriptions',
      value: pendingPrescriptions.length,
      icon: ClipboardList,
      color: 'emerald',
      to: '/pharmacist/prescriptions'
    },
    {
      label: 'Orders to Process',
      value: ordersToProcess.length,
      icon: Package,
      color: 'blue',
      to: '/pharmacist/orders'
    },
    {
      label: 'Low Stock Items',
      value: lowStockItems.length,
      icon: AlertTriangle,
      color: 'amber',
      to: '/pharmacist/inventory'
    }
  ];

  const displayName = getDisplayName(profile);

  return (
    <div className="min-h-screen bg-slate-50 pb-20">
      <div className="bg-white border-b border-slate-200 px-8 py-4 sticky top-0 z-30">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 bg-emerald-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-emerald-100">
              <Activity className="w-6 h-6" />
            </div>
            <h1 className="text-xl font-bold text-slate-900">Pharmacist Portal</h1>
          </div>
          <div className="flex items-center gap-6">
            <div className="relative hidden md:block">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="Search orders or students..."
                className="pl-10 pr-4 py-2 bg-slate-100 border-none rounded-xl text-sm focus:ring-2 focus:ring-emerald-500 transition-all w-64"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <button className="relative p-2 text-slate-400 hover:text-emerald-600 transition-colors">
              <Bell className="w-6 h-6" />
              {(pendingPrescriptions.length > 0 || ordersToProcess.length > 0) && (
                <span className="absolute top-2 right-2 w-2 h-2 bg-rose-500 rounded-full border-2 border-white" />
              )}
            </button>
            <div className="flex items-center gap-3 pl-6 border-l border-slate-200">
              <div className="text-right hidden sm:block">
                <p className="text-sm font-bold text-slate-900">{displayName}</p>
                <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">{profile?.role || 'Pharmacist'}</p>
              </div>
              <div className="w-10 h-10 bg-slate-100 rounded-full flex items-center justify-center text-slate-400 border border-slate-200 overflow-hidden">
                {profile?.profileImage ? (
                  <img src={profile.profileImage} alt={profile.name} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                ) : (
                  <User className="w-6 h-6" />
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-8 py-10 space-y-10">
        {loading ? (
          <div className="py-24 text-center">
            <Loader2 className="w-8 h-8 text-emerald-600 animate-spin mx-auto mb-4" />
            <p className="text-slate-500 font-medium">Loading pharmacist dashboard...</p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {stats.map((stat) => (
                <motion.div
                  key={stat.label}
                  whileHover={{ y: -4 }}
                  onClick={() => navigate(stat.to)}
                  className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm hover:shadow-xl transition-all cursor-pointer group"
                >
                  <div className="flex justify-between items-start mb-6">
                    <div className={cn('w-14 h-14 rounded-2xl flex items-center justify-center transition-colors', statStyles[stat.color].icon)}>
                      <stat.icon className="w-7 h-7" />
                    </div>
                    <div className={cn('flex items-center gap-1 font-bold text-xs px-2 py-1 rounded-full', statStyles[stat.color].chip)}>
                      <TrendingUp className="w-3 h-3" /> Live
                    </div>
                  </div>
                  <p className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-1">{stat.label}</p>
                  <h3 className="text-4xl font-bold text-slate-900">{stat.value}</h3>
                </motion.div>
              ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
              <div className="lg:col-span-2 space-y-6">
                <section className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
                  <div className="p-8 border-b border-slate-100 flex items-center justify-between">
                    <h2 className="text-xl font-bold text-slate-900">Recent Orders</h2>
                    <Link to="/pharmacist/orders" className="text-emerald-600 font-bold text-sm hover:underline flex items-center">
                      View All <ChevronRight className="w-4 h-4 ml-1" />
                    </Link>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left">
                      <thead>
                        <tr className="bg-slate-50/50">
                          <th className="px-8 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Order ID</th>
                          <th className="px-8 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Student</th>
                          <th className="px-8 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Status</th>
                          <th className="px-8 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest text-right">Action</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {filteredOrders.map((order) => (
                          <tr key={order._id} className="hover:bg-slate-50 transition-colors group">
                            <td className="px-8 py-5">
                              <span className="font-bold text-slate-900">{order.orderId || order._id}</span>
                              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mt-0.5">
                                {new Date(order.createdAt).toLocaleDateString()}
                              </p>
                            </td>
                            <td className="px-8 py-5">
                              <p className="font-bold text-slate-900">{order.studentName}</p>
                              <p className="text-xs text-slate-500">{order.items?.length || 0} Items | ${Number(order.total || 0).toFixed(2)}</p>
                            </td>
                            <td className="px-8 py-5">
                              <span className={cn('px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border', statusStyles[order.status] || 'bg-slate-50 text-slate-700 border-slate-100')}>
                                {order.status}
                              </span>
                            </td>
                            <td className="px-8 py-5 text-right">
                              <button
                                onClick={() => navigate('/pharmacist/orders')}
                                className="p-2 bg-slate-100 text-slate-400 rounded-lg hover:bg-emerald-600 hover:text-white transition-all"
                              >
                                <ArrowUpRight className="w-5 h-5" />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    {filteredOrders.length === 0 && (
                      <div className="px-8 py-12 text-center text-slate-500">No recent orders found.</div>
                    )}
                  </div>
                </section>
              </div>

              <div className="space-y-8">
                <section className="bg-white rounded-3xl border border-slate-200 shadow-sm p-8">
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                      <AlertTriangle className="w-5 h-5 text-amber-500" /> Stock Alerts
                    </h2>
                    <span className="px-2 py-1 bg-amber-50 text-amber-700 text-[10px] font-bold rounded-md">
                      {lowStockItems.length} Items
                    </span>
                  </div>
                  <div className="space-y-4">
                    {lowStockItems.slice(0, 5).map((item) => (
                      <div key={item._id} className="p-4 bg-slate-50 rounded-2xl border border-slate-100 flex items-center justify-between gap-4">
                        <div>
                          <p className="font-bold text-slate-900 text-sm">{item.name}</p>
                          <p className="text-xs text-slate-500">Stock: <span className="text-rose-500 font-bold">{item.stock}</span> / {item.reorderLevel}</p>
                        </div>
                        <button
                          onClick={() => navigate(`/pharmacist/medicines/edit/${item._id}`)}
                          className="p-2 bg-white text-emerald-600 rounded-lg shadow-sm hover:bg-emerald-600 hover:text-white transition-all"
                        >
                          <ArrowUpRight className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                    {lowStockItems.length === 0 && <p className="text-sm text-slate-500">No low stock alerts right now.</p>}
                  </div>
                  <button
                    onClick={() => navigate('/pharmacist/inventory')}
                    className="w-full mt-6 py-3 bg-slate-900 text-white rounded-xl font-bold text-sm hover:bg-slate-800 transition-all"
                  >
                    Manage Inventory
                  </button>
                </section>

                <section className="bg-white rounded-3xl border border-slate-200 shadow-sm p-8">
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                      <ClipboardList className="w-5 h-5 text-emerald-600" /> New Prescriptions
                    </h2>
                    <span className="px-2 py-1 bg-emerald-50 text-emerald-700 text-[10px] font-bold rounded-md">
                      {pendingPrescriptions.length} New
                    </span>
                  </div>
                  <div className="space-y-4">
                    {pendingPrescriptions.slice(0, 5).map((prescription) => (
                      <div key={prescription._id} className="p-4 bg-slate-50 rounded-2xl border border-slate-100 flex items-center gap-4">
                        <div className="w-12 h-12 bg-white rounded-xl overflow-hidden shadow-sm shrink-0 flex items-center justify-center">
                          {prescription.imageUrl ? (
                            <img src={prescription.imageUrl} alt="Prescription" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                          ) : (
                            <ClipboardList className="w-5 h-5 text-slate-300" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-bold text-slate-900 text-sm truncate">{prescription.studentName}</p>
                          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                            Uploaded {new Date(prescription.createdAt).toLocaleString()}
                          </p>
                        </div>
                        <button
                          onClick={() => navigate('/pharmacist/prescriptions')}
                          className="p-2 text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors"
                        >
                          <ChevronRight className="w-5 h-5" />
                        </button>
                      </div>
                    ))}
                    {pendingPrescriptions.length === 0 && <p className="text-sm text-slate-500">No pending prescriptions right now.</p>}
                  </div>
                  <button
                    onClick={() => navigate('/pharmacist/prescriptions')}
                    className="w-full mt-6 py-3 bg-emerald-600 text-white rounded-xl font-bold text-sm hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-100"
                  >
                    Open Queue
                  </button>
                </section>

                <section className="bg-white rounded-3xl border border-slate-200 shadow-sm p-8">
                  <h2 className="text-lg font-bold text-slate-900 mb-4">Quick Contact</h2>
                  <div className="space-y-4 text-sm text-slate-600">
                    <div className="flex items-center gap-3">
                      <User className="w-5 h-5 text-slate-400" />
                      <span>{displayName}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <Phone className="w-5 h-5 text-slate-400" />
                      <span>{profile?.phone || 'Phone not set'}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <CheckCircle2 className="w-5 h-5 text-slate-400" />
                      <span>{profile?.email || 'Email unavailable'}</span>
                    </div>
                  </div>
                </section>
              </div>
            </div>
          </>
        )}

        {error && <p className="text-sm text-rose-600">{error}</p>}
      </div>
    </div>
  );
};

export default PharmacistDashboard;
