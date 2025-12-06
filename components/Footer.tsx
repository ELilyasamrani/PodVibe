import React from 'react';
import { Github, Linkedin, Headphones } from 'lucide-react';

interface FooterProps {
  onOpenApiDocs?: () => void;
}

const Footer: React.FC<FooterProps> = ({ onOpenApiDocs }) => {
  return (
    <footer className="py-12 border-t border-slate-800 bg-slate-950 text-slate-500 text-sm text-center w-full mt-auto">
      <div className="max-w-7xl mx-auto px-6 flex flex-col items-center">
        <div className="flex items-center gap-2 mb-4 text-slate-300">
          <Headphones className="w-5 h-5" />
          <span className="font-bold text-lg">Podvibe</span>
        </div>
        <p className="mb-6">Built with Gemini 2.5 • React • Tailwind</p>
        
        <div className="flex flex-wrap justify-center gap-6 mb-8">
          {onOpenApiDocs && (
            <button onClick={onOpenApiDocs} className="hover:text-brand-400 transition-colors">
              API Documentation
            </button>
          )}
          <a href="https://github.com/ELilyasamrani" target="_blank" rel="noopener noreferrer" className="hover:text-brand-400 transition-colors flex items-center gap-2">
            <Github className="w-4 h-4" /> GitHub
          </a>
          <a href="https://www.linkedin.com/in/ilyaselamrani" target="_blank" rel="noopener noreferrer" className="hover:text-brand-400 transition-colors flex items-center gap-2">
            <Linkedin className="w-4 h-4" /> LinkedIn
          </a>
        </div>

        <p className="text-slate-600">
          Created by <a href="https://www.linkedin.com/in/ilyaselamrani" target="_blank" rel="noopener noreferrer" className="text-slate-400 hover:text-brand-400 transition-colors font-medium">Ilyas El Amrani</a>. This project is Open Source.
        </p>
        <p className="mt-2 text-xs text-slate-700">&copy; {new Date().getFullYear()} Podvibe. All rights reserved.</p>
      </div>
    </footer>
  );
};

export default Footer;