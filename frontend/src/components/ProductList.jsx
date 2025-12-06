import React, { useEffect, useState } from 'react';
import axios from 'axios';

// --- TEDDY BEAR LOADER COMPONENT ---
const TeddyLoader = () => (
  <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60vh', flexDirection: 'column' }}>
    <style>
      {`
        @keyframes bearBounce { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-10px); } }
        @keyframes bearBlink { 0%, 90%, 100% { transform: scaleY(1); } 95% { transform: scaleY(0.1); } }
        .bear-head {
          width: 100px; height: 90px; background: #e0ac69;
          border-radius: 50% 50% 45% 45%; position: relative;
          box-shadow: 0 5px 15px rgba(0,0,0,0.1);
          animation: bearBounce 1.5s infinite ease-in-out;
        }
        .bear-ear {
          width: 30px; height: 30px; background: #e0ac69;
          border-radius: 50%; position: absolute; top: -5px; z-index: -1;
          border: 3px solid #f4f6f8;
        }
        .ear-left { left: 0; } .ear-right { right: 0; }
        .bear-face {
           position: absolute; top: 35px; left: 0; right: 0; 
           display: flex; justify-content: center; gap: 25px;
        }
        .bear-eye {
          width: 10px; height: 10px; background: #2d2d2d; border-radius: 50%;
          animation: bearBlink 3s infinite;
        }
        .bear-snout {
          position: absolute; top: 45px; left: 50%; transform: translateX(-50%);
          width: 35px; height: 25px; background: #fde2b7; border-radius: 18px;
        }
        .bear-nose {
          width: 12px; height: 8px; background: #2d2d2d; border-radius: 8px;
          margin: 6px auto 0;
        }
        .loading-text {
          margin-top: 25px; font-weight: 800; color: #e0ac69; letter-spacing: 4px; font-size: 14px;
          animation: bearBounce 1.5s infinite ease-in-out 0.1s;
        }
      `}
    </style>
    <div className="bear-head">
      <div className="bear-ear ear-left"></div>
      <div className="bear-ear ear-right"></div>
      <div className="bear-face">
        <div className="bear-eye"></div>
        <div className="bear-eye"></div>
      </div>
      <div className="bear-snout">
        <div className="bear-nose"></div>
      </div>
    </div>
    <div className="loading-text">LOADING...</div>
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

  if (loading) return <TeddyLoader />;

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