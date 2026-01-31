import { useEffect } from 'react';

export default function Toast({ message, type, duration, onClose }) {
    useEffect(() => {
        const timer = setTimeout(() => {
            onClose();
        }, duration);

        return () => clearTimeout(timer);
    }, [duration, onClose]);

    const bgColors = {
        success: 'bg-green-500',
        error: 'bg-red-500',
        info: 'bg-blue-500',
        warning: 'bg-yellow-500'
    };

    const icons = {
        success: 'check_circle',
        error: 'error',
        info: 'info',
        warning: 'warning'
    };

    return (
        <div className={`${bgColors[type] || 'bg-slate-800'} text-white px-4 py-3 rounded-lg shadow-lg flex items-center gap-3 min-w-[300px] animate-slide-in justify-between`}>
            <div className="flex items-center gap-3">
                <span className="material-symbols-outlined text-xl">{icons[type]}</span>
                <span className="text-sm font-medium">{message}</span>
            </div>
            <button onClick={onClose} className="text-white/80 hover:text-white transition-colors">
                <span className="material-symbols-outlined text-lg">close</span>
            </button>
        </div>
    );
}
