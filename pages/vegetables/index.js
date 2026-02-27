import Link from 'next/link'
import ShopLayout from '../components/ShopLayout'

export default function VegetablesIndex() {
  const categories = [
    { label: 'Leafy Vegetables', href: '/vegetables/leafy-vegetables' },
    { label: 'Regular Vegetables', href: '/vegetables/regular-vegetables' },
    { label: 'Exotic Vegetables', href: '/vegetables/exotic-vegetables' },
    { label: 'Gourds & Pumpkin', href: '/vegetables/gourds-and-pumpkin' },
    { label: 'Salad Vegetables', href: '/vegetables/salad-vegetables' },
  ]

  return (
    <ShopLayout showHeader={true}>
      <main style={{ padding: '60px 20px', textAlign: 'center' }}>
        <h1>Vegetables</h1>
        <p>Please choose a category:</p>
        <ul style={{ listStyle: 'none', padding: 0, margin: '40px 0' }}>
          {categories.map((cat) => (
            <li key={cat.href} style={{ margin: '12px 0' }}>
              <Link href={cat.href} style={{ fontSize: '18px', color: '#14774e', textDecoration: 'underline' }}>
                {cat.label}
              </Link>
            </li>
          ))}
        </ul>
      </main>
    </ShopLayout>
  )
}
