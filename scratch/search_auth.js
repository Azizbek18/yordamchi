const fs = require('fs');
const path = require('path');
const rootDir = path.resolve(__dirname, '..');

const content = fs.readFileSync(path.join(rootDir, 'auth.js'), 'utf8');
const lines = content.split('\n');
lines.forEach((line, idx) => {
    if (line.includes('hamburger') || line.includes('drawer')) {
        console.log(`Line ${idx + 1}: ${line}`);
    }
});
