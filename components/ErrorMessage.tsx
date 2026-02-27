import React from 'react';
import { AlertCircle, RefreshCw, XCircle, Clock, Key, WifiOff } from 'lucide-react';

interface ErrorMessageProps {
    error: string;
    onRetry?: () => void;
    onClose?: () => void;
}

const ErrorMessage: React.FC<ErrorMessageProps> = ({ error, onRetry, onClose }) => {
    const getErrorInfo = (msg: string) => {
        const lowerMsg = msg.toLowerCase();
        if (lowerMsg.includes('429') || lowerMsg.includes('too many requests') || lowerMsg.includes('busy')) {
            return {
                icon: <Clock className="w-5 h-5 text-amber-400" />,
                title: "AI is Busy",
                description: "The AI service is currently receiving too many requests. Please wait a moment and try again.",
                color: "amber"
            };
        }
        if (lowerMsg.includes('api key') || lowerMsg.includes('invalid') || lowerMsg.includes('401')) {
            return {
                icon: <Key className="w-5 h-5 text-red-400" />,
                title: "API Key Error",
                description: "There is an issue with your API key. Please check your settings.",
                color: "red"
            };
        }
        if (lowerMsg.includes('network') || lowerMsg.includes('fetch') || lowerMsg.includes('connection')) {
            return {
                icon: <WifiOff className="w-5 h-5 text-blue-400" />,
                title: "Connection Error",
                description: "Please check your internet connection and try again.",
                color: "blue"
            };
        }
        return {
            icon: <XCircle className="w-5 h-5 text-red-400" />,
            title: "Generation Error",
            description: msg || "Something went wrong while generating your podcast.",
            color: "red"
        };
    };

    const { icon, title, description, color } = getErrorInfo(error);

    const colorClasses = {
        amber: "border-amber-500/20 bg-amber-500/5 text-amber-200",
        red: "border-red-500/20 bg-red-500/5 text-red-200",
        blue: "border-blue-500/20 bg-blue-500/5 text-blue-200"
    }[color as 'amber' | 'red' | 'blue'];

    const buttonClasses = {
        amber: "bg-amber-500/20 hover:bg-amber-500/30 text-amber-400",
        red: "bg-red-500/20 hover:bg-red-500/30 text-red-400",
        blue: "bg-blue-500/20 hover:bg-blue-500/30 text-blue-400"
    }[color as 'amber' | 'red' | 'blue'];

    return (
        <div className={`w-full rounded-2xl border ${colorClasses} p-4 md:p-6 shadow-xl animate-in fade-in slide-in-from-top-4 duration-300`}>
            <div className="flex flex-col md:flex-row md:items-center gap-4">
                <div className={`p-3 rounded-xl bg-white/5 shrink-0 self-start md:self-center`}>
                    {icon}
                </div>

                <div className="flex-1 space-y-1">
                    <h3 className="font-bold text-base md:text-lg flex items-center gap-2 text-white">
                        {title}
                        <span className={`text-[10px] uppercase tracking-widest px-1.5 py-0.5 rounded border border-current opacity-50`}>Error</span>
                    </h3>
                    <p className="text-sm opacity-80 leading-relaxed max-w-2xl">
                        {description}
                    </p>
                </div>

                <div className="flex items-center gap-2 mt-2 md:mt-0">
                    {onRetry && (
                        <button
                            onClick={onRetry}
                            className={`flex-1 md:flex-none flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-all ${buttonClasses}`}
                        >
                            <RefreshCw className="w-4 h-4" />
                            Retry
                        </button>
                    )}
                    {onClose && (
                        <button
                            onClick={onClose}
                            className="p-2 text-slate-400 hover:text-white hover:bg-white/5 rounded-lg transition-all"
                        >
                            <AlertCircle className="w-5 h-5" />
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ErrorMessage;
