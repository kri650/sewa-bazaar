'use client'
import { useEffect, useState } from 'react'
import { io } from 'socket.io-client'
import { useRouter } from 'next/router'
import Link from 'next/link'
import ShopLayout from '../../components/ShopLayout'
import { resolveProductImage } from '../../lib/productImage'
import { useCart } from '../../contexts/CartContext'

const API = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:5000'
const TOKEN_KEY = 'sbUserToken'

function formatDateShort(value) {
  if (!value) return ''
  const d = new Date(value)
  if (Number.isNaN(d.getTime())) return ''
  return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
}
function titleCase(value) {
  return String(value || '')
    .replace(/_/g, ' ')
    .toLowerCase()
    .replace(/\b\w/g, (c) => c.toUpperCase())
}
function normalizeStatus(status) {
  if (status === 'accepted') return 'packed'
  if (status === 'placed') return 'pending'
  if (status === 'ready_for_pickup') return 'ready_for_pickup'
  if (status === 'assigned') return 'assigned'
  return status
}

function StatusBadge({ status }) {
  const palette = {
  pending:          { bg: '#fff8e1', color: '#b45309' },
  confirmed:        { bg: '#e8f5e9', color: '#2e7d32' },
  packed:           { bg: '#e0f2fe', color: '#0f5b8a' },
  ready_for_pickup: { bg: '#fef9c3', color: '#854d0e' },
  assigned:         { bg: '#f3e8ff', color: '#6b21a8' },
  picked_up:        { bg: '#dbeafe', color: '#1d4ed8' },
  out_for_delivery: { bg: '#ede9fe', color: '#5b21b6' },
  delivered:        { bg: '#e3f2fd', color: '#1565c0' },
  cancelled:        { bg: '#fce4ec', color: '#c62828' },
  }
  const normalized = normalizeStatus(status)
  const s = palette[normalized] || { bg: '#f3f4f6', color: '#555' }
  return (
    <span style={{
      background: s.bg, color: s.color,
      padding: '3px 10px', borderRadius: 20,
      fontSize: 12, fontWeight: 600, textTransform: 'capitalize',
    }}>
      {titleCase(normalized || 'pending')}
    </span>
  )
}

export default function OrderDetailsPage() {
  const router = useRouter()
  const { addToCart } = useCart()
  const [order, setOrder] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    const fetchOrder = async () => {
      const id = router.query.id
      if (!id) return
      try {
        const token = typeof window !== 'undefined' ? localStorage.getItem(TOKEN_KEY) || '' : ''
        const res = await fetch(`${API}/api/user/orders`, {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        })

        // Try to parse JSON safely. If server returned HTML (e.g. 404 page)
        // res.json() will throw on non-JSON; handle that and produce a useful message.
        let data
        try {
          data = await res.json()
        } catch (parseErr) {
          const text = await res.text()
          const snippet = (text || '').slice(0, 200)
          throw new Error(res.ok ? `Invalid JSON response from server: ${snippet}` : `Server error: ${res.status} ${res.statusText}`)
        }

        if (!res.ok) throw new Error(data.error || 'Failed to load order')

        // backend returns an array of orders for GET /api/user/orders
        const found = Array.isArray(data) ? data.find(o => String(o.orderId) === String(id) || String(o.id) === String(id)) : data
        if (!found) throw new Error('Order not found')
        setOrder(found)
      } catch (err) {
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }
    fetchOrder()
  }, [router.query.id])

  // Real-time updates for the currently open order
  useEffect(() => {
    const id = router.query.id
    if (!id) return undefined
    const token = typeof window !== 'undefined' ? localStorage.getItem(TOKEN_KEY) || '' : ''
    if (!token) return undefined

    const socket = io(API, {
      path: '/socket.io',
      transports: ['websocket'],
      auth: { token },
    })

    const playBeep = () => {
      try {
        const ctx = new (window.AudioContext || window.webkitAudioContext)()
        const o = ctx.createOscillator()
        const g = ctx.createGain()
        o.type = 'sine'
        o.frequency.value = 800
        o.connect(g)
        g.connect(ctx.destination)
        g.gain.value = 0.05
        o.start()
        setTimeout(() => { o.stop(); ctx.close?.() }, 120)
      } catch (_e) {
        // ignore audio errors
      }
    }

    socket.on('ORDER_STATUS_UPDATE', (payload) => {
      if (!payload) return
      const payloadOrderId = String(payload.orderId || payload.id || payload.order_id)
      if (!payloadOrderId) return
      if (String(id) !== payloadOrderId && String(order?.orderId || order?.id) !== payloadOrderId) return

      // update local order object with new status and append event
      setOrder((current) => {
        if (!current) return current
        const nextEvents = (current.events || []).slice()
        const ev = {
          status: payload.status,
          notes: payload.notes || payload.note || '',
          createdAt: payload.updatedAt || payload.createdAt || new Date().toISOString(),
        }
        // avoid duplicate consecutive events
        const last = nextEvents[nextEvents.length - 1]
        if (!last || last.status !== ev.status || last.createdAt !== ev.createdAt) nextEvents.push(ev)

        return { ...current, status: payload.status, events: nextEvents }
      })

      playBeep()
    })

    return () => {
      socket.disconnect()
    }
  }, [router.query.id, order])

  const handleReorder = () => {
    if (!order?.items) return
    order.items.forEach((item) => {
      const id = item.productId || item.productSlug || item.productName
      if (!id) return
      const product = {
        id,
        name: item.productName || item.productSlug || `Product ${id}`,
        price: item.price || 0,
        image: resolveProductImage({ name: item.productName, image: item.image }),
      }
      addToCart(product, Number(item.qty || 1))
    })
  }

  const handleDownloadInvoice = () => {
    if (!order || typeof window === 'undefined') return
    const win = window.open('', '_blank', 'width=900,height=700')
    if (!win) return
    const addr = order.deliveryAddress || {}
    const itemsHtml = (order.items || []).map((item) => (
      `<tr>
         <td>${item.productName}</td>
         <td style="text-align:right;">${item.qty}</td>
         <td style="text-align:right;">Rs. ${Number(item.price).toFixed(2)}</td>
       </tr>`
    )).join('')

    win.document.write(`
      <html>
        <head>
          <title>Invoice #${order.orderId}</title>
          <style>
            body { font-family: Arial, sans-serif; color: #111; padding: 24px; }
            h1 { font-size: 20px; margin: 0 0 6px; }
            .muted { color: #666; font-size: 12px; }
            table { width: 100%; border-collapse: collapse; margin-top: 16px; }
            th, td { border-bottom: 1px solid #ddd; padding: 8px 6px; font-size: 12px; }
            th { text-align: left; background: #f6f7f9; }
            .total { font-weight: 700; text-align: right; padding-top: 10px; }
          </style>
        </head>
        <body>
          <h1>Invoice</h1>
          <div class="muted">Order #${order.orderId} - ${formatDateShort(order.orderDate)}</div>
          <h3 style="margin-top:16px;">Delivery Address</h3>
          <div>${addr.name || ''}</div>
          <div>${addr.line1 || ''}${addr.line2 ? `, ${addr.line2}` : ''}</div>
          <div>${addr.city || ''}, ${addr.state || ''} ${addr.pincode || ''}</div>
          <div>Phone: ${addr.phone || ''}</div>

          <table>
            <thead>
              <tr>
                <th>Item</th>
                <th style="text-align:right;">Qty</th>
                <th style="text-align:right;">Price</th>
              </tr>
            </thead>
            <tbody>
              ${itemsHtml}
            </tbody>
          </table>
          <div class="total">Total: Rs. ${Number(order.total || 0).toFixed(2)}</div>
        </body>
      </html>
    `)
    win.document.close()
    win.focus()
    win.print()
  }

  const TRACKING_STEPS = [
  { key: 'pending', label: 'Order Placed' },
  { key: 'confirmed', label: 'Order Confirmed' },
  { key: 'packed', label: 'Packed' },
  { key: 'ready_for_pickup', label: 'Ready for Pickup' },
  { key: 'assigned', label: 'Assigned' },
  { key: 'picked_up', label: 'Picked Up' },
  { key: 'out_for_delivery', label: 'Out for Delivery' },
  { key: 'delivered', label: 'Delivered' },
  ]
  const stepIndex = order ? Math.max(0, TRACKING_STEPS.findIndex((s) => s.key === normalizeStatus(order.status))) : 0

  return (
    <ShopLayout showHeader={true}>
      <main className="orderDetailPage">
        <div className="orderDetailWrap">
          <div className="orderDetailHeader">
            <div>
              <h1>Order #{order?.orderId || ''}</h1>
              <p>{order ? formatDateShort(order.orderDate) : ''}</p>
            </div>
            <div className="orderDetailHeaderRight">
              {order && <StatusBadge status={order.status} />}
              <Link href="/account" className="backBtn">Back to Orders</Link>
            </div>
          </div>

          {loading ? (
            <div className="loadingMsg">Loading order...</div>
          ) : error ? (
            <div className="errorMsg">{error}</div>
          ) : order ? (
            <>
              <div className="summaryGrid">
                <div className="summaryCard">
                  <div className="summaryLabel">Expected Delivery</div>
                  <div className="summaryValue">{formatDateShort(order.expectedDeliveryDate || order.orderDate)}</div>
                  <div className="summaryMeta">
                    {order.deliveryType === 'fast' ? 'Fast Delivery Available' : order.deliveryType === 'standard' ? 'Standard Delivery' : 'Delivery'}
                    {' - '}{order.deliverySlot || (order.deliveryType === 'fast' ? '2-4 Hours' : '10:00 AM - 12:00 PM')}
                  </div>
                </div>
                <div className="summaryCard">
                  <div className="summaryLabel">Payment</div>
                  <div className="summaryValue">{order.paymentMethod === 'online' ? 'Razorpay' : 'Cash on Delivery'}</div>
                  <div className="summaryMeta">Status: {titleCase(order.paymentStatus || (order.paymentMethod === 'online' ? 'paid' : 'pending'))}</div>
                  {order.paymentTxnId && <div className="summaryMeta">Transaction: {order.paymentTxnId}</div>}
                </div>
                <div className="summaryCard">
                  <div className="summaryLabel">Delivery Address</div>
                  <div className="summaryValue">{order.deliveryAddress?.name || 'Customer'}</div>
                  <div className="summaryMeta">
                    {order.deliveryAddress?.line1 || ''}{order.deliveryAddress?.line2 ? `, ${order.deliveryAddress.line2}` : ''}
                    {order.deliveryAddress?.city ? `, ${order.deliveryAddress.city}` : ''}{order.deliveryAddress?.state ? `, ${order.deliveryAddress.state}` : ''}
                    {order.deliveryAddress?.pincode ? ` ${order.deliveryAddress.pincode}` : ''}
                  </div>
                  {order.deliveryAddress?.phone && <div className="summaryMeta">Phone: {order.deliveryAddress.phone}</div>}
                </div>
              </div>

              <div className="trackingCard">
                <div className="trackBar">
                  {TRACKING_STEPS.map((step, idx) => {
                    const done = idx <= stepIndex
                    return (
                      <div key={step.key} className={`trackStep ${done ? 'done' : ''}`}>
                        <div className="trackDot"></div>
                        <div className="trackLabel">{step.label}</div>
                      </div>
                    )
                  })}
                  <div className="trackLine" style={{ width: `${(stepIndex / (TRACKING_STEPS.length - 1)) * 100}%` }}></div>
                </div>
              </div>

              <div className="timelineCard">
                <h3>Tracking Timeline</h3>
                <div className="timelineList">
                  {(order.events && order.events.length > 0 ? order.events : TRACKING_STEPS.slice(0, stepIndex + 1).map((s) => ({
                    status: s.key,
                    notes: s.label,
                    createdAt: order.orderDate,
                  }))).map((ev, idx) => (
                    <div key={`${ev.status}-${idx}`} className="timelineRow">
                      <div className="timelineTime">{formatDateShort(ev.createdAt)} {new Date(ev.createdAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}</div>
                      <div className="timelineStatus">{titleCase(normalizeStatus(ev.status))}</div>
                      <div className="timelineNote">{ev.notes || titleCase(normalizeStatus(ev.status))}</div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="itemsCard">
                <h3>Items</h3>
                <div className="itemsList">
                  {order.items.map((item, idx) => (
                    <div key={`${item.productName}-${idx}`} className="itemRow">
                      <span className="itemName">{item.productName}</span>
                      <span className="itemQty">x {item.qty}</span>
                      <span className="itemPrice">Rs. {Number(item.price).toFixed(2)}</span>
                    </div>
                  ))}
                </div>
                <div className="itemsTotal">Total: Rs. {Number(order.total || 0).toFixed(2)}</div>
              </div>

              <div className="actionsRow">
                <button className="actionBtn" onClick={handleReorder}>Reorder</button>
                <button className="actionBtn" onClick={handleDownloadInvoice}>Download Invoice</button>
              </div>
            </>
          ) : null}
        </div>

        <style jsx>{`
          .orderDetailPage { background: #fff; min-height: calc(100vh - 70px); padding: 32px 0 60px; }
          .orderDetailWrap { max-width: 960px; margin: 0 auto; padding: 0 20px; }
          .orderDetailHeader { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 20px; }
          .orderDetailHeader h1 { margin: 0; font-size: 22px; color: #111827; }
          .orderDetailHeader p { margin: 6px 0 0; font-size: 12px; color: #6b7280; }
          .orderDetailHeaderRight { display: flex; gap: 10px; align-items: center; }
          .backBtn { border: 1px solid #cbd5e1; padding: 7px 12px; border-radius: 6px; font-size: 12px; color: #1f2937; text-decoration: none; }

          .loadingMsg, .errorMsg { text-align: center; padding: 40px; color: #6b7280; }
          .errorMsg { color: #b91c1c; }

          .summaryGrid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px; margin-bottom: 16px; }
          .summaryCard { border: 1px solid #e5e7eb; border-radius: 8px; padding: 14px; background: #fafafa; }
          .summaryLabel { font-size: 11px; letter-spacing: 0.08em; text-transform: uppercase; color: #64748b; font-weight: 700; }
          .summaryValue { margin-top: 6px; font-size: 14px; font-weight: 700; color: #1f2937; }
          .summaryMeta { margin-top: 4px; font-size: 12px; color: #6b7280; }

          .trackingCard { border: 1px solid #e5e7eb; border-radius: 8px; padding: 14px; margin-bottom: 16px; }
          .trackBar { position: relative; display: grid; grid-template-columns: repeat(8, 1fr); gap: 8px; align-items: center; }
          .trackLine { position: absolute; height: 2px; left: 0; top: 12px; background: #1f2937; z-index: 0; }
          .trackStep { position: relative; z-index: 1; display: flex; flex-direction: column; align-items: center; gap: 6px; text-align: center; }
          .trackDot { width: 10px; height: 10px; border-radius: 50%; background: #cbd5e1; }
          .trackStep.done .trackDot { background: #1f2937; }
          .trackLabel { font-size: 11px; color: #6b7280; font-weight: 600; }
          .trackStep.done .trackLabel { color: #1f2937; }

          .timelineCard { border: 1px solid #e5e7eb; border-radius: 8px; padding: 14px; margin-bottom: 16px; }
          .timelineCard h3 { margin: 0 0 10px; font-size: 14px; font-weight: 700; }
          .timelineList { display: grid; gap: 10px; }
          .timelineRow { display: grid; grid-template-columns: 140px 160px 1fr; gap: 10px; font-size: 12px; padding: 8px 10px; border: 1px solid #eef2f7; border-radius: 6px; }
          .timelineTime { color: #6b7280; }
          .timelineStatus { font-weight: 700; color: #111827; }
          .timelineNote { color: #334155; }

          .itemsCard { border: 1px solid #e5e7eb; border-radius: 8px; padding: 14px; margin-bottom: 16px; }
          .itemsCard h3 { margin: 0 0 10px; font-size: 14px; font-weight: 700; }
          .itemsList { display: grid; gap: 8px; }
          .itemRow { display: grid; grid-template-columns: 1fr auto auto; gap: 10px; font-size: 13px; border-bottom: 1px solid #f3f4f6; padding-bottom: 6px; }
          .itemRow:last-child { border-bottom: none; }
          .itemName { color: #1f2937; }
          .itemQty { color: #6b7280; }
          .itemPrice { color: #111827; font-weight: 600; }
          .itemsTotal { margin-top: 8px; font-weight: 700; text-align: right; }

          .actionsRow { display: flex; gap: 10px; flex-wrap: wrap; }
          .actionBtn { border: 1px solid #cbd5e1; background: #fff; color: #1f2937; padding: 8px 12px; border-radius: 6px; font-size: 12px; font-weight: 600; cursor: pointer; }

          @media (max-width: 900px) {
            .summaryGrid { grid-template-columns: 1fr; }
            .timelineRow { grid-template-columns: 1fr; }
          }
          @media (max-width: 600px) {
            .actionsRow { flex-direction: column; }
            .actionBtn { width: 100%; text-align: center; }
          }
        `}</style>
      </main>
    </ShopLayout>
  )
}
