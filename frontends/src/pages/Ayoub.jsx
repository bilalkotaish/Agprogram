import { useState, useEffect } from 'react';
import api from '../api';
import { User, Receipt, CreditCard, ArrowDownCircle, ArrowUpCircle, Trash2, Edit2, Check, X, FileSpreadsheet } from 'lucide-react';
import { exportToExcel } from '../utils/exportExcel';
import * as XLSX from 'xlsx';

export default function Ayoub() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Edit states
  const [editingTxId, setEditingTxId] = useState(null);
  const [txEditForm, setTxEditForm] = useState(null);
  const [editingDebtId, setEditingDebtId] = useState(null);
  const [debtEditForm, setDebtEditForm] = useState(null);

  useEffect(() => {
    fetchAyoubData();
  }, []);

  const fetchAyoubData = async () => {
    try {
      const res = await api.get('/clients/ledger/Ayoub');
      setData(res.data);
    } catch (err) {
      setError(err.response?.status === 404 ? 'Client "Ayoub" not found in database.' : 'Error fetching data.');
    } finally {
      setLoading(false);
    }
  };

  const handleExport = () => {
    const txData = data.transactions.map(t => ({
      Date: new Date(t.created_at).toLocaleDateString(),
      Type: t.type.toUpperCase(),
      Amount: Number(t.amount)
    }));

    const debtData = data.debts.map(d => ({
      Date: new Date(d.created_at).toLocaleDateString(),
      Status: d.status.toUpperCase(),
      Type: d.type === 'owed_to_me' ? 'Receivable' : 'Payable',
      Amount: Number(d.amount)
    }));

    const wb = XLSX.utils.book_new();
    const ws1 = XLSX.utils.json_to_sheet(txData);
    const ws2 = XLSX.utils.json_to_sheet(debtData);
    
    XLSX.utils.book_append_sheet(wb, ws1, 'Transactions');
    XLSX.utils.book_append_sheet(wb, ws2, 'Debts');
    
    XLSX.writeFile(wb, 'Ayoub_Full_Ledger.xlsx');
  };

  // Transaction Actions
  const deleteTx = async (id) => {
    if (!window.confirm('Delete this transaction?')) return;
    try {
      await api.delete(`/transactions/${id}`);
      fetchAyoubData();
    } catch (err) {
      alert('Error deleting');
    }
  };

  const saveTx = async (id) => {
    try {
      await api.put(`/transactions/${id}`, txEditForm);
      setEditingTxId(null);
      fetchAyoubData();
    } catch (err) {
      alert('Error saving');
    }
  };

  // Debt Actions
  const deleteDebt = async (id) => {
    if (!window.confirm('Delete this debt?')) return;
    try {
      await api.delete(`/debts/${id}`);
      fetchAyoubData();
    } catch (err) {
      alert('Error deleting');
    }
  };

  const saveDebt = async (id) => {
    try {
      await api.put(`/debts/${id}`, debtEditForm);
      setEditingDebtId(null);
      fetchAyoubData();
    } catch (err) {
      alert('Error saving');
    }
  };

  if (loading) return <div style={{ padding: '2rem', textAlign: 'center' }}>Loading ledger...</div>;
  
  if (error) return (
    <div className="card" style={{ textAlign: 'center', padding: '3rem' }}>
      <h2 className="text-danger">{error}</h2>
      <p style={{ marginTop: '1rem', color: 'var(--text-muted)' }}>Please add a client named "Ayoub" in the Clients page first.</p>
    </div>
  );

  const netDebt = data.debts.reduce((acc, d) => {
    if (d.status === 'paid') return acc;
    return d.type === 'owed_to_me' ? acc + Number(d.amount) : acc - Number(d.amount);
  }, 0);

  return (
    <div>
      <div style={{ marginBottom: '2.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
          <div style={{ width: '64px', height: '64px', borderRadius: '1rem', background: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white' }}>
            <User size={32} />
          </div>
          <div>
            <h1 style={{ fontSize: '2rem', fontWeight: 700 }}>Ayoub Ledger</h1>
            <p style={{ color: 'var(--text-muted)' }}>Direct view of all transactions and debts for Ayoub.</p>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'center' }}>
          <button onClick={handleExport} className="btn btn-outline" style={{ border: '1px solid var(--success)', color: 'var(--success)' }}>
            <FileSpreadsheet size={18} /> Export Ledger
          </button>
          
          <div className="card" style={{ padding: '1rem 2rem', borderLeft: `4px solid ${netDebt >= 0 ? 'var(--success)' : 'var(--danger)'}`, minWidth: '220px' }}>
            <h3 style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Net Debt Position</h3>
            <div style={{ fontSize: '1.8rem', fontWeight: 700, color: netDebt >= 0 ? 'var(--success)' : 'var(--danger)' }}>
              {netDebt >= 0 ? '+' : ''}${netDebt.toLocaleString()}
            </div>
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
        {/* Transactions Section */}
        <div className="card">
          <h3 style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <Receipt size={20} className="text-primary" /> Transactions
          </h3>
          <table>
            <thead>
              <tr>
                <th>Type</th>
                <th>Amount</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {data.transactions.map(t => (
                <tr key={t.id}>
                  {editingTxId === t.id ? (
                    <>
                      <td>
                        <select value={txEditForm.type} onChange={e => setTxEditForm({...txEditForm, type: e.target.value})} style={{ padding: '0.2rem' }}>
                          <option value="deposit">Dep</option>
                          <option value="withdrawal">With</option>
                        </select>
                      </td>
                      <td>
                        <input type="number" value={txEditForm.amount} onChange={e => setTxEditForm({...txEditForm, amount: e.target.value})} style={{ width: '80px', padding: '0.2rem' }} />
                      </td>
                      <td style={{ display: 'flex', gap: '0.4rem' }}>
                        <button onClick={() => saveTx(t.id)} className="btn btn-primary" style={{ padding: '0.4rem' }}><Check size={14} /></button>
                        <button onClick={() => setEditingTxId(null)} className="btn btn-outline" style={{ padding: '0.4rem' }}><X size={14} /></button>
                      </td>
                    </>
                  ) : (
                    <>
                      <td>
                        <span className={`badge badge-${t.type}`} style={{ fontSize: '0.75rem' }}>{t.type}</span>
                      </td>
                      <td className={t.type === 'deposit' ? 'text-success' : 'text-danger'}>
                        ${Number(t.amount).toLocaleString()}
                      </td>
                      <td>
                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                          <button onClick={() => { setEditingTxId(t.id); setTxEditForm({...t}); }} className="btn btn-outline" style={{ padding: '0.4rem' }}><Edit2 size={14} /></button>
                          <button onClick={() => deleteTx(t.id)} className="btn btn-outline" style={{ padding: '0.4rem', color: 'var(--danger)' }}><Trash2 size={14} /></button>
                        </div>
                      </td>
                    </>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Debts Section */}
        <div className="card">
          <h3 style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <CreditCard size={20} className="text-warning" /> Debts
          </h3>
          <table>
            <thead>
              <tr>
                <th>Status</th>
                <th>Amount</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {data.debts.map(d => (
                <tr key={d.id}>
                  {editingDebtId === d.id ? (
                    <>
                      <td>
                        <select value={debtEditForm.status} onChange={e => setDebtEditForm({...debtEditForm, status: e.target.value})} style={{ padding: '0.2rem' }}>
                          <option value="unpaid">Unpaid</option>
                          <option value="paid">Paid</option>
                        </select>
                      </td>
                      <td>
                        <input type="number" value={debtEditForm.amount} onChange={e => setDebtEditForm({...debtEditForm, amount: e.target.value})} style={{ width: '80px', padding: '0.2rem' }} />
                      </td>
                      <td style={{ display: 'flex', gap: '0.4rem' }}>
                        <button onClick={() => saveDebt(d.id)} className="btn btn-primary" style={{ padding: '0.4rem' }}><Check size={14} /></button>
                        <button onClick={() => setEditingDebtId(null)} className="btn btn-outline" style={{ padding: '0.4rem' }}><X size={14} /></button>
                      </td>
                    </>
                  ) : (
                    <>
                      <td><span className={`badge badge-${d.status}`} style={{ fontSize: '0.75rem' }}>{d.status}</span></td>
                      <td className={d.type === 'owed_to_me' ? 'text-warning' : 'text-danger'} style={{ fontWeight: 600 }}>
                        {d.type === 'owed_to_me' ? '+' : '-'}${Number(d.amount).toLocaleString()}
                      </td>
                      <td>
                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                          <button onClick={() => { setEditingDebtId(d.id); setDebtEditForm({...d}); }} className="btn btn-outline" style={{ padding: '0.4rem' }}><Edit2 size={14} /></button>
                          <button onClick={() => deleteDebt(d.id)} className="btn btn-outline" style={{ padding: '0.4rem', color: 'var(--danger)' }}><Trash2 size={14} /></button>
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
