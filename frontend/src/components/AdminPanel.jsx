import React, { useState, useEffect } from 'react';
import axios from 'axios';

const API = "https://fashion-by-nira.onrender.com/api";

// --- CONFIRMATION MODAL ---
const ActionModal = ({ message, onConfirm, onCancel, confirmText = "Confirm" }) => (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 10000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div className="card animate" style={{ width: '320px', padding: '30px', textAlign: 'center', background: 'white' }}>
            <h3 style={{ marginBottom: '10px' }}>Confirmation</h3>
            <p style={{ color: '#666', marginBottom: '25px', fontSize: '14px' }}>{message}</p>
            <div style={{ display: 'flex', gap: '10px' }}>
                <button onClick={onCancel} className="btn btn-outline" style={{ flex: 1 }}>Cancel</button>
                <button onClick={onConfirm} className="btn btn-primary" style={{ flex: 1 }}>{confirmText}</button>
            </div>
        </div>
    </div>
);

function AdminPanel({ token, setIsAdmin }) {
    const [activeTab, setActiveTab] = useState('inventory'); // Default View

    // Data
    const [products, setProducts] = useState([]);
    const [orders, setOrders] = useState([]);
    const [users, setUsers] = useState([]);

    // Forms & Editing
    const [product, setProduct] = useState({ title: '', price: '', description: '', image: '' });
    const [editingId, setEditingId] = useState(null);
    const [newAdmin, setNewAdmin] = useState({ phoneNumber: '', password: '' });
    const [editUser, setEditUser] = useState(null);

    // Modal State
    const [statusModal, setStatusModal] = useState(null); // { id, status }

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

    // --- PRODUCTS ---
    const handleProductSubmit = async (e) => {
        e.preventDefault();
        const url = editingId ? `${API}/products/${editingId}` : `${API}/products`;
        const method = editingId ? 'put' : 'post';
        await axios[method](url, product, { headers: { Authorization: token } });
        setProduct({ title: '', price: '', description: '', image: '' }); setEditingId(null);
        fetchData();
        if (editingId) setActiveTab('inventory'); // Go back to list after edit
    };

    const deleteProduct = async (id) => {
        if (confirm("Delete Product?")) {
            await axios.delete(`${API}/products/${id}`, { headers: { Authorization: token } });
            fetchData();
        }
    };

    // --- ORDERS ---
    const initiateStatusUpdate = (id, status) => {
        setStatusModal({ id, status });
    };

    const confirmStatusUpdate = async () => {
        if (statusModal) {
            await axios.put(`${API}/orders/${statusModal.id}/status`, { status: statusModal.status }, { headers: { Authorization: token } });
            fetchData();
            setStatusModal(null);
        }
    };

    // --- USERS ---
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
    const sidebarBtn = (tabName) => ({
        width: '100%',
        padding: '12px 15px',
        textAlign: 'left',
        background: activeTab === tabName ? 'var(--accent)' : 'transparent',
        color: activeTab === tabName ? 'white' : 'var(--text-main)',
        border: 'none',
        borderRadius: '8px',
        marginBottom: '5px',
        cursor: 'pointer',
        fontSize: '14px',
        fontWeight: '600'
    });

    return (
        <div style={{ position: 'fixed', inset: 0, background: 'var(--bg-body)', zIndex: 1000, display: 'flex', flexDirection: 'column', color: 'var(--text-main)' }}>

            {/* TOP BAR */}
            <div style={{ background: 'var(--bg-card)', padding: '15px 30px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border)' }}>
                <h3 style={{ margin: 0, textTransform: 'uppercase', letterSpacing: '1px' }}>ADMIN DASHBOARD</h3>
                <button onClick={() => setIsAdmin(false)} className="btn btn-outline" style={{ padding: '8px 20px' }}>Logout</button>
            </div>

            <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>

                {/* SIDEBAR NAVIGATION */}
                <div style={{ width: '250px', padding: '20px', borderRight: '1px solid var(--border)', background: 'var(--bg-card)', display: 'flex', flexDirection: 'column' }}>
                    <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '10px', textTransform: 'uppercase' }}>Menu</p>
                    <button style={sidebarBtn('inventory')} onClick={() => setActiveTab('inventory')}>Inventory</button>
                    <button style={sidebarBtn('products')} onClick={() => { setActiveTab('products'); setEditingId(null); setProduct({ title: '', price: '', description: '', image: '' }) }}>Manage Products</button>
                    <button style={sidebarBtn('orders')} onClick={() => setActiveTab('orders')}>Orders</button>
                    <button style={sidebarBtn('users')} onClick={() => setActiveTab('users')}>Users</button>
                </div>

                {/* MAIN CONTENT AREA */}
                <div style={{ flex: 1, padding: '30px', overflowY: 'auto' }}>

                    {/* VIEW: INVENTORY */}
                    {activeTab === 'inventory' && (
                        <div>
                            <h2 style={{ marginBottom: '20px' }}>Current Inventory</h2>
                            <div style={{ display: 'grid', gap: '15px' }}>
                                {products.map(p => (
                                    <div key={p._id} className="card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '15px', marginBottom: '0' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                                            <img src={p.image} style={{ width: '50px', height: '50px', objectFit: 'cover', borderRadius: '8px' }} />
                                            <div>
                                                <div style={{ fontWeight: 'bold' }}>{p.title}</div>
                                                <div style={{ fontSize: '13px', color: 'var(--text-muted)' }}>₹{p.price}</div>
                                            </div>
                                        </div>
                                        <div>
                                            <button onClick={() => { setEditingId(p._id); setProduct(p); setActiveTab('products') }} style={{ marginRight: '15px', background: 'none', border: 'none', cursor: 'pointer' }}>✏️</button>
                                            <button onClick={() => deleteProduct(p._id)} style={{ color: 'var(--danger)', background: 'none', border: 'none', cursor: 'pointer' }}>🗑️</button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* VIEW: MANAGE PRODUCTS (ADD/EDIT) */}
                    {activeTab === 'products' && (
                        <div style={{ maxWidth: '600px' }}>
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

                    {/* VIEW: ORDERS */}
                    {activeTab === 'orders' && (
                        <div>
                            <h2 style={{ marginBottom: '20px' }}>Order Management</h2>
                            <div style={{ display: 'grid', gap: '20px' }}>
                                {orders.map(o => (
                                    <div key={o._id} className="card" style={{ marginBottom: 0 }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '15px' }}>
                                            <div>
                                                <strong>{o.customerName}</strong>
                                                <div style={{ fontSize: '13px', color: 'var(--text-muted)' }}>{o.customerPhone}</div>
                                            </div>
                                            <span style={{ fontWeight: 'bold', fontSize: '18px' }}>₹{o.totalAmount}</span>
                                        </div>
                                        <div style={{ background: 'var(--bg-body)', padding: '15px', borderRadius: '10px', marginBottom: '15px' }}>
                                            {o.products.map((p, i) => (
                                                <div key={i} style={{ fontSize: '14px', marginBottom: '5px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                                                    <img src={p.productId?.image} style={{ width: '30px', height: '30px', borderRadius: '4px' }} />
                                                    {p.productId?.title} x{p.quantity}
                                                </div>
                                            ))}
                                        </div>
                                        <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '10px' }}>📍 {o.shippingAddress}</p>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                            <span style={{ fontSize: '14px', fontWeight: '600' }}>Status:</span>
                                            <select
                                                className="input"
                                                value={o.status}
                                                onChange={(e) => initiateStatusUpdate(o._id, e.target.value)}
                                                style={{ padding: '8px', width: 'auto', margin: 0 }}
                                            >
                                                {["Pending", "Packed", "Dispatched", "Delivered"].map(s => <option key={s} value={s}>{s}</option>)}
                                            </select>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* VIEW: USERS */}
                    {activeTab === 'users' && (
                        <div style={{ maxWidth: '600px' }}>
                            <h2 style={{ marginBottom: '20px' }}>Admin Users</h2>
                            <div className="card" style={{ marginBottom: '30px' }}>
                                <h4 style={{ marginTop: 0 }}>{editUser ? 'Edit User' : 'Create New Admin'}</h4>
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
                                        <strong>{u.phoneNumber}</strong> <span style={{ fontSize: '12px', color: 'gray' }}>(Admin)</span>
                                    </div>
                                    <div>
                                        <button onClick={() => { setEditUser(u); setNewAdmin({ phoneNumber: u.phoneNumber, password: '' }) }} style={{ marginRight: '10px', background: 'none', border: 'none', cursor: 'pointer' }}>✏️</button>
                                        <button onClick={() => deleteUser(u._id)} style={{ color: 'red', background: 'none', border: 'none', cursor: 'pointer' }}>🗑️</button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}

                </div>
            </div>

            {/* STATUS CHANGE CONFIRMATION MODAL */}
            {statusModal && (
                <ActionModal
                    message={`Change order status to "${statusModal.status}"?`}
                    confirmText="Update Status"
                    onConfirm={confirmStatusUpdate}
                    onCancel={() => setStatusModal(null)}
                />
            )}

        </div>
    );
}

export default AdminPanel;