import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabaseClient'
import { uploadEquipmentImage } from '../../lib/storageService'
import { EQUIPMENT_CATEGORIES } from './AddEquipmentModal'
import {
  X,
  Upload,
  Image as ImageIcon,
  Loader2,
  AlertCircle,
  Save,
} from 'lucide-react'

export default function EditEquipmentModal({ isOpen, onClose, equipment, onSuccess, userId }) {
  const [name, setName] = useState('')
  const [category, setCategory] = useState('cameras')
  const [brand, setBrand] = useState('')
  const [dailyPrice, setDailyPrice] = useState('')
  const [securityDeposit, setSecurityDeposit] = useState('0')
  const [location, setLocation] = useState('')
  const [description, setDescription] = useState('')
  const [availabilityStatus, setAvailabilityStatus] = useState('available')
  const [imageUrl, setImageUrl] = useState('')
  const [imageFile, setImageFile] = useState(null)
  const [imagePreview, setImagePreview] = useState(null)

  const [loading, setLoading] = useState(false)
  const [errorMsg, setErrorMsg] = useState(null)
  const [fieldErrors, setFieldErrors] = useState({})

  useEffect(() => {
    if (equipment) {
      setName(equipment.name || '')
      setCategory(equipment.category || 'cameras')
      setBrand(equipment.brand || '')
      setDailyPrice(equipment.daily_price?.toString() || '0')
      setSecurityDeposit(equipment.security_deposit?.toString() || '0')
      setLocation(equipment.location || '')
      setDescription(equipment.description || '')
      setAvailabilityStatus(equipment.availability_status || 'available')
      setImageUrl(equipment.image_url || '')
      setImagePreview(equipment.image_url || null)
      setImageFile(null)
      setErrorMsg(null)
      setFieldErrors({})
    }
  }, [equipment])

  if (!isOpen || !equipment) return null

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
    if (!location.trim()) errors.location = 'Location is required.'

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
    let finalImageUrl = imageUrl

    try {
      if (imageFile) {
        const uploadResult = await uploadEquipmentImage(imageFile, userId)
        finalImageUrl = uploadResult.publicUrl
      }

      const updates = {
        name: name.trim(),
        category,
        brand: brand.trim() || null,
        daily_price: parseFloat(dailyPrice),
        security_deposit: parseFloat(securityDeposit) || 0,
        location: location.trim(),
        description: description.trim() || null,
        availability_status: availabilityStatus,
        image_url: finalImageUrl,
        updated_at: new Date().toISOString(),
      }

      const { data, error } = await supabase
        .from('equipment')
        .update(updates)
        .eq('id', equipment.id)
        .select()
        .single()

      if (error) {
        throw error
      }

      if (onSuccess) onSuccess(data)
      onClose()
    } catch (err) {
      console.error('[Edit Equipment Error]', err)
      setErrorMsg(err.message || 'Failed to update equipment.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-navy-900/60 backdrop-blur-sm overflow-y-auto">
      <div className="card w-full max-w-2xl bg-white shadow-2xl my-8 overflow-hidden animate-fade-up">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/70">
          <div>
            <h2 className="text-base font-bold text-navy-900">Edit Equipment Details</h2>
            <p className="text-xs text-slate-500">Update pricing, description, or availability</p>
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
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
              Equipment Name *
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:border-sky-500 focus:ring-sky-500/20"
              disabled={loading}
            />
            {fieldErrors.name && <p className="text-xs text-rose-600 mt-1">{fieldErrors.name}</p>}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Category
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 text-sm text-slate-900 bg-white"
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
                Brand
              </label>
              <input
                type="text"
                value={brand}
                onChange={(e) => setBrand(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 text-sm text-slate-900"
                disabled={loading}
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Availability Status
              </label>
              <select
                value={availabilityStatus}
                onChange={(e) => setAvailabilityStatus(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 text-sm text-slate-900 bg-white font-medium"
                disabled={loading}
              >
                <option value="available">Available for Rent</option>
                <option value="rented">Currently Rented</option>
                <option value="maintenance">Under Maintenance</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Daily Price (₹/day) *
              </label>
              <input
                type="number"
                min="0"
                step="0.01"
                value={dailyPrice}
                onChange={(e) => setDailyPrice(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 text-sm text-slate-900"
                disabled={loading}
              />
              {fieldErrors.dailyPrice && (
                <p className="text-xs text-rose-600 mt-1">{fieldErrors.dailyPrice}</p>
              )}
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Security Deposit (₹)
              </label>
              <input
                type="number"
                min="0"
                step="0.01"
                value={securityDeposit}
                onChange={(e) => setSecurityDeposit(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 text-sm text-slate-900"
                disabled={loading}
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
              Location *
            </label>
            <input
              type="text"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 text-sm text-slate-900"
              disabled={loading}
            />
            {fieldErrors.location && (
              <p className="text-xs text-rose-600 mt-1">{fieldErrors.location}</p>
            )}
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
              Description
            </label>
            <textarea
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-3.5 py-2 rounded-lg border border-slate-300 text-sm text-slate-900"
              disabled={loading}
            />
          </div>

          {/* Image */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
              Replace Photo (Optional)
            </label>
            <div className="flex items-center gap-4 p-3 border rounded-xl bg-slate-50/50">
              {imagePreview ? (
                <img
                  src={imagePreview}
                  alt="Current preview"
                  className="w-16 h-16 rounded-lg object-cover border border-slate-200"
                />
              ) : (
                <div className="w-16 h-16 rounded-lg border flex items-center justify-center text-slate-400 bg-white">
                  <ImageIcon size={20} />
                </div>
              )}
              <div>
                <label className="cursor-pointer btn-secondary text-xs py-1.5 px-3 bg-white">
                  <Upload size={13} />
                  <span>Upload New Photo</span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageChange}
                    className="hidden"
                    disabled={loading}
                  />
                </label>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="pt-2 flex items-center justify-end gap-3 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="btn-secondary text-xs py-2 px-4"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="btn-primary text-xs py-2 px-5 shadow-sm disabled:opacity-60"
            >
              {loading ? (
                <>
                  <Loader2 size={14} className="animate-spin" />
                  <span>Saving...</span>
                </>
              ) : (
                <>
                  <Save size={14} />
                  <span>Save Changes</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
