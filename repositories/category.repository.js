import Category from '../models/Category.js'
import { NotFoundError } from '../utils/errors.js'

class CategoryRepository {
  async findAll(query = {}) {
    return await Category.find(query).sort({ name: 1 })
  }

  async findById(id) {
    const category = await Category.findById(id)
    if (!category) {
      throw new NotFoundError('Category')
    }
    return category
  }

  async create(categoryData) {
    const category = new Category(categoryData)
    await category.save()
    return category
  }

  async update(id, updateData) {
    const category = await this.findById(id)
    Object.assign(category, updateData)
    await category.save()
    return category
  }

  async delete(id) {
    const category = await this.findById(id)
    await Category.findByIdAndDelete(id)
    return category
  }

  async toggleStatus(id) {
    const category = await this.findById(id)
    category.enabled = !category.enabled
    await category.save()
    return category
  }
}

export default new CategoryRepository()
