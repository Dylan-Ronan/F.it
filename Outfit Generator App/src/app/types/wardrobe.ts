export type ClothingCategory = 'tops' | 'bottoms' | 'shoes' | 'outerwear' | 'accessories';
export type EventType = 'work' | 'casual' | 'formal' | 'workout' | 'date' | 'outdoor';
export type Weather = 'hot' | 'warm' | 'cool' | 'cold';
export type Color = 'black' | 'white' | 'gray' | 'navy' | 'brown' | 'beige' | 'red' | 'blue' | 'green' | 'yellow' | 'pink' | 'purple' | 'orange' | 'other';

export interface ClothingItem {
  id: string;
  name: string;
  category: ClothingCategory;
  colors: Color[];
  style: EventType[];
  imageUrl?: string;
  minTemp?: number;
  maxTemp?: number;
}

export interface DailyPlan {
  event: EventType;
  weather: Weather;
  notes?: string;
}

export interface Outfit {
  top?: ClothingItem;
  bottom?: ClothingItem;
  shoes?: ClothingItem;
  outerwear?: ClothingItem;
  accessories: ClothingItem[];
}
