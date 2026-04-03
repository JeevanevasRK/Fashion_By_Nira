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
          <p style="margin: 0; font-size: 12px; color: #888;">Date: ${new Date(order.createdAt).toLocaleDateString()}</p>
        </div>
      </div>

      <div style="display: flex; justify-content: space-between; margin-bottom: 40px;">
        <div style="width: 45%;">
          <h4 style="border-bottom: 1px solid #ddd; padding-bottom: 5px; margin-bottom: 10px; color: #555;">Billed By</h4>
          <p style="font-size: 13px; line-height: 1.6; margin: 0;">
            <strong>Fashion By Nira</strong><br>
            Tiruchengode Namakkal,<br>
            Tamil Nadu - 637211<br>
            +91 9003866090
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
              <td style="padding: 12px; border-bottom: 1px solid #eee;">${p.productId?.title || 'Item'} ${p.selectedColor ? `(${p.selectedColor})` : ''}</td>
              <td style="padding: 12px; border-bottom: 1px solid #eee; text-align: center;">${p.quantity}</td>
              
              <td style="padding: 12px; border-bottom: 1px solid #eee; text-align: right;">₹${p.price || p.productId?.price || 0}</td>
              
              <td style="padding: 12px; border-bottom: 1px solid #eee; text-align: right; font-weight: bold;">₹${(p.price || p.productId?.price || 0) * p.quantity}</td>
            </tr>
          `).join('')}
        </tbody>
            </table>

      <div style="display: flex; justify-content: flex-end;">
        <div style="width: 250px; border-top: 2px solid #000; padding-top: 10px;">
          
          
                    
          ${(() => {
            const subtotal = order.products.reduce((acc, p) => acc + ((p.price || p.productId?.price || 0) * p.quantity), 0);
            const shipping = 60;
            const finalTotal = subtotal + shipping;

            return `
              <div style="display: flex; justify-content: space-between; font-size: 14px; margin-bottom: 5px; color: #555;">
                <span>Subtotal:</span>
                <span>₹${subtotal}</span>
              </div>

              <div style="display: flex; justify-content: space-between; font-size: 14px; margin-bottom: 10px; color: #555;">
                <span>Shipping:</span>
                <span>₹${shipping}</span>
              </div>

              <div style="display: flex; justify-content: space-between; font-size: 20px; font-weight: bold; border-top: 1px solid #eee; padding-top: 10px;">
                <span>Total:</span>
                <span>₹${finalTotal}</span>
              </div>
            `;
          })()}
          

        </div>
      </div>
      

      <div style="margin-top: 60px; text-align: center; font-size: 10px; color: #aaa; border-top: 1px solid #eee; padding-top: 20px;">
        <p>Thank you for your business! | query.fashionbynira@gmail.com</p>
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
  const [selectedCountry, setSelectedCountry] = useState("+91");
    // 🟢 NEW: State for Modern Warning Toast
  const [warningMsg, setWarningMsg] = useState("");
  

  const [searchQuery, setSearchQuery] = useState("");
  const [sortOrder, setSortOrder] = useState("");
  const [isSortOpen, setIsSortOpen] = useState(false); // 🟢 NEW: State for Modern Popup
  
  const [trackPhone, setTrackPhone] = useState('');
  const [trackedOrders, setTrackedOrders] = useState(null);

  const [cart, setCart] = useState(() => JSON.parse(localStorage.getItem('myShopCart')) || []);
    // 🟢 NEW: Store the UPI Transaction ID
  const [utr, setUtr] = useState('');
  
    const [itemToDelete, setItemToDelete] = useState(null); // Stores { id, color }
  
  // 🟢 NEW: Cart Error State (For Stock Validation)
  const [cartErrors, setCartErrors] = useState({});

  const triggerCartError = (id, msg) => {
    setCartErrors(prev => ({ ...prev, [id]: msg }));
    setTimeout(() => {
      setCartErrors(prev => {
        const next = { ...prev };
        delete next[id];
        return next;
      });
    }, 2500);
  };
  // --- ADD THIS FOR TRACKING FIX ---
  const [allProducts, setAllProducts] = useState([]);

  // Fetch Inventory to allow looking up images by ID
  useEffect(() => {
    axios.get(`${API}/products`)
      .then(res => setAllProducts(res.data))
      .catch(err => console.error("Inventory fetch failed", err));
  }, []);
  // ---------------------------------

  useEffect(() => { localStorage.setItem('myShopCart', JSON.stringify(cart)); }, [cart]);

  const handleLogin = (t, r) => { setToken(t); setRole(r); setShowLogin(false); if (r === 'admin') setView('admin'); };

    // 🟢 NEW: Add to Cart (Handles Color Variations)
  const addToCart = (p) => {
    const targetColor = p.selectedColor || null;
    
    setCart(prevCart => {
      // Check if item exists with SAME ID and SAME COLOR
      const existingItem = prevCart.find(item => 
        item._id === p._id && item.selectedColor === targetColor
      );

      if (existingItem) {
        return prevCart.map(item => 
          (item._id === p._id && item.selectedColor === targetColor)
            ? { ...item, quantity: item.quantity + 1 } 
            : item
        );
      } else {
        return [...prevCart, { ...p, quantity: 1, selectedColor: targetColor }];
      }
    });
  };
  

  const updateQty = (id, delta) => {
    setCart(cart.map(item => {
      if (item._id === id) {
        return { ...item, quantity: Math.max(1, item.quantity + delta) };
      }
      return item;
    }));
  };

        const decreaseQty = (id, color = null) => {
    const targetColor = color || null;
    const item = cart.find(x => x._id === id && (x.selectedColor || null) === targetColor);

    // 🟢 FIXED: Trigger Modal if Qty is 1
    if (item && item.quantity === 1) {
       setItemToDelete({ id, color: targetColor });
       return;
    }

    // Otherwise decrease normal
    setCart(prevCart => prevCart.map(item =>
      (item._id === id && (item.selectedColor || null) === targetColor)
        ? { ...item, quantity: item.quantity - 1 }
        : item
    ));
  };

  const removeFromCart = (id, color = null) => {
    // 🟢 FIXED: Trigger Modal immediately
    setItemToDelete({ id, color: color || null });
  };

  const confirmDelete = () => {
    if (!itemToDelete) return;
    
    // 🟢 FIXED: Filter by both ID and Color
    const newCart = cart.filter(item => 
      !(item._id === itemToDelete.id && (item.selectedColor || null) === itemToDelete.color)
    );
    
    setCart(newCart);
    setItemToDelete(null);

    // If cart becomes empty, go to Shop
    if (newCart.length === 0) {
      setView('shop');
      window.scrollTo(0, 0);
    }
  };
  

      const handleCheckout = async (e) => {
    e.preventDefault();
    if (cart.length === 0) return alert("Cart empty");

    // 🟢 VALIDATION: UTR is Mandatory for UPI
    if (!utr.trim()) {
      setWarningMsg("⚠️ Please scan QR & enter Transaction ID");
      setTimeout(() => setWarningMsg(""), 3000);
      return;
    }

    try {
      await axios.post(`${API}/orders`, {
        products: cart.map(i => ({ 
            productId: i._id, 
            quantity: i.quantity, 
            price: i.price,
            selectedColor: i.selectedColor || null
        })),
        // 🟢 Calculation: Subtotal + 60 Shipping
        totalAmount: cart.reduce((sum, i) => sum + (i.price * i.quantity), 0) + 60,
        shippingAddress: guestDetails.address, 
        customerName: guestDetails.name, 
        customerPhone: guestDetails.phone,
        
        // 🟢 PAYMENT DETAILS (Strict UPI)
        paymentMethod: 'UPI', 
        transactionId: utr
      });

      setOrderSuccess(true); 
      setCart([]); 
      setGuestDetails({ name: '', phone: '', address: '' });
      setUtr(''); // Clear UTR
      setTimeout(() => { setOrderSuccess(false); setView('shop'); }, 3000);
    } catch (err) { 
      alert("Failed to place order"); 
    }
  };
  
  

  const handleTrackOrder = async (e) => {
    e.preventDefault();
    try {
      const res = await axios.post(`${API}/orders/track`, { phone: trackPhone });
      setTrackedOrders(res.data);
    } catch (err) { alert("No orders found"); }
  };


    // 🟢 NEW: Handle Order via WhatsApp
  const handleWhatsAppOrder = () => {
    // Basic validation before redirecting to WhatsApp
    if (!guestDetails.name || !guestDetails.phone || !guestDetails.address) {
      setWarningMsg("⚠️ Please fill name, phone, and address first");
      setTimeout(() => setWarningMsg(""), 3000);
      return;
    }

    let message = `*NEW ORDER FROM WEBSITE*\n\n`;
    message += `*Customer Details:*\n`;
    message += `Name: ${guestDetails.name}\n`;
    message += `Phone: ${selectedCountry}${guestDetails.phone}\n`;
    message += `Address: ${guestDetails.address}\n\n`;
    
    message += `*Order Summary:*\n`;
    cart.forEach((item, index) => {
      message += `${index + 1}. ${item.title} ${item.selectedColor ? `(${item.selectedColor})` : ''} - Qty: ${item.quantity} - ₹${item.price * item.quantity}\n`;
    });
    
    const subtotal = cart.reduce((a,c) => a + (c.price * c.quantity), 0);
    message += `\nSubtotal: ₹${subtotal}\n`;
    message += `Shipping: ₹60\n`;
    message += `*Total Amount: ₹${subtotal + 60}*\n`;
    
    const encodedMessage = encodeURIComponent(message);
    // Opens WhatsApp with the pre-filled message sent to your business number
    window.open(`https://wa.me/919003866090?text=${encodedMessage}`, '_blank');
  };
  

  return (
    <div className="wrapper">

            {/* 🟢 MODERN FLOATING TOAST (Always Visible) */}
      <div style={{
        position: 'fixed', top: '20px', left: '50%', 
        transform: warningMsg ? 'translateX(-50%) translateY(0)' : 'translateX(-50%) translateY(-100px)',
        background: 'rgba(20, 20, 20, 0.95)', color: '#fff', 
        padding: '12px 28px', borderRadius: '50px',
        backdropFilter: 'blur(12px)', border: '1px solid rgba(255, 255, 255, 0.15)',
        zIndex: 99999, display: 'flex', alignItems: 'center', gap: '12px',
        boxShadow: '0 20px 50px rgba(0,0,0,0.4)', opacity: warningMsg ? 1 : 0, 
        pointerEvents: 'none', width: 'max-content',
        transition: 'all 0.5s cubic-bezier(0.19, 1, 0.22, 1)'
      }}>
        <span style={{ fontSize: '20px' }}>⚠️</span>
        <span style={{ fontWeight: '600', fontSize: '14px', letterSpacing: '0.5px' }}>{warningMsg}</span>
      </div>
      

      {/* PREMIUM HEADER */}
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px', paddingBottom: '20px', borderBottom: '1px solid var(--border)', position: 'relative' }}>
        <h1 style={{ fontSize: '22px', fontWeight: 900, letterSpacing: '1px', textTransform: 'uppercase', cursor: 'pointer', margin: 0 }} onClick={() => setView('shop')}>FASHION BY NIRA</h1>

        <div style={{ display: 'flex', alignItems: 'center', gap: '25px' }}>

          {/* MODERN CART BUTTON */}
          <button
            onClick={() => setView('cart')}
            style={{
              background: 'none',
              border: 'none',
              position: 'relative',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              color: 'var(--text-main)' // Auto-adapts to Dark Mode
            }}
          >
            {/* Minimalist SVG Bag Icon */}
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"></path>
              <line x1="3" y1="6" x2="21" y2="6"></line>
              <path d="M16 10a4 4 0 0 1-8 0"></path>
            </svg>

            {/* Premium Notification Dot */}
            {cart.length > 0 && (
              <span style={{
                position: 'absolute',
                top: '-5px',
                right: '-8px',
                background: 'var(--accent)', // Uses your Gold/Theme color
                color: 'var(--accent-text)',
                borderRadius: '50%',
                minWidth: '18px',
                height: '18px',
                fontSize: '10px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: '800',
                border: '2px solid var(--bg-body)', // Creates a "cutout" effect
                boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
                padding: '0 4px'
              }}>
                {cart.reduce((a, c) => a + c.quantity, 0)}
              </span>
            )}
          </button>

          {/* MENU BUTTON */}
          <button onClick={() => setMenuOpen(true)} style={{ background: 'none', border: 'none', fontSize: '28px', cursor: 'pointer', color: 'var(--text-main)', lineHeight: 1 }}>☰</button>
        </div>
      </header>

            {/* MODERN SEARCH BAR & FILTER (DARK MODE ADAPTIVE) */}
      {view === 'shop' && (
        <div style={{
          display: 'flex',
          gap: '10px',
          maxWidth: '650px', 
          margin: '0 auto 30px auto',
          transition: 'all 0.3s ease'
        }}>

          {/* SEARCH BAR (Wrapped inside its own relative div) */}
          <div style={{ position: 'relative', flex: 1 }}>
            <span style={{
              position: 'absolute', left: '20px', top: '50%',
              transform: 'translateY(-50%)', fontSize: '18px',
              color: 'var(--text-muted)', pointerEvents: 'none', zIndex: 10
            }}>
              🔍
            </span>

            <input
              type="text"
              placeholder="Search Collection..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                width: '100%',
                boxSizing: 'border-box',
                padding: '16px 50px 16px 55px',
                borderRadius: '50px',
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

            <button
              onClick={() => setSearchQuery('')}
              style={{
                position: 'absolute', right: '15px', top: '50%',
                transform: searchQuery ? 'translateY(-50%) scale(1)' : 'translateY(-50%) scale(0)',
                opacity: searchQuery ? 1 : 0, transition: 'all 0.2s ease',
                background: 'var(--bg-body)', border: '1px solid var(--border)',
                borderRadius: '50%', width: '28px', height: '28px',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                cursor: 'pointer', color: 'var(--text-main)', fontSize: '14px',
              }}
            >
              ✕
            </button>
          </div>

          {/* 🟢 NEW: SORT FILTER DROPDOWN */}
          <select
            value={sortOrder}
            onChange={(e) => setSortOrder(e.target.value)}
            style={{
              padding: '0 20px',
              borderRadius: '50px',
              border: '1px solid var(--border)',
              background: 'var(--bg-card)',
              color: 'var(--text-main)',
              fontSize: '14px',
              fontWeight: '600',
              outline: 'none',
              cursor: 'pointer',
              boxShadow: '0 4px 20px rgba(0,0,0,0.05)',
              transition: 'box-shadow 0.3s ease',
              WebkitAppearance: 'none',
              MozAppearance: 'none',
              appearance: 'none',
              textAlign: 'center'
            }}
          >
            <option value="">Sort: Default</option>
            <option value="lowToHigh">Price: Low to High</option>
            <option value="highToLow">Price: High to Low</option>
          </select>

        </div>
      )}
      

      {/* COMPONENTS */}
      <SideMenu isOpen={menuOpen} close={() => setMenuOpen(false)} view={view} setView={setView} cartCount={cart.reduce((a, c) => a + c.quantity, 0)} isAdmin={token && role === 'admin'} onLogin={() => setShowLogin(true)} onLogout={() => { setToken(null); setRole(null); setView('shop') }} />

      {showLogin && <Auth onLoginSuccess={handleLogin} closeAuth={() => setShowLogin(false)} />}
      {orderSuccess && <OrderSuccessModal />}

            {itemToDelete && (
        <DeleteConfirmModal
          onConfirm={confirmDelete}
          onCancel={() => setItemToDelete(null)}
        />
      )}
      

      {token && view === 'admin' && <AdminPanel token={token} setIsAdmin={() => { setToken(null); setView('shop') }} />}

      {view === 'shop' && <ProductList
        addToCart={addToCart}
        decreaseQty={decreaseQty} // <--- Pass this function
        cart={cart}               // <--- Pass the cart state
        searchQuery={searchQuery}
        sortOrder={sortOrder} // 🟢 NEW: Pass sort order to ProductList
        onProductClick={(p) => { setSelectedProduct(p); setView('details') }}
        apiUrl={API}
      />}

      {view === 'details' && selectedProduct && <ProductDetail
        product={selectedProduct}
        addToCart={addToCart}
        decreaseQty={decreaseQty}  // <--- Added
        cart={cart}                // <--- Added
        onBack={() => setView('shop')}
      />}

    {view === 'cart' && (
        <div className="animate" style={{ maxWidth: '1000px', margin: '0 auto' }}>
          <h2 style={{ marginBottom: '20px' }}>Shopping Bag</h2>
          {cart.length === 0 ? <p style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '50px' }}>Your bag is empty.</p> : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '40px' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                                {cart.map(item => (
                  <div key={`${item._id}-${item.selectedColor || ''}`} className="card" style={{ display: 'flex', gap: '15px', alignItems: 'center', padding: '15px' }}>
                    
                    {/* 🟢 FIXED: Image tag is clean (no span inside) */}
                    <img
                      src={`https://wsrv.nl/?url=${encodeURIComponent((item.images && item.images.length > 0) ? item.images[0] : item.image)}&w=150&q=70&output=webp`}
                      alt={item.title}
                      style={{
                        width: '70px',
                        height: '70px',
                        objectFit: 'cover',
                        background: '#f0f0f0',
                        borderRadius: '8px'
                      }}
                      onError={(e) => { e.target.src = 'https://via.placeholder.com/70' }}
                    />

                    <div style={{ flex: 1 }}>
                      <h4 style={{ fontSize: '16px' }}>
                        {item.title}
                        {/* 🟢 MOVED HERE: Color name displays correctly next to title */}
                        {item.selectedColor && <span style={{ fontSize: '12px', color: 'var(--text-muted)', marginLeft: '5px' }}>({item.selectedColor})</span>}
                      </h4>
                      <p style={{ fontWeight: 'bold', color: 'var(--accent)' }}>₹{item.price}</p>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', background: 'var(--bg-body)', borderRadius: '20px', padding: '5px 10px' }}>
                      <button onClick={() => decreaseQty(item._id, item.selectedColor)} style={{ border: 'none', background: 'none', cursor: 'pointer', color: 'var(--text-main)' }}>-</button>
                      <span style={{ fontSize: '14px', fontWeight: 'bold' }}>{item.quantity}</span>
                                                                  <button onClick={() => {
                        const totalQty = cart.reduce((sum, i) => i._id === item._id ? sum + i.quantity : sum, 0);
                        
                        // 🟢 MODERN FIX: Use setWarningMsg instead of alert
                        if (item.stock && totalQty >= item.stock) { 
                            setWarningMsg(`Stock limit reached! Only ${item.stock} available.`); 
                            setTimeout(() => setWarningMsg(""), 3000); // Disappear after 3s
                            return; 
                        }
                        addToCart(item);
                      }} style={{ border: 'none', background: 'none', cursor: 'pointer', color: 'var(--text-main)' }}>+</button>
                      
                      
                    </div>

                    <button onClick={() => removeFromCart(item._id, item.selectedColor)} style={{ border: 'none', background: 'none', color: 'var(--danger)', cursor: 'pointer', fontSize: '20px' }}>×</button>
                  </div>
                ))}
                
              </div>
              <div className="card" style={{ height: 'fit-content' }}>
                              {/* 🟢 NEW: Shipping Breakdown (Dark Mode Compatible) */}
              {(() => {
                const subtotal = cart.reduce((a, c) => a + (c.price * c.quantity), 0);
                const shipping = 60; 
                const total = subtotal + shipping;

                return (
                  <div style={{ marginBottom: '20px' }}>
                    {/* Subtotal */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', color: 'var(--text-muted)', fontSize: '14px' }}>
                      <span>Subtotal</span>
                      <span>₹{subtotal}</span>
                    </div>

                    {/* Shipping */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '15px', color: 'var(--text-muted)', fontSize: '14px' }}>
                      <span>Shipping</span>
                      <span>₹{shipping}</span>
                    </div>

                    {/* Final Total */}
                    <div style={{ 
                      display: 'flex', justifyContent: 'space-between', 
                      borderTop: '1px solid var(--border)', paddingTop: '15px', 
                      fontSize: '20px', fontWeight: 'bold', color: 'var(--text-main)' 
                    }}>
                      <span>Total</span>
                      <span>₹{total}</span>
                    </div>
                  </div>
                );
              })()}
                
                <form onSubmit={handleCheckout} style={{ display: 'grid', gap: '10px', marginTop: '20px' }}>
                  <input className="input" placeholder="Full Name" required onChange={e => setGuestDetails({ ...guestDetails, name: e.target.value })} />

                  {/* PHONE INPUT: STRICT DIGIT LIMITS */}
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    background: 'var(--bg-card)',
                    border: '1px solid var(--border)',
                    borderRadius: '12px',
                    padding: '0 10px',
                    marginBottom: '10px'
                  }}>
                    {/* Country Code Dropdown */}
                    <select
                      value={selectedCountry}
                      onChange={(e) => {
                        setSelectedCountry(e.target.value);
                        setGuestDetails({ ...guestDetails, phone: '' }); // Clear phone on country change
                      }}
                      style={{
                        border: 'none',
                        background: 'transparent',
                        fontWeight: 'bold',
                        color: 'var(--text-main)',
                        outline: 'none',
                        cursor: 'pointer',
                        padding: '12px 0',
                        fontSize: '14px',
                        maxWidth: '80px',
                        appearance: 'none',        // Modern clear style
                        WebkitAppearance: 'none',
                        MozAppearance: 'none'
                      }}
                    >
                      <option value="+91">🇮🇳 +91</option>
                      <option value="+1">🇺🇸 +1</option>
                      <option value="+44">🇬🇧 +44</option>
                      <option value="+971">🇦🇪 +971</option>
                      <option value="+61">🇦🇺 +61</option>
                      <option value="+86">🇨🇳 +86</option>
                      <option value="+33">🇫🇷 +33</option>
                      <option value="+49">🇩🇪 +49</option>
                      <option value="+81">🇯🇵 +81</option>
                      <option value="+7">🇷🇺 +7</option>
                      <option value="+966">🇸🇦 +966</option>
                      <option value="+65">🇸🇬 +65</option>
                      <option value="+27">🇿🇦 +27</option>
                      <option value="+82">🇰🇷 +82</option>
                      <option value="+34">🇪🇸 +34</option>
                      <option value="+94">🇱🇰 +94</option>
                      <option value="+41">🇨🇭 +41</option>
                      <option value="+66">🇹🇭 +66</option>
                      <option value="+90">🇹🇷 +90</option>
                      <option value="+380">🇺🇦 +380</option>
                      <option value="+93">🇦🇫 +93</option>
                      <option value="+355">🇦🇱 +355</option>
                      <option value="+213">🇩🇿 +213</option>
                      <option value="+54">🇦🇷 +54</option>
                      <option value="+374">🇦🇲 +374</option>
                      <option value="+43">🇦🇹 +43</option>
                      <option value="+973">🇧🇭 +973</option>
                      <option value="+880">🇧🇩 +880</option>
                      <option value="+32">🇧🇪 +32</option>
                      <option value="+975">🇧🇹 +975</option>
                      <option value="+55">🇧🇷 +55</option>
                      <option value="+359">🇧🇬 +359</option>
                      <option value="+855">🇰🇭 +855</option>
                      <option value="+1">🇨🇦 +1</option>
                      <option value="+56">🇨🇱 +56</option>
                      <option value="+57">🇨🇴 +57</option>
                      <option value="+20">🇪🇬 +20</option>
                      <option value="+358">🇫🇮 +358</option>
                      <option value="+30">🇬🇷 +30</option>
                      <option value="+852">🇭🇰 +852</option>
                      <option value="+36">🇭🇺 +36</option>
                      <option value="+354">🇮🇸 +354</option>
                      <option value="+62">🇮🇩 +62</option>
                      <option value="+98">🇮🇷 +98</option>
                      <option value="+964">🇮🇶 +964</option>
                      <option value="+353">🇮🇪 +353</option>
                      <option value="+972">🇮🇱 +972</option>
                      <option value="+39">🇮🇹 +39</option>
                      <option value="+965">🇰🇼 +965</option>
                      <option value="+60">🇲🇾 +60</option>
                      <option value="+960">🇲🇻 +960</option>
                      <option value="+52">🇲🇽 +52</option>
                      <option value="+977">🇳🇵 +977</option>
                      <option value="+31">🇳🇱 +31</option>
                      <option value="+64">🇳🇿 +64</option>
                      <option value="+47">🇳🇴 +47</option>
                      <option value="+968">🇴🇲 +968</option>
                      <option value="+92">🇵🇰 +92</option>
                      <option value="+63">🇵🇭 +63</option>
                      <option value="+48">🇵🇱 +48</option>
                      <option value="+351">🇵🇹 +351</option>
                      <option value="+974">🇶🇦 +974</option>
                      <option value="+46">🇸🇪 +46</option>
                      <option value="+886">🇹🇼 +886</option>
                      <option value="+84">🇻🇳 +84</option>
                    </select>

                    {/* Vertical Divider */}
                    <div style={{ width: '1px', height: '20px', background: 'var(--border)', margin: '0 10px' }}></div>

                    {/* Numeric Input with Strict Validation */}
                    <input
                      type="tel"
                      placeholder="Phone Number"
                      required
                      value={guestDetails.phone}
                      onChange={(e) => {
                        const val = e.target.value.replace(/[^0-9]/g, ''); // Numbers only

                        // --- DIGIT LIMITS FOR EVERY COUNTRY IN YOUR LIST ---
                        const limits = {
                          "+91": 10, "+1": 10, "+44": 10, "+971": 9, "+61": 9, "+86": 11,
                          "+33": 9, "+49": 10, "+81": 10, "+7": 10, "+966": 9, "+65": 8,
                          "+27": 9, "+82": 10, "+34": 9, "+94": 9, "+41": 9, "+66": 9,
                          "+90": 10, "+380": 9, "+93": 9, "+355": 9, "+213": 9, "+54": 10,
                          "+374": 8, "+43": 10, "+973": 8, "+880": 10, "+32": 9, "+975": 8,
                          "+55": 11, "+359": 9, "+855": 9, "+56": 9, "+57": 10, "+20": 10,
                          "+358": 10, "+30": 10, "+852": 8, "+36": 9, "+354": 7, "+62": 12,
                          "+98": 10, "+964": 10, "+353": 9, "+972": 9, "+39": 10, "+965": 8,
                          "+60": 9, "+960": 7, "+52": 10, "+977": 10, "+31": 9, "+64": 9,
                          "+47": 8, "+968": 8, "+92": 10, "+63": 10, "+48": 9, "+351": 9,
                          "+974": 8, "+46": 9, "+886": 9, "+84": 9
                        };

                        // Default to 15 if somehow missed, but above covers your list
                        const limit = limits[selectedCountry] || 15;

                        // Only allow update if within limit
                        if (val.length <= limit) {
                          setGuestDetails({ ...guestDetails, phone: val });
                        }
                      }}
                      style={{
                        border: 'none',
                        outline: 'none',
                        width: '100%',
                        background: 'transparent',
                        color: 'var(--text-main)',
                        fontSize: '14px',
                        padding: '12px 0'
                      }}
                    />
                  </div>


                  <textarea className="input" placeholder="Full Address" required onChange={e => setGuestDetails({ ...guestDetails, address: e.target.value })} />
                   {/* 🟢 NEW: QR Code Section (Always Visible) */}
  <div className="animate" style={{ 
    marginTop: '20px', padding: '20px', borderRadius: '12px', 
    background: 'var(--bg-body)', border: '1px solid var(--border)', textAlign: 'center' 
  }}>
    <p style={{ fontSize: '16px', marginBottom: '15px', fontWeight: 'bold', color: 'var(--accent)' }}>
      Scan to Pay (Prepaid Only)
    </p>
    
    {/* ⚠️ REPLACE THIS LINK WITH YOUR ACTUAL QR CODE IMAGE */}
    <img 
      src="https://raw.githubusercontent.com/JeevanevasRK/Fashion_By_Nira/ec34a83238fb406b9fee30d61e5feeaf0bf1239e/frontend/public/Payment-qr.PNG" 
      alt="Pay via UPI"
      style={{ width: '180px', height: '180px', borderRadius: '10px', marginBottom: '15px', border: '1px solid #ddd' }}
    />

    <div style={{ fontSize: '14px', color: 'var(--text-muted)', marginBottom: '15px', lineHeight: '1.6' }}>
      Total Amount: <b style={{ fontSize: '18px', color: 'var(--text-main)' }}>₹{cart.reduce((a,c)=>a+(c.price*c.quantity),0) + 60}</b><br/>
      <span style={{ fontSize: '12px' }}>Please enter the 12-digit UPI Reference / UTR Number below after payment.</span>
    </div>

    <input 
      className="input" 
      placeholder="Enter 12-digit Transaction ID / UTR" 
      required 
      value={utr}
      onChange={(e) => setUtr(e.target.value)}
      style={{ textAlign: 'center', letterSpacing: '1px', fontWeight: 'bold' }}
    />
  </div>

    {/* 🟢 MODIFIED: Dual Button Actions */}
  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '15px' }}>
    <button type="submit" className="btn btn-primary" style={{ width: '100%' }}>
      Verify & Place Order
    </button>
    
    <div style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: '14px', margin: '5px 0' }}>
      — OR —
    </div>
    
    <button 
      type="button" 
      onClick={handleWhatsAppOrder}
      className="btn" 
      style={{ width: '100%', background: '#25D366', color: '#fff', border: 'none', fontWeight: 'bold' }}
    >
      💬 Confirm through WhatsApp
    </button>
  </div>
                  
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
            {/* Logic: Excludes country code, takes only numbers */}
            <input
              className="input"
              placeholder="Enter Mobile Number (e.g. 9876543210)"
              value={trackPhone}
              onChange={e => setTrackPhone(e.target.value.replace(/[^0-9]/g, ''))}
              required
              style={{ flex: 1 }}
            />
            <button className="btn btn-primary">Search</button>
          </form>

          {trackedOrders && trackedOrders.map(o => (
            <div key={o._id} className="card" style={{ marginBottom: '20px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px', borderBottom: '1px solid var(--border)', paddingBottom: '10px' }}>
                <div>
                  {/* FIXED: Order ID + Date & Time */}
                  <div style={{ marginBottom: '5px' }}>
                    <strong style={{ fontSize: '16px' }}>#{o._id.slice(-6).toUpperCase()}</strong>
                    <span style={{ fontSize: '11px', color: 'var(--text-muted)', marginLeft: '10px' }}>
                      {new Date(o.createdAt).toLocaleString()}
                    </span>
                  </div>
                  <span style={{
                    color: getStatusColor(o.status), fontWeight: 'bold', fontSize: '12px',
                    padding: '2px 8px', background: `${getStatusColor(o.status)}20`, borderRadius: '10px'
                  }}>
                    {o.status}
                  </span>
                </div>
                <button onClick={() => downloadInvoice(o)} className="btn btn-outline" style={{ padding: '5px 10px', fontSize: '10px' }}>Download Invoice</button>
              </div>

              {o.products.map((p, i) => {
                // ROBUST IMAGE CHECK: Handles new array, old string, or missing product
                const safeImage = (p.productId?.images && p.productId.images.length > 0)
                  ? p.productId.images[0]
                  : (p.productId?.image || 'https://via.placeholder.com/150?text=No+Image');

                return (
                  <div key={i} style={{ fontSize: '14px', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '15px', marginTop: '10px' }}>

                    {/* TRACK ORDER FIX: Master Inventory Lookup (Requires 'allProducts' state) */}
                    {(() => {
                      // 1. RESOLVE PRODUCT ID
                      // Handle cases where it's an object, a string, or Mongo $oid
                      const targetId = p.productId?._id || p.productId?.$oid || p.productId;

                      // 2. LOOK UP IN MASTER INVENTORY (The 'Dictionary')
                      // We search 'allProducts' because the order likely only has the ID
                      const masterItem = allProducts.find(prod => prod._id === targetId) || (typeof p.productId === 'object' ? p.productId : {});

                      // 3. EXTRACT IMAGE STRING (Priority: Inventory -> Snapshot -> Fallback)
                      const raw = (masterItem.images && masterItem.images[0]) ||
                        masterItem.image ||
                        p.image ||
                        (p.images && p.images[0]) ||
                        "";

                      // 4. CONSTRUCT URL
                      let src = "";
                      if (raw) {
                        const cleanRaw = raw.toString().trim();
                        if (cleanRaw.toLowerCase().startsWith("http")) {
                          // Cloud Link -> Proxy
                          src = `https://wsrv.nl/?url=${encodeURIComponent(cleanRaw)}&w=100&q=70&output=webp`;
                        } else {
                          // Local Filename -> Prepend Server URL
                          src = `https://fashion-by-nira.onrender.com/${cleanRaw}`;
                        }
                      }

                      // 5. RENDER
                      if (src) {
                        return (
                          <img
                            src={src}
                            style={{
                              width: '50px',
                              height: '50px',
                              objectFit: 'cover',
                              borderRadius: '8px',
                              background: '#eee',
                              border: '1px solid #ccc'
                            }}
                            onError={(e) => {
                              e.target.style.display = 'none';
                              e.target.nextSibling.style.display = 'flex';
                            }}
                            alt="Product"
                          />
                        );
                      } else {
                        return (
                          <div style={{
                            width: '50px', height: '50px', borderRadius: '8px',
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
                      width: '50px', height: '50px', borderRadius: '8px',
                      background: '#ffcdd2', border: '1px solid #e57373',
                      display: 'none', alignItems: 'center', justifyContent: 'center',
                      fontSize: '8px', fontWeight: 'bold', color: '#b71c1c'
                    }}>
                      ERR
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                      <span style={{ fontWeight: '600', color: 'var(--text-main)' }}>
        {p.productId?.title || 'Item'} {p.selectedColor && `(${p.selectedColor})`}
      </span>
                      <span style={{ fontSize: '12px' }}>Qty: {p.quantity}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      )}



      {view === 'contact' && (
        <div style={{ maxWidth: '600px', margin: '0 auto' }} className="animate">
          <h2 style={{ textAlign: 'center', marginBottom: '30px' }}>Contact Us</h2>
          <div className="card" style={{ padding: '30px' }}>
            <p style={{ marginBottom: '15px' }}><strong>📞 Phone:</strong> +91 9003866090</p>
            <p style={{ marginBottom: '15px' }}><strong>📧 Email:</strong> query.fashionbynira@gmail.com</p>
            <p style={{ marginBottom: '25px' }}><strong>📍 Address:</strong> Tiruchengode, Namakkal, Tamil Nadu - 637211</p>

            <div style={{ display: 'grid', gap: '10px' }}>
              <a href="https://instagram.com/fashionby_nira" target="_blank" rel="noreferrer" style={{ textDecoration: 'none' }}>
                <button className="btn btn-outline" style={{ width: '100%', borderColor: '#E1306C', color: '#E1306C' }}>
                  📸 Visit Instagram
                </button>
              </a>
              <a href="https://wa.me/919003866090?text=Hi Nira" target="_blank" rel="noreferrer" style={{ textDecoration: 'none' }}>
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
 
