const fs = require('fs');
const path = require('path');
const rootDir = path.resolve(__dirname, '..');

const content = fs.readFileSync(path.join(rootDir, 'mahallam.html'), 'utf8');

// Find all buttons, links and forms
const hrefs = [];
const hrefRegex = /href=["']([^"']+)["']/g;
let match;
while ((match = hrefRegex.exec(content)) !== null) {
    hrefs.push(match[1]);
}

console.log('Hrefs in mahallam.html:', [...new Set(hrefs)]);

// Search for inputs
const inputRegex = /<input[^>]+>/g;
const inputs = [];
while ((match = inputRegex.exec(content)) !== null) {
    inputs.push(match[0]);
}
console.log('Inputs in mahallam.html:', inputs);
