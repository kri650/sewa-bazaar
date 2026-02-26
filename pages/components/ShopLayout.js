import SiteHeader from './SiteHeader'

export default function ShopLayout({ children }) {
  return (
    <div className="shopLayout">
      <SiteHeader />
      <div className="shopOutlet">{children}</div>
    </div>
  )
}
