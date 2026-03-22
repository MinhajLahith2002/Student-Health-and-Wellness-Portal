import React from 'react';
import { 
  ClipboardList, 
  Package, 
  AlertTriangle, 
  Clock, 
  CheckCircle2, 
  ChevronRight, 
  Search, 
  Bell, 
  User,
  ArrowUpRight,
  TrendingUp,
  Activity
} from 'lucide-react';
import { motion } from 'motion/react';
import { Link, useNavigate } from 'react-router-dom';
import { MOCK_PRESCRIPTIONS, MOCK_ORDERS, MOCK_MEDICINES } from '../../../constants/mockPharmacyData';
import { cn } from '../../../lib/utils';

const PharmacistDashboard = () => {
  const navigate = useNavigate();

  const pendingPrescriptions = MOCK_PRESCRIPTIONS.filter(p => p.status === "PENDING");
  const ordersToProcess = MOCK_ORDERS.filter(o => o.status === "PENDING" || o.status === "VERIFIED");
  const lowStockItems = MOCK_MEDICINES.filter(m => m.stock <= m.reorderLevel);

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

  return (
    <div className="min-h-screen bg-slate-50 pb-20">
      {/* Top Navigation */}
      <div className="bg-white border-b border-slate-200 px-8 py-4 sticky top-0 z-30">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
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
                placeholder="Search orders, students..."
                className="pl-10 pr-4 py-2 bg-slate-100 border-none rounded-xl text-sm focus:ring-2 focus:ring-emerald-500 transition-all w-64"
              />
            </div>
            <button className="relative p-2 text-slate-400 hover:text-emerald-600 transition-colors">
              <Bell className="w-6 h-6" />
              <span className="absolute top-2 right-2 w-2 h-2 bg-rose-500 rounded-full border-2 border-white" />
            </button>
            <div className="flex items-center gap-3 pl-6 border-l border-slate-200">
              <div className="text-right hidden sm:block">
                <p className="text-sm font-bold text-slate-900">Dr. Sarah Wilson</p>
                <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Chief Pharmacist</p>
              </div>
              <div className="w-10 h-10 bg-slate-100 rounded-full flex items-center justify-center text-slate-400 border border-slate-200">
                <User className="w-6 h-6" />
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-8 py-10 space-y-10">
        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {stats.map((stat, i) => (
            <motion.div 
              key={i}
              whileHover={{ y: -4 }}
              onClick={() => navigate(stat.to)}
              className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm hover:shadow-xl transition-all cursor-pointer group"
            >
              <div className="flex justify-between items-start mb-6">
                <div className={cn(
                  "w-14 h-14 rounded-2xl flex items-center justify-center transition-colors",
                  `bg-${stat.color}-50 text-${stat.color}-600 group-hover:bg-${stat.color}-600 group-hover:text-white`
                )}>
                  <stat.icon className="w-7 h-7" />
                </div>
                <div className="flex items-center gap-1 text-emerald-600 font-bold text-xs bg-emerald-50 px-2 py-1 rounded-full">
                  <TrendingUp className="w-3 h-3" /> +12%
                </div>
              </div>
              <p className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-1">{stat.label}</p>
              <h3 className="text-4xl font-bold text-slate-900">{stat.value}</h3>
            </motion.div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
          {/* Recent Orders Table */}
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
                    {MOCK_ORDERS.slice(0, 5).map((order) => (
                      <tr key={order.id} className="hover:bg-slate-50 transition-colors group">
                        <td className="px-8 py-5">
                          <span className="font-bold text-slate-900">{order.id}</span>
                          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mt-0.5">
                            {new Date(order.date).toLocaleDateString()}
                          </p>
                        </td>
                        <td className="px-8 py-5">
                          <p className="font-bold text-slate-900">{order.studentName}</p>
                          <p className="text-xs text-slate-500">{order.items.length} Items • ${order.total}</p>
                        </td>
                        <td className="px-8 py-5">
                          <span className={cn(
                            "px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border",
                            order.status === "DELIVERED" ? "bg-emerald-50 text-emerald-700 border-emerald-100" : "bg-amber-50 text-amber-700 border-amber-100"
                          )}>
                            {order.status}
                          </span>
                        </td>
                        <td className="px-8 py-5 text-right">
                          <button 
                            onClick={() => navigate(`/pharmacist/orders`)}
                            className="p-2 bg-slate-100 text-slate-400 rounded-lg hover:bg-emerald-600 hover:text-white transition-all"
                          >
                            <ArrowUpRight className="w-5 h-5" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          </div>

          {/* Sidebar Alerts & Queue */}
          <div className="space-y-8">
            {/* Low Stock Alerts */}
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
                {lowStockItems.map((item) => (
                  <div key={item.id} className="p-4 bg-slate-50 rounded-2xl border border-slate-100 flex items-center justify-between group">
                    <div>
                      <p className="font-bold text-slate-900 text-sm">{item.name}</p>
                      <p className="text-xs text-slate-500">Stock: <span className="text-rose-500 font-bold">{item.stock}</span> / {item.reorderLevel}</p>
                    </div>
                    <button className="p-2 bg-white text-emerald-600 rounded-lg shadow-sm hover:bg-emerald-600 hover:text-white transition-all">
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
              <button 
                onClick={() => navigate('/pharmacist/inventory')}
                className="w-full mt-6 py-3 bg-slate-900 text-white rounded-xl font-bold text-sm hover:bg-slate-800 transition-all"
              >
                Manage Inventory
              </button>
            </section>

            {/* Prescription Queue */}
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
                {pendingPrescriptions.map((p) => (
                  <div key={p.id} className="p-4 bg-slate-50 rounded-2xl border border-slate-100 flex items-center gap-4">
                    <div className="w-12 h-12 bg-white rounded-xl overflow-hidden shadow-sm shrink-0">
                      <img src={p.imageUrl} alt="Prescription" className="w-full h-full object-cover" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-slate-900 text-sm truncate">{p.studentName}</p>
                      <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Uploaded 5m ago</p>
                    </div>
                    <button 
                      onClick={() => navigate('/pharmacist/prescriptions')}
                      className="p-2 text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors"
                    >
                      <ChevronRight className="w-5 h-5" />
                    </button>
                  </div>
                ))}
              </div>
              <button 
                onClick={() => navigate('/pharmacist/prescriptions')}
                className="w-full mt-6 py-3 bg-emerald-600 text-white rounded-xl font-bold text-sm hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-100"
              >
                Open Queue
              </button>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
};

const Plus = ({ className }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
  </svg>
);

export default PharmacistDashboard;