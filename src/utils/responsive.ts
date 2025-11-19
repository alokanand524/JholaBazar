import { Dimensions } from 'react-native';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

export const responsive = {
  screenWidth,
  screenHeight,
  isTablet: screenWidth >= 768,
  isSmallPhone: screenWidth < 350,
  
  // Dynamic columns based on screen width
  getProductColumns: () => {
    if (screenWidth >= 768) return 3; // Tablet: 3 columns
    if (screenWidth >= 400) return 2; // Large phone: 2 columns
    return 2; // Small phone: 2 columns
  },
  
  // Dynamic category grid
  getCategoryColumns: () => {
    if (screenWidth >= 768) return 6; // Tablet: 6 categories per row
    if (screenWidth >= 400) return 4; // Large phone: 4 categories
    return 3; // Small phone: 3 categories
  },
  
  // Responsive padding
  getPadding: () => {
    if (screenWidth >= 768) return 24; // Tablet: more padding
    return 16; // Phone: standard padding
  },
  
  // Responsive font sizes
  getFontSize: (base: number) => {
    if (screenWidth >= 768) return base + 2; // Tablet: slightly larger
    if (screenWidth < 350) return base - 1; // Small phone: slightly smaller
    return base;
  }
};