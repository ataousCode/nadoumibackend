/**
 * File Helper Utilities
 * Helper functions for file upload, deletion, and management
 */
import fs from 'fs'
import { getUploadPath } from './paths.js'

/**
 * Safely delete a file from uploads directory
 * @param {string} filePath - File path (e.g., '/uploads/profile-pictures/students/file.jpg')
 * @returns {Promise<boolean>} True if deleted, false otherwise
 */
export async function deleteUploadedFile(filePath) {
  if (!filePath) return false
  
  try {
    // Convert /uploads/... to actual file system path
    const fullPath = filePath.startsWith('/uploads')
      ? getUploadPath(filePath.replace('/uploads/', ''))
      : filePath
    
    // Check if file exists
    if (!fs.existsSync(fullPath)) {
      return false
    }
    
    // Delete file
    fs.unlinkSync(fullPath)
    return true
  } catch (error) {
    console.error('Failed to delete file:', error)
    return false
  }
}

/**
 * Delete old file and return new file path
 * @param {string} oldPath - Old file path to delete
 * @param {string} newFilename - New filename
 * @param {string} uploadDir - Upload directory (e.g., 'profile-pictures/students')
 * @returns {Promise<string>} New file path
 */
export async function replaceUploadedFile(oldPath, newFilename, uploadDir) {
  // Delete old file if exists
  if (oldPath) {
    await deleteUploadedFile(oldPath)
  }
  
  // Return new file path
  return `/uploads/${uploadDir}/${newFilename}`
}

/**
 * Check if file exists in uploads directory
 * @param {string} filePath - File path to check
 * @returns {boolean} True if exists, false otherwise
 */
export function fileExists(filePath) {
  if (!filePath) return false
  
  try {
    const fullPath = filePath.startsWith('/uploads')
      ? getUploadPath(filePath.replace('/uploads/', ''))
      : filePath
    
    return fs.existsSync(fullPath)
  } catch (error) {
    return false
  }
}

/**
 * Get file size in bytes
 * @param {string} filePath - File path
 * @returns {number|null} File size in bytes or null if not found
 */
export function getFileSize(filePath) {
  if (!filePath) return null
  
  try {
    const fullPath = filePath.startsWith('/uploads')
      ? getUploadPath(filePath.replace('/uploads/', ''))
      : filePath
    
    const stats = fs.statSync(fullPath)
    return stats.size
  } catch (error) {
    return null
  }
}

