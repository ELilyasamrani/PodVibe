import React, { useState } from 'react';
import { X, User, Briefcase, FileText, Mic2, Save, Trash2, Bot, UserCheck, Skull, Cat, Ghost, Smile, Glasses, Plus, Image as ImageIcon, Check, Upload } from 'lucide-react';
import { Persona } from '../types';

interface PersonaModalProps {
    persona?: Persona;
    onClose: () => void;
    onSave: (persona: Persona) => void;
    onDelete?: (id: string) => void;
}

const VOICES = ['Puck', 'Kore', 'Fenrir', 'Charon', 'Zephyr'] as const;
const PRESET_ICONS = [
    { name: 'User', icon: User },
    { name: 'Bot', icon: Bot },
    { name: 'UserCheck', icon: UserCheck },
    { name: 'Skull', icon: Skull },
    { name: 'Cat', icon: Cat },
    { name: 'Ghost', icon: Ghost },
    { name: 'Smile', icon: Smile },
    { name: 'Glasses', icon: Glasses },
    { name: 'Mic2', icon: Mic2 },
    { name: 'Briefcase', icon: Briefcase },
];

const PersonaModal: React.FC<PersonaModalProps> = ({ persona, onClose, onSave, onDelete }) => {
    const [formData, setFormData] = useState<Persona>(persona || {
        id: Date.now().toString(),
        name: '',
        role: 'Host',
        description: '',
        voice: 'Puck',
        avatarType: 'icon',
        avatarValue: 'User',
        isCustom: true
    });

    const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onloadend = () => {
            setFormData({
                ...formData,
                avatarType: 'image',
                avatarValue: reader.result as string
            });
        };
        reader.readAsDataURL(file);
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.name.trim()) return;
        onSave(formData);
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-300">
            <div className="relative w-full max-w-lg bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-2xl animate-in zoom-in-95 duration-200">
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 p-2 text-slate-500 hover:text-white hover:bg-slate-800 rounded-full transition-colors"
                >
                    <X className="w-5 h-5" />
                </button>

                <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
                    <User className="w-5 h-5 text-brand-500" />
                    {persona ? 'Edit Persona' : 'Create New Persona'}
                </h2>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="text-xs font-semibold text-slate-400 block mb-1">Name</label>
                        <div className="relative">
                            <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                            <input
                                type="text"
                                value={formData.name}
                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                placeholder="Persona Name (e.g. Expert Alex)"
                                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-10 py-2 text-white focus:outline-none focus:border-brand-500"
                                required
                            />
                        </div>
                    </div>

                    <div>
                        <label className="text-xs font-semibold text-slate-400 block mb-1">Role</label>
                        <div className="relative">
                            <Briefcase className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                            <input
                                type="text"
                                value={formData.role}
                                onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                                placeholder="Role (e.g. Host, Specialist, Interviewer)"
                                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-10 py-2 text-white focus:outline-none focus:border-brand-500"
                                required
                            />
                        </div>
                    </div>

                    <div>
                        <label className="text-xs font-semibold text-slate-400 block mb-1">Voice Profile</label>
                        <div className="flex flex-wrap gap-2">
                            {VOICES.map((v) => (
                                <button
                                    key={v}
                                    type="button"
                                    onClick={() => setFormData({ ...formData, voice: v })}
                                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold transition-all border ${formData.voice === v
                                        ? 'bg-brand-500/10 border-brand-500 text-brand-400'
                                        : 'bg-slate-950 border-slate-800 text-slate-500 hover:border-slate-600'
                                        }`}
                                >
                                    <Mic2 className="w-3 h-3" />
                                    {v}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="space-y-3">
                        <label className="text-xs font-semibold text-slate-400 block mb-1">Persona Avatar</label>
                        <div className="flex gap-4 p-4 bg-slate-950/50 rounded-xl border border-slate-800/50">
                            <div className="flex-shrink-0">
                                <div className="w-16 h-16 rounded-2xl bg-slate-900 border border-slate-700 flex items-center justify-center overflow-hidden relative group">
                                    {formData.avatarType === 'image' && formData.avatarValue ? (
                                        <img src={formData.avatarValue} alt="Avatar Preview" className="w-full h-full object-cover" />
                                    ) : (
                                        (() => {
                                            const Icon = PRESET_ICONS.find(i => i.name === formData.avatarValue)?.icon || User;
                                            return <Icon className="w-8 h-8 text-brand-500" />;
                                        })()
                                    )}
                                </div>
                            </div>
                            <div className="flex-1 space-y-3">
                                <div className="flex gap-2 bg-slate-900 p-1 rounded-lg w-fit">
                                    <button
                                        type="button"
                                        onClick={() => setFormData({ ...formData, avatarType: 'icon' })}
                                        className={`px-3 py-1 text-[10px] font-bold rounded-md transition-all ${formData.avatarType === 'icon' ? 'bg-slate-800 text-brand-400 shadow-sm' : 'text-slate-500 hover:text-slate-300'}`}
                                    >
                                        Icons
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setFormData({ ...formData, avatarType: 'image' })}
                                        className={`px-3 py-1 text-[10px] font-bold rounded-md transition-all ${formData.avatarType === 'image' ? 'bg-slate-800 text-brand-400 shadow-sm' : 'text-slate-500 hover:text-slate-300'}`}
                                    >
                                        Custom Image
                                    </button>
                                </div>

                                {formData.avatarType === 'icon' ? (
                                    <div className="grid grid-cols-5 gap-2">
                                        {PRESET_ICONS.map(({ name, icon: Icon }) => (
                                            <button
                                                key={name}
                                                type="button"
                                                onClick={() => setFormData({ ...formData, avatarValue: name })}
                                                className={`p-2 rounded-lg border transition-all ${formData.avatarValue === name
                                                    ? 'bg-brand-500/10 border-brand-500 text-brand-400'
                                                    : 'bg-slate-900 border-slate-800 text-slate-500 hover:border-slate-700'
                                                    }`}
                                            >
                                                <Icon className="w-4 h-4 mx-auto" />
                                            </button>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="relative">
                                        <input
                                            type="file"
                                            accept="image/*"
                                            onChange={handleImageUpload}
                                            className="hidden"
                                            id="avatar-upload"
                                        />
                                        <label
                                            htmlFor="avatar-upload"
                                            className="flex items-center gap-2 px-4 py-2 bg-slate-900 border border-slate-800 rounded-lg text-xs text-slate-400 hover:text-white hover:border-brand-500 cursor-pointer transition-all"
                                        >
                                            <Upload className="w-3.5 h-3.5" />
                                            {formData.avatarType === 'image' && formData.avatarValue ? 'Change Image' : 'Upload Image'}
                                        </label>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    <div>
                        <label className="text-xs font-semibold text-slate-400 block mb-1">Description / Personality</label>
                        <div className="relative">
                            <FileText className="absolute left-3 top-3 w-4 h-4 text-slate-500" />
                            <textarea
                                value={formData.description}
                                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                placeholder="Describe how this persona talks, their background, and their perspective..."
                                className="w-full bg-slate-950 border border-slate-700 rounded-lg pl-10 pr-3 py-2 text-white focus:outline-none focus:border-brand-500 h-24 resize-none text-sm"
                                required
                            />
                        </div>
                    </div>

                    <div className="flex items-center justify-between pt-4">
                        {persona && onDelete && (
                            <button
                                type="button"
                                onClick={() => onDelete(persona.id)}
                                className="flex items-center gap-2 px-4 py-2 text-red-500 hover:bg-red-500/10 rounded-lg transition-colors text-sm font-bold"
                            >
                                <Trash2 className="w-4 h-4" />
                                Delete
                            </button>
                        )}
                        <div className="flex items-center gap-3 ml-auto">
                            <button
                                type="button"
                                onClick={onClose}
                                className="px-4 py-2 text-slate-400 hover:text-white transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                className="flex items-center gap-2 px-6 py-2 bg-brand-600 hover:bg-brand-500 text-white rounded-lg font-bold shadow-lg shadow-brand-500/20 transition-all"
                            >
                                <Save className="w-4 h-4" />
                                Save Persona
                            </button>
                        </div>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default PersonaModal;
