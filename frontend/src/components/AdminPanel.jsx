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

// --- 2. MODERN DELETE MODAL ---
const DeleteModal = ({ onConfirm, onCancel, title = "Delete?", desc = "This action cannot be undone." }) => (
    <div style={{
        position: 'fixed', inset: 0, zIndex: 10000,
        background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        animation: 'fadeIn 0.2s ease-out'
    }}>
        <div className="card" style={{
            width: '320px', textAlign: 'center', padding: '30px',
            background: 'white', animation: 'scaleUp 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)'
        }}>
            <div style={{ fontSize: '40px', marginBottom: '15px' }}>🗑️</div>
            <h3 style={{ margin: '0 0 10px 0', fontSize: '20px' }}>{title}</h3>
            <p style={{ color: '#666', fontSize: '14px', marginBottom: '25px' }}>
                {desc}
            </p>
            <div style={{ display: 'flex', gap: '10px' }}>
                <button onClick={onCancel} className="btn btn-outline" style={{ flex: 1, borderColor: '#ddd', color: '#555' }}>Cancel</button>
                <button onClick={onConfirm} className="btn" style={{ flex: 1, background: '#ff4d4d', color: 'white', border: 'none' }}>Yes, Delete</button>
            </div>
        </div>
        <style>{`
      @keyframes scaleUp { from { transform: scale(0.9); opacity: 0; } to { transform: scale(1); opacity: 1; } }
      @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
    `}</style>
    </div>
);

// --- INVOICE GENERATOR (FIXED PRICE DISPLAY) ---
const downloadInvoice = async (order) => {
    const element = document.createElement('div');

    // CONFIGURATION: Force A4 dimensions
    const A4_WIDTH_PX = 794;
    const A4_HEIGHT_PX = 1123;

    // Position off-screen
    Object.assign(element.style, {
        position: 'fixed',
        left: '-10000px',
        top: '0',
        width: `${A4_WIDTH_PX}px`,
        minHeight: `${A4_HEIGHT_PX}px`,
        zIndex: '-1000',
        backgroundColor: '#ffffff',
        color: '#333',
        padding: '40px',
        fontFamily: 'Arial, sans-serif',
        boxSizing: 'border-box'
    });

    element.innerHTML = `
    <div style="width: 100%; height: 100%; background: white;">
      <div style="display: flex; justify-content: space-between; border-bottom: 3px solid #000; padding-bottom: 20px; margin-bottom: 20px;">
        <div>
          <h1 style="margin: 0; font-size: 28px; letter-spacing: 2px; text-transform: uppercase;">FASHION BY NIRA</h1>
          <p style="margin: 5px 0 0; font-size: 12px; color: #666;">Premium Fashion & Accessories</p>
        </div>
        <div style="text-align: right;">
          <h2 style="margin: 0; color: #512da8;">INVOICE</h2>
          <p style="font-weight: bold; margin: 5px 0;">#${order._id.slice(-6).toUpperCase()}</p>
          <p style="margin: 0; font-size: 12px; color: #888;">Date: ${new Date().toLocaleDateString()}</p>
        </div>
      </div>

      <div style="display: flex; justify-content: space-between; margin-bottom: 40px;">
        <div style="width: 45%;">
          <h4 style="border-bottom: 1px solid #ddd; padding-bottom: 5px; margin-bottom: 10px; color: #555;">Billed By</h4>
          <p style="font-size: 13px; line-height: 1.6; margin: 0;">
            <strong>Fashion By Nira</strong><br>
            Tiruchengode Namakkal,<br>
            Tamil Nadu - 637211<br>
            +91 9585026838
          </p>
        </div>
        
        <div style="width: 45%;">
          <h4 style="border-bottom: 1px solid #ddd; padding-bottom: 5px; margin-bottom: 10px; color: #555;">Billed To</h4>
          <p style="font-size: 13px; line-height: 1.6; margin: 0;">
            <strong>${order.customerName}</strong><br>
            ${order.shippingAddress}<br>
            ${order.customerPhone}
          </p>
        </div>
      </div>

      <table style="width: 100%; border-collapse: collapse; margin-bottom: 30px;">
        <thead>
          <tr style="background: #f4f4f4;">
            <th style="padding: 12px; text-align: left; border-bottom: 2px solid #ddd;">Item</th>
            <th style="padding: 12px; text-align: center; border-bottom: 2px solid #ddd;">Qty</th>
            <th style="padding: 12px; text-align: right; border-bottom: 2px solid #ddd;">Price</th>
            <th style="padding: 12px; text-align: right; border-bottom: 2px solid #ddd;">Total</th>
          </tr>
        </thead>
        <tbody>
          ${order.products.map(p => `
            <tr>
              <td style="padding: 12px; border-bottom: 1px solid #eee;">${p.productId?.title || 'Item'}</td>
              <td style="padding: 12px; border-bottom: 1px solid #eee; text-align: center;">${p.quantity}</td>
              
              <td style="padding: 12px; border-bottom: 1px solid #eee; text-align: right;">₹${p.price || p.productId?.price || 0}</td>
              
              <td style="padding: 12px; border-bottom: 1px solid #eee; text-align: right; font-weight: bold;">₹${(p.price || p.productId?.price || 0) * p.quantity}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>

      <div style="display: flex; justify-content: flex-end;">
        <div style="width: 250px; border-top: 2px solid #000; padding-top: 10px;">
          <div style="display: flex; justify-content: space-between; font-size: 20px; font-weight: bold;">
            <span>Total:</span>
            <span>₹${order.totalAmount}</span>
          </div>
        </div>
      </div>

      <div style="margin-top: 60px; text-align: center; font-size: 10px; color: #aaa; border-top: 1px solid #eee; padding-top: 20px;">
        <p>Thank you for your business! | support@fashionbynira.com</p>
      </div>
    </div>
  `;

    document.body.appendChild(element);

    // Wait for browser to paint
    await new Promise(resolve => setTimeout(resolve, 500));

    try {
        const canvas = await html2canvas(element, {
            scale: 2,
            useCORS: true,
            backgroundColor: '#ffffff',
            windowWidth: 1200
        });

        const imgData = canvas.toDataURL('image/jpeg', 1.0);
        const link = document.createElement('a');
        link.href = imgData;
        link.download = `Invoice_${order._id.slice(-6)}.jpg`;
        link.click();

    } catch (err) {
        alert("Error creating invoice");
        console.error(err);
    } finally {
        document.body.removeChild(element);
    }
};

// --- 4. STATUS DROPDOWN ---
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
                                color: 'black', fontWeight: opt === currentStatus ? 'bold' : 'normal',
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

    // Data
    const [products, setProducts] = useState([]);
    const [orders, setOrders] = useState([]);
    const [users, setUsers] = useState([]);

    // State
    // UPDATED: Initial state includes inStock
    // Initialize 'images' as an array with one empty string
    const [product, setProduct] = useState({ title: '', price: '', stock: '', description: '', images: [''], inStock: true });
    const [editingId, setEditingId] = useState(null);
    const [newAdmin, setNewAdmin] = useState({ phoneNumber: '', password: '' });
    const [editUser, setEditUser] = useState(null);
    const [currentPage, setCurrentPage] = useState(1); // Pagination State

    // MODAL STATES
    const [orderToDelete, setOrderToDelete] = useState(null);
    const [productToDelete, setProductToDelete] = useState(null);
    const [userToDelete, setUserToDelete] = useState(null); // <--- ADD THIS LINE

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

    // NEW: Handle to add multiple images 
    const handleProductSubmit = async (e) => {
        e.preventDefault();

        // 1. Get the list of clean links
        const imageArray = product.images.filter(url => url.trim() !== "");

        // 2. CRITICAL FIX: 
        // We set 'image' (Singular) to the first link. 
        // This ensures the database actually saves it.
        const payload = {
            ...product,
            images: imageArray,
            image: imageArray.length > 0 ? imageArray[0] : ""
        };

        const url = editingId ? `${API}/products/${editingId}` : `${API}/products`;
        const method = editingId ? 'put' : 'post';

        try {
            await axios[method](url, payload, { headers: { Authorization: token } });

            // Reset form
            setProduct({ title: '', price: '', description: '', images: [''], inStock: true });
            setEditingId(null);

            // Refresh Data
            fetchData();

            // Go back to list
            if (editingId) setActiveTab('inventory');

        } catch (error) {
            console.error("Save failed:", error);
            alert("Error saving product");
        }
    };


    // NEW: Handle Edit Click (Populate form including stock status)
    const handleEdit = (p) => {
        setProduct({
            title: p.title,
            price: p.price,
            stock: p.stock || 0, // <--- Load existing stock
            description: p.description,
            images: p.images && p.images.length > 0 ? p.images : [p.image || ''],
            inStock: p.inStock !== undefined ? p.inStock : true
        });
        setEditingId(p._id);
        setActiveTab('products');
    };

    const requestDeleteProduct = (id) => {
        setProductToDelete(id);
    };

    const confirmDeleteProduct = async () => {
        if (!productToDelete) return;
        try {
            await axios.delete(`${API}/products/${productToDelete}`, { headers: { Authorization: token } });
            fetchData();
            setProductToDelete(null);
        } catch (err) {
            alert("Delete failed");
            setProductToDelete(null);
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

    const requestDeleteOrder = (id) => {
        setOrderToDelete(id);
    };

    const confirmDeleteOrder = async () => {
        if (!orderToDelete) return;
        try {
            await axios.delete(`${API}/orders/${orderToDelete}`, { headers: { Authorization: token } });
            fetchData();
            setOrderToDelete(null);
        } catch (err) {
            alert("Delete failed");
            setOrderToDelete(null);
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

    // --- DELETE USER LOGIC ---
    const requestDeleteUser = (id) => {
        setUserToDelete(id);
    };

    const confirmDeleteUser = async () => {
        if (!userToDelete) return;
        try {
            await axios.delete(`${API}/auth/admins/${userToDelete}`, { headers: { Authorization: token } });
            fetchData();
            setUserToDelete(null);
        } catch (err) {
            alert("Delete failed");
            setUserToDelete(null);
        }
    };

    const sidebarBtnStyle = (tabName) => ({
        width: '100%',
        padding: '14px 20px',
        textAlign: 'left',
        background: activeTab === tabName ? 'var(--accent)' : 'transparent',
        color: activeTab === tabName ? 'var(--accent-text)' : 'var(--text-main)',
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

            {/* DELETE MODAL (ORDERS) */}
            {orderToDelete && (
                <DeleteModal
                    onConfirm={confirmDeleteOrder}
                    onCancel={() => setOrderToDelete(null)}
                    title="Delete Order?"
                    desc="This will permanently remove this order record."
                />
            )}

            {/* DELETE MODAL (PRODUCTS) */}
            {productToDelete && (
                <DeleteModal
                    onConfirm={confirmDeleteProduct}
                    onCancel={() => setProductToDelete(null)}
                    title="Delete Product?"
                    desc="This item will be removed from your shop inventory."
                />
            )}

            {/* DELETE MODAL (USERS) */}
            {userToDelete && (
                <DeleteModal
                    onConfirm={confirmDeleteUser}
                    onCancel={() => setUserToDelete(null)}
                    title="Remove Admin?"
                    desc="This user will no longer have access to the admin panel."
                />
            )}

            {/* TOP BAR */}
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
                    <button style={sidebarBtnStyle('products')} onClick={() => {
                        setActiveTab('products'); setEditingId(null); /* FIX: Initialize 'images' as an array so the form doesn't crash */ setProduct({ title: '', price: '', description: '', images: [''], inStock: true }); setMenuOpen(false);
                    }} > ✨ Add Product </button>
                    <button style={sidebarBtnStyle('orders')} onClick={() => { setActiveTab('orders'); setMenuOpen(false) }}> <span>🚚</span> Orders <span style={{ background: 'var(--accent)', color: 'var(--accent-text)', fontSize: '10px', padding: '2px 6px', borderRadius: '10px', marginLeft: 'auto', fontWeight: 'bold' }}> {orders.length} </span> </button>
                    <button style={sidebarBtnStyle('users')} onClick={() => { setActiveTab('users'); setMenuOpen(false) }}>👥 Admins</button>
                </div>

                <div style={{ flex: 1, padding: '20px', marginLeft: menuOpen ? '0' : '0', overflowY: 'auto', width: '100%' }}>

                    {/* INVENTORY TAB: Optimized with Pagination & Robust Images */}
                    {activeTab === 'inventory' && (
                        <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
                            <h2 style={{ marginBottom: '20px' }}>Inventory ({products.length} Items)</h2>

                            {/* GRID with Pagination Slice (Only shows 10 items at a time) */}
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '20px', marginBottom: '30px' }}>
                                {products
                                    .slice((currentPage - 1) * 12, currentPage * 12) // Shows 10 items per page
                                    .map(p => (
                                        <div key={p._id} className="card" style={{ padding: '15px', display: 'flex', alignItems: 'center', gap: '15px', opacity: p.inStock ? 1 : 0.6 }}>

                                            {/* CRASH-PROOF IMAGE LOGIC */}
                                            {(() => {
                                                const raw = (p.images && p.images[0]) ? p.images[0] : (p.image || "");
                                                const isValidUrl = raw && typeof raw === 'string' && raw.trim().toLowerCase().startsWith('http');

                                                if (isValidUrl) {
                                                    return (
                                                        <img
                                                            src={`https://wsrv.nl/?url=${encodeURIComponent(raw.trim())}&w=100&q=70&output=webp`}
                                                            alt="Item"
                                                            style={{ width: '60px', height: '60px', objectFit: 'cover', borderRadius: '8px', background: '#eee', border: '1px solid #ccc' }}
                                                            onError={(e) => { e.target.style.display = 'none'; e.target.nextSibling.style.display = 'flex'; }}
                                                        />
                                                    );
                                                } else {
                                                    // CSS Fallback (No network needed)
                                                    return (
                                                        <div style={{ width: '60px', height: '60px', borderRadius: '8px', background: '#e0e0e0', border: '1px solid #ccc', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '10px', color: '#777', fontWeight: 'bold' }}>NA</div>
                                                    );
                                                }
                                            })()}

                                            {/* Hidden Fallback for Broken Links */}
                                            <div style={{ width: '60px', height: '60px', borderRadius: '8px', background: '#e0e0e0', border: '1px solid #ccc', display: 'none', alignItems: 'center', justifyContent: 'center', fontSize: '8px', color: '#777' }}>ERR</div>

                                            <div style={{ flex: 1 }}>
                                                <div style={{ fontWeight: 'bold', fontSize: '15px' }}>{p.title}</div>
                                                <div style={{ color: 'var(--accent)', fontWeight: 'bold' }}>₹{p.price}</div>
                                                {/* 🟢 PASTE THIS LINE HERE 🟢 */}
                                                <div style={{ fontSize: '12px', color: '#555', marginTop: '4px' }}>
                                                    Stock: <strong>{p.stock}</strong> units
                                                </div>
                                                {!p.inStock && <div style={{ color: 'red', fontSize: '12px', fontWeight: 'bold' }}>OUT OF STOCK</div>}
                                            </div>
                                            <button onClick={() => handleEdit(p)} style={{ marginRight: '15px', background: 'none', border: 'none', cursor: 'pointer', fontSize: '18px' }}>✏️</button>
                                            <button onClick={() => requestDeleteProduct(p._id)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '18px' }}>🗑️</button>
                                        </div>
                                    ))}
                            </div>

                            {/* PAGINATION BUTTONS */}
                            {products.length > 10 && (
                                <div style={{ display: 'flex', justifyContent: 'center', gap: '15px', marginTop: '20px' }}>
                                    <button
                                        disabled={currentPage === 1}
                                        onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                                        className="btn btn-outline"
                                        style={{ opacity: currentPage === 1 ? 0.5 : 1 }}
                                    >
                                        ← Previous
                                    </button>
                                    <span style={{ display: 'flex', alignItems: 'center', fontWeight: 'bold' }}>
                                        Page {currentPage} of {Math.ceil(products.length / 10)}
                                    </span>
                                    <button
                                        disabled={currentPage === Math.ceil(products.length / 10)}
                                        onClick={() => setCurrentPage(prev => Math.min(prev + 1, Math.ceil(products.length / 10)))}
                                        className="btn btn-outline"
                                        style={{ opacity: currentPage === Math.ceil(products.length / 10) ? 0.5 : 1 }}
                                    >
                                        Next →
                                    </button>
                                </div>
                            )}
                        </div>
                    )}

                    {/* ADD/EDIT PRODUCT TAB */}
                    {activeTab === 'products' && (
                        <div style={{ maxWidth: '600px', margin: '0 auto' }}>
                            <h2 style={{ marginBottom: '20px' }}>{editingId ? 'Edit Product' : 'Add New Product'}</h2>
                            <form onSubmit={handleProductSubmit} className="card" style={{ display: 'grid', gap: '15px' }}>
                                <input className="input" placeholder="Title" value={product.title} onChange={e => setProduct({ ...product, title: e.target.value })} required />
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                                              {/* 🟢 NEW: Price & MRP Inputs */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
            <input
              type="number"
              placeholder="Selling Price (e.g. 400)"
              value={product.price}
              onChange={e => setProduct({ ...product, price: e.target.value })}
              className="input"
              required
            />
            <input
              type="number"
              placeholder="MRP / Original Price (e.g. 800)"
              value={product.originalPrice || ''}
              onChange={e => setProduct({ ...product, originalPrice: e.target.value })}
              className="input"
            />
          </div>
                                    
                                    <input
                                        className="input"
                                        placeholder="Stock Qty"
                                        type="number"
                                        value={product.stock}
                                        onChange={e => setProduct({ ...product, stock: e.target.value })}
                                        required
                                    />
                                </div>
                                {/* 🟢 PASTE THIS NEW CODE HERE 🟢 */}
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                    <label style={{ fontSize: '12px', fontWeight: 'bold', color: 'var(--text-muted)' }}>Product Images</label>
                                    {product.images.map((url, index) => (
                                        <div key={index} style={{ display: 'flex', gap: '10px' }}>
                                            <input
                                                className="input"
                                                placeholder={`Image URL ${index + 1}`}
                                                value={url}
                                                onChange={e => {
                                                    const newImages = [...product.images];
                                                    newImages[index] = e.target.value;
                                                    setProduct({ ...product, images: newImages });
                                                }}
                                            />
                                            {product.images.length > 1 && (
                                                <button
                                                    type="button"
                                                    onClick={() => {
                                                        const newImages = product.images.filter((_, i) => i !== index);
                                                        setProduct({ ...product, images: newImages });
                                                    }}
                                                    style={{ background: '#ffebee', color: 'red', border: '1px solid red', borderRadius: '8px', cursor: 'pointer', padding: '0 12px' }}
                                                >
                                                    ✕
                                                </button>
                                            )}
                                        </div>
                                    ))}
                                    <button
                                        type="button"
                                        onClick={() => setProduct({ ...product, images: [...product.images, ''] })}
                                        className="btn btn-outline"
                                        style={{ fontSize: '13px', padding: '8px', borderStyle: 'dashed' }}
                                    >
                                        + Add Another Image
                                    </button>
                                </div>
                                {/* 🟢 END OF NEW CODE 🟢 */}
                                <textarea className="input" placeholder="Description" value={product.description} onChange={e => setProduct({ ...product, description: e.target.value })} style={{ height: '100px' }} />

                                {/* UPDATED: STOCK CHECKBOX */}
                                <label style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer', fontSize: '14px' }}>
                                    <input
                                        type="checkbox"
                                        checked={product.inStock}
                                        onChange={e => setProduct({ ...product, inStock: e.target.checked })}
                                        style={{ width: '18px', height: '18px' }}
                                    />
                                    Available in Stock
                                </label>

                                <button className="btn btn-primary">{editingId ? 'Update Item' : 'Add to Inventory'}</button>
                            </form>
                        </div>
                    )}

                    {/* ORDERS TAB */}
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
                                                    {/* FIXED: Order ID + Date & Time */}
                                                    <div style={{ fontSize: '11px', color: '#777', marginBottom: '4px' }}>
                                                        <strong style={{ color: '#555' }}>#{o._id.slice(-6).toUpperCase()}</strong>
                                                        <span style={{ margin: '0 5px' }}>•</span>
                                                        {new Date(o.createdAt).toLocaleString()}
                                                    </div>
                                                    <div style={{ fontWeight: 'bold', fontSize: '16px' }}>{o.customerName}</div>
                                                    <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{o.customerPhone}</div>
                                                </div>
                                                <span style={{ fontWeight: 'bold', fontSize: '18px' }}>₹{o.totalAmount}</span>
                                            </div>
                                            <div style={{ background: 'var(--bg-body)', padding: '10px', borderRadius: '10px', marginBottom: '15px' }}>
                                                {o.products.map((p, i) => {
                                                    // 1. ROOT CAUSE FIX: Find the first image that is NOT empty/null
                                                    // This prevents sending empty strings to the proxy which causes the white box
                                                    const validImg = (p.productId?.images?.find(url => url && url.trim() !== "") || p.productId?.image || "").trim();

                                                    return (
                                                        <div key={i} style={{ fontSize: '13px', marginBottom: '5px', display: 'flex', alignItems: 'center', gap: '10px' }}>


                                                            {/* FINAL SOLUTION: Master Inventory Lookup + URL Repair */}
                                                            {(() => {
                                                                // 1. RESOLVE PRODUCT ID
                                                                // Your database has mixed formats: sometimes string, sometimes object with $oid
                                                                const targetId = p.productId?._id || p.productId?.$oid || p.productId;

                                                                // 2. LOOK UP IN MASTER INVENTORY
                                                                // We search the 'products' state because the order only has the ID
                                                                const masterItem = products.find(prod => prod._id === targetId) || {};

                                                                // 3. EXTRACT IMAGE STRING (Priority: Inventory -> Order Snapshot -> Fallback)
                                                                const raw = (masterItem.images && masterItem.images[0]) ||
                                                                    masterItem.image ||
                                                                    p.image ||
                                                                    (p.images && p.images[0]) ||
                                                                    "";

                                                                // 4. CONSTRUCT URL
                                                                let src = "";
                                                                if (raw) {
                                                                    const cleanRaw = raw.toString().trim();
                                                                    // If it's a full link (Cloudinary/Firebase), use Proxy
                                                                    if (cleanRaw.toLowerCase().startsWith("http")) {
                                                                        src = `https://wsrv.nl/?url=${encodeURIComponent(cleanRaw)}&w=60&q=70&output=webp`;
                                                                    }
                                                                    // If it's a local filename (IMG-2138.jpg), prepend Server URL
                                                                    else {
                                                                        src = `https://fashion-by-nira.onrender.com/${cleanRaw}`;
                                                                    }
                                                                }

                                                                // 5. RENDER
                                                                if (src) {
                                                                    return (
                                                                        <img
                                                                            src={src}
                                                                            alt="Item"
                                                                            style={{
                                                                                width: '40px',
                                                                                height: '40px',
                                                                                borderRadius: '4px',
                                                                                objectFit: 'cover',
                                                                                background: '#eee',
                                                                                border: '1px solid #ccc'
                                                                            }}
                                                                            onError={(e) => {
                                                                                e.target.style.display = 'none';
                                                                                e.target.nextSibling.style.display = 'flex';
                                                                            }}
                                                                        />
                                                                    );
                                                                } else {
                                                                    // NA FALLBACK (If product deleted & no snapshot)
                                                                    return (
                                                                        <div style={{
                                                                            width: '40px', height: '40px', borderRadius: '4px',
                                                                            background: '#e0e0e0', border: '1px solid #ccc',
                                                                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                                            fontSize: '10px', fontWeight: 'bold', color: '#777'
                                                                        }}>
                                                                            NA
                                                                        </div>
                                                                    );
                                                                }
                                                            })()}

                                                            {/* ERROR FALLBACK */}
                                                            <div style={{
                                                                width: '40px', height: '40px', borderRadius: '4px',
                                                                background: '#ffcdd2', border: '1px solid #e57373',
                                                                display: 'none', alignItems: 'center', justifyContent: 'center',
                                                                fontSize: '8px', fontWeight: 'bold', color: '#b71c1c'
                                                            }}>
                                                                ERR
                                                            </div>

                                                            {p.productId?.title || 'Unknown Item'} <span style={{ fontWeight: 'bold' }}>x{p.quantity}</span>
                                                        </div>
                                                    );
                                                })}
                                            </div>

                                            <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '15px' }}>📍 {o.shippingAddress}</p>
                                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '10px' }}>
                                                <StatusDropdown currentStatus={o.status} onUpdate={(newStatus) => updateStatus(o._id, newStatus)} />
                                                <div style={{ display: 'flex', gap: '5px' }}>
                                                    <button onClick={() => downloadInvoice(o)} className="btn btn-outline" style={{ padding: '5px 10px', fontSize: '10px' }}>Download Invoice</button>
                                                    <button onClick={() => requestDeleteOrder(o._id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--danger)', fontSize: '18px', marginLeft: '10px' }}>🗑️</button>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    )}

                    {/* USERS TAB */}
                    {activeTab === 'users' && (
                        <div style={{ maxWidth: '600px', margin: '0 auto' }}>
                            <h2 style={{ marginBottom: '20px' }}>Admin Users</h2>
                            <div className="card" style={{ marginBottom: '30px' }}>
                                <h4 style={{ marginTop: 0, marginBottom: '15px' }}>{editUser ? 'Edit User' : 'Create New Admin'}</h4>
                                <form onSubmit={handleUserSubmit} style={{ display: 'grid', gap: '10px', marginTop: '15px' }}>
                                    <input className="input" placeholder="Admin Phone" value={newAdmin.phoneNumber} onChange={e => setNewAdmin({ ...newAdmin, phoneNumber: e.target.value })} required />
                                    <input className="input" placeholder="Password" value={newAdmin.password} onChange={e => setNewAdmin({ ...newAdmin, password: e.target.value })} required={!editUser} />
                                    <div style={{ display: 'flex', gap: '10px' }}>
                                        <button className="btn btn-primary" style={{ flex: 1 }}>{editUser ? 'Update' : 'Create'}</button>
                                        {editUser && <button type="button" onClick={() => { setEditUser(null); setNewAdmin({ phoneNumber: '', password: '' }) }} className="btn btn-outline">Cancel</button>}
                                    </div>
                                </form>
                            </div>
                            {users.map(u => (
                                <div key={u._id} className="card" style={{ padding: '15px', marginBottom: '10px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <div><strong>{u.phoneNumber}</strong> <span style={{ fontSize: '12px', color: 'gray', marginLeft: '5px' }}>(Admin)</span></div>
                                    <div>
                                        <button onClick={() => { setEditUser(u); setNewAdmin({ phoneNumber: u.phoneNumber, password: '' }) }} style={{ marginRight: '15px', border: 'none', background: 'none', cursor: 'pointer' }}>✏️</button>
                                        {/* FIXED DELETE BUTTON */}
                                        <button
                                            onClick={() => requestDeleteUser(u._id)}
                                            style={{ color: 'var(--danger)', border: 'none', background: 'none', cursor: 'pointer', fontSize: '18px' }}
                                        >
                                            🗑️
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                    {/* 🟢 PASTE THE FOOTER HERE 🟢 */}
                    <footer style={{ textAlign: 'center', padding: '40px 20px', marginTop: 'auto', borderTop: '1px solid var(--border)', color: 'var(--text-muted)', fontSize: '12px', opacity: 0.7 }}>
                        <p>© {new Date().getFullYear()} Fashion By Nira. All rights reserved.</p>
                    </footer>
                </div>
            </div>
        </div>
    );
}

export default AdminPanel;
