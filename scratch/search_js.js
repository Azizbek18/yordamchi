const fs = require('fs');
const path = require('path');
const rootDir = path.resolve(__dirname, '..');

const jsFiles = fs.readdirSync(rootDir).filter(f => f.endsWith('.js'));
jsFiles.forEach(file => {
    const content = fs.readFileSync(path.join(rootDir, file), 'utf8');
    if (content.includes('hamburger') || content.includes('mobile-drawer') || content.includes('drawer')) {
        console.log(`Mention in JS: ${file}`);
    }
});
