import categoryRepository from '../repositories/category.repository.js'

class CategoryService {
  async getAll(filters = {}) {
    const { enabled } = filters
    const query = enabled === 'true' ? { enabled: true } : {}
    return await categoryRepository.findAll(query)
  }

  async getById(id) {
    return await categoryRepository.findById(id)
  }

  async create(categoryData, iconUrl) {
    return await categoryRepository.create({
      ...categoryData,
      icon: iconUrl,
      enabled: categoryData.enabled ?? true
    })
  }

  async update(id, updateData, iconUrl) {
    if (iconUrl) {
      updateData.icon = iconUrl
    }
    return await categoryRepository.update(id, updateData)
  }

  async delete(id) {
    await categoryRepository.delete(id)
    return { id }
  }

  async toggleStatus(id) {
    return await categoryRepository.toggleStatus(id)
  }
}

export default new CategoryService()
