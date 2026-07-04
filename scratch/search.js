const fs = require('fs');
const path = require('path');
const rootDir = path.resolve(__dirname, '..');

const files = fs.readdirSync(rootDir);
files.forEach(f => {
    if (f.endsWith('.html') || f.endsWith('.js')) {
        const content = fs.readFileSync(path.join(rootDir, f), 'utf8');
        const index = content.indexOf('natija');
        if (index !== -1) {
            console.log(`Mention of 'natija' in ${f} at index ${index}`);
        }
    }
});
