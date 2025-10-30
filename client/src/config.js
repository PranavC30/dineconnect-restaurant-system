const config = {
  development: {
    API_BASE_URL: process.env.REACT_APP_SERVER_URL ? `${process.env.REACT_APP_SERVER_URL}/api` : 'http://localhost:5001/api'
  },
  production: {
    API_BASE_URL: process.env.REACT_APP_API_URL || 'https://dineconnect-backend.vercel.app/api'
  }
};

export default config[process.env.NODE_ENV || 'development'];