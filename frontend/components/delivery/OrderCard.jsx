import styles from '../../styles/delivery.module.css'

const DELIVERY_STEPS = ['assigned', 'picked_up', 'out_for_delivery', 'delivered']

const STEP_LABELS = {
  assigned: 'Assigned',
  picked_up: 'Picked Up',
  out_for_delivery: 'Out for Delivery',
  delivered: 'Delivered',
}

function normalizeStage(status) {
  const raw = String(status || '')
    .trim()
    .toLowerCase()
    .replace(/[\s-]+/g, '_')

  if (!raw) return 'assigned'

  const canonical = {
    'ready': 'ready_for_pickup',
    'ready_for_pickup': 'ready_for_pickup',
    'accepted': 'assigned',
    'assign': 'assigned',
    'pickedup': 'picked_up',
    'picked_up': 'picked_up',
    'out_for_delivery': 'out_for_delivery',
    'outfordelivery': 'out_for_delivery',
    'delivered': 'delivered',
    'cancelled': 'cancelled',
    'canceled': 'cancelled',
  }[raw] || raw

  if (['placed', 'pending', 'confirmed', 'packed', 'ready_for_pickup', 'assigned'].includes(canonical)) {
    return 'assigned'
  }

  if (!['assigned', 'picked_up', 'out_for_delivery', 'delivered', 'cancelled'].includes(canonical)) {
    return 'assigned'
  }

  return canonical
}

function fullAddress(order) {
  return [order.addressLine1, order.addressLine2, order.city, order.state, order.pincode]
    .filter(Boolean)
    .join(', ') || '—'
}

function paymentLabel(paymentMethod) {
  if (String(paymentMethod || '').toLowerCase() === 'cod') return 'COD'
  return 'Paid'
}

function stepClass(index, currentIndex) {
  if (index < currentIndex) return styles.timelineStepDone
  if (index === currentIndex) return styles.timelineStepCurrent
  return styles.timelineStepUpcoming
}

export default function OrderCard({
  order,
  statusLabel,
  statusStyle,
  actionButtons,
  updating,
  highlight,
  onOpen,
  onAction,
  onNavigate,
  showAction = true,
}) {
  const stage = normalizeStage(order.status)
  const currentStepIndex = Math.max(0, DELIVERY_STEPS.indexOf(stage))

  return (
    <article className={`${styles.orderCard} ${highlight ? styles.orderCardHighlight : ''}`}>
      <div className={styles.orderCardTop}>
        <div>
          <div className={styles.orderCardEyebrow}>Order ID</div>
          <div className={styles.orderCardTitle}>#{order.id}</div>
        </div>
        <span className={styles.orderStatusPill} style={statusStyle}>{statusLabel}</span>
      </div>

      <div className={styles.timelineRow}>
        {DELIVERY_STEPS.map((step, index) => (
          <div key={step} className={`${styles.timelineStep} ${stepClass(index, currentStepIndex)}`}>
            <span className={styles.timelineDot}>{index + 1}</span>
            <span className={styles.timelineLabel}>{STEP_LABELS[step]}</span>
          </div>
        ))}
      </div>

      <div className={styles.orderCardGrid}>
        <div>
          <span className={styles.cardLabel}>Customer</span>
          <strong className={styles.cardValue}>{order.customerName || '—'}</strong>
        </div>
        <div>
          <span className={styles.cardLabel}>Phone Number</span>
          <strong className={styles.cardValue}>{order.customerPhone || '—'}</strong>
        </div>
        <div>
          <span className={styles.cardLabel}>Payment Method</span>
          <strong className={styles.cardValue}>{paymentLabel(order.paymentMethod)}</strong>
        </div>
        <div>
          <span className={styles.cardLabel}>Order Total</span>
          <strong className={styles.cardValue}>Rs. {Number(order.total || 0).toLocaleString('en-IN')}</strong>
        </div>
      </div>

      <div className={styles.addressBlock}>
        <span className={styles.cardLabel}>Delivery Address</span>
        <p>{fullAddress(order)}</p>
      </div>

      <div className={styles.itemsBlock}>
        <span className={styles.cardLabel}>Ordered Items</span>
        <p>{order.orderedItems || 'Items will appear here after assignment sync.'}</p>
      </div>

      <div className={`${styles.cardActions} ${styles.orderCardMapRow} ${styles.orderCardActionRow}`}>
        <button
          type="button"
          className={styles.secondaryActionBtn}
          onClick={() => onNavigate(order)}
        >
          Open in Google Maps
        </button>
      </div>

      {showAction && Array.isArray(actionButtons) && actionButtons.length > 0 ? (
        <div className={`${styles.workflowActions} ${styles.orderCardWorkflowGrid} ${styles.orderCardActionRow}`}>
          {actionButtons.map((button) => (
            <button
              key={button.label}
              type="button"
              className={`${styles.workflowBtn} ${button.primary ? styles.workflowBtnPrimary : styles.workflowBtnSecondary}`}
              onClick={() => onAction(order.id, button.nextStatus)}
              disabled={updating || button.disabled}
            >
              {updating && button.primary ? 'Updating...' : button.label}
            </button>
          ))}
        </div>
      ) : null}

      <div className={`${styles.cardActions} ${styles.orderCardDetailsRow}`}>
        <button type="button" className={styles.detailsBtn} onClick={() => onOpen(order)}>
          View Details
        </button>
      </div>
    </article>
  )
}
