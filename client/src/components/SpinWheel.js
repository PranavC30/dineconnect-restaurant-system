import React, { useState, useRef } from 'react';
import './SpinWheel.css';

const SpinWheel = ({ onClose, onWin, allowMultipleSpins = false, resetKey = null }) => {
  const [isSpinning, setIsSpinning] = useState(false);
  const [hasSpun, setHasSpun] = useState(false);
  const [result, setResult] = useState(null);
  const [spinCount, setSpinCount] = useState(0);
  const wheelRef = useRef(null);

  // Discount prizes with different probabilities
  const prizes = [
    { id: 1, text: "5% OFF", discount: 5, color: "#FF6B6B", probability: 25 },
    { id: 2, text: "10% OFF", discount: 10, color: "#4ECDC4", probability: 20 },
    { id: 3, text: "15% OFF", discount: 15, color: "#45B7D1", probability: 15 },
    { id: 4, text: "FREE DESSERT", discount: 0, special: "free_dessert", color: "#96CEB4", probability: 15 },
    { id: 5, text: "20% OFF", discount: 20, color: "#FFEAA7", probability: 10 },
    { id: 6, text: "FREE DRINK", discount: 0, special: "free_drink", color: "#DDA0DD", probability: 10 },
    { id: 7, text: "25% OFF", discount: 25, color: "#FD79A8", probability: 3 },
    { id: 8, text: "JACKPOT 50%", discount: 50, color: "#FFD93D", probability: 2 }
  ];

  // Create wheel segments based on probability
  const createWheelSegments = () => {
    const segments = [];
    prizes.forEach(prize => {
      for (let i = 0; i < prize.probability; i++) {
        segments.push(prize);
      }
    });
    return segments;
  };

  const wheelSegments = createWheelSegments();
  const segmentAngle = 360 / wheelSegments.length;

  const spinWheel = () => {
    if (isSpinning || (hasSpun && !allowMultipleSpins)) return;

    setIsSpinning(true);
    setSpinCount(prev => prev + 1);
    
    // Random number of rotations (5-10 full rotations + random angle)
    const minRotations = 5;
    const maxRotations = 10;
    const rotations = minRotations + Math.random() * (maxRotations - minRotations);
    
    // Select random winning segment
    const winningIndex = Math.floor(Math.random() * wheelSegments.length);
    const winningAngle = winningIndex * segmentAngle;
    
    // Calculate total rotation (multiple full rotations + winning position)
    const totalRotation = rotations * 360 + (360 - winningAngle);
    
    // Apply rotation
    if (wheelRef.current) {
      wheelRef.current.style.transform = `rotate(${totalRotation}deg)`;
    }

    // Handle result after animation
    setTimeout(() => {
      setIsSpinning(false);
      if (!allowMultipleSpins) {
        setHasSpun(true);
      }
      const winningPrize = wheelSegments[winningIndex];
      setResult(winningPrize);
      
      // Call parent callback with result
      if (onWin) {
        onWin(winningPrize, spinCount);
      }
    }, 4000); // 4 second spin duration
  };

  const getResultMessage = () => {
    if (!result) return "";
    
    if (result.special === "free_dessert") {
      return "🍰 Congratulations! You won a FREE DESSERT with your order!";
    } else if (result.special === "free_drink") {
      return "🥤 Awesome! You won a FREE DRINK with your order!";
    } else if (result.discount === 50) {
      return "🎉 JACKPOT! You won 50% OFF your entire order!";
    } else {
      return `🎊 Great! You won ${result.discount}% OFF your order!`;
    }
  };

  return (
    <div className="spin-wheel-overlay">
      <div className="spin-wheel-modal">
        <div className="spin-wheel-header">
          <h2>🎡 Spin & Win Discounts!</h2>
          <button className="close-btn" onClick={onClose}>✕</button>
        </div>

        <div className="spin-wheel-container">
          {/* Wheel */}
          <div className="wheel-wrapper">
            <div 
              ref={wheelRef}
              className={`wheel ${isSpinning ? 'spinning' : ''}`}
            >
              {wheelSegments.map((segment, index) => (
                <div
                  key={index}
                  className="wheel-segment"
                  style={{
                    transform: `rotate(${index * segmentAngle}deg)`,
                    backgroundColor: segment.color,
                  }}
                >
                  <div className="segment-text">
                    {segment.text}
                  </div>
                </div>
              ))}
            </div>
            
            {/* Pointer */}
            <div className="wheel-pointer">▼</div>
          </div>

          {/* Spin Button */}
          {(!hasSpun || allowMultipleSpins) && (
            <button 
              className={`spin-button ${isSpinning ? 'spinning' : ''}`}
              onClick={spinWheel}
              disabled={isSpinning}
            >
              {isSpinning ? '🎡 SPINNING...' : (spinCount > 0 && allowMultipleSpins ? `🎯 SPIN AGAIN! (${spinCount} spins)` : '🎯 SPIN NOW!')}
            </button>
          )}

          {/* Reset Button for Multiple Spins */}
          {allowMultipleSpins && result && (
            <button 
              className="reset-button"
              onClick={() => {
                setResult(null);
                setHasSpun(false);
                if (wheelRef.current) {
                  wheelRef.current.style.transform = 'rotate(0deg)';
                }
              }}
            >
              🔄 SPIN AGAIN
            </button>
          )}

          {/* Result */}
          {result && (
            <div className="spin-result">
              <div className="result-animation">
                <div className="confetti">🎉</div>
                <div className="result-text">
                  {getResultMessage()}
                </div>
                <div className="result-code">
                  <strong>Discount Code: SPIN{result.id}${Date.now().toString().slice(-4)}</strong>
                </div>
                <p className="result-note">
                  This discount will be automatically applied to your order!
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Rules */}
        <div className="spin-wheel-rules">
          <h4>🎮 How it works:</h4>
          <ul>
            <li>🎡 {allowMultipleSpins ? 'Spin the wheel as many times as you want!' : 'Spin the wheel once per visit'}</li>
            <li>🎁 Win discounts from 5% to 50% OFF</li>
            <li>🍰 Special prizes: Free dessert or drink</li>
            <li>💰 {allowMultipleSpins ? 'Best discount applies to your order' : 'Discount applies to your current order'}</li>
            <li>⏰ Valid for today only</li>
            {allowMultipleSpins && <li>🔄 Keep spinning for better prizes!</li>}
          </ul>
        </div>

        {hasSpun && (
          <div className="spin-wheel-actions">
            <button className="continue-btn" onClick={onClose}>
              🛒 Continue Shopping
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default SpinWheel;