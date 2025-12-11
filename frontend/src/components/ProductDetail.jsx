import React, { useState, useRef } from 'react';

const ProductDetail = ({ product, addToCart, onBack }) => {
  const [isAdded, setIsAdded] = useState(false);
  const scrollRef = useRef(null); // Reference for the scroll container

  // Handle new array format or fallback to old string format
  const images = product?.images && product.images.length > 0 ? product.images : [product?.image];
  const [activeImgIndex, setActiveImgIndex] = useState(0);

  if (!product) return null;

  const handleAddToCart = () => {
    if (!product.inStock) return;
    addToCart(product);
    setIsAdded(true);
    setTimeout(() => setIsAdded(false), 2000);
  };

  // Function to scroll to a specific image when thumbnail is clicked
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
      <button 
  onClick={onBack} 
  style={{ 
    background: 'none', 
    border: 'none', 
    marginBottom: '20px', 
    cursor: 'pointer', 
    fontSize: '16px', 
    display: 'flex', 
    alignItems: 'center', 
    gap: '5px',
    color: 'var(--text-main)' /* <--- THIS IS THE FIX */
  }}
>
  ← Back
</button>
      

      <div className="card" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '40px', padding: '30px' }}>

        {/* IMAGE GALLERY SECTION */}
        <div>
          {/* Main Image Carousel (Scrollable) */}
          <div
            ref={scrollRef}
            style={{
              display: 'flex',
              overflowX: 'auto',
              scrollSnapType: 'x mandatory',
              background: '#f8f8f8',
              borderRadius: '15px',
              height: '400px',
              position: 'relative',
              marginBottom: '15px',
              scrollbarWidth: 'none', // Hide scrollbar Firefox
              msOverflowStyle: 'none' // Hide scrollbar IE
            }}
            className="hide-scrollbar" // Add css class if needed for webkit
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
                <img
                  src={img}
                  alt={product.title}
                  style={{ width: '100%', height: '100%', objectFit: 'contain', mixBlendMode: 'multiply', filter: product.inStock ? 'none' : 'grayscale(100%)' }}
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
                src={img}
                onClick={() => scrollToImage(index)}
                style={{
                  width: '60px', height: '60px', objectFit: 'cover', borderRadius: '8px', cursor: 'pointer',
                  border: activeImgIndex === index ? '2px solid var(--accent)' : '1px solid #ddd',
                  opacity: activeImgIndex === index ? 1 : 0.6
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

          <button
            onClick={handleAddToCart}
            disabled={!product.inStock}
            className="btn"
            style={{
              width: '100%',
              padding: '18px',
              fontSize: '16px',
              background: !product.inStock ? '#ccc' : (isAdded ? 'var(--success)' : 'var(--accent)'),
              color: !product.inStock ? '#666' : 'var(--accent-text)',
              cursor: !product.inStock ? 'not-allowed' : 'pointer',
              border: 'none'
            }}
          >
            {!product.inStock ? "Out of Stock" : (isAdded ? "✓ Added to Bag" : "Add to Cart")}
          </button>

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
