const BASE_URL = 'https://api.jholabazar.com/api/v1';

export const API_ENDPOINTS = {
  BASE_URL,
  ADDRESSES: {
    ALL: `${BASE_URL}/service-area/addresses`,
  },
  CART: {
    BASE: `${BASE_URL}/cart`,
    INCREMENT: (itemId: string) => `${BASE_URL}/cart/items/${itemId}/increment`,
    DECREMENT: (itemId: string) => `${BASE_URL}/cart/items/${itemId}/decrement`,
    ITEM_BY_ID: (itemId: string) => `${BASE_URL}/cart/items/${itemId}`,
  },
  ORDERS: {
    BASE: `${BASE_URL}/orders`,
  },
  PAYMENTS: {
    VERIFY: `${BASE_URL}/payments/verify`,
  },
};