import React, { useState, useEffect } from 'react';
import { Star, MessageSquare, Search, CheckCircle2, XCircle, AlertTriangle, Loader2, RefreshCw, Send, Edit2, Trash2, ChevronDown, ChevronUp } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../../lib/utils';
import { apiFetch } from '../../lib/api';

const Toast = ({ message, type, onClose }) => (
  <motion.div initial={{opacity:0,y:40}} animate={{opacity:1,y:0}} exit={{opacity:0,y:40}}
    className={cn('toast', type==='success'?'toast-success':'toast-error')}>
    {type==='success'?<CheckCircle2 className="w-5 h-5"/>:<AlertTriangle className="w-5 h-5"/>}
    {message}<button onClick={onClose}><XCircle className="w-4 h-4 ml-2 opacity-70"/></button>
  </motion.div>
);

const Stars = ({n=0}) => (
  <div className="flex gap-0.5">
    {Array.from({length:5},(_,i)=>(
      <Star key={i} className="w-4 h-4" fill={i<n?'var(--warning)':'none'} style={{color:'var(--warning)'}}/>
    ))}
  </div>
);

const FeedbackManager = () => {
  const [feedbacks, setFeedbacks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('All');
  const [response, setResponse] = useState('');
  const [responding, setResponding] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [toast, setToast] = useState(null);
  const [expandedId, setExpandedId] = useState(null);

  const showToast = (message, type='success') => { setToast({message,type}); setTimeout(()=>setToast(null),3000); };

  const fetchFeedback = async () => {
    setLoading(true);
    try {
      const data = await apiFetch('/feedback');
      const list = Array.isArray(data)?data:(data?.feedback||data?.feedbacks||[]);
      setFeedbacks(list);
      if(list.length>0 && !selected) setSelected(list[0]);
    } catch(err) { showToast(err.message||'Failed to load feedback','error'); }
    finally { setLoading(false); }
  };

  useEffect(()=>{ fetchFeedback(); },[]);

  useEffect(()=>{
    if(selected) {
      setResponse(selected.adminResponse||selected.response||'');
      setEditMode(false);
    }
  },[selected?._id]);

  const filtered = feedbacks.filter(f=>{
    const s = (f.message||f.comment||'').toLowerCase().includes(search.toLowerCase()) ||
              (f.user?.name||'').toLowerCase().includes(search.toLowerCase());
    const ft = filter==='All' || (filter==='Responded'&&(f.adminResponse||f.response)) || (filter==='Pending'&&!(f.adminResponse||f.response));
    return s&&ft;
  });

  const handleRespond = async () => {
    if(!response.trim()||!selected) return;
    setResponding(true);
    try {
      await apiFetch(`/feedback/${selected._id||selected.id}/respond`,{method:'PUT',body:JSON.stringify({response})});
      const updated = {...selected, adminResponse:response, response};
      setFeedbacks(prev=>prev.map(f=>(f._id||f.id)===(selected._id||selected.id)?updated:f));
      setSelected(updated);
      setEditMode(false);
      showToast(editMode?'Response updated!':'Response sent!');
    } catch(err){ showToast(err.message||'Failed to respond','error'); }
    finally{ setResponding(false); }
  };

  const handleDeleteResponse = async () => {
    if(!selected) return;
    setDeleteLoading(true);
    try {
      await apiFetch(`/feedback/${selected._id||selected.id}/respond`,{method:'PUT',body:JSON.stringify({response:''})});
      const updated = {...selected, adminResponse:'', response:''};
      setFeedbacks(prev=>prev.map(f=>(f._id||f.id)===(selected._id||selected.id)?updated:f));
      setSelected(updated);
      setResponse('');
      setEditMode(false);
      showToast('Response deleted');
    } catch(err){ showToast(err.message||'Failed to delete response','error'); }
    finally{ setDeleteLoading(false); }
  };

  const existingResponse = selected?.adminResponse||selected?.response;

  return (
    <>
      <div className="space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div><h1 className="page-title">Feedback Manager</h1><p className="page-sub">Review and respond to user feedback.</p></div>
          <div className="flex gap-2">
            <span className="badge badge-muted">{feedbacks.length} Total</span>
            <span className="badge badge-warning">{feedbacks.filter(f=>!(f.adminResponse||f.response)).length} Pending</span>
            <span className="badge badge-success">{feedbacks.filter(f=>f.adminResponse||f.response).length} Responded</span>
            <button onClick={fetchFeedback} className="icon-btn" style={{width:40,height:40,borderRadius:10,border:'1px solid var(--border)',background:'var(--surface)'}}>
              <RefreshCw className={cn('w-4 h-4',loading&&'animate-spin')}/>
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left list */}
          <div className="lg:col-span-5 space-y-3">
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{color:'var(--text3)'}}/>
                <input type="text" placeholder="Search feedback..." value={search} onChange={e=>setSearch(e.target.value)} className="input text-sm" style={{paddingLeft:34}}/>
              </div>
              <select value={filter} onChange={e=>setFilter(e.target.value)} className="input text-sm w-32">
                {['All','Pending','Responded'].map(f=><option key={f}>{f}</option>)}
              </select>
            </div>

            {loading ? <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 animate-spin" style={{color:'var(--primary)'}}/></div>
            : filtered.length===0 ? <div className="card p-8 text-center text-sm" style={{color:'var(--text3)'}}>No feedback found</div>
            : filtered.map(fb=>{
              const hasResp = !!(fb.adminResponse||fb.response);
              const isActive = selected?._id===fb._id||selected?.id===fb.id;
              return (
                <button key={fb._id||fb.id} onClick={()=>setSelected(fb)}
                  className="card w-full p-4 text-left transition-all"
                  style={{borderColor:isActive?'var(--primary)':'var(--border2)',background:isActive?'var(--primary-s)':'var(--surface)'}}>
                  <div className="flex justify-between items-start mb-2">
                    <Stars n={fb.rating||0}/>
                    <span className={cn('badge',hasResp?'badge-success':'badge-warning')}>{hasResp?'Responded':'Pending'}</span>
                  </div>
                  <p className="text-sm font-medium line-clamp-2 mb-2" style={{color:'var(--text)'}}>{fb.message||fb.comment||'No message'}</p>
                  <div className="flex justify-between items-center">
                    <p className="text-xs font-medium" style={{color:'var(--text3)'}}>{fb.user?.name||'Anonymous'}</p>
                    <p className="text-xs" style={{color:'var(--text3)'}}>{fb.createdAt?new Date(fb.createdAt).toLocaleDateString():''}</p>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Right detail */}
          <div className="lg:col-span-7">
            {selected ? (
              <div className="card p-6 space-y-5">
                {/* Header */}
                <div className="flex justify-between items-start">
                  <div>
                    <p className="font-bold text-lg" style={{color:'var(--text)'}}>{selected.user?.name||'Anonymous'}</p>
                    <p className="text-sm" style={{color:'var(--text3)'}}>{selected.user?.email||''}</p>
                    <p className="text-xs mt-1" style={{color:'var(--text3)'}}>{selected.createdAt?new Date(selected.createdAt).toLocaleString():''}</p>
                  </div>
                  <Stars n={selected.rating||0}/>
                </div>

                {/* Category/Type badge */}
                {selected.category&&<span className="badge badge-primary">{selected.category}</span>}

                {/* Message */}
                <div className="p-4 rounded-xl" style={{background:'var(--surface2)',border:'1px solid var(--border2)'}}>
                  <p className="text-xs font-bold uppercase tracking-widest mb-2" style={{color:'var(--text3)'}}>User Feedback</p>
                  <p className="text-sm leading-relaxed" style={{color:'var(--text)'}}>{selected.message||selected.comment||'No message'}</p>
                </div>

                {/* Existing response display */}
                {existingResponse && !editMode && (
                  <div className="p-4 rounded-xl" style={{background:'var(--primary-s)',border:'1px solid var(--primary)22'}}>
                    <div className="flex justify-between items-center mb-2">
                      <p className="text-xs font-bold uppercase tracking-widest" style={{color:'var(--primary)'}}>Admin Response</p>
                      <div className="flex gap-1">
                        <button onClick={()=>setEditMode(true)} className="icon-btn primary" title="Edit response">
                          <Edit2 className="w-3.5 h-3.5"/>
                        </button>
                        <button onClick={handleDeleteResponse} disabled={deleteLoading} className="icon-btn danger" title="Delete response">
                          {deleteLoading?<Loader2 className="w-3.5 h-3.5 animate-spin"/>:<Trash2 className="w-3.5 h-3.5"/>}
                        </button>
                      </div>
                    </div>
                    <p className="text-sm leading-relaxed" style={{color:'var(--text)'}}>{existingResponse}</p>
                  </div>
                )}

                {/* Response form */}
                {(!existingResponse || editMode) && (
                  <div className="space-y-3">
                    <label className="text-xs font-bold uppercase tracking-widest block" style={{color:'var(--text3)'}}>
                      {editMode?'Edit Response':'Write Response'}
                    </label>
                    <textarea rows={4} value={response} onChange={e=>setResponse(e.target.value)}
                      placeholder="Type your response to this feedback..." className="input"
                      style={{resize:'vertical'}}/>
                    <div className="flex gap-2">
                      {editMode&&(
                        <button onClick={()=>{setEditMode(false);setResponse(existingResponse||'')}} className="btn btn-secondary flex-1">
                          Cancel
                        </button>
                      )}
                      <button onClick={handleRespond} disabled={responding||!response.trim()} className="btn btn-primary flex-1">
                        {responding?<Loader2 className="w-4 h-4 animate-spin"/>:<Send className="w-4 h-4"/>}
                        {responding?'Sending...':(editMode?'Update Response':'Send Response')}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="card p-12 text-center" style={{color:'var(--text3)'}}>
                <MessageSquare className="w-10 h-10 mx-auto mb-4 opacity-30"/>
                <p className="font-bold">Select feedback to view details</p>
              </div>
            )}
          </div>
        </div>
      </div>
      <AnimatePresence>
        {toast&&<Toast message={toast.message} type={toast.type} onClose={()=>setToast(null)}/>}
      </AnimatePresence>
    </>
  );
};
export default FeedbackManager;
