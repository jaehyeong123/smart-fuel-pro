/**
 * Canvas-based Image Preprocessing for enhanced OCR recognition
 * Solves real-world photo problems: poor lighting, low contrast, glare on receipts & odometers.
 */

export interface PreprocessResult {
  previewUrl: string;       // Clean thumbnail for UI display
  ocrReadyBlob: Blob;       // High-contrast, binarized image optimized for Tesseract
}

export async function preprocessImageForOcr(
  file: File,
  type: 'odometer' | 'receipt'
): Promise<PreprocessResult> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        try {
          // 1. Calculate optimal dimensions (limit max 1600px for mobile performance)
          const MAX_DIM = 1600;
          let width = img.width;
          let height = img.height;

          if (width > height && width > MAX_DIM) {
            height = Math.round((height * MAX_DIM) / width);
            width = MAX_DIM;
          } else if (height > MAX_DIM) {
            width = Math.round((width * MAX_DIM) / height);
            height = MAX_DIM;
          }

          // 2. Prepare canvas
          const canvas = document.createElement('canvas');
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          if (!ctx) throw new Error('Canvas 2D context unavailable');

          // Draw original scaled image
          ctx.drawImage(img, 0, 0, width, height);

          // Get image data
          const imageData = ctx.getImageData(0, 0, width, height);
          const data = imageData.data;

          // 3. Pixel processing: Grayscale & Contrast Stretcher
          // For receipts: higher contrast helps faint thermal ink.
          // For odometers: LCD digit glow vs dark background.
          const contrast = type === 'receipt' ? 1.4 : 1.6;
          const intercept = 128 * (1 - contrast);

          for (let i = 0; i < data.length; i += 4) {
            // Luminance grayscale
            const gray = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
            
            // Contrast adjustment
            let adjusted = gray * contrast + intercept;
            if (adjusted < 0) adjusted = 0;
            if (adjusted > 255) adjusted = 255;

            // Subtle binarization for receipts (crisp text)
            if (type === 'receipt') {
              // Soft thresholding
              adjusted = adjusted > 140 ? 255 : (adjusted < 80 ? 0 : adjusted);
            }

            data[i] = adjusted;     // R
            data[i + 1] = adjusted; // G
            data[i + 2] = adjusted; // B
            // Alpha data[i + 3] remains untouched
          }

          ctx.putImageData(imageData, 0, 0);

          // Convert to blob
          canvas.toBlob((blob) => {
            if (!blob) {
              reject(new Error('Failed to create image blob'));
              return;
            }
            resolve({
              previewUrl: e.target?.result as string, // Original image for user preview
              ocrReadyBlob: blob
            });
          }, 'image/jpeg', 0.92);
        } catch (err) {
          reject(err);
        }
      };
      img.onerror = () => reject(new Error('Failed to load image file'));
      img.src = e.target?.result as string;
    };
    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsDataURL(file);
  });
}
