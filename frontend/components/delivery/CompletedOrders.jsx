import { useState } from 'react'
import OrderCard from './OrderCard'
import styles from '../../styles/delivery.module.css'

export default function CompletedOrders({
  orders,
  getStatusLabel,
  getStatusStyle,
  onOpenOrder,
  onNavigateCustomer,
}) {
  const [open, setOpen] = useState(false)

  return (
    <section className={styles.ordersSection}>
      <button type="button" className={styles.collapseHeader} onClick={() => setOpen((value) => !value)}>
        <div>
          <h2>Completed Today</h2>
          <p>Delivered orders are grouped here for quick review.</p>
        </div>
        <div className={styles.collapseMeta}>
          <span className={styles.sectionCount}>{orders.length}</span>
          <span className={styles.collapseIcon}>{open ? 'Hide' : 'Show'}</span>
        </div>
      </button>

      {open ? (
        orders.length === 0 ? (
          <div className={styles.emptyCard}>No completed deliveries yet.</div>
        ) : (
          <div className={styles.ordersGrid}>
            {orders.map((order) => (
              <OrderCard
                key={order.id}
                order={order}
                statusLabel={getStatusLabel(order.status)}
                statusStyle={getStatusStyle(order.status)}
                actionButtons={[]}
                updating={false}
                onOpen={onOpenOrder}
                onAction={() => {}}
                onNavigate={onNavigateCustomer}
                showAction={false}
              />
            ))}
          </div>
        )
      ) : null}
    </section>
  )
}