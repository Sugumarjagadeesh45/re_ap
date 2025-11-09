// //   Type-c connected

// import { Platform } from 'react-native';

// const getApiUrl = () => {
//   const isProduction = process.env.NODE_ENV === 'production';
  
//   if (isProduction) {
//     return 'https://your-production-backend.com';
//   }
  
//   if (Platform.OS === 'android') {
//     return 'http://192.168.176.171:5000'; // Updated to your PC’s current IP
//   }
  
//   return 'http://localhost:5000';
// };

// export default getApiUrl();






// // WI-FI and Hotesport connected



import { Platform } from 'react-native';

// Determine API URL based on environment and platform
const getApiUrl = () => {
  const isProduction = process.env.NODE_ENV === 'production';
  
  if (isProduction) {
    // Replace with your production backend URL
    return 'https://your-production-backend.com';
  }
  
  if (Platform.OS === 'android') {
    // Use your PC's Wi-Fi IP address for real devices
    return 'http://10.50.135.126:5000';
  }
  
  return 'http://localhost:5000';
};

export default getApiUrl();
























































































// import { Platform } from 'react-native';

// // Determine API URL based on environment and platform
// const getApiUrl = () => {
//   const isProduction = process.env.NODE_ENV === 'production';
  
//   if (isProduction) {
//     // Replace with your production backend URL
//     return 'https://your-production-backend.com';
//   }
  
//   if (Platform.OS === 'android') {
//     // Use your PC's Wi-Fi IP address for real devices
//     return 'http://192.168.93.126:5000';
//   }
  
//   return 'http://localhost:5000';
// };

// export default getApiUrl();