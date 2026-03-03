import '../styles/globals.css'
import '../styles/responsive.css'
import { CartProvider } from '../contexts/CartContext'

export default function App({ Component, pageProps }) {
  return (
    <CartProvider>
      <Component {...pageProps} />
    </CartProvider>
  )
}
