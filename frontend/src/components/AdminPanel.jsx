import React, { useState, useEffect } from 'react';
import axios from 'axios';

function AdminPanel({ token, setIsAdmin, apiUrl }) {
    const [product, setProduct] = useState({ title: '', price: '', description: '', image: '' });
    const [products, setProducts] = useState([]);
    const [orders, setOrders] = useState([]);
    const [editingId, setEditingId] = useState(null);

    useEffect(() => {
        const fetchData = async () => {
            const oRes = await axios.get(`${apiUrl}/orders/all-orders`, { headers: { Authorization: token } });
            setOrders(oRes.data);
            const pRes = await axios.get(`${apiUrl}/products`);
            setProducts(pRes.data);
        };
        fetchData();
    }, []);

    const handleSubmit = async (e) => {
        e.preventDefault();
        const url = editingId ? `${apiUrl}/products/${editingId}` : `${apiUrl}/products`;
        const method = editingId ? 'put' : 'post';
        await axios[method](url, product, { headers: { Authorization: token } });
        setProduct({ title: '', price: '', description: '', image: '' }); setEditingId(null);
        const res = await axios.get(`${apiUrl}/products`);
        setProducts(res.data);
    };

    const deleteProduct = async (id) => {
        if (confirm("Delete?")) {
            await axios.delete(`${apiUrl}/products/${id}`, { headers: { Authorization: token } });
            const res = await axios.get(`${apiUrl}/products`);
            setProducts(res.data);
        }
    };

    const updateStatus = async (id, status) => {
        await axios.put(`${apiUrl}/orders/${id}/status`, { status }, { headers: { Authorization: token } });
        const res = await axios.get(`${apiUrl}/orders/all-orders`, { headers: { Authorization: token } });
        setOrders(res.data);
    };

    return (
        <div style={{ position: 'fixed', inset: 0, background: 'var(--bg-body)', zIndex: 1000, display: 'flex', flexDirection: 'column', color: 'var(--text-main)' }}>
            <div style={{ background: 'var(--bg-card)', padding: '15px 30px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border)' }}>
                <h3>ADMIN DASHBOARD</h3>
                <button onClick={() => setIsAdmin(false)} className="btn btn-outline">Logout</button>
            </div>
            <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>

                {/* LEFT: INVENTORY */}
                <div style={{ flex: 1, padding: '20px', overflowY: 'auto', borderRight: '1px solid var(--border)', background: 'var(--bg-card)' }}>
                    <h3>Inventory</h3>
                    <form onSubmit={handleSubmit} style={{ padding: '20px', border: '1px solid var(--border)', borderRadius: '15px', margin: '20px 0', display: 'grid', gap: '10px' }}>
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
                                <button onClick={() => { setEditingId(p._id); setProduct(p) }} style={{ marginRight: '10px', background: 'none', border: 'none', cursor: 'pointer', fontSize: '16px' }}>✏️</button>
                                <button onClick={() => deleteProduct(p._id)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '16px' }}>🗑️</button>
                            </div>
                        </div>
                    ))}
                </div>

                {/* RIGHT: ORDERS */}
                <div style={{ flex: 1, padding: '20px', overflowY: 'auto' }}>
                    <h3>Orders ({orders.length})</h3>
                    {orders.map(o => (
                        <div key={o._id} className="card">
                            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                <strong>{o.customerName}</strong>
                                <span>₹{o.totalAmount}</span>
                            </div>
                            <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '10px' }}>{o.shippingAddress}</p>
                            {o.products.map((p, i) => (
                                <div key={i} style={{ fontSize: '13px', marginBottom: '5px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                                    <img src={p.productId?.image} style={{ width: '30px', height: '30px' }} />
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