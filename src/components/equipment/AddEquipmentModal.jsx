import { useState } from 'react'
import { supabase } from '../../lib/supabaseClient'
import { uploadEquipmentImage } from '../../lib/storageService'
import {
  X,
  Upload,
  Image as ImageIcon,
  Loader2,
  AlertCircle,
  PlusCircle,
  CheckCircle2,
} from 'lucide-react'

export const EQUIPMENT_CATEGORIES = [
  { id: 'cameras', label: 'Cameras & Lenses' },
  { id: 'laptops', label: 'Laptops & PCs' },
  { id: 'projectors', label: 'Projectors & Displays' },
  { id: 'electronics', label: 'Electronics & Lab Kits' },
  { id: 'audio', label: 'Audio & Studio Gear' },
  { id: 'sports', label: 'Sports & Outdoor' },
  { id: 'other', label: 'Other Equipment' },
]

export default function AddEquipmentModal({ isOpen, onClose, onSuccess, userId }) {
  const [name, setName] = useState('')
  const [category, setCategory] = useState('cameras')
  const [brand, setBrand] = useState('')
  const [dailyPrice, setDailyPrice] = useState('')
  const [securityDeposit, setSecurityDeposit] = useState('0')
  const [location, setLocation] = useState('')
  const [description, setDescription] = useState('')
  const [imageFile, setImageFile] = useState(null)
  const [imagePreview, setImagePreview] = useState(null)

  const [loading, setLoading] = useState(false)
  const [errorMsg, setErrorMsg] = useState(null)
  const [fieldErrors, setFieldErrors] = useState({})

  if (!isOpen) return null

  const handleImageChange = (e) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (file.size > 5 * 1024 * 1024) {
      setFieldErrors((prev) => ({ ...prev, image: 'File size must be under 5MB.' }))
      return
    }

    setImageFile(file)
    setFieldErrors((prev) => ({ ...prev, image: null }))

    const reader = new FileReader()
    reader.onloadend = () => {
      setImagePreview(reader.result)
    }
    reader.readAsDataURL(file)
  }

  const validate = () => {
    const errors = {}
    if (!name.trim()) errors.name = 'Equipment name is required.'
    if (!category) errors.category = 'Category is required.'
    if (!location.trim()) errors.location = 'Campus or city location is required.'

    const parsedPrice = parseFloat(dailyPrice)
    if (isNaN(parsedPrice) || parsedPrice < 0) {
      errors.dailyPrice = 'Enter a valid daily price (₹0 or greater).'
    }

    const parsedDeposit = parseFloat(securityDeposit)
    if (isNaN(parsedDeposit) || parsedDeposit < 0) {
      errors.securityDeposit = 'Enter a valid security deposit (₹0 or greater).'
    }

    setFieldErrors(errors)
    return Object.keys(errors).length === 0
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setErrorMsg(null)

    if (!validate()) return

    setLoading(true)
    let uploadedImageUrl = null

    try {
      // 1. Upload photo if selected
      if (imageFile) {
        const uploadResult = await uploadEquipmentImage(imageFile, userId)
        uploadedImageUrl = uploadResult.publicUrl
      }

      // 2. Insert record into public.equipment
      const newListing = {
        owner_id: userId,
        name: name.trim(),
        category,
        brand: brand.trim() || null,
        daily_price: parseFloat(dailyPrice),
        security_deposit: parseFloat(securityDeposit) || 0,
        location: location.trim(),
        description: description.trim() || null,
        image_url: uploadedImageUrl,
        availability_status: 'available',
        approval_status: 'pending', // Database strictly enforces 'pending' for non-admins
      }

      const { data, error } = await supabase
        .from('equipment')
        .insert(newListing)
        .select()
        .single()

      if (error) {
        throw error
      }

      // Success
      if (onSuccess) onSuccess(data)
      onClose()
    } catch (err) {
      console.error('[Add Equipment Error]', err)
      setErrorMsg(err.message || 'Failed to list equipment. Please check your connection.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-navy-900/60 backdrop-blur-sm overflow-y-auto">
      <div className="card w-full max-w-2xl bg-white shadow-2xl my-8 overflow-hidden animate-fade-up">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/70">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-sky-100 text-sky-600 flex items-center justify-center font-bold">
              <PlusCircle size={18} />
            </div>
            <div>
              <h2 className="text-base font-bold text-navy-900">List New Equipment</h2>
              <p className="text-xs text-slate-500">Provide accurate details for renters</p>
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={loading}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Error Alert */}
        {errorMsg && (
          <div className="mx-6 mt-4 p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2">
            <AlertCircle size={16} className="text-rose-600 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Equipment Name */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
              Equipment Name / Model *
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Sony Alpha A7 III Full-Frame Camera"
              className={`w-full px-3.5 py-2.5 rounded-lg border text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 ${
                fieldErrors.name
                  ? 'border-rose-300 focus:ring-rose-500 bg-rose-50/20'
                  : 'border-slate-300 focus:border-sky-500 focus:ring-sky-500/20'
              }`}
              disabled={loading}
            />
            {fieldErrors.name && <p className="text-xs text-rose-600 mt-1">{fieldErrors.name}</p>}
          </div>

          {/* Category & Brand */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Category *
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 text-sm text-slate-900 bg-white focus:outline-none focus:ring-2 focus:border-sky-500 focus:ring-sky-500/20"
                disabled={loading}
              >
                {EQUIPMENT_CATEGORIES.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Brand / Manufacturer
              </label>
              <input
                type="text"
                value={brand}
                onChange={(e) => setBrand(e.target.value)}
                placeholder="e.g. Sony, Apple, Canon, Arduino"
                className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:border-sky-500 focus:ring-sky-500/20"
                disabled={loading}
              />
            </div>
          </div>

          {/* Pricing: Daily Rate & Security Deposit */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Daily Rental Price (₹/day) *
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-500 font-bold text-sm">
                  ₹
                </span>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={dailyPrice}
                  onChange={(e) => setDailyPrice(e.target.value)}
                  placeholder="850.00"
                  className={`w-full pl-8 pr-3.5 py-2.5 rounded-lg border text-sm text-slate-900 focus:outline-none focus:ring-2 ${
                    fieldErrors.dailyPrice
                      ? 'border-rose-300 focus:ring-rose-500 bg-rose-50/20'
                      : 'border-slate-300 focus:border-sky-500 focus:ring-sky-500/20'
                  }`}
                  disabled={loading}
                />
              </div>
              {fieldErrors.dailyPrice && (
                <p className="text-xs text-rose-600 mt-1">{fieldErrors.dailyPrice}</p>
              )}
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Security Deposit (₹)
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-500 font-bold text-sm">
                  ₹
                </span>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={securityDeposit}
                  onChange={(e) => setSecurityDeposit(e.target.value)}
                  placeholder="2000.00"
                  className="w-full pl-8 pr-3.5 py-2.5 rounded-lg border border-slate-300 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:border-sky-500 focus:ring-sky-500/20"
                  disabled={loading}
                />
              </div>
              <p className="text-[11px] text-slate-500 mt-1">Refunded to renter after safe return</p>
            </div>
          </div>

          {/* Location */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
              Pickup Location / Campus *
            </label>
            <input
              type="text"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="e.g. North Campus, Delhi or Electronics Dept Lab"
              className={`w-full px-3.5 py-2.5 rounded-lg border text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 ${
                fieldErrors.location
                  ? 'border-rose-300 focus:ring-rose-500 bg-rose-50/20'
                  : 'border-slate-300 focus:border-sky-500 focus:ring-sky-500/20'
              }`}
              disabled={loading}
            />
            {fieldErrors.location && (
              <p className="text-xs text-rose-600 mt-1">{fieldErrors.location}</p>
            )}
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
              Description & Included Accessories
            </label>
            <textarea
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Specify equipment condition, batteries, chargers, lenses, cables, or specific usage requirements..."
              className="w-full px-3.5 py-2 rounded-lg border border-slate-300 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:border-sky-500 focus:ring-sky-500/20"
              disabled={loading}
            />
          </div>

          {/* Image Upload with Preview */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
              Equipment Photo
            </label>
            <div className="flex flex-col sm:flex-row items-center gap-4 p-4 border-2 border-dashed border-slate-200 rounded-xl bg-slate-50/50">
              {imagePreview ? (
                <div className="relative w-24 h-24 rounded-lg overflow-hidden border border-slate-200 shrink-0 bg-slate-100">
                  <img
                    src={imagePreview}
                    alt="Equipment preview"
                    className="w-full h-full object-cover"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      setImageFile(null)
                      setImagePreview(null)
                    }}
                    className="absolute top-1 right-1 p-1 bg-navy-900/80 text-white rounded-full hover:bg-navy-900"
                  >
                    <X size={12} />
                  </button>
                </div>
              ) : (
                <div className="w-24 h-24 rounded-lg border border-slate-200 flex flex-col items-center justify-center text-slate-400 bg-white shrink-0">
                  <ImageIcon size={28} />
                  <span className="text-[10px] mt-1 font-medium">No Image</span>
                </div>
              )}

              <div className="flex-1 text-center sm:text-left">
                <label className="cursor-pointer inline-flex items-center gap-2 btn-secondary text-xs py-2 px-3.5 bg-white">
                  <Upload size={14} />
                  <span>Choose Photo</span>
                  <input
                    type="file"
                    accept="image/jpeg,image/png,image/webp,image/gif"
                    onChange={handleImageChange}
                    className="hidden"
                    disabled={loading}
                  />
                </label>
                <p className="text-[11px] text-slate-500 mt-1.5">
                  JPG, PNG, or WEBP up to 5MB. Stored securely on Supabase Storage.
                </p>
                {fieldErrors.image && (
                  <p className="text-xs text-rose-600 mt-1">{fieldErrors.image}</p>
                )}
              </div>
            </div>
          </div>

          {/* Security & Verification Notice */}
          <div className="p-3 rounded-lg bg-sky-50/70 border border-sky-100 text-sky-900 text-xs flex items-start gap-2">
            <CheckCircle2 size={16} className="text-sky-600 shrink-0 mt-0.5" />
            <span>
              Your listing will be submitted with <strong>Pending Approval</strong> status. An administrator reviews the listing to ensure safety before it appears in public search.
            </span>
          </div>

          {/* Submit Actions */}
          <div className="pt-2 flex items-center justify-end gap-3 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="btn-secondary text-xs py-2.5 px-4"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="btn-primary text-xs py-2.5 px-5 shadow-sm disabled:opacity-60"
            >
              {loading ? (
                <>
                  <Loader2 size={15} className="animate-spin" />
                  <span>Submitting Listing...</span>
                </>
              ) : (
                <>
                  <PlusCircle size={15} />
                  <span>Publish Equipment</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
