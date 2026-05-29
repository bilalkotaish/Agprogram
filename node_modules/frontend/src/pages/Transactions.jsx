import { useState, useEffect, useMemo } from 'react';
import api from '../api';
import { PlusCircle, Trash2, Edit2, Check, X, FileSpreadsheet, ChevronLeft, ChevronRight, Archive, Clock, DollarSign, ArrowUpCircle, ArrowDownCircle, CalendarDays } from 'lucide-react';
import { useNotification } from '../context/NotificationContext';
import { exportToExcel } from '../utils/exportExcel';

const getTodayStr = () => {
  const d = new Date();
  return d.getFullYear() + '-' + String(d.getMonth()+1).padStart(2,'0') + '-' + String(d.getDate()).padStart(2,'0');
};

const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December'];
const DAYS = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];

export default function Transactions() {
  const [transactions, setTransactions] = useState([]);
  const [clients, setClients] = useState([]);
  const [form, setForm] = useState({ type: 'deposit', amount: '', commission: '', client_id: '' });
  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState(null);
  const [dailyReports, setDailyReports] = useState([]);
  const [selectedDate, setSelectedDate] = useState(getTodayStr());
  const [viewingReport, setViewingReport] = useState(null);
  const [calMonth, setCalMonth] = useState(new Date().getMonth());
  const [calYear, setCalYear] = useState(new Date().getFullYear());

  const { showAlert, showConfirm } = useNotification();
  const isToday = selectedDate === getTodayStr();

  useEffect(() => { fetchTransactions(); fetchClients(); fetchDailyReports(); }, []);

  const fetchTransactions = async () => {
    try { const { data } = await api.get('/transactions'); setTransactions(data); } catch (err) { console.error(err); }
  };
  const fetchClients = async () => {
    try { const { data } = await api.get('/clients'); setClients(data); } catch (err) { console.error(err); }
  };
  const fetchDailyReports = async () => {
    try { const { data } = await api.get('/daily-reports'); setDailyReports(data); } catch (err) { console.error(err); }
  };

  const reportDatesSet = useMemo(() => new Set(dailyReports.map(r => r.date)), [dailyReports]);
  const reportMap = useMemo(() => {
    const m = {}; dailyReports.forEach(r => { m[r.date] = r; }); return m;
  }, [dailyReports]);

  const handleSelectDay = async (dateStr) => {
    setSelectedDate(dateStr);
    if (dateStr === getTodayStr()) { setViewingReport(null); return; }
    if (reportDatesSet.has(dateStr)) {
      try { const { data } = await api.get(`/daily-reports/${dateStr}`); setViewingReport(data); } catch { setViewingReport(null); }
    } else { setViewingReport(null); }
  };

  const handleExport = () => {
    const src = isToday ? transactions : (viewingReport?.transactions || []);
    const dataToExport = src.map(t => ({
      Date: t.createdAt ? new Date(t.createdAt).toLocaleDateString() : selectedDate,
      Type: (t.type || '').toUpperCase(),
      Client: t.client_name || 'Walk-in',
      Amount: Number(t.amount),
      Commission: Number(t.commission)
    }));
    exportToExcel(dataToExport, `Transactions_${selectedDate}`, 'Transactions');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (form.amount <= 0) return showAlert('Invalid Amount', 'Amount must be greater than zero.');
    try {
      await api.post('/transactions', form);
      setForm({ type: 'deposit', amount: '', commission: '', client_id: '' });
      fetchTransactions();
      showAlert('Success', 'Transaction recorded successfully.');
    } catch (err) { showAlert('Error', err.response?.data?.message || 'Error adding transaction'); }
  };

  const handleDelete = async (id) => {
    showConfirm('Delete Transaction?', 'Are you sure? This will affect your balance calculations.', async () => {
      try { await api.delete(`/transactions/${id}`); fetchTransactions(); showAlert('Deleted', 'Transaction removed.'); }
      catch { showAlert('Error', 'Could not delete transaction.'); }
    }, true);
  };

  const startEdit = (t) => { setEditingId(t.id || t._id); setEditForm({ ...t }); };

  const handleUpdate = async () => {
    try {
      await api.put(`/transactions/${editingId}`, editForm);
      setEditingId(null); fetchTransactions();
      showAlert('Updated', 'Transaction updated successfully.');
    } catch { showAlert('Error', 'Error updating transaction'); }
  };

  const handleArchiveDay = () => {
    const today = getTodayStr();
    if (transactions.length === 0) return showAlert('No Data', 'No transactions to archive.');
    showConfirm('Archive Today?', 'This will save today\'s transactions as a daily report and clear them. You won\'t be able to edit them after.', async () => {
      try {
        await api.post('/daily-reports/archive', { date: today });
        fetchTransactions(); fetchDailyReports();
        showAlert('Archived', 'Today\'s transactions have been archived.');
      } catch (err) { showAlert('Error', err.response?.data?.message || 'Failed to archive'); }
    }, false);
  };

  // Calendar logic
  const daysInMonth = new Date(calYear, calMonth + 1, 0).getDate();
  const firstDayOfWeek = new Date(calYear, calMonth, 1).getDay();
  const calendarCells = [];
  for (let i = 0; i < firstDayOfWeek; i++) calendarCells.push(null);
  for (let d = 1; d <= daysInMonth; d++) calendarCells.push(d);

  const todayCommission = transactions.reduce((s, t) => s + Number(t.commission || 0), 0);
  const todayDeposits = transactions.reduce((s, t) => t.type === 'deposit' ? s + Number(t.amount) : s, 0);
  const todayWithdrawals = transactions.reduce((s, t) => t.type === 'withdrawal' ? s + Number(t.amount) : s, 0);

  const displayTransactions = isToday ? transactions : (viewingReport?.transactions || []);
  const displayCommission = isToday ? todayCommission : (viewingReport?.totalCommission || 0);
  const displayDeposits = isToday ? todayDeposits : (viewingReport?.totalDeposits || 0);
  const displayWithdrawals = isToday ? todayWithdrawals : (viewingReport?.totalWithdrawals || 0);

  return (
    <div>
      <div style={{ marginBottom: '2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '2rem', fontWeight: 700 }}>Transaction Ledger</h1>
          <p style={{ color: 'var(--text-muted)' }}>Monitor all deposits, withdrawals, and commissions.</p>
        </div>
        <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
          {isToday && (
            <button onClick={handleArchiveDay} className="btn btn-outline" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', border: '1px solid var(--warning)', color: 'var(--warning)' }}>
              <Archive size={18} /> Close & Archive Day
            </button>
          )}
          <button onClick={handleExport} className="btn btn-outline" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', border: '1px solid var(--success)', color: 'var(--success)' }}>
            <FileSpreadsheet size={18} /> Export Excel
          </button>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="stats-grid" style={{ marginBottom: '2rem' }}>
        <div className="card stat-card">
          <h3 style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <DollarSign size={16} /> Commission
          </h3>
          <div style={{ fontSize: '2rem', fontWeight: 700, color: 'var(--primary)' }}>${displayCommission.toLocaleString()}</div>
          <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.3rem' }}>{isToday ? 'Today' : selectedDate}</div>
        </div>
        <div className="card stat-card">
          <h3 style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <ArrowDownCircle size={16} /> Deposits
          </h3>
          <div style={{ fontSize: '2rem', fontWeight: 700, color: 'var(--success)' }}>${displayDeposits.toLocaleString()}</div>
        </div>
        <div className="card stat-card">
          <h3 style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <ArrowUpCircle size={16} /> Withdrawals
          </h3>
          <div style={{ fontSize: '2rem', fontWeight: 700, color: 'var(--danger)' }}>${displayWithdrawals.toLocaleString()}</div>
        </div>
      </div>

      <div className="grid-2-cols" style={{ display: 'grid', gridTemplateColumns: '320px 1fr', gap: '2rem', alignItems: 'start' }}>
        {/* Left Column: Calendar + Form */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
          {/* Calendar */}
          <div className="card" style={{ padding: '1.5rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <button onClick={() => { if (calMonth === 0) { setCalMonth(11); setCalYear(calYear - 1); } else setCalMonth(calMonth - 1); }} className="btn btn-outline" style={{ padding: '0.4rem' }}><ChevronLeft size={16} /></button>
              <h3 style={{ fontSize: '1rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.5rem' }}><CalendarDays size={18} className="text-primary" /> {MONTHS[calMonth]} {calYear}</h3>
              <button onClick={() => { if (calMonth === 11) { setCalMonth(0); setCalYear(calYear + 1); } else setCalMonth(calMonth + 1); }} className="btn btn-outline" style={{ padding: '0.4rem' }}><ChevronRight size={16} /></button>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '2px', textAlign: 'center' }}>
              {DAYS.map(d => <div key={d} style={{ fontSize: '0.7rem', color: 'var(--text-muted)', padding: '0.3rem', fontWeight: 600 }}>{d}</div>)}
              {calendarCells.map((day, i) => {
                if (!day) return <div key={`e${i}`} />;
                const dateStr = `${calYear}-${String(calMonth+1).padStart(2,'0')}-${String(day).padStart(2,'0')}`;
                const isSel = dateStr === selectedDate;
                const isTodayCell = dateStr === getTodayStr();
                const hasReport = reportDatesSet.has(dateStr);
                const report = reportMap[dateStr];
                return (
                  <div key={dateStr} onClick={() => handleSelectDay(dateStr)}
                    style={{
                      padding: '0.35rem 0.2rem', borderRadius: '0.5rem', cursor: 'pointer', position: 'relative',
                      fontSize: '0.85rem', fontWeight: isSel ? 700 : 400, transition: 'all 0.15s',
                      background: isSel ? 'var(--primary)' : isTodayCell ? 'rgba(99,102,241,0.15)' : 'transparent',
                      color: isSel ? '#fff' : 'var(--text-main)',
                      border: isTodayCell && !isSel ? '1px solid var(--primary)' : '1px solid transparent',
                    }}>
                    {day}
                    {hasReport && <div style={{ width: 5, height: 5, borderRadius: '50%', background: 'var(--success)', margin: '2px auto 0' }} />}
                    {hasReport && report && !isSel && (
                      <div style={{ fontSize: '0.55rem', color: 'var(--success)', marginTop: '1px' }}>${report.totalCommission}</div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* New Entry Form (only for today) */}
          {isToday && (
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
                  <input type="number" value={form.amount} onChange={(e) => setForm({...form, amount: e.target.value})} placeholder="0.00" required />
                </div>
                <div className="form-group">
                  <label>Commission ($)</label>
                  <input type="number" value={form.commission} onChange={(e) => setForm({...form, commission: e.target.value})} placeholder="0.00" />
                </div>
                <div className="form-group">
                  <label>Client Reference</label>
                  <select value={form.client_id} onChange={(e) => setForm({...form, client_id: e.target.value})}>
                    <option value="">Walk-in Customer</option>
                    {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>
                <button type="submit" className="btn btn-primary" style={{ width: '100%' }}>Post Transaction</button>
              </form>
            </div>
          )}

          {/* Viewing past day info */}
          {!isToday && viewingReport && (
            <div className="card" style={{ borderLeft: '3px solid var(--warning)' }}>
              <h3 style={{ marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '1rem' }}>
                <Clock size={18} /> Archived: {selectedDate}
              </h3>
              <div style={{ fontSize: '0.9rem', color: 'var(--text-muted)', lineHeight: 1.8 }}>
                <div>Transactions: <strong style={{ color: 'var(--text-main)' }}>{viewingReport.transactionCount}</strong></div>
                <div>Total Commission: <strong style={{ color: 'var(--primary)' }}>${viewingReport.totalCommission?.toLocaleString()}</strong></div>
                <div>Deposits: <strong style={{ color: 'var(--success)' }}>${viewingReport.totalDeposits?.toLocaleString()}</strong></div>
                <div>Withdrawals: <strong style={{ color: 'var(--danger)' }}>${viewingReport.totalWithdrawals?.toLocaleString()}</strong></div>
              </div>
            </div>
          )}
          {!isToday && !viewingReport && (
            <div className="card" style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '2rem' }}>
              <CalendarDays size={32} style={{ marginBottom: '0.5rem', opacity: 0.5 }} />
              <p>No archived report for this date.</p>
            </div>
          )}
        </div>

        {/* Right Column: Transaction Table */}
        <div className="card">
          <h3 style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span>{isToday ? "Today's Activity" : `Report: ${selectedDate}`}</span>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 400 }}>{displayTransactions.length} entries</span>
          </h3>
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>Time</th><th>Type</th><th>Customer</th><th>Amount</th><th>Comm.</th>
                  {isToday && <th>Actions</th>}
                </tr>
              </thead>
              <tbody>
                {displayTransactions.length === 0 && (
                  <tr><td colSpan={isToday ? 6 : 5} style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '3rem' }}>No transactions</td></tr>
                )}
                {displayTransactions.map((t, idx) => {
                  const tId = t.id || t._id || idx;
                  const timeStr = t.createdAt ? new Date(t.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '-';
                  return (
                    <tr key={tId}>
                      {editingId === tId ? (
                        <>
                          <td colSpan="2">
                            <select value={editForm.type} onChange={e => setEditForm({...editForm, type: e.target.value})} style={{ padding: '0.3rem' }}>
                              <option value="deposit">Deposit</option>
                              <option value="withdrawal">Withdrawal</option>
                            </select>
                          </td>
                          <td>
                            <select value={editForm.client_id || ''} onChange={e => setEditForm({...editForm, client_id: e.target.value})} style={{ padding: '0.3rem' }}>
                              <option value="">None</option>
                              {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                            </select>
                          </td>
                          <td><input type="number" value={editForm.amount} onChange={e => setEditForm({...editForm, amount: e.target.value})} style={{ width: '80px', padding: '0.3rem' }} /></td>
                          <td><input type="number" value={editForm.commission} onChange={e => setEditForm({...editForm, commission: e.target.value})} style={{ width: '60px', padding: '0.3rem' }} /></td>
                          <td style={{ display: 'flex', gap: '0.3rem' }}>
                            <button onClick={handleUpdate} className="btn btn-primary" style={{ padding: '0.4rem' }}><Check size={14} /></button>
                            <button onClick={() => setEditingId(null)} className="btn btn-outline" style={{ padding: '0.4rem' }}><X size={14} /></button>
                          </td>
                        </>
                      ) : (
                        <>
                          <td style={{ fontSize: '0.85rem' }}>{timeStr}</td>
                          <td><span className={`badge badge-${t.type}`} style={{ fontSize: '0.7rem' }}>{t.type}</span></td>
                          <td style={{ fontSize: '0.9rem' }}>{t.client_name || <span className="text-muted">Walk-in</span>}</td>
                          <td className={t.type === 'deposit' ? 'text-success' : 'text-danger'} style={{ fontWeight: 600 }}>${Number(t.amount).toLocaleString()}</td>
                          <td className="text-muted" style={{ fontSize: '0.9rem' }}>${Number(t.commission || 0).toLocaleString()}</td>
                          {isToday && (
                            <td>
                              <div style={{ display: 'flex', gap: '0.5rem' }}>
                                <button onClick={() => startEdit(t)} className="btn btn-outline" style={{ padding: '0.4rem' }}><Edit2 size={14} /></button>
                                <button onClick={() => handleDelete(tId)} className="btn btn-outline" style={{ padding: '0.4rem', color: 'var(--danger)' }}><Trash2 size={14} /></button>
                              </div>
                            </td>
                          )}
                        </>
                      )}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
