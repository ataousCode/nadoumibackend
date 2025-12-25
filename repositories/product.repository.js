import Product from '../models/Product.js'
import { NotFoundError } from '../utils/errors.js'

class ProductRepository {
  async findAll(query = {}) {
    return await Product.find(query).sort({ name: 1 })
  }

  async findById(id) {
    const product = await Product.findById(id)
    if (!product) {
      throw new NotFoundError('Product')
    }
    return product
  }

  async create(productData) {
    const product = new Product(productData)
    await product.save()
    return product
  }

  async update(id, updateData) {
    const product = await this.findById(id)
    Object.assign(product, updateData)
    await product.save()
    return product
  }

  async delete(id) {
    const product = await this.findById(id)
    await Product.findByIdAndDelete(id)
    return product
  }

  async toggleStatus(id) {
    const product = await this.findById(id)
    product.enabled = !product.enabled
    await product.save()
    return product
  }
}

export default new ProductRepository()
