export const generateId = (prefix, year = new Date().getFullYear()) => {
  const timestamp = Date.now()
  const sequence = String(timestamp).slice(-6)
  return `${prefix}${year}${sequence}`
}

export const generateApplicationId = () => generateId('NAD')
export const generateUniversityId = () => generateId('UNI')

