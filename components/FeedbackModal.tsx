import React, { useState, useEffect } from 'react';
import { Star, X, MessageSquare, Heart, Send } from 'lucide-react';

interface FeedbackModalProps {
    onClose: () => void;
    onSubmit: (rating: number, comment: string) => void;
    rating: number;
    comment: string;
    onRatingChange: (rating: number) => void;
    onCommentChange: (comment: string) => void;
    email: string;
    onEmailChange: (email: string) => void;
}

const FeedbackModal: React.FC<FeedbackModalProps> = ({
    onClose,
    onSubmit,
    rating,
    comment,
    onRatingChange,
    onCommentChange,
    email,
    onEmailChange
}) => {
    const [hoverRating, setHoverRating] = useState<number>(0);
    const [step, setStep] = useState<'rating' | 'thankyou'>('rating');

    const handleSubmit = () => {
        if (rating === 0) return;
        onSubmit(rating, comment);
        setStep('thankyou');
        setTimeout(() => {
            onClose();
        }, 2000);
    };

    if (step === 'thankyou') {
        return (
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300">
                <div className="relative w-full max-w-sm bg-slate-900 border border-slate-800 rounded-3xl p-8 shadow-2xl text-center animate-in zoom-in-95 duration-300">
                    <div className="bg-emerald-500/20 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6">
                        <Heart className="w-8 h-8 text-emerald-500 fill-emerald-500/20" />
                    </div>
                    <h2 className="text-2xl font-bold text-white mb-2">Thank You!</h2>
                    <p className="text-slate-400">Your feedback helps us make Podvibe better for everyone.</p>
                </div>
            </div>
        );
    }

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300">
            <div className="relative w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl animate-in zoom-in-95 duration-300">
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 p-2 text-slate-500 hover:text-white hover:bg-slate-800 rounded-full transition-colors"
                >
                    <X className="w-5 h-5" />
                </button>

                <div className="flex items-center gap-3 mb-6">
                    <div className="bg-brand-500/20 p-2 rounded-xl">
                        <MessageSquare className="w-5 h-5 text-brand-500" />
                    </div>
                    <div>
                        <h2 className="text-xl font-bold text-white leading-none mb-1">How's your experience?</h2>
                        <p className="text-xs text-slate-500 font-medium uppercase tracking-wider">User Feedback</p>
                    </div>
                </div>

                <div className="space-y-6">
                    <div className="flex flex-col items-center gap-4 py-4 bg-slate-950/50 rounded-2xl border border-slate-800/50">
                        <div className="flex items-center gap-1">
                            {[1, 2, 3, 4, 5].map((idx) => (
                                <button
                                    key={idx}
                                    onMouseEnter={() => setHoverRating(idx)}
                                    onMouseLeave={() => setHoverRating(0)}
                                    onClick={() => onRatingChange(idx)}
                                    className="p-1 transition-transform active:scale-90"
                                >
                                    <Star
                                        className={`w-10 h-10 transition-colors ${idx <= (hoverRating || rating)
                                            ? 'text-brand-500 fill-brand-500'
                                            : 'text-slate-700'
                                            }`}
                                    />
                                </button>
                            ))}
                        </div>
                        <p className="text-sm font-medium text-slate-400">
                            {rating === 0 ? "Tap a star to rate" : [
                                "Disappointing",
                                "Could be better",
                                "Pretty good",
                                "Great experience",
                                "Absolutely amazing!"
                            ][rating - 1]}
                        </p>
                    </div>

                    <div className="space-y-2">
                        <label className="text-xs font-semibold text-slate-400 ml-1">Any thoughts on how we can improve?</label>
                        <textarea
                            value={comment}
                            onChange={(e) => onCommentChange(e.target.value)}
                            placeholder="Tell us what you like or what's missing..."
                            className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-4 py-3 text-sm text-white focus:outline-none focus:border-brand-500 transition-colors h-24 resize-none placeholder-slate-700 shadow-inner"
                        />
                    </div>

                    <div className="space-y-2">
                        <label className="text-xs font-semibold text-slate-400 ml-1">Email (Optional)</label>
                        <input
                            type="email"
                            value={email}
                            onChange={(e) => onEmailChange(e.target.value)}
                            placeholder="To get in touch with you..."
                            className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2 text-sm text-white focus:outline-none focus:border-brand-500 transition-colors placeholder-slate-700 shadow-inner"
                        />
                    </div>

                    <div className="flex gap-3">
                        <button
                            onClick={onClose}
                            className="flex-1 px-4 py-3 text-sm font-bold text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition-all"
                        >
                            Maybe Later
                        </button>
                        <button
                            onClick={handleSubmit}
                            disabled={rating === 0}
                            className="flex-[2] bg-brand-600 hover:bg-brand-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold py-3 rounded-xl transition-all shadow-lg flex items-center justify-center gap-2"
                        >
                            <Send className="w-4 h-4" />
                            Submit Feedback
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default FeedbackModal;
