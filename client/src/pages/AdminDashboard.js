import { useEffect, useState } from "react";
import QRCodeDisplay from "../components/QRCodeDisplay";
import "../App.css";

export default function AdminDashboard({ user }) {
  const [activeTab, setActiveTab] = useState('overview');
  const [categories, setCategories] = useState([]);
  const [items, setItems] = useState([]);
  const [tables, setTables] = useState([]);
  const [orders, setOrders] = useState([]);
  const [stats, setStats] = useState({});
  const [loading, setLoading] = useState(true);
  const token = localStorage.getItem("token");

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [catsRes, itemsRes, tablesRes, ordersRes, statsRes] = await Promise.all([
        fetch("http://localhost:5001/api/menu/categories"),
        fetch("http://localhost:5001/api/menu/items?limit=100"),
        fetch("http://localhost:5001/api/tables", {
          headers: { "Authorization": `Bearer ${token}` }
        }),
        fetch("http://localhost:5001/api/orders", {
          headers: { "Authorization": `Bearer ${token}` }
        }),
        fetch("http://localhost:5001/api/orders/stats/dashboard", {
          headers: { "Authorization": `Bearer ${token}` }
        })
      ]);

      const cats = await catsRes.json();
      const items = await itemsRes.json();
      const tables = await tablesRes.json();
      const orders = ordersRes.ok ? await ordersRes.json() : { orders: [] };
      const stats = statsRes.ok ? await statsRes.json() : {};

      setCategories(cats);
      setItems(items.items || []);
      setTables(tables);
      setOrders(orders.orders || []);
      setStats(stats);
    } catch (err) {
      console.error("Error fetching data:", err);
    } finally {
      setLoading(false);
    }
  };

  const generateQR = async (tableId) => {
    try {
      const response = await fetch(`http://localhost:5001/api/tables/${tableId}/qr`, {
        headers: { "Authorization": `Bearer ${token}` }
      });
      const data = await response.json();

      // Create download link
      const link = document.createElement('a');
      link.href = data.qrCode;
      link.download = `table-${data.tableNumber}-qr.png`;
      link.click();
    } catch (error) {
      console.error("Error generating QR:", error);
      alert("Error generating QR code");
    }
  };

  const createTable = async () => {
    const number = prompt("Enter table number:");
    const capacity = prompt("Enter table capacity:", "4");

    if (!number) return;

    try {
      const response = await fetch("http://localhost:5001/api/tables", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({
          number: parseInt(number),
          capacity: parseInt(capacity) || 4
        })
      });

      if (response.ok) {
        fetchData();
        alert("Table created successfully!");
      } else {
        const error = await response.json();
        alert(`Error: ${error.message}`);
      }
    } catch (error) {
      console.error("Error creating table:", error);
      alert("Error creating table");
    }
  };

  const toggleItemAvailability = async (itemId, currentAvailability) => {
    try {
      const response = await fetch(`http://localhost:5001/api/menu/items/${itemId}/availability`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({ availability: !currentAvailability })
      });

      if (response.ok) {
        fetchData();
      }
    } catch (error) {
      console.error("Error updating availability:", error);
    }
  };

  const fetchOrdersByStatus = async (status) => {
    try {
      const url = status === 'all' 
        ? "http://localhost:5001/api/orders" 
        : `http://localhost:5001/api/orders?status=${status}`;
        
      const response = await fetch(url, {
        headers: { "Authorization": `Bearer ${token}` }
      });
      
      if (response.ok) {
        const data = await response.json();
        setOrders(data.orders || []);
      }
    } catch (error) {
      console.error("Error fetching orders:", error);
    }
  };

  const updateOrderStatus = async (orderId, newStatus) => {
    try {
      const response = await fetch(`http://localhost:5001/api/orders/${orderId}/status`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({ status: newStatus })
      });

      if (response.ok) {
        // Refresh orders to show updated status
        fetchData();
        alert(`Order status updated to ${newStatus}`);
      } else {
        const error = await response.json();
        alert(`Error updating status: ${error.message}`);
      }
    } catch (error) {
      console.error("Error updating order status:", error);
      alert("Error updating order status");
    }
  };

  const logout = () => {
    localStorage.removeItem("token");
    window.location.reload();
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <p>Loading dashboard...</p>
      </div>
    );
  }

  return (
    <div className="admin-dashboard">
      {/* Header */}
      <header className="admin-header">
        <div className="header-content">
          <div>
            <h1>👑 DineConnect Admin</h1>
            <p>Welcome back, {user.name}!</p>
          </div>
          <button className="logout-btn" onClick={logout}>
            Logout
          </button>
        </div>
      </header>

      {/* Navigation */}
      <div className="admin-nav">
        {[
          { key: 'overview', label: '📊 Overview' },
          { key: 'orders', label: '📋 Orders' },
          { key: 'menu', label: '🍽️ Menu Items' },
          { key: 'categories', label: '📂 Categories' },
          { key: 'tables', label: '🪑 Tables' }
        ].map(tab => (
          <button
            key={tab.key}
            className={`nav-btn ${activeTab === tab.key ? 'active' : ''}`}
            onClick={() => setActiveTab(tab.key)}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="admin-content">
        {activeTab === 'overview' && (
          <div className="overview-section">
            <h2>📈 Today's Overview</h2>
            <div className="stats-grid">
              <div className="stat-card">
                <h3>Total Orders</h3>
                <div className="stat-number">{orders.length}</div>
              </div>
              <div className="stat-card">
                <h3>Revenue Today</h3>
                <div className="stat-number">₹{stats.todayRevenue || 0}</div>
              </div>
              <div className="stat-card">
                <h3>Menu Items</h3>
                <div className="stat-number">{items.length}</div>
              </div>
              <div className="stat-card">
                <h3>Active Tables</h3>
                <div className="stat-number">{tables.length}</div>
              </div>
            </div>
            
            {orders.length > 0 && (
              <div className="order-summary">
                <h3>📋 Order Status Summary</h3>
                <div className="status-summary">
                  <div className="status-item">
                    <span className="status-label">Placed:</span>
                    <span className="status-count">{orders.filter(o => o.status === 'placed').length}</span>
                  </div>
                  <div className="status-item">
                    <span className="status-label">Preparing:</span>
                    <span className="status-count">{orders.filter(o => o.status === 'preparing').length}</span>
                  </div>
                  <div className="status-item">
                    <span className="status-label">Ready:</span>
                    <span className="status-count">{orders.filter(o => o.status === 'ready').length}</span>
                  </div>
                  <div className="status-item">
                    <span className="status-label">Served:</span>
                    <span className="status-count">{orders.filter(o => o.status === 'served').length}</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === 'orders' && (
          <div className="orders-section">
            <div className="section-header">
              <h2>📋 Order Management</h2>
              <div className="order-filters">
                <select onChange={(e) => fetchOrdersByStatus(e.target.value)}>
                  <option value="all">All Orders</option>
                  <option value="placed">Placed</option>
                  <option value="preparing">Preparing</option>
                  <option value="ready">Ready</option>
                  <option value="served">Served</option>
                </select>
              </div>
            </div>
            
            <div className="orders-grid">
              {orders.length === 0 ? (
                <div className="no-items">
                  <p>No orders found.</p>
                </div>
              ) : (
                orders.map(order => (
                  <div key={order._id} className="admin-order-card">
                    <div className="order-header">
                      <div className="order-number">#{order.orderNumber}</div>
                      <div className={`order-status status-${order.status}`}>
                        {order.status.toUpperCase()}
                      </div>
                    </div>
                    
                    <div className="order-details">
                      <div className="order-info">
                        <div className="order-customer">
                          👤 {order.customerId?.name || 'Guest Customer'}
                        </div>
                        <div className="order-table">
                          📍 Table {order.tableId?.number || 'N/A'}
                        </div>
                        <div className="order-time">
                          🕒 {new Date(order.createdAt).toLocaleString()}
                        </div>
                      </div>
                      
                      <div className="order-items">
                        <h4>Items:</h4>
                        {order.items.map((item, index) => (
                          <div key={index} className="order-item">
                            <span>{item.menuItemId?.name || 'Unknown Item'}</span>
                            <span>x{item.qty}</span>
                            <span>₹{item.price * item.qty}</span>
                          </div>
                        ))}
                      </div>
                      
                      <div className="order-total">
                        <strong>Total: ₹{order.total}</strong>
                      </div>
                      
                      <div className="order-actions">
                        <select 
                          value={order.status} 
                          onChange={(e) => updateOrderStatus(order._id, e.target.value)}
                          className="status-select"
                        >
                          <option value="placed">Placed</option>
                          <option value="preparing">Preparing</option>
                          <option value="ready">Ready</option>
                          <option value="served">Served</option>
                        </select>
                        <button 
                          className="view-receipt-btn"
                          onClick={() => alert(`Receipt for Order #${order.orderNumber}`)}
                        >
                          📄 Receipt
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {activeTab === 'menu' && (
          <div className="menu-section">
            <div className="section-header">
              <h2>🍽️ Menu Items</h2>
              <button className="add-btn" onClick={() => alert("Add Item feature - Coming soon!")}>
                + Add Item
              </button>
            </div>
            <div className="items-grid">
              {items.map(item => (
                <div key={item._id} className="admin-item-card">
                  <img src={item.imageUrl || 'https://via.placeholder.com/150'} alt={item.name} />
                  <div className="item-info">
                    <h4>{item.name}</h4>
                    <p>{item.description}</p>
                    <div className="item-price">₹{item.price}</div>
                    <div className="item-actions">
                      <button
                        className={`availability-btn ${item.availability ? 'available' : 'unavailable'}`}
                        onClick={() => toggleItemAvailability(item._id, item.availability)}
                      >
                        {item.availability ? '✅ Available' : '❌ Unavailable'}
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'categories' && (
          <div className="categories-section">
            <div className="section-header">
              <h2>📂 Categories</h2>
              <button className="add-btn" onClick={() => alert("Add Category feature - Coming soon!")}>
                + Add Category
              </button>
            </div>
            <div className="categories-list">
              {categories.map(category => (
                <div key={category._id} className="category-item">
                  <span className="category-icon">{category.icon}</span>
                  <span className="category-name">{category.name}</span>
                  <span className="category-status">
                    {category.active ? '✅ Active' : '❌ Inactive'}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'tables' && (
          <div className="tables-section">
            <div className="section-header">
              <h2>🪑 Tables</h2>
              <button className="add-btn" onClick={createTable}>
                + Add Table
              </button>
            </div>
            <div className="tables-grid">
              {tables.map(table => (
                <div key={table._id} className="table-card">
                  <div className="table-header">
                    <div className="table-number">Table {table.number}</div>
                    <div className="table-capacity">Capacity: {table.capacity}</div>
                  </div>
                  
                  <div className="table-qr-preview">
                    <QRCodeDisplay 
                      value={`http://${window.location.hostname === 'localhost' ? '10.151.242.51' : window.location.hostname}:3001/m/${table.qrSlug}`}
                      size={120}
                    />
                  </div>
                  
                  <div className="table-actions">
                    <button
                      className="qr-btn"
                      onClick={() => generateQR(table._id)}
                    >
                      📱 Download QR
                    </button>
                    <button
                      className="view-menu-btn"
                      onClick={() => window.open(`http://${window.location.hostname === 'localhost' ? '10.151.242.51' : window.location.hostname}:3001/m/${table.qrSlug}`, '_blank')}
                    >
                      🍽️ Test Menu
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
