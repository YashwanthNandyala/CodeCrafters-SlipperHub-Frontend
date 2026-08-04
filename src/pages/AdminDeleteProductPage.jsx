import { useEffect, useState } from 'react'
import { FaTrashAlt } from 'react-icons/fa'
import { adminApi } from '../services/adminService.js'
import { useAuth } from '../context/AuthContext.jsx'
import ConfirmDialog from '../components/ConfirmDialog.jsx'
import { formatINR } from '../utils/format.js'

export default function AdminDeleteProductPage() {
  const { token } = useAuth()
  const [products, setProducts] = useState([])
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [pendingDelete, setPendingDelete] = useState(null)
  const [deleting, setDeleting] = useState(false)
  const [reloadKey, setReloadKey] = useState(0)

  useEffect(() => {
    let cancelled = false

    const load = async () => {
      setLoading(true)
      setError('')
      try {
        const [productData, categoryData] = await Promise.all([
          adminApi.getProducts(token),
          adminApi.getCategories(token),
        ])
        if (!cancelled) {
          setProducts(productData)
          setCategories(categoryData)
        }
      } catch (err) {
        if (!cancelled) setError(err.message)
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    load()
    return () => {
      cancelled = true
    }
  }, [token, reloadKey])

  const retry = () => setReloadKey((key) => key + 1)

  const categoryName = (product) => {
    const match = categories.find((category) => category.categoryId === product.categoryId)
    return match ? match.categoryName : '—'
  }

  const confirmDelete = async () => {
    if (!pendingDelete) return
    setDeleting(true)
    setError('')
    setSuccess('')
    try {
      await adminApi.deleteProduct(token, pendingDelete.productId)
      setProducts((current) => current.filter((item) => item.productId !== pendingDelete.productId))
      setSuccess(`"${pendingDelete.name}" was deleted.`)
      setPendingDelete(null)
    } catch (err) {
      setError(err.message)
      setPendingDelete(null)
    } finally {
      setDeleting(false)
    }
  }

  if (loading && products.length === 0) {
    return <p className="admin-loading">Loading products...</p>
  }

  return (
    <div className="admin-form-page">
      <div className="admin-card">
        <h2 className="admin-card-title">Delete Product</h2>
        <p className="section-message">
          Products that are part of existing orders cannot be removed.
        </p>

        {error && (
          <p className="error-message" role="alert">
            {error}
          </p>
        )}
        {success && (
          <p className="success-message" role="status">
            {success}
          </p>
        )}

        {!loading && products.length === 0 && !error && (
          <p className="section-message">No products to show.</p>
        )}

        {products.length > 0 && (
          <div className="admin-table-wrap">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Product</th>
                  <th>Category</th>
                  <th>Price</th>
                  <th>Stock</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {products.map((product) => (
                  <tr key={product.productId}>
                    <td>
                      <div className="admin-product-cell">
                        {product.imageUrl ? (
                          <img
                            src={product.imageUrl}
                            alt={product.name}
                            className="admin-product-thumb"
                          />
                        ) : (
                          <span className="admin-product-thumb placeholder">No image</span>
                        )}
                        <div className="admin-product-info">
                          <span className="admin-product-name">{product.name}</span>
                          <span className="admin-product-desc">{product.description}</span>
                        </div>
                      </div>
                    </td>
                    <td>{categoryName(product)}</td>
                    <td className="admin-table-strong">{formatINR(product.price)}</td>
                    <td>{product.stock}</td>
                    <td>
                      <button
                        type="button"
                        className="danger-button"
                        onClick={() => setPendingDelete(product)}
                        aria-label={`Delete ${product.name}`}
                      >
                        <FaTrashAlt />
                        <span>Delete</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {error && products.length > 0 && (
          <div className="admin-retry">
            <p className="error-message" role="alert">
              {error}
            </p>
            <button type="button" className="secondary-button" onClick={retry}>
              Try again
            </button>
          </div>
        )}
      </div>

      <ConfirmDialog
        open={Boolean(pendingDelete)}
        title="Delete product?"
        message={
          pendingDelete
            ? `"${pendingDelete.name}" will be permanently removed from the store. This cannot be undone.`
            : ''
        }
        confirmLabel="Delete"
        loading={deleting}
        onConfirm={confirmDelete}
        onCancel={() => setPendingDelete(null)}
      />
    </div>
  )
}
