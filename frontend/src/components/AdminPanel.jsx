import React, { useState, useEffect } from 'react';
import axios from 'axios';

const API = "https://fashion-by-nira.onrender.com/api";

function AdminPanel({ token, setIsAdmin }) {
    const [tab, setTab] = useState('inventory'); // 'inventory' or 'users'
    const [products, setProducts] = useState([]);
    const [orders, setOrders] = useState([]);
    const [users, setUsers] = useState([]); // New User List

    // Forms
    const [product, setProduct] = useState({ title: '', price: '', description: '', image: '' });
    const [editingId, setEditingId] = useState(null);
    const [newAdmin, setNewAdmin] = useState({ phoneNumber: '', password: '' });
    const [editUser, setEditUser] = useState(null); // For editing user pass

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

    // --- PRODUCT ---
    const handleProductSubmit = async (e) => {
        e.preventDefault();
        const url = editingId ? `${API}/products/${editingId}` : `${API}/products`;
        const method = editingId ? 'put' : 'post';
        await axios[method](url, product, { headers: { Authorization: token } });
        setProduct({ title: '', price: '', description: '', image: '' }); setEditingId(null);
        fetchData();
    };

    const deleteProduct = async (id) => {
        if (confirm("Delete?")) {
            await axios.delete(`${API}/products/${id}`, { headers: { Authorization: token } });
            fetchData();
        }
    };

    // --- ORDERS ---
    const updateStatus = async (id, status) => {
        await axios.put(`${API}/orders/${id}/status`, { status }, { headers: { Authorization: token } });
        fetchData();
    };

    // --- USERS ---
    const handleUserSubmit = async (e) => {
        e.preventDefault();
        try {
            if (editUser) {
                // Update existing
                await axios.put(`${API}/auth/admins/${editUser._id}`, newAdmin, { headers: { Authorization: token } });
                setEditUser(null);
            } else {
                // Create new
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
        <div style={{ position: 'fixed', inset: 0, background: 'var(--bg-body)', zIndex: 1000, display: 'flex', flexDirection: 'column', color: 'var(--text-main)' }}>

            {/* NAVBAR */}
            <div style={{ background: 'var(--bg-card)', padding: '15px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border)' }}>
                <div style={{ display: 'flex', gap: '15px', alignItems: 'center' }}>
                    <h3 style={{ margin: 0 }}>ADMIN</h3>
                    <button onClick={() => setTab('inventory')} className={`btn ${tab === 'inventory' ? 'btn-primary' : 'btn-outline'}`} style={{ padding: '8px 15px' }}>Inventory</button>
                    <button onClick={() => setTab('users')} className={`btn ${tab === 'users' ? 'btn-primary' : 'btn-outline'}`} style={{ padding: '8px 15px' }}>Users</button>
                </div>
                <button onClick={() => setIsAdmin(false)} className="btn btn-outline" style={{ padding: '8px 15px' }}>Logout</button>
            </div>

            <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>

                {/* LEFT PANEL */}
                <div style={{ flex: 1, padding: '20px', overflowY: 'auto', borderRight: '1px solid var(--border)', background: 'var(--bg-card)' }}>

                    {tab === 'inventory' ? (
                        <>
                            <h3>Manage Products</h3>
                            <form onSubmit={handleProductSubmit} style={{ padding: '20px', border: '1px solid var(--border)', borderRadius: '15px', margin: '20px 0', display: 'grid', gap: '10px' }}>
                                <input className="input" placeholder="Title" value={product.title} onChange={e => setProduct({ ...product, title: e.target.value })} required />
                                <input className="input" placeholder="Price" type="number" value={product.price} onChange={e => setProduct({ ...product, price: e.target.value })} required />
                                <input className="input" placeholder="Image URL" value={product.image} onChange={e => setProduct({ ...product, image: e.target.value })} />
                                <button className="btn btn-primary">{editingId ? 'Update' : 'Add Product'}</button>
                            </form>
                            {products.map(p => (
                                <div key={p._id} style={{ display: 'flex', justifyContent: 'space-between', padding: '10px', borderBottom: '1px solid var(--border)', alignItems: 'center' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                        <img src={p.image} style={{ width: '40px', height: '40px', objectFit: 'cover', borderRadius: '5px' }} />
                                        <span>{p.title}</span>
                                    </div>
                                    <div>
                                        <button onClick={() => { setEditingId(p._id); setProduct(p) }} style={{ marginRight: '10px', background: 'none', border: 'none', cursor: 'pointer' }}>✏️</button>
                                        <button onClick={() => deleteProduct(p._id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'red' }}>🗑️</button>
                                    </div>
                                </div>
                            ))}
                        </>
                    ) : (
                        <>
                            <h3>User Management</h3>
                            <div style={{ padding: '20px', border: '1px solid var(--border)', borderRadius: '15px', margin: '20px 0' }}>
                                <h4>{editUser ? 'Edit User' : 'Add New Admin'}</h4>
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
                                <div key={u._id} style={{ padding: '15px', border: '1px solid var(--border)', borderRadius: '10px', marginBottom: '10px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <div>
                                        <strong>{u.phoneNumber}</strong> <span style={{ fontSize: '12px', color: 'gray' }}>(Admin)</span>
                                    </div>
                                    <div>
                                        <button onClick={() => { setEditUser(u); setNewAdmin({ phoneNumber: u.phoneNumber, password: '' }) }} style={{ marginRight: '10px', background: 'none', border: 'none', cursor: 'pointer' }}>✏️</button>
                                        <button onClick={() => deleteUser(u._id)} style={{ color: 'red', background: 'none', border: 'none', cursor: 'pointer' }}>🗑️</button>
                                    </div>
                                </div>
                            ))}
                        </>
                    )}
                </div>

                {/* RIGHT PANEL (ORDERS) */}
                <div style={{ flex: 1, padding: '20px', overflowY: 'auto' }}>
                    <h3>Orders ({orders.length})</h3>
                    {orders.map(o => (
                        <div key={o._id} className="card">
                            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                <strong>{o.customerName}</strong>
                                <span>₹{o.totalAmount}</span>
                            </div>
                            <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '10px' }}>{o.shippingAddress} • {o.customerPhone}</p>
                            {o.products.map((p, i) => (
                                <div key={i} style={{ fontSize: '13px', display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '5px' }}>
                                    <img src={p.productId?.image} style={{ width: '30px', height: '30px', borderRadius: '5px' }} />
                                    {p.productId?.title} x{p.quantity}
                                </div>
                            ))}
                            <select className="input" value={o.status} onChange={(e) => updateStatus(o._id, e.target.value)} style={{ padding: '8px', marginTop: '10px' }}>
                                {["Pending", "Packed", "Dispatched", "Delivered"].map(s => <option key={s} value={s}>{s}</option>)}
                            </select>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}

export default AdminPanel;