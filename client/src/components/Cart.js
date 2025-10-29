import { useState } from "react";
import Receipt from "./Receipt";
import "../App.css";

export default function Cart({ cart, onClose, onUpdateItem, onPlaceOrder, isGuest = false }) {
  const [showReceipt, setShowReceipt] = useState(false);
  const [lastOrder, setLastOrder] = useState(null);
  const total = cart.reduce((sum, item) => sum + (item.price * item.qty), 0);

  const updateQuantity = (itemId, newQty) => {
    onUpdateItem(itemId, newQty);
  };

  const handlePlaceOrder = async () => {
    if (cart.length === 0) {
      alert("Cart is empty!");
      return;
    }

    if (onPlaceOrder) {
      const order = await onPlaceOrder();
      if (order) {
        setLastOrder(order);
        setShowReceipt(true);
      }
    } else {
      // Default order placement for logged-in users
      const token = localStorage.getItem("token");
      if (!token) {
        alert("Please login first!");
        return;
      }
      
      try {
        // Create order via API (using default table for now)
        const orderData = {
          tableId: null, // Will be handled by backend to assign default table
          items: cart.map(item => ({
            menuItemId: item._id,
            qty: item.qty,
            note: ""
          }))
        };

        const response = await fetch("http://localhost:5001/api/orders", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`
          },
          body: JSON.stringify(orderData)
        });

        if (response.ok) {
          const order = await response.json();
          console.log("Order created successfully:", order);
          setLastOrder(order);
          setShowReceipt(true);
          alert(`Order placed successfully! Order #${order.orderNumber}`);
          cart.forEach(item => onUpdateItem(item._id, 0));
        } else {
          const error = await response.json();
          console.error("Order creation failed:", error);
          alert(`Failed to place order: ${error.message}`);
        }
      } catch (error) {
        console.error("Error placing order:", error);
        alert("Failed to place order. Please try again.");
      }
      onClose();
    }
  };

  return (
    <div className="cart-modal-overlay" onClick={onClose}>
      <div className="cart-modal" onClick={(e) => e.stopPropagation()}>
        <div className="cart-header">
          <h2>🛒 Your Cart</h2>
          <button className="close-btn" onClick={onClose}>×</button>
        </div>

        <div className="cart-content">
          {cart.length === 0 ? (
            <div className="empty-cart">
              <p>Your cart is empty</p>
              <p>Add some delicious items!</p>
            </div>
          ) : (
            <>
              <div className="cart-items">
                {cart.map((item) => (
                  <div key={item._id} className="cart-item">
                    <img src={item.img} alt={item.name} className="cart-item-image" />
                    <div className="cart-item-details">
                      <h4>{item.name}</h4>
                      <p className="cart-item-price">₹{item.price}</p>
                    </div>
                    <div className="quantity-controls">
                      <button 
                        className="qty-btn"
                        onClick={() => updateQuantity(item._id, item.qty - 1)}
                      >
                        -
                      </button>
                      <span className="quantity">{item.qty}</span>
                      <button 
                        className="qty-btn"
                        onClick={() => updateQuantity(item._id, item.qty + 1)}
                      >
                        +
                      </button>
                    </div>
                    <div className="item-total">
                      ₹{item.price * item.qty}
                    </div>
                  </div>
                ))}
              </div>

              <div className="cart-summary">
                <div className="total-amount">
                  <strong>Total: ₹{total}</strong>
                </div>
                <button className="place-order-btn" onClick={handlePlaceOrder}>
                  🍽️ {isGuest ? 'Place Order' : 'Place Order'}
                </button>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Receipt Modal */}
      {showReceipt && lastOrder && (
        <Receipt
          order={lastOrder}
          onClose={() => {
            setShowReceipt(false);
            onClose();
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
