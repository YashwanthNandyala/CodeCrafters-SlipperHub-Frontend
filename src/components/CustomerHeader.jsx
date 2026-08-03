import { useNavigate } from 'react-router-dom'
import { FaRegUserCircle, FaShoppingCart } from 'react-icons/fa'

export default function CustomerHeader({ userName, cartCount }) {
  const navigate = useNavigate()

  return (
    <header className="customer-header">
      <div className="customer-brand">
        <img
          src="/ShoesHub_logo.jpg"
          alt="ShoesHub logo"
          className="customer-logo"
        />
        <span className="customer-name">ShoesHub</span>
      </div>

      <div className="customer-actions">
        <span className="customer-user-name">{userName}</span>
        <button type="button" className="icon-button" aria-label="Profile">
          <FaRegUserCircle />
        </button>
        <button
          type="button"
          className="icon-button"
          aria-label="Cart"
          onClick={() => navigate('/cart')}
        >
          <FaShoppingCart />
          <span className="cart-badge">{cartCount}</span>
        </button>
      </div>
    </header>
  )
}
