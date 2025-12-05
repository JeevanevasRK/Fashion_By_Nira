import React, { useState, useEffect } from 'react';
import axios from 'axios';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import Auth from './components/Auth';
import AdminPanel from './components/AdminPanel';
import ProductList from './components/ProductList';
import ProductDetail from './components/ProductDetail';

const API = "https://fashion-by-nira.onrender.com/api";

// --- HELPERS ---
const getStatusColor = (status) => {
  switch (status) {
    case 'Pending': return '#ff9800';
    case 'Order Accepted': return '#2196f3';
    case 'Packed': return '#9c27b0';
    case 'Dispatched': return '#00bcd4';
    case 'Delivered': return '#27ae60';
    default: return '#888';
  }
};

// --- INVOICE GENERATOR ---
const downloadInvoice = async (order, type) => {
  const element = document.createElement('div');

  // Define Invoice HTML
  element.innerHTML = `
    <div style="padding: 50px; font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; background: white; width: 700px; color: #333; position: relative;">
      
      <div style="display: flex; justify-content: space-between; border-bottom: 4px solid #000; padding-bottom: 20px; margin-bottom: 30px;">
        <div>
          <h1 style="margin: 0; font-size: 28px; letter-spacing: 2px; text-transform: uppercase;">FASHION BY NIRA</h1>
          <p style="margin: 5px 0 0; font-size: 12px; color: #666;">Premium Fashion & Accessories</p>
        </div>
        <div style="text-align: right;">
          <h2 style="margin: 0; color: #512da8; font-size: 24px;">INVOICE</h2>
          <p style="margin: 5px 0 0; font-weight: bold;">#INV-${order._id.slice(-6).toUpperCase()}</p>
          <p style="margin: 0; font-size: 12px; color: #888;">Date: ${new Date().toLocaleDateString()}</p>
        </div>
      </div>

      <div style="display: flex; justify-content: space-between; margin-bottom: 40px;">
        <div style="width: 45%;">
          <h4 style="margin: 0 0 10px 0; color: #512da8; text-transform: uppercase; border-bottom: 1px solid #ddd; padding-bottom: 5px;">Billed By</h4>
          <p style="margin: 0; font-size: 13px; line-height: 1.6;">
            <strong>Fashion By Nira</strong><br>
            123, Fashion Street, Adyar<br>
            Chennai, Tamil Nadu - 600020<br>
            Phone: +91 9876543210<br>
            Email: support@fashionbynira.com
          </p>
        </div>
        <div style="width: 45%;">
          <h4 style="margin: 0 0 10px 0; color: #512da8; text-transform: uppercase; border-bottom: 1px solid #ddd; padding-bottom: 5px;">Billed To</h4>
          <p style="margin: 0; font-size: 13px; line-height: 1.6;">
            <strong>${order.customerName}</strong><br>
            ${order.shippingAddress}<br>
            Phone: ${order.customerPhone}
          </p>
        </div>
      </div>

      <table style="width: 100%; border-collapse: collapse; margin-bottom: 30px;">
        <thead>
          <tr style="background: #000; color: white; text-align: left;">
            <th style="padding: 12px; font-size: 12px; text-transform: uppercase;">Item Description</th>
            <th style="padding: 12px; font-size: 12px; text-transform: uppercase; text-align: center;">Qty</th>
            <th style="padding: 12px; font-size: 12px; text-transform: uppercase; text-align: right;">Price</th>
            <th style="padding: 12px; font-size: 12px; text-transform: uppercase; text-align: right;">Total</th>
          </tr>
        </thead>
        <tbody>
          ${order.products.map(p => `
            <tr style="border-bottom: 1px solid #eee;">
              <td style="padding: 12px; font-size: 13px;"><strong>${p.productId?.title || 'Item'}</strong></td>
              <td style="padding: 12px; font-size: 13px; text-align: center;">${p.quantity}</td>
              <td style="padding: 12px; font-size: 13px; text-align: right;">₹${p.productId?.price}</td>
              <td style="padding: 12px; font-size: 13px; text-align: right; font-weight: bold;">₹${p.productId?.price * p.quantity}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>

      <div style="display: flex; justify-content: flex-end;">
        <div style="width: 200px;">
          <div style="display: flex; justify-content: space-between; margin-bottom: 10px; font-size: 13px;">
            <span>Subtotal:</span>
            <span>₹${order.totalAmount}</span>
          </div>
          <div style="display: flex; justify-content: space-between; margin-bottom: 10px; font-size: 13px; color: green;">
            <span>Shipping:</span>
            <span>Free</span>
          </div>
          <div style="display: flex; justify-content: space-between; border-top: 2px solid #000; padding-top: 10px; font-size: 18px; font-weight: bold;">
            <span>Total:</span>
            <span>₹${order.totalAmount}</span>
          </div>
        </div>
      </div>

      <div style="margin-top: 50px; border-top: 1px solid #ddd; padding-top: 20px; text-align: center; font-size: 12px; color: #888;">
        <p>Thank you for your business!</p>
        <p>For any queries, please contact support@fashionbynira.com</p>
      </div>
    </div>
  `;

  document.body.appendChild(element);
  const canvas = await html2canvas(element);
  const data = canvas.toDataURL('image/png');
  document.body.removeChild(element);

  if (type === 'pdf') {
    const pdf = new jsPDF('p', 'mm', 'a4');
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

// --- MODALS ---
const OrderSuccessModal = () => (
  <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(5px)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
    <div className="card animate" style={{ textAlign: 'center', width: '350px', padding: '40px' }}>
      <div style={{ fontSize: '50px', marginBottom: '10px' }}>🎉</div>
      <h2 style={{ marginBottom: '5px' }}>Order Placed!</h2>
      <p style={{ color: 'var(--text-muted)' }}>We'll contact you shortly.</p>
    </div>
  </div>
);

const DeleteConfirmModal = ({ onConfirm, onCancel }) => (
  <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)', zIndex: 10000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
    <div className="card animate" style={{ width: '320px', textAlign: 'center', padding: '30px' }}>
      <div style={{ fontSize: '40px', marginBottom: '15px' }}>🗑️</div>
      <h3 style={{ marginBottom: '10px' }}>Remove Item?</h3>
      <p style={{ color: 'var(--text-muted)', marginBottom: '25px', fontSize: '14px' }}>Are you sure you want to remove this from your bag?</p>
      <div style={{ display: 'flex', gap: '10px' }}>
        <button onClick={onCancel} className="btn btn-outline" style={{ flex: 1 }}>Cancel</button>
        <button onClick={onConfirm} className="btn btn-danger" style={{ flex: 1 }}>Yes, Remove</button>
      </div>
    </div>
  </div>
);

// --- SIDE MENU ---
const SideMenu = ({ isOpen, close, view, setView, cartCount, isAdmin, onLogin, onLogout }) => (
  <>
    {isOpen && <div onClick={close} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.3)', zIndex: 1900 }}></div>}
    <div style={{
      position: 'fixed', top: 0, right: isOpen ? 0 : '-300px', width: '280px', height: '100%',
      background: 'var(--bg-card)', zIndex: 2000, padding: '30px', transition: '0.4s cubic-bezier(0.2, 0.8, 0.2, 1)',
      boxShadow: '-10px 0 40px rgba(0,0,0,0.1)', display: 'flex', flexDirection: 'column', gap: '20px'
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h3 style={{ fontWeight: 800, margin: 0, fontSize: '20px' }}>MENU</h3>
        <button onClick={close} style={{ background: 'none', border: 'none', fontSize: '28px', cursor: 'pointer', lineHeight: 1 }}>×</button>
      </div>

      <button onClick={() => { setView('shop'); close() }} className={`btn ${view === 'shop' ? 'btn-primary' : 'btn-outline'}`} style={{ width: '100%', justifyContent: 'flex-start' }}>Shop Collection</button>
      <button onClick={() => { setView('track'); close() }} className={`btn ${view === 'track' ? 'btn-primary' : 'btn-outline'}`} style={{ width: '100%', justifyContent: 'flex-start' }}>Track Order</button>
      <button onClick={() => { setView('contact'); close() }} className={`btn ${view === 'contact' ? 'btn-primary' : 'btn-outline'}`} style={{ width: '100%', justifyContent: 'flex-start' }}>Contact Us</button>
      <button onClick={() => { setView('cart'); close() }} className={`btn ${view === 'cart' ? 'btn-primary' : 'btn-outline'}`} style={{ width: '100%', justifyContent: 'flex-start' }}>Cart ({cartCount})</button>

      <div style={{ marginTop: 'auto', paddingTop: '20px', borderTop: '1px solid var(--border)' }}>
        {isAdmin ? (
          <button onClick={() => { setView('admin'); close() }} className="btn btn-primary" style={{ width: '100%' }}>Admin Dashboard</button>
        ) : (
          <button onClick={() => { onLogin(); close() }} className="btn btn-outline" style={{ width: '100%' }}>Admin Login</button>
        )}
      </div>
    </div>
  </>
);

function App() {
  const [token, setToken] = useState(null);
  const [role, setRole] = useState(null);
  const [view, setView] = useState('shop');
  const [showLogin, setShowLogin] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [guestDetails, setGuestDetails] = useState({ name: '', phone: '', address: '' });
  const [orderSuccess, setOrderSuccess] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [trackPhone, setTrackPhone] = useState('');
  const [trackedOrders, setTrackedOrders] = useState(null);
  const [cart, setCart] = useState(() => JSON.parse(localStorage.getItem('myShopCart')) || []);
  const [deleteId, setDeleteId] = useState(null);

  useEffect(() => { localStorage.setItem('myShopCart', JSON.stringify(cart)); }, [cart]);

  const handleLogin = (t, r) => { setToken(t); setRole(r); setShowLogin(false); if (r === 'admin') setView('admin'); };

  const addToCart = (p) => {
    const exist = cart.find(x => x._id === p._id);
    if (exist) setCart(cart.map(x => x._id === p._id ? { ...x, quantity: x.quantity + 1 } : x));
    else setCart([...cart, { ...p, quantity: 1 }]);
  };

  const updateQty = (id, delta) => {
    setCart(cart.map(item => {
      if (item._id === id) {
        return { ...item, quantity: Math.max(1, item.quantity + delta) };
      }
      return item;
    }));
  };

  const decreaseQty = (id) => {
    const item = cart.find(x => x._id === id);
    if (item.quantity === 1) {
      setDeleteId(id);
    } else {
      setCart(cart.map(x => x._id === id ? { ...x, quantity: x.quantity - 1 } : x));
    }
  };

  const removeFromCart = (id) => setDeleteId(id);

  const confirmDelete = () => {
    const newCart = cart.filter(x => x._id !== deleteId);
    setCart(newCart);
    setDeleteId(null);
    if (newCart.length === 0) setView('shop');
  };

  const handleCheckout = async (e) => {
    e.preventDefault();
    if (cart.length === 0) return alert("Cart empty");
    try {
      await axios.post(`${API}/orders`, {
        products: cart.map(i => ({ productId: i._id, quantity: i.quantity })),
        totalAmount: cart.reduce((sum, i) => sum + (i.price * i.quantity), 0),
        shippingAddress: guestDetails.address, customerName: guestDetails.name, customerPhone: guestDetails.phone
      });
      setOrderSuccess(true); setCart([]); setGuestDetails({ name: '', phone: '', address: '' });
      setTimeout(() => { setOrderSuccess(false); setView('shop'); }, 3000);
    } catch (err) { alert("Failed to place order"); }
  };

  const handleTrackOrder = async (e) => {
    e.preventDefault();
    try {
      const res = await axios.post(`${API}/orders/track`, { phone: trackPhone });
      setTrackedOrders(res.data);
    } catch (err) { alert("No orders found"); }
  };

  return (
    <div className="wrapper">
      {/* HEADER */}
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px', paddingBottom: '20px', borderBottom: '1px solid var(--border)', position: 'relative' }}>
        <h1 style={{ fontSize: '22px', fontWeight: 900, letterSpacing: '1px', textTransform: 'uppercase', cursor: 'pointer' }} onClick={() => setView('shop')}>FASHION BY NIRA</h1>
        <button onClick={() => setMenuOpen(true)} style={{ background: 'none', border: 'none', fontSize: '26px', cursor: 'pointer', color: 'var(--text-main)' }}>☰</button>
      </header>

      {/* SEARCH BAR */}
      {view === 'shop' && (
        <div style={{ maxWidth: '500px', margin: '0 auto 40px', position: 'relative' }}>
          <input className="input" placeholder="Search products..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} style={{ paddingLeft: '45px', borderRadius: '50px' }} />
          <span style={{ position: 'absolute', left: '15px', top: '50%', transform: 'translateY(-50%)' }}>🔍</span>
        </div>
      )}

      {/* COMPONENTS */}
      <SideMenu isOpen={menuOpen} close={() => setMenuOpen(false)} view={view} setView={setView} cartCount={cart.reduce((a, c) => a + c.quantity, 0)} isAdmin={token && role === 'admin'} onLogin={() => setShowLogin(true)} onLogout={() => { setToken(null); setRole(null); setView('shop') }} />

      {showLogin && <Auth onLoginSuccess={handleLogin} closeAuth={() => setShowLogin(false)} />}
      {orderSuccess && <OrderSuccessModal />}
      {deleteId && <DeleteConfirmModal onConfirm={confirmDelete} onCancel={() => setDeleteId(null)} />}
      {token && view === 'admin' && <AdminPanel token={token} setIsAdmin={() => { setToken(null); setView('shop') }} />}

      {view === 'shop' && <ProductList addToCart={addToCart} searchQuery={searchQuery} onProductClick={(p) => { setSelectedProduct(p); setView('details') }} apiUrl={API} />}
      {view === 'details' && selectedProduct && <ProductDetail product={selectedProduct} addToCart={addToCart} onBack={() => setView('shop')} />}

      {view === 'cart' && (
        <div className="animate" style={{ maxWidth: '1000px', margin: '0 auto' }}>
          <h2 style={{ marginBottom: '20px' }}>Shopping Bag</h2>
          {cart.length === 0 ? <p style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '50px' }}>Your bag is empty.</p> : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '40px' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                {cart.map(item => (
                  <div key={item._id} className="card" style={{ display: 'flex', gap: '15px', alignItems: 'center', padding: '15px' }}>
                    <img src={item.image} style={{ width: '70px', height: '70px', objectFit: 'contain', background: 'white', borderRadius: '8px' }} />
                    <div style={{ flex: 1 }}>
                      <h4 style={{ fontSize: '16px' }}>{item.title}</h4>
                      <p style={{ fontWeight: 'bold', color: 'var(--accent)' }}>₹{item.price}</p>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', background: 'var(--bg-body)', borderRadius: '20px', padding: '5px 10px' }}>
                      <button onClick={() => decreaseQty(item._id)} style={{ border: 'none', background: 'none', cursor: 'pointer', color: 'var(--text-main)' }}>-</button>
                      <span style={{ fontSize: '14px', fontWeight: 'bold' }}>{item.quantity}</span>
                      <button onClick={() => updateQty(item._id, 1)} style={{ border: 'none', background: 'none', cursor: 'pointer', color: 'var(--text-main)' }}>+</button>
                    </div>
                    <button onClick={() => removeFromCart(item._id)} style={{ border: 'none', background: 'none', color: 'var(--danger)', cursor: 'pointer', fontSize: '20px' }}>×</button>
                  </div>
                ))}
              </div>
              <div className="card" style={{ height: 'fit-content' }}>
                <h3>Total: ₹{cart.reduce((a, c) => a + (c.price * c.quantity), 0)}</h3>
                <form onSubmit={handleCheckout} style={{ display: 'grid', gap: '10px', marginTop: '20px' }}>
                  <input className="input" placeholder="Full Name" required onChange={e => setGuestDetails({ ...guestDetails, name: e.target.value })} />
                  <input className="input" placeholder="Phone Number" required onChange={e => setGuestDetails({ ...guestDetails, phone: e.target.value })} />
                  <textarea className="input" placeholder="Full Address" required onChange={e => setGuestDetails({ ...guestDetails, address: e.target.value })} />
                  <button className="btn btn-primary" style={{ width: '100%' }}>Confirm Order (COD)</button>
                </form>
              </div>
            </div>
          )}
        </div>
      )}

      {view === 'track' && (
        <div style={{ maxWidth: '600px', margin: '0 auto' }} className="animate">
          <h2 style={{ textAlign: 'center', marginBottom: '20px' }}>Track Order</h2>
          <form onSubmit={handleTrackOrder} style={{ display: 'flex', gap: '10px', marginBottom: '30px' }}>
            <input className="input" placeholder="Enter Phone Number" value={trackPhone} onChange={e => setTrackPhone(e.target.value)} required />
            <button className="btn btn-primary">Search</button>
          </form>
          {trackedOrders && trackedOrders.map(o => (
            <div key={o._id} className="card">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px', borderBottom: '1px solid var(--border)', paddingBottom: '10px' }}>
                <div>
                  <strong>#{o._id.slice(-6).toUpperCase()}</strong>
                  <br />
                  <span style={{
                    color: getStatusColor(o.status), fontWeight: 'bold', fontSize: '12px',
                    padding: '2px 8px', background: `${getStatusColor(o.status)}20`, borderRadius: '10px'
                  }}>
                    {o.status}
                  </span>
                </div>
                <div style={{ display: 'flex', gap: '5px' }}>
                  <button onClick={() => downloadInvoice(o, 'jpg')} className="btn btn-outline" style={{ padding: '5px 10px', fontSize: '10px' }}>JPG</button>
                  <button onClick={() => downloadInvoice(o, 'pdf')} className="btn btn-outline" style={{ padding: '5px 10px', fontSize: '10px' }}>PDF</button>
                </div>
              </div>
              {o.products.map((p, i) => (
                <div key={i} style={{ fontSize: '14px', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '10px', marginTop: '10px' }}>
                  <img src={p.productId?.image || 'https://via.placeholder.com/40'} style={{ width: '40px', height: '40px', objectFit: 'cover', borderRadius: '5px' }} />
                  <span>{p.productId?.title || 'Item'} x{p.quantity}</span>
                </div>
              ))}
            </div>
          ))}
        </div>
      )}

      {view === 'contact' && (
        <div style={{ maxWidth: '600px', margin: '0 auto' }} className="animate">
          <h2 style={{ textAlign: 'center', marginBottom: '30px' }}>Contact Us</h2>
          <div className="card" style={{ padding: '30px' }}>
            <p style={{ marginBottom: '15px' }}><strong>📞 Phone:</strong> +91 9876543210</p>
            <p style={{ marginBottom: '15px' }}><strong>📧 Email:</strong> support@fashionbynira.com</p>
            <p style={{ marginBottom: '25px' }}><strong>📍 Address:</strong> 123, Fashion Street, Chennai, India</p>

            <div style={{ display: 'grid', gap: '10px' }}>
              <a href="https://instagram.com/fashionbynira" target="_blank" rel="noreferrer" style={{ textDecoration: 'none' }}>
                <button className="btn btn-outline" style={{ width: '100%', borderColor: '#E1306C', color: '#E1306C' }}>
                  📸 Visit Instagram
                </button>
              </a>
              <a href="https://wa.me/919876543210?text=Hi" target="_blank" rel="noreferrer" style={{ textDecoration: 'none' }}>
                <button className="btn btn-primary" style={{ width: '100%', background: '#25D366', border: 'none' }}>
                  💬 Chat on WhatsApp
                </button>
              </a>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

export default App;