import { useId } from 'react'
import { Upload } from 'lucide-react'
import styles from '../styles/image-upload.module.css'

/**
 * Reusable image upload component for both Admin and Warehouse forms.
 * Provides file upload or URL input with consistent styling.
 */
export default function ImageUpload({
  file,
  imageUrl,
  onFileChange,
  onImageUrlChange,
  error,
  helperText = 'Upload image or paste URL',
  urlPlaceholder = 'https://example.com/product.jpg',
  variant = 'default',
}) {
  const fileInputId = useId()
  const isWarehouse = variant === 'warehouse'
  const isAdmin = variant === 'admin'

  const uploadBoxClass = isWarehouse
    ? `${styles.uploadBox} ${styles.uploadBoxWarehouse}`
    : (isAdmin ? `${styles.uploadBox} ${styles.uploadBoxAdmin}` : styles.uploadBox)

  const uploadIconClass = isWarehouse
    ? `${styles.uploadIcon} ${styles.uploadIconWarehouse}`
    : (isAdmin ? `${styles.uploadIcon} ${styles.uploadIconAdmin}` : styles.uploadIcon)

  const uploadTextClass = isWarehouse
    ? `${styles.uploadText} ${styles.uploadTextWarehouse}`
    : (isAdmin ? `${styles.uploadText} ${styles.uploadTextAdmin}` : styles.uploadText)

  const urlInputClass = isWarehouse
    ? `${styles.urlInput} ${styles.urlInputWarehouse}`
    : (isAdmin ? `${styles.urlInput} ${styles.urlInputAdmin}` : styles.urlInput)

  return (
    <div className={styles.wrapper}>
      {helperText && <p className={styles.helperText}>{helperText}</p>}

      {/* Upload Box */}
      <label htmlFor={fileInputId} className={uploadBoxClass}>
        <input
          id={fileInputId}
          type="file"
          accept="image/*"
          className={styles.hiddenInput}
          onChange={(event) => onFileChange(event.target.files?.[0] || null)}
        />
        <Upload size={18} className={uploadIconClass} />
        <span className={uploadTextClass}>
          {file?.name || 'Upload image'}
        </span>
      </label>

      {/* OR Divider */}
      <div className={styles.orDivider}>
        <span>OR</span>
      </div>

      {/* URL Input */}
      <input
        type="url"
        value={imageUrl}
        onChange={(event) => onImageUrlChange(event.target.value)}
        placeholder={urlPlaceholder}
        className={urlInputClass}
      />

      {/* Error Message */}
      {error && <p className={styles.error}>{error}</p>}
    </div>
  )
}
