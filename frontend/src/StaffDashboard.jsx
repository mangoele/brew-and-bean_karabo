
import { useEffect, useState } from 'react'
import './StaffDashboard.css'

const API_URL = (
  import.meta.env.VITE_API_URL || 'http://localhost:5000/api'
).replace(/\/$/, '')

const ORDER_STATUSES = [
  'Pending',
  'Preparing',
  'Ready',
  'Collected'
]

function StaffDashboard() {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [dashboardError, setDashboardError] = useState('')
  const [successMessage, setSuccessMessage] = useState('')
  const [loading, setLoading] = useState(false)
  const [dataLoading, setDataLoading] = useState(false)

  const [staff, setStaff] = useState(null)
  const [token, setToken] = useState('')
  const [orders, setOrders] = useState([])
  const [summary, setSummary] = useState(null)
  const [updatingOrder, setUpdatingOrder] = useState(null)
  const [selectedOrder, setSelectedOrder] = useState(null)
  const [orderSearch, setOrderSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('All')

  // MENU MANAGEMENT
  const [menuItems, setMenuItems] = useState([])
  const [menuLoading, setMenuLoading] = useState(false)
  const [menuSaving, setMenuSaving] = useState(false)
  const [menuSearch, setMenuSearch] = useState('')
  const [editingMenuId, setEditingMenuId] = useState(null)
  const [menuForm, setMenuForm] = useState({
    name: '',
    category: 'Coffee',
    description: '',
    price: '',
    available: true
  })
  const [menuError, setMenuError] = useState('')
  const [menuMessage, setMenuMessage] = useState('')

  const formatMoney = value =>
    `M${Number(value || 0).toFixed(2)}`

  const loadMenu = async authToken => {
    setMenuLoading(true)
    setMenuError('')

    try {
      const response = await fetch(`${API_URL}/menu`, {
        headers: authToken
          ? { Authorization: `Bearer ${authToken}` }
          : {}
      })
      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.message || 'Unable to load menu items.')
      }

      const records = Array.isArray(result.data)
        ? result.data
        : Array.isArray(result.menu)
          ? result.menu
          : []

      setMenuItems(records)
    } catch (err) {
      setMenuError(err.message || 'Unable to load menu items.')
    } finally {
      setMenuLoading(false)
    }
  }

  const resetMenuForm = () => {
    setEditingMenuId(null)
    setMenuForm({
      name: '',
      category: 'Coffee',
      description: '',
      price: '',
      available: true
    })
  }

  const handleMenuFormChange = event => {
    const { name, value, type, checked } = event.target
    setMenuForm(current => ({
      ...current,
      [name]: type === 'checkbox' ? checked : value
    }))
  }

  const saveMenuItem = async event => {
    event.preventDefault()
    setMenuError('')
    setMenuMessage('')

    const price = Number(menuForm.price)
    if (!menuForm.name.trim() || !menuForm.description.trim() ||
        !Number.isFinite(price) || price <= 0) {
      setMenuError('Enter a name, description and a valid price greater than zero.')
      return
    }

    setMenuSaving(true)
    try {
      const isEditing = editingMenuId !== null
      const response = await fetch(
        isEditing
          ? `${API_URL}/menu/${editingMenuId}`
          : `${API_URL}/menu`,
        {
          method: isEditing ? 'PUT' : 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`
          },
          body: JSON.stringify({
            name: menuForm.name.trim(),
            category: menuForm.category,
            description: menuForm.description.trim(),
            price,
            available: Boolean(menuForm.available)
          })
        }
      )

      const result = await response.json()
      if (!response.ok || result.success === false) {
        throw new Error(result.message || 'Unable to save menu item.')
      }

      await loadMenu(token)
      setMenuMessage(isEditing ? 'Menu item updated successfully.' : 'Menu item added successfully.')
      resetMenuForm()
    } catch (err) {
      setMenuError(err.message || 'Unable to save menu item.')
    } finally {
      setMenuSaving(false)
    }
  }

  const editMenuItem = item => {
    setEditingMenuId(item.id)
    setMenuForm({
      name: item.name || '',
      category: item.category || 'Coffee',
      description: item.description || '',
      price: String(item.price ?? ''),
      available: item.available !== false
    })
    setMenuError('')
    setMenuMessage('')
    document.getElementById('staff-menu-form')?.scrollIntoView({
      behavior: 'smooth',
      block: 'center'
    })
  }

  const deleteMenuItem = async item => {
    if (!window.confirm(`Delete "${item.name}" from the menu?`)) return

    setMenuError('')
    setMenuMessage('')
    try {
      const response = await fetch(`${API_URL}/menu/${item.id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      })
      const result = await response.json()

      if (!response.ok || result.success === false) {
        throw new Error(result.message || 'Unable to delete menu item.')
      }

      await loadMenu(token)
      if (String(editingMenuId) === String(item.id)) resetMenuForm()
      setMenuMessage('Menu item deleted successfully.')
    } catch (err) {
      setMenuError(err.message || 'Unable to delete menu item.')
    }
  }

 
  const toggleMenuAvailability = async item => {
    setMenuError('')
    setMenuMessage('')

    const newAvailability = item.available === false

    try {
      const response = await fetch(`${API_URL}/menu/${item.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          name: item.name,
          category: item.category || 'Other',
          description: item.description || 'No description available.',
          price: Number(item.price),
          available: newAvailability
        })
      })

      const result = await response.json()

      if (!response.ok || result.success === false) {
        throw new Error(result.message || 'Unable to update availability.')
      }

      await loadMenu(token)

      setMenuMessage(
        `${item.name} is now ${newAvailability ? 'available' : 'unavailable'}.`
      )
    } catch (err) {
      setMenuError(err.message || 'Unable to update availability.')
    }
  }


  const loadDashboard = async authToken => {
    setDataLoading(true)
    setDashboardError('')

    try {
      const headers = {
        Authorization: `Bearer ${authToken}`
      }

      const [ordersResponse, summaryResponse] = await Promise.all([
        fetch(`${API_URL}/orders`, { headers }),
        fetch(`${API_URL}/orders/summary/daily`, { headers })
      ])

      const ordersResult = await ordersResponse.json()
      const summaryResult = await summaryResponse.json()

      if (ordersResponse.status === 401 || summaryResponse.status === 401) {
        setStaff(null)
        setToken('')
        throw new Error('Your session has expired. Please sign in again.')
      }

      if (!ordersResponse.ok) {
        throw new Error(ordersResult.message || 'Unable to load orders.')
      }

      if (!summaryResponse.ok) {
        throw new Error(summaryResult.message || 'Unable to load daily sales.')
      }

      setOrders(
        Array.isArray(ordersResult.data) ? ordersResult.data : []
      )

      setSummary(summaryResult.summary || null)
    } catch (err) {
      setDashboardError(err.message || 'Unable to load dashboard data.')
    } finally {
      setDataLoading(false)
    }
  }

  useEffect(() => {
    if (token) {
      loadDashboard(token)
      loadMenu(token)
    }
  }, [token])

  const handleLogin = async event => {
    event.preventDefault()
    setError('')
    setLoading(true)

    try {
      const response = await fetch(`${API_URL}/staff/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ username, password })
      })

      const result = await response.json()

      if (!response.ok || !result.success) {
        throw new Error(result.message || 'Login failed.')
      }

      setToken(result.token)
      setStaff(result.user)
      setPassword('')
    } catch (err) {
      setError(err.message || 'Unable to connect to the server.')
    } finally {
      setLoading(false)
    }
  }

  const handleLogout = () => {
    setStaff(null)
    setToken('')
    setUsername('')
    setPassword('')
    setOrders([])
    setSummary(null)
    setSelectedOrder(null)
    setError('')
    setDashboardError('')
    setSuccessMessage('')
  }

  const updateOrderStatus = async (orderId, newStatus) => {
    setUpdatingOrder(orderId)
    setDashboardError('')
    setSuccessMessage('')

    try {
      const response = await fetch(
        `${API_URL}/orders/${orderId}/status`,
        {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`
          },
          body: JSON.stringify({ status: newStatus })
        }
      )

      const result = await response.json()

      if (!response.ok || !result.success) {
        throw new Error(result.message || 'Unable to update order status.')
      }

      setOrders(currentOrders =>
        currentOrders.map(order =>
          String(order.id) === String(orderId)
            ? { ...order, status: newStatus }
            : order
        )
      )

      if (
        selectedOrder &&
        String(selectedOrder.id) === String(orderId)
      ) {
        setSelectedOrder(current => ({
          ...current,
          status: newStatus
        }))
      }

      setSuccessMessage(`Order status updated to ${newStatus}.`)

      await loadDashboard(token)
    } catch (err) {
      setDashboardError(err.message || 'Status update failed.')
    } finally {
      setUpdatingOrder(null)
    }
  }

  const pendingOrders = orders.filter(
    order => order.status === 'Pending'
  ).length

  const recentOrders = [...orders]
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
    .slice(0, 8)

  const filteredOrders = orders.filter(order => {
    const matchesStatus =
      statusFilter === 'All' || order.status === statusFilter

    const searchValue = orderSearch.toLowerCase()

    const matchesSearch =
      String(order.orderNumber || '').toLowerCase().includes(searchValue) ||
      String(order.customerName || '').toLowerCase().includes(searchValue) ||
      String(order.customerPhone || '').toLowerCase().includes(searchValue)

    return matchesStatus && matchesSearch
  })

  if (staff) {
    return (
      <div className="staff-dashboard">
        <header className="staff-header">
          <a href="/" className="staff-brand">
            <span className="staff-brand-icon">B.</span>
            BREW <span>&</span> BEAN
          </a>

          <div className="staff-account">
            <span>Welcome, {staff.username}</span>
            <button onClick={handleLogout}>Log out</button>
          </div>
        </header>

        <main className="staff-main">
          <div className="staff-welcome">
            <div>
              <span className="staff-eyebrow">
                BREW & BEAN MANAGEMENT
              </span>
              <h1>Staff Dashboard</h1>
              <p>Monitor your coffee shop's daily operations.</p>
            </div>

            <button
              className="staff-refresh-button"
              onClick={() => loadDashboard(token)}
              disabled={dataLoading}
            >
              {dataLoading ? 'Refreshing...' : '↻ Refresh data'}
            </button>
          </div>

          {dashboardError && (
            <div className="staff-dashboard-error">
              {dashboardError}
            </div>
          )}

          {successMessage && (
            <div className="staff-success-message">
              {successMessage}
            </div>
          )}

          <section className="staff-stats-grid">
            <article className="staff-stat-card">
              <span className="staff-stat-label">ORDERS TODAY</span>
              <strong>{summary ? summary.totalOrders : '—'}</strong>
              <span className="staff-stat-description">
                Orders received today
              </span>
            </article>

            <article className="staff-stat-card">
              <span className="staff-stat-label">SALES TODAY</span>
              <strong>
                {summary ? formatMoney(summary.totalOrderValue) : '—'}
              </strong>
              <span className="staff-stat-description">
                Total value of today's orders
              </span>
            </article>

            <article className="staff-stat-card">
              <span className="staff-stat-label">COLLECTED REVENUE</span>
              <strong>
                {summary ? formatMoney(summary.collectedRevenue) : '—'}
              </strong>
              <span className="staff-stat-description">
                Orders marked as collected
              </span>
            </article>

            <article className="staff-stat-card">
              <span className="staff-stat-label">PENDING ORDERS</span>
              <strong>{summary ? pendingOrders : '—'}</strong>
              <span className="staff-stat-description">
                Awaiting preparation
              </span>
            </article>
          </section>

          <section className="staff-orders-section">
            <div className="staff-section-heading">
              <div>
                <span className="staff-eyebrow">CUSTOMER ACTIVITY</span>
                <h2>Recent orders</h2>
              </div>
              <span className="staff-order-count">
                {orders.length} total orders
              </span>
            </div>

            {recentOrders.length === 0 ? (
              <div className="staff-empty-state">
                No customer orders have been received yet.
              </div>
            ) : (
              <div className="staff-table-wrapper">
                <table className="staff-orders-table">
                  <thead>
                    <tr>
                      <th>ORDER NUMBER</th>
                      <th>CUSTOMER</th>
                      <th>DATE</th>
                      <th>TOTAL</th>
                      <th>STATUS</th>
                    </tr>
                  </thead>
                  <tbody>
                    {recentOrders.map(order => (
                      <tr key={order.id}>
                        <td className="staff-order-number">
                          {order.orderNumber}
                        </td>
                        <td>{order.customerName}</td>
                        <td>
                          {order.createdAt
                            ? new Date(order.createdAt).toLocaleString()
                            : '—'}
                        </td>
                        <td>{formatMoney(order.total)}</td>
                        <td>
                          <span
                            className={`staff-status status-${String(
                              order.status
                            ).toLowerCase()}`}
                          >
                            {order.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>

          <section className="staff-menu-section">
            <div className="staff-section-heading">
              <div>
                <span className="staff-eyebrow">PRODUCT OPERATIONS</span>
                <h2>Manage menu items</h2>
                <p className="staff-section-description">
                  Add products, update prices and control what customers can order.
                </p>
              </div>
              <span className="staff-order-count">
                {menuItems.length} menu items
              </span>
            </div>

            {menuError && <div className="staff-dashboard-error">{menuError}</div>}
            {menuMessage && <div className="staff-success-message">{menuMessage}</div>}

            <form id="staff-menu-form" className="staff-menu-form" onSubmit={saveMenuItem}>
              <h3>{editingMenuId !== null ? 'Edit menu item' : 'Add a new menu item'}</h3>
              <div className="staff-menu-form-grid">
                <label>
                  Product name
                  <input
                    name="name"
                    value={menuForm.name}
                    onChange={handleMenuFormChange}
                    placeholder="e.g. Cappuccino"
                    required
                  />
                </label>

                <label>
                  Category
                  <select name="category" value={menuForm.category} onChange={handleMenuFormChange}>
                    <option value="Coffee">Coffee</option>
                    <option value="Tea">Tea</option>
                    <option value="Pastries">Pastries</option>
                    <option value="Other">Other</option>
                  </select>
                </label>

                <label>
                  Price (M)
                  <input
                    name="price"
                    type="number"
                    min="0.01"
                    step="0.01"
                    value={menuForm.price}
                    onChange={handleMenuFormChange}
                    placeholder="e.g. 35.00"
                    required
                  />
                </label>

                <label className="staff-menu-description-field">
                  Description
                  <textarea
                    name="description"
                    value={menuForm.description}
                    onChange={handleMenuFormChange}
                    placeholder="Describe the product..."
                    rows="3"
                    required
                  />
                </label>
              </div>

              <label className="staff-menu-availability-input">
                <input
                  type="checkbox"
                  name="available"
                  checked={menuForm.available}
                  onChange={handleMenuFormChange}
                />
                Available for customers to order
              </label>

              <div className="staff-menu-form-actions">
                <button className="staff-menu-primary-button" type="submit" disabled={menuSaving}>
                  {menuSaving ? 'Saving...' : editingMenuId !== null ? 'Save changes' : 'Add menu item'}
                </button>
                {editingMenuId !== null && (
                  <button className="staff-menu-secondary-button" type="button" onClick={resetMenuForm}>
                    Cancel editing
                  </button>
                )}
              </div>
            </form>

            <div className="staff-menu-list-heading">
              <h3>Current menu</h3>
              <input
                type="search"
                value={menuSearch}
                onChange={event => setMenuSearch(event.target.value)}
                placeholder="Search menu items..."
                aria-label="Search menu items"
              />
            </div>

            {menuLoading ? (
              <div className="staff-empty-state">Loading menu items...</div>
            ) : menuItems.filter(item =>
              `${item.name || ''} ${item.category || ''}`.toLowerCase().includes(menuSearch.toLowerCase())
            ).length === 0 ? (
              <div className="staff-empty-state">
                No menu items found. Add your first product using the form above.
              </div>
            ) : (
              <div className="staff-table-wrapper">
                <table className="staff-orders-table staff-menu-table">
                  <thead>
                    <tr>
                      <th>PRODUCT</th>
                      <th>CATEGORY</th>
                      <th>DESCRIPTION</th>
                      <th>PRICE</th>
                      <th>AVAILABILITY</th>
                      <th>ACTIONS</th>
                    </tr>
                  </thead>
                  <tbody>
                    {menuItems
                      .filter(item =>
                        `${item.name || ''} ${item.category || ''}`.toLowerCase().includes(menuSearch.toLowerCase())
                      )
                      .map(item => (
                        <tr key={item.id}>
                          <td className="staff-order-number">{item.name}</td>
                          <td>{item.category || 'Other'}</td>
                          <td className="staff-menu-description-cell">{item.description || '—'}</td>
                          <td>{formatMoney(item.price)}</td>
                          <td>
                            <span className={`staff-status ${item.available === false ? 'status-pending' : 'status-ready'}`}>
                              {item.available === false ? 'Unavailable' : 'Available'}
                            </span>
                          </td>
                          <td>
                            <div className="staff-menu-actions">
                              <button type="button" className="staff-view-order-button" onClick={() => editMenuItem(item)}>
                                Edit
                              </button>
                              <button type="button" className="staff-menu-toggle-button" onClick={() => toggleMenuAvailability(item)}>
                                {item.available === false ? 'Enable' : 'Disable'}
                              </button>
                              <button type="button" className="staff-menu-delete-button" onClick={() => deleteMenuItem(item)}>
                                Delete
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>

          <section className="staff-orders-section">
            <div className="staff-section-heading">
              <div>
                <span className="staff-eyebrow">ORDER OPERATIONS</span>
                <h2>Manage customer orders</h2>
                <p className="staff-section-description">
                  Review orders and update their preparation status.
                </p>
              </div>
              <span className="staff-order-count">
                {filteredOrders.length} displayed
              </span>
            </div>

            <div className="staff-order-tools">
              <input
                type="search"
                placeholder="Search by order number, customer or phone..."
                value={orderSearch}
                onChange={event => setOrderSearch(event.target.value)}
              />

              <select
                value={statusFilter}
                onChange={event => setStatusFilter(event.target.value)}
              >
                <option value="All">All statuses</option>
                {ORDER_STATUSES.map(status => (
                  <option key={status} value={status}>{status}</option>
                ))}
              </select>
            </div>

            {filteredOrders.length === 0 ? (
              <div className="staff-empty-state">
                No orders match your search or selected status.
              </div>
            ) : (
              <div className="staff-table-wrapper">
                <table className="staff-orders-table">
                  <thead>
                    <tr>
                      <th>ORDER NUMBER</th>
                      <th>CUSTOMER</th>
                      <th>PHONE</th>
                      <th>TOTAL</th>
                      <th>CURRENT STATUS</th>
                      <th>UPDATE STATUS</th>
                      <th>DETAILS</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredOrders.map(order => (
                      <tr key={order.id}>
                        <td className="staff-order-number">
                          {order.orderNumber}
                        </td>
                        <td>{order.customerName}</td>
                        <td>{order.customerPhone || '—'}</td>
                        <td>{formatMoney(order.total)}</td>
                        <td>
                          <span
                            className={`staff-status status-${String(
                              order.status
                            ).toLowerCase()}`}
                          >
                            {order.status}
                          </span>
                        </td>
                        <td>
                          <select
                            className="staff-status-select"
                            value={order.status}
                            disabled={updatingOrder === order.id}
                            onChange={event =>
                              updateOrderStatus(order.id, event.target.value)
                            }
                          >
                            {ORDER_STATUSES.map(status => (
                              <option key={status} value={status}>
                                {status}
                              </option>
                            ))}
                          </select>
                          {updatingOrder === order.id && (
                            <span className="staff-updating-label">
                              Saving...
                            </span>
                          )}
                        </td>
                        <td>
                          <button
                            className="staff-view-order-button"
                            onClick={() => setSelectedOrder(order)}
                          >
                            View
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>

          {summary && (
            <section className="staff-summary-section">
              <div className="staff-section-heading">
                <div>
                  <span className="staff-eyebrow">DAILY PERFORMANCE</span>
                  <h2>Order status breakdown</h2>
                </div>
                <span className="staff-order-count">{summary.date}</span>
              </div>

              <div className="staff-status-grid">
                {ORDER_STATUSES.map(status => (
                  <div className="staff-status-card" key={status}>
                    <span>{status}</span>
                    <strong>
                      {summary.statusBreakdown?.[status] ?? 0}
                    </strong>
                  </div>
                ))}
              </div>
            </section>
          )}
        </main>

        {selectedOrder && (
          <div
            className="staff-modal-overlay"
            onClick={() => setSelectedOrder(null)}
          >
            <section
              className="staff-order-modal"
              onClick={event => event.stopPropagation()}
            >
              <div className="staff-modal-heading">
                <div>
                  <span className="staff-eyebrow">ORDER INFORMATION</span>
                  <h2>Order details</h2>
                </div>
                <button
                  onClick={() => setSelectedOrder(null)}
                  aria-label="Close order details"
                >
                  ×
                </button>
              </div>

              <div className="staff-order-detail-list">
                <div>
                  <span>Order number</span>
                  <strong>{selectedOrder.orderNumber}</strong>
                </div>
                <div>
                  <span>Customer</span>
                  <strong>{selectedOrder.customerName}</strong>
                </div>
                <div>
                  <span>Phone</span>
                  <strong>{selectedOrder.customerPhone || '—'}</strong>
                </div>
                <div>
                  <span>Status</span>
                  <strong>{selectedOrder.status}</strong>
                </div>
              </div>

              <h3 className="staff-modal-subtitle">Items ordered</h3>

              <div className="staff-modal-items">
                {selectedOrder.items?.map((item, index) => (
                  <div key={`${item.menuItemId || item.name}-${index}`}>
                    <span>
                      {item.name || item.menuItemName || 'Menu item'} × {item.quantity}
                    </span>
                    <strong>
                      {formatMoney(
                        Number(item.price || 0) * Number(item.quantity || 0)
                      )}
                    </strong>
                  </div>
                ))}
              </div>

              {selectedOrder.orderDetails && (
                <div className="staff-special-request">
                  <span>Customer request</span>
                  <p>{selectedOrder.orderDetails}</p>
                </div>
              )}

              <div className="staff-modal-total">
                <span>Order total</span>
                <strong>{formatMoney(selectedOrder.total)}</strong>
              </div>
            </section>
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="staff-login-page">
      <a href="/" className="staff-back-link">
        ← Back to customer website
      </a>

      <section className="staff-login-card">
        <div className="staff-login-logo">B.</div>
        <span className="staff-eyebrow">BREW & BEAN</span>
        <h1>Staff portal</h1>
        <p className="staff-login-description">
          Sign in to manage your coffee shop operations.
        </p>

        <form onSubmit={handleLogin}>
          <label htmlFor="staffUsername">Username</label>
          <input
            id="staffUsername"
            type="text"
            placeholder="Enter your staff username"
            value={username}
            onChange={event => setUsername(event.target.value)}
            autoComplete="username"
            required
          />

          <label htmlFor="staffPassword">Password</label>
          <input
            id="staffPassword"
            type="password"
            placeholder="Enter your password"
            value={password}
            onChange={event => setPassword(event.target.value)}
            autoComplete="current-password"
            required
          />

          {error && (
            <div className="staff-login-error">{error}</div>
          )}

          <button
            type="submit"
            className="staff-login-button"
            disabled={loading}
          >
            {loading ? 'Signing in...' : 'Sign in to dashboard →'}
          </button>
        </form>

        <div className="staff-login-footer">
          <span>SECURE STAFF ACCESS</span>
          <span>BREW & BEAN © 2026</span>
        </div>
      </section>
    </div>
  )
}

export default StaffDashboard
