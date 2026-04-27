import { useState, useEffect } from 'react';
import api from '../api';
import { PlusCircle, Receipt, ArrowDownCircle, ArrowUpCircle, Calendar, Trash2, Edit2, Check, X, FileSpreadsheet } from 'lucide-react';
import { useNotification } from '../context/NotificationContext';
import { exportToExcel } from '../utils/exportExcel';

export default function Transactions() {
  const [transactions, setTransactions] = useState([]);
  const [clients, setClients] = useState([]);
  const [form, setForm] = useState({
    type: 'deposit',
    amount: '',
    commission: '',
    client_id: ''
  });
  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState(null);
  
  const { showAlert, showConfirm } = useNotification();

  useEffect(() => {
    fetchTransactions();
    fetchClients();
  }, []);

  const fetchTransactions = async () => {
    try {
      const { data } = await api.get('/transactions');
      setTransactions(data);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchClients = async () => {
    try {
      const { data } = await api.get('/clients');
      setClients(data);
    } catch (err) {
      console.error(err);
    }
  };

  const handleExport = () => {
    const dataToExport = transactions.map(t => ({
      Date: new Date(t.created_at).toLocaleDateString(),
      Type: t.type.toUpperCase(),
      Client: t.client_name || 'Walk-in',
      Amount: Number(t.amount),
      Commission: Number(t.commission)
    }));
    exportToExcel(dataToExport, 'Transactions_Export', 'Transactions');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (form.amount <= 0) return showAlert('Invalid Amount', 'Amount must be greater than zero.');
    try {
      await api.post('/transactions', form);
      setForm({ type: 'deposit', amount: '', commission: '', client_id: '' });
      fetchTransactions();
      showAlert('Success', 'Transaction recorded successfully.');
    } catch (err) {
      showAlert('Error', err.response?.data?.message || 'Error adding transaction');
    }
  };

  const handleDelete = async (id) => {
    showConfirm(
      'Delete Transaction?', 
      'Are you sure you want to delete this record? This will affect your current balance calculations.', 
      async () => {
        try {
          await api.delete(`/transactions/${id}`);
          fetchTransactions();
          showAlert('Deleted', 'Transaction has been removed.');
        } catch (err) {
          showAlert('Error', 'Could not delete transaction.');
        }
      },
      true // isDanger
    );
  };

  const startEdit = (t) => {
    setEditingId(t.id);
    setEditForm({ ...t });
  };

  const handleUpdate = async () => {
    try {
      await api.put(`/transactions/${editingId}`, editForm);
      setEditingId(null);
      fetchTransactions();
      showAlert('Updated', 'Transaction updated successfully.');
    } catch (err) {
      showAlert('Error', 'Error updating transaction');
    }
  };

  return (
    <div>
      <div style={{ marginBottom: '2.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '2rem', fontWeight: 700 }}>Transaction Ledger</h1>
          <p style={{ color: 'var(--text-muted)' }}>Monitor all deposits, withdrawals, and commissions.</p>
        </div>
        <button onClick={handleExport} className="btn btn-outline" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', border: '1px solid var(--success)', color: 'var(--success)' }}>
          <FileSpreadsheet size={18} /> Export to Excel
        </button>
      </div>

      <div className="grid-2-cols" style={{ display: 'grid', gridTemplateColumns: '350px 1fr', gap: '2.5rem', alignItems: 'start' }}>
        <div className="card">
          <h3 style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <PlusCircle size={22} className="text-primary" /> New Entry
          </h3>
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label>Transaction Type</label>
              <select value={form.type} onChange={(e) => setForm({...form, type: e.target.value})}>
                <option value="deposit">Deposit (In)</option>
                <option value="withdrawal">Withdrawal (Out)</option>
              </select>
            </div>
            <div className="form-group">
              <label>Amount ($)</label>
              <input 
                type="number" 
                value={form.amount} 
                onChange={(e) => setForm({...form, amount: e.target.value})} 
                placeholder="0.00"
                required 
              />
            </div>
            <div className="form-group">
              <label>Commission ($)</label>
              <input 
                type="number" 
                value={form.commission} 
                onChange={(e) => setForm({...form, commission: e.target.value})} 
                placeholder="0.00"
              />
            </div>
            <div className="form-group">
              <label>Client Reference</label>
              <select value={form.client_id} onChange={(e) => setForm({...form, client_id: e.target.value})}>
                <option value="">Walk-in Customer</option>
                {clients.map(c => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>
            <button type="submit" className="btn btn-primary" style={{ width: '100%' }}>Post Transaction</button>
          </form>
        </div>

        <div className="card">
          <h3 style={{ marginBottom: '2rem' }}>Recent Activity</h3>
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Type</th>
                  <th>Customer</th>
                  <th>Amount</th>
                  <th>Comm.</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {transactions.map(t => (
                  <tr key={t.id}>
                    {editingId === t.id ? (
                      <>
                        <td colSpan="2">
                          <select value={editForm.type} onChange={e => setEditForm({...editForm, type: e.target.value})} style={{ padding: '0.2rem' }}>
                            <option value="deposit">Dep</option>
                            <option value="withdrawal">With</option>
                          </select>
                        </td>
                        <td>
                          <select value={editForm.client_id || ''} onChange={e => setEditForm({...editForm, client_id: e.target.value})} style={{ padding: '0.2rem' }}>
                            <option value="">None</option>
                            {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                          </select>
                        </td>
                        <td>
                          <input type="number" value={editForm.amount} onChange={e => setEditForm({...editForm, amount: e.target.value})} style={{ width: '80px', padding: '0.2rem' }} />
                        </td>
                        <td>
                          <input type="number" value={editForm.commission} onChange={e => setEditForm({...editForm, commission: e.target.value})} style={{ width: '60px', padding: '0.2rem' }} />
                        </td>
                        <td style={{ display: 'flex', gap: '0.3rem' }}>
                          <button onClick={handleUpdate} className="btn btn-primary" style={{ padding: '0.4rem' }}><Check size={14} /></button>
                          <button onClick={() => setEditingId(null)} className="btn btn-outline" style={{ padding: '0.4rem' }}><X size={14} /></button>
                        </td>
                      </>
                    ) : (
                      <>
                        <td>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem' }}>
                            {new Date(t.created_at).toLocaleDateString()}
                          </div>
                        </td>
                        <td>
                          <span className={`badge badge-${t.type}`} style={{ fontSize: '0.7rem' }}>{t.type}</span>
                        </td>
                        <td style={{ fontSize: '0.9rem' }}>{t.client_name || <span className="text-muted">Walk-in</span>}</td>
                        <td className={t.type === 'deposit' ? 'text-success' : 'text-danger'} style={{ fontWeight: 600 }}>
                          ${Number(t.amount).toLocaleString()}
                        </td>
                        <td className="text-muted" style={{ fontSize: '0.9rem' }}>${Number(t.commission).toLocaleString()}</td>
                        <td>
                          <div style={{ display: 'flex', gap: '0.5rem' }}>
                            <button onClick={() => startEdit(t)} className="btn btn-outline" style={{ padding: '0.4rem' }}><Edit2 size={14} /></button>
                            <button onClick={() => handleDelete(t.id)} className="btn btn-outline" style={{ padding: '0.4rem', color: 'var(--danger)' }}><Trash2 size={14} /></button>
                          </div>
                        </td>
                      </>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
