import React, { useState, useEffect } from 'react';
import './VoiceAssistant.css';

const VoiceAssistant = ({ menuItems, onPlaceOrder, customerName }) => {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [recognition, setRecognition] = useState(null);
  const [isSupported, setIsSupported] = useState(false);
  const [conversation, setConversation] = useState([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [currentOrder, setCurrentOrder] = useState([]);
  const [pendingOrder, setPendingOrder] = useState(null); // Store order for confirmation

  useEffect(() => {
    // Check if browser supports speech recognition
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    
    if (SpeechRecognition) {
      setIsSupported(true);
      const recognitionInstance = new SpeechRecognition();
      
      // Configuration
      recognitionInstance.continuous = false;
      recognitionInstance.interimResults = true;
      recognitionInstance.lang = 'en-IN'; // English + Hindi
      
      // Event handlers
      recognitionInstance.onstart = () => {
        setIsListening(true);
        setTranscript('');
      };
      
      recognitionInstance.onresult = (event) => {
        let finalTranscript = '';
        let interimTranscript = '';
        
        for (let i = event.resultIndex; i < event.results.length; i++) {
          const transcript = event.results[i][0].transcript;
          if (event.results[i].isFinal) {
            finalTranscript += transcript;
          } else {
            interimTranscript += transcript;
          }
        }
        
        setTranscript(finalTranscript || interimTranscript);
        console.log('🔍 Debug - Speech recognition result:', finalTranscript || interimTranscript); // Debug log
        
        if (finalTranscript) {
          console.log('🔍 Debug - Processing final transcript:', finalTranscript); // Debug log
          processVoiceInput(finalTranscript);
        }
      };
      
      recognitionInstance.onerror = (event) => {
        setIsListening(false);
        addToConversation('system', `❌ Sorry, I couldn't hear you clearly. Please try again.`);
      };
      
      recognitionInstance.onend = () => {
        setIsListening(false);
      };
      
      setRecognition(recognitionInstance);
    }

    // Welcome message
    addToConversation('assistant', `🎉 Hi ${customerName || 'there'}! I'm your DineConnect voice assistant. Just say "Hi DineConnect, I want [food item]" and I'll automatically add it to your cart!`);
  }, [customerName]);

  const addToConversation = (sender, message) => {
    setConversation(prev => [...prev, { sender, message, timestamp: new Date() }]);
  };

  const processVoiceInput = async (input) => {
    setIsProcessing(true);
    addToConversation('customer', input);
    
    const lowerInput = input.toLowerCase().trim();
    console.log('🔍 Debug - Processing input:', `"${lowerInput}"`); // Debug log
    
    // Check for order confirmation (multiple phrases)
    if (lowerInput === 'yes' || lowerInput === 'yeah' || lowerInput === 'yep' || 
        lowerInput.includes('yes') || lowerInput.includes('confirm') || 
        lowerInput.includes('place order') || lowerInput.includes('add to cart') ||
        lowerInput.includes('dine place my order') || lowerInput.includes('place my order') ||
        lowerInput.includes('dineconnect place') || lowerInput.includes('go ahead') ||
        lowerInput.includes('proceed') || lowerInput.includes('that\'s correct') ||
        lowerInput.includes('sounds good') || lowerInput.includes('perfect')) {
      console.log('🔍 Debug - Detected confirmation command:', lowerInput); // Debug log
      confirmAndPlaceOrder();
    }
    // Check for order cancellation
    else if (lowerInput === 'no' || lowerInput === 'nope' || 
             lowerInput.includes('no') || lowerInput.includes('cancel') || 
             lowerInput.includes('change')) {
      console.log('🔍 Debug - Detected cancellation command'); // Debug log
      cancelCurrentOrder();
    }
    // Check for greeting and order initiation
    else if (lowerInput.includes('hi dineconnect') || lowerInput.includes('hello dineconnect')) {
      if (lowerInput.includes('take my order') || lowerInput.includes('order')) {
        handleOrderInitiation(input);
      } else {
        respondToGreeting();
      }
    }
    // Check for direct orders
    else if (lowerInput.includes('i want') || lowerInput.includes('i wanna') || lowerInput.includes('order')) {
      handleDirectOrder(input);
    }
    // Check for menu inquiry
    else if (lowerInput.includes('what do you have') || lowerInput.includes('menu') || lowerInput.includes('available')) {
      showMenuOptions();
    }
    else {
      // Try to extract items anyway
      const items = extractItemsFromSpeech(input);
      if (items.length > 0) {
        handleDirectOrder(input);
      } else {
        handleUnknownInput();
      }
    }
    
    setIsProcessing(false);
  };

  const handleOrderInitiation = (input) => {
    // Extract items from the initial order request
    const items = extractItemsFromSpeech(input);
    
    console.log('🔍 Debug - Items found:', items); // Debug log
    
    if (items.length > 0) {
      // Auto-add to cart without confirmation for smoother experience
      setCurrentOrder(items);
      setPendingOrder(items);
      
      // Directly add to cart
      addItemsToCart(items);
      
      const itemsList = items.map(item => `${item.quantity} ${item.name} (₹${item.price * item.quantity})`).join(', ');
      const total = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
      
      const response = `🎉 Perfect! I've added ${itemsList} to your cart. Total: ₹${total}. The cart will open now so you can review and place your order!`;
      addToConversation('assistant', response);
      speakResponse(response);
      
      setCurrentOrder([]);
      setPendingOrder(null);
    } else {
      const response = `🎤 I'm ready to take your order! What would you like to have today? You can say something like "I want cold coffee" or "I want chicken biryani".`;
      addToConversation('assistant', response);
      speakResponse(response);
    }
  };

  const handleDirectOrder = (input) => {
    const items = extractItemsFromSpeech(input);
    
    console.log('🔍 Debug - Direct order items:', items); // Debug log
    
    if (items.length > 0) {
      // Auto-add to cart without confirmation for smoother experience
      setCurrentOrder(items);
      setPendingOrder(items);
      
      // Directly add to cart
      addItemsToCart(items);
      
      const itemsList = items.map(item => `${item.quantity} ${item.name} (₹${item.price * item.quantity})`).join(', ');
      const total = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
      
      const response = `🎉 Excellent! I've added ${itemsList} to your cart. Total: ₹${total}. The cart will open now so you can review and place your order!`;
      addToConversation('assistant', response);
      speakResponse(response);
      
      setCurrentOrder([]);
      setPendingOrder(null);
    } else {
      const response = `🤔 I couldn't find those items on our menu. Could you try again? Say something like "I want cold coffee" or ask "what do you have?" to see our menu.`;
      addToConversation('assistant', response);
      speakResponse(response);
    }
  };

  const addItemsToCart = async (items) => {
    try {
      // Add items to cart
      const result = await onPlaceOrder(items);
      console.log('🔍 Debug - Items added to cart successfully:', result);
      return result;
    } catch (error) {
      console.error('🔍 Debug - Error adding items to cart:', error);
      const response = `😅 Sorry, there was an issue adding items to your cart. Please try again or add items manually.`;
      addToConversation('assistant', response);
      speakResponse(response);
      throw error;
    }
  };

  const confirmAndPlaceOrder = async () => {
    console.log('🔍 Debug - Current order when confirming:', currentOrder); // Debug log
    console.log('🔍 Debug - Pending order when confirming:', pendingOrder); // Debug log
    
    const orderToProcess = pendingOrder || currentOrder;
    
    if (orderToProcess && orderToProcess.length > 0) {
      try {
        // Add items to cart
        await addItemsToCart(orderToProcess);
        
        const response = `🎉 Perfect! I've added your items to the cart. The cart will open now so you can review and place your final order. Thank you for using DineConnect!`;
        addToConversation('assistant', response);
        speakResponse(response);
        
        setCurrentOrder([]);
        setPendingOrder(null);
      } catch (error) {
        // Error already handled in addItemsToCart
      }
    } else {
      const response = `🤔 I don't have any items in your current order. Please tell me what you'd like to order first. Try saying "I want cold coffee".`;
      addToConversation('assistant', response);
      speakResponse(response);
    }
  };

  const cancelCurrentOrder = () => {
    setCurrentOrder([]);
    setPendingOrder(null);
    const response = `👍 No problem! Your order has been cleared. What would you like to order instead?`;
    addToConversation('assistant', response);
    speakResponse(response);
  };

  const showMenuOptions = () => {
    const categories = [...new Set(menuItems.map(item => item.categoryId?.name).filter(Boolean))];
    const popularItems = menuItems.slice(0, 5).map(item => item.name).join(', ');
    
    const response = `🍽️ We have ${categories.join(', ')} and more! Some popular items are: ${popularItems}. What catches your interest?`;
    addToConversation('assistant', response);
    speakResponse(response);
  };

  const handleUnknownInput = () => {
    const responses = [
      `🤔 I didn't quite catch that. Could you try saying "I want [item name]" or "Hi DineConnect, take my order"?`,
      `😊 Sorry, I'm still learning! Try saying something like "I want chicken biryani" or "show me the menu".`,
      `🎤 Let me help you! Say "Hi DineConnect, I want [food item]" and I'll take care of the rest.`
    ];
    
    const response = responses[Math.floor(Math.random() * responses.length)];
    addToConversation('assistant', response);
    speakResponse(response);
  };

  const respondToGreeting = () => {
    const response = `👋 Hello! Great to meet you! I'm here to help you order. Just say "take my order" and tell me what you'd like to have.`;
    addToConversation('assistant', response);
    speakResponse(response);
  };

  const extractItemsFromSpeech = (speech) => {
    const foundItems = [];
    const lowerSpeech = speech.toLowerCase();
    
    // Extract numbers
    const numbers = lowerSpeech.match(/\b(one|two|three|four|five|six|seven|eight|nine|ten|\d+)\b/g) || [];
    const quantities = numbers.map(num => {
      const numberMap = { one: 1, two: 2, three: 3, four: 4, five: 5, six: 6, seven: 7, eight: 8, nine: 9, ten: 10 };
      return numberMap[num] || parseInt(num) || 1;
    });
    
    // Find matching menu items
    menuItems.forEach(item => {
      const itemName = item.name.toLowerCase();
      const itemWords = itemName.split(' ');
      
      // Check for exact or partial matches
      const hasMatch = itemWords.some(word => 
        lowerSpeech.includes(word) || 
        lowerSpeech.includes(word.substring(0, Math.max(4, word.length - 2)))
      );
      
      // Check for common food terms
      const foodAliases = {
        'coffee': ['coffee', 'kafi', 'cold coffee'],
        'tea': ['tea', 'chai', 'masala tea'],
        'biryani': ['biryani', 'biriyani', 'rice'],
        'chicken': ['chicken', 'murgh'],
        'mutton': ['mutton', 'goat'],
        'dal': ['dal', 'lentil'],
        'roti': ['roti', 'chapati', 'bread'],
        'lassi': ['lassi', 'yogurt drink', 'mango lassi'],
        'cold drink': ['cold drink', 'soft drink', 'soda', 'coke', 'pepsi']
      };
      
      console.log('🔍 Debug - Checking item:', itemName, 'against speech:', lowerSpeech); // Debug log
      
      Object.entries(foodAliases).forEach(([key, aliases]) => {
        if (itemName.includes(key) && aliases.some(alias => lowerSpeech.includes(alias))) {
          if (!foundItems.find(fi => fi.id === item._id)) {
            const quantity = quantities[foundItems.length] || 1;
            foundItems.push({
              id: item._id,
              name: item.name,
              price: item.price,
              quantity: quantity
            });
          }
        }
      });
      
      if (hasMatch && !foundItems.find(fi => fi.id === item._id)) {
        const quantity = quantities[foundItems.length] || 1;
        foundItems.push({
          id: item._id,
          name: item.name,
          price: item.price,
          quantity: quantity
        });
      }
    });
    
    console.log('🔍 Debug - Final found items:', foundItems); // Debug log
    return foundItems;
  };

  const speakResponse = (text) => {
    if ('speechSynthesis' in window) {
      // Cancel any ongoing speech
      window.speechSynthesis.cancel();
      
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'en-IN';
      utterance.rate = 0.9;
      utterance.pitch = 1.1;
      utterance.volume = 0.8;
      
      window.speechSynthesis.speak(utterance);
    }
  };

  const startListening = () => {
    if (recognition && !isListening) {
      recognition.start();
    }
  };

  const stopListening = () => {
    if (recognition && isListening) {
      recognition.stop();
    }
  };

  if (!isSupported) {
    return (
      <div className="voice-assistant voice-not-supported">
        <h3>🎤 Voice Assistant</h3>
        <p>❌ Voice ordering not supported in this browser</p>
        <p>Please use Chrome, Edge, or Safari for the best experience</p>
      </div>
    );
  }

  return (
    <div className="voice-assistant">
      <div className="voice-header">
        <h3>🤖 DineConnect Voice Assistant</h3>
        <p>Say "Hi DineConnect, please take my order" to get started!</p>
      </div>

      <div className="conversation-area">
        {conversation.map((msg, index) => (
          <div key={index} className={`message ${msg.sender}`}>
            <div className="message-content">
              <span className="sender-icon">
                {msg.sender === 'customer' ? '👤' : msg.sender === 'assistant' ? '🤖' : '⚙️'}
              </span>
              <span className="message-text">{msg.message}</span>
            </div>
          </div>
        ))}
        
        {isProcessing && (
          <div className="message assistant">
            <div className="message-content">
              <span className="sender-icon">🤖</span>
              <span className="message-text typing">Thinking...</span>
            </div>
          </div>
        )}
      </div>

      {transcript && (
        <div className="current-transcript">
          <strong>🎤 You're saying:</strong> "{transcript}"
        </div>
      )}

      <div className="voice-controls">
        <button 
          className={`voice-btn ${isListening ? 'listening' : ''}`}
          onClick={isListening ? stopListening : startListening}
          disabled={!isSupported || isProcessing}
        >
          {isListening ? (
            <>
              <span className="pulse-icon">🎤</span>
              Listening... Tap to Stop
            </>
          ) : (
            <>
              🎤 Start Voice Order
            </>
          )}
        </button>

      </div>

      {((pendingOrder && pendingOrder.length > 0) || (currentOrder && currentOrder.length > 0)) && (
        <div className="current-order">
          <h4>📋 Current Order:</h4>
          {(pendingOrder || currentOrder || []).map((item, index) => (
            <div key={index} className="order-item">
              {item.quantity}x {item.name} - ₹{item.price * item.quantity}
            </div>
          ))}
          <div className="order-total">
            <strong>Total: ₹{(pendingOrder || currentOrder || []).reduce((sum, item) => sum + (item.price * item.quantity), 0)}</strong>
          </div>
        </div>
      )}

      <div className="voice-examples">
        <h4>💡 Voice Commands:</h4>
        <div className="examples-grid">
          <div className="example-category">
            <strong>🍽️ Auto-Order (No Confirmation Needed!):</strong>
            <ul>
              <li>"Hi DineConnect, I want cold coffee"</li>
              <li>"I want 2 chicken biryani"</li>
              <li>"Order 1 mango lassi please"</li>
              <li>"I wanna have dal and roti"</li>
            </ul>
          </div>
          <div className="example-category">
            <strong>🔍 Menu Inquiry:</strong>
            <ul>
              <li>"What do you have?"</li>
              <li>"Show me drinks"</li>
              <li>"What's available?"</li>
              <li>"Show me the menu"</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VoiceAssistant;