import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Image,
  Dimensions,
  Modal,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useSelector, useDispatch } from 'react-redux';
import Icon from 'react-native-vector-icons/MaterialIcons';

import { useTheme } from '../hooks/useTheme';
import { useCart } from '../hooks/useCart';
import { RootState, AppDispatch } from '../store/store';
import { addToCart } from '../store/slices/cartSlice';
import { tokenManager } from '../utils/tokenManager';

const { width } = Dimensions.get('window');

export default function ProductDetailsScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const { colors } = useTheme();
  const { getCartItemCount } = useCart();
  const { isLoggedIn } = useSelector((state: RootState) => state.user);
  const dispatch = useDispatch<AppDispatch>();

  const [product, setProduct] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [selectedVariant, setSelectedVariant] = useState(0);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [showFullDescription, setShowFullDescription] = useState(true);
  const [showImageModal, setShowImageModal] = useState(false);

  const productId = route.params?.productId;
  const [cartItem, setCartItem] = useState<any>(null);

  const fetchProductDetails = async () => {
    try {
      setLoading(true);
      const response = await fetch(`https://api.jholabazar.com/api/v1/products/${productId}`);
      const data = await response.json();
      
      if (data.success && data.data?.product) {
        setProduct(data.data.product);
      }
    } catch (error) {
      console.error('Error fetching product details:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddToCart = async () => {
    if (!product?.variants?.[selectedVariant] || !isLoggedIn) return;
    
    const variant = product.variants[selectedVariant];
    try {
      const response = await tokenManager.makeAuthenticatedRequest('https://api.jholabazar.com/api/v1/cart/add', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ variantId: variant.id, quantity: '1' })
      });
      
      const data = await response.json();
      if (data.success) {
        await checkCartStatus();
      }
    } catch (error) {
      console.error('Error adding to cart:', error);
    }
  };

  useEffect(() => {
    if (productId) {
      fetchProductDetails();
    }
  }, [productId]);

  useEffect(() => {
    if (product && isLoggedIn) {
      checkCartStatus();
    }
  }, [product, selectedVariant, isLoggedIn]);

  const checkCartStatus = async () => {
    if (!isLoggedIn || !product?.variants?.[selectedVariant]) {
      setCartItem(null);
      return;
    }
    try {
      const currentVariant = product.variants[selectedVariant];
      const response = await tokenManager.makeAuthenticatedRequest('https://api.jholabazar.com/api/v1/cart/');
      const data = await response.json();
      if (data.success && data.data.carts?.length > 0) {
        const foundItem = data.data.carts[0].items?.find((item: any) => 
          item.variant?.id === currentVariant.id
        );
        setCartItem(foundItem || null);
      } else {
        setCartItem(null);
      }
    } catch (error) {
      setCartItem(null);
    }
  };

  const handleIncrement = async () => {
    if (!cartItem?.id) return;
    
    try {
      const response = await tokenManager.makeAuthenticatedRequest(`https://api.jholabazar.com/api/v1/cart/items/${cartItem.id}/increment`, {
        method: 'PATCH'
      });
      
      if (response.ok) {
        await checkCartStatus();
      }
    } catch (error) {
      console.error('Error incrementing quantity:', error);
    }
  };

  const handleDecrement = async () => {
    if (!cartItem?.id) return;
    
    if (cartItem.quantity === 1) {
      try {
        const response = await tokenManager.makeAuthenticatedRequest(`https://api.jholabazar.com/api/v1/cart/items/${cartItem.id}`, {
          method: 'DELETE'
        });
        
        if (response.ok) {
          setCartItem(null);
        }
      } catch (error) {
        console.error('Error removing item:', error);
      }
    } else {
      try {
        const response = await tokenManager.makeAuthenticatedRequest(`https://api.jholabazar.com/api/v1/cart/items/${cartItem.id}/decrement`, {
          method: 'PATCH'
        });
        
        if (response.ok) {
          await checkCartStatus();
        }
      } catch (error) {
        console.error('Error decrementing quantity:', error);
      }
    }
  };

  if (loading) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={[styles.header, { borderBottomColor: colors.border }]}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Icon name="arrow-back" size={24} color={colors.text} />
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.cartButton, { backgroundColor: colors.lightGray }]}
            onPress={() => navigation.navigate('Cart')}
          >
            <Icon name="shopping-bag" size={24} color={colors.primary} />
            {getCartItemCount() > 0 && (
              <View style={styles.cartBadge}>
                <Text style={styles.cartBadgeText}>{getCartItemCount()}</Text>
              </View>
            )}
          </TouchableOpacity>
        </View>
        <View style={styles.centerContainer}>
          <Text style={[styles.loadingText, { color: colors.gray }]}>
            Loading product details...
          </Text>
        </View>
      </View>
    );
  }

  if (!product) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <Text style={[styles.errorText, { color: colors.text }]}>
          Product not found
        </Text>
      </View>
    );
  }

  const currentVariant = product.variants?.[selectedVariant];
  const discount = currentVariant?.price?.basePrice && currentVariant?.price?.sellingPrice
    ? Math.round(((parseFloat(currentVariant.price.basePrice) - parseFloat(currentVariant.price.sellingPrice)) / parseFloat(currentVariant.price.basePrice)) * 100)
    : 0;

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Icon name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.cartButton, { backgroundColor: colors.lightGray }]}
          onPress={() => navigation.navigate('Cart')}
        >
          <Icon name="shopping-bag" size={24} color={colors.primary} />
          {getCartItemCount() > 0 && (
            <View style={styles.cartBadge}>
              <Text style={styles.cartBadgeText}>{getCartItemCount()}</Text>
            </View>
          )}
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Product Images */}
        <View style={styles.imageContainer}>
          <ScrollView
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            onMomentumScrollEnd={(event) => {
              const index = Math.round(event.nativeEvent.contentOffset.x / width);
              setCurrentImageIndex(index);
            }}
          >
            {product.images?.map((image: string, index: number) => (
              <TouchableOpacity
                key={index}
                onPress={() => setShowImageModal(true)}
              >
                <Image
                  source={{ uri: image }}
                  style={styles.productImage}
                  resizeMode="contain"
                />
              </TouchableOpacity>
            ))}
          </ScrollView>
          <View style={styles.imageIndicator}>
            {product.images?.map((_: any, index: number) => (
              <View
                key={index}
                style={[
                  styles.dot,
                  {
                    backgroundColor: index === currentImageIndex ? colors.primary : colors.gray,
                  },
                ]}
              />
            ))}
          </View>
        </View>

        {/* Product Info */}
        <View style={styles.productInfo}>
          {/* Product Name */}
          <Text style={[styles.productName, { color: colors.text }]}>
            {product.name}
          </Text>

          {/* Price */}
          <View style={styles.priceContainer}>
            <Text style={[styles.sellingPrice, { color: colors.text }]}>
              ₹{currentVariant?.price?.sellingPrice}
            </Text>
            {currentVariant?.price?.basePrice && (
              <Text style={[styles.basePrice, { color: colors.gray }]}>
                ₹{currentVariant?.price?.basePrice}
              </Text>
            )}
            {discount > 0 && (
              <Text style={styles.discount}>
                {discount}% OFF
              </Text>
            )}
          </View>

          {/* Available Sizes */}
          {product.variants?.length > 0 && (
            <View style={styles.variantsContainer}>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>
                Available Sizes
              </Text>
              <View style={styles.variantsList}>
                {product.variants.map((variant: any, index: number) => (
                  <TouchableOpacity
                    key={variant.id}
                    style={[
                      styles.variantCard,
                      {
                        backgroundColor: selectedVariant === index ? colors.primary : colors.card,
                        borderColor: selectedVariant === index ? colors.primary : colors.border,
                      },
                    ]}
                    onPress={() => setSelectedVariant(index)}
                  >
                    {variant.images?.[0] && (
                      <Image
                        source={{ uri: variant.images[0] }}
                        style={styles.variantImage}
                        resizeMode="contain"
                      />
                    )}
                    <Text
                      style={[
                        styles.variantWeight,
                        {
                          color: selectedVariant === index ? '#fff' : colors.text,
                        },
                      ]}
                    >
                      {variant.weight} {variant.baseUnit}
                    </Text>
                    <Text
                      style={[
                        styles.variantPrice,
                        {
                          color: selectedVariant === index ? '#fff' : colors.primary,
                        },
                      ]}
                    >
                      ₹{variant.price?.sellingPrice}
                    </Text>
                    {variant.price?.basePrice && variant.price.basePrice !== variant.price.sellingPrice && (
                      <Text
                        style={[
                          styles.variantOriginalPrice,
                          {
                            color: selectedVariant === index ? 'rgba(255,255,255,0.7)' : colors.gray,
                          },
                        ]}
                      >
                        ₹{variant.price.basePrice}
                      </Text>
                    )}
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          )}

          {/* Description */}
          <View style={styles.descriptionContainer}>
            <View style={styles.descriptionHeader}>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>
                Description
              </Text>
              <TouchableOpacity
                onPress={() => setShowFullDescription(!showFullDescription)}
                style={styles.toggleButton}
              >
                <Text style={[styles.toggleText, { color: colors.primary }]}>
                  {showFullDescription ? 'Show Less' : 'Show More'}
                </Text>
              </TouchableOpacity>
            </View>
            <Text style={[styles.description, { color: colors.gray }]}>
              {showFullDescription ? product.description : product.shortDescription}
            </Text>
          </View>
        </View>
      </ScrollView>

      {/* Bottom Section */}
      <View style={[styles.bottomContainer, { backgroundColor: colors.background, borderTopColor: colors.border }]}>
        <View style={styles.bottomPriceContainer}>
          <Text style={[styles.bottomSellingPrice, { color: colors.text }]}>
            ₹{currentVariant?.price?.sellingPrice}
          </Text>
          <View style={styles.bottomSecondRow}>
            {currentVariant?.price?.basePrice && (
              <Text style={[styles.bottomBasePrice, { color: colors.gray }]}>
                ₹{currentVariant?.price?.basePrice}
              </Text>
            )}
            {discount > 0 && (
              <Text style={styles.bottomDiscount}>
                {discount}% OFF
              </Text>
            )}
          </View>
        </View>
        {cartItem ? (
          <View style={styles.cartControls}>
            <View style={[styles.quantityContainer, { backgroundColor: colors.primary }]}>
              <TouchableOpacity 
                style={styles.quantityButton}
                onPress={handleDecrement}
              >
                <Icon name="remove" size={20} color="#fff" />
              </TouchableOpacity>
              <Text style={styles.quantity}>{cartItem.quantity}</Text>
              <TouchableOpacity 
                style={styles.quantityButton}
                onPress={handleIncrement}
              >
                <Icon name="add" size={20} color="#fff" />
              </TouchableOpacity>
            </View>
            <TouchableOpacity
              style={[styles.goToCartButton, { backgroundColor: '#FF8C00' }]}
              onPress={() => navigation.navigate('Cart')}
            >
              <Icon name="shopping-bag" size={20} color="#fff" />
              <Text style={styles.addToCartText}>
                Go to Jhola
              </Text>
            </TouchableOpacity>
          </View>
        ) : (
          <TouchableOpacity
            style={[styles.addToCartButton, { backgroundColor: colors.primary }]}
            onPress={handleAddToCart}
          >
            <Icon name="add-shopping-cart" size={20} color="#fff" />
            <Text style={styles.addToCartText}>
              Add to Jhola
            </Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Image Modal */}
      <Modal visible={showImageModal} transparent={false} animationType="fade">
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity
              style={styles.closeButton}
              onPress={() => setShowImageModal(false)}
            >
              <Icon name="close" size={24} color="#000" />
            </TouchableOpacity>
          </View>
          
          <View style={styles.modalImageContainer}>
            <ScrollView
              horizontal
              pagingEnabled
              showsHorizontalScrollIndicator={false}
              contentOffset={{ x: currentImageIndex * width, y: 0 }}
              onMomentumScrollEnd={(event) => {
                const index = Math.round(event.nativeEvent.contentOffset.x / width);
                setCurrentImageIndex(index);
              }}
            >
              {product?.images?.map((image: string, index: number) => (
                <View key={index} style={styles.modalImageWrapper}>
                  <Image
                    source={{ uri: image }}
                    style={styles.modalImage}
                    resizeMode="contain"
                  />
                </View>
              ))}
            </ScrollView>
          </View>

          <View style={styles.thumbnailContainer}>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              {product?.images?.map((image: string, index: number) => (
                <TouchableOpacity
                  key={index}
                  style={[
                    styles.thumbnail,
                    { borderColor: index === currentImageIndex ? colors.primary : '#ddd' }
                  ]}
                  onPress={() => setCurrentImageIndex(index)}
                >
                  <Image
                    source={{ uri: image }}
                    style={styles.thumbnailImage}
                    resizeMode="cover"
                  />
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: 40,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  cartButton: {
    position: 'relative',
    padding: 8,
    borderRadius: 8,
  },
  cartBadge: {
    position: 'absolute',
    top: 0,
    right: 0,
    backgroundColor: 'red',
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cartBadgeText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
  },
  errorText: {
    fontSize: 16,
    textAlign: 'center',
    marginTop: 50,
  },
  imageContainer: {
    height: 300,
    position: 'relative',
  },
  productImage: {
    width: width,
    height: 300,
  },
  imageIndicator: {
    position: 'absolute',
    bottom: 16,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  productInfo: {
    padding: 16,
  },
  productName: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  brandName: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
  },
  shortDescription: {
    fontSize: 14,
    marginBottom: 16,
    lineHeight: 20,
  },
  variantsContainer: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  variantsList: {
    flexDirection: 'row',
    gap: 12,
    flexWrap: 'wrap',
  },
  variantCard: {
    paddingHorizontal: 4,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 2,
    alignItems: 'center',
    minWidth: 80,
  },
  variantImage: {
    width: 40,
    height: 40,
    marginBottom: 8,
  },
  variantWeight: {
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  variantPrice: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  variantOriginalPrice: {
    fontSize: 12,
    textDecorationLine: 'line-through',
    marginTop: 2,
  },
  priceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
    gap: 8,
  },
  sellingPrice: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  basePrice: {
    fontSize: 16,
    textDecorationLine: 'line-through',
  },
  discount: {
    fontSize: 14,
    color: '#00B761',
    fontWeight: 'bold',
  },
  descriptionContainer: {
    marginBottom: 20,
  },
  descriptionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  toggleButton: {
    paddingVertical: 4,
    paddingHorizontal: 8,
  },
  toggleText: {
    fontSize: 14,
    fontWeight: '600',
  },
  description: {
    fontSize: 14,
    lineHeight: 20,
  },
  bottomContainer: {
    padding: 16,
    borderTopWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  bottomPriceContainer: {
    flexDirection: 'column',
    alignItems: 'flex-start',
    gap: 2,
  },
  bottomSecondRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  bottomSellingPrice: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  bottomBasePrice: {
    fontSize: 16,
    textDecorationLine: 'line-through',
  },
  bottomDiscount: {
    fontSize: 12,
    color: '#00B761',
    fontWeight: 'bold',
  },
  addToCartButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    gap: 6,
    minWidth: 120,
    maxWidth: 140,
  },
  cartControls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  quantityContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 8,
    paddingHorizontal: 4,
  },
  quantityButton: {
    padding: 8,
  },
  quantity: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    marginHorizontal: 12,
    minWidth: 20,
    textAlign: 'center',
  },
  goToCartButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    gap: 6,
  },
  addToCartText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: '#fff',
    paddingTop: 40,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
  closeButton: {
    padding: 10,
  },
  modalImageContainer: {
    flex: 1,
    justifyContent: 'center',
  },
  modalImageWrapper: {
    width: width,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalImage: {
    width: width - 40,
    height: '80%',
  },
  thumbnailContainer: {
    paddingVertical: 20,
    paddingHorizontal: 20,
    backgroundColor: '#f8f8f8',
  },
  thumbnail: {
    width: 60,
    height: 60,
    marginRight: 10,
    borderWidth: 2,
    borderRadius: 8,
    overflow: 'hidden',
  },
  thumbnailImage: {
    width: '100%',
    height: '100%',
  },
});