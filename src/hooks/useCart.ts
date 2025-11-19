import { useState, useEffect, useCallback } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { RootState } from '../store/store';
import { tokenManager } from '../utils/tokenManager';
import { clearCart, addToCart as addToReduxCart, updateQuantity as updateReduxQuantity, removeItem as removeReduxItem } from '../store/slices/cartSlice';

interface CartItem {
  id: string;
  quantity: number;
  unitPrice: number;
  variant: {
    id: string;
    name: string;
    weight: number;
    baseUnit: string;
    product: {
      id: string;
    };
  };
}

interface CartData {
  items: CartItem[];
  summary: {
    subtotal: number;
    deliveryCharge: number;
    totalAmount: number;
  };
}

export const useCart = () => {
  const dispatch = useDispatch();
  const [cartData, setCartData] = useState<CartData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { isLoggedIn } = useSelector((state: RootState) => state.user);
  const reduxCart = useSelector((state: RootState) => state.cart);

  const fetchCart = useCallback(async () => {
    if (!isLoggedIn) {
      setCartData(null);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      
      const response = await tokenManager.makeAuthenticatedRequest('https://api.jholabazar.com/api/v1/cart/');
      const data = await response.json();
      
      if (data.success && data.data.carts?.length > 0) {
        const apiCart = data.data.carts[0];
        setCartData(apiCart);
        
        // Sync Redux cart with API cart for logged-in users
        dispatch(clearCart());
        apiCart.items?.forEach((item: CartItem) => {
          if (item.variant?.product?.id) {
            dispatch(addToReduxCart({
              id: item.variant.product.id,
              name: item.variant.name || 'Unknown Product',
              price: item.unitPrice || 0,
              quantity: item.quantity || 1,
            }));
          }
        });
      } else {
        setCartData({ items: [], summary: { subtotal: 0, deliveryCharge: 0, totalAmount: 0 } });
        dispatch(clearCart());
      }
    } catch (err) {
      console.error('Error fetching cart:', err);
      setError('Failed to load cart');
      setCartData({ items: [], summary: { subtotal: 0, deliveryCharge: 0, totalAmount: 0 } });
    } finally {
      setLoading(false);
    }
  }, [isLoggedIn]);

  const addToCart = useCallback(async (variantId: string) => {
    if (!isLoggedIn) return false;

    try {
      setLoading(true);
      const response = await tokenManager.makeAuthenticatedRequest('https://api.jholabazar.com/api/v1/cart/add', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ variantId, quantity: '1' })
      });

      const data = await response.json();
      if (data.success) {
        await fetchCart();
        return true;
      }
      return false;
    } catch (err) {
      console.error('Error adding to cart:', err);
      return false;
    } finally {
      setLoading(false);
    }
  }, [isLoggedIn, fetchCart]);

  const updateQuantity = useCallback(async (cartItemId: string, action: 'increment' | 'decrement') => {
    if (!isLoggedIn) return false;

    try {
      setLoading(true);
      const endpoint = `https://api.jholabazar.com/api/v1/cart/items/${cartItemId}/${action}`;
      const response = await tokenManager.makeAuthenticatedRequest(endpoint, { method: 'PATCH' });

      if (response.ok) {
        await fetchCart();
        return true;
      }
      return false;
    } catch (err) {
      console.error(`Error ${action}ing quantity:`, err);
      return false;
    } finally {
      setLoading(false);
    }
  }, [isLoggedIn, fetchCart]);

  const removeItem = useCallback(async (cartItemId: string) => {
    if (!isLoggedIn) return false;

    try {
      setLoading(true);
      const response = await tokenManager.makeAuthenticatedRequest(`https://api.jholabazar.com/api/v1/cart/items/${cartItemId}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        await fetchCart();
        return true;
      }
      return false;
    } catch (err) {
      console.error('Error removing item:', err);
      return false;
    } finally {
      setLoading(false);
    }
  }, [isLoggedIn, fetchCart]);

  const getCartItemCount = useCallback(() => {
    if (!isLoggedIn) {
      // For guest users, get count from Redux
      return reduxCart.items.reduce((sum, item) => sum + item.quantity, 0);
    }
    // For logged-in users, get count from API data
    return cartData?.items?.reduce((sum, item) => sum + item.quantity, 0) || 0;
  }, [cartData, isLoggedIn, reduxCart]);

  const isInCart = useCallback((productId: string) => {
    if (!productId || !cartData?.items) return null;
    return cartData.items.find(item => item.variant?.product?.id === productId) || null;
  }, [cartData]);

  useEffect(() => {
    fetchCart();
  }, [fetchCart]);

  return {
    cartData,
    loading,
    error,
    fetchCart,
    addToCart,
    updateQuantity,
    removeItem,
    getCartItemCount,
    isInCart,
    items: cartData?.items || [],
    summary: cartData?.summary || { subtotal: 0, deliveryCharge: 0, totalAmount: 0 }
  };
};