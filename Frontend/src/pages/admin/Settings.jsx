import React, { useState, useEffect } from 'react';
import { Settings, Shield, Bell, Globe, Save, Loader2, CheckCircle2, AlertTriangle, XCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../../lib/utils';
import { apiFetch } from '../../lib/api';

const Toast = ({ message, type, onClose }) => (
  <motion.div initial={{opacity:0,y:40}} animate={{opacity:1,y:0}} exit={{opacity:0,y:40}} className={cn('toast',type==='success'?'toast-success':'toast-error')}>
    {type==='success'?<CheckCircle2 className="w-5 h-5"/>:<AlertTriangle className="w-5 h-5"/>}
    {message}<button onClick={onClose}><XCircle className="w-4 h-4 ml-2 opacity-70"/></button>
  </motion.div>
);

const SystemSettings = () => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState(null);
  const [settings, setSettings] = useState({
    siteName: 'CampusHealth Portal', maintenanceMode: false,
    emailNotifications: true, pushNotifications: true,
    maxFileSize: 10, allowedFileTypes: 'image/jpeg,image/png,application/pdf',
    sessionTimeout: 30, rateLimitMax: 100,
  });

  const showToast = (message, type='success') => { setToast({message,type}); setTimeout(()=>setToast(null),3000); };

  useEffect(()=>{
    (async()=>{
      try {
        const data = await apiFetch('/admin/settings');
        if(data) setSettings(prev=>({...prev,...data}));
      } catch(err){ /* use defaults */ }
      finally { setLoading(false); }
    })();
  },[]);

  const handleSave = async () => {
    setSaving(true);
    try {
      await apiFetch('/admin/settings',{method:'PUT',body:JSON.stringify(settings)});
      showToast('Settings saved successfully!');
    } catch(err){ showToast(err.message||'Failed to save settings','error'); }
    finally{ setSaving(false); }
  };

  const toggle = (key) => setSettings(s=>({...s,[key]:!s[key]}));
  const update = (key,val) => setSettings(s=>({...s,[key]:val}));

  const Toggle = ({k,label,desc}) => (
    <div className="flex items-center justify-between py-4" style={{borderBottom:'1px solid var(--border2)'}}>
      <div>
        <p className="text-sm font-bold" style={{color:'var(--text)'}}>{label}</p>
        <p className="text-xs mt-0.5" style={{color:'var(--text3)'}}>{desc}</p>
      </div>
      <button onClick={()=>toggle(k)} className="w-12 h-6 rounded-full transition-all relative shrink-0"
        style={{background:settings[k]?'var(--primary)':'var(--border)'}}>
        <span className="absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-all" style={{left:settings[k]?'calc(100% - 1.375rem)':'2px'}}/>
      </button>
    </div>
  );

  if(loading) return <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin" style={{color:'var(--primary)'}}/></div>;

  return (
    <>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div><h1 className="page-title">System Settings</h1><p className="page-sub">Configure platform settings and preferences.</p></div>
          <button onClick={handleSave} disabled={saving} className="btn btn-primary">
            {saving?<Loader2 className="w-4 h-4 animate-spin"/>:<Save className="w-4 h-4"/>}
            {saving?'Saving...':'Save Settings'}
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* General */}
          <div className="card p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{background:'var(--primary-s)'}}>
                <Globe className="w-5 h-5" style={{color:'var(--primary)'}}/>
              </div>
              <h3 className="font-bold" style={{color:'var(--text)'}}>General</h3>
            </div>
            <div className="space-y-4">
              <div>
                <label className="text-xs font-bold uppercase tracking-widest block mb-1.5" style={{color:'var(--text3)'}}>Site Name</label>
                <input value={settings.siteName} onChange={e=>update('siteName',e.target.value)} className="input"/>
              </div>
              <div>
                <label className="text-xs font-bold uppercase tracking-widest block mb-1.5" style={{color:'var(--text3)'}}>Session Timeout (minutes)</label>
                <input type="number" value={settings.sessionTimeout} onChange={e=>update('sessionTimeout',+e.target.value)} className="input"/>
              </div>
              <div>
                <label className="text-xs font-bold uppercase tracking-widest block mb-1.5" style={{color:'var(--text3)'}}>Rate Limit (requests/window)</label>
                <input type="number" value={settings.rateLimitMax} onChange={e=>update('rateLimitMax',+e.target.value)} className="input"/>
              </div>
              <Toggle k="maintenanceMode" label="Maintenance Mode" desc="Temporarily disable the platform for maintenance"/>
            </div>
          </div>

          {/* Notifications */}
          <div className="card p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{background:'var(--primary-s)'}}>
                <Bell className="w-5 h-5" style={{color:'var(--primary)'}}/>
              </div>
              <h3 className="font-bold" style={{color:'var(--text)'}}>Notifications</h3>
            </div>
            <Toggle k="emailNotifications" label="Email Notifications" desc="Send email notifications to users"/>
            <Toggle k="pushNotifications" label="Push Notifications" desc="Enable push notifications on mobile devices"/>
          </div>

          {/* Security */}
          <div className="card p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{background:'var(--primary-s)'}}>
                <Shield className="w-5 h-5" style={{color:'var(--primary)'}}/>
              </div>
              <h3 className="font-bold" style={{color:'var(--text)'}}>File Uploads</h3>
            </div>
            <div className="space-y-4">
              <div>
                <label className="text-xs font-bold uppercase tracking-widest block mb-1.5" style={{color:'var(--text3)'}}>Max File Size (MB)</label>
                <input type="number" value={settings.maxFileSize} onChange={e=>update('maxFileSize',+e.target.value)} className="input"/>
              </div>
              <div>
                <label className="text-xs font-bold uppercase tracking-widest block mb-1.5" style={{color:'var(--text3)'}}>Allowed File Types</label>
                <input value={settings.allowedFileTypes} onChange={e=>update('allowedFileTypes',e.target.value)} className="input" placeholder="image/jpeg,image/png,..."/>
              </div>
            </div>
          </div>

          {/* Info card */}
          <div className="card p-6" style={{background:'var(--primary-s)',borderColor:'var(--primary)22'}}>
            <div className="flex items-center gap-3 mb-4">
              <Settings className="w-5 h-5" style={{color:'var(--primary)'}}/>
              <h3 className="font-bold" style={{color:'var(--primary)'}}>System Info</h3>
            </div>
            {[['Platform','CampusHealth Portal v2.0'],['Environment',process.env.NODE_ENV||'development'],['API Status','Connected'],['Database','MongoDB Atlas']].map(([k,v])=>(
              <div key={k} className="flex justify-between py-2" style={{borderBottom:'1px solid var(--border2)'}}>
                <span className="text-xs font-bold uppercase" style={{color:'var(--text3)'}}>{k}</span>
                <span className="text-xs font-bold" style={{color:'var(--primary)'}}>{v}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
      <AnimatePresence>
        {toast&&<Toast message={toast.message} type={toast.type} onClose={()=>setToast(null)}/>}
      </AnimatePresence>
    </>
  );
};
export default SystemSettings;
