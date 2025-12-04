import React, { useState, useEffect } from 'react';
import axios from 'axios';

const API_URL = "https://fashion-backend-xp2z.onrender.com/api";

function AdminPanel({ token, setIsAdmin }) {
    const [tab, setTab] = useState('inventory'); // 'inventory' or 'users'

    // Inventory State
    const [product, setProduct] = useState({ title: '', price: '', description: '', image: '' });
    const [products, setProducts] = useState([]);
    const [orders, setOrders] = useState([]);
    const [editingId, setEditingId] = useState(null);

    // User Management State
    const [newAdmin, setNewAdmin] = useState({ phoneNumber: '', password: '' });
    const [userMsg, setUserMsg] = useState('');

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            const oRes = await axios.get(`${API_URL}/orders/all-orders`, { headers: { Authorization: token } });
            setOrders(oRes.data);
            const pRes = await axios.get(`${API_URL}/products`);
            setProducts(pRes.data);
        } catch (e) { console.error(e); }
    };

    // --- PRODUCT HANDLERS ---
    const handleProductSubmit = async (e) => {
        e.preventDefault();
        const url = editingId ? `${API_URL}/products/${editingId}` : `${API_URL}/products`;
        const method = editingId ? 'put' : 'post';
        await axios[method](url, product, { headers: { Authorization: token } });
        setProduct({ title: '', price: '', description: '', image: '' }); setEditingId(null);
        fetchData();
    };

    const deleteProduct = async (id) => {
        if (confirm("Delete?")) {
            await axios.delete(`${API_URL}/products/${id}`, { headers: { Authorization: token } });
            fetchData();
        }
    };

    // --- ORDER HANDLERS ---
    const updateStatus = async (id, status) => {
        await axios.put(`${API_URL}/orders/${id}/status`, { status }, { headers: { Authorization: token } });
        fetchData();
    };

    // --- USER HANDLERS ---
    const handleCreateUser = async (e) => {
        e.preventDefault();
        try {
            await axios.post(`${API_URL}/auth/add-admin`, newAdmin, { headers: { Authorization: token } });
            setUserMsg('✅ New Admin Added');
            setNewAdmin({ phoneNumber: '', password: '' });
            setTimeout(() => setUserMsg(''), 3000);
        } catch (err) {
            setUserMsg('❌ Error: User likely exists');
        }
    };

    return (
        <div style={{ position: 'fixed', inset: 0, background: '#f4f4f4', zIndex: 1000, display: 'flex', flexDirection: 'column' }}>

            {/* NAVBAR */}
            <div style={{ background: 'white', padding: '15px 30px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #ddd' }}>
                <div style={{ display: 'flex', gap: '20px', alignItems: 'center' }}>
                    <h3 style={{ margin: 0 }}>ADMIN</h3>
                    <button onClick={() => setTab('inventory')} className={`btn ${tab === 'inventory' ? 'btn-black' : 'btn-outline'}`} style={{ fontSize: '12px', padding: '8px 15px' }}>Inventory</button>
                    <button onClick={() => setTab('users')} className={`btn ${tab === 'users' ? 'btn-black' : 'btn-outline'}`} style={{ fontSize: '12px', padding: '8px 15px' }}>Users</button>
                </div>
                <button onClick={() => setIsAdmin(false)} className="btn btn-outline" style={{ padding: '8px 15px' }}>Logout</button>
            </div>

            <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>

                {/* LEFT PANEL (DYNAMIC) */}
                <div style={{ flex: 1, padding: '20px', overflowY: 'auto', borderRight: '1px solid #ddd', background: 'white' }}>

                    {tab === 'inventory' ? (
                        <>
                            <h3>Manage Products</h3>
                            <form onSubmit={handleProductSubmit} style={{ background: '#f8f8f8', padding: '20px', borderRadius: '10px', margin: '20px 0', display: 'grid', gap: '10px' }}>
                                <input className="input" placeholder="Title" value={product.title} onChange={e => setProduct({ ...product, title: e.target.value })} required />
                                <input className="input" placeholder="Price" type="number" value={product.price} onChange={e => setProduct({ ...product, price: e.target.value })} required />
                                <input className="input" placeholder="Image URL" value={product.image} onChange={e => setProduct({ ...product, image: e.target.value })} />
                                <button className="btn btn-black">{editingId ? 'Update' : 'Add Product'}</button>
                            </form>
                            {products.map(p => (
                                <div key={p._id} style={{ display: 'flex', justifyContent: 'space-between', padding: '10px', borderBottom: '1px solid #eee', alignItems: 'center' }}>
                                    <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                                        <img src={p.image} style={{ width: '40px', height: '40px', objectFit: 'cover', borderRadius: '5px' }} />
                                        <span>{p.title}</span>
                                    </div>
                                    <div>
                                        <button onClick={() => { setEditingId(p._id); setProduct(p) }} style={{ marginRight: '10px', cursor: 'pointer', border: 'none', background: 'none' }}>✏️</button>
                                        <button onClick={() => deleteProduct(p._id)} style={{ color: 'red', cursor: 'pointer', border: 'none', background: 'none' }}>🗑️</button>
                                    </div>
                                </div>
                            ))}
                        </>
                    ) : (
                        <>
                            <h3>User Management</h3>
                            <p style={{ fontSize: '13px', color: '#666', marginBottom: '20px' }}>Create new Admin users who can access this dashboard.</p>

                            <div style={{ background: '#f8f8f8', padding: '25px', borderRadius: '15px', border: '1px solid #eee' }}>
                                <h4 style={{ marginTop: 0 }}>Add New Admin</h4>
                                <form onSubmit={handleCreateUser} style={{ display: 'grid', gap: '15px', marginTop: '15px' }}>
                                    <input className="input" placeholder="New Admin Phone" value={newAdmin.phoneNumber} onChange={e => setNewAdmin({ ...newAdmin, phoneNumber: e.target.value })} required />
                                    <input className="input" placeholder="Set Password" value={newAdmin.password} onChange={e => setNewAdmin({ ...newAdmin, password: e.target.value })} required />
                                    <button className="btn btn-black">Create User</button>
                                </form>
                                {userMsg && <p style={{ marginTop: '15px', fontWeight: 'bold', color: userMsg.includes('Error') ? 'red' : 'green' }}>{userMsg}</p>}
                            </div>
                        </>
                    )}
                </div>

                {/* RIGHT PANEL (ALWAYS ORDERS) */}
                <div style={{ flex: 1, padding: '20px', overflowY: 'auto' }}>
                    <h3>Incoming Orders ({orders.length})</h3>
                    {orders.map(o => (
                        <div key={o._id} className="card" style={{ marginTop: '20px' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                <strong>{o.customerName || 'Guest'}</strong>
                                <span>₹{o.totalAmount}</span>
                            </div>
                            <p style={{ fontSize: '13px', color: '#666', marginBottom: '10px' }}>{o.shippingAddress} • {o.customerPhone}</p>
                            <div style={{ background: '#f9f9f9', padding: '10px', borderRadius: '5px', marginBottom: '10px' }}>
                                {o.products.map((p, i) => <div key={i} style={{ fontSize: '13px' }}>{p.productId?.title || 'Item'} x{p.quantity}</div>)}
                            </div>
                            <select className="input" value={o.status} onChange={(e) => updateStatus(o._id, e.target.value)} style={{ padding: '8px' }}>
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