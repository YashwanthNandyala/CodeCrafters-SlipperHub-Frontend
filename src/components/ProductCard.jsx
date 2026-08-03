import { useState } from 'react'

const priceFormatter = new Intl.NumberFormat('en-IN', {
  style: 'currency',
  currency: 'INR',
})

function formatPrice(price) {
  return priceFormatter.format(price)
}

export default function ProductCard({ product, onAddToCart }) {
  const [adding, setAdding] = useState(false)

  const handleAddToCart = async () => {
    if (adding) return
    setAdding(true)
    try {
      await onAddToCart(product.id)
    } finally {
      setAdding(false)
    }
  }

  return (
    <article className="product-card">
      <div className="product-card-image">
        <img src={product.imageUrl} alt={product.name} loading="lazy" />
      </div>
      <div className="product-card-body">
        <h3 className="product-card-name">{product.name}</h3>
        <p className="product-card-description">{product.description}</p>
        <p className="product-card-price">{formatPrice(product.price)}</p>
        <button
          type="button"
          className="add-to-cart-button"
          onClick={handleAddToCart}
          disabled={adding}
        >
          {adding ? 'Adding...' : 'Add To Cart'}
        </button>
      </div>
    </article>
  )
}
