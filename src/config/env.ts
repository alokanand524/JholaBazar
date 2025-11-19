interface AppConfig {
  API_BASE_URL: string;
  GOOGLE_MAPS_API_KEY: string;
  RAZORPAY_KEY_ID: string;
  RAZORPAY_KEY_SECRET: string;
  TAWK_TO_PROPERTY_ID: string;
  TAWK_TO_WIDGET_ID: string;
  APP_ENV: string;
  DEBUG_MODE: boolean;
}

const getConfig = (): AppConfig => {
  return {
    API_BASE_URL: 'https://api.jholabazar.com/api/v1',
    GOOGLE_MAPS_API_KEY: 'AIzaSyA_0odOsTGuRjXcgoq_D7_ZBNuCxblh2a0',
    RAZORPAY_KEY_ID: 'rzp_test_1DP5mmOlF5G5ag',
    RAZORPAY_KEY_SECRET: '',
    TAWK_TO_PROPERTY_ID: '',
    TAWK_TO_WIDGET_ID: '',
    APP_ENV: 'development',
    DEBUG_MODE: false,
  };
};

export const config = getConfig();