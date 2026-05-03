/**
 * Track-Asia Service for autocomplete and geocoding
 */

const API_KEY = import.meta.env.VITE_TRACK_ASIA_API_KEY;
const AUTOCOMPLETE_URL = "https://maps.track-asia.com/api/v2/place/autocomplete/json";

export interface AutocompletePrediction {
  description: string;
  place_id: string;
}

export interface GeocodeResult {
  latitude: number;
  longitude: number;
  address: string;
}

/**
 * Fetch autocomplete suggestions from Track-Asia
 */
export async function fetchAutocompleteSuggestions(
  input: string
): Promise<AutocompletePrediction[]> {
  if (input.length < 2) {
    return [];
  }

  try {
    console.log("🔍 Fetching Track-Asia autocomplete for:", input);

    const params = new URLSearchParams({
      input,
      key: API_KEY,
      size: "5",
    });

    const response = await fetch(`${AUTOCOMPLETE_URL}?${params.toString()}`);
    const data = await response.json();

    console.log("✅ Track-Asia autocomplete response:", data);

    if (data.status === "OK" && data.predictions) {
      return data.predictions.map((pred: any) => ({
        description: pred.description,
        place_id: pred.place_id,
      }));
    }

    return [];
  } catch (error) {
    console.error("❌ Error fetching Track-Asia autocomplete:", error);
    return [];
  }
}

/**
 * Get place details including coordinates using place_id
 */
export async function getPlaceDetails(placeId: string): Promise<GeocodeResult | null> {
  try {
    console.log("📍 Fetching Track-Asia place details for place_id:", placeId);

    const params = new URLSearchParams({
      place_id: placeId,
      key: API_KEY,
    });

    const detailsUrl = `https://maps.track-asia.com/api/v2/place/details/json?${params.toString()}`;
    const response = await fetch(detailsUrl);
    const data = await response.json();

    console.log("✅ Track-Asia place details response:", data);

    if (data.status === "OK" && data.result && data.result.geometry) {
      const location = data.result.geometry.location;
      const address = data.result.formatted_address;

      return {
        latitude: location.lat,
        longitude: location.lng,
        address: address,
      };
    }

    return null;
  } catch (error) {
    console.error("❌ Error fetching place details:", error);
    return null;
  }
}
