import React, { useState, useEffect } from 'react';
import axios from 'axios';

const API = "https://fashion-by-nira.onrender.com/api";

// --- STATUS COLORS (Modern Pastels) ---
const getStatusStyles = (status) => {
    switch (status) {
        case 'Pending': return { bg: '#fff3e0', text: '#ef6c00', border: '#ffe0b2' }; // Orange
        case 'Order Accepted': return { bg: '#e3f2fd', text: '#1976d2', border: '#bbdefb' }; // Blue
        case 'Packed': return { bg: '#f3e5f5', text: '#7b1fa2', border: '#e1bee7' }; // Purple
        case 'Dispatched': return { bg: '#e0f7fa', text: '#0097a7', border: '#b2ebf2' }; // Cyan
        case 'Delivered': return { bg: '#e8f5e9', text: '#2e7d32', border: '#c8e6c9' }; // Green
        default: return { bg: '#f5f5f5', text: '#616161', border: '#e0e0e0' }; // Gray
    }
};

function AdminPanel({ token, setIsAdmin }) {
    const [activeTab, setActiveTab] = useState('inventory'); // Default Tab
    const [menuOpen, setMenuOpen] = useState(false); // For Mobile Sidebar

    // Data State
    const [products, setProducts] = useState([]);
    const [orders, setOrders] = useState([]);
    const [users, setUsers] = useState([]);

    // Form State
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

    // --- 1. INVENTORY LOGIC ---
    const handleProductSubmit = async (e) => {
        e.preventDefault();
        const url = editingId ? `${API}/products/${editingId}` : `${API}/products`;
        const method = editingId ? 'put' : 'post';
        await axios[method](url, product, { headers: { Authorization: token } });
        setProduct({ title: '', price: '', description: '', image: '' }); setEditingId(null);
        fetchData();
        if (editingId) setActiveTab('inventory');
    };

    const deleteProduct = async (id) => {
        if (confirm("Delete Product?")) {
            await axios.delete(`${API}/products/${id}`, { headers: { Authorization: token } });
            fetchData();
        }
    };

    // --- 2. ORDER LOGIC (UPDATED: INSTANT DROPDOWN) ---
    const updateStatus = async (id, newStatus) => {
        // Optimistic Update (Instant visual feedback)
        const updatedOrders = orders.map(o => o._id === id ? { ...o, status: newStatus } : o);
        setOrders(updatedOrders);

        // Send to Server
        try {
            await axios.put(`${API}/orders/${id}/status`, { status: newStatus }, { headers: { Authorization: token } });
            fetchData(); // Sync to be sure
        } catch (err) {
            alert("Status update failed");
            fetchData(); // Revert if failed
        }
    };

    // --- 3. USER LOGIC ---
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

    // --- STYLES ---
    const sidebarBtnStyle = (tabName) => ({
        width: '100%', padding: '12px 15px', textAlign: 'left',
        background: activeTab === tabName ? 'var(--accent)' : 'transparent',
        color: activeTab === tabName ? 'white' : 'var(--text-main)',
        border: 'none', borderRadius: '10px', marginBottom: '5px',
        cursor: 'pointer', fontSize: '14px', fontWeight: '600',
        display: 'flex', alignItems: 'center', gap: '10px'
    });

    return (
        <div style={{ minHeight: '100vh', background: 'var(--bg-body)', color: 'var(--text-main)', display: 'flex', flexDirection: 'column' }}>

            {/* TOP BAR */}
            <div style={{ background: 'var(--bg-card)', padding: '15px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border)', position: 'sticky', top: 0, zIndex: 100 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                    <button onClick={() => setMenuOpen(!menuOpen)} style={{ background: 'none', border: 'none', fontSize: '24px', cursor: 'pointer', color: 'var(--text-main)' }}>☰</button>
                    <h3 style={{ margin: 0, textTransform: 'uppercase', letterSpacing: '1px', fontSize: '18px' }}>ADMIN PANEL</h3>
                </div>
                <button onClick={() => setIsAdmin(false)} className="btn btn-outline" style={{ padding: '8px 15px', fontSize: '12px' }}>Logout</button>
            </div>

            <div style={{ display: 'flex', flex: 1, overflow: 'hidden', position: 'relative' }}>

                {/* SIDEBAR DRAWER (Mobile Responsive) */}
                {menuOpen && <div onClick={() => setMenuOpen(false)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.3)', zIndex: 110 }}></div>}
                <div style={{
                    width: '260px', background: 'var(--bg-card)', padding: '20px', borderRight: '1px solid var(--border)',
                    position: 'fixed', top: '65px', bottom: 0, left: menuOpen ? 0 : '-300px', transition: '0.3s ease', zIndex: 120,
                    display: 'flex', flexDirection: 'column'
                }}>
                    <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '10px', textTransform: 'uppercase', fontWeight: 'bold' }}>Navigation</p>
                    <button style={sidebarBtnStyle('inventory')} onClick={() => { setActiveTab('inventory'); setMenuOpen(false) }}>📦 Inventory</button>
                    <button style={sidebarBtnStyle('products')} onClick={() => { setActiveTab('products'); setEditingId(null); setProduct({ title: '', price: '', description: '', image: '' }); setMenuOpen(false) }}>✨ Add Product</button>
                    <button style={sidebarBtnStyle('orders')} onClick={() => { setActiveTab('orders'); setMenuOpen(false) }}>🚚 Orders <span style={{ background: 'var(--accent)', color: 'white', fontSize: '10px', padding: '2px 6px', borderRadius: '10px', marginLeft: 'auto' }}>{orders.length}</span></button>
                    <button style={sidebarBtnStyle('users')} onClick={() => { setActiveTab('users'); setMenuOpen(false) }}>👥 Admins</button>
                </div>

                {/* MAIN CONTENT AREA */}
                <div style={{ flex: 1, padding: '20px', marginLeft: menuOpen ? '0' : '0', overflowY: 'auto', width: '100%' }}>

                    {/* --- INVENTORY TAB --- */}
                    {activeTab === 'inventory' && (
                        <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
                            <h2 style={{ marginBottom: '20px' }}>Inventory</h2>
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '20px' }}>
                                {products.map(p => (
                                    <div key={p._id} className="card" style={{ padding: '15px', display: 'flex', alignItems: 'center', gap: '15px' }}>
                                        <img src={p.image} style={{ width: '60px', height: '60px', objectFit: 'cover', borderRadius: '8px', background: '#f9f9f9' }} />
                                        <div style={{ flex: 1 }}>
                                            <div style={{ fontWeight: 'bold', fontSize: '15px' }}>{p.title}</div>
                                            <div style={{ color: 'var(--accent)', fontWeight: 'bold' }}>₹{p.price}</div>
                                        </div>
                                        <button onClick={() => { setEditingId(p._id); setProduct(p); setActiveTab('products') }} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '18px' }}>✏️</button>
                                        <button onClick={() => deleteProduct(p._id)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '18px' }}>🗑️</button>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* --- ADD/EDIT PRODUCT TAB --- */}
                    {activeTab === 'products' && (
                        <div style={{ maxWidth: '600px', margin: '0 auto' }}>
                            <h2 style={{ marginBottom: '20px' }}>{editingId ? 'Edit Product' : 'Add New Product'}</h2>
                            <form onSubmit={handleProductSubmit} className="card" style={{ display: 'grid', gap: '15px' }}>
                                <input className="input" placeholder="Title" value={product.title} onChange={e => setProduct({ ...product, title: e.target.value })} required />
                                <input className="input" placeholder="Price" type="number" value={product.price} onChange={e => setProduct({ ...product, price: e.target.value })} required />
                                <input className="input" placeholder="Image URL" value={product.image} onChange={e => setProduct({ ...product, image: e.target.value })} />
                                <textarea className="input" placeholder="Description" value={product.description} onChange={e => setProduct({ ...product, description: e.target.value })} style={{ height: '100px' }} />
                                <button className="btn btn-primary">{editingId ? 'Update Item' : 'Add to Inventory'}</button>
                            </form>
                        </div>
                    )}

                    {/* --- ORDERS TAB (THE STATUS FIX) --- */}
                    {activeTab === 'orders' && (
                        <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
                            <h2 style={{ marginBottom: '20px' }}>Order Management</h2>
                            <div style={{ display: 'grid', gap: '20px' }}>
                                {orders.map(o => {
                                    const styles = getStatusStyles(o.status);
                                    return (
                                        <div key={o._id} className="card" style={{ borderLeft: `5px solid ${styles.text}` }}>
                                            {/* Header */}
                                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '15px', borderBottom: '1px solid var(--border)', paddingBottom: '10px' }}>
                                                <div>
                                                    <div style={{ fontWeight: 'bold', fontSize: '16px' }}>{o.customerName}</div>
                                                    <div style={{ fontSize: '13px', color: 'var(--text-muted)' }}>{o.customerPhone}</div>
                                                </div>
                                                <span style={{ fontWeight: 'bold', fontSize: '18px' }}>₹{o.totalAmount}</span>
                                            </div>

                                            {/* Products */}
                                            <div style={{ background: 'var(--bg-body)', padding: '10px', borderRadius: '10px', marginBottom: '15px' }}>
                                                {o.products.map((p, i) => (
                                                    <div key={i} style={{ fontSize: '13px', marginBottom: '5px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                                                        <img src={p.productId?.image} style={{ width: '30px', height: '30px', borderRadius: '4px' }} />
                                                        {p.productId?.title} <span style={{ fontWeight: 'bold' }}>x{p.quantity}</span>
                                                    </div>
                                                ))}
                                            </div>

                                            <div style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '15px' }}>📍 {o.shippingAddress}</div>

                                            {/* MODERN STATUS DROPDOWN (The Fix) */}
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                                <span style={{ fontSize: '13px', fontWeight: '600' }}>Status:</span>
                                                <div style={{ position: 'relative', display: 'inline-block' }}>
                                                    <select
                                                        className="input"
                                                        value={o.status}
                                                        onChange={(e) => updateStatus(o._id, e.target.value)}
                                                        style={{
                                                            appearance: 'none', WebkitAppearance: 'none', // Hides default arrow
                                                            padding: '8px 35px 8px 15px',
                                                            borderRadius: '20px',
                                                            border: `1px solid ${styles.border}`,
                                                            background: styles.bg,
                                                            color: styles.text,
                                                            fontWeight: 'bold',
                                                            fontSize: '13px',
                                                            cursor: 'pointer',
                                                            width: 'auto',
                                                            boxShadow: '0 2px 5px rgba(0,0,0,0.05)'
                                                        }}
                                                    >
                                                        {["Pending", "Order Accepted", "Packed", "Dispatched", "Delivered"].map(s => <option key={s} value={s} style={{ background: 'white', color: 'black' }}>{s}</option>)}
                                                    </select>
                                                    {/* Custom Arrow Icon */}
                                                    <span style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', fontSize: '10px', color: styles.text }}>▼</span>
                                                </div>
                                            </div>

                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    )}

                    {/* --- USERS TAB --- */}
                    {activeTab === 'users' && (
                        <div style={{ maxWidth: '600px', margin: '0 auto' }}>
                            <h2 style={{ marginBottom: '20px' }}>Admin Users</h2>
                            <div className="card" style={{ marginBottom: '30px' }}>
                                <h4 style={{ marginTop: 0, marginBottom: '15px' }}>{editUser ? 'Edit Admin' : 'Create New Admin'}</h4>
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
                                    <div><strong>{u.phoneNumber}</strong></div>
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
        </div>
    );
}

export default AdminPanel;