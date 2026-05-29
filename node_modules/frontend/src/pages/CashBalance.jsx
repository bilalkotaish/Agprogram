import { useState, useEffect } from 'react';
import api from '../api';
import { Wallet, Smartphone, Banknote, Calculator, Save, RefreshCcw } from 'lucide-react';
import { useNotification } from '../context/NotificationContext';

const RATE = 90000;

export default function CashBalance() {
  const [form, setForm] = useState({
    system_usd: 0,
    system_lbp: 0,
    mobile_usd: 0,
    mobile_lbp: 0,
    physical_usd: 0,
    physical_lbp: 0
  });
  const [loading, setLoading] = useState(true);
  const { showAlert } = useNotification();

  useEffect(() => {
    fetchCashBalance();
  }, []);

  const fetchCashBalance = async () => {
    try {
      const { data } = await api.get('/cash-balance');
      if (data) setForm(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      await api.post('/cash-balance', form);
      showAlert('Success', 'Cash balance has been saved successfully.');
    } catch (err) {
      showAlert('Error', 'Failed to save cash balance.');
    }
  };

  const calculateTotalUSD = (usd, lbp) => {
    return Number(usd) + (Number(lbp) / RATE);
  };

  const grandTotalUSD = 
    calculateTotalUSD(form.system_usd, form.system_lbp) +
    calculateTotalUSD(form.mobile_usd, form.mobile_lbp) +
    calculateTotalUSD(form.physical_usd, form.physical_lbp);

  if (loading) return <div style={{ padding: '2rem', textAlign: 'center' }}>Loading balances...</div>;

  const categories = [
    { id: 'system', name: 'System Cash', icon: <Calculator className="text-primary" /> },
    { id: 'mobile', name: 'Mobile Wallets', icon: <Smartphone className="text-success" /> },
    { id: 'physical', name: 'Physical Drawer', icon: <Banknote className="text-warning" /> },
  ];

  return (
    <div>
      <div style={{ marginBottom: '2.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ fontSize: '2rem', fontWeight: 700 }}>Cash Liquidity</h1>
          <p style={{ color: 'var(--text-muted)' }}>Track your assets across system, mobile, and physical forms.</p>
        </div>
        <div className="card" style={{ padding: '1rem 2rem', background: 'var(--primary-dark)', border: '1px solid var(--primary)' }}>
          <h3 style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Grand Total (USD)</h3>
          <div style={{ fontSize: '2rem', fontWeight: 700, color: 'white' }}>
            ${grandTotalUSD.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
          <p style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.6)' }}>Rate: 1$ = 90,000 LBP</p>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '2rem' }}>
        {categories.map((cat) => (
          <div key={cat.id} className="card">
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.5rem' }}>
              <div style={{ width: '40px', height: '40px', borderRadius: '0.75rem', background: 'rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                {cat.icon}
              </div>
              <h3 style={{ fontSize: '1.2rem' }}>{cat.name}</h3>
            </div>

            <div className="form-group">
              <label>Amount in USD ($)</label>
              <input 
                type="number" 
                value={form[`${cat.id}_usd`]} 
                onChange={(e) => setForm({...form, [`${cat.id}_usd`]: e.target.value})}
                placeholder="0.00"
              />
            </div>

            <div className="form-group">
              <label>Amount in LBP</label>
              <input 
                type="number" 
                value={form[`${cat.id}_lbp`]} 
                onChange={(e) => setForm({...form, [`${cat.id}_lbp`]: e.target.value})}
                placeholder="0"
              />
            </div>

            <div style={{ marginTop: '1.5rem', paddingTop: '1.5rem', borderTop: '1px solid var(--glass-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Category Total:</span>
              <span style={{ fontWeight: 700, color: 'var(--text-main)' }}>
                ${calculateTotalUSD(form[`${cat.id}_usd`], form[`${cat.id}_lbp`]).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
            </div>
          </div>
        ))}
      </div>

      <div style={{ marginTop: '2.5rem', display: 'flex', justifyContent: 'flex-end', gap: '1rem' }}>
        <button onClick={fetchCashBalance} className="btn btn-outline" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <RefreshCcw size={18} /> Reset
        </button>
        <button onClick={handleSave} className="btn btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.8rem 2rem' }}>
          <Save size={18} /> Save All Balances
        </button>
      </div>
    </div>
  );
}
