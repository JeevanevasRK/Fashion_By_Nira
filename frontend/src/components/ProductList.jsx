import React, { useEffect, useState } from 'react';
import axios from 'axios';

// API BASE URL
const API = "https://fashion-by-nira.onrender.com/api";

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

  useEffect(() => {
    // FIX: Updated URL
    axios.get(`${API}/products`)
      .then(res => { setProducts(res.data); setLoading(false); })
      .catch(err => { console.error(err); setLoading(false); });
  }, []);

  const filtered = products.filter(p => p.title.toLowerCase().includes((searchQuery || "").toLowerCase()));

  if (loading) return <div style={{ textAlign: 'center', padding: '50px' }}>Loading...</div>;

  return (
    <div className="animate-up">
      <div style={{ textAlign: 'center', marginBottom: '30px' }}>
        <h2 style={{ textTransform: 'uppercase', letterSpacing: '1px' }}>New Collection</h2>
      </div>
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))',
        gap: '15px'
      }}>
        {filtered.map(p => (
          <div key={p._id} className="card" onClick={() => onProductClick(p)} style={{ padding: '10px', cursor: 'pointer' }}>
            <div style={{ height: '180px', background: '#f4f4f4', borderRadius: '10px', marginBottom: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <img src={p.image} style={{ width: '100%', height: '100%', objectFit: 'contain', mixBlendMode: 'multiply' }}
                onError={(e) => { e.target.src = 'https://via.placeholder.com/150' }} />
            </div>
            <h3 style={{ fontSize: '14px', margin: '0 0 5px' }}>{p.title}</h3>
            <p style={{ fontSize: '14px', fontWeight: 'bold', color: '#512da8' }}>₹{p.price}</p>
            <AddToCartBtn product={p} addToCart={addToCart} />
          </div>
        ))}
      </div>
    </div>
  );
}

export default ProductList;