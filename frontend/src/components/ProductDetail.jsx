import React from 'react';

function ProductDetail({ product, addToCart, onBack }) {
  if (!product) return null;

  return (
    <>
      {/* --- STRICT CSS GRID STYLES --- */}
      <style>{`
        /* 1. Main Container */
        .detail-wrapper {
          width: 95%;
          max-width: 1400px;
          margin: 20px auto;
          background: white;
          padding: 30px;
          border-radius: 15px;
          font-family: 'Montserrat', sans-serif;
          box-shadow: 0 4px 20px rgba(0,0,0,0.05);
        }

        .back-btn {
          margin-bottom: 20px;
          background: none;
          border: none;
          font-size: 16px;
          cursor: pointer;
          font-weight: 600;
          color: #555;
        }
        .back-btn:hover { color: black; text-decoration: underline; }

        /* 2. THE GRID LAYOUT (The Fix) */
        .detail-grid {
          display: grid;
          /* FORCE 2 EQUAL COLUMNS on Laptop */
          grid-template-columns: 1fr 1fr; 
          gap: 50px;
          align-items: start;
        }

        /* 3. Image Section */
        .image-section {
          background: #f4f4f4;
          border-radius: 15px;
          padding: 20px;
          display: flex;
          justify-content: center;
          align-items: center;
          height: 100%;
          min-height: 400px; /* Force it to be tall */
        }

        .detail-img {
          width: 100%;
          max-width: 450px;
          object-fit: contain;
          mix-blend-mode: multiply;
        }

        /* 4. Text Section */
        .text-section {
          padding: 20px 0;
          display: flex;
          flex-direction: column;
          justify-content: center;
        }

        .product-title { font-size: 2.5rem; margin-bottom: 10px; line-height: 1.1; font-weight: 800; }
        .product-price { font-size: 2rem; color: #512da8; font-weight: bold; margin-bottom: 25px; }
        .desc-label { font-size: 12px; letter-spacing: 2px; text-transform: uppercase; color: #888; font-weight: bold; }
        .product-desc { font-size: 1.1rem; line-height: 1.6; color: #555; margin-bottom: 30px; }

        .add-cart-btn {
          background: black;
          color: white;
          padding: 15px 40px;
          font-size: 1.2rem;
          border-radius: 50px;
          border: none;
          cursor: pointer;
          width: fit-content;
          transition: 0.2s;
        }
        .add-cart-btn:hover { background: #512da8; transform: scale(1.05); }

        /* 5. MOBILE OVERRIDE (Stack them on phones) */
        @media (max-width: 900px) {
          .detail-grid {
            grid-template-columns: 1fr; /* Force 1 column */
            gap: 30px;
          }
          .image-section { min-height: 300px; }
          .add-cart-btn { width: 100%; }
        }
      `}</style>

      {/* --- HTML CONTENT --- */}
      <div className="detail-wrapper">
        <button onClick={onBack} className="back-btn">← Back to Collection</button>

        <div className="detail-grid">

          {/* Left Column */}
          <div className="image-section">
            <img
              src={product.image || "https://via.placeholder.com/400"}
              alt={product.title}
              className="detail-img"
            />
          </div>

          {/* Right Column */}
          <div className="text-section">
            <h1 className="product-title">{product.title}</h1>
            <p className="product-price">₹{product.price}</p>

            <p className="desc-label">Product Description</p>
            <p className="product-desc">
              {product.description || "Experience premium quality with our latest collection. Designed for comfort and style."}
            </p>

            <button onClick={() => addToCart(product)} className="add-cart-btn">
              Add to Cart
            </button>
          </div>

        </div>
      </div>
    </>
  );
}

export default ProductDetail;