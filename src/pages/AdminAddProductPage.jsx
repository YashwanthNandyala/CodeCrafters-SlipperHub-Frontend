import { useEffect, useState } from 'react'
import { adminApi } from '../services/adminService.js'
import { useAuth } from '../context/AuthContext.jsx'

const EMPTY_FORM = {
  name: '',
  description: '',
  price: '',
  stock: '',
  categoryId: '',
  imageUrl: '',
}

export default function AdminAddProductPage() {
  const { token } = useAuth()
  const [categories, setCategories] = useState([])
  const [form, setForm] = useState(EMPTY_FORM)
  const [errors, setErrors] = useState({})
  const [serverError, setServerError] = useState('')
  const [success, setSuccess] = useState('')
  const [loading, setLoading] = useState(false)
  const [categoriesLoading, setCategoriesLoading] = useState(true)
  const [newCategory, setNewCategory] = useState('')
  const [addingCategory, setAddingCategory] = useState(false)

  useEffect(() => {
    let cancelled = false

    const loadCategories = async () => {
      setCategoriesLoading(true)
      try {
        const data = await adminApi.getCategories(token)
        if (!cancelled) setCategories(data)
      } catch (err) {
        if (!cancelled) setServerError(err.message)
      } finally {
        if (!cancelled) setCategoriesLoading(false)
      }
    }

    loadCategories()
    return () => {
      cancelled = true
    }
  }, [token])

  const setField = (field, value) => {
    setForm((current) => ({ ...current, [field]: value }))
    setErrors((current) => ({ ...current, [field]: undefined }))
    setServerError('')
    setSuccess('')
  }

  const validate = () => {
    const nextErrors = {}
    if (!form.name.trim()) nextErrors.name = 'Product name is required.'
    const price = Number(form.price)
    if (form.price === '' || Number.isNaN(price) || price <= 0) {
      nextErrors.price = 'Enter a valid price greater than zero.'
    }
    const stock = Number(form.stock)
    if (form.stock === '' || Number.isNaN(stock) || !Number.isInteger(stock) || stock < 0) {
      nextErrors.stock = 'Enter a valid non-negative whole number.'
    }
    if (!form.categoryId) nextErrors.categoryId = 'Select a category.'
    return nextErrors
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setServerError('')
    setSuccess('')

    const nextErrors = validate()
    setErrors(nextErrors)
    if (Object.keys(nextErrors).length > 0) return

    setLoading(true)
    try {
      await adminApi.createProduct(token, {
        name: form.name.trim(),
        description: form.description.trim() || null,
        price: Number(form.price),
        stock: Number(form.stock),
        categoryId: Number(form.categoryId),
        imageUrl: form.imageUrl.trim() || null,
      })
      setSuccess('Product added successfully.')
      setForm(EMPTY_FORM)
    } catch (err) {
      if (err.status === 400 && err.data && typeof err.data.message === 'object') {
        setErrors(err.data.message)
        setServerError('Please correct the highlighted fields.')
      } else {
        setServerError(err.message)
      }
    } finally {
      setLoading(false)
    }
  }

  const handleAddCategory = async (e) => {
    e.preventDefault()
    const name = newCategory.trim()
    if (!name) return
    setAddingCategory(true)
    setServerError('')
    try {
      const created = await adminApi.createCategory(token, name)
      setCategories((current) => [...current, created].sort((a, b) =>
        a.categoryName.localeCompare(b.categoryName),
      ))
      setField('categoryId', String(created.categoryId))
      setNewCategory('')
    } catch (err) {
      setServerError(err.message)
    } finally {
      setAddingCategory(false)
    }
  }

  return (
    <div className="admin-form-page">
      <div className="admin-card">
        <h2 className="admin-card-title">Add Product</h2>
        <p className="section-message">Fill in the details below to add a new product to the store.</p>

        <form className="admin-form" onSubmit={handleSubmit} noValidate>
          <div className="form-field">
            <label htmlFor="product-name">Product Name</label>
            <input
              id="product-name"
              type="text"
              value={form.name}
              onChange={(e) => setField('name', e.target.value)}
              disabled={loading}
              aria-invalid={Boolean(errors.name) || undefined}
              className={errors.name ? 'input-error' : undefined}
            />
            {errors.name && <p className="error-message">{errors.name}</p>}
          </div>

          <div className="form-field">
            <label htmlFor="product-description">Description</label>
            <textarea
              id="product-description"
              rows="4"
              value={form.description}
              onChange={(e) => setField('description', e.target.value)}
              disabled={loading}
              className={errors.description ? 'input-error' : undefined}
            />
            {errors.description && <p className="error-message">{errors.description}</p>}
          </div>

          <div className="admin-form-row">
            <div className="form-field">
              <label htmlFor="product-price">Price (₹)</label>
              <input
                id="product-price"
                type="number"
                min="0.01"
                step="0.01"
                value={form.price}
                onChange={(e) => setField('price', e.target.value)}
                disabled={loading}
                aria-invalid={Boolean(errors.price) || undefined}
                className={errors.price ? 'input-error' : undefined}
              />
              {errors.price && <p className="error-message">{errors.price}</p>}
            </div>

            <div className="form-field">
              <label htmlFor="product-stock">Stock</label>
              <input
                id="product-stock"
                type="number"
                min="0"
                step="1"
                value={form.stock}
                onChange={(e) => setField('stock', e.target.value)}
                disabled={loading}
                aria-invalid={Boolean(errors.stock) || undefined}
                className={errors.stock ? 'input-error' : undefined}
              />
              {errors.stock && <p className="error-message">{errors.stock}</p>}
            </div>
          </div>

          <div className="form-field">
            <label htmlFor="product-category">Category</label>
            <select
              id="product-category"
              value={form.categoryId}
              onChange={(e) => setField('categoryId', e.target.value)}
              disabled={loading || categoriesLoading}
              aria-invalid={Boolean(errors.categoryId) || undefined}
              className={errors.categoryId ? 'input-error' : undefined}
            >
              <option value="">{categoriesLoading ? 'Loading categories...' : 'Select a category'}</option>
              {categories.map((category) => (
                <option key={category.categoryId} value={category.categoryId}>
                  {category.categoryName}
                </option>
              ))}
            </select>
            {errors.categoryId && <p className="error-message">{errors.categoryId}</p>}
          </div>

          <div className="admin-category-row">
            <div className="form-field">
              <label htmlFor="new-category">Add a new category</label>
              <input
                id="new-category"
                type="text"
                value={newCategory}
                onChange={(e) => setNewCategory(e.target.value)}
                disabled={addingCategory}
                placeholder="Category name"
              />
            </div>
            <button
              type="button"
              className="secondary-button"
              onClick={handleAddCategory}
              disabled={addingCategory || !newCategory.trim()}
            >
              {addingCategory ? 'Adding...' : 'Add category'}
            </button>
          </div>

          <div className="form-field">
            <label htmlFor="product-image-url">Image URL (optional)</label>
            <input
              id="product-image-url"
              type="url"
              value={form.imageUrl}
              onChange={(e) => setField('imageUrl', e.target.value)}
              disabled={loading}
              placeholder="https://..."
              className={errors.imageUrl ? 'input-error' : undefined}
            />
            {errors.imageUrl && <p className="error-message">{errors.imageUrl}</p>}
          </div>

          {serverError && (
            <p className="error-message" role="alert">
              {serverError}
            </p>
          )}
          {success && (
            <p className="success-message" role="status">
              {success}
            </p>
          )}

          <button type="submit" className="submit-button" disabled={loading}>
            {loading ? 'Adding product...' : 'Add Product'}
          </button>
        </form>
      </div>
    </div>
  )
}
