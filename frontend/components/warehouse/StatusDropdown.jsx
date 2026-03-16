import { useEffect, useMemo, useState } from 'react'
import styles from '../../styles/warehouse.module.css'

export default function StatusDropdown({
  currentStatus,
  statuses,
  labels,
  disabled,
  loading,
  onChange,
}) {
  const [selectedStatus, setSelectedStatus] = useState('')

  useEffect(() => {
    if (statuses.includes(currentStatus)) {
      setSelectedStatus(currentStatus)
      return
    }
    setSelectedStatus('')
  }, [currentStatus, statuses])

  const options = useMemo(() => {
    const rows = [...statuses]
    if (!statuses.includes(currentStatus) && currentStatus) {
      return [{ value: '', label: labels[currentStatus] || currentStatus }, ...rows.map((status) => ({ value: status, label: labels[status] || status }))]
    }
    return rows.map((status) => ({ value: status, label: labels[status] || status }))
  }, [currentStatus, labels, statuses])

  const handleChange = async (event) => {
    const nextStatus = event.target.value
    setSelectedStatus(nextStatus)
    if (!nextStatus) return
    await onChange(nextStatus)
  }

  return (
    <div className={styles.statusControl}>
      <select
        className={`${styles.selectInput} ${styles.statusSelect}`}
        value={selectedStatus}
        onChange={handleChange}
        disabled={disabled || loading}
      >
        {options.map((option) => (
          <option key={option.value || 'placeholder'} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      {loading ? <span className={styles.statusLoader}>Saving...</span> : null}
    </div>
  )
}