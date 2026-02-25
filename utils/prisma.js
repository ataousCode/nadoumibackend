import { Prisma } from '@prisma/client'
import { ConflictError, ValidationError } from './errors.js'

export const handlePrismaError = (error, modelName = 'Record') => {
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    switch (error.code) {
      case 'P2002': {
        const field = error.meta?.target?.[0] || 'field'
        throw new ConflictError(`${field} already exists`)
      }
      case 'P2025': {
        throw new ValidationError(`${modelName} not found or transition not allowed`)
      }
      // Add more cases as needed
    }
  }
  throw error
}

export const isUuid = (id) => {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{11,12}$/i
  return uuidRegex.test(id)
}
