import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Auth from './components/Auth';
import AdminPanel from './components/AdminPanel';
import ProductList from './components/ProductList';
import ProductDetail from './components/ProductDetail';

// --- ANIMATED SUCCESS MODAL ---
const OrderSuccessModal = () => {
  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, width: '100%', height: '100%',
      background: 'rgba(0,0,0,0.7)', zIndex: 9999, display: 'flex',
      justifyContent: 'center', alignItems: 'center', backdropFilter: 'blur(5px)'
    }}>
      <div style={{
        background: 'white', padding: '40px', borderRadius: '20px', textAlign: 'center',
        boxShadow: '0 20px 60px rgba(0,0,0,0.3)', maxWidth: '90%', width: '400px',
        animation: 'popIn 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275)'
      }}>
        <div className="checkmark-circle"><div className="checkmark"></div></div>
        <h2 style={{ color: '#27ae60', margin: '20px 0 10px', fontSize: '28px' }}>Order Confirmed!</h2>
        <p style={{ color: '#555', fontSize: '16px' }}>Thank you for shopping with us.</p>
        <p style={{ color: '#888', fontSize: '14px', marginTop: '5px' }}>We will contact you shortly.</p>
      </div>
    </div>
  );
};

function App() {
  const [token, setToken] = useState(null);
  const [role, setRole] = useState(null);
  const [view, setView] = useState('shop');
  const [showLogin, setShowLogin] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [guestDetails, setGuestDetails] = useState({ name: '', phone: '', address: '' });
  const [orderSuccess, setOrderSuccess] = useState(false);

  // TRACKING STATE
  const [trackPhone, setTrackPhone] = useState('');
  const [trackedOrders, setTrackedOrders] = useState(null);

  const [cart, setCart] = useState(() => {
    const savedCart = localStorage.getItem('myShopCart');
    return savedCart ? JSON.parse(savedCart) : [];
  });

  useEffect(() => {
    localStorage.setItem('myShopCart', JSON.stringify(cart));
  }, [cart]);

  const handleLoginSuccess = (token, userRole) => {
    setToken(token);
    setRole(userRole);
    setShowLogin(false);
    if (userRole === 'admin') setView('admin');
  };

  const addToCart = (product) => {
    const exist = cart.find((x) => x._id === product._id);
    if (exist) {
      setCart(cart.map((x) => x._id === product._id ? { ...exist, quantity: exist.quantity + 1 } : x));
    } else {
      setCart([...cart, { ...product, quantity: 1 }]);
    }
  };

  const increaseQty = (product) => {
    const exist = cart.find((x) => x._id === product._id);
    if (exist) setCart(cart.map((x) => x._id === product._id ? { ...exist, quantity: exist.quantity + 1 } : x));
  };

  const decreaseQty = (product) => {
    const exist = cart.find((x) => x._id === product._id);
    if (exist.quantity === 1) {
      setCart(cart.filter((x) => x._id !== product._id));
    } else {
      setCart(cart.map((x) => x._id === product._id ? { ...exist, quantity: exist.quantity - 1 } : x));
    }
  };

  const removeFromCart = (product) => {
    setCart(cart.filter((x) => x._id !== product._id));
  };

  const handleProductClick = (product) => {
    setSelectedProduct(product);
    setView('details');
  };

  const handleCheckout = async (e) => {
    e.preventDefault();
    if (cart.length === 0) return alert("Cart is empty!");
    if (!guestDetails.name || !guestDetails.phone || !guestDetails.address) return alert("Please fill details.");

    const totalAmount = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);

    try {
      await axios.post('http://localhost:5000/api/orders', {
        products: cart.map(item => ({ productId: item._id, quantity: item.quantity })),
        totalAmount, shippingAddress: guestDetails.address, customerName: guestDetails.name, customerPhone: guestDetails.phone
      });
      setOrderSuccess(true);
      setCart([]);
      setGuestDetails({ name: '', phone: '', address: '' });
      setTimeout(() => { setOrderSuccess(false); setView('shop'); }, 3500);
    } catch (error) { alert("Error placing order."); }
  };

  // --- NEW: HANDLE TRACK ORDER ---
  const handleTrackOrder = async (e) => {
    e.preventDefault();
    try {
      const res = await axios.post('http://localhost:5000/api/orders/track', { phone: trackPhone });
      setTrackedOrders(res.data);
    } catch (err) {
      alert("Error searching for orders.");
    }
  };

  const navBtnStyle = { padding: '10px 20px', border: '1px solid #ddd', background: 'white', cursor: 'pointer', borderRadius: '25px', fontSize: '13px', fontWeight: '600', transition: '0.3s' };

  return (
    <div style={{ fontFamily: 'Montserrat, sans-serif', padding: '20px', background: '#f8f9fa', minHeight: '100vh' }}>

      <style>{`
        /* ALL PREVIOUS STYLES KEPT EXACTLY THE SAME */
        .cart-container { max-width: 1400px; margin: 0 auto; width: 100%; }
        .cart-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 30px; border-bottom: 1px solid #ddd; padding-bottom: 15px; }
        .cart-title { font-size: 28px; fontWeight: 800; color: #222; text-transform: uppercase; letter-spacing: 1px; }
        .cart-layout { display: flex; flex-direction: column; gap: 30px; }
        @media (min-width: 1000px) {
          .cart-layout { flex-direction: row; align-items: flex-start; }
          .cart-items-section { flex: 2; }
          .cart-summary-section { flex: 1; position: sticky; top: 20px; }
        }
        .cart-item { display: flex; align-items: center; justify-content: space-between; background: white; padding: 25px; border-radius: 15px; margin-bottom: 20px; box-shadow: 0 4px 10px rgba(0,0,0,0.02); border: 1px solid #eee; }
        .item-left { display: flex; align-items: center; gap: 20px; flex: 1; }
        .cart-img { width: 90px; height: 90px; object-fit: contain; border-radius: 10px; background: #f9f9f9; padding: 5px; }
        .qty-group { display: flex; align-items: center; gap: 15px; background: #f4f4f4; padding: 8px 15px; border-radius: 30px; }
        .qty-btn { background: white; border: none; width: 30px; height: 30px; border-radius: 50%; cursor: pointer; font-weight: bold; box-shadow: 0 2px 5px rgba(0,0,0,0.1); }
        .qty-btn:hover { background: #512da8; color: white; }
        .order-summary { background: white; padding: 30px; border-radius: 20px; box-shadow: 0 10px 40px rgba(0,0,0,0.05); border: 1px solid #eee; }
        .input-field, .textarea-field { width: 100%; padding: 15px; border: 1px solid #e0e0e0; border-radius: 10px; background: #fcfcfc; font-family: inherit; margin-bottom: 15px; outline: none; }
        .input-field:focus, .textarea-field:focus { border-color: #512da8; background: white; }
        .checkout-btn { width: 100%; padding: 20px; background: black; color: white; border: none; border-radius: 50px; font-size: 16px; font-weight: 700; text-transform: uppercase; cursor: pointer; margin-top: 10px; transition: 0.3s; }
        .checkout-btn:hover { background: #512da8; transform: translateY(-3px); }
        @keyframes popIn { 0% { opacity: 0; transform: scale(0.5); } 100% { opacity: 1; transform: scale(1); } }
        .checkmark-circle { width: 80px; height: 80px; margin: 0 auto; position: relative; background: #27ae60; border-radius: 50%; display: flex; align-items: center; justify-content: center; animation: scaleUp 0.5s ease-out; }
        .checkmark { width: 25px; height: 45px; border-bottom: 5px solid white; border-right: 5px solid white; transform: rotate(45deg) translate(-5px, -2px); animation: checkDraw 0.8s ease-out forwards; }
        @keyframes scaleUp { 0% { transform: scale(0); } 100% { transform: scale(1); } }
        @keyframes checkDraw { 0% { height: 0; width: 0; opacity: 0; } 50% { height: 45px; width: 0; opacity: 1; } 100% { height: 45px; width: 25px; opacity: 1; } }
        @media (max-width: 600px) { .cart-item { flex-direction: column; align-items: flex-start; gap: 20px; } .qty-group { width: 100%; justify-content: space-between; } }
      `}</style>

      {/* HEADER */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px', borderBottom: '2px solid #e0e0e0', paddingBottom: '20px' }}>
        <h1 style={{ fontSize: '24px', fontWeight: '700', letterSpacing: '2px', textTransform: 'uppercase', color: '#333', margin: 0 }}>FASHION BY NIRA</h1>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button onClick={() => setView('shop')} style={navBtnStyle}>Shop</button>
          <button onClick={() => setView('track')} style={{ ...navBtnStyle, background: view === 'track' ? '#000' : 'white', color: view === 'track' ? 'white' : 'black' }}>Track Order</button>
          <button onClick={() => setView('cart')} style={{ ...navBtnStyle, background: view === 'cart' ? '#512da8' : 'white', color: view === 'cart' ? 'white' : 'black' }}>Cart ({cart.reduce((a, c) => a + c.quantity, 0)})</button>
          {token && role === 'admin' ? (
            <>
              <button onClick={() => setView('admin')} style={{ ...navBtnStyle, background: '#e0efff' }}>Dashboard</button>
              <button onClick={() => { setToken(null); setRole(null); setView('shop') }} style={{ ...navBtnStyle, background: '#333', color: '#fff' }}>Logout</button>
            </>
          ) : (
            <button onClick={() => setShowLogin(true)} style={{ ...navBtnStyle, background: '#fff', color: '#000' }}>Admin Login</button>
          )}
        </div>
      </div>

      {showLogin && <Auth onLoginSuccess={handleLoginSuccess} closeAuth={() => setShowLogin(false)} />}
      {token && role === 'admin' && view === 'admin' && <AdminPanel token={token} setIsAdmin={() => { setToken(null); setView('shop') }} />}
      {orderSuccess && <OrderSuccessModal />}

      {view === 'shop' && <ProductList addToCart={addToCart} onProductClick={handleProductClick} />}
      {view === 'details' && selectedProduct && <ProductDetail product={selectedProduct} addToCart={addToCart} onBack={() => setView('shop')} />}
      {view === 'cart' && (
        <div className="cart-container">
          <div className="cart-header"><h2 className="cart-title">Shopping Bag</h2><span style={{ fontSize: '16px', fontWeight: '600' }}>{cart.reduce((a, c) => a + c.quantity, 0)} Items</span></div>
          {cart.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '80px', background: 'white', borderRadius: '20px' }}>
              <h3 style={{ color: '#333', fontSize: '24px' }}>Your cart is empty</h3>
              <p style={{ color: '#888', marginBottom: '30px' }}>Looks like you haven't made your choice yet.</p>
              <button onClick={() => setView('shop')} className="checkout-btn" style={{ width: 'auto', padding: '15px 40px' }}>Start Shopping</button>
            </div>
          ) : (
            <div className="cart-layout">
              <div className="cart-items-section">
                {cart.map((item) => (
                  <div key={item._id} className="cart-item">
                    <div className="item-left"><img src={item.image || 'https://via.placeholder.com/80'} alt={item.title} className="cart-img" /><div><h4 style={{ fontSize: '18px', margin: '0 0 5px 0' }}>{item.title}</h4><span style={{ color: '#512da8', fontWeight: 'bold' }}>₹{item.price}</span></div></div>
                    <div className="qty-group"><button onClick={() => decreaseQty(item)} className="qty-btn">-</button><span>{item.quantity}</span><button onClick={() => increaseQty(item)} className="qty-btn">+</button></div>
                    <div style={{ textAlign: 'right', minWidth: '80px' }}><p style={{ fontWeight: '800', fontSize: '18px' }}>₹{item.price * item.quantity}</p><button onClick={() => removeFromCart(item)} style={{ background: 'none', border: 'none', color: 'red', cursor: 'pointer', fontSize: '12px', textDecoration: 'underline' }}>Remove</button></div>
                  </div>
                ))}
              </div>
              <div className="cart-summary-section">
                <div className="order-summary">
                  <h3 style={{ marginTop: 0, borderBottom: '1px solid #eee', paddingBottom: '15px', marginBottom: '20px' }}>Order Summary</h3>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px', fontSize: '16px', color: '#555' }}><span>Subtotal</span><span>₹{cart.reduce((sum, item) => sum + (item.price * item.quantity), 0)}</span></div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px', fontSize: '16px', color: '#555' }}><span>Shipping</span><span style={{ color: 'green', fontWeight: 'bold' }}>Free</span></div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '30px', fontSize: '22px', fontWeight: '800', color: '#222' }}><span>Total</span><span>₹{cart.reduce((sum, item) => sum + (item.price * item.quantity), 0)}</span></div>
                  <form onSubmit={handleCheckout}>
                    <h4 style={{ marginBottom: '15px' }}>Shipping Details</h4>
                    <input required className="input-field" placeholder="Full Name" value={guestDetails.name} onChange={e => setGuestDetails({ ...guestDetails, name: e.target.value })} />
                    <input required className="input-field" placeholder="Phone Number" value={guestDetails.phone} onChange={e => setGuestDetails({ ...guestDetails, phone: e.target.value })} />
                    <textarea required className="textarea-field" placeholder="Address (House No, Street, City)" value={guestDetails.address} onChange={e => setGuestDetails({ ...guestDetails, address: e.target.value })} style={{ height: '100px' }} />
                    <button type="submit" className="checkout-btn">Confirm Order (COD)</button>
                  </form>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* --- NEW TRACK ORDER VIEW --- */}
      {view === 'track' && (
        <div style={{ maxWidth: '600px', margin: '0 auto' }}>
          <h2 style={{ textAlign: 'center', textTransform: 'uppercase', marginBottom: '30px' }}>Track Your Order</h2>
          <div style={{ background: 'white', padding: '30px', borderRadius: '20px', boxShadow: '0 5px 20px rgba(0,0,0,0.05)', border: '1px solid #eee' }}>
            <p style={{ marginBottom: '15px', color: '#555' }}>Enter your mobile number to check order status:</p>
            <form onSubmit={handleTrackOrder}>
              <input
                className="input-field"
                placeholder="Enter Phone Number"
                value={trackPhone}
                onChange={(e) => setTrackPhone(e.target.value)}
                required
              />
              <button type="submit" className="checkout-btn" style={{ marginTop: '0' }}>Check Status</button>
            </form>
          </div>

          {/* TRACKING RESULTS */}
          {trackedOrders && (
            <div style={{ marginTop: '30px' }}>
              {trackedOrders.length === 0 ? (
                <p style={{ textAlign: 'center', color: 'red' }}>No orders found for this number.</p>
              ) : (
                trackedOrders.map(order => (
                  <div key={order._id} style={{ background: 'white', padding: '20px', borderRadius: '15px', marginBottom: '20px', border: '1px solid #eee' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #f0f0f0', paddingBottom: '10px', marginBottom: '10px' }}>
                      <span style={{ fontWeight: 'bold' }}>Order #{order._id.slice(-6).toUpperCase()}</span>
                      <span style={{
                        color: order.status === 'Pending' ? 'orange' : 'green',
                        fontWeight: 'bold', textTransform: 'uppercase', fontSize: '12px',
                        padding: '5px 10px', background: order.status === 'Pending' ? '#fff8e1' : '#e8f5e9', borderRadius: '10px'
                      }}>
                        {order.status}
                      </span>
                    </div>

                    {/* Items List */}
                    <div style={{ marginBottom: '15px' }}>
                      {order.products.map((p, i) => (
                        <div key={i} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px', color: '#555', marginBottom: '5px' }}>
                          <span>{p.productId ? p.productId.title : 'Item Removed'} (x{p.quantity})</span>
                        </div>
                      ))}
                    </div>

                    <div style={{ textAlign: 'right', fontWeight: 'bold', fontSize: '16px' }}>
                      Total: ₹{order.totalAmount}
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      )}

    </div>
  );
}

export default App;