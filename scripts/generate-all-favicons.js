const { createCanvas } = require('canvas');
const fs = require('fs');
const path = require('path');

function generateFavicon(size, filename) {
  const canvas = createCanvas(size, size);
  const ctx = canvas.getContext('2d');

  // Draw a blue circle
  ctx.fillStyle = '#4F46E5';
  ctx.beginPath();
  ctx.arc(size / 2, size / 2, (size / 2) - 1, 0, Math.PI * 2);
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
