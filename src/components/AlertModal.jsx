import Modal from './Modal';

export default function AlertModal({ isOpen, onClose, title, message, type = 'error' }) {
    const isError = type === 'error';

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={title}>
            <div className="space-y-4">
                <div className={`p-4 rounded-lg flex gap-3 ${isError
                        ? 'bg-red-50 dark:bg-red-900/10 text-red-800 dark:text-red-200'
                        : 'bg-green-50 dark:bg-green-900/10 text-green-800 dark:text-green-200'
                    }`}>
                    <span className="material-symbols-outlined">
                        {isError ? 'error' : 'check_circle'}
                    </span>
                    <p className="text-sm font-medium pt-0.5">{message}</p>
                </div>
                <div className="flex justify-end">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 bg-slate-900 dark:bg-white text-white dark:text-black hover:bg-slate-800 dark:hover:bg-neutral-200 rounded-lg transition-colors"
                    >
                        OK
                    </button>
                </div>
            </div>
        </Modal>
    );
}
