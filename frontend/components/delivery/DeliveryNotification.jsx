import styles from '../../styles/delivery.module.css'

export default function DeliveryNotification({ toasts, onDismiss }) {
  return (
    <div className={styles.toastStack}>
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={`${styles.toast} ${
            toast.type === 'error' ? styles.toastErr : toast.type === 'success' ? styles.toastOk : styles.toastInfo
          }`}
        >
          <span>{toast.msg}</span>
          <button
            type="button"
            className={styles.toastClose}
            onClick={() => onDismiss(toast.id)}
          >
            x
          </button>
        </div>
      ))}
    </div>
  )
}
