const { createCanvas } = require('canvas');
const fs = require('fs');
const path = require('path');

const canvas = createCanvas(1200, 630);
const ctx = canvas.getContext('2d');

// Background gradient
const gradient = ctx.createLinearGradient(0, 0, 1200, 630);
gradient.addColorStop(0, '#4F46E5');
gradient.addColorStop(1, '#7C3AED');
ctx.fillStyle = gradient;
ctx.fillRect(0, 0, 1200, 630);

// Text
ctx.fillStyle = 'white';
ctx.font = 'bold 72px Arial';
ctx.textAlign = 'center';
ctx.fillText('PlanAI', 600, 250);

ctx.font = '36px Arial';
ctx.fillText('AI Financial Planning', 600, 320);

ctx.font = '24px Arial';
ctx.fillText('Biến dữ liệu thô thành bản kế hoạch đáng mơ ước', 600, 380);

// Save as JPEG
const out = fs.createWriteStream(path.join(__dirname, '../public/og-image.jpg'));
const stream = canvas.createJPEGStream({ quality: 0.9 });
stream.pipe(out);

out.on('finish', () => {
  console.log('✓ OG image generated successfully!');
});
