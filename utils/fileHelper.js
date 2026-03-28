import fs from 'fs'
import path from 'path';
import { getUploadPath, getUploadsDir } from './paths.js'
import logger from './logger.js'

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
    logger.error('Failed to delete file', { error: error.message, filePath })
    return false
  }
}

export async function replaceUploadedFile(oldPath, newFilename, uploadDir) {
  // 1. Ensure directory exists
  const targetDir = getUploadPath(uploadDir);
  if (!fs.existsSync(targetDir)) {
    fs.mkdirSync(targetDir, { recursive: true });
  }

  // 2. Delete old file if exists
  if (oldPath) {
    await deleteUploadedFile(oldPath)
  }

  // 3. Move file from temp to final destination
  const tempPath = getUploadPath(path.join('temp', newFilename));
  const finalPath = path.join(targetDir, newFilename);

  if (fs.existsSync(tempPath)) {
    fs.renameSync(tempPath, finalPath);
  }

  return `/uploads/${uploadDir}/${newFilename}`
}

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
