import '../styles/globals.css'
import '../styles/responsive.css'
import Head from 'next/head'
import { useRouter } from 'next/router'
import { CartProvider } from '../contexts/CartContext'
import { LocationProvider } from '../contexts/LocationContext'

const SITE_NAME = 'Sewa Bazaar'
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://sewabazaar.in'
const DEFAULT_TITLE = 'Sewa Bazaar - Fresh Fruits, Vegetables & Organic Groceries'
const DEFAULT_DESCRIPTION =
  'Shop farm-fresh fruits, vegetables, hydroponic produce, organic specials, and seasonal picks at Sewa Bazaar.'
const DEFAULT_IMAGE = '/logo.png'
const DEFAULT_KEYWORDS =
  'sewa bazaar, online grocery, fresh vegetables, fresh fruits, organic groceries, seasonal vegetables, farm fresh produce'

const ROUTE_META = {
  '/': {
    title: 'Sewa Bazaar - Fresh Fruits, Vegetables & Organic Groceries',
    description:
      'Buy fresh fruits, vegetables, hydroponic veggies, organic specials, value combos, and farm fresh products online from Sewa Bazaar.',
    keywords:
      'sewa bazaar, online grocery india, fresh fruits online, fresh vegetables online, buy organic groceries, farm fresh products',
  },
  '/fruits': {
    title: 'Fresh Fruits Online at Best Price - Sewa Bazaar',
    description:
      'Explore handpicked fresh fruits for daily nutrition. Shop premium quality seasonal and everyday fruits online at Sewa Bazaar.',
    keywords:
      'fresh fruits online, buy fruits online, seasonal fruits, apple banana orange online, fruit delivery',
  },
  '/exotic-fruits': {
    title: 'Exotic Fruits Online - Sewa Bazaar',
    description:
      'Shop premium exotic fruits with freshness and quality assurance. Discover kiwi, berries, dragon fruit and more at Sewa Bazaar.',
    keywords:
      'exotic fruits online, dragon fruit, kiwi online, berries online, premium fruits',
  },
  '/fruit-baskets': {
    title: 'Fruit Baskets for Gifting & Wellness - Sewa Bazaar',
    description:
      'Order curated fruit baskets for gifting, office hampers, and healthy family routines from Sewa Bazaar.',
    keywords:
      'fruit basket online, healthy gift baskets, fruit hamper delivery, gifting fruits',
  },
  '/imported-fruits': {
    title: 'Imported Fruits Online - Sewa Bazaar',
    description:
      'Get fresh imported fruits at great value with reliable quality and quick delivery from Sewa Bazaar.',
    keywords:
      'imported fruits online, imported apple, imported pear, premium imported fruits',
  },
  '/vegetables': {
    title: 'Fresh Vegetables Online - Sewa Bazaar',
    description:
      'Browse fresh vegetables including regular, leafy, salad, root, and exotic categories at Sewa Bazaar.',
    keywords:
      'fresh vegetables online, buy vegetables online, leafy vegetables, salad vegetables, root vegetables',
  },
  '/root-vegetables': {
    title: 'Root Vegetables Online - Sewa Bazaar',
    description:
      'Shop root vegetables like carrots, beetroot, radish and more with farm-fresh quality at Sewa Bazaar.',
    keywords:
      'root vegetables online, carrot beetroot radish, healthy vegetables',
  },
  '/vegetables/regular-vegetables': {
    title: 'Regular Daily Vegetables - Sewa Bazaar',
    description: 'Daily-use regular vegetables sourced fresh for your kitchen needs.',
    keywords:
      'daily vegetables online, onion tomato potato, regular vegetables',
  },
  '/vegetables/leafy-vegetables': {
    title: 'Leafy Vegetables - Sewa Bazaar',
    description: 'Nutritious leafy vegetables including spinach, coriander, mint and more.',
    keywords:
      'leafy vegetables online, spinach online, coriander mint leaves',
  },
  '/vegetables/salad-vegetables': {
    title: 'Salad Vegetables - Sewa Bazaar',
    description: 'Fresh salad vegetables for healthy meals and quick recipes.',
    keywords:
      'salad vegetables online, lettuce cucumber tomato salad',
  },
  '/vegetables/exotic-vegetables': {
    title: 'Exotic Vegetables - Sewa Bazaar',
    description: 'Special exotic vegetables sourced for premium cooking at home.',
    keywords:
      'exotic vegetables online, premium vegetables, gourmet vegetables',
  },
  '/vegetables/gourds-and-pumpkin': {
    title: 'Gourds & Pumpkin - Sewa Bazaar',
    description: 'Find fresh gourds and pumpkin varieties at Sewa Bazaar.',
    keywords:
      'gourd vegetables online, pumpkin online, bottle gourd, ridge gourd',
  },
  '/hydroponic-vegetables': {
    title: 'Hydroponic Vegetables Online - Sewa Bazaar',
    description:
      'Shop clean, residue-conscious hydroponic vegetables grown with modern farming techniques at Sewa Bazaar.',
    keywords:
      'hydroponic vegetables online, pesticide free vegetables, hydroponic greens',
  },
  '/seasonal-special': {
    title: 'Seasonal Specials Online - Sewa Bazaar',
    description: 'Discover in-season specials with better taste, freshness and value.',
    keywords:
      'seasonal vegetables, seasonal fruits, in season produce, fresh seasonal picks',
  },
  '/farm-fresh-picks': {
    title: 'Farm Fresh Picks - Sewa Bazaar',
    description:
      'Browse daily farm-fresh picks including fruits and vegetables directly selected for quality.',
    keywords:
      'farm fresh picks, farm vegetables, farm fruits online, fresh produce delivery',
  },
  '/farm-fresh-picks/fruits': {
    title: 'Farm Fresh Fruits - Sewa Bazaar',
    description: 'Freshly picked fruits from trusted farms, available online at Sewa Bazaar.',
    keywords:
      'farm fresh fruits online, orchard fruits, local farm fruits',
  },
  '/farm-fresh-picks/vegetables': {
    title: 'Farm Fresh Vegetables - Sewa Bazaar',
    description: 'Farm fresh vegetables carefully selected for freshness and taste.',
    keywords:
      'farm fresh vegetables online, local farm vegetables, fresh greens',
  },
  '/organic-specials': {
    title: 'Organic Specials & Pantry Essentials - Sewa Bazaar',
    description: 'Explore premium organic specials for healthier everyday choices.',
    keywords:
      'organic products online, organic grocery store, organic pantry items',
  },
  '/value-combos': {
    title: 'Value Combo Packs - Sewa Bazaar',
    description: 'Save more with curated value combo packs for fruits, vegetables and essentials.',
    keywords:
      'grocery combo offers, fruit vegetable combo, value packs online',
  },
  '/products': {
    title: 'All Products - Sewa Bazaar',
    description: 'Browse all available product categories and fresh selections at Sewa Bazaar.',
    keywords:
      'all grocery products, fresh produce catalog, sewa bazaar products',
  },
  '/search': {
    title: 'Search Products - Sewa Bazaar',
    description:
      'Search and discover fresh products, fruits, vegetables, hydroponic greens and organic options at Sewa Bazaar.',
    keywords:
      'search grocery products, find fruits and vegetables online',
  },
  '/cart': {
    title: 'Your Cart - Sewa Bazaar',
    description: 'Review selected items in your cart and place your order quickly.',
    keywords:
      'shopping cart, online grocery checkout, sewa bazaar cart',
  },
  '/account': {
    title: 'My Account - Sewa Bazaar',
    description: 'Manage account details, saved items, and orders at Sewa Bazaar.',
    keywords:
      'customer account, manage grocery orders, saved items',
  },
  '/create-account': {
    title: 'Create Account - Sewa Bazaar',
    description: 'Create your Sewa Bazaar account for faster checkout and order tracking.',
    keywords:
      'create grocery account, register sewa bazaar',
  },
  '/admin': {
    title: 'Admin Dashboard - Sewa Bazaar',
    description: 'Manage products, users, orders, and delivery operations for Sewa Bazaar.',
    keywords:
      'sewa bazaar admin, ecommerce admin dashboard, manage products orders users',
  },
  '/product/[id]': {
    title: 'Product Details - Sewa Bazaar',
    description: 'View product details, pricing, and quantity options before checkout.',
    keywords:
      'product details, buy groceries online, sewa bazaar product',
  },
}

function buildSeo(router) {
  const pathWithoutQuery = (router.asPath || '/').split('?')[0].split('#')[0]
  const byAsPath = ROUTE_META[pathWithoutQuery]
  const byPathname = ROUTE_META[router.pathname]
  const selected = byAsPath || byPathname || {}

  let title = selected.title || DEFAULT_TITLE
  let description = selected.description || DEFAULT_DESCRIPTION
  let keywords = selected.keywords || DEFAULT_KEYWORDS

  if (router.pathname === '/product/[id]' && router.query?.name) {
    title = `${router.query.name} - Buy Online | ${SITE_NAME}`
    description = `Buy ${router.query.name} online from ${SITE_NAME}. Check price, unit details and add to cart for quick delivery.`
    keywords = `${router.query.name}, buy ${router.query.name} online, ${SITE_NAME.toLowerCase()}, fresh groceries`
  }

  if (router.pathname === '/search' && router.query?.q) {
    title = `Search: ${router.query.q} - ${SITE_NAME}`
    description = `Search results for ${router.query.q} on ${SITE_NAME}. Explore matching fruits, vegetables and grocery products.`
    keywords = `${router.query.q}, search ${router.query.q} online, ${SITE_NAME.toLowerCase()}`
  }
  const canonical = `${SITE_URL}${pathWithoutQuery}`
  const imageUrl = `${SITE_URL}${DEFAULT_IMAGE}`

  return { title, description, keywords, canonical, imageUrl, pathWithoutQuery }
}

export default function App({ Component, pageProps }) {
  const router = useRouter()
  const seo = buildSeo(router)
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: SITE_NAME,
    url: SITE_URL,
    logo: `${SITE_URL}/logo.png`,
  }

  return (
    <CartProvider>
      <LocationProvider>
      <Head>
        <title>{seo.title}</title>
        <meta name="description" content={seo.description} />
        <meta name="keywords" content={seo.keywords} />
        <meta name="robots" content="index,follow,max-image-preview:large" />
        <link rel="canonical" href={seo.canonical} />

        <meta property="og:type" content="website" />
        <meta property="og:site_name" content={SITE_NAME} />
        <meta property="og:title" content={seo.title} />
        <meta property="og:description" content={seo.description} />
        <meta property="og:url" content={seo.canonical} />
        <meta property="og:image" content={seo.imageUrl} />
        <meta property="og:image:alt" content={`${SITE_NAME} Logo`} />

        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={seo.title} />
        <meta name="twitter:description" content={seo.description} />
        <meta name="twitter:image" content={seo.imageUrl} />

        <script
          key="org-jsonld"
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </Head>
      <Component {...pageProps} />
      </LocationProvider>
    </CartProvider>
  )
}
