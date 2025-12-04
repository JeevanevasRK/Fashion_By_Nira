import React, { useEffect, useState } from 'react';
import axios from 'axios';

// HARDCODED LIVE URL (Safest option)
const LIVE_API = "https://fashion-by-nira.onrender.com/api";

const AddToCartBtn = ({ product, addToCart }) => {
  const [isAdded, setIsAdded] = useState(false);
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

function ProductList({ addToCart, onProductClick, searchQuery }) {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    // Fetch from Live Server
    axios.get(`${LIVE_API}/products`)
      .then(res => {
        setProducts(res.data);
        setLoading(false);
      })
      .catch(err => {
        console.error("Shop Error:", err);
        setError("Connection Failed. Refresh the page.");
        setLoading(false);
      });
  }, []);

  const filtered = products.filter(p => p.title.toLowerCase().includes((searchQuery || "").toLowerCase()));

  if (loading) return <div style={{ textAlign: 'center', padding: '50px', color: '#888' }}>Loading Collection...</div>;

  if (error) return <div style={{ textAlign: 'center', padding: '50px', color: 'red' }}>{error}</div>;

  if (filtered.length === 0) return (
    <div style={{ textAlign: 'center', padding: '60px' }}>
      <h3 style={{ color: '#333' }}>Collection is Empty</h3>
      <p style={{ color: '#888', marginTop: '10px' }}>Admin: Please add products in the Dashboard.</p>
    </div>
  );

  return (
    <div className="animate" style={{
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))',
      gap: '15px',
      width: '100%'
    }}>
      {filtered.map(p => (
        <div key={p._id} className="card" onClick={() => onProductClick(p)} style={{ padding: '10px', cursor: 'pointer' }}>
          <div style={{ height: '200px', background: 'white', borderRadius: '10px', marginBottom: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <img
              src={p.image}
              style={{ width: '100%', height: '100%', objectFit: 'contain', mixBlendMode: 'multiply' }}
              onError={(e) => { e.target.src = 'https://via.placeholder.com/200?text=No+Image' }}
            />
          </div>
          <h3 style={{ fontSize: '15px', marginBottom: '5px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{p.title}</h3>
          <p style={{ fontSize: '15px', fontWeight: 'bold', color: 'var(--accent)' }}>₹{p.price}</p>
          <AddToCartBtn product={p} addToCart={addToCart} />
        </div>
      ))}
    </div>
  );
}

export default ProductList;