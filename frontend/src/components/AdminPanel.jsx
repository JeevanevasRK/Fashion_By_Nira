import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';

const API = "https://fashion-by-nira.onrender.com/api";

// --- 1. STATUS COLORS HELPER ---
const getStatusStyles = (status) => {
    switch (status) {
        case 'Pending': return { bg: '#fff3e0', text: '#ef6c00', border: '#ffe0b2' };
        case 'Order Accepted': return { bg: '#e3f2fd', text: '#1976d2', border: '#bbdefb' };
        case 'Packed': return { bg: '#f3e5f5', text: '#7b1fa2', border: '#e1bee7' };
        case 'Dispatched': return { bg: '#e0f7fa', text: '#0097a7', border: '#b2ebf2' };
        case 'Delivered': return { bg: '#e8f5e9', text: '#2e7d32', border: '#c8e6c9' };
        default: return { bg: '#f5f5f5', text: '#616161', border: '#e0e0e0' };
    }
};

// --- 2. CUSTOM DROPDOWN COMPONENT (Replaces the Popup) ---
const StatusDropdown = ({ currentStatus, onUpdate }) => {
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef(null);
    const styles = getStatusStyles(currentStatus);
    const options = ["Pending", "Order Accepted", "Packed", "Dispatched", "Delivered"];

    // Close dropdown if clicking outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    return (
        <div ref={dropdownRef} style={{ position: 'relative', minWidth: '140px' }}>
            {/* The "Badge" Button */}
            <div
                onClick={() => setIsOpen(!isOpen)}
                style={{
                    background: styles.bg, color: styles.text, border: `1px solid ${styles.border}`,
                    padding: '8px 15px', borderRadius: '20px', fontSize: '13px', fontWeight: 'bold',
                    cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                    transition: '0.2s'
                }}
            >
                {currentStatus}
                <span style={{ fontSize: '10px', marginLeft: '8px' }}>▼</span>
            </div>

            {/* The Dropdown List */}
            {isOpen && (
                <div style={{
                    position: 'absolute', top: '110%', right: 0, width: '160px',
                    background: 'white', borderRadius: '12px', boxShadow: '0 5px 20px rgba(0,0,0,0.15)',
                    zIndex: 100, overflow: 'hidden', border: '1px solid #eee', animation: 'fadeIn 0.2s'
                }}>
                    {options.map((opt) => {
                        const optStyles = getStatusStyles(opt);
                        return (
                            <div
                                key={opt}
                                onClick={() => { onUpdate(opt); setIsOpen(false); }}
                                style={{
                                    padding: '10px 15px', fontSize: '13px', cursor: 'pointer',
                                    borderBottom: '1px solid #f9f9f9', display: 'flex', alignItems: 'center', gap: '8px',
                                    background: opt === currentStatus ? '#f8f9fa' : 'white',
                                    fontWeight: opt === currentStatus ? 'bold' : 'normal'
                                }}
                                onMouseEnter={(e) => e.target.style.background = '#f4f4f4'}
                                onMouseLeave={(e) => e.target.style.background = opt === currentStatus ? '#f8f9fa' : 'white'}
                            >
                                <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: optStyles.text }}></div>
                                {opt}
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
};

function AdminPanel({ token, setIsAdmin }) {
    const [activeTab, setActiveTab] = useState('inventory');
    const [menuOpen, setMenuOpen] = useState(false);

    const [products, setProducts] = useState([]);
    const [orders, setOrders] = useState([]);
    const [users, setUsers] = useState([]);

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
        if (editingId) setActiveTab('inventory');
    };

    const deleteProduct = async (id) => {
        if (confirm("Delete Product?")) {
            await axios.delete(`${API}/products/${id}`, { headers: { Authorization: token } });
            fetchData();
        }
    };

    const updateStatus = async (id, newStatus) => {
        // Instant Optimistic Update
        const updatedOrders = orders.map(o => o._id === id ? { ...o, status: newStatus } : o);
        setOrders(updatedOrders);

        try {
            await axios.put(`${API}/orders/${id}/status`, { status: newStatus }, { headers: { Authorization: token } });
            fetchData();
        } catch (err) {
            alert("Status update failed");
            fetchData();
        }
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

    // --- NAVIGATION BUTTON STYLE (Fixed Active State) ---
    const getNavStyle = (tabName) => ({
        width: '100%',
        padding: '14px 20px',
        textAlign: 'left',
        background: activeTab === tabName ? '#000000' : 'transparent', // Black when active
        color: activeTab === tabName ? '#ffffff' : '#333333',          // White text when active
        border: 'none',
        borderRadius: '12px',
        marginBottom: '8px',
        cursor: 'pointer',
        fontSize: '14px',
        fontWeight: '600',
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        transition: 'all 0.2s ease'
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

                {/* SIDEBAR DRAWER */}
                {menuOpen && <div onClick={() => setMenuOpen(false)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.3)', zIndex: 110 }}></div>}
                <div style={{
                    width: '280px', background: 'var(--bg-card)', padding: '25px', borderRight: '1px solid var(--border)',
                    position: 'fixed', top: '65px', bottom: 0, left: menuOpen ? 0 : '-300px', transition: '0.3s ease', zIndex: 120,
                    display: 'flex', flexDirection: 'column', boxShadow: '5px 0 15px rgba(0,0,0,0.05)'
                }}>
                    <p style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '15px', textTransform: 'uppercase', fontWeight: 'bold', letterSpacing: '1px' }}>Management</p>

                    <button style={getNavStyle('inventory')} onClick={() => { setActiveTab('inventory'); setMenuOpen(false) }}>
                        <span>📦</span> Inventory
                    </button>

                    <button style={getNavStyle('products')} onClick={() => { setActiveTab('products'); setEditingId(null); setProduct({ title: '', price: '', description: '', image: '' }); setMenuOpen(false) }}>
                        <span>✨</span> Add Product
                    </button>

                    <button style={getNavStyle('orders')} onClick={() => { setActiveTab('orders'); setMenuOpen(false) }}>
                        <span>🚚</span> Orders
                        <span style={{ background: activeTab === 'orders' ? 'white' : 'var(--accent)', color: activeTab === 'orders' ? 'black' : 'white', fontSize: '10px', padding: '2px 8px', borderRadius: '10px', marginLeft: 'auto' }}>{orders.length}</span>
                    </button>

                    <button style={getNavStyle('users')} onClick={() => { setActiveTab('users'); setMenuOpen(false) }}>
                        <span>👥</span> Admins
                    </button>
                </div>

                {/* MAIN CONTENT AREA */}
                <div style={{ flex: 1, padding: '20px', marginLeft: menuOpen ? '0' : '0', overflowY: 'auto', width: '100%' }}>

                    {/* --- INVENTORY --- */}
                    {activeTab === 'inventory' && (
                        <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
                            <h2 style={{ marginBottom: '20px' }}>Inventory</h2>
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '20px' }}>
                                {products.map(p => (
                                    <div key={p._id} className="card" style={{ padding: '15px', display: 'flex', alignItems: 'center', gap: '15px' }}>
                                        <img src={p.image} style={{ width: '60px', height: '60px', objectFit: 'contain', borderRadius: '8px', background: '#f9f9f9' }} />
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

                    {/* --- ADD/EDIT --- */}
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

                    {/* --- ORDERS (WITH CUSTOM DROPDOWN) --- */}
                    {activeTab === 'orders' && (
                        <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
                            <h2 style={{ marginBottom: '20px' }}>Order Management</h2>
                            <div style={{ display: 'grid', gap: '20px' }}>
                                {orders.map(o => {
                                    const styles = getStatusStyles(o.status);
                                    return (
                                        <div key={o._id} className="card" style={{ borderLeft: `5px solid ${styles.text}` }}>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '15px', borderBottom: '1px solid var(--border)', paddingBottom: '10px' }}>
                                                <div>
                                                    <div style={{ fontWeight: 'bold', fontSize: '16px' }}>{o.customerName}</div>
                                                    <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{o.customerPhone}</div>
                                                </div>
                                                <span style={{ fontWeight: 'bold', fontSize: '18px' }}>₹{o.totalAmount}</span>
                                            </div>

                                            <div style={{ background: 'var(--bg-body)', padding: '10px', borderRadius: '10px', marginBottom: '15px' }}>
                                                {o.products.map((p, i) => (
                                                    <div key={i} style={{ fontSize: '14px', marginBottom: '5px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                                                        <img src={p.productId?.image} style={{ width: '30px', height: '30px', borderRadius: '4px', objectFit: 'contain' }} />
                                                        {p.productId?.title} <span style={{ fontWeight: 'bold' }}>x{p.quantity}</span>
                                                    </div>
                                                ))}
                                            </div>

                                            <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '15px' }}>📍 {o.shippingAddress}</p>

                                            {/* THE NEW CUSTOM DROPDOWN */}
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                                                <span style={{ fontSize: '14px', fontWeight: '600' }}>Status:</span>
                                                <StatusDropdown
                                                    currentStatus={o.status}
                                                    onUpdate={(newStatus) => updateStatus(o._id, newStatus)}
                                                />
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    )}

                    {/* --- USERS --- */}
                    {activeTab === 'users' && (
                        <div style={{ maxWidth: '600px', margin: '0 auto' }}>
                            <h2 style={{ marginBottom: '20px' }}>Admin Users</h2>
                            <div className="card" style={{ marginBottom: '30px' }}>
                                <h4 style={{ marginTop: 0, marginBottom: '15px' }}>{editUser ? 'Edit User' : 'Create New Admin'}</h4>
                                <form onSubmit={handleUserSubmit} style={{ display: 'grid', gap: '10px', marginTop: '15px' }}>
                                    <input className="input" placeholder="Admin Phone" value={newAdmin.phoneNumber} onChange={e => setNewAdmin({ ...newAdmin, phoneNumber: e.target.value })} required />
                                    <input className="input" placeholder={editUser ? "New Password (Optional)" : "Password"} value={newAdmin.password} onChange={e => setNewAdmin({ ...newAdmin, password: e.target.value })} required={!editUser} />
                                    <div style={{ display: 'flex', gap: '10px' }}>
                                        <button className="btn btn-primary" style={{ flex: 1 }}>{editUser ? 'Update' : 'Create'}</button>
                                        {editUser && <button type="button" onClick={() => { setEditUser(null); setNewAdmin({ phoneNumber: '', password: '' }) }} className="btn btn-outline">Cancel</button>}
                                    </div>
                                </form>
                            </div>

                            {users.map(u => (
                                <div key={u._id} className="card" style={{ padding: '15px', marginBottom: '10px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
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
        </div>
    );
}

export default AdminPanel;