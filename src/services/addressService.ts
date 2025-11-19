export interface Pincode {
  id: string;
  pincode: string;
}

export interface CreateAddressRequest {
  addressLine1: string;
  addressLine2?: string;
  landmark?: string;
  pincodeId: string;
  type: 'home' | 'office' | 'other';
}

export const addressService = {
  getPincodes: async (): Promise<Pincode[]> => {
    // Mock implementation - replace with actual API call
    return [];
  },
  
  createAddress: async (address: CreateAddressRequest): Promise<void> => {
    // Mock implementation - replace with actual API call
    console.log('Creating address:', address);
  },
};