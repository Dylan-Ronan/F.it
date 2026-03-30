import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(import.meta.env.VITE_GEMINI_API_KEY || '');

export interface ClothingAnalysis {
  name: string;
  category: string;
  colors: string[];
  styles: string[];
  minTemp: number;
  maxTemp: number;
}

async function getValidatedModel() {
  const targetModel = 'gemini-2.5-flash';
  try {
    return genAI.getGenerativeModel({ model: targetModel });
  } catch (error) {
    console.error(`Unable to initialize ${targetModel}:`, error);
    throw new Error(`Model ${targetModel} is unavailable. Ensure your account has access and the key is valid.`);
  }
}

export async function analyzeClothingImage(imageFile: File): Promise<ClothingAnalysis> {
  try {
    // Use a general Gemini model path that is available in the legacy SDK.
    // If you still get a 404, you may need a backend proxy and/or a current model name from the API console.
    const model = await getValidatedModel();

    // Convert image to base64
    const imageData = await fileToBase64(imageFile);

    const prompt = `Analyze this clothing item image and provide a JSON response with the following structure:\n` +
      `{\n` +
      `  "name": "descriptive name of the clothing item",\n` +
      `  "category": "tops|bottoms|shoes|outerwear|accessories",\n` +
      `  "colors": ["array of primary colors present, up to 3 in the otder primary, secondary, and tertiary colors"],\n` +
      `  "styles": ["array of suitable occasions/styles like work, casual, formal, workout, date, outdoor"],\n` +
      `  "minTemp": minimum comfortable temperature in Fahrenheit,\n` +
      `  "maxTemp": maximum comfortable temperature in Fahrenheit\n` +
      `}\n` +
      `Return only valid JSON, no explanatory textx`;

    const request = {
      contents: [
        {
          role: 'user',
          parts: [
            { text: prompt },
            {
              inlineData: {
                mimeType: imageFile.type,
                data: imageData,
              },
            },
          ],
        },
      ],
      generationConfig: {
        responseMimeType: 'application/json',
        maxOutputTokens: 250,
        temperature: 0,
      },
    };

    const result = await model.generateContent(request);
    // response is an EnhancedGenerateContentResponse with helper methods
    const text = result.response?.text ? result.response.text() : '';
    if (!text.trim()) {
      throw new Error('Gemini returned empty response text.');
    }

    // Parse the JSON response
    const analysis = JSON.parse(text.trim());

    return {
      name: analysis.name || 'Unknown Item',
      category: analysis.category || 'tops',
      colors: Array.isArray(analysis.colors) ? analysis.colors : [],
      styles: Array.isArray(analysis.styles) ? analysis.styles : [],
      minTemp: typeof analysis.minTemp === 'number' ? analysis.minTemp : 60,
      maxTemp: typeof analysis.maxTemp === 'number' ? analysis.maxTemp : 80
    };
  } catch (error: any) {
    // Log status or error body for diagnostics of 404, 403, etc.
    if (error?.response) {
      console.error('Gemini API error response:', error.response);
    }
    console.error('Error analyzing clothing image:', error);
    throw new Error('Failed to analyze clothing image. Please try again.');
  }
}

function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => {
      const result = reader.result as string;
      // Remove the data:image/jpeg;base64, prefix
      const base64 = result.split(',')[1];
      resolve(base64);
    };
    reader.onerror = error => reject(error);
  });
}