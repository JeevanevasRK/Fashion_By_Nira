import React, { useState, useEffect } from 'react';
import axios from 'axios';

// API BASE URL
const API = "https://fashion-by-nira.onrender.com/api";

function AdminPanel({ token, setIsAdmin }) {
    const [tab, setTab] = useState('inventory');
    const [product, setProduct] = useState({ title: '', price: '', description: '', image: '' });
    const [products, setProducts] = useState([]);
    const [orders, setOrders] = useState([]);
    const [editingId, setEditingId] = useState(null);
    const [newAdmin, setNewAdmin] = useState({ phoneNumber: '', password: '' });
    const [msg, setMsg] = useState('');

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            // FIX: Updated URLs
            const oRes = await axios.get(`${API}/orders/all-orders`, { headers: { Authorization: token } });
            setOrders(oRes.data);
            const pRes = await axios.get(`${API}/products`);
            setProducts(pRes.data);
        } catch (e) { console.error(e); }
    };

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

    const updateStatus = async (id, status) => {
        await axios.put(`${API}/orders/${id}/status`, { status }, { headers: { Authorization: token } });
        fetchData();
    };

    const handleCreateUser = async (e) => {
        e.preventDefault();
        try {
            await axios.post(`${API}/auth/add-admin`, newAdmin, { headers: { Authorization: token } });
            setMsg('User Created'); setNewAdmin({ phoneNumber: '', password: '' });
        } catch (err) { setMsg('Error creating user'); }
    };

    return (
        <div style={{ position: 'fixed', inset: 0, background: '#f4f4f4', zIndex: 1000, display: 'flex', flexDirection: 'column' }}>
            <div style={{ background: 'white', padding: '15px 30px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #ddd' }}>
                <div style={{ display: 'flex', gap: '20px', alignItems: 'center' }}>
                    <h3 style={{ margin: 0 }}>ADMIN</h3>
                    <button onClick={() => setTab('inventory')} className="btn">Inventory</button>
                    <button onClick={() => setTab('users')} className="btn">Users</button>
                </div>
                <button onClick={() => setIsAdmin(false)} className="btn">Logout</button>
            </div>

            <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
                <div style={{ flex: 1, padding: '20px', overflowY: 'auto', borderRight: '1px solid #ddd', background: 'white' }}>
                    {tab === 'inventory' ? (
                        <>
                            <h3>Manage Products</h3>
                            <form onSubmit={handleProductSubmit} style={{ background: '#f8f8f8', padding: '20px', borderRadius: '10px', margin: '20px 0', display: 'grid', gap: '10px' }}>
                                <input className="input-field" placeholder="Title" value={product.title} onChange={e => setProduct({ ...product, title: e.target.value })} required />
                                <input className="input-field" placeholder="Price" type="number" value={product.price} onChange={e => setProduct({ ...product, price: e.target.value })} required />
                                <input className="input-field" placeholder="Image URL" value={product.image} onChange={e => setProduct({ ...product, image: e.target.value })} />
                                <button className="btn btn-primary">{editingId ? 'Update' : 'Add Product'}</button>
                            </form>
                            {products.map(p => (
                                <div key={p._id} style={{ display: 'flex', justifyContent: 'space-between', padding: '10px', borderBottom: '1px solid #eee', alignItems: 'center' }}>
                                    <span>{p.title}</span>
                                    <div>
                                        <button onClick={() => { setEditingId(p._id); setProduct(p) }} style={{ marginRight: '10px', border: 'none', background: 'none' }}>✏️</button>
                                        <button onClick={() => deleteProduct(p._id)} style={{ color: 'red', border: 'none', background: 'none' }}>🗑️</button>
                                    </div>
                                </div>
                            ))}
                        </>
                    ) : (
                        <>
                            <h3>Add Admin User</h3>
                            <form onSubmit={handleCreateUser} style={{ background: '#f8f8f8', padding: '20px', borderRadius: '10px', margin: '20px 0', display: 'grid', gap: '10px' }}>
                                <input className="input-field" placeholder="Phone" value={newAdmin.phoneNumber} onChange={e => setNewAdmin({ ...newAdmin, phoneNumber: e.target.value })} />
                                <input className="input-field" placeholder="Password" value={newAdmin.password} onChange={e => setNewAdmin({ ...newAdmin, password: e.target.value })} />
                                <button className="btn btn-primary">Create</button>
                                <p>{msg}</p>
                            </form>
                        </>
                    )}
                </div>

                <div style={{ flex: 1, padding: '20px', overflowY: 'auto' }}>
                    <h3>Orders ({orders.length})</h3>
                    {orders.map(o => (
                        <div key={o._id} className="card">
                            <div style={{ display: 'flex', justifyContent: 'space-between' }}><strong>{o.customerName}</strong><span>₹{o.totalAmount}</span></div>
                            <p style={{ fontSize: '13px', color: '#666' }}>{o.shippingAddress}</p>
                            <select value={o.status} onChange={(e) => updateStatus(o._id, e.target.value)} style={{ marginTop: '10px', padding: '5px' }}>
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