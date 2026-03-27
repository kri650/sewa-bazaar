import { useId } from 'react'
import { Upload } from 'lucide-react'
import styles from '../styles/image-source-field.module.css'

export default function ImageSourceField({
  file,
  imageUrl,
  onFileChange,
  onImageUrlChange,
  error,
  helperText = 'Upload image or paste URL',
  urlPlaceholder = 'https://example.com/product.jpg',
  fieldClassName = '',
  textLabelMode = 'text',
  urlInputClassName = '',
}) {
  const fileInputId = useId()

  const renderLabel = (title, control) => {
    if (textLabelMode === 'span') {
      return (
        <label className={fieldClassName}>
          <span>{title}</span>
          {control}
        </label>
      )
    }

    return (
      <label className={fieldClassName}>
        {title}
        {control}
      </label>
    )
  }

  return (
    <div className={styles.wrapper}>
      <p className={styles.helper}>{helperText}</p>

      {renderLabel(
        'Upload Image',
        <>
          <input
            id={fileInputId}
            type="file"
            accept="image/*"
            className={styles.hiddenInput}
            onChange={(event) => onFileChange(event.target.files?.[0] || null)}
          />
          <label htmlFor={fileInputId} className={styles.uploadBox}>
            <Upload size={18} className={styles.uploadIcon} />
            <span className={styles.uploadText}>
              {file?.name || 'Upload image'}
            </span>
          </label>
        </>
      )}

      <div className={styles.orRow}>
        <span>OR</span>
      </div>

      {renderLabel(
        'Image URL',
        <input
          type="url"
          value={imageUrl}
          onChange={(event) => onImageUrlChange(event.target.value)}
          placeholder={urlPlaceholder}
          className={urlInputClassName}
        />
      )}

      {error ? <p className={styles.error}>{error}</p> : null}
    </div>
  )
}
