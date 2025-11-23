import { ImageWithLoading } from './ImageWithLoading';
import { API_ENDPOINTS } from '../constants/api';
import { useCartReminder } from '../hooks/useCartReminder';
import { useTheme } from '../hooks/useTheme';
import { addToCart, updateQuantity } from '../store/slices/cartSlice';
import { Product } from '../store/slices/productsSlice';
import { RootState } from '../store/store';
import { showQuantityAlert, showRemoveItemAlert, validateQuantityDecrease, validateQuantityIncrease } from '../utils/cartValidation';
import Icon from 'react-native-vector-icons/Ionicons';
import { tokenManager } from '../utils/tokenManager';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation } from '@react-navigation/native';
import React, { useEffect, useState } from 'react';
import { BackHandler, Modal, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { responsive } from '../utils/responsive';

interface ProductCardProps {
  product: Product;
  isServiceable?: boolean;
}

const sizeOptions = ['100g', '200g', '500g', '1kg', '2kg'];

export const ProductCard: React.FC<ProductCardProps> = ({ product, isServiceable = true }) => {
  const dispatch = useDispatch();
  const navigation = useNavigation<any>();
  const { colors } = useTheme();
  const { onCartUpdated } = useCartReminder();
  const [showSizeModal, setShowSizeModal] = useState(false);
  const [showVariantModal, setShowVariantModal] = useState(false);
  const { isLoggedIn } = useSelector((state: RootState) => state.user);
  const [cartItem, setCartItem] = useState<any>(null);

  // Check cart status from API
  useEffect(() => {
    if (isLoggedIn) {
      checkCartStatus();
    } else {
      setCartItem(null);
    }
  }, [isLoggedIn, product.id]);

  const checkCartStatus = async () => {
    if (!isLoggedIn) return;
    try {
      const response = await tokenManager.makeAuthenticatedRequest('https://api.jholabazar.com/api/v1/cart/');
      const data = await response.json();
      if (data.success && data.data.carts.length > 0) {
        const foundItem = data.data.carts[0].items?.find((item: any) => 
          item.variant?.product?.id === product.id || item.product?.id === product.id
        );
        setCartItem(foundItem || null);
      } else {
        setCartItem(null);
      }
    } catch (error) {
      setCartItem(null);
    }
  };

  // Check if product has multiple size options
  const hasMultipleSizes = product.category === 'Vegetables' || product.category === 'Fruits';

  // Handle Android back button for modals
  useEffect(() => {
    const backAction = () => {
      if (showVariantModal) {
        setShowVariantModal(false);
        return true;
      }
      if (showSizeModal) {
        setShowSizeModal(false);
        return true;
      }
      return false;
    };

    const backHandler = BackHandler.addEventListener('hardwareBackPress', backAction);
    return () => backHandler.remove();
  }, [showVariantModal, showSizeModal]);



  const checkUserAddress = async () => {
    try {
      // First check if there's a selected address in AsyncStorage
      const selectedAddress = await AsyncStorage.getItem('selectedDeliveryAddress');
      if (selectedAddress) {
        return true;
      }
      
      const response = await tokenManager.makeAuthenticatedRequest(API_ENDPOINTS.ADDRESSES.ALL);
      
      if (response.ok) {
        const data = await response.json();
        return data.success && data.data && data.data.length > 0;
      }
      return false;
    } catch (error) {
      console.error('Error checking addresses:', error);
      return false;
    }
  };



  const handleAddToCart = async (selectedSize?: string, selectedVariantId?: string) => {
    console.log('Add to cart clicked', { product: product.name, isLoggedIn, isServiceable });
    
    // If product has variants and no variant selected, show variant modal first
    if (product.variants && product.variants.length > 1 && !cartItem && !selectedVariantId) {
      console.log('Showing variant modal');
      setShowVariantModal(true);
      return;
    }
    
    if (hasMultipleSizes && !cartItem && !selectedSize) {
      console.log('Showing size modal');
      setShowSizeModal(true);
      return;
    }
    
    // Redirect to login if user is not logged in
    if (!isLoggedIn) {
      console.log('User not logged in, redirecting to login');
      navigation.navigate('Login');
      return;
    }
    
    // After login, check if area is serviceable
    if (!isServiceable) {
      console.log('Area not serviceable');
      alert('Sorry, we don\'t deliver to your area');
      return;
    }
    
    // Get variantId from product
    const variantId = selectedVariantId || product.variants?.[0]?.id || product.id;
    console.log('Using variantId:', variantId);
    
    try {
      const response = await tokenManager.makeAuthenticatedRequest('https://api.jholabazar.com/api/v1/cart/add', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          variantId: variantId,
          quantity: '1'
        })
      });
      
      console.log('API Response status:', response.status);
      const data = await response.json();
      console.log('API Response data:', data);
      
      if (data.success) {
        // Update local Redux state with API response
        const selectedVariant = product.variants?.find(v => v.id === variantId) || product.variants?.[0];
        const cartData = {
          id: product.id,
          name: product.name,
          price: product.price,
          image: product.image,
          category: product.category,
          cartItemId: data.data.items[0]?.id,
          minOrderQty: selectedVariant?.minOrderQty,
          maxOrderQty: selectedVariant?.maxOrderQty,
          incrementQty: selectedVariant?.incrementQty,
        };
        console.log('Adding to Redux:', cartData);
        dispatch(addToCart(cartData));
        onCartUpdated();
        await checkCartStatus();
      } else {
        console.log('API failed:', data.message);
        alert(`Failed to add item: ${data.message}`);
      }
    } catch (error) {
      console.error('Error adding to cart:', error);
      alert('Network error. Please try again.');
    }
    
    if (selectedSize) {
      setShowSizeModal(false);
    }
    if (selectedVariantId) {
      setShowVariantModal(false);
    }
  };

  const handleIncrement = async () => {
    if (!isServiceable || !cartItem?.id) return;
    
    try {
      const response = await tokenManager.makeAuthenticatedRequest(`https://api.jholabazar.com/api/v1/cart/items/${cartItem.id}/increment`, {
        method: 'PATCH'
      });
      
      if (response.ok) {
        await checkCartStatus();
        onCartUpdated();
      }
    } catch (error) {
      console.error('Error incrementing quantity:', error);
    }
  };

  const handleDecrement = async () => {
    if (!isServiceable || !cartItem?.id) return;
    
    if (cartItem.quantity === 1) {
      // Show confirmation for last item removal
      showRemoveItemAlert(async () => {
        try {
          const response = await tokenManager.makeAuthenticatedRequest(`https://api.jholabazar.com/api/v1/cart/items/${cartItem.id}`, {
            method: 'DELETE'
          });
          
          if (response.ok) {
            setCartItem(null);
            onCartUpdated();
          }
        } catch (error) {
          console.error('Error removing item:', error);
        }
      });
    } else {
      // Normal decrement
      try {
        const response = await tokenManager.makeAuthenticatedRequest(`https://api.jholabazar.com/api/v1/cart/items/${cartItem.id}/decrement`, {
          method: 'PATCH'
        });
        
        if (response.ok) {
          await checkCartStatus();
          onCartUpdated();
        }
      } catch (error) {
        console.error('Error decrementing quantity:', error);
      }
    }
  };

  const handleSizeSelect = (size: string) => {
    handleAddToCart(size);
  };

  const getWeightRange = () => {
    if (product.category === 'Vegetables' || product.category === 'Fruits') {
      return '(0.95 - 1.05) kg';
    }
    return product.unit;
  };

  const getDiscountPercentage = () => {
    if (product.originalPrice) {
      return Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100);
    }
    return 0;
  };

  return (
    <>
      <TouchableOpacity 
        style={[styles.container, { backgroundColor: colors.background, borderColor: colors.border }]}
        onPress={() => navigation.navigate('ProductDetails', { productId: product.id })}
      >
        <View style={styles.imageContainer}>
          <ImageWithLoading 
            source={{ uri: product.image }} 
            height={120} 
            style={styles.image}
          />
          
          {/* Discount Badge on Image */}
          {getDiscountPercentage() > 0 && (
            <View style={styles.discountBadgeOnImage}>
              <Text style={styles.discountText}>{getDiscountPercentage()}% OFF</Text>
            </View>
          )}
          
          {/* Overlay Add Button */}
          <View style={styles.addButtonOverlay}>
            {cartItem ? (
              <View style={[styles.quantityContainer, { backgroundColor: colors.primary }]}>
                <TouchableOpacity 
                  style={styles.quantityButton}
                  onPress={(e) => {
                    e.stopPropagation();
                    handleDecrement();
                  }}
                >
                  <Icon name="remove" size={16} color="#fff" />
                </TouchableOpacity>
                <Text style={styles.quantity}>{cartItem.quantity}</Text>
                <TouchableOpacity 
                  style={styles.quantityButton}
                  onPress={(e) => {
                    e.stopPropagation();
                    handleIncrement();
                  }}
                >
                  <Icon name="add" size={16} color="#ffffffff" />
                </TouchableOpacity>
              </View>
            ) : (
              <TouchableOpacity 
                style={[styles.addButton, { 
                  backgroundColor: 'white', 
                  borderColor: colors.primary, 
                  borderWidth: 2,
                  flexDirection: product.variants && product.variants.length > 1 ? 'row' : 'column',
                  paddingHorizontal: product.variants && product.variants.length > 1 ? 8 : 0,
                  width: product.variants && product.variants.length > 1 ? 'auto' : 32,
                  minWidth: product.variants && product.variants.length > 1 ? 60 : 32
                }]} 
                onPress={(e) => {
                  e.stopPropagation();
                  handleAddToCart();
                }}
              >
                <Icon name="add" size={product.variants && product.variants.length > 1 ? 14 : 18} color={colors.primary} />
                {product.variants && product.variants.length > 1 && (
                  <Text style={[styles.variantText, { color: colors.primary }]}>
                    {product.variants.length} options
                  </Text>
                )}
              </TouchableOpacity>
            )}
          </View>
        </View>

        <View style={styles.content}>
          {/* Weight Range */}
          <Text style={[styles.weightRange, { color: colors.gray }]}>{getWeightRange()}</Text>
          
          {/* Product Name */}
          {product.name && (
            <Text style={[styles.name, { color: colors.text }]} numberOfLines={2}>
              {product.name.length > 10 ? `${product.name.substring(0, 10)}...` : product.name}
            </Text>
          )}
          

          

          
          {/* Price Section */}
          <View style={styles.priceContainer}>
            <Text style={[styles.price, { color: colors.text }]}>₹{product.price}</Text>
            {product.originalPrice && (
              <Text style={[styles.originalPrice, { color: colors.gray }]}>₹{product.originalPrice}</Text>
            )}
          </View>
        </View>
      </TouchableOpacity>

      {/* Size Selection Modal */}
      <Modal visible={showSizeModal} transparent animationType="slide">
        <TouchableOpacity 
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowSizeModal(false)}
        >
          <TouchableOpacity 
            style={[styles.modalContent, { backgroundColor: colors.background }]}
            activeOpacity={1}
            onPress={(e) => e.stopPropagation()}
          >
            <Text style={[styles.modalTitle, { color: colors.text }]}>Select Size</Text>
            <Text style={[styles.modalSubtitle, { color: colors.gray }]}>{product.name}</Text>
            
            {sizeOptions.map((size) => (
              <TouchableOpacity
                key={size}
                style={[styles.sizeOption, { borderBottomColor: colors.border }]}
                onPress={() => handleSizeSelect(size)}
              >
                <Text style={[styles.sizeText, { color: colors.text }]}>{size}</Text>
                <Text style={[styles.sizePrice, { color: colors.text }]}>₹{product.price}</Text>
              </TouchableOpacity>
            ))}
            
            <TouchableOpacity 
              style={[styles.modalClose, { backgroundColor: colors.border }]}
              onPress={() => setShowSizeModal(false)}
            >
              <Text style={[styles.modalCloseText, { color: colors.text }]}>Cancel</Text>
            </TouchableOpacity>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>

      {/* Variant Selection Modal */}
      <Modal visible={showVariantModal} transparent animationType="slide">
        <TouchableOpacity 
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowVariantModal(false)}
        >
          <TouchableOpacity 
            style={[styles.modalContent, { backgroundColor: colors.background }]}
            activeOpacity={1}
            onPress={(e) => e.stopPropagation()}
          >
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: colors.text }]}>Select Variant</Text>
              <TouchableOpacity onPress={() => setShowVariantModal(false)}>
                <Icon name="close" size={24} color={colors.text} />
              </TouchableOpacity>
            </View>
            <Text style={[styles.modalSubtitle, { color: colors.gray }]}>{product.name}</Text>
            
            {product.variants?.map((variant) => {
              const variantCartItem = cartItem; // For now, using same cart item logic
              const maxQty = variant.maxOrderQty || 999;
              const minQty = variant.minOrderQty || 1;
              const stockQty = variant.stock?.availableQty;
              const isOutOfStock = variant.stock?.status === 'OUT_OF_STOCK' || (stockQty !== undefined && stockQty === 0);
              
              return (
                <View
                  key={variant.id}
                  style={[styles.variantOption, { borderBottomColor: colors.border }]}
                >
                  {variant.images?.[0] && (
                    <ImageWithLoading 
                      source={{ uri: variant.images[0] }} 
                      height={60} 
                      width={60}
                      style={styles.variantImage}
                    />
                  )}
                  <View style={styles.variantInfo}>
                    <Text style={[styles.variantName, { color: colors.text }]}>
                      {variant.weight} {variant.baseUnit}
                    </Text>
                    <Text style={[styles.variantPrice, { color: colors.text }]}>₹{variant.price?.sellingPrice}</Text>
                    {variant.price?.basePrice && variant.price.basePrice !== variant.price.sellingPrice && (
                      <Text style={[styles.variantOrigPrice, { color: colors.gray }]}>₹{variant.price.basePrice}</Text>
                    )}
                    {isOutOfStock && (
                      <Text style={[styles.outOfStockText, { color: '#FF3B30' }]}>Out of Stock</Text>
                    )}
                  </View>
                  <View style={styles.variantActions}>
                    {variantCartItem ? (
                      <View style={[styles.quantityContainer, { backgroundColor: colors.primary }]}>
                        <TouchableOpacity 
                          style={styles.quantityButton}
                          onPress={(e) => {
                            e.stopPropagation();
                            handleDecrement();
                          }}
                        >
                          <Icon name="remove" size={15} color="#fff" />
                        </TouchableOpacity>
                        <Text style={styles.quantity}>{variantCartItem.quantity}</Text>
                        <TouchableOpacity 
                          style={styles.quantityButton}
                          onPress={(e) => {
                            e.stopPropagation();
                            handleIncrement();
                          }}
                        >
                          <Icon name="add" size={15} color="#fff" />
                        </TouchableOpacity>
                      </View>
                    ) : (
                      <TouchableOpacity 
                        style={[styles.addButton, { 
                          backgroundColor: isOutOfStock ? colors.border : 'white', 
                          borderColor: isOutOfStock ? colors.gray : colors.primary, 
                          borderWidth: 2,
                          opacity: isOutOfStock ? 0.5 : 1
                        }]} 
                        disabled={isOutOfStock}
                        onPress={(e) => {
                          e.stopPropagation();
                          if (!isOutOfStock) {
                            handleAddToCart(undefined, variant.id);
                          }
                        }}
                      >
                        <Icon name="add" size={18} color={isOutOfStock ? colors.gray : colors.primary} />
                      </TouchableOpacity>
                    )}
                  </View>
                </View>
              );
            })}
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>
    </>
  );
};

const styles = StyleSheet.create({
  container: {
    borderRadius: 12,
    marginBottom: 16,
    width: responsive.getProductColumns() === 3 ? '31%' : '48%',
    borderWidth: 1,
    overflow: 'hidden',
    marginHorizontal: responsive.getProductColumns() === 3 ? '1%' : '1%',
    shadowColor: '#00B761',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  imageContainer: {
    position: 'relative',
  },
  image: {
    width: '100%',
    resizeMode: 'cover',
    paddingTop: 8,
  },
  addButtonOverlay: {
    position: 'absolute',
    bottom: -10,
    right: 8,
  },
  addButton: {
    width: 32,
    height: 32,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  quantityContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 10,
    paddingHorizontal: 6,
  },
  quantityButton: {
    padding: 8,
  },
  quantity: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
    marginHorizontal: 6,
  },
  content: {
    padding: 12,
  },
  weightRange: {
    fontSize: 10,
    marginBottom: 4,
  },
  name: {
    fontSize: responsive.getFontSize(12),
    fontWeight: '600',
    marginBottom: 6,
    lineHeight: 16,
  },

  priceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  price: {
    fontSize: responsive.getFontSize(14),
    fontWeight: 'bold',
  },
  originalPrice: {
    fontSize: 11,
    textDecorationLine: 'line-through',
    marginLeft: 6,
  },
  discountBadgeOnImage: {
    position: 'absolute',
    top: 8,
    left: 8,
    backgroundColor: '#FF3B30',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  discountText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: 'bold',
  },
  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    maxHeight: '60%',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  modalSubtitle: {
    fontSize: 14,
    marginBottom: 20,
  },
  sizeOption: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
    borderBottomWidth: 1,
  },
  sizeText: {
    fontSize: 16,
  },
  sizePrice: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  modalClose: {
    marginTop: 20,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  modalCloseText: {
    fontSize: 16,
    fontWeight: '600',
  },
  variantText: {
    fontSize: 10,
    fontWeight: '500',
    marginLeft: 2,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  variantOption: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
    borderBottomWidth: 1,
  },
  variantImage: {
    borderRadius: 8,
    marginRight: 12,
  },
  variantActions: {
    alignItems: 'center',
  },
  variantInfo: {
    flex: 1,
  },
  variantName: {
    fontSize: 16,
    fontWeight: '500',
  },
  variantDesc: {
    fontSize: 14,
    marginTop: 2,
  },

  variantPrice: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  variantOrigPrice: {
    fontSize: 12,
    textDecorationLine: 'line-through',
    marginTop: 2,
  },
  outOfStockText: {
    fontSize: 12,
    fontWeight: '600',
    marginTop: 2,
  },
  stockInfo: {
    fontSize: 10,
    marginTop: 2,
  },
});