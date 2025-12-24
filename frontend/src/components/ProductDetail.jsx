import React, { useState, useRef } from 'react'; // FIXED: Lowercase 'import'

const ProductDetail = ({ product, addToCart, decreaseQty, cart, onBack }) => {
  const [isAdded, setIsAdded] = useState(false);
  const scrollRef = useRef(null);
  const [activeImgIndex, setActiveImgIndex] = useState(0);

  // 🟢 NEW: Force scroll to top when page opens
  React.useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

    const [selectedColor, setSelectedColor] = useState(null); // 🟢 NEW
    // 🟢 NEW: State for validation error
  const [error, setError] = useState("");
  
  

  // 🟢 NEW: State for Modern Error Message (No Alerts)
  const [stockMessage, setStockMessage] = useState("");

  // FIXED: This check must happen FIRST
  if (!product) return null;

  // Handle new array format or fallback to old string format
  const images = product?.images && product.images.length > 0 ? product.images : [product?.image];

  // Helper to handle adding with Stock Check
    // 🟢 NEW: Logic to require Color Selection
  const handleSmartAdd = () => {
    // 1. Check if product has colors but none selected
    if (product.colors && product.colors.length > 0 && !selectedColor) {
        setStockMessage("Please select a color");
        setTimeout(() => setStockMessage(""), 2000);
        return;
    }

    // 2. Cart Uniqueness Logic (Product ID + Color)
    const uniqueId = selectedColor ? `${product._id}-${selectedColor}` : product._id;
    
    // 3. Find if this EXACT variation is in cart
    const cartItem = cart ? cart.find(item => 
       item._id === product._id && item.selectedColor === selectedColor
    ) : null;

    const currentQty = cartItem ? cartItem.quantity : 0;
    
    if (product.stock && currentQty >= product.stock) {
        setStockMessage(`Max limit reached! Only ${product.stock} available.`);
        setTimeout(() => setStockMessage(""), 2500);
        return;
    }
    
    setStockMessage(""); 
    // Pass the color to the global adder
    addToCart({ ...product, selectedColor: selectedColor });
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
        onClick={() => {
          window.scrollTo(0, 0); // 🟢 FIXED: Scrolls to top before switching view
          onBack();
        }}
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
                    {/* 🟢 NEW: Price Display with Discount Logic (Large Size) */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
            <span style={{ fontSize: '26px', fontWeight: 'bold', color: 'var(--text-main)' }}>
              ₹{product.price}
            </span>

            {product.originalPrice && product.originalPrice > product.price && (
              <>
                <span style={{ textDecoration: 'line-through', color: '#999', fontSize: '18px' }}>
                  ₹{product.originalPrice}
                </span>
                <span style={{ color: '#ff3f6c', fontWeight: 'bold', fontSize: '18px' }}>
                  ({Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)}% OFF)
                </span>
              </>
            )}
          </div>

                    {/* 🟢 NEW: Color Selector UI */}
          {product.colors && product.colors.length > 0 && (
            <div style={{ marginBottom: '25px' }}>
              <h4 style={{ marginBottom: '10px', color: 'var(--text-muted)', fontSize: '14px' }}>Select Color</h4>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
                {product.colors.map((c, i) => {
                  const isSelected = selectedColor === c.name;
                  const isOut = !c.inStock;
                  
                  return (
                    <button
                      key={i}
                      disabled={isOut}
                      onClick={() => setSelectedColor(c.name)}
                      style={{
                        padding: '10px 20px',
                        borderRadius: '30px',
                        border: isSelected ? '2px solid var(--text-main)' : '1px solid var(--border)',
                        background: isSelected ? 'var(--text-main)' : 'var(--bg-card)',
                        color: isSelected ? 'var(--bg-card)' : (isOut ? '#aaa' : 'var(--text-main)'),
                        cursor: isOut ? 'not-allowed' : 'pointer',
                        position: 'relative',
                        overflow: 'hidden',
                        fontWeight: '600',
                        fontSize: '13px'
                      }}
                    >
                      {c.name}
                      
                      {/* Diagonal Line for Out of Stock */}
                      {isOut && (
                         <div style={{
                           position: 'absolute', top: 0, left: 0, width: '100%', height: '100%',
                           background: 'linear-gradient(to top right, transparent 48%, #999 49%, #999 51%, transparent 52%)'
                         }}></div>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          )}
          
          

          <div style={{ marginBottom: '30px' }}>
            <h4 style={{ marginBottom: '10px', color: 'var(--text-muted)' }}>Description</h4>
            <p style={{ lineHeight: '1.6', color: 'var(--text-main)' }}>
              {product.description || "No description available for this premium item."}
            </p>
          </div>

          {/* 🟢 SMART CART LOGIC (Aligned & Modern) */}
          {(() => {
                        // 🟢 FIXED: Now matches both ID and the specific Color selected
            const cartItem = cart ? cart.find(item => 
              item._id === product._id && (item.selectedColor || null) === (selectedColor || null)
            ) : null;
      
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
                  <button onClick={() => decreaseQty(product._id, selectedColor)}
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
              // 🟢 MODERN ADD TO CART (With Shake & Glass Error)
              <div style={{ marginTop: '20px' }}>
                
                {/* GLASS ERROR MESSAGE (Slides Down) */}
                <div style={{
                  height: error ? 'auto' : '0', opacity: error ? 1 : 0, overflow: 'hidden',
                  transition: 'all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)', marginBottom: error ? '15px' : '0'
                }}>
                  <div style={{
                    background: 'rgba(255, 77, 77, 0.1)', border: '1px solid rgba(255, 77, 77, 0.3)',
                    color: '#ff4d4d', padding: '10px 15px', borderRadius: '12px', fontSize: '13px', fontWeight: '600',
                    display: 'flex', alignItems: 'center', gap: '10px', boxShadow: '0 4px 15px rgba(255, 77, 77, 0.1)'
                  }}>
                    <span>⚠️</span> {error}
                  </div>
                </div>

                <button
                  onClick={() => {
                    // 1. VALIDATION: Check if colors exist but none selected
                    if (product.colors && product.colors.length > 0 && !selectedColor) {
                      setError("Please select a color");
                      setTimeout(() => setError(""), 3000);
                      if (navigator.vibrate) navigator.vibrate(50); // Tactile Feedback
                      return;
                    }
                    // 2. SUCCESS: Call the standard adder
                    setError(""); 
                    addToCart({ ...product, selectedColor });
                  }}
                  className="btn"
                  style={{
                    width: '100%', padding: '18px', fontSize: '16px', borderRadius: '50px',
                    background: error ? '#333' : 'var(--accent)', color: 'var(--accent-text)',
                    cursor: 'pointer', border: 'none', transition: 'all 0.2s ease',
                    animation: error ? 'shake 0.4s cubic-bezier(.36,.07,.19,.97) both' : 'none'
                  }}
                >
                  Add to Cart
                </button>
                
                {/* INJECT ANIMATION STYLES */}
                <style>{`@keyframes shake { 10%, 90% { transform: translate3d(-1px, 0, 0); } 20%, 80% { transform: translate3d(2px, 0, 0); } 30%, 50%, 70% { transform: translate3d(-4px, 0, 0); } 40%, 60% { transform: translate3d(4px, 0, 0); } }`}</style>
              </div>
            );
      
          })()}

          {/* 🟢 MODERN BOTTOM BACK BUTTON */}
          <button
            onClick={() => {
              window.scrollTo(0, 0); // 🟢 FIXED: Scrolls to top immediately
              onBack();
            }}
            style={{
              marginTop: '25px',
              width: '100%',
              padding: '15px',
              background: 'transparent',
              border: '1px solid var(--border)',
              borderRadius: '50px', // Modern Pill Shape
              color: 'var(--text-muted)',
              fontSize: '13px',
              fontWeight: '600',
              textTransform: 'uppercase',
              letterSpacing: '1px',
              cursor: 'pointer',
              transition: 'all 0.3s ease',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = 'var(--text-main)';
              e.currentTarget.style.color = 'var(--text-main)';
              e.currentTarget.style.transform = 'translateY(-2px)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = 'var(--border)';
              e.currentTarget.style.color = 'var(--text-muted)';
              e.currentTarget.style.transform = 'translateY(0)';
            }}
          >
            Back to Collection
          </button>
        </div>

      </div>
    </div>
  );
};

export default ProductDetail;
