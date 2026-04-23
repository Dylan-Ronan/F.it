import { useState } from 'react';
import { Camera, Upload, Loader2, Sparkles } from 'lucide-react';
import { ClothingItem, ClothingCategory, EventType, Color } from '../types/wardrobe';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Checkbox } from './ui/checkbox';
import { ImageWithFallback } from './figma/ImageWithFallback';
import { api } from '../services/api';

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

const categoryMap: Record<string, ClothingCategory> = {
  'top': 'tops',
  'tops': 'tops',
  'bottom': 'bottoms',
  'bottoms': 'bottoms',
  'shoe': 'shoes',
  'shoes': 'shoes',
  'coat': 'outerwear',
  'outerwear': 'outerwear',
  'accessory': 'accessories',
  'accessories': 'accessories',
  'umbrella': 'accessories',
};

function readFileAsDataURL(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result as string);
    reader.onerror = () => reject(new Error(`Failed to read ${file.name}`));
    reader.readAsDataURL(file);
  });
}

type FailedUpload = { name: string; dataUrl: string; reason: string };

export function AddClothingWithPhoto({ onAddItem }: AddClothingWithPhotoProps) {
  const [open, setOpen] = useState(false);
  const [photo, setPhoto] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState<{ current: number; total: number; succeeded: number } | null>(null);
  const [failures, setFailures] = useState<FailedUpload[]>([]);

  const processOne = async (
    fileName: string,
    dataUrl: string,
    userID: string | null,
  ): Promise<{ ok: true } | { ok: false; reason: string }> => {
    setPhoto(dataUrl);

    if (userID === 'demo-user-123') {
      onAddItem({
        name: fileName.replace(/\.[^.]+$/, '') || 'New Item',
        category: 'tops',
        colors: ['other'],
        style: ['casual'],
        imageUrl: dataUrl,
      });
      return { ok: true };
    }

    if (!userID) {
      return { ok: false, reason: 'User not authenticated' };
    }

    const response = await api.user.analyzeImage(userID, dataUrl);
    if (!response.success || !response.analysis) {
      return { ok: false, reason: response.error || 'AI analysis failed' };
    }

    const analysis = response.analysis;
    onAddItem({
      name: analysis.name || 'New Item',
      category: categoryMap[analysis.category] || 'tops',
      colors: (analysis.colors ?? []).map((c: string) => c.toLowerCase() as Color),
      style: (analysis.styles ?? []).map((s: string) => s.toLowerCase() as EventType),
      styles2: analysis.styles2?.map((s: string) => s.toLowerCase()) ?? [],
      minTemp: analysis.minTemp,
      maxTemp: analysis.maxTemp,
      imageUrl: dataUrl,
    });
    return { ok: true };
  };

  const runBatch = async (items: { name: string; dataUrl: string }[]) => {
    if (items.length === 0) return;

    setError(null);
    setFailures([]);
    setIsAnalyzing(true);

    const userID = localStorage.getItem('userID');
    const newFailures: FailedUpload[] = [];
    let succeeded = 0;

    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      setProgress({ current: i + 1, total: items.length, succeeded });
      try {
        const result = await processOne(item.name, item.dataUrl, userID);
        if (result.ok) {
          succeeded++;
        } else {
          newFailures.push({ name: item.name, dataUrl: item.dataUrl, reason: result.reason });
        }
      } catch (err) {
        console.error(`Error analyzing ${item.name}:`, err);
        newFailures.push({
          name: item.name,
          dataUrl: item.dataUrl,
          reason: err instanceof Error ? err.message : 'Unexpected error',
        });
      }
    }

    setIsAnalyzing(false);
    setPhoto(null);
    setProgress(null);
    setFailures(newFailures);

    if (newFailures.length === 0) {
      setOpen(false);
    }
  };

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    e.target.value = '';
    if (files.length === 0) return;

    let readFiles: { name: string; dataUrl: string }[];
    try {
      readFiles = await Promise.all(
        files.map(async (file) => ({ name: file.name, dataUrl: await readFileAsDataURL(file) })),
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to read image files');
      return;
    }

    await runBatch(readFiles);
  };

  const handleRetryFailures = async () => {
    const toRetry = failures.map(f => ({ name: f.name, dataUrl: f.dataUrl }));
    await runBatch(toRetry);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Camera className="w-4 h-4 mr-2" />
          Add with Photo
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-purple-600" />
            AI-Powered Item Recognition
          </DialogTitle>
          <DialogDescription>
            Upload a photo and our AI will automatically identify and add your clothing item
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4">
          {!isAnalyzing ? (
            <label
              htmlFor="photo-upload"
              className="flex flex-col items-center justify-center w-full h-72 border-2 border-dashed border-purple-300 rounded-lg cursor-pointer bg-purple-50 hover:bg-purple-100 transition-colors"
            >
              <div className="flex flex-col items-center justify-center pt-5 pb-6">
                <Upload className="w-12 h-12 text-purple-600 mb-3" />
                <p className="text-sm font-medium text-purple-900 mb-1">
                  Click to upload photos
                </p>
                <p className="text-xs text-purple-600">
                  Select one or many — AI will analyze and add each one
                </p>
              </div>
              <input
                id="photo-upload"
                type="file"
                className="hidden"
                accept="image/*"
                multiple
                onChange={handlePhotoUpload}
                disabled={isAnalyzing}
              />
            </label>
          ) : (
            <div className="flex flex-col items-center justify-center w-full h-72 border-2 border-purple-300 rounded-lg bg-purple-50">
              {photo && (
                <div className="relative w-full h-48 mb-4">
                  <ImageWithFallback
                    src={photo}
                    alt="Analyzing..."
                    className="w-full h-full object-cover rounded-lg opacity-50"
                  />
                </div>
              )}
              <Loader2 className="w-8 h-8 text-purple-600 animate-spin mb-3" />
              <p className="text-sm font-medium text-purple-900">
                {progress
                  ? `Analyzing ${progress.current} of ${progress.total}...`
                  : 'Analyzing image...'}
              </p>
              <p className="text-xs text-purple-600">
                {progress && progress.succeeded > 0
                  ? `${progress.succeeded} added so far`
                  : 'Retries run automatically on Gemini failures'}
              </p>
            </div>
          )}

          {!isAnalyzing && failures.length > 0 && (
            <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg space-y-2">
              <p className="text-sm font-medium text-amber-900">
                {failures.length} item{failures.length === 1 ? '' : 's'} failed to analyze
              </p>
              <ul className="text-xs text-amber-800 max-h-24 overflow-y-auto space-y-1">
                {failures.map((f, i) => (
                  <li key={`${f.name}-${i}`} className="truncate">
                    • {f.name} — {f.reason}
                  </li>
                ))}
              </ul>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="flex-1"
                  onClick={handleRetryFailures}
                >
                  Retry failed
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="flex-1"
                  onClick={() => setFailures([])}
                >
                  Dismiss
                </Button>
              </div>
            </div>
          )}

          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-600">{error}</p>
              <Button
                variant="outline"
                size="sm"
                className="mt-2 w-full"
                onClick={() => {
                  setError(null);
                  setPhoto(null);
                  setIsAnalyzing(false);
                }}
              >
                Try Again
              </Button>
            </div>
          )}

          <div className="text-xs text-gray-500 text-center">
            <p>✨ AI will automatically detect:</p>
            <p>• Item name & category</p>
            <p>• Colors & style</p>
            <p>• Suitable occasions</p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
