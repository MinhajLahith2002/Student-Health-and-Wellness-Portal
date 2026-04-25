import React, { useState, useEffect } from 'react';
import { BarChart3, Download, FileText, Loader2, RefreshCw, Users, Calendar, ShoppingBag, TrendingUp } from 'lucide-react';
import { apiFetch } from '../../lib/api';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

const REPORT_TYPES = [
  { id:'users',        label:'User Report',        icon:Users,      color:'#3A86A8', desc:'Users, roles, registration trends' },
  { id:'appointments', label:'Appointments',        icon:Calendar,   color:'#2ECC71', desc:'Appointment stats & doctor utilization' },
  { id:'pharmacy',     label:'Pharmacy Report',    icon:ShoppingBag,color:'#F39C12', desc:'Orders, inventory, prescription stats' },
  { id:'system',       label:'System Overview',    icon:BarChart3,  color:'#9B59B6', desc:'Platform health & API usage' },
];

const AREA_DATA = [{name:'Jan',v:400},{name:'Feb',v:300},{name:'Mar',v:520},{name:'Apr',v:278},{name:'May',v:480},{name:'Jun',v:390},{name:'Jul',v:560}];
const PIE_DATA  = [{name:'Students',value:68},{name:'Doctors',value:12},{name:'Pharmacists',value:8},{name:'Others',value:12}];
const PIE_COLS  = ['#3A86A8','#2ECC71','#F39C12','#9B59B6'];

const Tip = ({active,payload,label}) => {
  if(!active||!payload?.length) return null;
  return <div className="px-3 py-2 rounded-xl text-xs font-semibold" style={{background:'var(--surface2)',border:'1px solid var(--border)',color:'var(--text)'}}><p style={{color:'var(--text2)'}}>{label}</p><p style={{color:'var(--primary)'}}>{payload[0].value}</p></div>;
};

const ReportsGenerator = () => {
  const [selected, setSelected] = useState('users');
  const [loading, setLoading] = useState(false);
  const [pdfLoading, setPdfLoading] = useState(false);
  const [stats, setStats] = useState(null);

  const loadStats = () => {
    setLoading(true);
    apiFetch('/dashboard/admin').then(d=>setStats(d?.stats||d)).catch(()=>{}).finally(()=>setLoading(false));
  };

  useEffect(()=>{ loadStats(); },[]);

  const handleDownloadPDF = async () => {
    setPdfLoading(true);
    try {
      // Show PDF header temporarily
      const header = document.getElementById('pdf-header');
      if (header) header.style.display = 'block';

      if (!window.html2pdf) {
        await new Promise((resolve, reject) => {
          const script = document.createElement('script');
          script.src = 'https://cdnjs.cloudflare.com/ajax/libs/html2pdf.js/0.10.1/html2pdf.bundle.min.js';
          script.onload = resolve;
          script.onerror = () => reject(new Error('Failed to load PDF library'));
          document.head.appendChild(script);
        });
      }

      const element = document.getElementById('report-content');
      const reportLabel = REPORT_TYPES.find(r=>r.id===selected)?.label || selected;
      const dateStr = new Date().toLocaleDateString('en-GB').replace(/\//g,'-');
      const filename = `CampusHealth_${reportLabel.replace(/\s+/g,'_')}_${dateStr}.pdf`;

      await window.html2pdf().set({
        margin: [12, 12, 12, 12],
        filename,
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { scale: 2, useCORS: true, backgroundColor: '#ffffff', logging: false },
        jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' },
        pagebreak: { mode: 'avoid-all' },
      }).from(element).save();

    } catch(err) {
      console.error('PDF error:', err);
      // Fallback: print dialog
      window.print();
    } finally {
      const header = document.getElementById('pdf-header');
      if (header) header.style.display = 'none';
      setPdfLoading(false);
    }
  };

  const handleExportCSV = () => {
    const rows = [
      ['Metric','Value'],
      ['Total Users', stats?.totalUsers||'N/A'],
      ['Total Appointments', stats?.totalAppointments||'N/A'],
      ['Pending Orders', stats?.pendingOrders||'N/A'],
      ['Active Sessions', stats?.activeSessions||'N/A'],
      ['Report Type', REPORT_TYPES.find(r=>r.id===selected)?.label||selected],
      ['Generated At', new Date().toLocaleString()],
    ];
    const csv = rows.map(r=>r.map(v=>`"${v}"`).join(',')).join('\n');
    const blob = new Blob([csv],{type:'text/csv;charset=utf-8'});
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href=url; a.download=`campushealth_report_${selected}.csv`; a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <>
      <style>{`@media print { .no-print { display:none!important; } #report-content { padding:20px; } }`}</style>
      <div className="space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 no-print">
          <div><h1 className="page-title">Reports Generator</h1><p className="page-sub">Generate, view and export platform reports.</p></div>
          <div className="flex gap-2">
            <button onClick={loadStats} className="btn btn-secondary">
              <RefreshCw className={`w-4 h-4 ${loading?'animate-spin':''}`}/>Refresh
            </button>
            <button onClick={handleExportCSV} className="btn btn-secondary">
              <Download className="w-4 h-4"/>CSV
            </button>
            <button onClick={handleDownloadPDF} disabled={pdfLoading} className="btn btn-primary">
              {pdfLoading ? <Loader2 className="w-4 h-4 animate-spin"/> : <FileText className="w-4 h-4"/>}
              {pdfLoading ? 'Generating PDF...' : 'Download PDF'}
            </button>
          </div>
        </div>

        {/* Report type selector */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 no-print">
          {REPORT_TYPES.map(r=>(
            <button key={r.id} onClick={()=>setSelected(r.id)}
              className="card p-4 text-left transition-all"
              style={{borderColor:selected===r.id?'var(--primary)':'var(--border2)',background:selected===r.id?'var(--primary-s)':'var(--surface)'}}>
              <div className="w-9 h-9 rounded-xl flex items-center justify-center mb-3" style={{background:r.color+'18'}}>
                <r.icon className="w-4 h-4" style={{color:r.color}}/>
              </div>
              <p className="text-sm font-bold" style={{color:selected===r.id?'var(--primary)':'var(--text)'}}>{r.label}</p>
              <p className="text-xs mt-1" style={{color:'var(--text3)'}}>{r.desc}</p>
            </button>
          ))}
        </div>

        {/* Report Content (captured for PDF) */}
        <div id="report-content" className="space-y-6" style={{background:'var(--bg)'}}>
          {/* PDF header - hidden by default, shown during PDF generation */}
          <div id="pdf-header" style={{display:'none',marginBottom:16,paddingBottom:12,borderBottom:'2px solid #e2e8f0'}}>
            <h2 style={{fontSize:20,fontWeight:'bold',marginBottom:4,color:'#1e293b'}}>
              CampusHealth Portal — {REPORT_TYPES.find(r=>r.id===selected)?.label}
            </h2>
            <p style={{fontSize:12,color:'#64748b'}}>Generated: {new Date().toLocaleString()}</p>
          </div>

          {loading ? (
            <div className="flex justify-center py-16"><Loader2 className="w-8 h-8 animate-spin" style={{color:'var(--primary)'}}/></div>
          ) : (
            <>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[
                  {k:'totalUsers',l:'Total Users',c:'#3A86A8',icon:Users},
                  {k:'totalAppointments',l:'Appointments',c:'#2ECC71',icon:Calendar},
                  {k:'pendingOrders',l:'Pending Orders',c:'#F39C12',icon:ShoppingBag},
                  {k:'activeSessions',l:'Active Sessions',c:'#9B59B6',icon:TrendingUp},
                ].map(s=>(
                  <div key={s.k} className="card-stat">
                    <div className="w-9 h-9 rounded-xl flex items-center justify-center mb-3" style={{background:s.c+'18'}}>
                      <s.icon className="w-4 h-4" style={{color:s.c}}/>
                    </div>
                    <p className="text-xs font-bold uppercase tracking-widest mb-1" style={{color:'var(--text3)'}}>{s.l}</p>
                    <p className="text-2xl font-black" style={{color:s.c,letterSpacing:'-0.04em'}}>{stats?.[s.k]?.toLocaleString()||'—'}</p>
                  </div>
                ))}
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 card p-6">
                  <h3 className="font-bold mb-4" style={{color:'var(--text)'}}>Platform Growth (7 months)</h3>
                  <div style={{height:200}}>
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={AREA_DATA}>
                        <defs><linearGradient id="rg" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="var(--primary)" stopOpacity={0.2}/><stop offset="95%" stopColor="var(--primary)" stopOpacity={0}/></linearGradient></defs>
                        <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill:'var(--text3)',fontSize:11}}/>
                        <YAxis axisLine={false} tickLine={false} tick={{fill:'var(--text3)',fontSize:11}}/>
                        <Tooltip content={<Tip/>}/>
                        <Area type="monotone" dataKey="v" stroke="var(--primary)" strokeWidth={2} fillOpacity={1} fill="url(#rg)"/>
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                <div className="card p-6">
                  <h3 className="font-bold mb-4" style={{color:'var(--text)'}}>User Distribution</h3>
                  <div style={{height:200}}>
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie data={PIE_DATA} cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={3} dataKey="value">
                          {PIE_DATA.map((_,i)=><Cell key={i} fill={PIE_COLS[i]}/>)}
                        </Pie>
                        <Tooltip contentStyle={{background:'var(--surface2)',border:'1px solid var(--border)',borderRadius:12}}/>
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="space-y-1.5 mt-3">
                    {PIE_DATA.map((d,i)=>(
                      <div key={d.name} className="flex justify-between items-center">
                        <div className="flex items-center gap-2">
                          <div className="w-3 h-3 rounded-full" style={{background:PIE_COLS[i]}}/>
                          <span className="text-xs" style={{color:'var(--text2)'}}>{d.name}</span>
                        </div>
                        <span className="text-xs font-bold" style={{color:'var(--text)'}}>{d.value}%</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </>
  );
};
export default ReportsGenerator;
