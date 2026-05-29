import { useState, useEffect, useMemo } from 'react';
import api from '../api';
import { DollarSign, Percent, ArrowUpRight, ArrowDownLeft, Users, Landmark, ChevronRight, FileSpreadsheet, TrendingUp, CalendarDays } from 'lucide-react';
import { Link } from 'react-router-dom';
import { exportToExcel } from '../utils/exportExcel';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Area, AreaChart } from 'recharts';

const MONTHS_SHORT = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

export default function Dashboard() {
  const [stats, setStats] = useState({
    balance: 0,
    totalCommissions: 0,
    owedToMe: 0,
    iOwe: 0,
    clientSummaries: []
  });
  const [dailyReports, setDailyReports] = useState([]);
  const [chartMode, setChartMode] = useState('daily'); // 'daily' or 'monthly'

  useEffect(() => {
    fetchStats();
    fetchDailyReports();
  }, []);

  const fetchStats = async () => {
    try {
      const { data } = await api.get('/dashboard');
      setStats(data);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchDailyReports = async () => {
    try {
      const { data } = await api.get('/daily-reports');
      setDailyReports(data);
    } catch (error) {
      console.error(error);
    }
  };

  // Daily chart data — last 30 days sorted ascending
  const dailyChartData = useMemo(() => {
    const sorted = [...dailyReports]
      .sort((a, b) => a.date.localeCompare(b.date))
      .slice(-30);
    return sorted.map(r => ({
      label: r.date.slice(5), // 'MM-DD'
      commission: r.totalCommission || 0,
      deposits: r.totalDeposits || 0,
      withdrawals: r.totalWithdrawals || 0,
    }));
  }, [dailyReports]);

  // Monthly chart data — aggregate by month
  const monthlyChartData = useMemo(() => {
    const monthMap = {};
    dailyReports.forEach(r => {
      const key = r.date.slice(0, 7); // 'YYYY-MM'
      if (!monthMap[key]) monthMap[key] = { commission: 0, deposits: 0, withdrawals: 0 };
      monthMap[key].commission += r.totalCommission || 0;
      monthMap[key].deposits += r.totalDeposits || 0;
      monthMap[key].withdrawals += r.totalWithdrawals || 0;
    });
    return Object.keys(monthMap)
      .sort()
      .slice(-12)
      .map(key => {
        const [y, m] = key.split('-');
        return {
          label: `${MONTHS_SHORT[parseInt(m) - 1]} ${y.slice(2)}`,
          ...monthMap[key]
        };
      });
  }, [dailyReports]);

  const chartData = chartMode === 'daily' ? dailyChartData : monthlyChartData;

  const handleExport = () => {
    const summaryData = [
      { Metric: 'Current Cash Balance', Value: stats.balance },
      { Metric: 'Total Commissions', Value: stats.totalCommissions },
      { Metric: 'Money Owed To Me', Value: stats.owedToMe },
      { Metric: 'Money I Owe', Value: stats.iOwe },
      { Metric: 'Projected Liquidity', Value: Number(stats.balance) + Number(stats.owedToMe) - Number(stats.iOwe) }
    ];
    exportToExcel(summaryData, 'Business_Summary_Report', 'Financial Overview');
  };

  const projectedLiquidity = Number(stats.balance) + Number(stats.owedToMe) - Number(stats.iOwe);

  const statCards = [
    {
      title: 'Current Cash Balance',
      subtitle: 'From Cash Liquidity',
      value: stats.balance,
      icon: <DollarSign className="text-primary" />,
      color: 'text-primary',
      link: '/cash-balance'
    },
    {
      title: 'Total Commissions',
      subtitle: 'Accumulated',
      value: stats.totalCommissions,
      icon: <Percent className="text-success" />,
      color: 'text-success'
    },
    {
      title: 'Clients Owe Me',
      subtitle: 'Receivables',
      value: stats.owedToMe,
      icon: <ArrowUpRight className="text-warning" />,
      color: 'text-warning'
    },
    {
      title: 'I Owe Clients',
      subtitle: 'Payables',
      value: stats.iOwe,
      icon: <ArrowDownLeft className="text-danger" />,
      color: 'text-danger'
    },
  ];

  // Custom tooltip for the chart
  const CustomTooltip = ({ active, payload, label }) => {
    if (!active || !payload?.length) return null;
    return (
      <div style={{
        background: 'rgba(15, 23, 42, 0.95)',
        border: '1px solid rgba(255,255,255,0.1)',
        borderRadius: '0.75rem',
        padding: '0.85rem 1.1rem',
        boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
        backdropFilter: 'blur(10px)',
      }}>
        <p style={{ color: '#94a3b8', fontSize: '0.75rem', marginBottom: '0.4rem', fontWeight: 600 }}>{label}</p>
        {payload.map((p, i) => (
          <p key={i} style={{ color: p.color, fontSize: '0.85rem', fontWeight: 600, margin: '0.15rem 0' }}>
            {p.name}: ${Number(p.value).toLocaleString()}
          </p>
        ))}
      </div>
    );
  };

  return (
    <div>
      <div style={{ marginBottom: '2.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1.5rem' }}>
        <div>
          <h1 style={{ fontSize: '2rem', fontWeight: 700 }}>Welcome back, Admin</h1>
          <p style={{ color: 'var(--text-muted)' }}>Here's your business overview based on actual cash on hand.</p>
        </div>

        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', flexWrap: 'wrap' }}>
          <button onClick={handleExport} className="btn btn-outline" style={{ border: '1px solid var(--success)', color: 'var(--success)' }}>
            <FileSpreadsheet size={18} /> Export Summary
          </button>

          <div className="card" style={{ padding: '1rem 2rem', background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.1) 0%, rgba(16, 185, 129, 0.1) 100%)', border: '1px solid var(--primary)', minWidth: '200px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.25rem' }}>
              <Landmark size={18} className="text-primary" />
              <h3 style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Net Worth</h3>
            </div>
            <div style={{ fontSize: '1.8rem', fontWeight: 700, color: 'var(--text-main)' }}>
              ${projectedLiquidity.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
          </div>
        </div>
      </div>

      <div className="stats-grid">
        {statCards.map((stat, i) => (
          <div key={i} className="card stat-card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <div>
                <h3 style={{ fontSize: '0.9rem', color: 'var(--text-muted)', marginBottom: '0.2rem' }}>{stat.title}</h3>
                <p style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase' }}>{stat.subtitle}</p>
              </div>
              {stat.icon}
            </div>

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div className={`value ${stat.color}`} style={{ fontSize: '1.5rem' }}>
                ${Number(stat.value).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </div>
              {stat.link && (
                <Link to={stat.link} style={{ color: 'var(--text-muted)', display: 'flex', alignItems: 'center', fontSize: '0.8rem', textDecoration: 'none' }}>
                  Manage <ChevronRight size={14} />
                </Link>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Commission Line Chart */}
      <div className="card" style={{ marginTop: '2rem', padding: '2rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
          <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', fontSize: '1.1rem' }}>
            <TrendingUp size={22} className="text-primary" /> Commission Trends
          </h3>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button
              onClick={() => setChartMode('daily')}
              className={`btn ${chartMode === 'daily' ? 'btn-primary' : 'btn-outline'}`}
              style={{ padding: '0.45rem 1rem', fontSize: '0.8rem' }}
            >
              <CalendarDays size={14} /> Daily
            </button>
            <button
              onClick={() => setChartMode('monthly')}
              className={`btn ${chartMode === 'monthly' ? 'btn-primary' : 'btn-outline'}`}
              style={{ padding: '0.45rem 1rem', fontSize: '0.8rem' }}
            >
              <TrendingUp size={14} /> Monthly
            </button>
          </div>
        </div>

        {chartData.length === 0 ? (
          <div style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '3rem 1rem' }}>
            <TrendingUp size={40} style={{ opacity: 0.3, marginBottom: '1rem' }} />
            <p style={{ fontSize: '1rem' }}>No archived data yet.</p>
            <p style={{ fontSize: '0.85rem', marginTop: '0.5rem' }}>Archive daily transactions to see commission trends here.</p>
          </div>
        ) : (
          <div style={{ width: '100%', height: 320 }}>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="gradCommission" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="gradDeposits" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.15} />
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="gradWithdrawals" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#ef4444" stopOpacity={0.15} />
                    <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                <XAxis
                  dataKey="label"
                  tick={{ fill: '#94a3b8', fontSize: 11 }}
                  axisLine={{ stroke: 'rgba(255,255,255,0.08)' }}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fill: '#94a3b8', fontSize: 11 }}
                  axisLine={{ stroke: 'rgba(255,255,255,0.08)' }}
                  tickLine={false}
                  tickFormatter={v => `$${v}`}
                />
                <Tooltip content={<CustomTooltip />} />
                <Area
                  type="monotone"
                  dataKey="commission"
                  name="Commission"
                  stroke="#6366f1"
                  strokeWidth={2.5}
                  fill="url(#gradCommission)"
                  dot={{ r: 3, fill: '#6366f1', strokeWidth: 0 }}
                  activeDot={{ r: 5, fill: '#6366f1', stroke: '#fff', strokeWidth: 2 }}
                />
                <Area
                  type="monotone"
                  dataKey="deposits"
                  name="Deposits"
                  stroke="#10b981"
                  strokeWidth={1.5}
                  fill="url(#gradDeposits)"
                  dot={false}
                />
                <Area
                  type="monotone"
                  dataKey="withdrawals"
                  name="Withdrawals"
                  stroke="#ef4444"
                  strokeWidth={1.5}
                  fill="url(#gradWithdrawals)"
                  dot={false}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* Legend */}
        {chartData.length > 0 && (
          <div style={{ display: 'flex', gap: '1.5rem', justifyContent: 'center', marginTop: '1rem', flexWrap: 'wrap' }}>
            {[
              { label: 'Commission', color: '#6366f1' },
              { label: 'Deposits', color: '#10b981' },
              { label: 'Withdrawals', color: '#ef4444' },
            ].map(item => (
              <div key={item.label} style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                <div style={{ width: 10, height: 10, borderRadius: '50%', background: item.color }} />
                {item.label}
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="card" style={{ marginTop: '2rem' }}>
        <h3 style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <Users size={20} className="text-primary" /> Active Client Debt Ledger
        </h3>
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>Client Name</th>
                <th>Owed To Me</th>
                <th>I Owe Them</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {stats.clientSummaries.map(client => (
                <tr key={client.id}>
                  <td style={{ fontWeight: 500 }}>{client.name}</td>
                  <td className="text-warning">${Number(client.owed_to_me).toLocaleString()}</td>
                  <td className="text-danger">${Number(client.i_owe).toLocaleString()}</td>
                  <td>
                    {Number(client.owed_to_me) > Number(client.i_owe) ? (
                      <span className="badge badge-unpaid">Receivable</span>
                    ) : (
                      <span className="badge badge-withdrawal">Payable</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
