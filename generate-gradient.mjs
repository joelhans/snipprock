#!/usr/bin/env node
import { createCanvas } from 'canvas';
import { writeFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Create a canvas with the gradient
const width = 1200;
const height = Math.round(width * 9 / 16); // 16:9 aspect ratio
const canvas = createCanvas(width, height);
const ctx = canvas.getContext('2d');

// Draw the ngrok gradient
const gradient = ctx.createLinearGradient(0, 0, width, 0);
gradient.addColorStop(0.0135, '#f59e0b');
gradient.addColorStop(0.1848, '#a3e635');
gradient.addColorStop(0.3835, '#34d399');
gradient.addColorStop(0.5863, '#0ea5e9');
gradient.addColorStop(0.797, '#a855f7');
gradient.addColorStop(1.0, '#f43f5e');

ctx.fillStyle = gradient;
ctx.fillRect(0, 0, width, height);

// Apply a manual blur using box blur (stack blur approximation)
// This is a simple implementation - for production you might want a library
function boxBlur(imageData, radius) {
  const { data, width, height } = imageData;
  const tempData = new Uint8ClampedArray(data);
  
  // Horizontal pass
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      let r = 0, g = 0, b = 0, a = 0, count = 0;
      
      for (let kx = -radius; kx <= radius; kx++) {
        const px = x + kx;
        if (px >= 0 && px < width) {
          const idx = (y * width + px) * 4;
          r += tempData[idx];
          g += tempData[idx + 1];
          b += tempData[idx + 2];
          a += tempData[idx + 3];
          count++;
        }
      }
      
      const idx = (y * width + x) * 4;
      data[idx] = r / count;
      data[idx + 1] = g / count;
      data[idx + 2] = b / count;
      data[idx + 3] = a / count;
    }
  }
  
  tempData.set(data);
  
  // Vertical pass
  for (let x = 0; x < width; x++) {
    for (let y = 0; y < height; y++) {
      let r = 0, g = 0, b = 0, a = 0, count = 0;
      
      for (let ky = -radius; ky <= radius; ky++) {
        const py = y + ky;
        if (py >= 0 && py < height) {
          const idx = (py * width + x) * 4;
          r += tempData[idx];
          g += tempData[idx + 1];
          b += tempData[idx + 2];
          a += tempData[idx + 3];
          count++;
        }
      }
      
      const idx = (y * width + x) * 4;
      data[idx] = r / count;
      data[idx + 1] = g / count;
      data[idx + 2] = b / count;
      data[idx + 3] = a / count;
    }
  }
}

// Get image data and apply blur
const imageData = ctx.getImageData(0, 0, width, height);
// Apply blur multiple times for stronger effect
const blurRadius = 40;
for (let i = 0; i < 3; i++) {
  boxBlur(imageData, blurRadius);
}
ctx.putImageData(imageData, 0, 0);

// Save as PNG
const buffer = canvas.toBuffer('image/png');
const outputPath = join(__dirname, 'public', 'gradient-blur.png');
writeFileSync(outputPath, buffer);
console.log(`Gradient saved to ${outputPath}`);
console.log(`Dimensions: ${width}x${height}`);
