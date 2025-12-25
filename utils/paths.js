import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

export const getRootDir = () => path.join(__dirname, '../..')
export const getUploadsDir = () => path.join(getRootDir(), 'uploads')
export const getTemplatesDir = () => path.join(getRootDir(), 'templates/email')

export const getUploadPath = (subPath) => path.join(getUploadsDir(), subPath)
export const getTemplatePath = (templateName) => path.join(getTemplatesDir(), `${templateName}.ejs`)

