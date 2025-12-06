import React, { useEffect, useState } from 'react';
import axios from 'axios';

// --- PREMIUM FASHION LOADER ---
const FashionLoader = () => (
  <div style={{
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    height: '70vh',
    flexDirection: 'column',
    background: 'transparent'
  }}>
    <style>
      {`
        @keyframes spin-reverse { 0% { transform: rotate(0deg); } 100% { transform: rotate(-360deg); } }
        @keyframes pulse-fade { 0%, 100% { opacity: 0.3; transform: scale(0.9); } 50% { opacity: 1; transform: scale(1); } }
        
        .loader-container { position: relative; width: 80px; height: 80px; }
        
        .ring {
          position: absolute; inset: 0; border-radius: 50%;
          border: 2px solid transparent;
          border-top-color: #1a1a1a; /* Primary Dark Color */
          animation: spin-reverse 1.5s linear infinite;
        }
        .ring::before {
          content: ''; position: absolute; inset: 5px; border-radius: 50%;
          border: 2px solid transparent;
          border-bottom-color: #e0ac69; /* Gold Accent */
          animation: spin-reverse 3s linear infinite reverse;
        }
        .ring::after {
          content: ''; position: absolute; inset: 15px; border-radius: 50%;
          border: 2px solid transparent;
          border-left-color: #1a1a1a;
          animation: spin-reverse 2s ease-in-out infinite;
        }
        
        .brand-text {
          margin-top: 30px;
          font-family: 'Outfit', sans-serif;
          font-weight: 300;
          letter-spacing: 6px;
          text-transform: uppercase;
          font-size: 12px;
          color: #333;
          animation: pulse-fade 2s infinite ease-in-out;
        }
      `}
    </style>

    <div className="loader-container">
      <div className="ring"></div>
    </div>
    <div className="brand-text">Fashion By Nira</div>
  </div>
);

// API BASE URL
const API = "https://fashion-by-nira.onrender.com/api";

const AddToCartBtn = ({ product, addToCart }) => {
  const [isAdded, setIsAdded] = useState(false);

  // NEW: Check if out of stock
  if (!product.inStock) {
    return (
      <button
        className="btn"
        disabled
        style={{ width: '100%', marginTop: '10px', background: '#ccc', color: '#666', border: 'none', cursor: 'not-allowed' }}
      >
        Out of Stock
      </button>
    );
  }

  return (
    <button
      onClick={(e) => { e.stopPropagation(); addToCart(product); setIsAdded(true); setTimeout(() => setIsAdded(false), 2000); }}
      className="btn"
      style={{ width: '100%', marginTop: '10px', background: isAdded ? '#27ae60' : 'black', color: 'white', border: 'none' }}
    >
      {isAdded ? "✓ Added" : "Add to Cart"}
    </button>
  );
};

function ProductList({ addToCart, onProductClick, searchQuery, apiUrl }) {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    axios.get(`${API}/products`)
      .then(res => { setProducts(res.data); setLoading(false); })
      .catch(err => { console.error(err); setLoading(false); });
  }, []);

  const filtered = products.filter(p => p.title.toLowerCase().includes((searchQuery || "").toLowerCase()));

  if (loading) return <FashionLoader />;

  return (
    <div className="animate">
      <div style={{ textAlign: 'center', marginBottom: '30px' }}>
        <h2 style={{ textTransform: 'uppercase', letterSpacing: '1px' }}>New Collection</h2>
      </div>
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))',
        gap: '15px'
      }}>
        {filtered.map(p => (
          <div key={p._id} className="card" onClick={() => onProductClick(p)} style={{ padding: '10px', cursor: 'pointer', opacity: p.inStock ? 1 : 0.7 }}>

            <div style={{ height: '200px', background: '#f8f8f8', borderRadius: '10px', marginBottom: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative', overflow: 'hidden' }}>
              <img src={p.image} style={{ width: '100%', height: '100%', objectFit: 'contain', mixBlendMode: 'multiply', filter: p.inStock ? 'none' : 'grayscale(100%)' }}
                onError={(e) => { e.target.src = 'https://via.placeholder.com/150' }} />

              {/* STOCK OUT OVERLAY */}
              {!p.inStock && (
                <div style={{
                  position: 'absolute', top: 0, left: 0, width: '100%', height: '100%',
                  background: 'rgba(255,255,255,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center'
                }}>
                  <span style={{
                    color: 'red', fontWeight: '900', fontSize: '18px', border: '2px solid red',
                    padding: '5px 10px', transform: 'rotate(-15deg)', textTransform: 'uppercase'
                  }}>
                    Sold Out
                  </span>
                </div>
              )}
            </div>

            <div>
              <h3 style={{ fontSize: '15px', marginBottom: '5px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{p.title}</h3>
              <p style={{ fontSize: '15px', fontWeight: 'bold', color: '#512da8' }}>₹{p.price}</p>
              <AddToCartBtn product={p} addToCart={addToCart} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default ProductList;