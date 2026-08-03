import { useEffect, useRef, useState } from 'react'
import { Navigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'
import { addToCart, fetchCartCount } from '../services/cartService.js'
import { fetchCategories } from '../services/categoryService.js'
import { fetchProducts } from '../services/productService.js'
import ProductCard from '../components/ProductCard.jsx'
import CustomerHeader from '../components/CustomerHeader.jsx'
import { isTokenValid } from '../utils/token.js'

const TOKEN_KEY = 'registration.token'

export default function CustomerHomePage() {
  const { user, token, logout } = useAuth()
  const [categories, setCategories] = useState([])
  const [selectedCategoryId, setSelectedCategoryId] = useState(null)
  const [categoriesLoading, setCategoriesLoading] = useState(true)
  const [categoriesError, setCategoriesError] = useState('')
  const [products, setProducts] = useState([])
  const [productsLoading, setProductsLoading] = useState(true)
  const [productsError, setProductsError] = useState('')
  const [cartCount, setCartCount] = useState(0)
  const [toast, setToast] = useState(null)
  const toastTimer = useRef(null)

  const showToast = (message, isError = false) => {
    if (toastTimer.current) clearTimeout(toastTimer.current)
    setToast({ message, isError })
    toastTimer.current = setTimeout(() => setToast(null), 2500)
  }

  const handleAddToCart = async (productId) => {
    try {
      await addToCart(productId, token)
      const count = await fetchCartCount(token)
      setCartCount(count)
      showToast('Added to Cart')
    } catch (err) {
      if (err.status === 401) {
        logout()
        return
      }
      showToast(err.message || 'Could not add to cart. Please try again.', true)
    }
  }

  useEffect(() => {
    let cancelled = false

    const loadCategories = async () => {
      setCategoriesLoading(true)
      setCategoriesError('')
      try {
        const data = await fetchCategories(token)
        if (!cancelled) setCategories(data)
      } catch (err) {
        if (!cancelled) setCategoriesError(err.message)
      } finally {
        if (!cancelled) setCategoriesLoading(false)
      }
    }

    loadCategories()
    return () => {
      cancelled = true
    }
  }, [token])

  useEffect(() => {
    let cancelled = false

    const loadProducts = async () => {
      setProductsLoading(true)
      setProductsError('')
      try {
        const data = await fetchProducts(token)
        if (!cancelled) setProducts(data)
      } catch (err) {
        if (!cancelled) setProductsError(err.message)
      } finally {
        if (!cancelled) setProductsLoading(false)
      }
    }

    loadProducts()
    return () => {
      cancelled = true
    }
  }, [token])

  useEffect(() => {
    let cancelled = false

    const loadCartCount = async () => {
      try {
        const count = await fetchCartCount(token)
        if (!cancelled) setCartCount(count)
      } catch (err) {
        if (!cancelled && err.status === 401) logout()
      }
    }

    loadCartCount()
    return () => {
      cancelled = true
    }
  }, [token, logout])

  useEffect(() => {
    return () => {
      if (toastTimer.current) clearTimeout(toastTimer.current)
    }
  }, [])

  const tokenValid = isTokenValid(localStorage.getItem(TOKEN_KEY))

  if (!tokenValid) {
    return <Navigate to="/login" replace />
  }

  return (
    <div className="customer-page">
      <CustomerHeader userName={user.fullName} cartCount={cartCount} />

      <main className="customer-content">
        <section className="categories-section" aria-label="Categories">
          <h2 className="section-heading">Categories</h2>

          {categoriesLoading && (
            <p className="section-message">Loading categories...</p>
          )}

          {categoriesError && (
            <p className="section-message error-message" role="alert">
              {categoriesError}
            </p>
          )}

          {!categoriesLoading && !categoriesError && (
            <div className="categories-list">
              {categories.map((category) => (
                <button
                  key={category.id}
                  type="button"
                  className={`category-button${
                    category.id === selectedCategoryId ? ' selected' : ''
                  }`}
                  onClick={() => setSelectedCategoryId(category.id)}
                >
                  {category.name}
                </button>
              ))}
            </div>
          )}
        </section>

        <section className="products-section" aria-label="Products">
          <h2 className="section-heading">Products</h2>

          {productsLoading && (
            <p className="section-message">Loading products...</p>
          )}

          {productsError && (
            <p className="section-message error-message" role="alert">
              {productsError}
            </p>
          )}

          {!productsLoading && !productsError && products.length === 0 && (
            <p className="section-message">No products available.</p>
          )}

          {!productsLoading && !productsError && products.length > 0 && (
            <div className="products-list">
              {products.map((product) => (
                <ProductCard
                  key={product.id}
                  product={product}
                  onAddToCart={handleAddToCart}
                />
              ))}
            </div>
          )}
        </section>
      </main>

      {toast && (
        <div
          className={`cart-toast${toast.isError ? ' error' : ''}`}
          role="status"
        >
          {toast.message}
        </div>
      )}
    </div>
  )
}
