import productRepository from '../repositories/product.repository.js'
import { ValidationError } from '../utils/errors.js'

class ProductService {
  async getAll(filters = {}) {
    const { enabled } = filters
    const query = enabled === 'true' ? { enabled: true } : {}
    const products = await productRepository.findAll(query)
    
    return products.map(p => {
      const productObj = p.toObject()
      return {
        ...productObj,
        id: p._id.toString(),
        thumbnail: productObj.thumbnail || null,
        carousel: productObj.carousel || []
      }
    })
  }

  async getById(id) {
    const product = await productRepository.findById(id)
    return {
      ...product.toObject(),
      id: product._id.toString()
    }
  }

  async create(productData, files) {
    const { thumbnail, carousel } = files || {}
    
    const thumbnailUrl = thumbnail?.[0] 
      ? `/uploads/products/${thumbnail[0].filename}`
      : productData.thumbnail || null

    const carouselUrls = (carousel || []).map(f => `/uploads/products/${f.filename}`)
    if (productData.carousel) {
      carouselUrls.push(...productData.carousel)
    }

    if (!productData.name) {
      throw new ValidationError('Product name is required')
    }
    if (!productData.price || isNaN(parseFloat(productData.price))) {
      throw new ValidationError('Valid price is required')
    }
    if (!productData.categoryId) {
      throw new ValidationError('Category is required')
    }

    const product = await productRepository.create({
      name: productData.name,
      keywords: productData.keywords || '',
      categoryId: productData.categoryId,
      price: parseFloat(productData.price),
      discount: productData.discount ? parseFloat(productData.discount) : 0,
      originalPrice: productData.originalPrice ? parseFloat(productData.originalPrice) : null,
      inStock: productData.inStock !== undefined ? productData.inStock : true,
      reservationTime: productData.reservationTime || '',
      weight: productData.weight || '',
      details: productData.details || '',
      thumbnail: thumbnailUrl,
      carousel: carouselUrls,
      enabled: productData.enabled !== undefined ? productData.enabled : true
    })

    return {
      ...product.toObject(),
      id: product._id.toString()
    }
  }

  async update(id, updateData, files) {
    if (files?.thumbnail?.[0]) {
      updateData.thumbnail = `/uploads/products/${files.thumbnail[0].filename}`
    }

    if (files?.carousel?.length > 0) {
      const newUrls = files.carousel.map(f => `/uploads/products/${f.filename}`)
      updateData.carousel = [...(updateData.carousel || []), ...newUrls]
    }

    const product = await productRepository.update(id, updateData)
    
    return {
      ...product.toObject(),
      id: product._id.toString()
    }
  }

  async delete(id) {
    await productRepository.delete(id)
    return { id }
  }

  async toggleStatus(id) {
    const product = await productRepository.toggleStatus(id)
    return {
      ...product.toObject(),
      id: product._id.toString()
    }
  }
}

export default new ProductService()
