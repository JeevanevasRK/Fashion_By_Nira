import React, { useEffect, useState } from 'react';
import axios from 'axios';

const AddToCartBtn = ({ product, addToCart }) => {
  const [isAdded, setIsAdded] = useState(false);
  return (
    <button
      onClick={(e) => { e.stopPropagation(); addToCart(product); setIsAdded(true); setTimeout(() => setIsAdded(false), 2000); }}
      className="btn"
      style={{ width: '100%', marginTop: '10px', background: isAdded ? 'var(--success)' : 'var(--accent)', color: 'var(--accent-text)', border: 'none' }}
    >
      {isAdded ? "✓ Added" : "Add to Cart"}
    </button>
  );
};

function ProductList({ addToCart, onProductClick, searchQuery, apiUrl }) {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    axios.get(`${apiUrl}/products`)
      .then(res => { setProducts(res.data); setLoading(false); })
      .catch(err => { console.error(err); setLoading(false); });
  }, []);

  const filtered = products.filter(p => p.title.toLowerCase().includes((searchQuery || "").toLowerCase()));

  if (loading) return <div style={{ textAlign: 'center', padding: '50px' }}>Loading...</div>;

  return (
    <div className="animate" style={{
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', // Fits mobile perfectly
      gap: '15px'
    }}>
      {filtered.map(p => (
        <div key={p._id} className="card" onClick={() => onProductClick(p)} style={{ padding: '10px', cursor: 'pointer' }}>
          <div style={{ height: '200px', background: 'white', borderRadius: '10px', marginBottom: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <img src={p.image} style={{ width: '100%', height: '100%', objectFit: 'contain', mixBlendMode: 'multiply' }}
              onError={(e) => { e.target.src = 'https://via.placeholder.com/200' }} />
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