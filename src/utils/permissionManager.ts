import { Platform, Alert, Linking } from 'react-native';
import { check, request, PERMISSIONS, RESULTS, openSettings } from 'react-native-permissions';

class PermissionManager {
  private getLocationPermission() {
    return Platform.OS === 'ios' 
      ? PERMISSIONS.IOS.LOCATION_WHEN_IN_USE 
      : PERMISSIONS.ANDROID.ACCESS_FINE_LOCATION;
  }

  async requestLocationPermission(showRationale = false): Promise<boolean> {
    const permission = this.getLocationPermission();
    
    try {
      const result = await request(permission);
      
      switch (result) {
        case RESULTS.GRANTED:
          return true;
        case RESULTS.DENIED:
          if (showRationale) {
            this.showPermissionAlert();
          }
          return false;
        case RESULTS.BLOCKED:
          this.showSettingsAlert();
          return false;
        default:
          return false;
      }
    } catch (error) {
      console.error('Permission request error:', error);
      return false;
    }
  }

  async checkLocationPermission(): Promise<'granted' | 'denied' | 'blocked'> {
    const permission = this.getLocationPermission();
    const result = await check(permission);
    
    switch (result) {
      case RESULTS.GRANTED:
        return 'granted';
      case RESULTS.BLOCKED:
        return 'blocked';
      default:
        return 'denied';
    }
  }

  private showPermissionAlert() {
    Alert.alert(
      'Location Permission Required',
      'JholaBazar needs location access to show nearby stores and provide accurate delivery estimates.',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Allow', onPress: () => this.requestLocationPermission() }
      ]
    );
  }

  private showSettingsAlert() {
    Alert.alert(
      'Location Permission Blocked',
      'Please enable location permission in Settings to use this feature.',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Open Settings', onPress: () => openSettings() }
      ]
    );
  }
}

export const permissionManager = new PermissionManager();