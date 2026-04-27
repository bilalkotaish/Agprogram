import { useState, useEffect } from 'react';
import api from '../api';
import { DollarSign, Percent, ArrowUpRight, ArrowDownLeft, Users, Landmark, ChevronRight, FileSpreadsheet } from 'lucide-react';
import { Link } from 'react-router-dom';
import { exportToExcel } from '../utils/exportExcel';

export default function Dashboard() {
  const [stats, setStats] = useState({
    balance: 0,
    totalCommissions: 0,
    owedToMe: 0,
    iOwe: 0,
    clientSummaries: []
  });

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const { data } = await api.get('/dashboard');
      setStats(data);
    } catch (err) {
      console.error(err);
    }
  };

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
