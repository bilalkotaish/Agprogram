import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import Navbar from './components/Navbar';
import Dashboard from './pages/Dashboard';
import Login from './pages/Login';
import Register from './pages/Register';
import Transactions from './pages/Transactions';
import Clients from './pages/Clients';
import Debts from './pages/Debts';
import Ayoub from './pages/Ayoub';
import CashBalance from './pages/CashBalance';
import { NotificationProvider } from './context/NotificationContext';
import { Menu, X } from 'lucide-react';

function App() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  return (
    <NotificationProvider>
      <Router>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/*" element={
            <PrivateRoute>
              <div className="app-layout">
                {/* Mobile Toggle Button */}
                <button 
                  className="mobile-nav-toggle"
                  onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                >
                  {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
                </button>

                {/* Sidebar Component */}
                <Navbar isOpen={isMobileMenuOpen} />
                
                {/* Overlay for mobile when menu is open */}
                {isMobileMenuOpen && (
                  <div 
                    className="modal-overlay" 
                    style={{ zIndex: 90 }} 
                    onClick={() => setIsMobileMenuOpen(false)}
                  />
                )}

                <main className="main-content">
                  <Routes>
                    <Route path="/" element={<Dashboard />} />
                    <Route path="/transactions" element={<Transactions />} />
                    <Route path="/clients" element={<Clients />} />
                    <Route path="/debts" element={<Debts />} />
                    <Route path="/ayoub" element={<Ayoub />} />
                    <Route path="/cash-balance" element={<CashBalance />} />
                  </Routes>
                </main>
              </div>
            </PrivateRoute>
          } />
        </Routes>
      </Router>
    </NotificationProvider>
  );
}

function PrivateRoute({ children }) {
  const token = localStorage.getItem('token');
  return token ? children : <Navigate to="/login" />;
}

export default App;
