import fcmService from './fcmService';
import { NavigationContainerRef } from '@react-navigation/native';

class NotificationService {
  private navigationRef: NavigationContainerRef<any> | null = null;

  setNavigationRef(ref: NavigationContainerRef<any>) {
    this.navigationRef = ref;
  }

  async initialize() {
    await fcmService.initialize();
  }

  navigateFromNotification(data: any) {
    if (!this.navigationRef || !data) return;

    const { type, orderId, productId } = data;

    switch (type) {
      case 'ORDER_CONFIRMED':
      case 'ORDER_DISPATCHED':
      case 'ORDER_DELIVERED':
        this.navigationRef.navigate('OrderDetails', { orderId });
        break;
      case 'PROMOTIONAL':
        this.navigationRef.navigate('Home');
        break;
      case 'PRODUCT':
        if (productId) {
          this.navigationRef.navigate('ProductDetails', { productId });
        }
        break;
      default:
        this.navigationRef.navigate('Home');
    }
  }
}

export default new NotificationService();