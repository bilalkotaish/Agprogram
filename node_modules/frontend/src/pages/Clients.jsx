import { useState, useEffect } from 'react';
import api from '../api';
import { UserPlus, Search, Phone, User, Edit2, Trash2, Check, X, FileSpreadsheet } from 'lucide-react';
import { useNotification } from '../context/NotificationContext';
import { exportToExcel } from '../utils/exportExcel';

export default function Clients() {
  const [clients, setClients] = useState([]);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState({ name: '', phone: '' });
  
  const { showAlert, showConfirm } = useNotification();

  useEffect(() => {
    fetchClients();
  }, []);

  const fetchClients = async () => {
    try {
      const { data } = await api.get('/clients');
      setClients(data);
    } catch (err) {
      console.error(err);
    }
  };

  const handleExport = () => {
    const dataToExport = clients.map(c => ({
      ID: c.id,
      Name: c.name,
      Phone: c.phone || 'N/A'
    }));
    exportToExcel(dataToExport, 'Clients_Export', 'Clients');
  };

  const handleAddClient = async (e) => {
    e.preventDefault();
    try {
      await api.post('/clients', { name, phone });
      setName('');
      setPhone('');
      fetchClients();
      showAlert('Success', 'Client has been added successfully.');
    } catch (err) {
      showAlert('Error', err.response?.data?.message || 'Error adding client');
    }
  };

  const handleDelete = async (id) => {
    showConfirm(
      'Confirm Deletion', 
      'This will permanently remove the client and all associated records. Are you sure?', 
      async () => {
        try {
          await api.delete(`/clients/${id}`);
          fetchClients();
          showAlert('Deleted', 'Client has been removed.');
        } catch (err) {
          showAlert('Error', 'Could not delete client.');
        }
      },
      true // Set isDanger to true
    );
  };

  const startEdit = (client) => {
    setEditingId(client.id);
    setEditForm({ name: client.name, phone: client.phone || '' });
  };

  const handleUpdate = async (id) => {
    try {
      await api.put(`/clients/${id}`, editForm);
      setEditingId(null);
      fetchClients();
      showAlert('Updated', 'Client information has been updated.');
    } catch (err) {
      showAlert('Error', 'Error updating client');
    }
  };

  const filteredClients = clients.filter(c => 
    c.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    (c.phone && c.phone.includes(searchTerm))
  );

  return (
    <div>
      <div style={{ marginBottom: '2.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '2rem', fontWeight: 700 }}>Client Directory</h1>
          <p style={{ color: 'var(--text-muted)' }}>Manage your customer base and their contact information.</p>
        </div>
        <button onClick={handleExport} className="btn btn-outline" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', border: '1px solid var(--success)', color: 'var(--success)' }}>
          <FileSpreadsheet size={18} /> Export to Excel
        </button>
      </div>

      <div className="grid-2-cols" style={{ display: 'grid', gridTemplateColumns: '350px 1fr', gap: '2.5rem', alignItems: 'start' }}>
        <div className="card">
          <h3 style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <UserPlus size={22} className="text-primary" /> Add New Client
          </h3>
          <form onSubmit={handleAddClient}>
            <div className="form-group">
              <label>Full Name</label>
              <input 
                type="text" 
                value={name} 
                onChange={(e) => setName(e.target.value)} 
                placeholder="e.g. John Doe"
                required 
              />
            </div>
            <div className="form-group">
              <label>Phone Number (Optional)</label>
              <input 
                type="text" 
                value={phone} 
                onChange={(e) => setPhone(e.target.value)} 
                placeholder="e.g. +123456789"
              />
            </div>
            <button type="submit" className="btn btn-primary" style={{ width: '100%' }}>Create Client Profile</button>
          </form>
        </div>

        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
            <h3>Customer List</h3>
            <div style={{ position: 'relative', width: '100%', maxWidth: '250px' }}>
              <Search size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
              <input 
                type="text" 
                placeholder="Search clients..." 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                style={{ paddingLeft: '2.5rem' }}
              />
            </div>
          </div>
          
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>Customer</th>
                  <th>Contact</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredClients.map(client => (
                  <tr key={client.id}>
                    {editingId === client.id ? (
                      <>
                        <td>
                          <input 
                            value={editForm.name} 
                            onChange={e => setEditForm({...editForm, name: e.target.value})}
                            style={{ padding: '0.4rem' }}
                          />
                        </td>
                        <td>
                          <input 
                            value={editForm.phone} 
                            onChange={e => setEditForm({...editForm, phone: e.target.value})}
                            style={{ padding: '0.4rem' }}
                          />
                        </td>
                        <td style={{ display: 'flex', gap: '0.5rem' }}>
                          <button onClick={() => handleUpdate(client.id)} className="btn btn-primary" style={{ padding: '0.5rem' }}><Check size={16} /></button>
                          <button onClick={() => setEditingId(null)} className="btn btn-outline" style={{ padding: '0.5rem' }}><X size={16} /></button>
                        </td>
                      </>
                    ) : (
                      <>
                        <td style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                          <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: 'rgba(99, 102, 241, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--primary)' }}>
                            <User size={18} />
                          </div>
                          {client.name}
                        </td>
                        <td>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: client.phone ? 'var(--text-main)' : 'var(--text-muted)' }}>
                            <Phone size={14} /> {client.phone || 'No phone'}
                          </div>
                        </td>
                        <td>
                          <div style={{ display: 'flex', gap: '0.5rem' }}>
                            <button onClick={() => startEdit(client)} className="btn btn-outline" style={{ padding: '0.5rem', color: 'var(--primary)' }}>
                              <Edit2 size={16} />
                            </button>
                            <button onClick={() => handleDelete(client.id)} className="btn btn-outline" style={{ padding: '0.5rem', color: 'var(--danger)' }}>
                              <Trash2 size={16} />
                            </button>
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
