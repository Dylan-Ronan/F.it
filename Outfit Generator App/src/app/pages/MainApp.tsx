import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router';
import { Sparkles, LogOut, Calendar as CalendarIcon, User } from 'lucide-react';
import { ClothingItem, DailyPlan, Outfit } from '../types/wardrobe';
import { WardrobeManager } from '../components/WardrobeManager';
import { OutfitGeneratorEnhanced } from '../components/OutfitGeneratorEnhanced';
import { WardrobeSelector } from '../components/WardrobeSelector';
import { ProfileSettings } from '../components/ProfileSettings';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { pics } from '../../pics';
import Shopping from './Shopping';
import { api } from '../services/api';
import { UserPreferences } from '../utils/personalizedSearch';

// Sample wardrobe data
const sampleWardrobe: ClothingItem[] = [
  {
    id: '1',
    name: 'White Oxford Shirt',
    category: 'tops',
    colors: ['white'],
    style: ['work', 'formal', 'date'],
    imageUrl: pics.whiteOxford,
  },
  {
    id: '2',
    name: 'Black T-Shirt',
    category: 'tops',
    colors: ['black'],
    style: ['casual', 'workout'],
    imageUrl: pics.blackTShirt,
  },
  {
    id: '3',
    name: 'Navy Blazer',
    category: 'outerwear',
    colors: ['navy'],
    style: ['work', 'formal', 'date'],
    imageUrl: pics.navyBlazer,
  },
  {
    id: '4',
    name: 'Blue Jeans',
    category: 'bottoms',
    colors: ['blue'],
    style: ['casual', 'date', 'outdoor'],
    imageUrl: pics.jeans,
  },
  {
    id: '5',
    name: 'Black Dress Pants',
    category: 'bottoms',
    colors: ['black'],
    style: ['work', 'formal'],
    imageUrl: pics.blackDressPants,
  },
  {
    id: '6',
    name: 'Brown Leather Shoes',
    category: 'shoes',
    colors: ['brown'],
    style: ['work', 'formal', 'casual', 'date'],
    imageUrl: pics.brownShoes,
  },
  {
    id: '7',
    name: 'White Sneakers',
    category: 'shoes',
    colors: ['white'],
    style: ['casual', 'workout', 'outdoor', 'date'],
    imageUrl: pics.whiteSneakers,
  },
  {
    id: '8',
    name: 'Silver Watch',
    category: 'accessories',
    colors: ['gray'],
    style: ['work', 'formal', 'casual', 'date'],
    imageUrl: pics.watch,
  },
  {
    id: '9',
    name: 'Gray Sweater',
    category: 'tops',
    colors: ['gray'],
    style: ['casual', 'work', 'outdoor', 'date'],
    imageUrl: pics.graySweater,
  },
  {
    id: '10',
    name: 'White Sweatpants',
    category: 'bottoms',
    colors: ['white'],
    style: ['casual', 'workout'],
    imageUrl: pics.whiteSweats,
  },
  {
    id: '12',
    name: 'Striped Long Sleeve Tee',
    category: 'tops',
    colors: ['white', 'navy'],
    style: ['casual', 'outdoor'],
    imageUrl: pics.stripedLong,
  },
  {
    id: '13',
    name: 'Adidas Ultraboost',
    category: 'shoes',
    colors: ['black', 'white'],
    style: ['casual', 'outdoor', 'workout'],
    imageUrl: pics.ultraboost,
  },
  {
    id: '14',
    name: '"I paused my game to be here" T-shirt',
    category: 'tops',
    colors: ['gray'],
    style: ['casual', 'workout'],
    imageUrl: pics.pausedMyGameShirt,
  },
  {
    id: '15',
    name: 'Beige Turtleneck',
    category: 'tops',
    colors: ['beige'],
    style: ['casual', 'date', 'work'],
    imageUrl: pics.beigeTurtle,
  },
  {
    id: '16',
    name: 'Khaki Chinos',
    category: 'bottoms',
    colors: ['beige'],
    style: ['casual', 'work', 'date'],
    imageUrl: pics.khakis,
  },
  {
    id: '18',
    name: 'Navy Shorts',
    category: 'bottoms',
    colors: ['navy'],
    style: ['casual', 'workout', 'outdoor'],
    imageUrl: pics.navyShorts,
  },
  {
    id: '19',
    name: 'Black Rain Coat',
    category: 'outerwear',
    colors: ['black'],
    style: ['outdoor'],
    imageUrl: pics.blackRaincoat,
  },
  {
    id: '20',
    name: 'Gray Wool Trousers',
    category: 'bottoms',
    colors: ['gray'],
    style: ['work', 'formal', 'date'],
    imageUrl: pics.grayWoolTrousers,
  },
  {
    id: '21',
    name: 'Denim Jacket',
    category: 'outerwear',
    colors: ['blue'],
    style: ['casual', 'outdoor'],
    imageUrl: pics.denimJacket,
  },
  {
    id: '22',
    name: 'Black Leather Jacket',
    category: 'outerwear',
    colors: ['black'],
    style: ['casual', 'date'],
    imageUrl: pics.leatherJacket,
  },
  {
    id: '23',
    name: 'Beige Trench Coat',
    category: 'outerwear',
    colors: ['beige'],
    style: ['work', 'formal'],
    imageUrl: pics.trenchCoat,
  },
  {
    id: '24',
    name: 'Gray Hoodie',
    category: 'outerwear',
    colors: ['gray'],
    style: ['casual', 'workout', 'outdoor'],
    imageUrl: pics.grayHoodie,
  },
  {
    id: '25',
    name: 'Black Running Shoes',
    category: 'shoes',
    colors: ['black'],
    style: ['workout', 'casual'],
    imageUrl: pics.blackRunning,
  },
  {
    id: '26',
    name: 'Navy Loafers',
    category: 'shoes',
    colors: ['navy'],
    style: ['work', 'casual'],
    imageUrl: pics.navyLoafers,
  },
  {
    id: '28',
    name: 'Tan Boots',
    category: 'shoes',
    colors: ['brown'],
    style: ['casual', 'outdoor'],
    imageUrl: pics.brownBoots,
  },
  {
    id: '29',
    name: 'Leather Belt',
    category: 'accessories',
    colors: ['brown'],
    style: ['work', 'casual', 'formal'],
    imageUrl: pics.belt,
  },
  {
    id: '30',
    name: 'Sunglasses',
    category: 'accessories',
    colors: ['black'],
    style: ['casual', 'outdoor', 'date'],
    imageUrl: pics.sunglasses,
  },
  {
    id: '32',
    name: 'Gold Necklace',
    category: 'accessories',
    colors: ['yellow'],
    style: ['date', 'formal', 'casual','date'],
    imageUrl: pics.necklace,
  },
  {
    id: '33',
    name: 'Black Backpack',
    category: 'accessories',
    colors: ['black'],
    style: ['casual', 'outdoor', 'workout'],
    imageUrl: pics.backpack,
  },
  {
    id: '34',
    name: 'Beige Tote Bag',
    category: 'accessories',
    colors: ['beige'],
    style: ['work', 'casual'],
    imageUrl: pics.toteBag,
  },
];

export function MainApp() {
  const navigate = useNavigate();
  const [wardrobe, setWardrobe] = useState<ClothingItem[]>([]);
  const [unavailableItems, setUnavailableItems] = useState<string[]>([]);
  const [anchorItem, setAnchorItem] = useState<ClothingItem | undefined>();
  const [userEmail, setUserEmail] = useState('');
  const [userName, setUserName] = useState('');
  const [userPhoto, setUserPhoto] = useState('');
  const [favoriteColors, setFavoriteColors] = useState<string[]>([]);
  const [favoriteStyles, setFavoriteStyles] = useState<string[]>([]);
  const [userGender, setUserGender] = useState<string>('');
  const [isLoadingWardrobe, setIsLoadingWardrobe] = useState(true);
  const [activeTab, setActiveTab] = useState('quick');
  const userPrefs: UserPreferences = {
    gender: userGender,
    favoriteStyles: favoriteStyles,
    favoriteColors: favoriteColors,
  };

  useEffect(() => {
    const loadUserData = async () => {
      // Check authentication
      const isAuthenticated = localStorage.getItem('isAuthenticated');
      if (!isAuthenticated) {
        navigate('/');
        return;
      }

      // Get user email and ID
      const email = localStorage.getItem('userEmail');
      const name = localStorage.getItem('userName');
      const photo = localStorage.getItem('userPhoto');
      const userID = localStorage.getItem('userID');
      
      if (email) {
        setUserEmail(email);
      }
      if (name) {
        setUserName(name);
      }
      if (photo) {
        setUserPhoto(photo);
      }

      // If this is the demo account, use sample data
      if (userID === 'demo-user-123') {
        setWardrobe(sampleWardrobe);
        setIsLoadingWardrobe(false);
        return;
      }

      // Fetch user's wardrobe and profile from backend
      if (userID) {
        try {
          setIsLoadingWardrobe(true);
          
          // Fetch wardrobe
          const items = await api.user.getAllWardrobe(userID);
          if (items.length > 0) {
            setWardrobe(items);
          } else {
            setWardrobe([]);
          }

          // Fetch user profile
          const profileResponse = await api.user.getProfile(userID);
          if (profileResponse.success && profileResponse.profile) {
            const profile = profileResponse.profile;
            setUserEmail(profile.email || email || '');
            setUserName(profile.name || name || '');
            setUserPhoto(profile.photo || photo || '');
            
            // Parse favorite colors and styles (they're stored as comma-separated strings)
            if (profile.favorite_colors) {
              const colors = typeof profile.favorite_colors === 'string' 
                ? profile.favorite_colors.split(',').map((c: string) => c.trim())
                : profile.favorite_colors;
              setFavoriteColors(colors);
            }
            
            if (profile.favorite_styles) {
              const styles = typeof profile.favorite_styles === 'string'
                ? profile.favorite_styles.split(',').map((s: string) => s.trim())
                : profile.favorite_styles;
              setFavoriteStyles(styles);
            }
            
            if (profile.gender) {
              setUserGender(profile.gender);
            }
          }
        } catch (error) {
          console.error('Failed to load wardrobe:', error);
          // Fallback to empty wardrobe on error
          setWardrobe([]);
        } finally {
          setIsLoadingWardrobe(false);
        }
      } else {
        setIsLoadingWardrobe(false);
      }
    };

    loadUserData();
  }, [navigate]);


  const handleAddItem = async (item: Omit<ClothingItem, 'id'>) => {
    const userID = localStorage.getItem('userID');
    
    // If demo user, just add locally
    if (userID === 'demo-user-123') {
      const newItem: ClothingItem = {
        ...item,
        id: Date.now().toString(),
      };
      setWardrobe([...wardrobe, newItem]);
      return;
    }

    // For real users, add to backend
    if (userID) {
      try {
        // Map frontend item format to backend format
        const backendItem = {
          analysis: {
            name: item.name,
            category: item.category === 'tops' ? 'top' : 
                     item.category === 'bottoms' ? 'bottom' : 
                     item.category === 'shoes' ? 'shoe' : 
                     item.category === 'outerwear' ? 'coat' : 
                     item.category === 'accessories' ? 'accessory' : 
                     item.category,
            colors: item.colors,
            styles: item.style,
            styles2: item.styles2,
            minTemp: item.minTemp,
            maxTemp: item.maxTemp,
          },
          imageUrl: item.imageUrl || '',
        };

        const response = await api.user.addItem(userID, backendItem);
        
        if (response.success) {
          // Refresh wardrobe from backend
          const updatedWardrobe = await api.user.getAllWardrobe(userID);
          setWardrobe(updatedWardrobe);
        }
      } catch (error) {
        console.error('Failed to add item:', error);
      }
    }
  };

  const handleRemoveItem = async (id: string) => {
    const userID = localStorage.getItem('userID');
    
    // If demo user, just remove locally
    if (userID === 'demo-user-123') {
      setWardrobe(wardrobe.filter(item => item.id !== id));
      return;
    }

    // For real users, delete from backend
    try {
      const response = await api.user.deleteItem(id);
      
      if (response.success) {
        // Remove from local state
        setWardrobe(wardrobe.filter(item => item.id !== id));
      }
    } catch (error) {
      console.error('Failed to remove item:', error);
    }
  };

  const handleUnavailableChange = async (itemIds: string[]) => {
    const userID = localStorage.getItem('userID');
    
    // Update local state immediately for better UX
    const previousUnavailable = unavailableItems;
    setUnavailableItems(itemIds);

    // If demo user, just update locally
    if (userID === 'demo-user-123') {
      return;
    }

    // For real users, sync with backend
    try {
      // Find which items were added or removed
      const added = itemIds.filter(id => !previousUnavailable.includes(id));
      const removed = previousUnavailable.filter(id => !itemIds.includes(id));

      // Mark items as unavailable
      for (const itemId of added) {
        await api.user.markUnavailable(itemId);
      }

      // Mark items as available
      for (const itemId of removed) {
        await api.user.markAvailable(itemId);
      }
    } catch (error) {
      console.error('Failed to update item availability:', error);
      // Revert on error
      setUnavailableItems(previousUnavailable);
    }
  };

  const handleLogout = async () => {
    // Call backend logout endpoint
    await api.auth.logout();
    
    // Clear local storage
    localStorage.removeItem('isAuthenticated');
    localStorage.removeItem('userEmail');
    localStorage.removeItem('userID');
    localStorage.removeItem('userName');
    localStorage.removeItem('userPhoto');
    localStorage.removeItem('authToken');
    
    navigate('/');
  };

  const handleSaveProfile = async (data: { name: string; colors: string[]; styles: string[]; gender: string }) => {
    try {
      const userID = localStorage.getItem('userID');
      
      // Update local state
      setUserName(data.name);
      setFavoriteColors(data.colors);
      setFavoriteStyles(data.styles);
      setUserGender(data.gender);
      localStorage.setItem('userName', data.name);
      
      // If not demo user, save to backend
      if (userID && userID !== 'demo-user-123') {
        const response = await api.user.updateProfile(userID, {
          name: data.name,
          favorite_colors: data.colors.join(','),
          favorite_styles: data.styles.join(','),
          gender: data.gender,
        });
        
        if (response.success) {
          alert('Profile updated successfully!');
        } else {
          throw new Error(response.error || 'Failed to update profile');
        }
      } else {
        // Demo user - just show success
        alert('Profile updated successfully!');
      }
    } catch (error) {
      console.error('Failed to save profile:', error);
      alert('Failed to save profile. Please try again.');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-pink-50">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <img src={pics.logo} alt="Logo" className="w-20 h-20 object-contain" />
            <div className="text-center flex-1">
              <div className="flex items-center justify-center gap-3 mb-2">
                <Sparkles className="w-8 h-8 text-purple-600" />
                <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                  Outfit Generator
                </h1>
              </div>
              <p className="text-gray-600">
                Smart outfit suggestions based on your wardrobe and daily plans
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => setActiveTab('profile')}
                className="flex items-center gap-2"
              >
                {userPhoto ? (
                  <img 
                    src={userPhoto} 
                    alt={userName || 'User'} 
                    className="w-5 h-5 rounded-full object-cover"
                  />
                ) : (
                  <User className="w-4 h-4" />
                )}
                Profile
              </Button>
              <Button variant="outline" size="sm" onClick={handleLogout}>
                <LogOut className="w-4 h-4 mr-2" />
                Logout
              </Button>
            </div>
          </div>
        </div>

        {isLoadingWardrobe ? (
          <div className="flex items-center justify-center py-12">
            <div className="text-center space-y-4">
              <div className="w-12 h-12 rounded-full border-4 border-purple-200 border-t-purple-600 animate-spin mx-auto" />
              <p className="text-gray-600">Loading your wardrobe...</p>
            </div>
          </div>
        ) : (
          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
            {activeTab !== 'profile' && (
              <TabsList className="grid w-full max-w-4xl mx-auto grid-cols-4">
                <TabsTrigger value="quick">Quick Outfit</TabsTrigger>
                <TabsTrigger value="style">Style an Item</TabsTrigger>
                <TabsTrigger value="wardrobe">Wardrobe</TabsTrigger>
                <TabsTrigger value="shop">Shop</TabsTrigger>
              </TabsList>
            )}

          <TabsContent value="quick" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Need an Outfit Right Now?</CardTitle>
                <CardDescription>
                  Mark items that aren't available and we'll generate outfits from what you have
                </CardDescription>
              </CardHeader>
              <CardContent>
                <WardrobeSelector
                  wardrobe={wardrobe}
                  unavailableItems={unavailableItems}
                  onUnavailableChange={handleUnavailableChange}
                  mode="unavailable"
                />
              </CardContent>
            </Card>
            <OutfitGeneratorEnhanced
              wardrobe={wardrobe}
              unavailableItems={unavailableItems}
              anchorItem={undefined}
              userPrefs={userPrefs}
            />
          </TabsContent>

          <TabsContent value="style" className="space-y-6">
            <WardrobeSelector
              wardrobe={wardrobe}
              unavailableItems={[]}
              onUnavailableChange={() => {}}
              onSelectAnchor={setAnchorItem}
              mode="anchor"
            />
            {anchorItem && (
              <OutfitGeneratorEnhanced
                wardrobe={wardrobe}
                unavailableItems={unavailableItems}
                anchorItem={anchorItem}
                userPrefs={userPrefs}
              />
            )}
          </TabsContent>

          <TabsContent value="wardrobe">
            <WardrobeManager
              wardrobe={wardrobe}
              onAddItem={handleAddItem}
              onRemoveItem={handleRemoveItem}
              userPrefs={userPrefs}
            />
          </TabsContent>

          <TabsContent value="shop">
            <Shopping userPrefs={userPrefs} />
          </TabsContent>

          <TabsContent value="profile">
            <ProfileSettings
              userEmail={userEmail}
              userName={userName}
              userPhoto={userPhoto}
              initialColors={favoriteColors}
              initialStyles={favoriteStyles}
              initialGender={userGender}
              onSave={handleSaveProfile}
              onBack={() => setActiveTab('quick')}
            />
          </TabsContent>
        </Tabs>
        )}
      </div>
    </div>
  );
}
