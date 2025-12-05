import React, { useState } from 'react';

const ProductDetail = ({ product, addToCart, onBack }) => {
  const [isAdded, setIsAdded] = useState(false);

  if (!product) return null;

  const handleAddToCart = () => {
    if (!product.inStock) return; // Prevent action if out of stock
    addToCart(product);
    setIsAdded(true);
    setTimeout(() => setIsAdded(false), 2000);
  };

  return (
    <div className="animate" style={{ maxWidth: '1000px', margin: '0 auto' }}>
      <button onClick={onBack} style={{ background: 'none', border: 'none', marginBottom: '20px', cursor: 'pointer', fontSize: '16px', display: 'flex', alignItems: 'center', gap: '5px' }}>
        ← Back
      </button>

      <div className="card" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '40px', padding: '30px' }}>

        {/* IMAGE */}
        <div style={{ background: '#f8f8f8', borderRadius: '15px', display: 'flex', alignItems: 'center', justifyContent: 'center', height: '400px', position: 'relative' }}>
          <img
            src={product.image}
            alt={product.title}
            style={{ width: '100%', height: '100%', objectFit: 'contain', mixBlendMode: 'multiply', filter: product.inStock ? 'none' : 'grayscale(100%)' }}
          />
          {!product.inStock && (
            <div style={{ position: 'absolute', padding: '10px 20px', background: 'rgba(255,255,255,0.9)', border: '2px solid red', color: 'red', fontWeight: 'bold', transform: 'rotate(-15deg)', fontSize: '24px' }}>
              SOLD OUT
            </div>
          )}
        </div>

        {/* INFO */}
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
            disabled={!product.inStock} // Disable button if out of stock
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
        </div>

      </div>
    </div>
  );
};

export default ProductDetail;