import { config } from '../config/env';

export interface PlaceResult {
  id: string;
  name: string;
  address: string;
  location: {
    lat: number;
    lng: number;
  };
  shortAddress: string;
  secondaryText: string;
  types: string[];
  icon: string;
  distance?: string;
  rating?: number;
  isNearby?: boolean;
}

export interface AutocompleteResult {
  predictions: PlaceResult[];
  nearbyPlaces: PlaceResult[];
}

class PlacesService {
  private readonly baseUrl = 'https://maps.googleapis.com/maps/api/place';
  private readonly apiKey = config.GOOGLE_MAPS_API_KEY;

  private getPlaceIcon(types: string[]): string {
    const typeIconMap: { [key: string]: string } = {
      restaurant: 'restaurant',
      food: 'restaurant',
      meal_takeaway: 'restaurant',
      meal_delivery: 'restaurant',
      hospital: 'local-hospital',
      pharmacy: 'local-pharmacy',
      school: 'school',
      university: 'school',
      bank: 'account-balance',
      atm: 'atm',
      gas_station: 'local-gas-station',
      shopping_mall: 'shopping-cart',
      store: 'store',
      supermarket: 'shopping-cart',
      grocery_or_supermarket: 'shopping-cart',
      convenience_store: 'store',
      clothing_store: 'checkroom',
      electronics_store: 'devices',
      book_store: 'menu-book',
      pharmacy: 'local-pharmacy',
      beauty_salon: 'face',
      hair_care: 'face',
      gym: 'fitness-center',
      park: 'park',
      tourist_attraction: 'attractions',
      museum: 'museum',
      movie_theater: 'movie',
      night_club: 'nightlife',
      bar: 'local-bar',
      cafe: 'local-cafe',
      bakery: 'bakery-dining',
      lodging: 'hotel',
      taxi_stand: 'local-taxi',
      bus_station: 'directions-bus',
      subway_station: 'train',
      train_station: 'train',
      airport: 'flight',
      church: 'church',
      hindu_temple: 'temple-hindu',
      mosque: 'mosque',
      synagogue: 'synagogue',
      cemetery: 'cemetery',
      post_office: 'local-post-office',
      police: 'local-police',
      fire_station: 'local-fire-department',
      courthouse: 'account-balance',
      city_hall: 'account-balance',
      embassy: 'account-balance',
      library: 'local-library',
      dentist: 'medical-services',
      veterinary_care: 'pets',
      car_dealer: 'directions-car',
      car_rental: 'car-rental',
      car_repair: 'car-repair',
      car_wash: 'local-car-wash',
      parking: 'local-parking',
      real_estate_agency: 'home',
      insurance_agency: 'security',
      travel_agency: 'flight-takeoff',
      laundry: 'local-laundry-service',
      funeral_home: 'cemetery',
      moving_company: 'local-shipping',
      storage: 'storage',
      locksmith: 'lock',
      electrician: 'electrical-services',
      plumber: 'plumbing',
      roofing_contractor: 'roofing',
      painter: 'format-paint',
      florist: 'local-florist',
      jewelry_store: 'diamond',
      shoe_store: 'checkroom',
      bicycle_store: 'pedal-bike',
      pet_store: 'pets',
      hardware_store: 'hardware',
      home_goods_store: 'home',
      furniture_store: 'chair',
      establishment: 'business',
      point_of_interest: 'place',
      premise: 'business',
      subpremise: 'business',
      natural_feature: 'terrain',
      country: 'public',
      administrative_area_level_1: 'public',
      administrative_area_level_2: 'public',
      locality: 'location-city',
      sublocality: 'location-on',
      neighborhood: 'location-on',
      route: 'alt-route',
      street_address: 'home',
      postal_code: 'markunread-mailbox'
    };

    for (const type of types) {
      if (typeIconMap[type]) {
        return typeIconMap[type];
      }
    }

    return 'location-on';
  }

  private calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): string {
    const R = 6371; // Radius of the Earth in kilometers
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
      Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    const distance = R * c;

    if (distance < 1) {
      return `${Math.round(distance * 1000)}m`;
    } else {
      return `${distance.toFixed(1)}km`;
    }
  }

  async getAutocomplete(
    input: string, 
    location?: { lat: number; lng: number },
    radius: number = 50000
  ): Promise<PlaceResult[]> {
    if (!input.trim() || input.length < 2) {
      return [];
    }

    try {
      const locationParam = location ? `&location=${location.lat},${location.lng}&radius=${radius}` : '';
      const url = `${this.baseUrl}/autocomplete/json?input=${encodeURIComponent(input)}&key=${this.apiKey}&components=country:in&types=establishment|geocode${locationParam}`;
      
      const response = await fetch(url);
      const data = await response.json();

      if (data.predictions && data.predictions.length > 0) {
        const results = await Promise.all(
          data.predictions.slice(0, 8).map(async (prediction: any) => {
            try {
              const details = await this.getPlaceDetails(prediction.place_id);
              if (details) {
                return {
                  ...details,
                  distance: location ? this.calculateDistance(
                    location.lat, 
                    location.lng, 
                    details.location.lat, 
                    details.location.lng
                  ) : undefined
                };
              }
            } catch (error) {
              console.error('Error getting place details:', error);
            }
            return null;
          })
        );

        return results.filter(result => result !== null) as PlaceResult[];
      }

      return [];
    } catch (error) {
      console.error('Autocomplete error:', error);
      return [];
    }
  }

  async getNearbyPlaces(
    location: { lat: number; lng: number },
    radius: number = 2000,
    types: string[] = ['establishment']
  ): Promise<PlaceResult[]> {
    try {
      const typeParam = types.length > 0 ? `&type=${types.join('|')}` : '';
      const url = `${this.baseUrl}/nearbysearch/json?location=${location.lat},${location.lng}&radius=${radius}&key=${this.apiKey}${typeParam}&rankby=prominence`;
      
      const response = await fetch(url);
      const data = await response.json();

      if (data.results && data.results.length > 0) {
        return data.results.slice(0, 10).map((place: any) => ({
          id: place.place_id,
          name: place.name,
          address: place.vicinity || place.formatted_address || '',
          location: {
            lat: place.geometry.location.lat,
            lng: place.geometry.location.lng
          },
          shortAddress: place.name,
          secondaryText: place.vicinity || place.formatted_address || '',
          types: place.types || [],
          icon: this.getPlaceIcon(place.types || []),
          rating: place.rating,
          distance: this.calculateDistance(
            location.lat,
            location.lng,
            place.geometry.location.lat,
            place.geometry.location.lng
          ),
          isNearby: true
        }));
      }

      return [];
    } catch (error) {
      console.error('Nearby places error:', error);
      return [];
    }
  }

  async getPlaceDetails(placeId: string): Promise<PlaceResult | null> {
    try {
      const url = `${this.baseUrl}/details/json?place_id=${placeId}&key=${this.apiKey}&fields=geometry,formatted_address,name,types,rating,vicinity`;
      
      const response = await fetch(url);
      const data = await response.json();

      if (data.result) {
        const result = data.result;
        return {
          id: placeId,
          name: result.name || '',
          address: result.formatted_address || result.vicinity || '',
          location: {
            lat: result.geometry.location.lat,
            lng: result.geometry.location.lng
          },
          shortAddress: result.name || result.formatted_address?.split(',')[0] || '',
          secondaryText: result.vicinity || result.formatted_address?.split(',').slice(1, 3).join(', ') || '',
          types: result.types || [],
          icon: this.getPlaceIcon(result.types || []),
          rating: result.rating
        };
      }

      return null;
    } catch (error) {
      console.error('Place details error:', error);
      return null;
    }
  }

  async searchWithSuggestions(
    input: string,
    userLocation?: { lat: number; lng: number }
  ): Promise<AutocompleteResult> {
    const [predictions, nearbyPlaces] = await Promise.all([
      this.getAutocomplete(input, userLocation),
      userLocation && input.length < 3 ? this.getNearbyPlaces(userLocation) : Promise.resolve([])
    ]);

    return {
      predictions,
      nearbyPlaces: nearbyPlaces.slice(0, 5) // Limit nearby places
    };
  }
}

export const placesService = new PlacesService();