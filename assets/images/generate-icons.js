#!/usr/bin/env node
/**
 * PWA Icon Generator for Speak Native
 * 
 * Usage:
 *   node generate-icons.js
 * 
 * Requirements:
 *   npm install -D canvas
 */

const fs = require('fs');
const path = require('path');

// Check if canvas is available
let canvas;
try {
  const Canvas = require('canvas');
  canvas = Canvas.createCanvas;
} catch (e) {
  console.error('❌ Error: canvas module not found');
  console.error('Install it with: npm install -D canvas');
  process.exit(1);
}

function generateIcon(size) {
  try {
    const c = canvas(size, size);
    const ctx = c.getContext('2d');

    // Background color
    ctx.fillStyle = '#0e0f11';
    ctx.fillRect(0, 0, size, size);

    // Accent gradient circle background
    const grad = ctx.createLinearGradient(0, 0, size, size);
    grad.addColorStop(0, '#5cefb0');
    grad.addColorStop(1, '#7eb8ff');
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(size / 2, size / 2, (size * 0.35), 0, Math.PI * 2);
    ctx.fill();

    // Draw emoji or icon
    ctx.font = `${size * 0.5}px "Apple Color Emoji", "Segoe UI Emoji", sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = '#ffffff';
    ctx.fillText('🎤', size / 2, size / 2);

    // Save to file
    const outputPath = path.join(__dirname, `icon-${size}.png`);
    const stream = c.createPNGStream();
    const file = fs.createWriteStream(outputPath);

    stream.pipe(file);

    return new Promise((resolve, reject) => {
      file.on('finish', () => {
        console.log(`✅ Generated: icon-${size}.png (${size}×${size})`);
        resolve();
      });
      file.on('error', reject);
    });
  } catch (err) {
    console.error(`❌ Failed to generate icon-${size}.png:`, err.message);
    throw err;
  }
}

async function main() {
  console.log('🎤 Speak Native PWA Icon Generator');
  console.log('=====================================\n');

  try {
    await generateIcon(192);
    await generateIcon(512);

    console.log('\n✅ All icons generated successfully!');
    console.log('\nFiles created:');
    console.log('  • icon-192.png (192×192px)');
    console.log('  • icon-512.png (512×512px)');
    console.log('\nPWA is now ready for deployment! 🚀');
  } catch (err) {
    console.error('\n❌ Generation failed:', err.message);
    process.exit(1);
  }
}

main();
