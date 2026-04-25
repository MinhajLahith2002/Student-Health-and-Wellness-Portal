import React, { useState, useEffect } from 'react';
import { Search, Filter, Edit2, Trash2, ChevronLeft, ChevronRight, UserPlus, XCircle, CheckCircle2, AlertTriangle, Loader2, RefreshCw } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../../lib/utils';
import { apiFetch } from '../../lib/api';
import { useForm } from '../../hooks/useForm';

const ROLES = ['All Roles', 'student', 'doctor', 'counselor', 'pharmacist', 'admin'];
const PER_PAGE = 10;

const Toast = ({ message, type, onClose }) => (
  <motion.div initial={{ opacity:0,y:40 }} animate={{ opacity:1,y:0 }} exit={{ opacity:0,y:40 }}
    className={cn('toast', type==='success'?'toast-success':'toast-error')}>
    {type==='success'?<CheckCircle2 className="w-5 h-5"/>:<AlertTriangle className="w-5 h-5"/>}
    {message}
    <button onClick={onClose}><XCircle className="w-4 h-4 ml-2 opacity-70"/></button>
  </motion.div>
);

const ConfirmModal = ({ user, onConfirm, onCancel, loading }) => (
  <div className="modal-bg">
    <motion.div initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} onClick={onCancel} className="absolute inset-0"/>
    <motion.div initial={{opacity:0,scale:.95,y:20}} animate={{opacity:1,scale:1,y:0}} exit={{opacity:0,scale:.95,y:20}}
      className="modal-box max-w-sm text-center">
      <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-6" style={{background:'var(--danger-s)'}}>
        <Trash2 className="w-8 h-8" style={{color:'var(--danger)'}}/>
      </div>
      <h3 className="text-xl font-bold mb-2" style={{color:'var(--text)'}}>Delete User?</h3>
      <p className="mb-8 text-sm" style={{color:'var(--text2)'}}>Delete <span className="font-bold" style={{color:'var(--text)'}}>{user?.name}</span>? This cannot be undone.</p>
      <div className="flex gap-3">
        <button onClick={onCancel} className="btn btn-secondary flex-1">Cancel</button>
        <button onClick={onConfirm} disabled={loading} className="btn btn-danger flex-1">
          {loading?<Loader2 className="w-4 h-4 animate-spin"/>:<Trash2 className="w-4 h-4"/>}
          {loading?'Deleting...':'Delete'}
        </button>
      </div>
    </motion.div>
  </div>
);

const UserModal = ({ editUser, onClose, onSaved }) => {
  const isEdit = !!editUser;
  const [apiError, setApiError] = useState('');
  const validate = (v) => {
    const e = {};
    if (!v.name?.trim()) e.name = 'Name required';
    if (!v.email) e.email = 'Email required';
    else if (!/\S+@\S+\.\S+/.test(v.email)) e.email = 'Invalid email';
    if (!isEdit && !v.password) e.password = 'Password required';
    return e;
  };
  const { values, errors, touched, isSubmitting, handleChange, handleBlur, handleSubmit, setFieldValue } =
    useForm({ name:editUser?.name||'', email:editUser?.email||'', password:'', role:editUser?.role||'student' }, validate);

  const onSubmit = async (data) => {
    setApiError('');
    try {
      let result;
      if (isEdit) {
        const body = { name:data.name, email:data.email, role:data.role };
        if (data.password) body.password = data.password;
        result = await apiFetch(`/users/${editUser._id||editUser.id}`, { method:'PUT', body:JSON.stringify(body) });
      } else {
        // Try all possible endpoints for user creation
        const endpoints = ['/users', '/admin/users', '/auth/register', '/register'];
        let lastErr = null;
        for (const ep of endpoints) {
          try {
            result = await apiFetch(ep, { method: 'POST', body: JSON.stringify(data) });
            lastErr = null;
            break;
          } catch(e) {
            lastErr = e;
            if (!e.message?.includes('404') && !e.message?.includes('Not Found')) throw e;
          }
        }
        if (lastErr) throw lastErr;
      }
      onSaved(result, isEdit);
    } catch (err) { setApiError(err.message||'Something went wrong'); }
  };

  return (
    <div className="modal-bg">
      <motion.div initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} onClick={onClose} className="absolute inset-0"/>
      <motion.div initial={{opacity:0,scale:.95,y:20}} animate={{opacity:1,scale:1,y:0}} exit={{opacity:0,scale:.95,y:20}} className="modal-box">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold" style={{color:'var(--text)'}}>{isEdit?'Edit User':'Add New User'}</h2>
          <button onClick={onClose} className="icon-btn"><XCircle className="w-5 h-5"/></button>
        </div>
        {apiError && <div className="mb-4 p-3 rounded-xl text-sm font-bold flex gap-2" style={{background:'var(--danger-s)',color:'var(--danger)'}}><AlertTriangle className="w-4 h-4 shrink-0 mt-0.5"/>{apiError}</div>}
        <form onSubmit={(e)=>{e.preventDefault();handleSubmit(onSubmit)}} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-bold uppercase tracking-widest block mb-1.5" style={{color:'var(--text3)'}}>Full Name</label>
              <input name="name" value={values.name} onChange={handleChange} onBlur={handleBlur} placeholder="John Doe" className={cn('input',errors.name&&touched.name&&'error')}/>
              {errors.name&&touched.name&&<p className="text-xs mt-1" style={{color:'var(--danger)'}}>{errors.name}</p>}
            </div>
            <div>
              <label className="text-xs font-bold uppercase tracking-widest block mb-1.5" style={{color:'var(--text3)'}}>Email</label>
              <input name="email" value={values.email} onChange={handleChange} onBlur={handleBlur} type="email" placeholder="john@email.com" className={cn('input',errors.email&&touched.email&&'error')}/>
              {errors.email&&touched.email&&<p className="text-xs mt-1" style={{color:'var(--danger)'}}>{errors.email}</p>}
            </div>
          </div>
          <div>
            <label className="text-xs font-bold uppercase tracking-widest block mb-1.5" style={{color:'var(--text3)'}}>{isEdit?'New Password (blank = keep)':'Password'}</label>
            <input name="password" value={values.password} onChange={handleChange} onBlur={handleBlur} type="password" placeholder={isEdit?'Leave blank to keep':'Enter password'} className={cn('input',errors.password&&touched.password&&'error')}/>
            {errors.password&&touched.password&&<p className="text-xs mt-1" style={{color:'var(--danger)'}}>{errors.password}</p>}
          </div>
          <div>
            <label className="text-xs font-bold uppercase tracking-widest block mb-1.5" style={{color:'var(--text3)'}}>Role</label>
            <div className="grid grid-cols-3 gap-2">
              {ROLES.slice(1).map(role=>(
                <label key={role} className="flex items-center justify-center p-3 rounded-xl cursor-pointer border-2 transition-all text-xs font-bold capitalize"
                  style={{background:values.role===role?'var(--primary-s)':'var(--surface2)',borderColor:values.role===role?'var(--primary)':'transparent',color:values.role===role?'var(--primary)':'var(--text2)'}}>
                  <input type="radio" name="role" value={role} checked={values.role===role} onChange={()=>setFieldValue('role',role)} className="hidden"/>
                  {role}
                </label>
              ))}
            </div>
          </div>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="btn btn-secondary flex-1">Cancel</button>
            <button type="submit" disabled={isSubmitting} className="btn btn-primary flex-1">
              {isSubmitting&&<Loader2 className="w-4 h-4 animate-spin"/>}
              {isSubmitting?'Saving...':isEdit?'Save Changes':'Create User'}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
};

const UserDirectory = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [role, setRole] = useState('All Roles');
  const [page, setPage] = useState(1);
  const [showAdd, setShowAdd] = useState(false);
  const [editUser, setEditUser] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [toast, setToast] = useState(null);

  const showToast = (message, type='success') => { setToast({message,type}); setTimeout(()=>setToast(null),3500); };

  const fetchUsers = async () => {
    setLoading(true);
    try {
      let data;
      const endpoints = ['/users', '/admin/users', '/auth/users'];
      for (const ep of endpoints) {
        try { data = await apiFetch(ep); break; }
        catch(e) { if (!e.message?.includes('404') && !e.message?.includes('Not Found')) throw e; }
      }
      setUsers(Array.isArray(data)?data:(data?.users||[]));
    } catch (err) { showToast(err.message||'Failed to load users','error'); }
    finally { setLoading(false); }
  };

  useEffect(()=>{ fetchUsers(); },[]);

  const filtered = users.filter(u=>{
    const s = u.name?.toLowerCase().includes(search.toLowerCase())||u.email?.toLowerCase().includes(search.toLowerCase());
    const r = role==='All Roles'||u.role===role;
    return s&&r;
  });

  const totalPages = Math.max(1,Math.ceil(filtered.length/PER_PAGE));
  const paginated = filtered.slice((page-1)*PER_PAGE, page*PER_PAGE);

  const handleDelete = async () => {
    setDeleteLoading(true);
    try {
      await apiFetch(`/users/${deleteTarget._id||deleteTarget.id}`,{method:'DELETE'});
      setUsers(prev=>prev.filter(u=>(u._id||u.id)!==(deleteTarget._id||deleteTarget.id)));
      showToast(`${deleteTarget.name} deleted`);
      setDeleteTarget(null);
    } catch(err){ showToast(err.message||'Failed to delete','error'); }
    finally{ setDeleteLoading(false); }
  };

  const handleSaved = (result, isEdit) => {
    if(isEdit){ setUsers(prev=>prev.map(u=>(u._id||u.id)===(result._id||result.id)?result:u)); showToast('User updated'); setEditUser(null); }
    else { setUsers(prev=>[result,...prev]); showToast('User created'); setShowAdd(false); }
  };

  const roleBadge = (r) => ({admin:'badge-primary',doctor:'badge-success',counselor:'badge-muted',pharmacist:'badge-warning',student:'badge-muted'}[r]||'badge-muted');

  return (
    <>
      <div className="space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="page-title">User Directory</h1>
            <p className="page-sub">Manage all platform users and their permissions.</p>
          </div>
          <div className="flex gap-2">
            <button onClick={fetchUsers} className="icon-btn" title="Refresh" style={{width:44,height:44,borderRadius:10,border:'1px solid var(--border)',background:'var(--surface)'}}>
              <RefreshCw className={cn('w-4 h-4',loading&&'animate-spin')}/>
            </button>
            <button onClick={()=>setShowAdd(true)} className="btn btn-primary">
              <UserPlus className="w-4 h-4"/>Add User
            </button>
          </div>
        </div>

        <div className="card p-4 flex flex-col md:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{color:'var(--text3)'}}/>
            <input type="text" placeholder="Search by name or email..." value={search} onChange={e=>{setSearch(e.target.value);setPage(1)}} className="input" style={{paddingLeft:36}}/>
          </div>
          <div className="relative w-full md:w-44">
            <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{color:'var(--text3)'}}/>
            <select value={role} onChange={e=>{setRole(e.target.value);setPage(1)}} className="input appearance-none" style={{paddingLeft:36}}>
              {ROLES.map(r=><option key={r}>{r}</option>)}
            </select>
          </div>
        </div>

        <div className="card overflow-hidden">
          {loading ? (
            <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin" style={{color:'var(--primary)'}}/></div>
          ) : paginated.length===0 ? (
            <div className="flex flex-col items-center py-20" style={{color:'var(--text3)'}}>
              <Search className="w-10 h-10 mb-4 opacity-30"/><p className="font-bold">No users found</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="tbl">
                <thead><tr>
                  {['User','Role','Status','Actions'].map(h=>(
                    <th key={h} className={h==='Actions'?'text-right':''}>{h}</th>
                  ))}
                </tr></thead>
                <tbody>
                  {paginated.map(u=>{
                    const initials = u.name?.split(' ').map(n=>n[0]).join('').slice(0,2).toUpperCase()||'?';
                    return (
                      <tr key={u._id||u.id}>
                        <td>
                          <div className="flex items-center gap-3">
                            {u.profileImage
                              ? <img src={u.profileImage} alt={u.name} className="w-9 h-9 rounded-lg object-cover"/>
                              : <div className="w-9 h-9 rounded-lg flex items-center justify-center text-white text-xs font-bold" style={{background:'var(--grad)'}}>{initials}</div>
                            }
                            <div>
                              <p className="text-sm font-bold" style={{color:'var(--text)'}}>{u.name}</p>
                              <p className="text-xs" style={{color:'var(--text3)'}}>{u.email}</p>
                            </div>
                          </div>
                        </td>
                        <td><span className={cn('badge capitalize',roleBadge(u.role))}>{u.role}</span></td>
                        <td>
                          <div className="flex items-center gap-2">
                            <div className="w-2 h-2 rounded-full" style={{background:u.isVerified?'var(--success)':'var(--warning)'}}/>
                            <span className="text-xs font-bold" style={{color:u.isVerified?'var(--success)':'var(--warning)'}}>{u.isVerified?'Verified':'Unverified'}</span>
                          </div>
                        </td>
                        <td className="text-right">
                          <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity" style={{opacity:1}}>
                            <button onClick={()=>setEditUser(u)} className="icon-btn primary"><Edit2 className="w-4 h-4"/></button>
                            <button onClick={()=>setDeleteTarget(u)} className="icon-btn danger"><Trash2 className="w-4 h-4"/></button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
          {!loading&&filtered.length>0&&(
            <div className="p-4 flex items-center justify-between" style={{borderTop:'1px solid var(--border2)'}}>
              <p className="text-xs font-bold" style={{color:'var(--text3)'}}>
                {Math.min((page-1)*PER_PAGE+1,filtered.length)}–{Math.min(page*PER_PAGE,filtered.length)} of {filtered.length}
              </p>
              <div className="flex gap-1">
                <button onClick={()=>setPage(p=>Math.max(1,p-1))} disabled={page===1} className="icon-btn"><ChevronLeft className="w-4 h-4"/></button>
                {Array.from({length:totalPages},(_,i)=>i+1).map(p=>(
                  <button key={p} onClick={()=>setPage(p)} className="w-8 h-8 rounded-lg text-xs font-bold transition-colors"
                    style={{background:page===p?'var(--primary)':'transparent',color:page===p?'white':'var(--text2)'}}>
                    {p}
                  </button>
                ))}
                <button onClick={()=>setPage(p=>Math.min(totalPages,p+1))} disabled={page===totalPages} className="icon-btn"><ChevronRight className="w-4 h-4"/></button>
              </div>
            </div>
          )}
        </div>
      </div>

      <AnimatePresence>
        {showAdd&&<UserModal editUser={null} onClose={()=>setShowAdd(false)} onSaved={handleSaved}/>}
        {editUser&&<UserModal editUser={editUser} onClose={()=>setEditUser(null)} onSaved={handleSaved}/>}
        {deleteTarget&&<ConfirmModal user={deleteTarget} onConfirm={handleDelete} onCancel={()=>setDeleteTarget(null)} loading={deleteLoading}/>}
        {toast&&<Toast message={toast.message} type={toast.type} onClose={()=>setToast(null)}/>}
      </AnimatePresence>
    </>
  );
};
export default UserDirectory;
