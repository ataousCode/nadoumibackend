import mongoose from 'mongoose'

const productSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  keywords: {
    type: String,
    default: ''
  },
  categoryId: {
    type: String,
    required: true
  },
  price: {
    type: Number,
    required: true,
    min: 0
  },
  discount: {
    type: Number,
    default: 0,
    min: 0,
    max: 100
  },
  originalPrice: {
    type: Number,
    default: null,
    min: 0
  },
  inStock: {
    type: Boolean,
    default: true
  },
  reservationTime: {
    type: String,
    default: ''
  },
  weight: {
    type: String,
    default: ''
  },
  details: {
    type: String,
    default: ''
  },
  thumbnail: {
    type: String,
    default: null
  },
  carousel: {
    type: [String],
    default: []
  },
  enabled: {
    type: Boolean,
    default: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
})

// Update updatedAt before saving
productSchema.pre('save', function(next) {
  this.updatedAt = Date.now()
  next()
})

export default mongoose.model('Product', productSchema)

