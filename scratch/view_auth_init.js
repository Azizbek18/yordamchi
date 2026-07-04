const fs = require('fs');
const path = require('path');
const rootDir = path.resolve(__dirname, '..');

const content = fs.readFileSync(path.join(rootDir, 'auth.js'), 'utf8');
const lines = content.split('\n');
console.log(lines.slice(190, 240).join('\n'));
