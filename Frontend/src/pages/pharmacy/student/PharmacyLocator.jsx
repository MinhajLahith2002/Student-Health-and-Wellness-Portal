import React, { useState } from 'react';
import { 
  MapPin, 
  Navigation, 
  Clock, 
  Users, 
  ChevronRight, 
  Search, 
  Phone, 
  Info,
  ChevronLeft,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useNavigate } from 'react-router-dom';
import { MOCK_PHARMACIES } from '../../../constants/mockPharmacyData';
import { cn } from '../../../lib/utils';

const PharmacyLocator = () => {
  const navigate = useNavigate();
  const [selectedPharmacy, setSelectedPharmacy] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');

  const filteredPharmacies = MOCK_PHARMACIES.filter(p => 
    p.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    p.address.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const currentPharmacy = MOCK_PHARMACIES.find(p => p.id === selectedPharmacy);

  return (
    <div className="h-screen bg-slate-50 flex flex-col overflow-hidden">
      {/* Header */}
      <div className="bg-white border-b border-slate-200 px-6 py-4 shrink-0 z-30">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => navigate('/student/pharmacy')}
              className="p-2 hover:bg-slate-100 rounded-full transition-colors text-slate-600"
            >
              <ChevronLeft className="w-6 h-6" />
            </button>
            <h1 className="text-xl font-bold text-slate-900">Pharmacy Locator</h1>
          </div>
          <div className="relative hidden md:block">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input 
              type="text"
              placeholder="Search by name or location..."
              className="pl-10 pr-4 py-2 bg-slate-100 border-none rounded-xl text-sm focus:ring-2 focus:ring-emerald-500 transition-all w-64"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden relative">
        {/* Sidebar: List of Pharmacies */}
        <div className="w-full md:w-[400px] bg-white border-r border-slate-200 overflow-y-auto z-20 shadow-xl md:shadow-none">
          <div className="p-6 space-y-4">
            <div className="flex items-center justify-between mb-2">
              <h2 className="font-bold text-slate-900">Nearby Pharmacies</h2>
              <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">{filteredPharmacies.length} Found</span>
            </div>
            
            <div className="space-y-3">
              {filteredPharmacies.map((pharmacy) => (
                <motion.button
                  key={pharmacy.id}
                  onClick={() => setSelectedPharmacy(pharmacy.id)}
                  whileHover={{ scale: 1.01 }}
                  className={cn(
                    "w-full p-5 rounded-2xl border-2 text-left transition-all flex flex-col gap-3 group",
                    selectedPharmacy === pharmacy.id 
                      ? "border-emerald-500 bg-emerald-50/50" 
                      : "border-slate-50 bg-slate-50 hover:border-emerald-200"
                  )}
                >
                  <div className="flex justify-between items-start">
                    <div className="flex items-center gap-3">
                      <div className={cn(
                        "w-10 h-10 rounded-xl flex items-center justify-center transition-colors",
                        selectedPharmacy === pharmacy.id ? "bg-emerald-600 text-white" : "bg-white text-emerald-600 shadow-sm"
                      )}>
                        <MapPin className="w-5 h-5" />
                      </div>
                      <div>
                        <h3 className={cn("font-bold text-sm", selectedPharmacy === pharmacy.id ? "text-emerald-900" : "text-slate-900")}>
                          {pharmacy.name}
                        </h3>
                        <p className="text-xs text-slate-500">{pharmacy.address}</p>
                      </div>
                    </div>
                    <ChevronRight className={cn(
                      "w-4 h-4 transition-transform",
                      selectedPharmacy === pharmacy.id ? "text-emerald-600 translate-x-1" : "text-slate-300"
                    )} />
                  </div>
                  
                  <div className="flex items-center gap-4 pt-2 border-t border-slate-200/50">
                    <div className="flex items-center gap-1.5">
                      <Users className="w-3 h-3 text-slate-400" />
                      <span className={cn(
                        "text-[10px] font-bold uppercase tracking-wider",
                        pharmacy.queueLength > 10 ? "text-amber-600" : "text-emerald-600"
                      )}>
                        ~{pharmacy.queueLength * 2} min wait
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Clock className="w-3 h-3 text-slate-400" />
                      <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                        Open until 8 PM
                      </span>
                    </div>
                  </div>
                </motion.button>
              ))}
            </div>
          </div>
        </div>

        {/* Map Area */}
        <div className="flex-1 bg-slate-100 relative overflow-hidden">
          {/* Mock Map Background */}
          <div className="absolute inset-0 bg-[url('https://picsum.photos/seed/map/1920/1080?blur=10')] bg-cover opacity-20" />
          
          {/* Mock Map Pins */}
          {MOCK_PHARMACIES.map((p) => (
            <motion.button
              key={p.id}
              onClick={() => setSelectedPharmacy(p.id)}
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              whileHover={{ scale: 1.2 }}
              className={cn(
                "absolute p-2 rounded-full shadow-lg transition-all z-10",
                selectedPharmacy === p.id ? "bg-emerald-600 text-white scale-125" : "bg-white text-emerald-600"
              )}
              style={{ 
                left: `${(p.lng + 0.1) * 500 + 400}px`, 
                top: `${(p.lat - 51.5) * 500 + 300}px` 
              }}
            >
              <MapPin className="w-6 h-6" />
              {selectedPharmacy === p.id && (
                <motion.div 
                  layoutId="pin-ring"
                  className="absolute inset-0 rounded-full ring-4 ring-emerald-500/30 animate-ping"
                />
              )}
            </motion.button>
          ))}

          {/* Pharmacy Detail Overlay */}
          <AnimatePresence>
            {currentPharmacy && (
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 20 }}
                className="absolute bottom-8 left-1/2 -translate-x-1/2 w-full max-w-lg px-6 z-30"
              >
                <div className="bg-white rounded-3xl shadow-2xl shadow-slate-900/10 border border-slate-200 overflow-hidden">
                  <div className="p-8">
                    <div className="flex justify-between items-start mb-6">
                      <div className="flex items-center gap-4">
                        <div className="w-16 h-16 bg-emerald-50 rounded-2xl flex items-center justify-center text-emerald-600">
                          <MapPin className="w-8 h-8" />
                        </div>
                        <div>
                          <h2 className="text-2xl font-bold text-slate-900">{currentPharmacy.name}</h2>
                          <p className="text-slate-500">{currentPharmacy.address}</p>
                        </div>
                      </div>
                      <button 
                        onClick={() => setSelectedPharmacy(null)}
                        className="p-2 hover:bg-slate-100 rounded-full transition-colors"
                      >
                        <AlertCircle className="w-6 h-6 text-slate-300 rotate-45" />
                      </button>
                    </div>

                    <div className="grid grid-cols-2 gap-4 mb-8">
                      <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Queue Status</p>
                        <div className="flex items-center gap-2">
                          <Users className="w-4 h-4 text-emerald-600" />
                          <span className="font-bold text-slate-900">{currentPharmacy.queueLength} People Waiting</span>
                        </div>
                        <p className="text-[10px] text-emerald-600 font-bold mt-1 uppercase tracking-wider">~{currentPharmacy.queueLength * 2} min wait</p>
                      </div>
                      <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Opening Hours</p>
                        <div className="flex items-center gap-2">
                          <Clock className="w-4 h-4 text-slate-400" />
                          <span className="font-bold text-slate-900">{currentPharmacy.openingHours}</span>
                        </div>
                        <p className="text-[10px] text-emerald-600 font-bold mt-1 uppercase tracking-wider">Open Now</p>
                      </div>
                    </div>

                    <div className="flex gap-4">
                      <button className="flex-1 py-4 bg-emerald-600 text-white rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-100">
                        <Navigation className="w-5 h-5" /> Get Directions
                      </button>
                      <button className="w-14 h-14 bg-slate-100 text-slate-600 rounded-xl flex items-center justify-center hover:bg-slate-200 transition-all">
                        <Phone className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Map Controls */}
          <div className="absolute top-8 right-8 flex flex-col gap-2 z-30">
            <button className="w-12 h-12 bg-white rounded-xl shadow-lg flex items-center justify-center text-slate-600 hover:text-emerald-600 transition-colors">
              <Plus className="w-5 h-5" />
            </button>
            <button className="w-12 h-12 bg-white rounded-xl shadow-lg flex items-center justify-center text-slate-600 hover:text-emerald-600 transition-colors">
              <Minus className="w-5 h-5" />
            </button>
            <button className="w-12 h-12 bg-white rounded-xl shadow-lg flex items-center justify-center text-slate-600 hover:text-emerald-600 transition-colors mt-4">
              <Navigation className="w-5 h-5" />
            </button>
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

const Minus = ({ className }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
  </svg>
);

export default PharmacyLocator;