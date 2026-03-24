import { useState } from 'react';
import { Camera, Upload, Sparkles } from 'lucide-react';
import { ClothingItem, ClothingCategory, EventType, Color } from '../types/wardrobe';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Checkbox } from './ui/checkbox';
import { ImageWithFallback } from './figma/ImageWithFallback';
import { analyzeClothingImage } from '../utils/geminiService';

interface AddClothingWithPhotoProps {
  onAddItem: (item: Omit<ClothingItem, 'id'>) => void;
}

const categories: { value: ClothingCategory; label: string }[] = [
  { value: 'tops', label: 'Tops' },
  { value: 'bottoms', label: 'Bottoms' },
  { value: 'shoes', label: 'Shoes' },
  { value: 'outerwear', label: 'Outerwear' },
  { value: 'accessories', label: 'Accessories' },
];

const eventTypes: { value: EventType; label: string }[] = [
  { value: 'work', label: 'Work' },
  { value: 'casual', label: 'Casual' },
  { value: 'formal', label: 'Formal' },
  { value: 'workout', label: 'Workout' },
  { value: 'date', label: 'Date Night' },
  { value: 'outdoor', label: 'Outdoor' },
];

const colors: { value: Color; label: string }[] = [
  { value: 'black', label: 'Black' },
  { value: 'white', label: 'White' },
  { value: 'gray', label: 'Gray' },
  { value: 'navy', label: 'Navy' },
  { value: 'brown', label: 'Brown' },
  { value: 'beige', label: 'Beige' },
  { value: 'red', label: 'Red' },
  { value: 'blue', label: 'Blue' },
  { value: 'green', label: 'Green' },
  { value: 'yellow', label: 'Yellow' },
  { value: 'pink', label: 'Pink' },
  { value: 'purple', label: 'Purple' },
  { value: 'orange', label: 'Orange' },
  { value: 'other', label: 'Other' },
];

export function AddClothingWithPhoto({ onAddItem }: AddClothingWithPhotoProps) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState('');
  const [category, setCategory] = useState<ClothingCategory>('tops');
  const [selectedColors, setSelectedColors] = useState<Color[]>([]);
  const [selectedStyles, setSelectedStyles] = useState<EventType[]>([]);
  const [photo, setPhoto] = useState<string | null>(null);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [minTemp, setMinTemp] = useState<number>(60);
  const [maxTemp, setMaxTemp] = useState<number>(80);

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const url = URL.createObjectURL(file);
      setPhoto(url);
      setUploadedFile(file);
      setIsAnalyzing(true);

      try {
        const analysis = await analyzeClothingImage(file);

        // Auto-populate form fields with AI analysis
        setName(analysis.name);
        setCategory(analysis.category as ClothingCategory);

        // Map AI colors to our predefined colors
        const mappedColors = analysis.colors
          .map(color => color.toLowerCase())
          .filter(color => colors.some(c => c.value === color))
          .map(color => color as Color);
        setSelectedColors(mappedColors);

        // Map AI styles to our predefined event types
        const mappedStyles = analysis.styles
          .map(style => style.toLowerCase())
          .filter(style => eventTypes.some(e => e.value === style))
          .map(style => style as EventType);
        setSelectedStyles(mappedStyles);

        setMinTemp(analysis.minTemp);
        setMaxTemp(analysis.maxTemp);
      } catch (error) {
        console.error('Failed to analyze image:', error);
        // Keep default values if analysis fails
      } finally {
        setIsAnalyzing(false);
      }
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (name) {
      onAddItem({
        name,
        category,
        colors: selectedColors,
        style: selectedStyles,
        imageUrl: photo || undefined,
        minTemp,
        maxTemp,
      });
      setName('');
      setSelectedColors([]);
      setSelectedStyles([]);
      setPhoto(null);
      setUploadedFile(null);
      setMinTemp(60);
      setMaxTemp(80);
      setOpen(false);
    }
  };



  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Camera className="w-4 h-4 mr-2" />
          Add with Photo
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add Clothing Item</DialogTitle>
          <DialogDescription>
            Take or upload a photo of your clothing item
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label>Photo</Label>
            {!photo ? (
              <label
                htmlFor="photo-upload"
                className="flex flex-col items-center justify-center w-full h-72 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100"
              >
                <div className="flex flex-col items-center justify-center pt-5 pb-6">
                  <Upload className="w-8 h-8 text-gray-400 mb-2" />
                  <p className="text-sm text-gray-500">Click to upload photo</p>
                  <p className="text-xs text-purple-600 mt-1">AI will analyze and auto-fill details</p>
                </div>
                <input
                  id="photo-upload"
                  type="file"
                  className="hidden"
                  accept="image/*"
                  onChange={handlePhotoUpload}
                />
              </label>
            ) : (
              <div className="relative">
                <ImageWithFallback
                  src={photo}
                  alt="Clothing item"
                  className="w-full h-92 object-cover rounded-lg"
                />
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  className="absolute top-2 right-2"
                  onClick={() => {
                    setPhoto(null);
                    setUploadedFile(null);
                    setIsAnalyzing(false);
                  }}
                >
                  Change Photo
                </Button>
                {isAnalyzing && (
                  <div className="absolute inset-0 bg-black bg-opacity-50 rounded-lg flex items-center justify-center">
                    <div className="flex items-center space-x-2 text-white">
                      <Sparkles className="w-5 h-5 animate-spin" />
                      <span>Analyzing with AI...</span>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="name">Item Name</Label>
            <Input
              id="name"
              placeholder="e.g., Blue Oxford Shirt"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="category">Category</Label>
            <Select value={category} onValueChange={(value) => setCategory(value as ClothingCategory)}>
              <SelectTrigger id="category">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {categories.map(cat => (
                  <SelectItem key={cat.value} value={cat.value}>
                    {cat.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {(selectedColors.length > 0 || selectedStyles.length > 0 || !isAnalyzing) && (
            <div className="rounded-lg border border-gray-200 p-3 bg-gray-50">
              <p className="text-sm font-medium text-gray-700 mb-2">Detected attributes</p>
              <div className="text-sm text-gray-600 space-y-1">
                <p>
                  <span className="font-semibold">Colors:</span>{' '}
                  {selectedColors.length > 0 ? selectedColors.join(', ') : 'n/a'}
                </p>
                <p>
                  <span className="font-semibold">Style:</span>{' '}
                  {selectedStyles.length > 0 ? selectedStyles.join(', ') : 'n/a'}
                </p>
                <p>
                  <span className="font-semibold">Temperature Range:</span>{' '}
                  {minTemp}°F - {maxTemp}°F
                </p>
              </div>
            </div>
          )}

          <Button type="submit" className="w-full" disabled={isAnalyzing}>
            {isAnalyzing ? (
              <>
                <Sparkles className="w-4 h-4 mr-2 animate-spin" />
                Analyzing...
              </>
            ) : (
              'Add to Wardrobe'
            )}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
