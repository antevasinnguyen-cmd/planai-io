const { createCanvas } = require('canvas');
const fs = require('fs');
const path = require('path');

// Create a 64x64 canvas
const size = 64;
const canvas = createCanvas(size, size);
const ctx = canvas.getContext('2d');

// Draw rounded square background - Sky Blue
const radius = size * 0.15;
ctx.fillStyle = '#0ea5e9'; // primary-500
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

// Draw simple target icon - 3 circles
const centerX = size / 2;
const centerY = size / 2;
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

// Save as favicon.ico
const out = fs.createWriteStream(path.join(__dirname, '../public/favicon.ico'));
const stream = canvas.createPNGStream();
stream.pipe(out);

out.on('finish', () => {
  console.log('✓ Favicon.ico generated successfully!');
});
