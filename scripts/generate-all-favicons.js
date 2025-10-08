const { createCanvas } = require('canvas');
const fs = require('fs');
const path = require('path');

function generateFavicon(size, filename) {
  const canvas = createCanvas(size, size);
  const ctx = canvas.getContext('2d');

  // Create gradient background (rounded square)
  const gradient = ctx.createLinearGradient(0, 0, size, size);
  gradient.addColorStop(0, '#4F46E5'); // Indigo
  gradient.addColorStop(0.5, '#7C3AED'); // Purple
  gradient.addColorStop(1, '#4F46E5'); // Indigo
  
  // Draw rounded square background
  const radius = size * 0.2;
  ctx.fillStyle = gradient;
  ctx.beginPath();
  ctx.moveTo(radius, 0);
  ctx.lineTo(size - radius, 0);
  ctx.quadraticCurveTo(size, 0, size, radius);
  ctx.lineTo(size, size - radius);
  ctx.quadraticCurveTo(size, size, size - radius, size);
  ctx.lineTo(radius, size);
  ctx.quadraticCurveTo(0, size, 0, size - radius);
  ctx.lineTo(0, radius);
  ctx.quadraticCurveTo(0, 0, radius, 0);
  ctx.closePath();
  ctx.fill();

  // Draw sparkle icon (simplified star shape)
  ctx.fillStyle = '#FFFFFF';
  const centerX = size / 2;
  const centerY = size / 2;
  const sparkleSize = size * 0.4;
  
  // Main sparkle (4-point star)
  ctx.save();
  ctx.translate(centerX, centerY);
  ctx.beginPath();
  for (let i = 0; i < 4; i++) {
    const angle = (Math.PI / 2) * i - Math.PI / 4;
    const x = Math.cos(angle) * sparkleSize;
    const y = Math.sin(angle) * sparkleSize;
    if (i === 0) {
      ctx.moveTo(x * 0.3, y * 0.3);
    }
    ctx.lineTo(x, y);
    ctx.lineTo(Math.cos(angle + Math.PI / 4) * sparkleSize * 0.3, 
               Math.sin(angle + Math.PI / 4) * sparkleSize * 0.3);
  }
  ctx.closePath();
  ctx.fill();
  ctx.restore();
  
  // Small yellow dot (target indicator)
  if (size >= 32) {
    ctx.fillStyle = '#FCD34D';
    ctx.beginPath();
    ctx.arc(size * 0.75, size * 0.25, size * 0.08, 0, Math.PI * 2);
    ctx.fill();
  }

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
