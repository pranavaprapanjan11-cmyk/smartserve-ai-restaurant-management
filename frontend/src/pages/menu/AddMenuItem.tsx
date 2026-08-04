// File: frontend/src/pages/menu/AddMenuItem.tsx
// Premium add menu item form

import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import * as menuService from '../../services/menuService'

const AddMenuItem: React.FC = () => {
  const navigate = useNavigate()
  const { token } = useAuth()

  const [formData, setFormData] = useState({
    category_id: '',
    name: '',
    description: '',
    price: '',
    image_url: '',
    preparation_time: '',
    spice_level: '0',
    dietary_info: '',
    calories: '',
    is_available: true,
    is_bestseller: false,
  })

  const [categories, setCategories] = useState<menuService.MenuCategory[]>([])
  const [errors, setErrors] = useState<{ [key: string]: string }>({})
  const [isLoading, setIsLoading] = useState(false)
  const [isLoadingCategories, setIsLoadingCategories] = useState(true)

  if (!token) return null

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const data = await menuService.getCategories(token)
        setCategories(data)
      } catch (err) {
        console.error('Failed to fetch categories:', err)
      } finally {
        setIsLoadingCategories(false)
      }
    }
    fetchCategories()
  }, [token])

  const validateForm = () => {
    const newErrors: { [key: string]: string } = {}

    if (!formData.category_id) newErrors.category_id = 'Category is required'
    if (!formData.name.trim()) newErrors.name = 'Item name is required'
    if (!formData.price || parseFloat(formData.price) <= 0) newErrors.price = 'Valid price is required'

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validateForm()) return

    setIsLoading(true)
    try {
      const payload: menuService.CreateMenuItemPayload = {
        category_id: formData.category_id,
        name: formData.name.trim(),
        description: formData.description.trim() || undefined,
        price: parseFloat(formData.price),
        image_url: formData.image_url.trim() || undefined,
        preparation_time: formData.preparation_time ? parseInt(formData.preparation_time) : undefined,
        spice_level: parseInt(formData.spice_level),
        dietary_info: formData.dietary_info || undefined,
        calories: formData.calories ? parseInt(formData.calories) : undefined,
        is_available: formData.is_available,
        is_bestseller: formData.is_bestseller,
      }

      await menuService.createMenuItem(payload, token)
      navigate('/menu')
    } catch (err: any) {
      console.error('Failed to create menu item:', err)
      setErrors({ submit: err.response?.data?.message || 'Failed to create menu item' })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <button
            onClick={() => navigate('/menu')}
            className="flex items-center gap-2 text-white/70 hover:text-white transition-colors mb-4 text-sm font-semibold"
          >
            <span>←</span> Back to Menu
          </button>
          <h1 className="text-3xl font-extrabold text-white mb-1 tracking-tight">
            Add Menu Item
          </h1>
          <p className="text-white/60 text-sm">Create a new menu item for your restaurant</p>
        </div>

        {/* Form Card */}
        <div className="bg-white border border-[#E5E7EB] rounded-2xl p-8 shadow-[0_4px_18px_rgba(0,0,0,0.08)]">
          {errors.submit && (
            <div className="mb-6 p-4 bg-red-50 border border-red-300 rounded-lg text-red-800 text-xs font-bold">
              {errors.submit}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Category */}
            <div>
              <label className="block text-xs font-extrabold text-[#111827] uppercase tracking-wide mb-1.5">
                Category *
              </label>
              <select
                value={formData.category_id}
                onChange={(e) => setFormData({ ...formData, category_id: e.target.value })}
                disabled={isLoadingCategories}
                className={`w-full px-3.5 py-2.5 bg-white border rounded-lg text-[#111827] text-xs focus:outline-none focus:ring-2 focus:ring-[#0F6B4B] transition-all ${
                  errors.category_id ? 'border-red-500' : 'border-[#D1D5DB]'
                }`}
              >
                <option value="">Select a category...</option>
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.icon_emoji} {cat.name}
                  </option>
                ))}
              </select>
              {errors.category_id && <p className="text-red-600 text-xs mt-1 font-semibold">{errors.category_id}</p>}
            </div>

            {/* Name */}
            <div>
              <label className="block text-xs font-extrabold text-[#111827] uppercase tracking-wide mb-1.5">
                Item Name *
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g., Chicken Biryani"
                className={`w-full px-3.5 py-2.5 bg-white border rounded-lg text-[#111827] text-xs placeholder-[#9CA3AF] focus:outline-none focus:ring-2 focus:ring-[#0F6B4B] transition-all ${
                  errors.name ? 'border-red-500' : 'border-[#D1D5DB]'
                }`}
              />
              {errors.name && <p className="text-red-600 text-xs mt-1 font-semibold">{errors.name}</p>}
            </div>

            {/* Description */}
            <div>
              <label className="block text-xs font-extrabold text-[#111827] uppercase tracking-wide mb-1.5">
                Description
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Describe your menu item..."
                rows={4}
                className="w-full px-3.5 py-2.5 bg-white border border-[#D1D5DB] rounded-lg text-[#111827] text-xs placeholder-[#9CA3AF] focus:outline-none focus:ring-2 focus:ring-[#0F6B4B] transition-all"
              />
            </div>

            {/* Price */}
            <div>
              <label className="block text-xs font-extrabold text-[#111827] uppercase tracking-wide mb-1.5">
                Price (₹) *
              </label>
              <input
                type="number"
                value={formData.price}
                onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                placeholder="0.00"
                step="0.01"
                min="0"
                className={`w-full px-3.5 py-2.5 bg-white border rounded-lg text-[#111827] text-xs placeholder-[#9CA3AF] focus:outline-none focus:ring-2 focus:ring-[#0F6B4B] transition-all ${
                  errors.price ? 'border-red-500' : 'border-[#D1D5DB]'
                }`}
              />
              {errors.price && <p className="text-red-600 text-xs mt-1 font-semibold">{errors.price}</p>}
            </div>

            {/* Image URL */}
            <div>
              <label className="block text-xs font-extrabold text-[#111827] uppercase tracking-wide mb-1.5">
                Image URL
              </label>
              <input
                type="url"
                value={formData.image_url}
                onChange={(e) => setFormData({ ...formData, image_url: e.target.value })}
                placeholder="https://example.com/image.jpg"
                className="w-full px-3.5 py-2.5 bg-white border border-[#D1D5DB] rounded-lg text-[#111827] text-xs placeholder-[#9CA3AF] focus:outline-none focus:ring-2 focus:ring-[#0F6B4B] transition-all"
              />
            </div>

            {/* Grid: Prep Time & Spice Level */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-extrabold text-[#111827] uppercase tracking-wide mb-1.5">
                  Prep Time (min)
                </label>
                <input
                  type="number"
                  value={formData.preparation_time}
                  onChange={(e) => setFormData({ ...formData, preparation_time: e.target.value })}
                  placeholder="30"
                  min="0"
                  className="w-full px-3.5 py-2.5 bg-white border border-[#D1D5DB] rounded-lg text-[#111827] text-xs placeholder-[#9CA3AF] focus:outline-none focus:ring-2 focus:ring-[#0F6B4B] transition-all"
                />
              </div>
              <div>
                <label className="block text-xs font-extrabold text-[#111827] uppercase tracking-wide mb-1.5">
                  Spice Level
                </label>
                <select
                  value={formData.spice_level}
                  onChange={(e) => setFormData({ ...formData, spice_level: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-white border border-[#D1D5DB] rounded-lg text-[#111827] text-xs focus:outline-none focus:ring-2 focus:ring-[#0F6B4B] transition-all"
                >
                  <option value="0">🟢 None</option>
                  <option value="1">🟡 Mild</option>
                  <option value="2">🟠 Medium</option>
                  <option value="3">🔴 Hot</option>
                  <option value="4">🔥 Extra Hot</option>
                </select>
              </div>
            </div>

            {/* Dietary Info & Calories */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-extrabold text-[#111827] uppercase tracking-wide mb-1.5">
                  Dietary Info
                </label>
                <select
                  value={formData.dietary_info}
                  onChange={(e) => setFormData({ ...formData, dietary_info: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-white border border-[#D1D5DB] rounded-lg text-[#111827] text-xs focus:outline-none focus:ring-2 focus:ring-[#0F6B4B] transition-all"
                >
                  <option value="">None</option>
                  <option value="VEGETARIAN">Vegetarian</option>
                  <option value="VEGAN">Vegan</option>
                  <option value="GLUTEN_FREE">Gluten Free</option>
                  <option value="DAIRY_FREE">Dairy Free</option>
                  <option value="NUT_FREE">Nut Free</option>
                  <option value="HALAL">Halal</option>
                  <option value="KOSHER">Kosher</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-extrabold text-[#111827] uppercase tracking-wide mb-1.5">
                  Calories
                </label>
                <input
                  type="number"
                  value={formData.calories}
                  onChange={(e) => setFormData({ ...formData, calories: e.target.value })}
                  placeholder="0"
                  min="0"
                  className="w-full px-3.5 py-2.5 bg-white border border-[#D1D5DB] rounded-lg text-[#111827] text-xs placeholder-[#9CA3AF] focus:outline-none focus:ring-2 focus:ring-[#0F6B4B] transition-all"
                />
              </div>
            </div>

            {/* Toggles */}
            <div className="space-y-3 p-4 bg-[#F8FAF9] rounded-lg border border-[#E5E7EB]">
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.is_available}
                  onChange={(e) => setFormData({ ...formData, is_available: e.target.checked })}
                  className="w-4 h-4 rounded border-[#D1D5DB] text-[#0F6B4B] focus:ring-[#0F6B4B]"
                />
                <span className="text-[#111827] text-xs font-bold">Available for order</span>
              </label>
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.is_bestseller}
                  onChange={(e) => setFormData({ ...formData, is_bestseller: e.target.checked })}
                  className="w-4 h-4 rounded border-[#D1D5DB] text-[#0F6B4B] focus:ring-[#0F6B4B]"
                />
                <span className="text-[#111827] text-xs font-bold">Mark as bestseller 🔥</span>
              </label>
            </div>

            {/* Submit Buttons */}
            <div className="flex gap-3 pt-4">
              <button
                type="button"
                onClick={() => navigate('/menu')}
                className="flex-1 py-3 px-6 bg-white border border-[#D1D5DB] text-[#4B5563] rounded-lg text-xs font-bold hover:bg-gray-50 transition-all"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isLoading}
                className="flex-1 py-3 px-6 bg-[#0F6B4B] hover:bg-[#0B563D] text-white rounded-lg text-xs font-bold transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
              >
                {isLoading ? 'Creating...' : 'Create Item'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}

export default AddMenuItem
