
import { useEffect, useMemo, useState } from 'react'
import './App.css'
import StaffDashboard from './StaffDashboard'

const fallbackProducts = [
  {
    id: 1,
    name: 'Signature Cappuccino',
    category: 'Coffee',
    description: 'Rich espresso, silky steamed milk and delicate foam.',
    price: 45,
    image: 'https://images.unsplash.com/photo-1572442388796-11668a67e53d?w=800',
    tag: 'BESTSELLER',
    available: true
  },
  {
    id: 2,
    name: 'Classic Espresso',
    category: 'Coffee',
    description: 'A bold, beautifully balanced shot of premium espresso.',
    price: 30,
    image: 'https://images.unsplash.com/photo-1510707577719-ae7c14805e3a?w=800',
    tag: 'CLASSIC',
    available: true
  },
  {
    id: 3,
    name: 'Caramel Latte',
    category: 'Coffee',
    description: 'Smooth espresso blended with milk and sweet caramel.',
    price: 50,
    image: 'https://images.unsplash.com/photo-1461023058943-07fcbe16d735?w=800',
    tag: 'POPULAR',
    available: true
  },
  {
    id: 4,
    name: 'Mocha Delight',
    category: 'Coffee',
    description: 'Espresso, steamed milk and delicious chocolate.',
    price: 55,
    image: 'https://images.unsplash.com/photo-1570968915860-54d5c301fa9f?w=800',
    tag: 'FAVOURITE',
    available: true
  },
  {
    id: 5,
    name: 'Classic English Tea',
    category: 'Tea',
    description: 'A comforting cup of carefully selected black tea.',
    price: 25,
    image: 'https://images.unsplash.com/photo-1544787219-7f47ccb76574?w=800',
    tag: 'CLASSIC',
    available: true
  },
  {
    id: 6,
    name: 'Green Tea',
    category: 'Tea',
    description: 'A light and refreshing traditional green tea.',
    price: 28,
    image: 'https://images.unsplash.com/photo-1556679343-c7306c1976bc?w=800',
    tag: 'FRESH',
    available: true
  },
  {
    id: 7,
    name: 'Chocolate Croissant',
    category: 'Pastries',
    description: 'Flaky golden pastry filled with rich chocolate.',
    price: 35,
    image: 'https://images.unsplash.com/photo-1555507036-ab1f4038808a?w=800',
    tag: 'FRESH DAILY',
    available: true
  },
  {
    id: 8,
    name: 'Blueberry Muffin',
    category: 'Pastries',
    description: 'Soft freshly baked muffin bursting with blueberries.',
    price: 30,
    image: 'https://images.unsplash.com/photo-1607958996333-41aef7caefaa?w=800',
    tag: 'POPULAR',
    available: true
  },
  {
    id: 9,
    name: 'Iced Caramel Coffee',
    category: 'Cold Beverages',
    description: 'Chilled coffee with milk and smooth caramel.',
    price: 55,
    image: 'https://images.unsplash.com/photo-1461023058943-07fcbe16d735?w=800',
    tag: 'REFRESHING',
    available: true
  },
  {
    id: 10,
    name: 'Fresh Lemonade',
    category: 'Cold Beverages',
    description: 'Refreshing citrus lemonade served chilled.',
    price: 30,
    image: 'https://images.unsplash.com/photo-1763379978357-482f322c93f5?auto=format&fit=crop&w=800&q=85',
    tag: 'FRESH',
    available: true
  }
]

const categories = [
  'All',
  'Coffee',
  'Tea',
  'Pastries',
  'Cold Beverages'
]

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api'

function App() {
  const [products, setProducts] = useState(fallbackProducts)
  const [activeCategory, setActiveCategory] = useState('All')
  const [search, setSearch] = useState('')
  const [cart, setCart] = useState([])
  const [cartOpen, setCartOpen] = useState(false)
  const [checkoutOpen, setCheckoutOpen] = useState(false)
  const [customerName, setCustomerName] = useState('')
  const [customerPhone, setCustomerPhone] = useState('')
  const [orderDetails, setOrderDetails] = useState('')
  const [confirmation, setConfirmation] = useState(null)
  const [error, setError] = useState('')

  // Load the live menu from the Express API. Keep the local product images
  // and tags, because those presentation fields are not stored in Redis.
  useEffect(() => {
    const loadMenu = async () => {
      try {
        const response = await fetch(`${API_URL}/menu`)
        const result = await response.json()

        if (!response.ok || !result.success || !Array.isArray(result.data)) {
          throw new Error(result.message || 'Unable to load the menu.')
        }

        const liveProducts = result.data.map(item => {
          const localProduct = fallbackProducts.find(
            product => String(product.id) === String(item.id)
          )
const categoryImage =
  fallbackProducts.find(
    product => product.category === item.category
  )?.image || fallbackProducts[0].image

return {
  ...(localProduct || {}),
  ...item,
  id: String(item.id),
  image: localProduct?.image || categoryImage,
  tag: localProduct?.tag || 'MENU'
}
        })

        setProducts(liveProducts)
      } catch (error) {
        console.error('Menu loading error:', error)
        // The local menu remains available if the API is temporarily offline.
      }
    }

    loadMenu()
  }, [])

  const filteredProducts = useMemo(() => {
    return products.filter(product => {
      const matchesCategory =
        activeCategory === 'All' ||
        product.category === activeCategory

      const matchesSearch =
        product.name.toLowerCase().includes(search.toLowerCase()) ||
        product.description.toLowerCase().includes(search.toLowerCase())

      return matchesCategory && matchesSearch
    })
  }, [products, activeCategory, search])

  const cartCount = cart.reduce(
    (total, item) => total + item.quantity,
    0
  )

  const cartTotal = cart.reduce(
    (total, item) => total + item.price * item.quantity,
    0
  )

  const addToCart = product => {
    if (!product.available) return

    setCart(currentCart => {
      const existing = currentCart.find(item => item.id === product.id)

      if (existing) {
        return currentCart.map(item =>
          item.id === product.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        )
      }

      return [...currentCart, { ...product, quantity: 1 }]
    })

    setError('')
  }

  const updateQuantity = (id, amount) => {
    setCart(currentCart =>
      currentCart
        .map(item =>
          item.id === id
            ? { ...item, quantity: item.quantity + amount }
            : item
        )
        .filter(item => item.quantity > 0)
    )
  }

  const removeFromCart = id => {
    setCart(currentCart =>
      currentCart.filter(item => item.id !== id)
    )
  }

  const placeOrder = async event => {
    event.preventDefault()
    setError('')

    if (!customerName.trim()) {
      setError('Please enter your name.')
      return
    }

    if (!customerPhone.trim()) {
      setError('Please enter your phone number.')
      return
    }

    const phoneDigits = customerPhone.replace(/\D/g, '')
    if (phoneDigits.length < 7 || phoneDigits.length > 15) {
      setError('Please enter a valid phone number.')
      return
    }

    if (cart.length === 0) {
      setError('Your shopping bag is empty.')
      return
    }

    try {
      const response = await fetch(`${API_URL}/orders`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          customerName: customerName.trim(),
          customerPhone: customerPhone.trim(),
          orderDetails: orderDetails.trim(),
          items: cart.map(item => ({
            menuItemId: String(item.id),
            quantity: item.quantity
          }))
        })
      })

      const result = await response.json()

      if (!response.ok || !result.success || !result.data) {
        throw new Error(result.message || 'Unable to place your order.')
      }

      const savedOrder = result.data

      setConfirmation({
        number: savedOrder.orderNumber,
        name: savedOrder.customerName || customerName.trim(),
        total: Number(savedOrder.total ?? cartTotal),
        items: savedOrder.items
          ? savedOrder.items.reduce((total, item) => total + item.quantity, 0)
          : cartCount,
        date: savedOrder.createdAt
          ? new Date(savedOrder.createdAt).toLocaleString()
          : new Date().toLocaleString()
      })

      setCart([])
      setCustomerName('')
      setCustomerPhone('')
      setOrderDetails('')
      setCheckoutOpen(false)
      setCartOpen(false)
      setError('')
    } catch (error) {
      console.error('Order submission error:', error)
      setError(error.message || 'Something went wrong. Please try again.')
    }
  }

// Display the staff portal at /staff
if (window.location.pathname === '/staff') {
  return <StaffDashboard />
}

  return (
    <div className="app">

      {/* NAVIGATION */}
      <header className="navbar">
        <a href="#home" className="brand">
          <span className="brand-icon">B.</span>
          <span>BREW <span className="brand-amp">&</span> BEAN</span>
        </a>

        <nav className="nav-links">
          <a href="#home">Home</a>
          <a href="#menu">Our Menu</a>
          <a href="#about">Our Story</a>
          <a href="#contact">Contact</a>
        </nav>

        <button
          className="cart-button"
          onClick={() => setCartOpen(true)}
        >
          Bag
          <span className="cart-count">{cartCount}</span>
        </button>
      </header>

      <main>

        {/* HERO */}
        <section className="hero-section" id="home">
          <div className="hero-content">
            <span className="eyebrow">
              <span className="eyebrow-line"></span>
              YOUR DAILY COFFEE RITUAL
            </span>

            <h1>
              Life begins<br />
              after <span>coffee.</span>
            </h1>

            <p>
              Discover thoughtfully crafted coffee, freshly baked
              treats and beautiful moments in every cup.
            </p>

            <div className="hero-actions">
              <a href="#menu" className="primary-button">
                Explore our menu <span>↗</span>
              </a>

              <a href="#about" className="text-button">
                Discover our story
              </a>
            </div>

            <div className="hero-note">
              <span>✦</span>
              GOOD COFFEE. GOOD PEOPLE. GOOD MOMENTS.
            </div>
          </div>

          <div className="hero-image">
            <img
              src="https://images.unsplash.com/photo-1442512595331-e89e73853f31?w=1200"
              alt="Specialty coffee being prepared"
            />

            <div className="image-caption">
              <span>CRAFTED WITH PASSION</span>
              <strong>Every cup tells a story.</strong>
            </div>

            <div className="hero-stamp">
              EST.<br />2026
            </div>
          </div>
        </section>

        {/* HIGHLIGHTS */}
        <section className="highlights">
          <div><span>✳</span> Freshly prepared daily</div>
          <div><span>♨</span> Quality coffee beans</div>
          <div><span>♡</span> Made with passion</div>
        </section>

        {/* MENU */}
        <section className="menu-section" id="menu">

          <div className="section-heading">
            <div>
              <span className="eyebrow">A LITTLE SOMETHING FOR YOU</span>
              <h2>Our favourites.</h2>
              <p>Good things are brewing. Find your new favourite.</p>
            </div>
          </div>

          {/* SEARCH */}
          <div className="menu-tools">
            <div className="search-box">
              <span>⌕</span>
              <input
                type="search"
                placeholder="Search coffee, tea, pastries..."
                value={search}
                onChange={event => setSearch(event.target.value)}
              />
            </div>

            <span className="product-count">
              {filteredProducts.length} products
            </span>
          </div>

          {/* CATEGORY FILTERS */}
          <div className="category-filters">
            {categories.map(category => (
              <button
                key={category}
                className={
                  activeCategory === category
                    ? 'filter active'
                    : 'filter'
                }
                onClick={() => setActiveCategory(category)}
              >
                {category}
              </button>
            ))}
          </div>

          {/* PRODUCTS */}
          <div className="product-grid">
            {filteredProducts.map(product => (
              <article className="product-card" key={product.id}>

                <div className="product-image">
                  <img src={product.image} alt={product.name} />

                  <span className="product-tag">
                    {product.tag}
                  </span>

                  {!product.available && (
                    <span className="unavailable-label">
                      Unavailable
                    </span>
                  )}

                  <button
                    className="quick-add"
                    disabled={!product.available}
                    onClick={() => addToCart(product)}
                    aria-label={`Add ${product.name} to bag`}
                  >
                    +
                  </button>
                </div>

                <div className="product-details">
                  <span className="product-category">
                    {product.category}
                  </span>

                  <div className="product-title-row">
                    <h3>{product.name}</h3>
                    <strong>M{product.price.toFixed(2)}</strong>
                  </div>

                  <p>{product.description}</p>

                  <div className="availability">
                    <span className={product.available ? 'available-dot' : 'unavailable-dot'}></span>
                    {product.available ? 'Available' : 'Currently unavailable'}
                  </div>

                  <button
                    className="add-button"
                    disabled={!product.available}
                    onClick={() => addToCart(product)}
                  >
                    {product.available ? 'Add to bag' : 'Unavailable'}
                    <span>↗</span>
                  </button>
                </div>
              </article>
            ))}
          </div>

          {filteredProducts.length === 0 && (
            <div className="empty-products">
              <h3>No products found</h3>
              <p>Try another search or choose a different category.</p>
              <button
                className="primary-button"
                onClick={() => {
                  setSearch('')
                  setActiveCategory('All')
                }}
              >
                View all products
              </button>
            </div>
          )}

        </section>

        {/* ABOUT */}
        <section className="about-section" id="about">
          <div className="about-image">
            <img
              src="https://images.unsplash.com/photo-1445116572660-236099ec97a0?w=1000"
              alt="Coffee shop interior"
            />
          </div>

          <div className="about-content">
            <span className="eyebrow">MORE THAN JUST COFFEE</span>

            <h2>Made for the moments that matter.</h2>

            <p>
              We believe great coffee brings people together.
              Every cup is prepared with care, quality ingredients
              and a passion for making your day a little better.
            </p>

            <a href="#contact" className="primary-button">
              Get to know us <span>↗</span>
            </a>
          </div>
        </section>

        {/* CONTACT */}
        <section className="contact-section" id="contact">
          <span className="eyebrow">WE WOULD LOVE TO SEE YOU</span>
          <h2>Your next favourite cup is waiting.</h2>

          <a href="#menu" className="primary-button">
            Order something lovely <span>↗</span>
          </a>
        </section>

      </main>

      {/* SHOPPING CART DRAWER */}
      {cartOpen && (
        <div
          className="overlay"
          onClick={() => setCartOpen(false)}
        >
          <aside
            className="cart-drawer"
            onClick={event => event.stopPropagation()}
          >
            <div className="drawer-heading">
              <div>
                <span className="eyebrow">YOUR SELECTION</span>
                <h2>Your shopping bag</h2>
              </div>

              <button
                className="close-button"
                onClick={() => setCartOpen(false)}
              >
                ×
              </button>
            </div>

            {cart.length === 0 ? (
              <div className="empty-cart">
                <span>♡</span>
                <h3>Your bag is empty</h3>
                <p>Discover something delicious from our menu.</p>

                <button
                  className="primary-button"
                  onClick={() => setCartOpen(false)}
                >
                  Explore menu
                </button>
              </div>
            ) : (
              <>
                <div className="cart-items">
                  {cart.map(item => (
                    <div className="cart-item" key={item.id}>
                      <img src={item.image} alt={item.name} />

                      <div className="cart-item-info">
                        <h3>{item.name}</h3>
                        <span>M{item.price.toFixed(2)}</span>

                        <div className="quantity-controls">
                          <button onClick={() => updateQuantity(item.id, -1)}>
                            −
                          </button>

                          <span>{item.quantity}</span>

                          <button onClick={() => updateQuantity(item.id, 1)}>
                            +
                          </button>
                        </div>
                      </div>

                      <div className="cart-item-actions">
                        <strong>
                          M{(item.price * item.quantity).toFixed(2)}
                        </strong>

                        <button
                          className="remove-button"
                          onClick={() => removeFromCart(item.id)}
                        >
                          Remove
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="cart-footer">
                  <div className="cart-total">
                    <span>Subtotal</span>
                    <strong>M{cartTotal.toFixed(2)}</strong>
                  </div>

                  <button
                    className="checkout-button"
                    onClick={() => {
                      setCartOpen(false)
                      setCheckoutOpen(true)
                    }}
                  >
                    Proceed to checkout →
                  </button>
                </div>
              </>
            )}
          </aside>
        </div>
      )}

      {/* CHECKOUT */}
      {checkoutOpen && (
        <div className="overlay">
          <section className="checkout-modal">
            <div className="drawer-heading">
              <div>
                <span className="eyebrow">ALMOST THERE</span>
                <h2>Complete your order</h2>
              </div>

              <button
                className="close-button"
                onClick={() => setCheckoutOpen(false)}
              >
                ×
              </button>
            </div>

            <form onSubmit={placeOrder}>
              <label htmlFor="customerName">Customer name</label>

              <input
                id="customerName"
                type="text"
                placeholder="Enter your full name"
                value={customerName}
                onChange={event => setCustomerName(event.target.value)}
                required
              />

              <label htmlFor="customerPhone">Phone number</label>

              <input
                id="customerPhone"
                type="tel"
                placeholder="e.g. +266 5000 0000"
                value={customerPhone}
                onChange={event => setCustomerPhone(event.target.value)}
                autoComplete="tel"
                pattern="[+0-9\s()-]{7,20}"
                title="Enter a valid phone number."
                required
              />

              <label htmlFor="orderDetails">
                Additional order details (optional)
              </label>

              <textarea
                id="orderDetails"
                placeholder="Any special requests?"
                value={orderDetails}
                onChange={event => setOrderDetails(event.target.value)}
              />

              <div className="checkout-total">
                <span>Order total</span>
                <strong>M{cartTotal.toFixed(2)}</strong>
              </div>

              {error && <p className="error-message">{error}</p>}

              <button className="checkout-button" type="submit">
                Place my order →
              </button>

              <p className="checkout-note">
                Your order will be sent to the coffee shop. No online payment is collected.
              </p>
            </form>
          </section>
        </div>
      )}

      {/* ORDER CONFIRMATION */}
      {confirmation && (
        <div className="overlay">
          <section className="confirmation-modal">
            <span className="success-icon">✓</span>
            <span className="eyebrow">ORDER RECEIVED</span>

            <h2>Thank you, {confirmation.name}!</h2>

            <p>Your order has been placed successfully.</p>

            <div className="confirmation-details">
              <span>Order number</span>
              <strong>{confirmation.number}</strong>

              <span>Items ordered</span>
              <strong>{confirmation.items}</strong>

              <span>Order total</span>
              <strong>M{confirmation.total.toFixed(2)}</strong>

              <span>Order date</span>
              <strong>{confirmation.date}</strong>
            </div>

            <button
              className="checkout-button"
              onClick={() => setConfirmation(null)}
            >
              Continue shopping
            </button>
          </section>
        </div>
      )}

      {/* FOOTER */}
      <footer className="footer">
        <a href="#home" className="brand footer-brand">
          <span className="brand-icon">B.</span>
          BREW <span className="brand-amp">&</span> BEAN
        </a>

        <p>Crafted with care. Served with love.</p>

        <span>© 2026 BREW & BEAN. All rights reserved.</span>
      </footer>

    </div>
  )
}

export default App
