import React, { useEffect, useState } from 'react';
import axios from 'axios';

// --- ANIMATED BUTTON COMPONENT ---
const AddToCartBtn = ({ product, addToCart }) => {
  const [isAdded, setIsAdded] = useState(false);

  const handleClick = (e) => {
    e.stopPropagation();
    if (isAdded) return;

    addToCart(product);
    setIsAdded(true);   // Triggers Green Color

    setTimeout(() => { setIsAdded(false); }, 2000); // Reset after 2s
  };

  return (
    <button className={`add - btn ${isAdded ? 'added' : ''}`} onClick={handleClick} >
      <span className="btn-icon">
        {/* We use emojis for icons to ensure they always show up */}
        {isAdded ? "✔" : "🛒"}
      </span>
      <span className="btn-text">{isAdded ? "Added" : "Add to Cart"}</span>
    </button >
  );
};

// --- MAIN PRODUCT LIST ---
function ProductList({ addToCart, onProductClick }) {
  const [products, setProducts] = useState([]);

  useEffect(() => {
    axios.get('http://localhost:5000/api/products')
      .then(res => setProducts(res.data))
      .catch(err => console.error(err));
  }, []);

  return (
    <div className="shop-container">

      {/* --- ALL STYLES INJECTED HERE (Cannot be ignored) --- */}
      <style>{`
        .shop-container { 
          max-width: 1400px; 
          margin: 0 auto; 
          padding: 20px;
          font-family: 'Montserrat', sans-serif;
        }
        
        .shop-header { text-align: center; margin-bottom: 40px; }
        .shop-header h2 { text-transform: uppercase; letter-spacing: 2px; }

        /* --- LAYOUT FIX: FLEXBOX CENTERING --- */
        .product-grid {
          display: flex;
          flex-wrap: wrap;        /* Allow multiple rows */
          justify-content: center; /* CENTER items horizontally */
          gap: 40px;              /* Space between cards */
        }

        .product-card {
          background: white; 
          border: 1px solid #eee; 
          border-radius: 15px; 
          overflow: hidden;
          transition: transform 0.3s; 
          display: flex; 
          flex-direction: column;
          
          /* FORCE CARD SIZE */
          width: 300px; 
          flex-shrink: 0;
        }
        
        .product-card:hover { 
          transform: translateY(-5px); 
          box-shadow: 0 15px 30px rgba(0,0,0,0.1); 
        }
        
        .image-box {
          height: 300px; 
          background: #f9f9f9; 
          padding: 20px;
          display: flex; 
          justify-content: center; 
          align-items: center; 
          cursor: pointer;
        }
        
        .shop-img { 
          width: 100%; 
          height: 100%; 
          object-fit: contain; 
          mix-blend-mode: multiply; 
        }
        
        .info-box { 
          padding: 20px; 
          text-align: center; 
          display: flex; 
          flex-direction: column; 
          gap: 10px; 
          flex-grow: 1; 
        }
        
        .shop-title { font-weight: 600; font-size: 1.1rem; color: #333; cursor: pointer; }
        .shop-price { color: #512da8; font-weight: bold; font-size: 1.2rem; }

        /* --- ANIMATED BUTTON STYLES --- */
        .add-btn {
          position: relative; 
          background: #111; 
          color: white; 
          border: none; 
          padding: 12px; 
          width: 100%;
          border-radius: 50px; 
          font-weight: 600; 
          text-transform: uppercase; 
          font-size: 0.9rem; 
          cursor: pointer;
          transition: all 0.3s ease; 
          display: flex; 
          align-items: center; 
          justify-content: center; 
          gap: 10px;
        }

        .add-btn:hover { background: #512da8; }

        /* SUCCESS STATE (Green) */
        .add-btn.added { 
          background: #27ae60 !important; /* Force Green */
          pointer-events: none; 
          transform: scale(0.95);
        }

        .btn-icon { font-size: 1.2rem; }
        
        /* Loading Text Animation */
        .add-btn.added .btn-text {
          animation: fadeIn 0.3s;
        }
        
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }

      `}</style>

      <div className="shop-header">
        <h2>Latest Collection</h2>
        <p style={{ color: '#777' }}>Handpicked styles for you</p>
      </div>

      <div className="product-grid">
        {products.map(product => (
          <div key={product._id} className="product-card">
            <div className="image-box" onClick={() => onProductClick(product)}>
              <img src={product.image || "https://via.placeholder.com/300"} alt={product.title} className="shop-img" />
            </div>
            <div className="info-box">
              <div onClick={() => onProductClick(product)}>
                <h3 className="shop-title">{product.title}</h3>
                <p className="shop-price">₹{product.price}</p>
              </div>
              {/* Use Animated Button */}
              <AddToCartBtn product={product} addToCart={addToCart} />
            </div>
          </div>
        ))}
      </div>

      {products.length === 0 && (
        <p style={{ textAlign: 'center', color: '#888', marginTop: '50px' }}>Loading products...</p>
      )}
    </div>
  );
}

export default ProductList;