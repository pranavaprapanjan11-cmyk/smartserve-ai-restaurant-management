// File: frontend/src/pages/menu/MenuDashboard.tsx
// Premium menu management dashboard

import React, { useState, useEffect, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import MenuCard from '../../components/menu/MenuCard'
import MenuStatsCards from '../../components/menu/MenuStats'
import * as menuService from '../../services/menuService'

const MenuDashboard: React.FC = () => {
  const navigate = useNavigate()
  const { user, token } = useAuth()
  const [menuItems, setMenuItems] = useState<menuService.MenuItem[]>([])
  const [categories, setCategories] = useState<menuService.MenuCategory[]>([])
  const [stats, setStats] = useState<menuService.MenuStats | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<string>('')
  const [isLoading, setIsLoading] = useState(true)
  const [isDeleting, setIsDeleting] = useState<string | null>(null)

  if (!token) return null

  // Fetch data
  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true)
      try {
        const [itemsData, categoriesData, statsData] = await Promise.all([
          menuService.getMenuItems(token),
          menuService.getCategories(token),
          menuService.getMenuStats(token),
        ])
        setMenuItems(itemsData)
        setCategories(categoriesData)
        setStats(statsData)
      } catch (err) {
        console.error('Failed to fetch menu data:', err)
      } finally {
        setIsLoading(false)
      }
    }

    fetchData()
  }, [token])

  // Filter items based on search and category
  const filteredItems = useMemo(() => {
    return menuItems.filter((item) => {
      const matchesSearch =
        !searchQuery ||
        item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.description?.toLowerCase().includes(searchQuery.toLowerCase())
      const matchesCategory = !selectedCategory || item.category_id === selectedCategory
      return matchesSearch && matchesCategory
    })
  }, [menuItems, searchQuery, selectedCategory])

  // Handle delete
  const handleDelete = async (id: string) => {
    setIsDeleting(id)
    try {
      await menuService.deleteMenuItem(id, token)
      setMenuItems(menuItems.filter((item) => item.id !== id))
    } catch (err) {
      console.error('Failed to delete menu item:', err)
    } finally {
      setIsDeleting(null)
    }
  }

  // Handle edit
  const handleEdit = (item: menuService.MenuItem) => {
    navigate(`/menu/edit/${item.id}`, { state: { item } })
  }

  // Handle toggle availability
  const handleToggleAvailability = async (id: string, isAvailable: boolean) => {
    try {
      await menuService.toggleMenuItemAvailability(id, isAvailable, token)
      setMenuItems(
        menuItems.map((item) =>
          item.id === id ? { ...item, is_available: isAvailable } : item
        )
      )
    } catch (err) {
      console.error('Failed to toggle availability:', err)
    }
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      {/* Main Content */}
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8 md:mb-10">
          <div>
            <h1 className="text-3xl md:text-4xl font-extrabold text-white mb-1 tracking-tight">
              Menu Management
            </h1>
            <p className="text-white/60 text-sm">Manage your restaurant's menu items and categories</p>
          </div>
          <button
            onClick={() => navigate('/menu/add')}
            className="px-5 py-2.5 bg-white hover:bg-gray-100 text-[#0F6B4B] rounded-xl text-xs font-extrabold transition-all flex items-center gap-2 whitespace-nowrap shadow-sm border border-white/20"
          >
            <span className="text-base">➕</span>
            Add Item
          </button>
        </div>

        {/* Statistics */}
        <MenuStatsCards stats={stats} isLoading={isLoading} />

        {/* Search and Filters */}
        <div className="mb-8 space-y-4">
          {/* Search Bar */}
          <div className="relative">
            <input
              type="text"
              placeholder="🔍 Search menu items..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full px-5 py-3 bg-white border border-[#E5E7EB] rounded-xl text-[#111827] text-sm placeholder-[#9CA3AF] focus:outline-none focus:ring-2 focus:ring-white/40 transition-all shadow-sm"
            />
          </div>

          {/* Category Filter */}
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setSelectedCategory('')}
              className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${
                selectedCategory === ''
                  ? 'bg-white text-[#0F6B4B] shadow-sm'
                  : 'bg-white/20 text-white hover:bg-white/30 border border-white/20'
              }`}
            >
              All Categories
            </button>
            {categories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-2 ${
                  selectedCategory === cat.id
                    ? 'bg-white text-[#111827] shadow-sm'
                    : 'bg-white/20 text-white hover:bg-white/30 border border-white/20'
                }`}
              >
                <span>{cat.icon_emoji}</span>
                {cat.name}
              </button>
            ))}
          </div>
        </div>

        {/* Menu Items Grid */}
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array(6)
              .fill(0)
              .map((_, i) => (
                <div
                  key={i}
                  className="bg-white/10 rounded-2xl h-96 animate-pulse border border-white/10"
                />
              ))}
          </div>
        ) : filteredItems.length > 0 ? (
          <>
            <div className="text-xs text-white/60 mb-4 font-semibold">
              Showing {filteredItems.length} of {menuItems.length} items
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredItems.map((item) => (
                <MenuCard
                  key={item.id}
                  item={item}
                  onEdit={handleEdit}
                  onDelete={handleDelete}
                  onToggleAvailability={handleToggleAvailability}
                  isLoading={isDeleting === item.id}
                />
              ))}
            </div>
          </>
        ) : (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="text-6xl mb-4">🍽️</div>
            <h3 className="text-2xl font-extrabold text-white mb-2">No Items Found</h3>
            <p className="text-white/60 text-sm mb-6">
              {searchQuery ? 'Try adjusting your search criteria' : 'Start by adding your first menu item'}
            </p>
            <button
              onClick={() => navigate('/menu/add')}
              className="px-6 py-3 bg-white hover:bg-gray-100 text-[#0F6B4B] rounded-lg text-xs font-extrabold transition-all shadow-sm"
            >
              Add First Item
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

export default MenuDashboard
