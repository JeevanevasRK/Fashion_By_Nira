import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Auth from './components/Auth';
import AdminPanel from './components/AdminPanel';
import ProductList from './components/ProductList';
import ProductDetail from './components/ProductDetail';

// --- YOUR NEW API LINK ---
const API = "https://fashion-by-nira.onrender.com/api";

const OrderSuccessModal = () => (
  <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(5px)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
    <div className="card animate" style={{ textAlign: 'center', width: '350px', padding: '40px' }}>
      <div style={{ fontSize: '50px', marginBottom: '10px' }}>🎉</div>
      <h2 style={{ marginBottom: '5px' }}>Order Placed!</h2>
      <p style={{ color: 'var(--text-muted)' }}>We'll contact you shortly.</p>
    </div>
  </div>
);

function App() {
  const [token, setToken] = useState(null);
  const [role, setRole] = useState(null);
  const [view, setView] = useState('shop');
  const [showLogin, setShowLogin] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [guestDetails, setGuestDetails] = useState({ name: '', phone: '', address: '' });
  const [orderSuccess, setOrderSuccess] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [trackPhone, setTrackPhone] = useState('');
  const [trackedOrders, setTrackedOrders] = useState(null);

  const [cart, setCart] = useState(() => JSON.parse(localStorage.getItem('myShopCart')) || []);

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
        const newQty = item.quantity + delta;
        return newQty > 0 ? { ...item, quantity: newQty } : item;
      }
      return item;
    }));
  };

  const removeFromCart = (id) => setCart(cart.filter(x => x._id !== id));

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
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px', paddingBottom: '20px', borderBottom: '1px solid var(--border)', flexWrap: 'wrap', gap: '15px' }}>
        <h1 style={{ fontSize: '24px', fontWeight: 800, letterSpacing: '1px', textTransform: 'uppercase' }}>FASHION BY NIRA</h1>

        <div style={{ display: 'flex', gap: '10px', overflowX: 'auto' }}>
          <button onClick={() => setView('shop')} className={`btn ${view === 'shop' ? 'btn-primary' : 'btn-outline'}`}>Shop</button>
          <button onClick={() => setView('track')} className={`btn ${view === 'track' ? 'btn-primary' : 'btn-outline'}`}>Track</button>
          <button onClick={() => setView('cart')} className={`btn ${view === 'cart' ? 'btn-primary' : 'btn-outline'}`}>Cart ({cart.reduce((a, c) => a + c.quantity, 0)})</button>
          {token && role === 'admin' ?
            <button onClick={() => setView('admin')} className="btn btn-primary">Admin</button> :
            <button onClick={() => setShowLogin(true)} className="btn btn-outline">Admin Login</button>
          }
        </div>
      </header>

      {/* SEARCH BAR (Shop Only) */}
      {view === 'shop' && (
        <div style={{ maxWidth: '500px', margin: '0 auto 40px', position: 'relative' }}>
          <input className="input" placeholder="Search products..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} style={{ paddingLeft: '45px', borderRadius: '50px' }} />
          <span style={{ position: 'absolute', left: '15px', top: '50%', transform: 'translateY(-50%)' }}>🔍</span>
        </div>
      )}

      {showLogin && <Auth onLoginSuccess={handleLogin} closeAuth={() => setShowLogin(false)} apiUrl={API} />}
      {orderSuccess && <OrderSuccessModal />}
      {token && view === 'admin' && <AdminPanel token={token} setIsAdmin={() => { setToken(null); setView('shop') }} apiUrl={API} />}

      {view === 'shop' && <ProductList addToCart={addToCart} searchQuery={searchQuery} onProductClick={(p) => { setSelectedProduct(p); setView('details') }} apiUrl={API} />}

      {view === 'details' && selectedProduct && <ProductDetail product={selectedProduct} addToCart={addToCart} onBack={() => setView('shop')} />}

      {/* CART VIEW */}
      {view === 'cart' && (
        <div className="animate" style={{ maxWidth: '1000px', margin: '0 auto' }}>
          <h2 style={{ marginBottom: '20px' }}>Your Cart</h2>
          {cart.length === 0 ? (
            <div className="card" style={{ textAlign: 'center', padding: '60px' }}>
              <h3 style={{ color: 'var(--text-muted)' }}>Your cart is empty</h3>
              <button onClick={() => setView('shop')} className="btn btn-primary" style={{ marginTop: '20px' }}>Start Shopping</button>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '30px' }}>

              {/* CART ITEMS */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                {cart.map(item => (
                  <div key={item._id} className="card" style={{ display: 'flex', gap: '15px', alignItems: 'center', padding: '15px' }}>
                    <img src={item.image} style={{ width: '70px', height: '70px', objectFit: 'contain', background: 'white', borderRadius: '8px' }} />
                    <div style={{ flex: 1 }}>
                      <h4 style={{ fontSize: '16px' }}>{item.title}</h4>
                      <p style={{ fontWeight: 'bold', color: 'var(--accent)' }}>₹{item.price}</p>
                    </div>

                    {/* QTY & DELETE */}
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '5px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', background: 'var(--bg-body)', borderRadius: '20px', padding: '5px 10px' }}>
                        <button onClick={() => updateQty(item._id, -1)} style={{ border: 'none', background: 'none', cursor: 'pointer', color: 'var(--text-main)' }}>-</button>
                        <span style={{ fontSize: '14px', fontWeight: 'bold' }}>{item.quantity}</span>
                        <button onClick={() => updateQty(item._id, 1)} style={{ border: 'none', background: 'none', cursor: 'pointer', color: 'var(--text-main)' }}>+</button>
                      </div>
                      <button onClick={() => removeFromCart(item._id)} className="btn btn-danger" style={{ padding: '5px 10px', fontSize: '12px' }}>Delete</button>
                    </div>
                  </div>
                ))}
              </div>

              {/* CHECKOUT */}
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

      {/* TRACK ORDER VIEW */}
      {view === 'track' && (
        <div style={{ maxWidth: '600px', margin: '0 auto' }} className="animate">
          <h2 style={{ textAlign: 'center', marginBottom: '20px' }}>Track Order</h2>
          <form onSubmit={handleTrackOrder} style={{ display: 'flex', gap: '10px', marginBottom: '30px' }}>
            <input className="input" placeholder="Enter Phone Number" value={trackPhone} onChange={e => setTrackPhone(e.target.value)} required />
            <button className="btn btn-primary">Search</button>
          </form>
          {trackedOrders && trackedOrders.map(o => (
            <div key={o._id} className="card">
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
                <strong>#{o._id.slice(-6).toUpperCase()}</strong>
                <span style={{ color: 'var(--success)', fontWeight: 'bold' }}>{o.status}</span>
              </div>
              {o.products.map((p, i) => <div key={i} style={{ fontSize: '14px', color: 'var(--text-muted)' }}>{p.productId?.title || 'Item'} x{p.quantity}</div>)}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default App;