const fs = require('fs');
const path = require('path');
const rootDir = path.resolve(__dirname, '..');

const cssFiles = fs.readdirSync(rootDir).filter(f => f.endsWith('.css'));

cssFiles.forEach(file => {
    const content = fs.readFileSync(path.join(rootDir, file), 'utf8');
    const mediaCount = (content.match(/@media/g) || []).length;
    const bodyWidth = content.includes('width:') || content.includes('max-width:');
    
    // Check if there are media queries or responsivness rules
    console.log(`File: ${file}`);
    console.log(`  Media Queries Count: ${mediaCount}`);
    
    // Look at specific rules that might cause overflow (like fixed width containers > 300px)
    const fixedWidths = [];
    const fixedWidthRegex = /\bwidth:\s*([4-9]\d\d|1\d\d\d)px/g;
    let match;
    while ((match = fixedWidthRegex.exec(content)) !== null) {
        fixedWidths.push(match[0]);
    }
    if (fixedWidths.length > 0) {
        console.log(`  Possible overflow triggers (fixed widths > 400px): ${[...new Set(fixedWidths)].join(', ')}`);
    }
});
