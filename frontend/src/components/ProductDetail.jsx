import React, { useState, useRef } from 'react'; // FIXED: Lowercase 'import'

const ProductDetail = ({ product, addToCart, decreaseQty, cart, onBack }) => {
  const [isAdded, setIsAdded] = useState(false);
  const scrollRef = useRef(null);
  const [activeImgIndex, setActiveImgIndex] = useState(0);

  // 🟢 NEW: State for Modern Error Message (No Alerts)
  const [stockMessage, setStockMessage] = useState("");

  // FIXED: This check must happen FIRST
  if (!product) return null;

  // Handle new array format or fallback to old string format
  const images = product?.images && product.images.length > 0 ? product.images : [product?.image];

  // Helper to handle adding with Stock Check
  const handleSmartAdd = () => {
    const cartItem = cart ? cart.find(item => item._id === product._id) : null;
    const currentQty = cartItem ? cartItem.quantity : 0;

    // Check Stock Limit
    if (product.stock && currentQty >= product.stock) {
      setStockMessage(`Max limit reached! Only ${product.stock} pcs available.`);
      setTimeout(() => setStockMessage(""), 2500); // Auto-hide
      return;
    }

    setStockMessage("");
    addToCart(product);
  };

  const scrollToImage = (index) => {
    setActiveImgIndex(index);
    if (scrollRef.current) {
      const width = scrollRef.current.offsetWidth;
      scrollRef.current.scrollTo({
        left: width * index,
        behavior: 'smooth'
      });
    }
  };

  return (
    <div className="animate" style={{ maxWidth: '1000px', margin: '0 auto' }}>

      {/* PREMIUM BACK BUTTON */}
      <button
        onClick={onBack}
        onMouseEnter={(e) => {
          e.currentTarget.style.transform = 'translateX(-5px)';
          e.currentTarget.style.boxShadow = '0 5px 15px rgba(0,0,0,0.1)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.transform = 'translateX(0)';
          e.currentTarget.style.boxShadow = '0 2px 5px rgba(0,0,0,0.05)';
        }}
        style={{
          background: 'var(--bg-card)',
          border: '1px solid var(--border)',
          borderRadius: '30px',
          padding: '12px 25px',
          marginBottom: '30px',
          cursor: 'pointer',
          fontSize: '13px',
          fontWeight: '600',
          letterSpacing: '2px',
          textTransform: 'uppercase',
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          color: 'var(--text-main)',
          boxShadow: '0 2px 5px rgba(0,0,0,0.05)',
          transition: 'all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1)',
          width: 'fit-content'
        }}
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <line x1="19" y1="12" x2="5" y2="12"></line>
          <polyline points="12 19 5 12 12 5"></polyline>
        </svg>
        Back to Collection
      </button>

      <div className="card" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '40px', padding: '30px' }}>

        {/* IMAGE GALLERY SECTION */}
        <div>
          {/* Main Image Carousel */}
          <div
            ref={scrollRef}
            className="hide-scrollbar" // FIXED: Moved comment out of the tag structure or ensured newline
            style={{
              display: 'flex',
              overflowX: 'auto',
              scrollSnapType: 'x mandatory',
              background: '#f8f8f8',
              borderRadius: '15px',
              height: '400px',
              position: 'relative',
              marginBottom: '15px',
              scrollbarWidth: 'none',
              msOverflowStyle: 'none'
            }}
          >
            {images.map((img, index) => (
              <div
                key={index}
                style={{
                  minWidth: '100%',
                  height: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  scrollSnapAlign: 'center',
                  position: 'relative'
                }}
              >
                {/* OPTIMIZED MAIN IMAGE (Updated as per previous request) */}
                {/* OPTIMIZED MAIN IMAGE (Faster Loading) */}
                <img
                  // 🟢 FIXED: Reduced size (w=800) and quality (q=75) for faster load, same proxy rule as List
                  src={`https://wsrv.nl/?url=${encodeURIComponent(img)}&w=800&q=75&output=webp`}
                  alt={product.title}
                  loading="lazy"
                  style={{
                    width: '100%',
                    height: '100%',
                    objectFit: 'contain',
                    mixBlendMode: 'normal'
                    // Note: Grayscale removed as per your previous request
                  }}
                />
                {!product.inStock && (
                  <div style={{ position: 'absolute', padding: '10px 20px', background: 'rgba(255,255,255,0.9)', border: '2px solid red', color: 'red', fontWeight: 'bold', transform: 'rotate(-15deg)', fontSize: '24px' }}>
                    SOLD OUT
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Thumbnails */}
          <div style={{ display: 'flex', gap: '10px', overflowX: 'auto', paddingBottom: '5px' }}>
            {images.map((img, index) => (
              <img
                key={index}
                src={`https://wsrv.nl/?url=${encodeURIComponent(img)}&w=150&q=70&output=webp`}
                onClick={() => scrollToImage(index)}
                style={{
                  width: '60px', height: '60px', objectFit: 'cover', borderRadius: '8px', cursor: 'pointer',
                  border: activeImgIndex === index ? '2px solid var(--accent)' : '1px solid #ddd',
                  opacity: activeImgIndex === index ? 1 : 0.6,
                  transition: 'opacity 0.2s'
                }}
              />
            ))}
          </div>
        </div>

        {/* INFO SECTION */}
        <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
          <h1 style={{ fontSize: '32px', marginBottom: '10px' }}>{product.title}</h1>
          <p style={{ fontSize: '24px', fontWeight: 'bold', color: 'var(--accent)', marginBottom: '20px' }}>₹{product.price}</p>

          <div style={{ marginBottom: '30px' }}>
            <h4 style={{ marginBottom: '10px', color: 'var(--text-muted)' }}>Description</h4>
            <p style={{ lineHeight: '1.6', color: 'var(--text-main)' }}>
              {product.description || "No description available for this premium item."}
            </p>
          </div>

          {/* 🟢 SMART CART LOGIC (Aligned & Modern) */}
          {(() => {
            const cartItem = cart ? cart.find(item => item._id === product._id) : null;
            const currentQty = cartItem ? cartItem.quantity : 0;

            if (!product.inStock) {
              return (
                <button disabled className="btn" style={{ width: '100%', padding: '18px', background: '#ccc', color: '#666', cursor: 'not-allowed', border: 'none' }}>
                  Out of Stock
                </button>
              );
            }

            return cartItem ? (
              // 🅰️ IF IN CART: Show Aligned Controls
              <div style={{ marginTop: '20px' }}>
                <div style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  border: stockMessage ? '1px solid var(--danger)' : '2px solid var(--accent)',
                  borderRadius: '50px', // Modern Pill Shape
                  padding: '5px',
                  transition: 'border 0.3s ease'
                }}>
                  {/* DECREASE BUTTON */}
                  <button
                    onClick={() => decreaseQty(product._id)}
                    style={{
                      flex: 1, background: 'none', border: 'none', padding: '12px',
                      cursor: 'pointer', fontSize: '24px', color: 'var(--text-main)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center'
                    }}
                  >−</button>

                  <span style={{ fontSize: '20px', fontWeight: 'bold', color: 'var(--text-main)' }}>{currentQty}</span>

                  {/* INCREASE BUTTON */}
                  <button
                    onClick={handleSmartAdd}
                    style={{
                      flex: 1, background: 'none', border: 'none', padding: '12px',
                      cursor: 'pointer', fontSize: '24px', color: 'var(--text-main)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center'
                    }}
                  >+</button>
                </div>

                {/* 🟢 MODERN ERROR MESSAGE (No Popup) */}
                <div style={{
                  height: '24px', marginTop: '8px', textAlign: 'center',
                  opacity: stockMessage ? 1 : 0, transition: 'opacity 0.3s'
                }}>
                  <span style={{ color: 'var(--danger)', fontSize: '13px', fontWeight: '600' }}>
                    ⚠️ {stockMessage}
                  </span>
                </div>

                <p style={{ textAlign: 'center', fontSize: '14px', color: 'var(--success)' }}>
                  ✓ Item in your bag
                </p>
              </div>
            ) : (
              // 🅱️ IF NOT IN CART: Show Standard Add Button
              <button
                onClick={handleSmartAdd}
                className="btn"
                style={{
                  width: '100%', marginTop: '20px', padding: '18px', fontSize: '16px',
                  background: 'var(--accent)', color: 'var(--accent-text)', cursor: 'pointer', border: 'none'
                }}
              >
                Add to Cart
              </button>
            );
          })()}

          <button
            onClick={onBack}
            style={{
              marginTop: '15px',
              background: 'none',
              border: 'none',
              color: 'var(--text-muted)',
              textDecoration: 'underline',
              cursor: 'pointer',
              fontSize: '14px',
              width: '100%'
            }}
          >
            Back to Listing
          </button>
        </div>

      </div>
    </div>
  );
};

export default ProductDetail;
