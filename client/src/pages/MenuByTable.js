import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import MenuItemCard from "../components/MenuItemCard";
import Cart from "../components/Cart";
import NotificationBell from "../components/NotificationBell";
import VoiceOrdering from "../components/VoiceOrdering";
import config from "../config";
import { useNotification } from "../contexts/NotificationContext";
import "../App.css";

export default function MenuByTable() {
  const { tableSlug } = useParams();
  const [table, setTable] = useState(null);
  const [menu, setMenu] = useState([]);
  const [categories, setCategories] = useState([]);
  const [cart, setCart] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [showCart, setShowCart] = useState(false);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [guestSession] = useState(() => 'guest-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9));
  const { joinRoom, requestNotificationPermission } = useNotification();

  useEffect(() => {
    fetchTableInfo();
    fetchMenu();
    fetchCategories();
    loadCart();
  }, [tableSlug]);

  useEffect(() => {
    // Join table-specific notification room for guest users
    if (table) {
      joinRoom('customer', guestSession, table.tableId);
      requestNotificationPermission();
    }
  }, [table, guestSession, joinRoom, requestNotificationPermission]);

  const fetchTableInfo = async () => {
    try {
      const response = await fetch(`${config.API_BASE_URL}/tables/by-slug/${tableSlug}`);
      if (response.ok) {
        const data = await response.json();
        setTable(data);
        localStorage.setItem('currentTable', JSON.stringify(data));
      } else {
        console.error('Table not found');
      }
    } catch (error) {
      console.error('Error fetching table info:', error);
    }
  };

  const fetchMenu = async () => {
    try {
      const response = await fetch(`${config.API_BASE_URL}/menu/items?availability=true&limit=100`);
      const data = await response.json();
      setMenu(data.items || []);
    } catch (error) {
      console.error('Error fetching menu:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const response = await fetch(`${config.API_BASE_URL}/menu/categories`);
      const data = await response.json();
      setCategories(data);
    } catch (error) {
      console.error('Error fetching categories:', error);
    }
  };

  const loadCart = () => {
    const saved = localStorage.getItem(`cart-${tableSlug}`);
    if (saved) {
      setCart(JSON.parse(saved));
    }
  };

  const addToCart = (item) => {
    const existingIndex = cart.findIndex(c => c._id === item._id);
    let newCart;
    
    if (existingIndex >= 0) {
      newCart = [...cart];
      newCart[existingIndex].qty += 1;
    } else {
      newCart = [...cart, { ...item, qty: 1 }];
    }

    setCart(newCart);
    localStorage.setItem(`cart-${tableSlug}`, JSON.stringify(newCart));
  };

  const updateCartItem = (itemId, newQty) => {
    if (newQty === 0) {
      const newCart = cart.filter(item => item._id !== itemId);
      setCart(newCart);
      localStorage.setItem(`cart-${tableSlug}`, JSON.stringify(newCart));
    } else {
      const newCart = cart.map(item => 
        item._id === itemId ? { ...item, qty: newQty } : item
      );
      setCart(newCart);
      localStorage.setItem(`cart-${tableSlug}`, JSON.stringify(newCart));
    }
  };

  const handleVoiceSearch = (searchQuery) => {
    // Extract search terms from voice command
    const query = searchQuery.toLowerCase();
    
    if (query.includes('show') || query.includes('search')) {
      // Extract the item type from voice command
      const searchTerms = ['biryani', 'chicken', 'mutton', 'dal', 'roti', 'drink', 'lassi', 'tea', 'coffee'];
      const foundTerm = searchTerms.find(term => query.includes(term));
      
      if (foundTerm) {
        setSearchTerm(foundTerm);
        
        // Also set category if applicable
        const categoryMap = {
          'biryani': 'Main Course',
          'chicken': 'Main Course', 
          'mutton': 'Main Course',
          'dal': 'Main Course',
          'roti': 'Breads',
          'drink': 'Beverages',
          'lassi': 'Beverages',
          'tea': 'Beverages',
          'coffee': 'Beverages'
        };
        
        const category = categoryMap[foundTerm];
        if (category && categories.find(cat => cat.name === category)) {
          setSelectedCategory(category);
        }
      } else {
        // General search
        setSearchTerm(query.replace(/show|search|me|for/g, '').trim());
      }
    }
  };

  const placeOrder = async () => {
    if (!table || cart.length === 0) return null;

    try {
      const orderData = {
        tableId: table.tableId,
        guestSession,
        items: cart.map(item => ({
          menuItemId: item._id,
          qty: item.qty,
          note: ""
        }))
      };

      const response = await fetch(`${config.API_BASE_URL}/orders`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(orderData)
      });

      if (response.ok) {
        const order = await response.json();
        setCart([]);
        localStorage.removeItem(`cart-${tableSlug}`);
        return order; // Return order for receipt
      } else {
        const error = await response.json();
        alert(`Error: ${error.message}`);
        return null;
      }
    } catch (error) {
      console.error('Error placing order:', error);
      alert('Error placing order. Please try again.');
      return null;
    }
  };

  const filteredMenu = menu.filter(item => {
    const matchesCategory = selectedCategory === "All" || 
      categories.find(cat => cat._id === item.categoryId?._id)?.name === selectedCategory;
    
    const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.description.toLowerCase().includes(searchTerm.toLowerCase());
    
    return matchesCategory && matchesSearch;
  });

  const cartItemsCount = cart.reduce((total, item) => total + item.qty, 0);

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <p>Loading menu...</p>
      </div>
    );
  }

  if (!table) {
    return (
      <div className="error-container">
        <h2>❌ Table Not Found</h2>
        <p>The QR code you scanned is invalid or the table is not active.</p>
      </div>
    );
  }

  return (
    <div className="table-menu-page">
      {/* Header */}
      <header className="table-header">
        <div className="header-content">
          <div className="table-info">
            <h1>🍽️ Table {table.number}</h1>
            <p>DineConnect</p>
          </div>
          <div className="header-actions">
            <NotificationBell />
            <button 
              className="cart-btn"
              onClick={() => setShowCart(true)}
            >
              🛒 Cart ({cartItemsCount})
            </button>
          </div>
        </div>
      </header>

      {/* Search Bar */}
      <div className="search-container">
        <input
          type="text"
          placeholder="🔍 Search menu items..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="search-input"
        />
      </div>

      {/* Voice Ordering */}
      <VoiceOrdering 
        menuItems={menu}
        onAddToCart={addToCart}
        onVoiceSearch={handleVoiceSearch}
      />

      {/* Category Filter */}
      <div className="category-filter">
        <button
          className={`category-btn ${selectedCategory === "All" ? 'active' : ''}`}
          onClick={() => setSelectedCategory("All")}
        >
          All
        </button>
        {categories.map(category => (
          <button
            key={category._id}
            className={`category-btn ${selectedCategory === category.name ? 'active' : ''}`}
            onClick={() => setSelectedCategory(category.name)}
          >
            {category.icon} {category.name}
          </button>
        ))}
      </div>

      {/* Menu Items */}
      <div className="menu-container">
        <div className="menu-grid">
          {filteredMenu.map(item => (
            <MenuItemCard
              key={item._id}
              item={item}
              onAddToCart={addToCart}
              cartItem={cart.find(c => c._id === item._id)}
            />
          ))}
        </div>
        
        {filteredMenu.length === 0 && (
          <div className="no-items">
            <p>No items found matching your criteria.</p>
          </div>
        )}
      </div>

      {/* Cart Modal */}
      {showCart && (
        <Cart
          cart={cart}
          onClose={() => setShowCart(false)}
          onUpdateItem={updateCartItem}
          onPlaceOrder={placeOrder}
          isGuest={true}
        />
      )}
    </div>
  );
}