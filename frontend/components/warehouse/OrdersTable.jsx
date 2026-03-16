import StatusDropdown from './StatusDropdown'
import styles from '../../styles/warehouse.module.css'

function statusBadgeClass(status) {
  switch (status) {
    case 'placed':
      return styles.badgePlaced
    case 'confirmed':
      return styles.badgeConfirmed
    case 'packed':
      return styles.badgePacked
    case 'ready_for_pickup':
      return styles.badgeReady
    case 'assigned':
      return styles.badgeAssigned
    case 'picked_up':
      return styles.badgePickedUp
    case 'out_for_delivery':
      return styles.badgeTransit
    case 'delivered':
      return styles.badgeDelivered
    case 'cancelled':
      return styles.badgeCancelled
    default:
      return styles.badgeDefault
  }
}

export default function OrdersTable({
  orders,
  partners,
  statusLabels,
  getStatusOptions,
  isPartnerUpdating,
  isStatusUpdating,
  formatDateTime,
  onAssignPartner,
  onStatusChange,
}) {
  return (
    <div className={styles.tableWrap}>
      <table className={styles.ordersTable}>
        <thead>
          <tr>
            <th>Order ID</th>
            <th>Customer</th>
            <th>Items</th>
            <th>Status</th>
            <th>Delivery Partner</th>
            <th>Change Status</th>
          </tr>
        </thead>
        <tbody>
          {orders.length === 0 ? (
            <tr>
              <td colSpan={6} className={styles.emptyCell}>No orders match the current filter</td>
            </tr>
          ) : orders.map((order) => {
            const nextStatuses = getStatusOptions(order.status)
            const partnerDisabled = isPartnerUpdating(order.id) || isStatusUpdating(order.id)
            const statusDisabled = isStatusUpdating(order.id) || isPartnerUpdating(order.id)

            return (
              <tr key={order.id} className={styles.orderRow}>
                <td data-label="Order ID">
                  <div className={styles.orderPrimary}>#{order.id}</div>
                  <div className={styles.orderSecondary}>{formatDateTime(order.createdAt)}</div>
                </td>
                <td data-label="Customer">
                  <div className={styles.orderPrimary}>{order.customerName || '—'}</div>
                  <div className={styles.orderSecondary}>{order.customerPhone || '—'}</div>
                  <div className={styles.orderSecondary}>{[order.city, order.state].filter(Boolean).join(', ') || '—'}</div>
                </td>
                <td data-label="Items">
                  {(order.items || []).length === 0 ? (
                    <span className={styles.orderSecondary}>—</span>
                  ) : (
                    <div className={styles.itemsList}>
                      {(order.items || []).map((item) => (
                        <span key={`${order.id}-${item.productId}-${item.name}`} className={styles.itemsCount}>
                          {item.name} x {item.qty}
                        </span>
                      ))}
                    </div>
                  )}
                </td>
                <td data-label="Status">
                  <span className={`${styles.badge} ${statusBadgeClass(order.status)}`}>
                    {statusLabels[order.status] || order.status}
                  </span>
                </td>
                <td data-label="Delivery Partner">
                  {['cancelled', 'delivered'].includes(order.status) ? (
                    <span className={styles.orderSecondary}>—</span>
                  ) : (
                    <select
                      className={`${styles.selectInput} ${styles.partnerSelect}`}
                      value={order.assignedPartnerId ? String(order.assignedPartnerId) : ''}
                      onChange={(event) => {
                        if (event.target.value) onAssignPartner(order.id, event.target.value)
                      }}
                      disabled={partnerDisabled}
                    >
                      <option value="">
                        {order.assignedPartnerName ? `Current: ${order.assignedPartnerName}` : 'Assign partner'}
                      </option>
                      {partners.map((partner) => (
                        <option key={partner.id} value={partner.id}>
                          {partner.name}
                        </option>
                      ))}
                    </select>
                  )}
                </td>
                <td data-label="Change Status">
                  {nextStatuses.length === 0 ? (
                    <span className={styles.orderSecondary}>No further updates</span>
                  ) : (
                    <StatusDropdown
                      currentStatus={order.status}
                      statuses={nextStatuses}
                      labels={statusLabels}
                      disabled={statusDisabled}
                      loading={isStatusUpdating(order.id)}
                      onChange={(status) => onStatusChange(order.id, status)}
                    />
                  )}
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}