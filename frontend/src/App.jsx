import React, { useState, useEffect } from 'react';
import axios from 'axios';
import html2canvas from 'html2canvas';
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

// --- INVOICE GENERATOR (INVISIBLE TO USER) ---
const downloadInvoice = async (order) => {
  const element = document.createElement('div');

  // CONFIGURATION: Force A4 dimensions
  const A4_WIDTH_PX = 794;
  const A4_HEIGHT_PX = 1123;

  // FIX: Position it off-screen so the user doesn't see the "glitch" at the bottom
  Object.assign(element.style, {
    position: 'fixed',        // Take it out of the normal document flow
    left: '-10000px',         // Move it far off to the left
    top: '0',
    width: `${A4_WIDTH_PX}px`,
    minHeight: `${A4_HEIGHT_PX}px`,
    zIndex: '-1000',          // Put it behind everything
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
              <td style="padding: 12px; border-bottom: 1px solid #eee; text-align: right;">₹${p.productId?.price}</td>
              <td style="padding: 12px; border-bottom: 1px solid #eee; text-align: right; font-weight: bold;">₹${p.productId?.price * p.quantity}</td>
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

  // Wait for browser to paint (while hidden)
  await new Promise(resolve => setTimeout(resolve, 500));

  try {
    const canvas = await html2canvas(element, {
      scale: 2, // High resolution
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
    // Clean up the hidden element
    document.body.removeChild(element);
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
      <button onClick={() => { setView('cart'); close() }} className={`btn ${view === 'cart' ? 'btn-primary' : 'btn-outline'}`} style={{ width: '100%', justifyContent: 'flex-start' }}>Cart ({cartCount})</button>
      <button onClick={() => { setView('contact'); close() }} className={`btn ${view === 'contact' ? 'btn-primary' : 'btn-outline'}`} style={{ width: '100%', justifyContent: 'flex-start' }}>Contact Us</button>

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
          
                {/* MODERN SEARCH BAR (DARK MODE ADAPTIVE) */}
      {view === 'shop' && (
        <div style={{ 
          position: 'relative', 
          maxWidth: '500px', 
          margin: '0 auto 30px auto', 
          transition: 'all 0.3s ease'
        }}>
          
          {/* SEARCH ICON */}
          <span style={{
            position: 'absolute',
            left: '20px',
            top: '50%',
            transform: 'translateY(-50%)',
            fontSize: '18px',
            color: 'var(--text-muted)', // Adapted color
            pointerEvents: 'none',
            zIndex: 10
          }}>
            🔍
          </span>

          {/* THE INPUT FIELD */}
          <input
            type="text"
            placeholder="Search Collection..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{
              width: '100%',
              padding: '16px 50px 16px 55px',
              borderRadius: '50px',
              // CHANGE: Used variables instead of fixed colors
              border: '1px solid var(--border)', 
              background: 'var(--bg-card)', 
              color: 'var(--text-main)', 
              fontSize: '16px',
              outline: 'none',
              boxShadow: '0 4px 20px rgba(0,0,0,0.05)',
              transition: 'box-shadow 0.3s ease'
            }}
            onFocus={(e) => e.target.style.boxShadow = '0 8px 30px rgba(0,0,0,0.12)'}
            onBlur={(e) => e.target.style.boxShadow = '0 4px 20px rgba(0,0,0,0.05)'}
          />

          {/* THE "X" CLEAR BUTTON */}
          <button
            onClick={() => setSearchQuery('')}
            style={{
              position: 'absolute',
              right: '15px',
              top: '50%',
              transform: searchQuery ? 'translateY(-50%) scale(1)' : 'translateY(-50%) scale(0)',
              opacity: searchQuery ? 1 : 0,
              transition: 'all 0.2s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
              // CHANGE: Adapts to dark mode background
              background: 'var(--bg-body)', 
              border: '1px solid var(--border)',
              borderRadius: '50%',
              width: '28px',
              height: '28px',
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center',
              cursor: 'pointer',
              color: 'var(--text-main)', // Adapts text color
              fontSize: '14px',
            }}
            // Hover effect (Manual check for theme not possible inline, so we use opacity)
            onMouseEnter={(e) => { e.currentTarget.style.opacity = '0.7'; }}
            onMouseLeave={(e) => { e.currentTarget.style.opacity = '1'; }}
          >
            ✕
          </button>
        </div>
      )}
      

      {/* COMPONENTS */}
      <SideMenu isOpen={menuOpen} close={() => setMenuOpen(false)} view={view} setView={setView} cartCount={cart.reduce((a, c) => a + c.quantity, 0)} isAdmin={token && role === 'admin'} onLogin={() => setShowLogin(true)} onLogout={() => { setToken(null); setRole(null); setView('shop') }} />

      {showLogin && <Auth onLoginSuccess={handleLogin} closeAuth={() => setShowLogin(false)} />}
      {orderSuccess && <OrderSuccessModal />}

      {deleteId && (
        <DeleteConfirmModal
          onConfirm={confirmDelete}
          onCancel={() => setDeleteId(null)}
        />
      )}

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
                <button onClick={() => downloadInvoice(o)} className="btn btn-outline" style={{ padding: '5px 10px', fontSize: '10px' }}>Download Invoice</button>
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
            <p style={{ marginBottom: '15px' }}><strong>📞 Phone:</strong> +91 9585026838</p>
            <p style={{ marginBottom: '15px' }}><strong>📧 Email:</strong> support@fashionbynira.com</p>
            <p style={{ marginBottom: '25px' }}><strong>📍 Address:</strong> Tiruchengode, Namakkal, Tamil Nadu - 637211</p>

            <div style={{ display: 'grid', gap: '10px' }}>
              <a href="https://instagram.com/fashionby_nira" target="_blank" rel="noreferrer" style={{ textDecoration: 'none' }}>
                <button className="btn btn-outline" style={{ width: '100%', borderColor: '#E1306C', color: '#E1306C' }}>
                  📸 Visit Instagram
                </button>
              </a>
              <a href="https://wa.me/919585026838?text=Hi Nira" target="_blank" rel="noreferrer" style={{ textDecoration: 'none' }}>
                <button className="btn btn-primary" style={{ width: '100%', background: '#25D366', border: 'none' }}>
                  💬 Chat on WhatsApp
                </button>
              </a>
            </div>
          </div>
        </div>
      )}
      {/* ✅ PASTE THE FOOTER HERE ✅ */}
      <footer style={{ textAlign: 'center', padding: '30px', marginTop: 'auto', borderTop: '1px solid var(--border)', color: 'var(--text-muted)', fontSize: '12px' }}>
        <p>© {new Date().getFullYear()} Fashion By Nira. All rights reserved.</p>
      </footer>
    </div>
  );
}

export default App;
