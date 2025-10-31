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
  const [voiceGender, setVoiceGender] = useState('female'); // male or female voice
  const [language, setLanguage] = useState('hi-IN'); // Hindi-English mix

  useEffect(() => {
    // Check if browser supports speech recognition
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    
    if (SpeechRecognition) {
      setIsSupported(true);
      const recognitionInstance = new SpeechRecognition();
      
      // Configuration
      recognitionInstance.continuous = false;
      recognitionInstance.interimResults = true;
      recognitionInstance.lang = language; // Dynamic language
      
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

    // Load voices
    const loadVoices = () => {
      const voices = window.speechSynthesis.getVoices();
      console.log('🔍 Voices loaded:', voices.length);
    };
    
    // Load voices when they become available
    if (window.speechSynthesis.onvoiceschanged !== undefined) {
      window.speechSynthesis.onvoiceschanged = loadVoices;
    }
    loadVoices();

    // Welcome message
    addToConversation('assistant', `🎉 Hi ${customerName || 'there'}! I'm Dine, your smart dining assistant! Just say "Hey Dine, I want [food item]" and I'll automatically add it to your cart!`);
  }, [customerName]);

  const addToConversation = (sender, message) => {
    setConversation(prev => [...prev, { sender, message, timestamp: new Date() }]);
  };

  const processVoiceInput = async (input) => {
    setIsProcessing(true);
    addToConversation('customer', input);
    
    const lowerInput = input.toLowerCase().trim();
    console.log('🔍 Debug - Processing input:', `"${lowerInput}"`); // Debug log
    
    // Simple test response for any input
    if (lowerInput.includes('hello') || lowerInput.includes('hi') || lowerInput.includes('test')) {
      const response = "🎉 Hello! I can hear you perfectly! I'm Dine, your voice assistant. Try saying 'I want coffee' or 'tell me a joke'!";
      addToConversation('assistant', response);
      speakResponse(response);
      setIsProcessing(false);
      return;
    }

    // Voice test command
    if (lowerInput.includes('voice test') || lowerInput.includes('test voice') || lowerInput.includes('awaaz test')) {
      const response = voiceGender === 'female' ? 
        "💃 This is my female voice! I sound sweet and melodious. How do you like it?" :
        "🕺 This is my male voice! I sound deep and confident. How do you like it?";
      addToConversation('assistant', response);
      speakResponse(response);
      setIsProcessing(false);
      return;
    }
    
    // Voice gender switching
    if (lowerInput.includes('female voice') || lowerInput.includes('ladki ki awaaz') || 
        lowerInput.includes('महिला की आवाज़') || lowerInput.includes('girl voice')) {
      setVoiceGender('female');
      const response = language === 'hi-IN' ? 
        "💃 Ab main female voice mein bol rahi hun! Kaisi lag rahi hai meri awaaz?" :
        "💃 I'm now speaking in female voice! How do I sound?";
      addToConversation('assistant', response);
      speakResponse(response);
      setIsProcessing(false);
      return;
    } else if (lowerInput.includes('male voice') || lowerInput.includes('ladke ki awaaz') || 
               lowerInput.includes('पुरुष की आवाज़') || lowerInput.includes('boy voice')) {
      setVoiceGender('male');
      const response = language === 'hi-IN' ? 
        "🕺 Ab main male voice mein bol raha hun! Kaisi lag rahi hai meri awaaz?" :
        "🕺 I'm now speaking in male voice! How do I sound?";
      addToConversation('assistant', response);
      speakResponse(response);
      setIsProcessing(false);
      return;
    }

    // Language switching
    if (lowerInput.includes('english') || lowerInput.includes('अंग्रेजी')) {
      setLanguage('en-IN');
      addToConversation('assistant', "Switched to English! How can I help you?");
      speakResponse("Switched to English! How can I help you?");
      setIsProcessing(false);
      return;
    } else if (lowerInput.includes('hindi') || lowerInput.includes('हिंदी')) {
      setLanguage('hi-IN');
      addToConversation('assistant', "Hindi mein switch ho gaya! Kya chahiye aapko?");
      speakResponse("Hindi mein switch ho gaya! Kya chahiye aapko?");
      setIsProcessing(false);
      return;
    }

    // Extra fun commands (simplified)
    if (lowerInput.includes('joke') || lowerInput.includes('funny') || lowerInput.includes('hasao')) {
      const jokes = {
        'hi-IN': [
          "😄 Ek customer ne kaha: 'Biryani mein namak kam hai!' Waiter bola: 'Sir, aap tears add kar dijiye!'",
          "🤣 Pizza aur biryani mein kya difference hai? Pizza round hai, biryani heart-shaped!",
          "😂 Customer: 'Ye dal kya hai?' Waiter: 'Sir, ye dal hai!' Customer: 'Nahi, ye toh paani hai!' Waiter: 'Sir, dal bhi swimming seekh gayi hai!'"
        ],
        'en-IN': [
          "😄 Why did the biryani go to therapy? Because it had too many layers of emotions!",
          "🤣 What did the pizza say to the burger? You're bun-believable!",
          "😂 Why don't restaurants serve broken cookies? Because they don't want to deal with crumb-y customers!"
        ]
      };
      const randomJoke = jokes[language][Math.floor(Math.random() * jokes[language].length)];
      addToConversation('assistant', randomJoke);
      speakResponse(randomJoke);
      setIsProcessing(false);
      return;
    }

    // Food recommendations
    if (lowerInput.includes('recommend') || lowerInput.includes('suggest') || 
        lowerInput.includes('सुझाव') || lowerInput.includes('recommend kar') ||
        lowerInput.includes('kya khau') || lowerInput.includes('what should i eat')) {
      const recommendations = language === 'hi-IN' ? 
        `🍽️ Mere favorite items hain: Chicken Biryani (sabse popular!), Cold Coffee (refreshing!), aur Chocolate Brownie (sweet ending ke liye)! Kya try karenge?` :
        `🍽️ My top recommendations are: Chicken Biryani (most popular!), Cold Coffee (so refreshing!), and Chocolate Brownie (perfect sweet ending)! What would you like to try?`;
      addToConversation('assistant', recommendations);
      speakResponse(recommendations);
      setIsProcessing(false);
      return;
    }

    // Time-based greetings
    if (lowerInput.includes('good morning') || lowerInput.includes('सुप्रभात') || 
        lowerInput.includes('suprabhat')) {
      const morningGreeting = language === 'hi-IN' ? 
        "🌅 Suprabhat! Breakfast mein kya lenge? Fresh start ke liye kuch healthy order karte hain!" :
        "🌅 Good morning! What would you like for breakfast? Let's start fresh with something healthy!";
      addToConversation('assistant', morningGreeting);
      speakResponse(morningGreeting);
      setIsProcessing(false);
      return;
    } else if (lowerInput.includes('good evening') || lowerInput.includes('शुभ संध्या') ||
               lowerInput.includes('shubh sandhya')) {
      const eveningGreeting = language === 'hi-IN' ? 
        "🌆 Shubh sandhya! Dinner time hai! Kuch special order karte hain!" :
        "🌆 Good evening! It's dinner time! Let's order something special!";
      addToConversation('assistant', eveningGreeting);
      speakResponse(eveningGreeting);
      setIsProcessing(false);
      return;
    }

    // Thank you responses
    if (lowerInput.includes('thank you') || lowerInput.includes('thanks') ||
        lowerInput.includes('धन्यवाद') || lowerInput.includes('shukriya')) {
      const thankResponse = language === 'hi-IN' ? 
        "🙏 Aapka swagat hai! Meri khushi hai ki main aapki help kar payi! Kuch aur chahiye?" :
        "🙏 You're most welcome! I'm happy I could help you! Anything else you need?";
      addToConversation('assistant', thankResponse);
      speakResponse(thankResponse);
      setIsProcessing(false);
      return;
    }

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
    else if (lowerInput.includes('hi dine') || lowerInput.includes('hello dine') || 
             lowerInput.includes('hey dine') || lowerInput.includes('dine')) {
      if (lowerInput.includes('take my order') || lowerInput.includes('order')) {
        handleOrderInitiation(input);
      } else {
        respondToGreeting();
      }
    }
    // Check for direct orders (enhanced - any food-related word)
    else if (lowerInput.includes('want') || lowerInput.includes('order') || 
             lowerInput.includes('chahiye') || lowerInput.includes('food') ||
             lowerInput.includes('khana') || lowerInput.includes('मुझे') ||
             // Check if speech contains any menu item words
             menuItems.some(item => {
               const itemWords = item.name.toLowerCase().split(/[\s\-\(\)]+/);
               return itemWords.some(word => word.length > 2 && lowerInput.includes(word));
             })) {
      handleDirectOrder(input);
    }
    // Check for menu inquiry
    else if (lowerInput.includes('what do you have') || lowerInput.includes('menu') || 
             lowerInput.includes('available') || lowerInput.includes('show items') ||
             lowerInput.includes('list items') || lowerInput.includes('kya hai')) {
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
    const allItems = menuItems.map(item => item.name).join(', ');
    
    if (menuItems.length <= 10) {
      // If few items, list all
      const response = `🍽️ Here are all our items: ${allItems}. Just say "I want [item name]" to order!`;
      addToConversation('assistant', response);
      speakResponse(response);
    } else {
      // If many items, show categories and some examples
      const popularItems = menuItems.slice(0, 8).map(item => item.name).join(', ');
      const response = `🍽️ We have ${categories.join(', ')} and more! Some items are: ${popularItems}. Just say "I want [any item name]" to order!`;
      addToConversation('assistant', response);
      speakResponse(response);
    }
    
    console.log('🔍 Debug - All menu items for voice recognition:', menuItems.map(item => item.name));
  };

  const handleUnknownInput = () => {
    const responses = [
      `🤔 I heard you, but I'm not sure what you want. Try saying: "I want coffee", "tell me a joke", or "hello"!`,
      `😊 I'm listening! Try simple commands like: "I want biryani", "joke", or "hello Dine"!`,
      `🎤 I can hear you! Try saying: "I want food", "hello", or "joke sunao"!`
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
    
    console.log('🔍 Debug - Analyzing speech:', lowerSpeech); // Debug log
    console.log('🔍 Debug - Available menu items:', menuItems.map(item => item.name)); // Debug log
    
    // Enhanced number extraction (Hindi + English)
    const hindiNumbers = {
      'एक': 1, 'दो': 2, 'तीन': 3, 'चार': 4, 'पांच': 5, 'छह': 6, 'सात': 7, 'आठ': 8, 'नौ': 9, 'दस': 10,
      'ek': 1, 'do': 2, 'teen': 3, 'char': 4, 'panch': 5, 'cheh': 6, 'saat': 7, 'aath': 8, 'nau': 9, 'das': 10,
      'one': 1, 'two': 2, 'three': 3, 'four': 4, 'five': 5, 'six': 6, 'seven': 7, 'eight': 8, 'nine': 9, 'ten': 10
    };
    
    const numbers = lowerSpeech.match(/\b(एक|दो|तीन|चार|पांच|छह|सात|आठ|नौ|दस|ek|do|teen|char|panch|cheh|saat|aath|nau|das|one|two|three|four|five|six|seven|eight|nine|ten|\d+)\b/g) || [];
    const quantities = numbers.map(num => hindiNumbers[num] || parseInt(num) || 1);
    
    // Dynamic item matching for ALL menu items
    menuItems.forEach((item, index) => {
      const itemName = item.name.toLowerCase();
      const itemWords = itemName.split(/[\s\-\(\)]+/).filter(word => word.length > 2); // Split by spaces, hyphens, parentheses
      
      console.log('🔍 Debug - Checking item:', itemName, 'words:', itemWords); // Debug log
      
      let matchScore = 0;
      let matchedWords = [];
      
      // Check each word in the item name
      itemWords.forEach(word => {
        if (word.length < 3) return; // Skip very short words
        
        // Exact word match
        if (lowerSpeech.includes(word)) {
          matchScore += 10;
          matchedWords.push(word);
        }
        // Partial word match (at least 3 characters)
        else if (word.length >= 4 && lowerSpeech.includes(word.substring(0, Math.max(3, word.length - 1)))) {
          matchScore += 5;
          matchedWords.push(word.substring(0, 3) + '...');
        }
        // Phonetic/similar matches
        else {
          const phoneticMatches = getPhoneticMatches(word);
          phoneticMatches.forEach(phoneticWord => {
            if (lowerSpeech.includes(phoneticWord)) {
              matchScore += 7;
              matchedWords.push(phoneticWord);
            }
          });
        }
      });
      
      // Additional scoring for common food terms and categories
      const categoryBonus = getCategoryBonus(itemName, lowerSpeech);
      matchScore += categoryBonus;
      
      console.log('🔍 Debug - Item:', itemName, 'Score:', matchScore, 'Matched words:', matchedWords); // Debug log
      
      // If we have a good match (score >= 5), add to found items
      if (matchScore >= 5 && !foundItems.find(fi => fi.id === item._id)) {
        const quantity = quantities[foundItems.length] || 1;
        foundItems.push({
          id: item._id,
          name: item.name,
          price: item.price,
          quantity: quantity,
          matchScore: matchScore,
          matchedWords: matchedWords
        });
      }
    });
    
    // Sort by match score (highest first) and take best matches
    foundItems.sort((a, b) => b.matchScore - a.matchScore);
    
    console.log('🔍 Debug - Final found items:', foundItems.map(item => ({
      name: item.name,
      score: item.matchScore,
      words: item.matchedWords
    }))); // Debug log
    
    return foundItems.slice(0, 3); // Return top 3 matches to avoid too many items
  };

  // Helper function for phonetic/similar word matching
  const getPhoneticMatches = (word) => {
    const phoneticMap = {
      // Common food phonetic variations
      'chicken': ['murgh', 'murg', 'चिकन'],
      'mutton': ['bakra', 'goat', 'भेड़', 'बकरा'],
      'biryani': ['biriyani', 'briyani', 'बिरयानी'],
      'coffee': ['kafi', 'कॉफी'],
      'tea': ['chai', 'चाय'],
      'dal': ['daal', 'दाल'],
      'roti': ['chapati', 'रोटी'],
      'rice': ['chawal', 'चावल'],
      'curry': ['sabzi', 'सब्जी'],
      'masala': ['spice', 'मसाला'],
      'paneer': ['cottage', 'पनीर'],
      'butter': ['makhan', 'मक्खन'],
      'tikka': ['टिक्का'],
      'tandoor': ['तंदूर'],
      'naan': ['नान'],
      'lassi': ['लस्सी'],
      'mango': ['aam', 'आम'],
      'chocolate': ['चॉकलेट'],
      'brownie': ['ब्राउनी'],
      'pizza': ['पिज्जा'],
      'burger': ['बर्गर'],
      'pasta': ['पास्ता'],
      'samosa': ['समोसा'],
      'chole': ['चोले'],
      'bhature': ['भटूरे']
    };
    
    // Return phonetic matches for the word
    return phoneticMap[word] || [];
  };

  // Helper function for category-based bonus scoring
  const getCategoryBonus = (itemName, speech) => {
    let bonus = 0;
    
    // Category keywords that boost matching
    const categoryKeywords = {
      'drink': ['drink', 'पेय', 'liquid', 'beverage'],
      'food': ['food', 'खाना', 'eat', 'khana'],
      'sweet': ['sweet', 'मिठाई', 'dessert', 'mithai'],
      'spicy': ['spicy', 'तीखा', 'hot', 'teekha'],
      'cold': ['cold', 'ठंडा', 'thanda', 'cool'],
      'hot': ['hot', 'गर्म', 'garam', 'warm']
    };
    
    Object.entries(categoryKeywords).forEach(([category, keywords]) => {
      keywords.forEach(keyword => {
        if (speech.includes(keyword)) {
          // Check if item belongs to this category
          if ((category === 'drink' && (itemName.includes('coffee') || itemName.includes('tea') || itemName.includes('lassi'))) ||
              (category === 'sweet' && (itemName.includes('chocolate') || itemName.includes('brownie') || itemName.includes('cookies'))) ||
              (category === 'cold' && itemName.includes('cold')) ||
              (category === 'hot' && (itemName.includes('tea') || itemName.includes('coffee')))) {
            bonus += 3;
          }
        }
      });
    });
    
    return bonus;
  };

  const speakResponse = (text) => {
    if ('speechSynthesis' in window) {
      // Cancel any ongoing speech
      window.speechSynthesis.cancel();
      
      // Wait a bit for voices to load
      setTimeout(() => {
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = language;
        
        // Get all available voices
        const voices = window.speechSynthesis.getVoices();
        console.log('🔍 Available voices:', voices.map(v => v.name)); // Debug log
        
        let selectedVoice = null;
        
        if (voiceGender === 'female') {
          // Enhanced female voice selection
          selectedVoice = voices.find(voice => 
            voice.name.toLowerCase().includes('zira') ||
            voice.name.toLowerCase().includes('cortana') ||
            voice.name.toLowerCase().includes('samantha') ||
            voice.name.toLowerCase().includes('karen') ||
            voice.name.toLowerCase().includes('susan') ||
            voice.name.toLowerCase().includes('female') ||
            (voice.name.toLowerCase().includes('english') && voice.name.toLowerCase().includes('female'))
          );
          
          // Voice settings for attractive female voice
          utterance.rate = 0.9;
          utterance.pitch = 1.4;
          utterance.volume = 1.0;
        } else {
          // Enhanced male voice selection
          selectedVoice = voices.find(voice => 
            voice.name.toLowerCase().includes('david') ||
            voice.name.toLowerCase().includes('mark') ||
            voice.name.toLowerCase().includes('alex') ||
            voice.name.toLowerCase().includes('james') ||
            voice.name.toLowerCase().includes('male') ||
            (voice.name.toLowerCase().includes('english') && voice.name.toLowerCase().includes('male'))
          );
          
          // Voice settings for attractive male voice
          utterance.rate = 0.85;
          utterance.pitch = 0.7;
          utterance.volume = 1.0;
        }
        
        // Fallback voice selection if specific gender not found
        if (!selectedVoice) {
          selectedVoice = voices.find(voice => 
            voice.lang.includes('en') || voice.lang.includes('hi')
          );
        }
        
        if (selectedVoice) {
          utterance.voice = selectedVoice;
          console.log('🔍 Selected voice:', selectedVoice.name, 'Gender:', voiceGender); // Debug log
        } else {
          console.log('🔍 No specific voice found, using default'); // Debug log
        }
        
        // Error handling
        utterance.onerror = (event) => {
          console.error('🔍 Speech synthesis error:', event.error);
        };
        
        utterance.onstart = () => {
          console.log('🔍 Speech started with voice:', utterance.voice?.name || 'default');
        };
        
        window.speechSynthesis.speak(utterance);
      }, 100); // Small delay to ensure voices are loaded
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
        <h3>🤖 Dine - Your Smart Dining Companion</h3>
        <p>Say "Hey Dine, I want food" to get started!</p>
        <div className="voice-controls-header">
          <select 
            value={language} 
            onChange={(e) => setLanguage(e.target.value)}
            className="language-selector"
          >
            <option value="hi-IN">🇮🇳 Hindi + English</option>
            <option value="en-IN">🇬🇧 English + Hindi</option>
          </select>
          <select 
            value={voiceGender} 
            onChange={(e) => {
              setVoiceGender(e.target.value);
              // Test the voice immediately
              const testText = e.target.value === 'female' ? 
                "Hello! This is my female voice. How do I sound?" :
                "Hello! This is my male voice. How do I sound?";
              speakResponse(testText);
            }}
            className="voice-selector"
          >
            <option value="female">👩 Female Voice</option>
            <option value="male">👨 Male Voice</option>
          </select>
          <button 
            onClick={() => {
              const testText = voiceGender === 'female' ? 
                "💃 Testing female voice! I sound sweet and melodious!" :
                "🕺 Testing male voice! I sound deep and confident!";
              speakResponse(testText);
            }}
            className="voice-test-btn"
          >
            🎤 Test Voice
          </button>
        </div>
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
            <strong>🍽️ Order ANY Menu Item:</strong>
            <ul>
              <li>"I want pizza" / "Pizza chahiye"</li>
              <li>"Order samosa" / "Samosa order karo"</li>
              <li>"I want chocolate brownie"</li>
              <li>"Paneer butter masala chahiye"</li>
            </ul>
          </div>
          <div className="example-category">
            <strong>🎤 Voice Control:</strong>
            <ul>
              <li>"Female voice mein bolo"</li>
              <li>"Switch to male voice"</li>
              <li>"Voice test" / "Test voice"</li>
              <li>"English mein baat karo"</li>
            </ul>
          </div>
          <div className="example-category">
            <strong>🎪 Fun Commands:</strong>
            <ul>
              <li>"Tell me a joke"</li>
              <li>"Joke sunao"</li>
              <li>"Good morning Dine"</li>
              <li>"Recommend kuch"</li>
            </ul>
          </div>
          <div className="example-category">
            <strong>🔍 Menu & Help:</strong>
            <ul>
              <li>"What do you have?" / "Menu dikhao"</li>
              <li>"Show all items" / "List items"</li>
              <li>"Kya available hai?"</li>
              <li>"Thank you Dine"</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VoiceAssistant;