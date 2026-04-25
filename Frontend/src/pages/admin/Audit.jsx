import React, { useState, useEffect } from 'react';
import { Shield, Search, Filter, Loader2, RefreshCw, AlertTriangle, User, Settings, Trash2, Plus, Edit2 } from 'lucide-react';
import { cn } from '../../lib/utils';
import { apiFetch } from '../../lib/api';

const AuditLogs = () => {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [error, setError] = useState('');

  const fetchLogs = async () => {
    setLoading(true); setError('');
    try {
      const data = await apiFetch('/admin/logs');
      setLogs(Array.isArray(data)?data:(data?.logs||[]));
    } catch(err) { setError(err.message||'Failed to load audit logs'); }
    finally { setLoading(false); }
  };

  useEffect(()=>{ fetchLogs(); },[]);

  const filtered = logs.filter(l=>
    l.action?.toLowerCase().includes(search.toLowerCase())||
    l.user?.name?.toLowerCase().includes(search.toLowerCase())||
    l.description?.toLowerCase().includes(search.toLowerCase())
  );

  const actionIcon = (action) => {
    if(!action) return <Shield className="w-4 h-4"/>;
    const a = action.toLowerCase();
    if(a.includes('delete')) return <Trash2 className="w-4 h-4"/>;
    if(a.includes('create')||a.includes('add')) return <Plus className="w-4 h-4"/>;
    if(a.includes('update')||a.includes('edit')) return <Edit2 className="w-4 h-4"/>;
    if(a.includes('login')||a.includes('user')) return <User className="w-4 h-4"/>;
    return <Settings className="w-4 h-4"/>;
  };

  const levelColor = (level) => ({
    error:'var(--danger)', warning:'var(--warning)', info:'var(--primary)', success:'var(--success)'
  }[level?.toLowerCase()]||'var(--text3)');

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div><h1 className="page-title">Audit Logs</h1><p className="page-sub">Track all system activities and changes.</p></div>
        <button onClick={fetchLogs} className="icon-btn" style={{width:44,height:44,borderRadius:10,border:'1px solid var(--border)',background:'var(--surface)'}}>
          <RefreshCw className={cn('w-4 h-4',loading&&'animate-spin')}/>
        </button>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{color:'var(--text3)'}}/>
        <input type="text" placeholder="Search logs..." value={search} onChange={e=>setSearch(e.target.value)} className="input" style={{paddingLeft:36}}/>
      </div>

      {error&&<div className="card p-4 flex gap-2" style={{color:'var(--danger)',background:'var(--danger-s)'}}><AlertTriangle className="w-5 h-5 shrink-0"/>{error}</div>}

      <div className="card overflow-hidden">
        {loading?<div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin" style={{color:'var(--primary)'}}/></div>
        : filtered.length===0?<div className="flex flex-col items-center py-20" style={{color:'var(--text3)'}}><Shield className="w-10 h-10 mb-4 opacity-30"/><p className="font-bold">{error?'Error loading logs':'No logs found'}</p></div>
        : (
          <div className="divide-y" style={{borderColor:'var(--border2)'}}>
            {filtered.map((log,i)=>(
              <div key={log._id||log.id||i} className="px-6 py-4 flex items-start gap-4 transition-colors"
                onMouseEnter={e=>e.currentTarget.style.background='var(--surface2)'}
                onMouseLeave={e=>e.currentTarget.style.background='transparent'}>
                <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0" style={{background:`${levelColor(log.level)}18`,color:levelColor(log.level)}}>
                  {actionIcon(log.action)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="text-sm font-bold" style={{color:'var(--text)'}}>{log.action||'System Action'}</p>
                    {log.level&&<span className="badge" style={{background:`${levelColor(log.level)}18`,color:levelColor(log.level)}}>{log.level}</span>}
                  </div>
                  <p className="text-xs mt-0.5" style={{color:'var(--text2)'}}>{log.description||log.message||'No details'}</p>
                  <div className="flex items-center gap-3 mt-1">
                    {log.user?.name&&<span className="text-xs font-medium" style={{color:'var(--text3)'}}>{log.user.name}</span>}
                    {log.createdAt&&<span className="text-xs" style={{color:'var(--text3)'}}>{new Date(log.createdAt).toLocaleString()}</span>}
                    {log.ip&&<span className="text-xs font-mono" style={{color:'var(--text3)'}}>{log.ip}</span>}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
export default AuditLogs;
