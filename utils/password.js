import bcrypt from 'bcryptjs'
import { BCRYPT_ROUNDS } from '../config/constants.js'

export const hashPassword = async (password) => {
  return await bcrypt.hash(password, BCRYPT_ROUNDS)
}

export const comparePassword = async (candidatePassword, hashedPassword) => {
  return await bcrypt.compare(candidatePassword, hashedPassword)
}
