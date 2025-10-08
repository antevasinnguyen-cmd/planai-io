const { createCanvas } = require('canvas');
const fs = require('fs');
const path = require('path');

// Create a 64x64 canvas
const canvas = createCanvas(64, 64);
const ctx = canvas.getContext('2d');

// Draw a blue circle
ctx.fillStyle = '#4F46E5';
ctx.beginPath();
ctx.arc(32, 32, 31, 0, Math.PI * 2);
ctx.fill();

// Save as favicon.ico
const out = fs.createWriteStream(path.join(__dirname, '../public/favicon.ico'));
const stream = canvas.createPNGStream();
stream.pipe(out);

console.log('Favicon generated successfully!');
