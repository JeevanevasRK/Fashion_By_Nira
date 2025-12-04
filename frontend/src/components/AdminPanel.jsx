import React, { useState, useEffect } from 'react';
import axios from 'axios';

const API = "https://fashion-by-nira.onrender.com/api";

// --- HELPER: STATUS COLORS ---
const getStatusColor = (status) => {
    switch (status) {
        case 'Pending': return '#ff9800'; // Orange
        case 'Order Accepted': return '#2196f3'; // Blue
        case 'Packed': return '#9c27b0'; // Purple
        case 'Dispatched': return '#00bcd4'; // Cyan
        case 'Delivered': return '#27ae60'; // Green
        default: return '#888';
    }
};

function AdminPanel({ token, setIsAdmin }) {
    const [view, setView] = useState('inventory'); // 'inventory', 'users', 'orders'
    const [menuOpen, setMenuOpen] = useState(false);

    // Data
    const [products, setProducts] = useState([]);
    const [orders, setOrders] = useState([]);
    const [users, setUsers] = useState([]);

    // Forms
    const [product, setProduct] = useState({ title: '', price: '', description: '', image: '' });
    const [editingId, setEditingId] = useState(null);
    const [newAdmin, setNewAdmin] = useState({ phoneNumber: '', password: '' });
    const [editUser, setEditUser] = useState(null);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            const oRes = await axios.get(`${API}/orders/all-orders`, { headers: { Authorization: token } });
            setOrders(oRes.data);
            const pRes = await axios.get(`${API}/products`);
            setProducts(pRes.data);
            const uRes = await axios.get(`${API}/auth/admins`, { headers: { Authorization: token } });
            setUsers(uRes.data);
        } catch (e) { console.error(e); }
    };

    // --- ACTIONS ---
    const handleProductSubmit = async (e) => {
        e.preventDefault();
        const url = editingId ? `${API}/products/${editingId}` : `${API}/products`;
        const method = editingId ? 'put' : 'post';
        await axios[method](url, product, { headers: { Authorization: token } });
        setProduct({ title: '', price: '', description: '', image: '' }); setEditingId(null);
        fetchData();
    };

    const deleteProduct = async (id) => {
        if (confirm("Delete Product?")) {
            await axios.delete(`${API}/products/${id}`, { headers: { Authorization: token } });
            fetchData();
        }
    };

    // UPDATED: No Popup, Instant Color Change
    const updateStatus = async (id, newStatus) => {
        // Optimistic UI Update (Change color instantly)
        const updatedOrders = orders.map(o => o._id === id ? { ...o, status: newStatus } : o);
        setOrders(updatedOrders);

        await axios.put(`${API}/orders/${id}/status`, { status: newStatus }, { headers: { Authorization: token } });
        fetchData(); // Sync with server
    };

    const handleUserSubmit = async (e) => {
        e.preventDefault();
        try {
            if (editUser) {
                await axios.put(`${API}/auth/admins/${editUser._id}`, newAdmin, { headers: { Authorization: token } });
                setEditUser(null);
            } else {
                await axios.post(`${API}/auth/add-admin`, newAdmin, { headers: { Authorization: token } });
            }
            setNewAdmin({ phoneNumber: '', password: '' });
            fetchData();
        } catch (err) { alert("Error saving user"); }
    };

    const deleteUser = async (id) => {
        if (confirm("Delete Admin?")) {
            await axios.delete(`${API}/auth/admins/${id}`, { headers: { Authorization: token } });
            fetchData();
        }
    }

    return (
        <div style={{ minHeight: '100vh', background: 'var(--bg-body)', color: 'var(--text-main)' }}>

            {/* --- ADMIN HEADER --- */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '20px', borderBottom: '1px solid var(--border)', background: 'var(--bg-card)', position: 'sticky', top: 0, zIndex: 100 }}>
                <h2 style={{ margin: 0, fontSize: '20px', fontWeight: 800, letterSpacing: '1px' }}>ADMIN PANEL</h2>
                <button onClick={() => setMenuOpen(true)} style={{ background: 'none', border: 'none', fontSize: '24px', cursor: 'pointer', color: 'var(--text-main)' }}>☰</button>
            </div>

            {/* --- ADMIN SIDE MENU DRAWER --- */}
            {menuOpen && <div onClick={() => setMenuOpen(false)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.3)', zIndex: 1100 }}></div>}
            <div style={{
                position: 'fixed', top: 0, right: menuOpen ? 0 : '-300px', width: '280px', height: '100%',
                background: 'var(--bg-card)', zIndex: 1200, padding: '30px', transition: '0.3s ease',
                boxShadow: '-5px 0 30px rgba(0,0,0,0.1)', display: 'flex', flexDirection: 'column', gap: '15px'
            }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                    <h3 style={{ margin: 0 }}>MENU</h3>
                    <button onClick={() => setMenuOpen(false)} style={{ background: 'none', border: 'none', fontSize: '28px', cursor: 'pointer' }}>×</button>
                </div>

                <button onClick={() => { setView('inventory'); setMenuOpen(false) }} className={`btn ${view === 'inventory' ? 'btn-primary' : 'btn-outline'}`} style={{ width: '100%', justifyContent: 'flex-start' }}>📦 Inventory</button>
                <button onClick={() => { setView('orders'); setMenuOpen(false) }} className={`btn ${view === 'orders' ? 'btn-primary' : 'btn-outline'}`} style={{ width: '100%', justifyContent: 'flex-start' }}>🚚 Orders ({orders.length})</button>
                <button onClick={() => { setView('users'); setMenuOpen(false) }} className={`btn ${view === 'users' ? 'btn-primary' : 'btn-outline'}`} style={{ width: '100%', justifyContent: 'flex-start' }}>👥 Users</button>

                <button onClick={() => setIsAdmin(false)} className="btn btn-danger" style={{ marginTop: 'auto', width: '100%' }}>Logout</button>
            </div>

            {/* --- CONTENT AREA --- */}
            <div className="wrapper animate">

                {/* VIEW: INVENTORY */}
                {view === 'inventory' && (
                    <div>
                        <h2 style={{ marginBottom: '20px' }}>Manage Inventory</h2>
                        <form onSubmit={handleProductSubmit} className="card" style={{ display: 'grid', gap: '15px', marginBottom: '30px' }}>
                            <input className="input" placeholder="Product Title" value={product.title} onChange={e => setProduct({ ...product, title: e.target.value })} required />
                            <div style={{ display: 'flex', gap: '15px' }}>
                                <input className="input" placeholder="Price" type="number" value={product.price} onChange={e => setProduct({ ...product, price: e.target.value })} required style={{ flex: 1 }} />
                                <input className="input" placeholder="Image URL" value={product.image} onChange={e => setProduct({ ...product, image: e.target.value })} style={{ flex: 2 }} />
                            </div>
                            <button className="btn btn-primary">{editingId ? 'Update Product' : 'Add to Shop'}</button>
                        </form>

                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '20px' }}>
                            {products.map(p => (
                                <div key={p._id} className="card" style={{ display: 'flex', alignItems: 'center', gap: '15px', padding: '15px' }}>
                                    <img src={p.image} style={{ width: '60px', height: '60px', objectFit: 'cover', borderRadius: '8px', background: '#f9f9f9' }} />
                                    <div style={{ flex: 1 }}>
                                        <div style={{ fontWeight: 'bold' }}>{p.title}</div>
                                        <div style={{ color: 'var(--accent)', fontWeight: 'bold' }}>₹{p.price}</div>
                                    </div>
                                    <button onClick={() => { setEditingId(p._id); setProduct(p) }} style={{ border: 'none', background: 'none', cursor: 'pointer', fontSize: '18px' }}>✏️</button>
                                    <button onClick={() => deleteProduct(p._id)} style={{ border: 'none', background: 'none', cursor: 'pointer', fontSize: '18px' }}>🗑️</button>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* VIEW: ORDERS */}
                {view === 'orders' && (
                    <div>
                        <h2 style={{ marginBottom: '20px' }}>Order Management</h2>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                            {orders.map(o => (
                                <div key={o._id} className="card" style={{ borderLeft: `5px solid ${getStatusColor(o.status)}` }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '15px', borderBottom: '1px solid var(--border)', paddingBottom: '10px' }}>
                                        <div>
                                            <div style={{ fontWeight: 'bold', fontSize: '16px' }}>{o.customerName}</div>
                                            <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{o.customerPhone}</div>
                                        </div>
                                        <div style={{ textAlign: 'right' }}>
                                            <div style={{ fontWeight: 'bold', fontSize: '18px' }}>₹{o.totalAmount}</div>
                                            <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{new Date(o.createdAt).toLocaleDateString()}</div>
                                        </div>
                                    </div>

                                    <div style={{ marginBottom: '15px' }}>
                                        {o.products.map((p, i) => (
                                            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '5px', fontSize: '14px' }}>
                                                <img src={p.productId?.image} style={{ width: '30px', height: '30px', borderRadius: '4px', objectFit: 'cover' }} />
                                                <span style={{ flex: 1 }}>{p.productId?.title}</span>
                                                <span style={{ fontWeight: 'bold' }}>x{p.quantity}</span>
                                            </div>
                                        ))}
                                    </div>

                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '15px', flexWrap: 'wrap' }}>
                                        <div style={{ fontSize: '13px', color: 'var(--text-muted)', background: 'var(--bg-body)', padding: '8px', borderRadius: '8px', flex: 1 }}>
                                            📍 {o.shippingAddress}
                                        </div>

                                        {/* MODERN STATUS DROPDOWN */}
                                        <div style={{ position: 'relative' }}>
                                            <select
                                                value={o.status}
                                                onChange={(e) => updateStatus(o._id, e.target.value)}
                                                style={{
                                                    appearance: 'none', border: 'none', padding: '10px 30px 10px 15px', borderRadius: '25px',
                                                    background: getStatusColor(o.status), color: 'white', fontWeight: 'bold', cursor: 'pointer', fontSize: '13px',
                                                    boxShadow: '0 4px 10px rgba(0,0,0,0.1)'
                                                }}
                                            >
                                                {["Pending", "Order Accepted", "Packed", "Dispatched", "Delivered"].map(s => <option key={s} value={s} style={{ color: 'black', background: 'white' }}>{s}</option>)}
                                            </select>
                                            <span style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', color: 'white', pointerEvents: 'none' }}>▼</span>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* VIEW: USERS */}
                {view === 'users' && (
                    <div style={{ maxWidth: '600px', margin: '0 auto' }}>
                        <h2 style={{ marginBottom: '20px' }}>Admin Users</h2>
                        <div className="card" style={{ marginBottom: '30px' }}>
                            <h4 style={{ marginTop: 0, marginBottom: '15px' }}>{editUser ? 'Edit User' : 'Create New Admin'}</h4>
                            <form onSubmit={handleUserSubmit} style={{ display: 'grid', gap: '15px' }}>
                                <input className="input" placeholder="Phone Number" value={newAdmin.phoneNumber} onChange={e => setNewAdmin({ ...newAdmin, phoneNumber: e.target.value })} required />
                                <input className="input" placeholder={editUser ? "New Password (Optional)" : "Password"} value={newAdmin.password} onChange={e => setNewAdmin({ ...newAdmin, password: e.target.value })} required={!editUser} />
                                <div style={{ display: 'flex', gap: '10px' }}>
                                    <button className="btn btn-primary" style={{ flex: 1 }}>{editUser ? 'Update' : 'Create'}</button>
                                    {editUser && <button type="button" onClick={() => { setEditUser(null); setNewAdmin({ phoneNumber: '', password: '' }) }} className="btn btn-outline">Cancel</button>}
                                </div>
                            </form>
                        </div>

                        {users.map(u => (
                            <div key={u._id} className="card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '15px' }}>
                                <div>
                                    <strong>{u.phoneNumber}</strong> <span style={{ fontSize: '12px', color: 'gray', marginLeft: '5px' }}>(Admin)</span>
                                </div>
                                <div>
                                    <button onClick={() => { setEditUser(u); setNewAdmin({ phoneNumber: u.phoneNumber, password: '' }) }} style={{ marginRight: '15px', border: 'none', background: 'none', cursor: 'pointer' }}>✏️</button>
                                    <button onClick={() => deleteUser(u._id)} style={{ color: 'var(--danger)', border: 'none', background: 'none', cursor: 'pointer' }}>🗑️</button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

            </div>
        </div>
    );
}

export default AdminPanel;