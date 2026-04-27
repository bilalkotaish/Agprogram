import { useState, useEffect } from 'react';
import api from '../api';
import { CreditCard, CheckCircle, AlertCircle, User, DollarSign, Edit2, Trash2, Check, X, FileSpreadsheet } from 'lucide-react';
import { useNotification } from '../context/NotificationContext';
import { exportToExcel } from '../utils/exportExcel';

export default function Debts() {
  const [debts, setDebts] = useState([]);
  const [clients, setClients] = useState([]);
  const [form, setForm] = useState({
    client_id: '',
    amount: '',
    type: 'owed_to_me'
  });
  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState(null);
  
  const { showAlert, showConfirm } = useNotification();

  useEffect(() => {
    fetchDebts();
    fetchClients();
  }, []);

  const fetchDebts = async () => {
    try {
      const { data } = await api.get('/debts');
      setDebts(data);
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
    const dataToExport = debts.map(d => ({
      Date: new Date(d.created_at).toLocaleDateString(),
      Client: d.client_name,
      Type: d.type === 'owed_to_me' ? 'Receivable' : 'Payable',
      Amount: Number(d.amount),
      Status: d.status.toUpperCase()
    }));
    exportToExcel(dataToExport, 'Debts_Export', 'Debts');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.client_id) return showAlert('Missing Data', 'Please select a client.');
    try {
      await api.post('/debts', form);
      setForm({ client_id: '', amount: '', type: 'owed_to_me' });
      fetchDebts();
      showAlert('Success', 'Debt entry has been created.');
    } catch (err) {
      showAlert('Error', err.response?.data?.message || 'Error adding debt');
    }
  };

  const handleDelete = async (id) => {
    showConfirm(
      'Remove Debt Record?', 
      'Are you sure you want to delete this debt entry? This cannot be reversed.', 
      async () => {
        try {
          await api.delete(`/debts/${id}`);
          fetchDebts();
          showAlert('Deleted', 'Entry has been removed.');
        } catch (err) {
          showAlert('Error', 'Could not delete debt.');
        }
      },
      true // isDanger
    );
  };

  const startEdit = (debt) => {
    setEditingId(debt.id);
    setEditForm({ ...debt });
  };

  const handleUpdate = async () => {
    try {
      await api.put(`/debts/${editingId}`, editForm);
      setEditingId(null);
      fetchDebts();
      showAlert('Updated', 'Debt entry updated successfully.');
    } catch (err) {
      showAlert('Error', 'Error updating debt');
    }
  };

  const markAsPaid = async (id) => {
    try {
      await api.put(`/debts/${id}/pay`);
      fetchDebts();
      showAlert('Settled', 'Debt has been marked as paid.');
    } catch (err) {
      showAlert('Error', 'Error updating debt');
    }
  };

  return (
    <div>
      <div style={{ marginBottom: '2.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
        <div>
          <h1 style={{ fontSize: '2rem', fontWeight: 700 }}>Debt Management</h1>
          <p style={{ color: 'var(--text-muted)' }}>Track and settle outstanding balances with your customers.</p>
        </div>
        <button onClick={handleExport} className="btn btn-outline" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', border: '1px solid var(--success)', color: 'var(--success)' }}>
          <FileSpreadsheet size={18} /> Export to Excel
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '350px 1fr', gap: '2.5rem', alignItems: 'start' }}>
        <div className="card">
          <h3 style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <AlertCircle size={22} className="text-warning" /> New Debt Entry
          </h3>
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label>Select Customer</label>
              <select value={form.client_id} onChange={(e) => setForm({...form, client_id: e.target.value})} required>
                <option value="">-- Search Customer --</option>
                {clients.map(c => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label>Debt Amount ($)</label>
              <input 
                type="number" 
                value={form.amount} 
                onChange={(e) => setForm({...form, amount: e.target.value})} 
                placeholder="0.00"
                required 
              />
            </div>
            <div className="form-group">
              <label>Agreement Type</label>
              <select value={form.type} onChange={(e) => setForm({...form, type: e.target.value})}>
                <option value="owed_to_me">Customer owes me</option>
                <option value="i_owe">I owe the customer</option>
              </select>
            </div>
            <button type="submit" className="btn btn-primary" style={{ width: '100%' }}>Create Entry</button>
          </form>
        </div>

        <div className="card">
          <h3 style={{ marginBottom: '2rem' }}>Outstanding Ledger</h3>
          <table>
            <thead>
              <tr>
                <th>Customer</th>
                <th>Type</th>
                <th>Amount</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {debts.map(debt => (
                <tr key={debt.id}>
                  {editingId === debt.id ? (
                    <>
                      <td>
                        <select value={editForm.client_id} onChange={e => setEditForm({...editForm, client_id: e.target.value})} style={{ padding: '0.2rem' }}>
                          {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                        </select>
                      </td>
                      <td>
                        <select value={editForm.type} onChange={e => setEditForm({...editForm, type: e.target.value})} style={{ padding: '0.2rem' }}>
                          <option value="owed_to_me">Owed Me</option>
                          <option value="i_owe">I Owe</option>
                        </select>
                      </td>
                      <td>
                        <input type="number" value={editForm.amount} onChange={e => setEditForm({...editForm, amount: e.target.value})} style={{ width: '80px', padding: '0.2rem' }} />
                      </td>
                      <td>
                         <select value={editForm.status} onChange={e => setEditForm({...editForm, status: e.target.value})} style={{ padding: '0.2rem' }}>
                          <option value="unpaid">Unpaid</option>
                          <option value="paid">Paid</option>
                        </select>
                      </td>
                      <td style={{ display: 'flex', gap: '0.3rem' }}>
                        <button onClick={handleUpdate} className="btn btn-primary" style={{ padding: '0.4rem' }}><Check size={14} /></button>
                        <button onClick={() => setEditingId(null)} className="btn btn-outline" style={{ padding: '0.4rem' }}><X size={14} /></button>
                      </td>
                    </>
                  ) : (
                    <>
                      <td style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: 'rgba(255, 255, 255, 0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <User size={16} className="text-muted" />
                        </div>
                        {debt.client_name}
                      </td>
                      <td>
                        <span style={{ fontSize: '0.8rem', color: debt.type === 'owed_to_me' ? 'var(--warning)' : 'var(--danger)', fontWeight: 500 }}>
                          {debt.type === 'owed_to_me' ? 'Receivable' : 'Payable'}
                        </span>
                      </td>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', fontWeight: 700 }}>
                          <DollarSign size={14} className="text-muted" />
                          {Number(debt.amount).toLocaleString()}
                        </div>
                      </td>
                      <td>
                        <span className={`badge badge-${debt.status}`} style={{ fontSize: '0.7rem' }}>{debt.status}</span>
                      </td>
                      <td>
                        <div style={{ display: 'flex', gap: '0.4rem' }}>
                          {debt.status === 'unpaid' && (
                            <button onClick={() => markAsPaid(debt.id)} className="btn btn-outline" style={{ padding: '0.4rem', color: 'var(--success)' }} title="Mark as Paid">
                              <CheckCircle size={14} />
                            </button>
                          )}
                          <button onClick={() => startEdit(debt)} className="btn btn-outline" style={{ padding: '0.4rem' }}><Edit2 size={14} /></button>
                          <button onClick={() => handleDelete(debt.id)} className="btn btn-outline" style={{ padding: '0.4rem', color: 'var(--danger)' }}><Trash2 size={14} /></button>
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
  );
}
