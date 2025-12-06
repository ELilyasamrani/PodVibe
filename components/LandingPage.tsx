import React, { useState } from 'react';
import { Headphones, Sparkles, Globe, Mic2, Zap, Share2, PlayCircle, Layers, ArrowRight, X, FileText, Cpu, AudioLines } from 'lucide-react';
import Footer from './Footer';

interface LandingPageProps {
  onGetStarted: () => void;
  onOpenApiDocs: () => void;
}

const LearnMoreModal: React.FC<{ isOpen: boolean; onClose: () => void }> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={onClose}></div>
      <div className="relative w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300">
        <div className="p-6 border-b border-slate-800 flex justify-between items-center bg-slate-950/50">
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-brand-500" />
            How Podvibe Works
          </h2>
          <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors p-1 hover:bg-slate-800 rounded-full">
            <X className="w-6 h-6" />
          </button>
        </div>
        
        <div className="p-8 space-y-8">
            {/* Step 1 */}
            <div className="flex gap-5">
                <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-brand-500/10 flex items-center justify-center border border-brand-500/20 text-brand-400 font-bold text-lg shadow-lg shadow-brand-500/5">1</div>
                <div>
                    <h3 className="text-lg font-semibold text-white mb-2 flex items-center gap-2">
                        <FileText className="w-4 h-4 text-brand-400" /> Input Source
                    </h3>
                    <p className="text-slate-400 text-sm leading-relaxed">
                        Paste a URL, an article, or raw text into Podvibe. You can also customize the hosts' names, language, and tone in the settings.
                    </p>
                </div>
            </div>

            {/* Step 2 */}
            <div className="flex gap-5">
                <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-brand-500/10 flex items-center justify-center border border-brand-500/20 text-brand-400 font-bold text-lg shadow-lg shadow-brand-500/5">2</div>
                <div>
                    <h3 className="text-lg font-semibold text-white mb-2 flex items-center gap-2">
                        <Cpu className="w-4 h-4 text-brand-400" /> AI Processing
                    </h3>
                    <p className="text-slate-400 text-sm leading-relaxed">
                        Gemini 2.5 Flash analyzes the content to understand context, nuance, and key takeaways, then generates a natural "deep-dive" style dialogue script.
                    </p>
                </div>
            </div>

             {/* Step 3 */}
             <div className="flex gap-5">
                <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-brand-500/10 flex items-center justify-center border border-brand-500/20 text-brand-400 font-bold text-lg shadow-lg shadow-brand-500/5">3</div>
                <div>
                    <h3 className="text-lg font-semibold text-white mb-2 flex items-center gap-2">
                        <AudioLines className="w-4 h-4 text-brand-400" /> Audio Synthesis
                    </h3>
                    <p className="text-slate-400 text-sm leading-relaxed">
                        The script is converted into high-fidelity audio using advanced multi-speaker TTS models. The result is a lifelike podcast episode you can listen to or share.
                    </p>
                </div>
            </div>
        </div>

        <div className="p-6 border-t border-slate-800 bg-slate-950/30 text-center">
            <button 
                onClick={onClose}
                className="px-8 py-2.5 bg-brand-600 hover:bg-brand-500 text-white rounded-lg font-medium transition-colors shadow-lg shadow-brand-500/20"
            >
                Start Creating
            </button>
        </div>
      </div>
    </div>
  );
};

const LandingPage: React.FC<LandingPageProps> = ({ onGetStarted, onOpenApiDocs }) => {
  const [isLearnMoreOpen, setIsLearnMoreOpen] = useState(false);

  return (
    <div className="h-screen bg-slate-950 text-slate-100 font-sans selection:bg-brand-500 selection:text-white overflow-y-auto scroll-smooth">
      <LearnMoreModal isOpen={isLearnMoreOpen} onClose={() => setIsLearnMoreOpen(false)} />
      
      {/* Navigation */}
      <nav className="border-b border-slate-800/50 bg-slate-950/80 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-3">
             <div className="bg-brand-600 rounded-xl p-2 shadow-lg shadow-brand-500/20">
              <Headphones className="w-6 h-6 text-white" />
            </div>
            <span className="font-bold text-xl tracking-tight">Pod<span className="text-brand-500">vibe</span></span>
          </div>
          <div className="flex items-center gap-4">
            <button
                onClick={onOpenApiDocs}
                className="text-sm font-medium text-slate-400 hover:text-white transition-colors"
            >
                API Docs
            </button>
            <button
                onClick={onGetStarted}
                className="px-5 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 font-medium rounded-lg transition-colors text-sm flex items-center gap-2 group"
            >
                Launch App
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative pt-20 pb-32 overflow-hidden">
        {/* Background Gradients */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-full opacity-30 pointer-events-none">
           <div className="absolute top-20 left-1/4 w-96 h-96 bg-brand-500 rounded-full blur-3xl mix-blend-screen animate-pulse-slow"></div>
           <div className="absolute bottom-20 right-1/4 w-96 h-96 bg-indigo-600 rounded-full blur-3xl mix-blend-screen"></div>
        </div>

        <div className="relative max-w-5xl mx-auto px-6 text-center z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-800/50 border border-slate-700 text-brand-300 text-xs font-medium mb-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
             <Sparkles className="w-3 h-3" />
             <span>Powered by Gemini 2.5 Flash</span>
          </div>
          
          <h1 className="text-5xl md:text-7xl font-bold leading-tight mb-8 animate-in fade-in slide-in-from-bottom-6 duration-700 delay-100">
            Turn Articles into <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-300 to-brand-500">Lifelike Podcasts</span>
          </h1>
          
          <p className="text-xl text-slate-400 mb-10 max-w-2xl mx-auto leading-relaxed animate-in fade-in slide-in-from-bottom-8 duration-700 delay-200">
            Don't just read—listen. Podvibe instantly converts text, links, and documents into engaging deep-dive conversations between two AI hosts.
          </p>
          
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 animate-in fade-in slide-in-from-bottom-10 duration-700 delay-300">
            <button
              onClick={onGetStarted}
              className="w-full sm:w-auto px-8 py-4 bg-brand-600 hover:bg-brand-500 text-white font-semibold rounded-xl shadow-xl shadow-brand-500/20 transition-all hover:scale-105 flex items-center justify-center gap-2"
            >
              <PlayCircle className="w-5 h-5" />
              Start Creating for Free
            </button>
            <button
              onClick={() => setIsLearnMoreOpen(true)}
              className="w-full sm:w-auto px-8 py-4 bg-slate-800 hover:bg-slate-700 text-white font-semibold rounded-xl border border-slate-700 transition-all hover:bg-slate-750"
            >
              Learn More
            </button>
          </div>

          {/* Visual Placeholder */}
          <div className="mt-20 relative mx-auto max-w-4xl rounded-2xl border border-slate-800 bg-slate-900/50 backdrop-blur shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-1000 delay-500 group">
             <div className="absolute top-0 w-full h-1 bg-gradient-to-r from-transparent via-brand-500 to-transparent opacity-50"></div>
             <div className="p-6 md:p-10 flex flex-col items-center">
                {/* Simulated Waveform */}
                <div className="flex items-end justify-center gap-1 h-32 w-full max-w-lg mb-8 opacity-80">
                   {[...Array(40)].map((_, i) => (
                      <div 
                        key={i} 
                        className="w-2 bg-brand-500 rounded-t-sm animate-pulse"
                        style={{ 
                          height: `${Math.max(20, Math.random() * 100)}%`,
                          animationDelay: `${i * 0.05}s`
                        }}
                      ></div>
                   ))}
                </div>
                
                {/* Simulated Transcript Line */}
                <div className="flex items-center gap-4 text-slate-300 bg-slate-800/80 px-6 py-4 rounded-xl border border-slate-700/50 group-hover:scale-105 transition-transform duration-500">
                   <div className="flex -space-x-3 shrink-0">
                      <div className="w-10 h-10 rounded-full bg-brand-600 border-2 border-slate-900 flex items-center justify-center text-xs font-bold shadow-lg">A</div>
                      <div className="w-10 h-10 rounded-full bg-emerald-600 border-2 border-slate-900 flex items-center justify-center text-xs font-bold shadow-lg">S</div>
                   </div>
                   <p className="text-sm font-medium">"So, explain this Quantum Computing concept like I'm five..."</p>
                </div>
             </div>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section id="features" className="py-32 bg-slate-900/50 border-t border-slate-800">
         <div className="max-w-7xl mx-auto px-6">
            <div className="text-center mb-20">
               <h2 className="text-3xl md:text-4xl font-bold mb-4">Everything you need to listen</h2>
               <p className="text-slate-400 max-w-2xl mx-auto">Powerful features designed to make content consumption effortless and accessible.</p>
            </div>
            
            <div className="grid md:grid-cols-3 gap-8">
               <FeatureCard 
                  icon={<Globe className="w-6 h-6 text-brand-400" />}
                  title="Multi-Language Support"
                  description="Generate podcasts in English, French, Spanish, Chinese, Arabic, and even Moroccan Darija."
               />
               <FeatureCard 
                  icon={<Mic2 className="w-6 h-6 text-brand-400" />}
                  title="Custom Personas"
                  description="Choose your hosts, define their personalities, and select specific voices for a tailored experience."
               />
               <FeatureCard 
                  icon={<Share2 className="w-6 h-6 text-brand-400" />}
                  title="Social Ready"
                  description="Export audio for Spotify or generate engaging video teasers specifically for LinkedIn, Instagram and TikTok."
               />
               <FeatureCard 
                  icon={<Zap className="w-6 h-6 text-brand-400" />}
                  title="Automation API"
                  description="Connect with n8n, Zapier, or your own code to generate episodes programmatically via webhooks."
               />
               <FeatureCard 
                  icon={<Layers className="w-6 h-6 text-brand-400" />}
                  title="Deep Dive Format"
                  description="Two hosts discuss your content in depth, making complex topics easy to understand and retain."
               />
               <FeatureCard 
                  icon={<PlayCircle className="w-6 h-6 text-brand-400" />}
                  title="Instant Playback"
                  description="Listen immediately in the browser with a beautiful visualizer and synchronized transcript."
               />
            </div>
         </div>
      </section>

      <Footer onOpenApiDocs={onOpenApiDocs} />
    </div>
  );
};

const FeatureCard: React.FC<{ icon: React.ReactNode; title: string; description: string }> = ({ icon, title, description }) => (
   <div className="p-8 rounded-2xl bg-slate-900 border border-slate-800 hover:border-brand-500/50 transition-all hover:shadow-lg hover:shadow-brand-900/10 group">
      <div className="w-12 h-12 bg-slate-800 rounded-lg flex items-center justify-center mb-6 group-hover:bg-brand-500/20 transition-colors">
         {icon}
      </div>
      <h3 className="text-xl font-bold text-white mb-3">{title}</h3>
      <p className="text-slate-400 leading-relaxed">
         {description}
      </p>
   </div>
);

export default LandingPage;