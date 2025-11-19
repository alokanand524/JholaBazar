import React, { useEffect, useRef, useState } from 'react';
import { Dimensions, Image, ScrollView, StyleSheet, TouchableOpacity, View, NativeSyntheticEvent, NativeScrollEvent, Text } from 'react-native';
import { SkeletonLoader } from './SkeletonLoader';
import { API_ENDPOINTS } from '../constants/api';

const { width } = Dimensions.get('window');

interface Banner {
  id: string;
  imageUrl: string;
  title: string;
}

const getFallbackBanners = (): Banner[] => [
  {
    id: '1',
    imageUrl: 'https://via.placeholder.com/400x180/00B761/FFFFFF?text=Fresh+Groceries',
    title: 'Fresh Groceries'
  },
  {
    id: '2', 
    imageUrl: 'https://via.placeholder.com/400x180/FF6B35/FFFFFF?text=Daily+Essentials',
    title: 'Daily Essentials'
  },
  {
    id: '3',
    imageUrl: 'https://via.placeholder.com/400x180/4ECDC4/FFFFFF?text=Fast+Delivery',
    title: 'Fast Delivery'
  }
];

export const BannerCarousel: React.FC = () => {
  const scrollRef = useRef<ScrollView>(null);
  const currentIndex = useRef(1);
  const [isLoading, setIsLoading] = useState(true);
  const [banners, setBanners] = useState<Banner[]>([]);
  const [infiniteBanners, setInfiniteBanners] = useState<Banner[]>([]);

  const handleBannerClick = async (bannerId: string) => {
    try {
      await fetch(`${API_ENDPOINTS.BASE_URL}/scroller/${bannerId}/click`, { method: 'POST' });
    } catch (error) {
      console.error('Error tracking banner click:', error);
    }
  };

  const fetchBanners = async () => {
    try {
      const response = await fetch('https://api.jholabazar.com/api/v1/scroller/');
      const data = await response.json();
      
      if (data.success && data.data && data.data.scrollers) {
        const bannerData: Banner[] = data.data.scrollers.map((item: any) => ({
          id: item.id,
          imageUrl: item.imageUrl,
          title: item.title || '',
        }));
        setBanners(bannerData);
      } else {
        setBanners(getFallbackBanners());
      }
    } catch (error) {
      console.error('Error fetching banners:', error);
      setBanners(getFallbackBanners());
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchBanners();
  }, []);

  useEffect(() => {
    if (banners.length > 0) {
      const lastBanner = banners.at(-1); // ✅ modern, safer
      const firstBanner = banners.at(0);
      const infList = [lastBanner!, ...banners, firstBanner!];
      setInfiniteBanners(infList);

      setTimeout(() => {
        scrollRef.current?.scrollTo({ x: width, animated: false });
      }, 100);
    }
  }, [banners]);


  useEffect(() => {
    if (infiniteBanners.length > 0) {
      const interval = setInterval(() => {
        currentIndex.current += 1;
        scrollRef.current?.scrollTo({
          x: currentIndex.current * width,
          animated: true,
        });
      }, 4000);

      return () => clearInterval(interval);
    }
  }, [infiniteBanners]);

  const handleScrollEnd = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const contentOffsetX = event.nativeEvent.contentOffset.x;
    const index = Math.round(contentOffsetX / width);

    if (index === infiniteBanners.length - 1) {
      currentIndex.current = 1;
      scrollRef.current?.scrollTo({ x: width, animated: false });
    } else if (index === 0) {
      currentIndex.current = infiniteBanners.length - 2;
      scrollRef.current?.scrollTo({
        x: (infiniteBanners.length - 2) * width,
        animated: false,
      });
    } else {
      currentIndex.current = index;
    }
  };

  if (isLoading) {
    return (
      <View style={styles.container}>
        <SkeletonLoader width={width * 0.9} height={180} borderRadius={12} />
      </View>
    );
  }

  if (banners.length === 0) {
    return (
      <View style={[styles.container, styles.emptyContainer]}>
        <Text style={styles.emptyText}>No banners available</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView
        ref={scrollRef}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        snapToInterval={width}
        decelerationRate="fast"
        style={styles.scrollView}
        onMomentumScrollEnd={handleScrollEnd}
      >
        {infiniteBanners.map((banner, index) => (
          <View key={`${banner.id}-${index}`} style={styles.bannerContainer}>
            <TouchableOpacity onPress={() => handleBannerClick(banner.id)}>
              <Image source={{ uri: banner.imageUrl }} style={styles.banner} />
            </TouchableOpacity>
          </View>
        ))}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    height: 180,
    marginVertical: 16,
  },
  scrollView: {
    flex: 1,
  },
  bannerContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    width: width,
  },
  banner: {
    width: width * 0.9,
    height: 180,
    borderRadius: 12,
  },
  emptyContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: {
    color: '#777',
    fontSize: 14,
  },
});
