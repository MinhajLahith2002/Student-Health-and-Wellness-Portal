import React, { useState } from 'react';
import { 
  Phone, 
  Search, 
  ChevronRight, 
  ShieldAlert, 
  AlertTriangle, 
  Heart, 
  Wind, 
  Flame, 
  Bone, 
  ChevronLeft,
  Info,
  CheckCircle2,
  XCircle
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useNavigate } from 'react-router-dom';
import { cn } from '../../../lib/utils';

const FirstAidGuide = () => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTopic, setSelectedTopic] = useState(null);

  const topics = [
    { 
      id: 'bleeding', 
      title: 'Bleeding', 
      icon: Heart, 
      color: 'rose',
      steps: [
        'Apply direct pressure to the wound with a clean cloth or bandage.',
        'Maintain pressure until the bleeding stops.',
        'If the cloth becomes soaked, add another one on top; do not remove the first one.',
        'Elevate the injured limb above the level of the heart if possible.',
        'Seek medical help if bleeding is severe or doesn\'t stop.'
      ],
      dos: ['Use clean materials', 'Keep the person calm', 'Call for help early'],
      donts: ['Remove embedded objects', 'Use a tourniquet unless trained', 'Wash deep wounds']
    },
    { 
      id: 'choking', 
      title: 'Choking', 
      icon: Wind, 
      color: 'blue',
      steps: [
        'Stand behind the person and wrap your arms around their waist.',
        'Make a fist and place it just above the navel.',
        'Grasp your fist with your other hand.',
        'Perform quick, upward thrusts (Heimlich maneuver).',
        'Repeat until the object is forced out or the person becomes unconscious.'
      ],
      dos: ['Encourage coughing first', 'Act quickly', 'Call emergency if unconscious'],
      donts: ['Give water', 'Pat the back if they can cough', 'Blind finger sweeps']
    },
    { 
      id: 'burns', 
      title: 'Burns', 
      icon: Flame, 
      color: 'amber',
      steps: [
        'Immediately run cool (not cold) water over the burn for at least 10-20 minutes.',
        'Remove any jewelry or tight clothing before the area starts to swell.',
        'Cover the burn loosely with a sterile bandage or clean cloth.',
        'Do not pop any blisters that may form.',
        'Seek medical attention for large, deep, or chemical burns.'
      ],
      dos: ['Use cool running water', 'Remove restrictive items', 'Keep the person warm'],
      donts: ['Use ice or butter', 'Pop blisters', 'Remove stuck clothing']
    },
    { 
      id: 'fractures', 
      title: 'Fractures', 
      icon: Bone, 
      color: 'slate',
      steps: [
        'Do not try to realign the bone or push a bone that\'s sticking out back in.',
        'Apply a splint to the area above and below the joint to immobilize it.',
        'Apply ice packs to limit swelling and help relieve pain.',
        'Treat for shock if the person feels faint or is breathing in short, rapid breaths.',
        'Call for emergency medical assistance immediately.'
      ],
      dos: ['Keep the limb still', 'Apply ice', 'Watch for shock'],
      donts: ['Move the person unnecessarily', 'Test the bone by moving it', 'Give food or drink']
    }
  ];

  const filteredTopics = topics.filter(t => t.title.toLowerCase().includes(searchQuery.toLowerCase()));
  const currentTopic = topics.find(t => t.id === selectedTopic);

  return (
    <div className="pharmacy-shell pb-20">
      {/* Header */}
      <div className="pharmacy-hero sticky top-0 z-30 px-6 py-4">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => navigate('/student/pharmacy')}
              className="p-2 hover:bg-[#e6f0f4] rounded-full transition-colors text-secondary-text"
            >
              <ChevronLeft className="w-6 h-6" />
            </button>
            <h1 className="text-xl font-bold text-primary-text">First-Aid Guide</h1>
          </div>
          <button 
            onClick={() => window.location.href = 'tel:911'}
            className="px-6 py-2.5 bg-rose-600 text-white rounded-xl font-bold flex items-center gap-2 hover:bg-rose-700 transition-all shadow-lg shadow-rose-100 animate-pulse"
          >
            <Phone className="w-4 h-4" /> Call Emergency
          </button>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-6 py-10">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
          {/* Left: Topics List */}
          <div className="lg:col-span-1 space-y-6">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-secondary-text/80" />
              <input 
                type="text"
                placeholder="Search emergencies..."
                className="w-full pl-12 pr-4 py-4 bg-white border border-slate-200 rounded-2xl focus:ring-2 focus:ring-accent-primary transition-all shadow-sm"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

            <div className="grid grid-cols-1 gap-3">
              {filteredTopics.map((topic) => (
                <button
                  key={topic.id}
                  onClick={() => setSelectedTopic(topic.id)}
                  className={cn(
                    "p-5 rounded-2xl border-2 text-left transition-all flex items-center justify-between group",
                    selectedTopic === topic.id 
                      ? "border-accent-primary bg-[#e8f7f5]/50" 
                      : "border-white bg-white hover:border-emerald-200 shadow-sm"
                  )}
                >
                  <div className="flex items-center gap-4">
                    <div className={cn(
                      "w-12 h-12 rounded-xl flex items-center justify-center transition-colors",
                      selectedTopic === topic.id ? "bg-accent-primary text-white" : `bg-${topic.color}-50 text-${topic.color}-600`
                    )}>
                      <topic.icon className="w-6 h-6" />
                    </div>
                    <span className={cn("font-bold", selectedTopic === topic.id ? "text-emerald-900" : "text-slate-700")}>
                      {topic.title}
                    </span>
                  </div>
                  <ChevronRight className={cn(
                    "w-5 h-5 transition-transform",
                    selectedTopic === topic.id ? "text-accent-primary translate-x-1" : "text-slate-300"
                  )} />
                </button>
              ))}
            </div>

            <div className="p-6 bg-emerald-900 rounded-3xl text-white">
              <ShieldAlert className="w-10 h-10 text-emerald-400 mb-4" />
              <h3 className="text-xl font-bold mb-2">Be Prepared</h3>
              <p className="text-emerald-100/70 text-sm leading-relaxed mb-6">
                Keep a first-aid kit in your dorm and know the location of the nearest AED on campus.
              </p>
              <button className="w-full py-3 bg-emerald-800 text-white rounded-xl text-sm font-bold border border-emerald-700 hover:bg-[#105f72] transition-colors">
                Find Nearest AED
              </button>
            </div>
          </div>

          {/* Right: Detailed Steps */}
          <div className="lg:col-span-2">
            <AnimatePresence mode="wait">
              {currentTopic ? (
                <motion.div
                  key={currentTopic.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="space-y-8"
                >
                  <div className="pharmacy-panel overflow-hidden">
                    <div className={cn("h-3", `bg-${currentTopic.color}-500`)} />
                    <div className="p-8 md:p-10">
                      <div className="flex items-center gap-4 mb-8">
                        <div className={cn("w-16 h-16 rounded-2xl flex items-center justify-center text-white", `bg-${currentTopic.color}-500`)}>
                          <currentTopic.icon className="w-8 h-8" />
                        </div>
                        <div>
                          <h2 className="text-3xl font-bold text-primary-text">{currentTopic.title}</h2>
                          <p className="text-secondary-text">Emergency Response Steps</p>
                        </div>
                      </div>

                      <div className="space-y-6">
                        {currentTopic.steps.map((step, index) => (
                          <div key={index} className="flex gap-6 group">
                            <div className="flex flex-col items-center">
                              <div className={cn(
                                "w-10 h-10 rounded-full flex items-center justify-center font-bold text-lg shrink-0 transition-colors",
                                `bg-${currentTopic.color}-50 text-${currentTopic.color}-600 border-2 border-${currentTopic.color}-100`
                              )}>
                                {index + 1}
                              </div>
                              {index < currentTopic.steps.length - 1 && (
                                <div className={cn("w-0.5 flex-1 my-2 bg-[#e6f0f4]", `group-hover:bg-${currentTopic.color}-100`)} />
                              )}
                            </div>
                            <div className="pb-6">
                              <p className="text-lg text-slate-700 leading-relaxed pt-1">{step}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="bg-[#e8f7f5] rounded-3xl p-8 border border-emerald-100">
                      <h3 className="text-lg font-bold text-emerald-900 mb-6 flex items-center gap-2">
                        <CheckCircle2 className="w-5 h-5 text-accent-primary" /> Do's
                      </h3>
                      <ul className="space-y-4">
                        {currentTopic.dos.map((doItem, i) => (
                          <li key={i} className="flex items-start gap-3 text-emerald-800 font-medium">
                            <div className="w-1.5 h-1.5 rounded-full bg-accent-green mt-2 shrink-0" />
                            {doItem}
                          </li>
                        ))}
                      </ul>
                    </div>
                    <div className="bg-rose-50 rounded-3xl p-8 border border-rose-100">
                      <h3 className="text-lg font-bold text-rose-900 mb-6 flex items-center gap-2">
                        <XCircle className="w-5 h-5 text-rose-600" /> Don'ts
                      </h3>
                      <ul className="space-y-4">
                        {currentTopic.donts.map((dontItem, i) => (
                          <li key={i} className="flex items-start gap-3 text-rose-800 font-medium">
                            <div className="w-1.5 h-1.5 rounded-full bg-rose-500 mt-2 shrink-0" />
                            {dontItem}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </motion.div>
              ) : (
                <div className="bg-white rounded-3xl border border-slate-200 border-dashed p-20 text-center">
                  <div className="w-20 h-20 bg-[#eff6f9] rounded-full flex items-center justify-center mx-auto mb-6">
                    <AlertTriangle className="w-10 h-10 text-slate-200" />
                  </div>
                  <h2 className="text-2xl font-bold text-primary-text mb-2">Select an Emergency Topic</h2>
                  <p className="text-secondary-text max-w-sm mx-auto">
                    Choose a topic from the list to see step-by-step first-aid instructions.
                  </p>
                </div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FirstAidGuide;


