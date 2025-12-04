import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

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

// --- 2. INVOICE GENERATOR ---
const downloadInvoice = async (order, type) => {
    const element = document.createElement('div');
    element.innerHTML = `
    <div style="padding: 40px; font-family: sans-serif; background: white; width: 600px; color: #333;">
      <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 2px solid #000; padding-bottom: 20px; margin-bottom: 20px;">
        <h1 style="margin: 0; font-size: 24px; text-transform: uppercase; letter-spacing: 2px;">FASHION BY NIRA</h1>
        <div style="text-align: right;">
          <p style="margin: 0; font-size: 12px; color: #666;">INVOICE</p>
          <p style="margin: 5px 0 0; font-weight: bold;">#${order._id.slice(-6).toUpperCase()}</p>
        </div>
      </div>
      <div style="margin-bottom: 30px;">
        <p><strong>Billed To:</strong><br>${order.customerName}<br>${order.customerPhone}<br>${order.shippingAddress}</p>
      </div>
      <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px;">
        <thead>
          <tr style="background: #f4f4f4; text-align: left;">
            <th style="padding: 10px; border-bottom: 1px solid #ddd;">Item</th>
            <th style="padding: 10px; border-bottom: 1px solid #ddd;">Qty</th>
            <th style="padding: 10px; border-bottom: 1px solid #ddd; text-align: right;">Price</th>
          </tr>
        </thead>
        <tbody>
          ${order.products.map(p => `
            <tr>
              <td style="padding: 10px; border-bottom: 1px solid #eee;">${p.productId?.title || 'Item'}</td>
              <td style="padding: 10px; border-bottom: 1px solid #eee;">${p.quantity}</td>
              <td style="padding: 10px; border-bottom: 1px solid #eee; text-align: right;">₹${p.productId?.price}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>
      <div style="text-align: right; border-top: 2px solid #000; padding-top: 10px;">
        <h3 style="margin: 0;">Total: ₹${order.totalAmount}</h3>
      </div>
      <p style="margin-top: 40px; font-size: 10px; color: #888; text-align: center;">Thank you for shopping with us!</p>
    </div>
  `;
    document.body.appendChild(element);

    const canvas = await html2canvas(element);
    const data = canvas.toDataURL('image/png');
    document.body.removeChild(element);

    if (type === 'pdf') {
        const pdf = new jsPDF();
        const imgProps = pdf.getImageProperties(data);
        const pdfWidth = pdf.internal.pageSize.getWidth();
        const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;
        pdf.addImage(data, 'PNG', 0, 0, pdfWidth, pdfHeight);
        pdf.save(`Invoice_${order._id.slice(-6)}.pdf`);
    } else {
        const link = document.createElement('a');
        link.href = data;
        link.download = `Invoice_${order._id.slice(-6)}.jpg`;
        link.click();
    }
};

// --- 3. CUSTOM DROPDOWN ---
const StatusDropdown = ({ currentStatus, onUpdate }) => {
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef(null);
    const styles = getStatusStyles(currentStatus);
    const options = ["Pending", "Order Accepted", "Packed", "Dispatched", "Delivered"];

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) setIsOpen(false);
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    return (
        <div ref={dropdownRef} style={{ position: 'relative', minWidth: '160px' }}>
            <div
                onClick={() => setIsOpen(!isOpen)}
                style={{
                    background: styles.bg, color: styles.text, border: `1px solid ${styles.border}`,
                    padding: '8px 15px', borderRadius: '20px', fontSize: '13px', fontWeight: 'bold',
                    cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center'
                }}
            >
                {currentStatus} <span style={{ fontSize: '10px' }}>▼</span>
            </div>
            {isOpen && (
                <div style={{
                    position: 'absolute', top: '110%', left: 0, width: '100%',
                    background: 'white', borderRadius: '12px', boxShadow: '0 5px 20px rgba(0,0,0,0.15)',
                    zIndex: 100, border: '1px solid #eee', overflow: 'hidden'
                }}>
                    {options.map((opt) => (
                        <div
                            key={opt}
                            onClick={() => { onUpdate(opt); setIsOpen(false); }}
                            style={{
                                padding: '10px 15px', fontSize: '13px', cursor: 'pointer',
                                background: opt === currentStatus ? '#f8f9fa' : 'white',
                                color: opt === currentStatus ? 'black' : '#555',
                                fontWeight: opt === currentStatus ? 'bold' : 'normal',
                                borderBottom: '1px solid #f0f0f0'
                            }}
                            onMouseEnter={(e) => e.target.style.background = '#f4f4f4'}
                            onMouseLeave={(e) => e.target.style.background = 'white'}
                        >
                            {opt}
                        </div>
                    ))}
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

    useEffect(() => { fetchData(); }, []);

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
        const updatedOrders = orders.map(o => o._id === id ? { ...o, status: newStatus } : o);
        setOrders(updatedOrders);
        try {
            await axios.put(`${API}/orders/${id}/status`, { status: newStatus }, { headers: { Authorization: token } });
            fetchData();
        } catch (err) { alert("Status update failed"); fetchData(); }
    };

    const deleteOrder = async (id) => {
        if (confirm("Permanently Delete Order?")) {
            await axios.delete(`${API}/orders/${id}`, { headers: { Authorization: token } });
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
    };

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
            <div style={{ background: 'var(--bg-card)', padding: '15px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border)', position: 'sticky', top: 0, zIndex: 100 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                    <button onClick={() => setMenuOpen(!menuOpen)} style={{ background: 'none', border: 'none', fontSize: '24px', cursor: 'pointer', color: 'var(--text-main)' }}>☰</button>
                    <h3 style={{ margin: 0, textTransform: 'uppercase', letterSpacing: '1px', fontSize: '18px' }}>ADMIN PANEL</h3>
                </div>
                <button onClick={() => setIsAdmin(false)} className="btn btn-outline" style={{ padding: '8px 15px', fontSize: '12px' }}>Logout</button>
            </div>

            <div style={{ display: 'flex', flex: 1, overflow: 'hidden', position: 'relative' }}>
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

                <div style={{ flex: 1, padding: '20px', marginLeft: menuOpen ? '0' : '0', overflowY: 'auto', width: '100%' }}>
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

                    {activeTab === 'orders' && (
                        <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
                            <h2 style={{ marginBottom: '20px' }}>Order Management</h2>
                            <div style={{ display: 'grid', gap: '20px' }}>
                                {orders.map(o => (
                                    <div key={o._id} className="card" style={{ borderLeft: `5px solid ${getStatusStyles(o.status).text}` }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px', borderBottom: '1px solid var(--border)', paddingBottom: '10px' }}>
                                            <div>
                                                <strong>Order #{o._id.slice(-6).toUpperCase()}</strong>
                                                <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{new Date(o.createdAt).toLocaleDateString()}</div>
                                            </div>
                                            <div style={{ textAlign: 'right' }}>
                                                <div style={{ fontWeight: 'bold', fontSize: '16px' }}>₹{o.totalAmount}</div>
                                                <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{o.customerName}</div>
                                            </div>
                                        </div>
                                        <div style={{ background: 'var(--bg-body)', padding: '10px', borderRadius: '10px', marginBottom: '15px' }}>
                                            {o.products.map((p, i) => (
                                                <div key={i} style={{ fontSize: '13px', marginBottom: '5px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                                                    <img src={p.productId?.image} style={{ width: '30px', height: '30px', borderRadius: '4px', objectFit: 'cover' }} />
                                                    {p.productId?.title} <span style={{ fontWeight: 'bold' }}>x{p.quantity}</span>
                                                </div>
                                            ))}
                                        </div>
                                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '10px' }}>
                                            <StatusDropdown currentStatus={o.status} onUpdate={(newStatus) => updateStatus(o._id, newStatus)} />
                                            <div style={{ display: 'flex', gap: '5px' }}>
                                                <button onClick={() => downloadInvoice(o, 'jpg')} style={{ fontSize: '12px', padding: '5px 10px', background: '#eee', border: 'none', borderRadius: '5px', cursor: 'pointer' }}>JPG</button>
                                                <button onClick={() => downloadInvoice(o, 'pdf')} style={{ fontSize: '12px', padding: '5px 10px', background: '#eee', border: 'none', borderRadius: '5px', cursor: 'pointer' }}>PDF</button>
                                                <button onClick={() => deleteOrder(o._id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--danger)', fontSize: '18px' }}>🗑️</button>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

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
                                <div key={u._id} className="card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '15px' }}>
                                    <div><strong>{u.phoneNumber}</strong> <span style={{ fontSize: '12px', color: 'gray' }}>(Admin)</span></div>
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