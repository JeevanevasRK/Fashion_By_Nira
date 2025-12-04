import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Auth from './components/Auth';
import AdminPanel from './components/AdminPanel';
import ProductList from './components/ProductList';
import ProductDetail from './components/ProductDetail';

// API BASE URL
const API = "https://fashion-by-nira.onrender.com/api";

const OrderSuccessModal = () => (
  <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', zIndex: 9999, display: 'flex', justifyContent: 'center', alignItems: 'center', backdropFilter: 'blur(5px)' }}>
    <div className="card animate-up" style={{ textAlign: 'center', width: '300px', padding: '40px', background: 'white', borderRadius: '20px' }}>
      <div style={{ fontSize: '40px', color: '#27ae60', marginBottom: '10px' }}>✓</div>
      <h2>Order Placed!</h2>
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

  // TRACKING
  const [trackPhone, setTrackPhone] = useState('');
  const [trackedOrders, setTrackedOrders] = useState(null);

  const [cart, setCart] = useState(() => JSON.parse(localStorage.getItem('myShopCart')) || []);

  useEffect(() => { localStorage.setItem('myShopCart', JSON.stringify(cart)); }, [cart]);

  const handleLoginSuccess = (t, r) => { setToken(t); setRole(r); setShowLogin(false); if (r === 'admin') setView('admin'); };

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
      // FIX: Updated URL
      await axios.post(`${API}/orders`, {
        products: cart.map(i => ({ productId: i._id, quantity: i.quantity })),
        totalAmount: cart.reduce((sum, i) => sum + (i.price * i.quantity), 0),
        shippingAddress: guestDetails.address, customerName: guestDetails.name, customerPhone: guestDetails.phone
      });
      setOrderSuccess(true); setCart([]); setGuestDetails({ name: '', phone: '', address: '' });
      setTimeout(() => { setOrderSuccess(false); setView('shop'); }, 3000);
    } catch (err) { alert("Order failed"); }
  };

  const handleTrackOrder = async (e) => {
    e.preventDefault();
    try {
      // FIX: Updated URL
      const res = await axios.post(`${API}/orders/track`, { phone: trackPhone });
      setTrackedOrders(res.data);
    } catch (err) { alert("No orders found"); }
  };

  const getStepClass = (status, stepName) => {
    const levels = { 'Pending': 1, 'Order Accepted': 2, 'Packed': 3, 'Dispatched': 4, 'Delivered': 5 };
    return levels[status] >= levels[stepName] ? 'active' : '';
  };

  const navBtnStyle = { padding: '8px 16px', border: '1px solid #ddd', background: 'white', cursor: 'pointer', borderRadius: '25px', fontSize: '13px', fontWeight: '600' };

  return (
    <div className="wrapper">
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '15px', marginBottom: '30px', borderBottom: '1px solid #eee', paddingBottom: '20px' }}>
        <h1 style={{ fontSize: '22px', fontWeight: '800', margin: 0, textTransform: 'uppercase', letterSpacing: '2px' }}>FASHION BY NIRA</h1>
        <div style={{ display: 'flex', gap: '10px', overflowX: 'auto', width: '100%', justifyContent: 'center' }}>
          <button onClick={() => setView('shop')} style={navBtnStyle}>Shop</button>
          <button onClick={() => setView('track')} style={navBtnStyle}>Track</button>
          <button onClick={() => setView('cart')} style={navBtnStyle}>Cart ({cart.reduce((a, c) => a + c.quantity, 0)})</button>
          {token && role === 'admin' ?
            <button onClick={() => setView('admin')} style={{ ...navBtnStyle, background: 'black', color: 'white' }}>Dashboard</button> :
            <button onClick={() => setShowLogin(true)} style={{ ...navBtnStyle, background: 'black', color: 'white' }}>Admin</button>
          }
        </div>
      </div>

      {showLogin && <Auth onLoginSuccess={handleLoginSuccess} closeAuth={() => setShowLogin(false)} />}
      {orderSuccess && <OrderSuccessModal />}
      {token && view === 'admin' && <AdminPanel token={token} setIsAdmin={() => { setToken(null); setView('shop') }} />}

      {view === 'shop' && <ProductList addToCart={addToCart} onProductClick={(p) => { setSelectedProduct(p); setView('details') }} />}

      {view === 'details' && selectedProduct && <ProductDetail product={selectedProduct} addToCart={addToCart} onBack={() => setView('shop')} />}

      {view === 'cart' && (
        <div className="animate-up" style={{ maxWidth: '600px', margin: '0 auto' }}>
          <h2 style={{ marginBottom: '20px' }}>Shopping Bag</h2>
          {cart.length === 0 ? <p style={{ textAlign: 'center', padding: '50px', color: '#777' }}>Your bag is empty.</p> : (
            <>
              {cart.map(item => (
                <div key={item._id} className="card" style={{ display: 'flex', justifyContent: 'space-between', margin: '10px 0', alignItems: 'center', padding: '15px', borderRadius: '10px', border: '1px solid #eee' }}>
                  <div style={{ display: 'flex', gap: '15px', alignItems: 'center' }}>
                    <img src={item.image} style={{ width: '50px', height: '50px', objectFit: 'contain' }} />
                    <div><b>{item.title}</b><br /><span style={{ color: '#512da8', fontWeight: 'bold' }}>₹{item.price}</span> x {item.quantity}</div>
                  </div>
                  <div style={{ display: 'flex', gap: '5px' }}>
                    <button onClick={() => updateQty(item._id, -1)} style={navBtnStyle}>-</button>
                    <button onClick={() => updateQty(item._id, 1)} style={navBtnStyle}>+</button>
                  </div>
                </div>
              ))}
              <div className="card" style={{ padding: '20px', marginTop: '20px' }}>
                <h3 style={{ marginBottom: '20px' }}>Total: ₹{cart.reduce((a, c) => a + (c.price * c.quantity), 0)}</h3>
                <form onSubmit={handleCheckout} style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  <input className="input-field" placeholder="Full Name" required onChange={e => setGuestDetails({ ...guestDetails, name: e.target.value })} />
                  <input className="input-field" placeholder="Phone Number" required onChange={e => setGuestDetails({ ...guestDetails, phone: e.target.value })} />
                  <textarea className="input-field" placeholder="Full Address" required onChange={e => setGuestDetails({ ...guestDetails, address: e.target.value })} style={{ height: '80px' }} />
                  <button style={{ width: '100%', padding: '15px', background: 'black', color: 'white', border: 'none', borderRadius: '8px', fontWeight: 'bold', marginTop: '10px' }}>PLACE ORDER (COD)</button>
                </form>
              </div>
            </>
          )}
        </div>
      )}

      {view === 'track' && (
        <div style={{ maxWidth: '600px', margin: '0 auto' }} className="animate-up">
          <h2 style={{ textAlign: 'center', marginBottom: '20px' }}>Track Order</h2>
          <form onSubmit={handleTrackOrder} style={{ display: 'flex', gap: '10px', marginBottom: '30px' }}>
            <input className="input-field" placeholder="Enter Phone Number" value={trackPhone} onChange={e => setTrackPhone(e.target.value)} required />
            <button style={{ ...navBtnStyle, background: 'black', color: 'white' }}>Search</button>
          </form>
          {trackedOrders && trackedOrders.map(order => (
            <div key={order._id} className="card">
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px', borderBottom: '1px solid #eee', paddingBottom: '10px' }}>
                <span style={{ fontWeight: 'bold' }}>Order #{order._id.slice(-6).toUpperCase()}</span>
                <span style={{ color: '#512da8', fontWeight: 'bold' }}>₹{order.totalAmount}</span>
              </div>
              <div className="status-timeline">
                {['Pending', 'Packed', 'Dispatched', 'Delivered'].map((step, i) => (
                  <div key={step} className={`status-step ${getStepClass(order.status, step)}`}>
                    <div className="step-dot">{i + 1}</div>
                    <div className="step-label">{step}</div>
                  </div>
                ))}
              </div>
              <div style={{ marginTop: '20px' }}>
                {order.products.map((p, i) => (
                  <div key={i} style={{ fontSize: '13px', color: '#555', marginBottom: '5px' }}>{p.productId?.title} x {p.quantity}</div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default App;