const getApiBaseUrl = () => {
  // Check if we're running on localhost or network IP
  const hostname = window.location.hostname;
  
  if (hostname === 'localhost' || hostname === '127.0.0.1') {
    return 'http://localhost:5001/api';
  } else {
    // Use network IP for mobile access
    return 'http://10.235.195.51:5001/api';
  }
};

const config = {
  development: {
    API_BASE_URL: getApiBaseUrl()
  },
  production: {
    API_BASE_URL: process.env.REACT_APP_API_URL || 'https://dineconnect-backend.vercel.app/api'
  }
};

export default config[process.env.NODE_ENV || 'development'];