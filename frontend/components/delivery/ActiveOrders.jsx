import OrderCard from './OrderCard'
import styles from '../../styles/delivery.module.css'

export default function ActiveOrders({
  orders,
  getStatusLabel,
  getStatusStyle,
  getActionButtons,
  updatingOrderId,
  highlightedOrderId,
  onOpenOrder,
  onRunAction,
  onNavigateCustomer,
}) {
  return (
    <section className={styles.ordersSection}>
      <div className={styles.sectionHeader}>
        <div>
          <h2>Active Orders</h2>
          <p>Tap the main action to move each delivery forward.</p>
        </div>
        <span className={styles.sectionCount}>{orders.length}</span>
      </div>

      {orders.length === 0 ? (
        <div className={styles.emptyCard}>
          No active deliveries at the moment. Newly assigned orders will appear here automatically.
        </div>
      ) : (
        <div className={styles.ordersGrid}>
          {orders.map((order) => {
            const actionButtons = getActionButtons(order.status)
            return (
              <OrderCard
                key={order.id}
                order={order}
                statusLabel={getStatusLabel(order.status)}
                statusStyle={getStatusStyle(order.status)}
                actionButtons={actionButtons}
                updating={updatingOrderId === order.id}
                highlight={highlightedOrderId === order.id}
                onOpen={onOpenOrder}
                onAction={onRunAction}
                onNavigate={onNavigateCustomer}
              />
            )
          })}
        </div>
      )}
    </section>
  )
}