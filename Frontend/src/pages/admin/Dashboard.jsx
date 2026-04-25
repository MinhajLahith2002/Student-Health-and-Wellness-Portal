import React, { useState, useEffect } from 'react';
import { Users, Calendar, ShoppingBag, MessageSquare, Activity, ArrowUpRight, ArrowDownRight, TrendingUp, Clock, AlertCircle, ChevronRight, MoreVertical, Package, ClipboardList, Video, Loader2 } from 'lucide-react';
import { AreaChart, Area, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { motion } from 'motion/react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { apiFetch } from '../../lib/api';

const AREA_DATA = [
  {name:'Jan',v:400},{name:'Feb',v:300},{name:'Mar',v:520},{name:'Apr',v:278},{name:'May',v:480},{name:'Jun',v:390},{name:'Jul',v:560}
];
const BAR_DATA = [
  {name:'Mon',v:45},{name:'Tue',v:52},{name:'Wed',v:48},{name:'Thu',v:61},{name:'Fri',v:55},{name:'Sat',v:42},{name:'Sun',v:38}
];
const FALLBACK_STATS = [
  {label:'Total Users',value:'—',trend:'+12.5%',up:true,icon:Users,color:'#3A86A8'},
  {label:'Appointments Today',value:'—',trend:'+8.2%',up:true,icon:Calendar,color:'#2ECC71'},
  {label:'Pending Orders',value:'—',trend:'-2.4%',up:false,icon:ShoppingBag,color:'#F39C12'},
  {label:'New Messages',value:'—',trend:'+15.3%',up:true,icon:MessageSquare,color:'#9B59B6'},
  {label:'Active Sessions',value:'—',trend:'+5.1%',up:true,icon:Activity,color:'#3498DB'},
];
const ALERTS = [
  {title:'Low Stock: Paracetamol',level:'warning',time:'10m ago'},
  {title:'Server Load High (85%)',level:'error',time:'25m ago'},
  {title:'New Counselor Application',level:'info',time:'1h ago'},
];

const Tip = ({active,payload,label}) => {
  if(!active||!payload?.length) return null;
  return <div className="px-3 py-2 rounded-xl text-xs font-semibold" style={{background:'var(--surface2)',border:'1px solid var(--border)',color:'var(--text)',boxShadow:'var(--shadow-md)'}}><p style={{color:'var(--text2)'}}>{label}</p><p style={{color:'var(--primary)'}}>{payload[0].value}</p></div>;
};

const PharmacistDash = ({user}) => (
  <div className="space-y-6">
    <div><h1 className="page-title">Pharmacist Dashboard</h1><p className="page-sub">Welcome, {user?.name}.</p></div>
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {[{label:'Pending Prescriptions',icon:ClipboardList,to:'/pharmacist/prescriptions',color:'#2ECC71'},{label:'Orders to Process',icon:ShoppingBag,to:'/pharmacist/orders',color:'#3A86A8'},{label:'Inventory',icon:Package,to:'/pharmacist/inventory',color:'#F39C12'}].map((item,i)=>(
        <motion.div key={i} initial={{opacity:0,y:16}} animate={{opacity:1,y:0}} transition={{delay:i*.08}}>
          <Link to={item.to} className="card block p-6">
            <div className="w-12 h-12 rounded-xl flex items-center justify-center mb-4" style={{background:item.color+'18'}}><item.icon className="w-6 h-6" style={{color:item.color}}/></div>
            <p className="font-bold" style={{color:'var(--text)'}}>{item.label}</p>
            <p className="text-sm mt-1 flex items-center gap-1" style={{color:'var(--text3)'}}>Go to section<ChevronRight className="w-3 h-3"/></p>
          </Link>
        </motion.div>
      ))}
    </div>
  </div>
);

const DoctorDash = ({user}) => (
  <div className="space-y-6">
    <div><h1 className="page-title">Doctor Portal</h1><p className="page-sub">Welcome, Dr. {user?.name}.</p></div>
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {[{label:"Today's Appointments",icon:Calendar,to:'/doctor/appointments',color:'#3A86A8'},{label:'Patient Records',icon:Users,to:'/doctor/patients',color:'#9B59B6'},{label:'Consultation Room',icon:Video,to:'/doctor/consultation',color:'#2ECC71'}].map((item,i)=>(
        <motion.div key={i} initial={{opacity:0,y:16}} animate={{opacity:1,y:0}} transition={{delay:i*.08}}>
          <Link to={item.to} className="card block p-6">
            <div className="w-12 h-12 rounded-xl flex items-center justify-center mb-4" style={{background:item.color+'18'}}><item.icon className="w-6 h-6" style={{color:item.color}}/></div>
            <p className="font-bold" style={{color:'var(--text)'}}>{item.label}</p>
            <p className="text-sm mt-1 flex items-center gap-1" style={{color:'var(--text3)'}}>Go to section<ChevronRight className="w-3 h-3"/></p>
          </Link>
        </motion.div>
      ))}
    </div>
  </div>
);

const AdminDashboard = () => {
  const {user} = useAuth();
  const [stats, setStats] = useState(FALLBACK_STATS);
  const [activity, setActivity] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(()=>{
    if(user?.role!=='admin') { setLoading(false); return; }
    (async()=>{
      try {
        const data = await apiFetch('/dashboard/admin');
        if(data?.stats) {
          setStats([
            {label:'Total Users',value:data.stats.totalUsers?.toLocaleString()||'—',trend:'+12.5%',up:true,icon:Users,color:'#3A86A8'},
            {label:'Appointments Today',value:data.stats.todayAppointments?.toString()||'—',trend:'+8.2%',up:true,icon:Calendar,color:'#2ECC71'},
            {label:'Pending Orders',value:data.stats.pendingOrders?.toString()||'—',trend:'-2.4%',up:false,icon:ShoppingBag,color:'#F39C12'},
            {label:'New Messages',value:data.stats.newMessages?.toString()||'—',trend:'+15.3%',up:true,icon:MessageSquare,color:'#9B59B6'},
            {label:'Active Sessions',value:data.stats.activeSessions?.toString()||'—',trend:'+5.1%',up:true,icon:Activity,color:'#3498DB'},
          ]);
        }
        if(data?.recentActivity) setActivity(data.recentActivity);
      } catch(e){ /* use fallback */ }
      finally { setLoading(false); }
    })();
  },[user]);

  if(user?.role==='pharmacist') return <PharmacistDash user={user}/>;
  if(user?.role==='doctor') return <DoctorDash user={user}/>;

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="page-title">Super <span className="grad-text">Dashboard</span></h1>
          <p className="page-sub">Welcome back, {user?.name||'Admin'}. Here's what's happening.</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium" style={{background:'var(--surface)',border:'1px solid var(--border)',color:'var(--text2)'}}>
            <Clock className="w-4 h-4"/>Updated just now
          </div>
          <Link to="/admin/reports" className="btn btn-primary"><TrendingUp className="w-4 h-4"/>Generate Report</Link>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        {stats.map((s,i)=>(
          <motion.div key={i} initial={{opacity:0,y:16}} animate={{opacity:1,y:0}} transition={{delay:i*.07}} className="card-stat">
            <div className="flex justify-between items-start mb-4">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{background:s.color+'18'}}>
                <s.icon className="w-5 h-5" style={{color:s.color}}/>
              </div>
              <span className={s.up?'trend-up':'trend-dn'}>
                {s.up?<ArrowUpRight className="w-3 h-3"/>:<ArrowDownRight className="w-3 h-3"/>}{s.trend}
              </span>
            </div>
            <p className="text-xs font-bold uppercase tracking-widest mb-1" style={{color:'var(--text3)'}}>{s.label}</p>
            {loading?<div className="h-8 w-16 rounded animate-pulse" style={{background:'var(--surface2)'}}/>
            :<p className="text-2xl font-extrabold" style={{color:'var(--text)',letterSpacing:'-0.04em'}}>{s.value}</p>}
          </motion.div>
        ))}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 card p-6">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h3 className="font-bold" style={{color:'var(--text)',letterSpacing:'-0.02em'}}>Platform Growth</h3>
              <p className="text-xs mt-0.5" style={{color:'var(--text3)'}}>User signups over 7 months</p>
            </div>
            <select className="input text-xs py-1.5 px-3" style={{width:'auto'}}>
              <option>Last 7 months</option><option>Last 12 months</option>
            </select>
          </div>
          <div style={{height:220}}>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={AREA_DATA}>
                <defs><linearGradient id="grad" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="var(--primary)" stopOpacity={0.2}/><stop offset="95%" stopColor="var(--primary)" stopOpacity={0}/></linearGradient></defs>
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill:'var(--text3)',fontSize:11,fontWeight:600}} dy={8}/>
                <YAxis axisLine={false} tickLine={false} tick={{fill:'var(--text3)',fontSize:11,fontWeight:600}}/>
                <Tooltip content={<Tip/>}/>
                <Area type="monotone" dataKey="v" stroke="var(--primary)" strokeWidth={2} fillOpacity={1} fill="url(#grad)"/>
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
        <div className="card p-6">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h3 className="font-bold" style={{color:'var(--text)',letterSpacing:'-0.02em'}}>Appointments</h3>
              <p className="text-xs mt-0.5" style={{color:'var(--text3)'}}>This week</p>
            </div>
            <button className="icon-btn"><MoreVertical className="w-4 h-4"/></button>
          </div>
          <div style={{height:220}}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={BAR_DATA}>
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill:'var(--text3)',fontSize:11,fontWeight:600}} dy={8}/>
                <Tooltip content={<Tip/>} cursor={{fill:'var(--surface2)'}}/>
                <Bar dataKey="v" fill="var(--primary)" radius={[6,6,0,0]} maxBarSize={28}/>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Bottom */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 card overflow-hidden">
          <div className="p-5 flex justify-between items-center" style={{borderBottom:'1px solid var(--border2)'}}>
            <h3 className="font-bold" style={{color:'var(--text)'}}>Recent Activity</h3>
            <button className="text-xs font-bold" style={{color:'var(--primary)'}}>View All</button>
          </div>
          {activity.length>0 ? activity.slice(0,5).map((a,i)=>(
            <div key={i} className="px-5 py-4 flex items-center justify-between transition-colors"
              style={{borderBottom:i<4?'1px solid var(--border2)':'none'}}
              onMouseEnter={e=>e.currentTarget.style.background='var(--surface2)'}
              onMouseLeave={e=>e.currentTarget.style.background='transparent'}>
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{background:'var(--primary-s)'}}><Activity className="w-3.5 h-3.5" style={{color:'var(--primary)'}}/></div>
                <div>
                  <p className="text-sm font-medium" style={{color:'var(--text)'}}>{a.description||a.action}</p>
                  <p className="text-xs mt-0.5" style={{color:'var(--text3)'}}>{a.time||new Date(a.createdAt).toLocaleString()}</p>
                </div>
              </div>
              <ChevronRight className="w-4 h-4" style={{color:'var(--text3)'}}/>
            </div>
          )) : (
            [['Dr. Sarah Smith','joined the platform','2m ago'],['Order #8294','has been shipped','15m ago'],['Mental Health Workshop','created by Admin','1h ago'],['John Doe','submitted feedback','2h ago'],['Server Backup','completed successfully','5h ago']].map(([u,a,t],i,arr)=>(
              <div key={i} className="px-5 py-4 flex items-center justify-between transition-colors"
                style={{borderBottom:i<arr.length-1?'1px solid var(--border2)':'none'}}
                onMouseEnter={e=>e.currentTarget.style.background='var(--surface2)'}
                onMouseLeave={e=>e.currentTarget.style.background='transparent'}>
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{background:'var(--primary-s)'}}><Activity className="w-3.5 h-3.5" style={{color:'var(--primary)'}}/></div>
                  <div>
                    <p className="text-sm font-medium" style={{color:'var(--text)'}}><span style={{color:'var(--primary)'}}>{u}</span> {a}</p>
                    <p className="text-xs mt-0.5" style={{color:'var(--text3)'}}>{t}</p>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4" style={{color:'var(--text3)'}}/>
              </div>
            ))
          )}
        </div>
        <div className="card overflow-hidden">
          <div className="p-5 flex justify-between items-center" style={{borderBottom:'1px solid var(--border2)'}}>
            <h3 className="font-bold" style={{color:'var(--text)'}}>Alerts</h3>
            <span className="badge badge-danger">{ALERTS.length} Active</span>
          </div>
          <div className="p-4 space-y-3">
            {ALERTS.map((a,i)=>(
              <div key={i} className="flex items-start gap-3 p-3 rounded-xl"
                style={{background:a.level==='error'?'var(--danger-s)':a.level==='warning'?'var(--warning-s)':'var(--primary-s)',border:`1px solid ${a.level==='error'?'var(--danger)':a.level==='warning'?'var(--warning)':'var(--primary)'}22`}}>
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" style={{color:a.level==='error'?'var(--danger)':a.level==='warning'?'var(--warning)':'var(--primary)'}}/>
                <div>
                  <p className="text-sm font-semibold" style={{color:'var(--text)'}}>{a.title}</p>
                  <p className="text-xs mt-0.5" style={{color:'var(--text3)'}}>{a.time}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
export default AdminDashboard;
