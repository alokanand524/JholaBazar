import RazorpayCheckout from 'react-native-razorpay';

interface PaymentOptions {
  amount: number;
  orderId: string;
  name: string;
  description: string;
  email?: string;
  contact?: string;
  key: string;
  currency?: string;
  theme?: { color: string };
}

export const initiateRazorpayPayment = (options: PaymentOptions): Promise<any> => {
  const razorpayOptions = {
    description: options.description,
    currency: options.currency || 'INR',
    key: options.key,
    amount: options.amount,
    order_id: options.orderId,
    name: options.name,
    prefill: {
      email: options.email || 'customer@jholabazar.com',
      contact: options.contact || '9999999999',
      name: 'Customer'
    },
    theme: options.theme || { color: '#4CAF50' }
  };

  return RazorpayCheckout.open(razorpayOptions);
};