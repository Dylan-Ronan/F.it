const API_BASE_URL = (import.meta as any).env?.VITE_API_URL || 'https://f-it.onrender.com';

// Helper function to map backend Item to frontend ClothingItem
function mapBackendItemToClothingItem(backendItem: any): any {
  // Map backend Type to frontend category
  const typeToCategory: Record<string, string> = {
    'top': 'tops',
    'bottom': 'bottoms',
    'shoe': 'shoes',
    'coat': 'outerwear',
    'accessory': 'accessories',
    'umbrella': 'accessories',
  };

  const rawStyles2 = backendItem.Styles2 ?? backendItem.styles2;
  const styles2 = typeof rawStyles2 === 'string'
    ? rawStyles2.split(',').map((s: string) => s.trim().toLowerCase()).filter(Boolean)
    : Array.isArray(rawStyles2)
      ? rawStyles2.map((s: string) => s.toLowerCase())
      : undefined;

  const minTemp = backendItem.MinTemp ?? backendItem.minTemp;
  const maxTemp = backendItem.MaxTemp ?? backendItem.maxTemp;

  return {
    id: backendItem.IID?.toString() || backendItem.id?.toString() || '',
    name: backendItem.Name || backendItem.name || 'Unnamed Item',
    category: typeToCategory[backendItem.Type] || 'tops',
    colors: backendItem.Colors ? backendItem.Colors.split(',').map((c: string) => c.trim().toLowerCase()) : [],
    style: backendItem.Styles ? backendItem.Styles.split(',').map((s: string) => s.trim().toLowerCase()) : [],
    styles2,
    minTemp: typeof minTemp === 'number' ? minTemp : minTemp != null ? Number(minTemp) : undefined,
    maxTemp: typeof maxTemp === 'number' ? maxTemp : maxTemp != null ? Number(maxTemp) : undefined,
    imageUrl: backendItem.Image_url || backendItem.imageUrl || undefined,
  };
}

export const api = {
  // Auth endpoints
  auth: {
    googleLogin: () => {
      const frontendUrl = window.location.origin;
      const callbackUrl = `${frontendUrl}/auth/callback`;
      window.location.href = `${API_BASE_URL}/auth/google?redirect=${encodeURIComponent(callbackUrl)}`;
    },

    getMe: async () => {
      const response = await fetch(`${API_BASE_URL}/auth/me`, {
        method: 'GET',
        credentials: 'include',
      });
      return response.json();
    },
    
    logout: async () => {
      try {
        await fetch(`${API_BASE_URL}/logout`, {
          method: 'GET',
          credentials: 'include',
        });
      } catch (error) {
        console.error('Logout error:', error);
      }
    },
  },

  // User endpoints
  user: {
    updatePreferences: async (userID: string, preferences: {
      favorite_colors?: string[];
      favorite_styles?: string[];
    }) => {
      // Server expects 'colors' and 'styles', not 'favorite_colors' and 'favorite_styles'
      const body = {
        colors: preferences.favorite_colors,
        styles: preferences.favorite_styles,
      };
      const response = await fetch(`${API_BASE_URL}/user/${userID}/preferences`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(body),
      });
      return response.json();
    },

    getProfile: async (userID: string) => {
      const response = await fetch(`${API_BASE_URL}/user/${userID}/profile`, {
        method: 'GET',
        credentials: 'include',
      });
      return response.json();
    },

    updateProfile: async (userID: string, profileData: {
      name?: string;
      photo?: string;
      favorite_colors?: string;
      favorite_styles?: string;
      gender?: string;
    }) => {
      const response = await fetch(`${API_BASE_URL}/user/${userID}/profile`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(profileData),
      });
      return response.json();
    },

    getWardrobeByType: async (userID: string, type: string) => {
      const response = await fetch(`${API_BASE_URL}/user/${userID}/${type}`, {
        method: 'GET',
        credentials: 'include',
      });
      return response.json();
    },

    // Fetch all wardrobe items for a user
    getAllWardrobe: async (userID: string) => {
      try {
        // Fetch all clothing types in parallel - using server's type names
        const [topsRes, bottomsRes, shoesRes, coatsRes, accessoriesRes] = await Promise.all([
          api.user.getWardrobeByType(userID, 'top'),
          api.user.getWardrobeByType(userID, 'bottom'),
          api.user.getWardrobeByType(userID, 'shoe'),
          api.user.getWardrobeByType(userID, 'coat'),
          api.user.getWardrobeByType(userID, 'accessory'),
        ]);

        // Backend returns items in a 'shirts' property for all types
        const backendItems = [
          ...(topsRes.shirts || []),
          ...(bottomsRes.shirts || []),
          ...(shoesRes.shirts || []),
          ...(coatsRes.shirts || []),
          ...(accessoriesRes.shirts || []),
        ];

        // Map backend items to frontend ClothingItem format
        return backendItems.map(mapBackendItemToClothingItem);
      } catch (error) {
        console.error('Error fetching wardrobe:', error);
        return [];
      }
    },

    // Add item to wardrobe
    addItem: async (userID: string, item: any) => {
      const response = await fetch(`${API_BASE_URL}/user/${userID}/item`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(item),
      });
      return response.json();
    },

    // Delete item from wardrobe
    deleteItem: async (itemID: string) => {
      const response = await fetch(`${API_BASE_URL}/delete_item/${itemID}`, {
        method: 'DELETE',
        credentials: 'include',
      });
      return response.json();
    },

    // Mark item as available
    markAvailable: async (itemID: string) => {
      const response = await fetch(`${API_BASE_URL}/mark_available/${itemID}`, {
        method: 'PUT',
        credentials: 'include',
      });
      return response.json();
    },

    // Mark item as unavailable (toggle availability)
    markUnavailable: async (itemID: string) => {
      // Note: Backend needs a /mark_unavailable endpoint
      // For now, we'll use mark_available with a flag or handle locally
      const response = await fetch(`${API_BASE_URL}/mark_unavailable/${itemID}`, {
        method: 'PUT',
        credentials: 'include',
      });
      return response.json();
    },

    // Analyze clothing image with AI. Retries on Gemini failure with exponential backoff.
    analyzeImage: async (userID: string, imageBase64: string, maxRetries = 3) => {
      let lastResult: any = null;
      let lastError: unknown = null;

      for (let attempt = 0; attempt <= maxRetries; attempt++) {
        try {
          const response = await fetch(`${API_BASE_URL}/analyzeimage/${userID}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify({ imagePath: imageBase64 }),
          });
          const data = await response.json();
          if (response.ok && data?.success && data?.analysis) {
            if (attempt > 0) {
              console.info(`analyzeImage succeeded on retry ${attempt}`);
            }
            return data;
          }
          lastResult = data;
          console.warn(`analyzeImage attempt ${attempt + 1} failed:`, data);
        } catch (err) {
          lastError = err;
          console.warn(`analyzeImage attempt ${attempt + 1} threw:`, err);
        }

        if (attempt < maxRetries) {
          const delayMs = Math.min(1000 * 2 ** attempt, 8000);
          await new Promise(resolve => setTimeout(resolve, delayMs));
        }
      }

      return lastResult ?? {
        success: false,
        error: lastError instanceof Error ? lastError.message : 'Analysis failed after retries',
      };
    },
  },

  // Location & Weather
  location: {
    getLocation: async () => {
      const response = await fetch(`${API_BASE_URL}/location`, {
        method: 'GET',
        credentials: 'include',
      });
      return response.json();
    },

    getWeather: async () => {
      const response = await fetch(`${API_BASE_URL}/weather`, {
        method: 'GET',
        credentials: 'include',
      });
      return response.json();
    },
  },

  // Outfit generation
  outfit: {
    generate: async (userID: string, style: string) => {
      const response = await fetch(`${API_BASE_URL}/generateOutfit/${userID}/${style}`, {
        method: 'GET',
        credentials: 'include',
      });
      return response.json();
    },

    styleAnItem: async (userID: string, itemID: string) => {
      const response = await fetch(`${API_BASE_URL}/styleAnItem/${userID}/${itemID}`, {
        method: 'GET',
        credentials: 'include',
      });
      return response.json();
    },
  },
};

export default api;
