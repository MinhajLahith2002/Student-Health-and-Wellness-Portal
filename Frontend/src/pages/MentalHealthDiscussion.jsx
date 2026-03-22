import { motion } from "motion/react";
import { MessageCircle, Users, ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";

export default function MentalHealthDiscussion() {
  const navigate = useNavigate();

  return (
    <div className="pt-28 pb-12 px-6 max-w-3xl mx-auto min-h-screen bg-primary-bg">
      <button
        onClick={() => navigate("/mental-health")}
        className="flex items-center gap-2 text-secondary-text hover:text-primary-text mb-12 transition-colors"
      >
        <ArrowLeft className="w-5 h-5" />
        Back to Mental Health Hub
      </button>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="apple-card p-12 text-center border-none bg-white/60 backdrop-blur-sm"
      >
        <div className="w-20 h-20 rounded-full bg-accent-purple/20 flex items-center justify-center mx-auto mb-8">
          <MessageCircle className="w-10 h-10 text-accent-purple" />
        </div>
        <h1 className="text-3xl font-semibold mb-4 text-primary-text tracking-tight">
          Peer Support Discussions
        </h1>
        <p className="text-secondary-text leading-relaxed mb-8">
          Connect with fellow students anonymously. Share your journey, ask questions, and support others in a safe space.
        </p>
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-accent-purple/10 text-accent-purple text-sm font-medium">
          <Users className="w-4 h-4" />
          Coming soon
        </div>
      </motion.div>
    </div>
  );
}