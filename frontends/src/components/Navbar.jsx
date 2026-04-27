import { Link, useNavigate, useLocation } from 'react-router-dom';
import { LayoutDashboard, Receipt, Users, CreditCard, LogOut, Wallet, Star, Banknote } from 'lucide-react';

export default function Navbar({ isOpen }) {
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    localStorage.removeItem('token');
    navigate('/login');
  };

  const links = [
    { name: 'Dashboard', path: '/', icon: <LayoutDashboard size={20} /> },
    { name: 'Transactions', path: '/transactions', icon: <Receipt size={20} /> },
    { name: 'Clients', path: '/clients', icon: <Users size={20} /> },
    { name: 'Debts', path: '/debts', icon: <CreditCard size={20} /> },
    { name: 'Cash Liquidity', path: '/cash-balance', icon: <Banknote size={20} /> },
    { name: 'Ayoub', path: '/ayoub', icon: <Star size={20} fill="var(--warning)" color="var(--warning)" /> },
  ];

  return (
    <aside className={`sidebar ${isOpen ? 'mobile-open' : ''}`}>
      <div className="nav-brand">
        <h2 style={{ color: 'var(--primary)', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <Wallet size={28} /> AG Cell
        </h2>
      </div>
      <div className="nav-links">
        {links.map((link) => (
          <Link
            key={link.path}
            to={link.path}
            className={location.pathname === link.path ? 'active' : ''}
          >
            {link.icon} {link.name}
          </Link>
        ))}
      </div>
      <button onClick={handleLogout} className="logout-btn">
        <LogOut size={20} /> Logout Account
      </button>
    </aside>
  );
}
