import React, { useState, useRef, useEffect } from 'react';
import { 
  View, 
  Image, 
  FlatList, 
  Dimensions, 
  StyleSheet, 
  TouchableOpacity 
} from 'react-native';
import { HeroBanner } from '../types';
import { COLORS, RADIUS, SPACING } from '../constants/theme';
import { getImageUrl } from '../services/api';

const { width } = Dimensions.get('window');
const BANNER_WIDTH = width - SPACING.lg * 2;
const BANNER_HEIGHT = 160;

interface BannerCarouselProps {
  banners: HeroBanner[];
  onBannerPress?: (banner: HeroBanner) => void;
}

export const BannerCarousel: React.FC<BannerCarouselProps> = ({ banners, onBannerPress }) => {
  const [activeIndex, setActiveIndex] = useState(0);
  const flatListRef = useRef<FlatList>(null);

  // Filtrer les bannières qui ont une vraie image
  const displayBanners = (banners || []).filter(
    (b) => !!(b.mobile_image_url || b.image_url || b.image_mobile || b.image_desktop)
  );

  // Défilement automatique fluide et sécurisé toutes les 4.5 secondes
  useEffect(() => {
    if (displayBanners.length <= 1) return;
    const interval = setInterval(() => {
      setActiveIndex((prevIndex) => {
        const nextIndex = (prevIndex + 1) % displayBanners.length;
        try {
          flatListRef.current?.scrollToOffset({
            offset: nextIndex * BANNER_WIDTH,
            animated: true,
          });
        } catch (e) {}
        return nextIndex;
      });
    }, 4500);

    return () => clearInterval(interval);
  }, [displayBanners.length]);

  if (!displayBanners || displayBanners.length === 0) return null;

  return (
    <View style={styles.container}>
      <FlatList
        ref={flatListRef}
        data={displayBanners}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        getItemLayout={(_, index) => ({
          length: BANNER_WIDTH,
          offset: BANNER_WIDTH * index,
          index,
        })}
        onScrollToIndexFailed={() => {}}
        keyExtractor={(item) => String(item.id)}
        onMomentumScrollEnd={(e) => {
          const index = Math.round(e.nativeEvent.contentOffset.x / BANNER_WIDTH);
          if (index >= 0 && index < displayBanners.length) {
            setActiveIndex(index);
          }
        }}
        renderItem={({ item }) => {
          const bannerImg = item.mobile_image_url || item.image_url || item.image_mobile || item.image_desktop;
          return (
            <TouchableOpacity 
              activeOpacity={0.9} 
              onPress={() => onBannerPress?.(item)}
              style={styles.bannerItem}
            >
              <Image
                source={{ uri: getImageUrl(bannerImg) }}
                style={styles.bannerImage}
                resizeMode="cover"
              />
            </TouchableOpacity>
          );
        }}
      />

      {/* Indicateurs de pagination */}
      {displayBanners.length > 1 && (
        <View style={styles.pagination}>
          {displayBanners.map((_, index) => (
            <View
              key={index}
              style={[
                styles.dot,
                index === activeIndex ? styles.activeDot : styles.inactiveDot,
              ]}
            />
          ))}
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: SPACING.md,
    alignItems: 'center',
  },
  bannerItem: {
    width: BANNER_WIDTH,
    height: BANNER_HEIGHT,
    borderRadius: RADIUS.lg,
    overflow: 'hidden',
    backgroundColor: COLORS.borderLight,
  },
  bannerImage: {
    width: '100%',
    height: '100%',
  },
  pagination: {
    flexDirection: 'row',
    position: 'absolute',
    bottom: SPACING.sm,
    alignSelf: 'center',
  },
  dot: {
    height: 6,
    borderRadius: 3,
    marginHorizontal: 3,
  },
  activeDot: {
    width: 18,
    backgroundColor: COLORS.primary,
  },
  inactiveDot: {
    width: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.6)',
  },
});
