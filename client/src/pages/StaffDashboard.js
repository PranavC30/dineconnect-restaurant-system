import { useEffect, useState } from "react";
import Receipt from "../components/Receipt";
import NotificationBell from "../components/NotificationBell";
import { useNotification } from "../contexts/NotificationContext";
import config from "../config";
import "../App.css";

export default function StaffDashboard({ user }) {
  const [orders, setOrders] = useState([]);
  const { joinRoom, requestNotificationPermission } = useNotification();
  const [selectedStatus, setSelectedStatus] = useState("all");
  const [loading, setLoading] = useState(true);
  const [showReceipt, setShowReceipt] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const token = localStorage.getItem("token");

  const fetchOrders = async () => {
    try {
      const url = selectedStatus === "all" 
        ? `${config.API_BASE_URL}/orders` 
        : `${config.API_BASE_URL}/orders?status=${selectedStatus}`;
        
      const res = await fetch(url, {
        headers: { "Authorization": `Bearer ${token}` }
      });
      const data = await res.json();
      setOrders(data.orders || []);
    } catch (err) {
      console.error("Error fetching orders:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
    const interval = setInterval(fetchOrders, 10000); // polling every 10 sec
    
    // Join kitchen notification room
    if (user) {
      joinRoom('staff', user.userId);
      requestNotificationPermission();
    }
    
    return () => clearInterval(interval);
  }, [selectedStatus, user, joinRoom, requestNotificationPermission]);

  const updateStatus = async (id, status) => {
    try {
      const res = await fetch(`${config.API_BASE_URL}/orders/${id}/status`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({ status })
      });
      
      if (res.ok) {
        fetchOrders(); // Refresh orders
        // Optional: Play sound for status updates
        if (status === 'ready') {
          // You can add sound notification here
          console.log("🔔 Order ready!");
        }
      }
    } catch (err) {
      console.error("Error updating status:", err);
    }
  };

  const logout = () => {
    localStorage.removeItem("token");
    window.location.reload();
  };

  const getStatusActions = (order) => {
    const actions = [];
    
    if (order.status === 'placed') {
      actions.push(
        <button 
          key="preparing" 
          className="status-btn preparing"
          onClick={() => updateStatus(order._id, 'preparing')}
        >
          Start Preparing
        </button>
      );
    }
    
    if (order.status === 'preparing') {
      actions.push(
        <button 
          key="ready" 
          className="status-btn ready"
          onClick={() => updateStatus(order._id, 'ready')}
        >
          Mark Ready
        </button>
      );
    }
    
    if (order.status === 'ready') {
      actions.push(
        <button 
          key="served" 
          className="status-btn served"
          onClick={() => updateStatus(order._id, 'served')}
        >
          Mark Served
        </button>
      );
    }
    
    if (['placed', 'preparing'].includes(order.status)) {
      actions.push(
        <button 
          key="cancel" 
          className="status-btn cancel"
          onClick={() => updateStatus(order._id, 'canceled')}
        >
          Cancel
        </button>
      );
    }
    
    return actions;
  };



  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <p>Loading orders...</p>
      </div>
    );
  }

  return (
    <div className="staff-dashboard">
      {/* Header */}
      <header className="staff-header">
        <div className="header-content">
          <div>
            <h1>👨‍🍳 DineConnect Staff</h1>
            <p>Welcome back, {user.name}!</p>
          </div>
          <div className="header-actions">
            <button 
              className="refresh-btn"
              onClick={fetchOrders}
              disabled={loading}
              title="Refresh orders"
            >
              🔄 {loading ? 'Loading...' : 'Refresh'}
            </button>
            <NotificationBell />
            <button className="logout-btn" onClick={logout}>
              Logout
            </button>
          </div>
        </div>
      </header>

      {/* Order Filters */}
      <div className="order-filters">
        {['all', 'placed', 'preparing', 'ready', 'served'].map(status => (
          <button
            key={status}
            className={`filter-btn ${selectedStatus === status ? 'active' : ''}`}
            onClick={() => setSelectedStatus(status)}
          >
            {status.charAt(0).toUpperCase() + status.slice(1)}
            {status !== 'all' && ` (${orders.filter(o => o.status === status).length})`}
          </button>
        ))}
      </div>

      {/* Orders Grid */}
      <div className="orders-grid">
        {orders.length === 0 ? (
          <div className="no-items">
            <p>No orders found for the selected status.</p>
          </div>
        ) : (
          orders.map(order => (
            <div key={order._id} className="order-card">
              <div className="order-header">
                <div className="order-number">#{order.orderNumber}</div>
                <div className={`order-status status-${order.status}`}>
                  {order.status}
                </div>
              </div>
              
              <div className="order-info">
                <div className="order-table">
                  📍 Table {order.tableId?.number || 'N/A'}
                </div>
                <div className="order-customer">
                  👤 {order.customerId?.name || 'Guest Customer'}
                </div>
              </div>
              
              <div className="order-items">
                {order.items.map((item, index) => (
                  <div key={index} className="order-item">
                    <span>{item.menuItemId?.name || 'Unknown Item'}</span>
                    <span>x{item.qty}</span>
                  </div>
                ))}
              </div>
              
              <div className="order-total">
                Total: ₹{order.total}
              </div>
              
              <div className="order-time">
                {new Date(order.createdAt).toLocaleTimeString()}
              </div>
              
              <div className="status-actions">
                {getStatusActions(order)}
                <button 
                  className="status-btn receipt"
                  onClick={() => {
                    setSelectedOrder(order);
                    setShowReceipt(true);
                  }}
                >
                  📄 Receipt
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Receipt Modal */}
      {showReceipt && selectedOrder && (
        <Receipt
          order={selectedOrder}
          onClose={() => {
            setShowReceipt(false);
            setSelectedOrder(null);
          }}
          restaurantInfo={{
            name: "DineConnect",
            address: "123 Food Street, Restaurant City",
            phone: "+91-9876543210",
            gst: "22AAAAA0000A1Z5"
          }}
        />
      )}
    </div>
  );
}
