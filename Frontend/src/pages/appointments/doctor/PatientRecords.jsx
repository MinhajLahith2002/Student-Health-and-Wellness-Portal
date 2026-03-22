import React, { useState } from 'react';
import { motion } from 'motion/react';
import { 
  Search, 
  User, 
  ChevronRight, 
  Calendar, 
  Clock, 
  Plus, 
  Filter,
  MoreVertical,
  History,
  FileText,
  Activity
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { MOCK_PATIENTS } from '../../../constants/mockAppointmentData';
import { cn } from '../../../lib/utils';

const PatientRecords = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPatient, setSelectedPatient] = useState(null);

  const filteredPatients = MOCK_PATIENTS.filter(p => 
    p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.id.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-[#FCFCFC] pb-20">
      {/* Header */}
      <div className="bg-white border-b border-[#F0F0F3] pt-32 pb-12 px-6">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <h1 className="text-4xl font-bold text-[#18181B] tracking-tight">Patient Records</h1>
            <p className="text-[#71717A] mt-2 text-lg">Search and manage comprehensive medical histories and records.</p>
          </motion.div>

          {/* Search Bar */}
          <div className="mt-10 flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#71717A]" />
              <input 
                type="text"
                placeholder="Search by patient name or ID..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-12 pr-4 py-4 bg-[#F4F4F8] border-none rounded-2xl text-sm focus:ring-2 focus:ring-blue-600/20 transition-all outline-none"
              />
            </div>
            <button className="px-8 py-4 bg-white border border-[#F0F0F3] text-[#18181B] rounded-2xl font-bold hover:bg-[#F4F4F8] transition-all shadow-sm flex items-center gap-2">
              <Filter className="w-5 h-5" />
              Filter
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 mt-12">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
          {/* Patient List */}
          <div className="lg:col-span-4 space-y-4">
            {filteredPatients.map((patient) => (
              <motion.div
                key={patient.id}
                whileHover={{ scale: 1.01 }}
                onClick={() => setSelectedPatient(patient)}
                className={cn(
                  "p-6 rounded-[32px] border cursor-pointer transition-all",
                  selectedPatient?.id === patient.id ? "bg-white border-[#2563EB] shadow-lg shadow-blue-100" : "bg-white border-[#F0F0F3] hover:border-blue-200"
                )}
              >
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-blue-50 text-[#2563EB] rounded-2xl flex items-center justify-center font-bold">
                    {patient.name[0]}
                  </div>
                  <div>
                    <h3 className="font-bold text-[#18181B]">{patient.name}</h3>
                    <p className="text-xs text-[#71717A] font-medium">ID: {patient.id} • {patient.age} yrs</p>
                  </div>
                  <ChevronRight className="ml-auto w-5 h-5 text-[#71717A]" />
                </div>
              </motion.div>
            ))}
          </div>

          {/* Patient Detail */}
          <div className="lg:col-span-8">
            {selectedPatient ? (
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                className="space-y-8"
              >
                <div className="bg-white p-10 rounded-[40px] border border-[#F0F0F3] shadow-sm">
                  <div className="flex items-start justify-between mb-10">
                    <div className="flex items-center gap-6">
                      <div className="w-20 h-20 bg-blue-50 text-[#2563EB] rounded-3xl flex items-center justify-center text-3xl font-bold">
                        {selectedPatient.name[0]}
                      </div>
                      <div>
                        <h2 className="text-3xl font-bold text-[#18181B]">{selectedPatient.name}</h2>
                        <p className="text-[#71717A] font-medium mt-1">
                          {selectedPatient.gender} • {selectedPatient.age} years old • Blood: {selectedPatient.bloodType}
                        </p>
                      </div>
                    </div>
                    <button className="p-3 text-[#71717A] hover:text-[#18181B] hover:bg-[#F4F4F8] rounded-2xl transition-all">
                      <MoreVertical className="w-6 h-6" />
                    </button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
                    <div className="p-6 bg-rose-50 rounded-3xl border border-rose-100">
                      <p className="text-[10px] font-bold text-rose-600 uppercase tracking-widest mb-2">Allergies</p>
                      <p className="text-lg font-bold text-rose-900">{selectedPatient.allergies.join(', ')}</p>
                    </div>
                    <div className="p-6 bg-blue-50 rounded-3xl border border-blue-100">
                      <p className="text-[10px] font-bold text-blue-600 uppercase tracking-widest mb-2">Last Visit</p>
                      <p className="text-lg font-bold text-blue-900">{selectedPatient.lastVisit}</p>
                    </div>
                    <div className="p-6 bg-emerald-50 rounded-3xl border border-emerald-100">
                      <p className="text-[10px] font-bold text-emerald-600 uppercase tracking-widest mb-2">Status</p>
                      <p className="text-lg font-bold text-emerald-900">Active</p>
                    </div>
                  </div>

                  <div className="space-y-8">
                    <div className="flex items-center justify-between">
                      <h3 className="text-xl font-bold text-[#18181B]">Medical History</h3>
                      <button className="text-[#2563EB] font-bold text-sm hover:underline flex items-center gap-1">
                        <Plus className="w-4 h-4" /> Add Record
                      </button>
                    </div>
                    <div className="space-y-4">
                      {selectedPatient.history.map((h, i) => (
                        <div key={i} className="flex items-center justify-between p-6 bg-[#F4F4F8] rounded-3xl group hover:bg-[#EBEBEF] transition-all">
                          <div className="flex items-center gap-4">
                            <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-[#71717A]">
                              <Activity className="w-5 h-5" />
                            </div>
                            <div>
                              <p className="font-bold text-[#18181B]">{h.condition}</p>
                              <p className="text-xs text-[#71717A] font-medium">{h.date}</p>
                            </div>
                          </div>
                          <button className="p-2 text-[#71717A] hover:text-[#2563EB] transition-all">
                            <FileText className="w-5 h-5" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </motion.div>
            ) : (
              <div className="h-full flex flex-col items-center justify-center py-20 bg-white rounded-[40px] border border-dashed border-[#F0F0F3]">
                <div className="w-20 h-20 bg-[#F4F4F8] rounded-full flex items-center justify-center mb-6">
                  <User className="w-10 h-10 text-[#71717A]" />
                </div>
                <h3 className="text-2xl font-bold text-[#18181B]">Select a patient</h3>
                <p className="text-[#71717A] mt-2">Choose a patient from the list to view their full medical record.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default PatientRecords;