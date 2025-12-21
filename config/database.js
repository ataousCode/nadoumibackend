import mongoose from 'mongoose'

/**
 * Database connection configuration
 * Handles MongoDB connection with proper error handling and reconnection logic
 */
class Database {
  constructor() {
    this.connection = null
  }

  async connect(uri) {
    try {
      const options = {
        maxPoolSize: 10,
        serverSelectionTimeoutMS: 5000,
        socketTimeoutMS: 45000,
      }

      this.connection = await mongoose.connect(uri, options)
      
      console.log('✅ Connected to MongoDB')
      
      // Handle connection events
      mongoose.connection.on('error', (err) => {
        console.error('❌ MongoDB connection error:', err)
      })

      mongoose.connection.on('disconnected', () => {
        console.warn('⚠️  MongoDB disconnected')
      })

      mongoose.connection.on('reconnected', () => {
        console.log('✅ MongoDB reconnected')
      })

      return this.connection
    } catch (error) {
      console.error('❌ MongoDB connection error:', error)
      throw error
    }
  }

  async disconnect() {
    if (this.connection) {
      await mongoose.disconnect()
      console.log('✅ MongoDB disconnected')
    }
  }
}

export default new Database()

