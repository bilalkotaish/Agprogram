import { createContext, useContext, useState } from 'react';
import { AlertCircle, HelpCircle, CheckCircle, Trash2, XCircle } from 'lucide-react';

const NotificationContext = createContext();

export const NotificationProvider = ({ children }) => {
  const [modal, setModal] = useState({
    isOpen: false,
    title: '',
    message: '',
    type: 'alert', // 'alert', 'confirm', 'danger'
    onConfirm: null,
    onCancel: null
  });

  const showAlert = (title, message) => {
    setModal({
      isOpen: true,
      title,
      message,
      type: 'alert',
      onConfirm: () => setModal({ ...modal, isOpen: false })
    });
  };

  const showConfirm = (title, message, onConfirm, isDanger = false) => {
    setModal({
      isOpen: true,
      title,
      message,
      type: isDanger ? 'danger' : 'confirm',
      onConfirm: () => {
        onConfirm();
        setModal({ ...modal, isOpen: false });
      },
      onCancel: () => setModal({ ...modal, isOpen: false })
    });
  };

  const getIcon = () => {
    switch (modal.type) {
      case 'danger': return <Trash2 size={56} className="text-danger" style={{ margin: '0 auto' }} />;
      case 'confirm': return <HelpCircle size={56} className="text-primary" style={{ margin: '0 auto' }} />;
      case 'alert': return <CheckCircle size={56} className="text-success" style={{ margin: '0 auto' }} />;
      default: return <AlertCircle size={56} className="text-primary" style={{ margin: '0 auto' }} />;
    }
  };

  return (
    <NotificationContext.Provider value={{ showAlert, showConfirm }}>
      {children}
      {modal.isOpen && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ borderTop: modal.type === 'danger' ? '4px solid var(--danger)' : '1px solid var(--glass-border)' }}>
            <div style={{ marginBottom: '1.5rem' }}>
              {getIcon()}
            </div>
            <h2 style={{ marginBottom: '0.75rem', fontSize: '1.6rem', fontWeight: 700 }}>{modal.title}</h2>
            <p style={{ color: 'var(--text-muted)', marginBottom: '2.5rem', lineHeight: '1.6' }}>{modal.message}</p>
            <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
              {(modal.type === 'confirm' || modal.type === 'danger') && (
                <button className="btn btn-outline" onClick={modal.onCancel} style={{ flex: 1 }}>Cancel</button>
              )}
              <button 
                className="btn btn-primary" 
                onClick={modal.onConfirm} 
                style={{ 
                  flex: 1, 
                  background: modal.type === 'danger' ? 'var(--danger)' : 'var(--primary)' 
                }}
              >
                {modal.type === 'danger' ? 'Delete Permanently' : (modal.type === 'confirm' ? 'Confirm' : 'OK')}
              </button>
            </div>
          </div>
        </div>
      )}
    </NotificationContext.Provider>
  );
};

export const useNotification = () => useContext(NotificationContext);
