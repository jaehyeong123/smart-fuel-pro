/**
 * Enhanced Image Preprocessor for LCD/Digital Dashboard Clusters & Receipts
 * Features:
 * - Automatic background luminance detection & dark-cluster inverter (white text on black -> black text on white)
 * - Contrast stretching & binarization optimized for digits
 * - Preserves crystal-clear original resolution for fullscreen zoom modal
 */

export interface PreprocessResult {
  previewUrl: string;       // High-resolution original photo for user zoom & preview
  ocrReadyBlob: Blob;       // Processed high-contrast image for Tesseract
}

export async function preprocessImageForOcr(
  file: File,
  type: 'odometer' | 'receipt'
): Promise<PreprocessResult> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const originalDataUrl = e.target?.result as string;
      const img = new Image();
      img.onload = () => {
        try {
          // Limit max dimension to 1800px for speed and crispness
          const MAX_DIM = 1800;
          let width = img.width;
          let height = img.height;

          if (width > height && width > MAX_DIM) {
            height = Math.round((height * MAX_DIM) / width);
            width = MAX_DIM;
          } else if (height > MAX_DIM) {
            width = Math.round((width * MAX_DIM) / height);
            height = MAX_DIM;
          }

          const canvas = document.createElement('canvas');
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          if (!ctx) throw new Error('Canvas context not available');

          ctx.drawImage(img, 0, 0, width, height);

          const imageData = ctx.getImageData(0, 0, width, height);
          const data = imageData.data;

          // 1. Calculate average luminance across sample pixels
          let totalLuma = 0;
          const step = 4 * 10; // Sample every 10th pixel for speed
          let sampleCount = 0;
          for (let i = 0; i < data.length; i += step) {
            totalLuma += 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
            sampleCount++;
          }
          const avgLuma = sampleCount > 0 ? totalLuma / sampleCount : 128;

          // If odometer and overall background is dark (< 125), invert so LCD digits become dark on white
          const isDarkCluster = type === 'odometer' && avgLuma < 125;

          const contrast = type === 'odometer' ? 1.8 : 1.5;
          const intercept = 128 * (1 - contrast);

          for (let i = 0; i < data.length; i += 4) {
            let gray = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];

            // Invert if dark cluster
            if (isDarkCluster) {
              gray = 255 - gray;
            }

            // Contrast boost
            let adjusted = gray * contrast + intercept;
            if (adjusted < 0) adjusted = 0;
            if (adjusted > 255) adjusted = 255;

            // Sharp binarization for odometer numbers
            if (type === 'odometer') {
              adjusted = adjusted > 150 ? 255 : (adjusted < 90 ? 0 : adjusted);
            } else {
              adjusted = adjusted > 140 ? 255 : (adjusted < 80 ? 0 : adjusted);
            }

            data[i] = adjusted;
            data[i + 1] = adjusted;
            data[i + 2] = adjusted;
          }

          ctx.putImageData(imageData, 0, 0);

          canvas.toBlob((blob) => {
            if (!blob) {
              reject(new Error('Failed to create blob'));
              return;
            }
            resolve({
              previewUrl: originalDataUrl, // High-res original for enlargement!
              ocrReadyBlob: blob
            });
          }, 'image/jpeg', 0.9);
        } catch (err) {
          reject(err);
        }
      };
      img.onerror = () => reject(new Error('Failed to load image'));
      img.src = originalDataUrl;
    };
    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsDataURL(file);
  });
}
