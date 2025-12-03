import React, { useState, useEffect } from 'react';
import axios from 'axios';

function AdminPanel({ token, setIsAdmin }) {
    const [product, setProduct] = useState({ title: '', price: '', description: '', image: '' });
    const [products, setProducts] = useState([]);
    const [orders, setOrders] = useState([]);
    const [editingId, setEditingId] = useState(null);
    const [message, setMessage] = useState('');

    // --- NEW: DELETE MODAL STATE ---
    const [deleteTarget, setDeleteTarget] = useState(null); // Stores { id: '...', type: 'product' | 'order' }

    const statusOptions = ["Pending", "Order Accepted", "Packed", "Dispatched", "Delivered"];

    useEffect(() => {
        fetchOrders();
        fetchProducts();
    }, []);

    const fetchOrders = async () => {
        try {
            const res = await axios.get('http://localhost:5000/api/orders/all-orders', { headers: { Authorization: token } });
            setOrders(res.data);
        } catch (err) { console.error(err); }
    };

    const fetchProducts = async () => {
        try {
            const res = await axios.get('http://localhost:5000/api/products');
            setProducts(res.data);
        } catch (err) { console.error(err); }
    };

    // --- HANDLERS ---
    const handleChange = (e) => setProduct({ ...product, [e.target.name]: e.target.value });

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            if (editingId) {
                await axios.put(`http://localhost:5000/api/products/${editingId}`, product, { headers: { Authorization: token } });
                setMessage('✅ Updated!');
            } else {
                await axios.post('http://localhost:5000/api/products', product, { headers: { Authorization: token } });
                setMessage('✅ Added!');
            }
            setProduct({ title: '', price: '', description: '', image: '' });
            setEditingId(null);
            fetchProducts();
            setTimeout(() => setMessage(''), 3000);
        } catch (error) { setMessage('❌ Error'); }
    };

    const handleEdit = (p) => {
        setProduct({ title: p.title, price: p.price, description: p.description, image: p.image });
        setEditingId(p._id);
    };

    const handleStatusChange = async (orderId, newStatus) => {
        try {
            await axios.put(`http://localhost:5000/api/orders/${orderId}/status`, { status: newStatus }, { headers: { Authorization: token } });
            fetchOrders();
        } catch (err) { alert("Update failed"); }
    };

    // --- NEW: DELETE LOGIC WITH MODAL ---

    // 1. Trigger the Modal
    const promptDelete = (id, type) => {
        setDeleteTarget({ id, type });
    };

    // 2. Confirm and Execute
    const confirmDelete = async () => {
        if (!deleteTarget) return;

        try {
            if (deleteTarget.type === 'product') {
                await axios.delete(`http://localhost:5000/api/products/${deleteTarget.id}`, { headers: { Authorization: token } });
                fetchProducts();
            } else if (deleteTarget.type === 'order') {
                await axios.delete(`http://localhost:5000/api/orders/${deleteTarget.id}`, { headers: { Authorization: token } });
                fetchOrders();
            }
            setDeleteTarget(null); // Close Modal
        } catch (error) {
            alert("Error deleting item");
        }
    };

    // --- STYLES ---
    const fullScreenStyle = {
        position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh',
        background: '#f4f6f8', zIndex: 1000, display: 'flex', flexDirection: 'column',
        fontFamily: 'Montserrat, sans-serif'
    };

    const splitContainer = { display: 'flex', flex: 1, overflow: 'hidden' };
    const panelStyle = { flex: 1, padding: '30px', overflowY: 'auto', height: '100%' };

    return (
        <div style={fullScreenStyle}>

            {/* --- DELETE CONFIRMATION MODAL --- */}
            {deleteTarget && (
                <div style={{
                    position: 'fixed', top: 0, left: 0, width: '100%', height: '100%',
                    background: 'rgba(0,0,0,0.6)', zIndex: 2000, display: 'flex',
                    justifyContent: 'center', alignItems: 'center', backdropFilter: 'blur(4px)'
                }}>
                    <div style={{
                        background: 'white', padding: '30px', borderRadius: '15px', width: '350px',
                        textAlign: 'center', boxShadow: '0 20px 50px rgba(0,0,0,0.2)',
                        animation: 'popIn 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)'
                    }}>
                        <div style={{ fontSize: '40px', marginBottom: '10px' }}>⚠</div>
                        <h3 style={{ margin: '0 0 10px 0', color: '#333' }}>Are you sure?</h3>
                        <p style={{ color: '#666', marginBottom: '25px', fontSize: '14px' }}>
                            Do you really want to delete this {deleteTarget.type}? This process cannot be undone.
                        </p>
                        <div style={{ display: 'flex', gap: '10px' }}>
                            <button
                                onClick={() => setDeleteTarget(null)}
                                style={{ flex: 1, padding: '12px', background: '#f0f0f0', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold', color: '#333' }}
                            >
                                Cancel
                            </button>
                            <button
                                onClick={confirmDelete}
                                style={{ flex: 1, padding: '12px', background: '#ff4d4d', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold', color: 'white' }}
                            >
                                Yes, Delete
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* --- TOP NAVBAR --- */}
            <div style={{ background: 'white', padding: '15px 30px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', boxShadow: '0 2px 10px rgba(0,0,0,0.05)', height: '70px', flexShrink: 0 }}>
                <div>
                    <h2 style={{ margin: 0, textTransform: 'uppercase', letterSpacing: '1px', fontSize: '20px' }}>Fashion By Nira</h2>
                    <span style={{ fontSize: '12px', color: '#888', fontWeight: '600', letterSpacing: '2px' }}>COMMAND CENTER</span>
                </div>
                <button onClick={() => setIsAdmin(false)} style={{ background: '#333', color: 'white', border: 'none', padding: '10px 25px', borderRadius: '30px', cursor: 'pointer', fontWeight: 'bold' }}>Logout</button>
            </div>

            {/* --- SPLIT LAYOUT --- */}
            <div style={splitContainer}>

                {/* === LEFT SIDE (50%): INVENTORY === */}
                <div style={{ ...panelStyle, borderRight: '1px solid #ddd', background: 'white' }}>

                    {/* Add Product Form */}
                    <div style={{ background: '#f9f9f9', padding: '25px', borderRadius: '15px', border: '1px solid #eee', marginBottom: '30px' }}>
                        <h3 style={{ marginTop: 0, marginBottom: '15px', fontSize: '18px' }}>{editingId ? '✏ Edit Item' : '✨ Add New Product'}</h3>
                        <form onSubmit={handleSubmit} style={{ display: 'grid', gap: '15px' }}>
                            <input name="title" placeholder="Product Name" value={product.title} onChange={handleChange} required style={inputStyle} />
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                                <input name="price" type="number" placeholder="Price" value={product.price} onChange={handleChange} required style={inputStyle} />
                                <input name="image" placeholder="Image URL" value={product.image} onChange={handleChange} style={inputStyle} />
                            </div>
                            <textarea name="description" placeholder="Description" value={product.description} onChange={handleChange} style={{ ...inputStyle, height: '60px', resize: 'none' }} />
                            <button type="submit" style={{ padding: '12px', background: 'black', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }}>
                                {editingId ? 'Update Item' : 'Add to Inventory'}
                            </button>
                            {message && <p style={{ margin: 0, fontSize: '13px', color: message.includes('✅') ? 'green' : 'red', textAlign: 'center' }}>{message}</p>}
                        </form>
                    </div>

                    {/* Inventory List */}
                    <h3 style={{ marginBottom: '20px', color: '#555' }}>Current Inventory ({products.length})</h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                        {products.map(p => (
                            <div key={p._id} style={{ display: 'flex', alignItems: 'center', padding: '15px', borderRadius: '12px', border: '1px solid #eee', background: 'white', boxShadow: '0 2px 8px rgba(0,0,0,0.03)' }}>
                                <img src={p.image || "https://via.placeholder.com/50"} alt={p.title} style={{ width: '60px', height: '60px', objectFit: 'cover', borderRadius: '8px', marginRight: '20px', border: '1px solid #f0f0f0' }} />
                                <div style={{ flex: 1 }}>
                                    <div style={{ fontWeight: 'bold', fontSize: '16px', marginBottom: '5px' }}>{p.title}</div>
                                    <div style={{ color: '#512da8', fontSize: '14px', fontWeight: 'bold' }}>₹{p.price}</div>
                                </div>
                                <div style={{ display: 'flex', gap: '8px' }}>
                                    <button onClick={() => handleEdit(p)} style={iconBtnStyle}>✏</button>
                                    {/* UPDATE: Use promptDelete instead of window.confirm */}
                                    <button onClick={() => promptDelete(p._id, 'product')} style={{ ...iconBtnStyle, color: 'red', background: '#ffe5e5' }}>🗑</button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* === RIGHT SIDE (50%): ORDERS === */}
                <div style={{ ...panelStyle, background: '#f4f6f8' }}>
                    <h3 style={{ marginBottom: '20px', color: '#333' }}>Order Management ({orders.length})</h3>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                        {orders.map(o => (
                            <div key={o._id} style={{ background: 'white', borderRadius: '15px', padding: '25px', boxShadow: '0 5px 20px rgba(0,0,0,0.05)', borderLeft: `6px solid ${getStatusColor(o.status)}` }}>

                                {/* Order Header */}
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px', paddingBottom: '15px', borderBottom: '1px solid #f0f0f0' }}>
                                    <div>
                                        <span style={{ fontWeight: 'bold', fontSize: '18px', display: 'block', marginBottom: '5px' }}>{o.customerName || 'Guest User'}</span>
                                        <span style={{ fontSize: '13px', color: '#888', background: '#f0f0f0', padding: '3px 8px', borderRadius: '5px' }}>{new Date(o.createdAt).toLocaleString()}</span>
                                    </div>
                                    <div style={{ textAlign: 'right' }}>
                                        <span style={{ fontSize: '20px', fontWeight: '800', color: '#333', display: 'block' }}>₹{o.totalAmount}</span>
                                        <span style={{ fontSize: '14px', color: '#555' }}>{o.customerPhone}</span>
                                    </div>
                                </div>

                                {/* Items */}
                                <div style={{ background: '#fcfcfc', padding: '15px', borderRadius: '10px', marginBottom: '20px', border: '1px solid #f0f0f0' }}>
                                    <p style={{ fontSize: '12px', fontWeight: 'bold', textTransform: 'uppercase', color: '#aaa', marginBottom: '10px' }}>Items Ordered</p>
                                    {o.products.map((p, i) => (
                                        <div key={i} style={{ display: 'flex', alignItems: 'center', marginBottom: '10px', paddingBottom: '10px', borderBottom: i === o.products.length - 1 ? 'none' : '1px solid #eee' }}>
                                            <img src={p.productId?.image || "https://via.placeholder.com/40"} alt="product" style={{ width: '50px', height: '50px', objectFit: 'contain', borderRadius: '5px', border: '1px solid #ddd', background: 'white', marginRight: '15px' }} />
                                            <div style={{ flex: 1 }}>
                                                <span style={{ fontSize: '14px', fontWeight: '600', display: 'block', color: '#333' }}>{p.productId ? p.productId.title : 'Product Deleted'}</span>
                                                <span style={{ fontSize: '13px', color: '#777' }}>Qty: {p.quantity}</span>
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                {/* Footer Actions */}
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '20px', flexWrap: 'wrap' }}>
                                    <div style={{ fontSize: '13px', color: '#555', background: '#f4f4f4', padding: '10px', borderRadius: '8px', flex: 1, lineHeight: '1.4' }}>
                                        <strong>Delivery To:</strong><br /> {o.shippingAddress}
                                    </div>

                                    <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                                        <select
                                            value={o.status}
                                            onChange={(e) => handleStatusChange(o._id, e.target.value)}
                                            style={{ padding: '10px', borderRadius: '8px', border: '1px solid #ddd', fontSize: '13px', fontWeight: 'bold', cursor: 'pointer', background: getStatusBg(o.status), color: getStatusColor(o.status), outline: 'none' }}
                                        >
                                            {statusOptions.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                                        </select>
                                        {/* UPDATE: Use promptDelete here too */}
                                        <button onClick={() => promptDelete(o._id, 'order')} style={{ background: '#ffe5e5', border: 'none', width: '38px', height: '38px', borderRadius: '50%', cursor: 'pointer', color: 'red', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '16px' }}>🗑</button>
                                    </div>
                                </div>

                            </div>
                        ))}
                    </div>
                </div>

            </div>
        </div >
    );
}

// --- STYLES HELPER ---
const inputStyle = { padding: '12px', borderRadius: '8px', border: '1px solid #ddd', outline: 'none', fontSize: '14px' };
const iconBtnStyle = { background: '#f4f4f4', border: 'none', width: '35px', height: '35px', borderRadius: '50%', cursor: 'pointer', fontSize: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center' };

const getStatusColor = (status) => {
    if (status === 'Delivered') return 'green';
    if (status === 'Dispatched') return 'blue';
    if (status === 'Packed') return 'purple';
    if (status === 'Order Accepted') return 'orange';
    return 'gray';
};

const getStatusBg = (status) => {
    if (status === 'Delivered') return '#e8f5e9';
    if (status === 'Dispatched') return '#e3f2fd';
    return '#fff';
};

export default AdminPanel;