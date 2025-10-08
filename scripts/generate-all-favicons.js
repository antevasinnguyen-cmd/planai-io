const { createCanvas } = require('canvas');
const fs = require('fs');
const path = require('path');

function generateFavicon(size, filename) {
  const canvas = createCanvas(size, size);
  const ctx = canvas.getContext('2d');

  // Draw circular background - Sky Blue
  const centerX = size / 2;
  const centerY = size / 2;
  
  ctx.fillStyle = '#0ea5e9'; // primary-500
  ctx.beginPath();
  ctx.arc(centerX, centerY, size * 0.48, 0, Math.PI * 2);
  ctx.fill();

  // Draw simple target icon - 3 circles
  const strokeWidth = Math.max(2, size * 0.06);
  
  ctx.strokeStyle = '#FFFFFF';
  ctx.lineWidth = strokeWidth;
  
  // Outer circle
  ctx.beginPath();
  ctx.arc(centerX, centerY, size * 0.35, 0, Math.PI * 2);
  ctx.stroke();
  
  // Middle circle
  ctx.beginPath();
  ctx.arc(centerX, centerY, size * 0.23, 0, Math.PI * 2);
  ctx.stroke();
  
  // Center dot
  ctx.fillStyle = '#FFFFFF';
  ctx.beginPath();
  ctx.arc(centerX, centerY, size * 0.1, 0, Math.PI * 2);
  ctx.fill();

  // Save as PNG
  const out = fs.createWriteStream(path.join(__dirname, '../public', filename));
  const stream = canvas.createPNGStream();
  stream.pipe(out);
  
  return new Promise((resolve, reject) => {
    out.on('finish', () => {
      console.log(`✓ Generated ${filename}`);
      resolve();
    });
    out.on('error', reject);
  });
}

async function generateAll() {
  try {
    await generateFavicon(16, 'favicon-16x16.png');
    await generateFavicon(32, 'favicon-32x32.png');
    await generateFavicon(180, 'apple-touch-icon.png');
    console.log('\n✓ All favicons generated successfully!');
  } catch (error) {
    console.error('Error generating favicons:', error);
  }
}

generateAll();
