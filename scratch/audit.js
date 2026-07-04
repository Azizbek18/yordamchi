const fs = require('fs');
const path = require('path');

const rootDir = path.resolve(__dirname, '..');
const files = fs.readdirSync(rootDir);

const htmlFiles = files.filter(f => f.endsWith('.html'));
const jsFiles = files.filter(f => f.endsWith('.js'));

console.log('HTML files found:', htmlFiles);
console.log('JS files found:', jsFiles);

const fileLinks = {};
const fileBacklinks = {};

// Initialize mapping
htmlFiles.forEach(f => {
    fileLinks[f] = [];
    fileBacklinks[f] = [];
});

const hrefRegex = /href=["']([^"']+\.html(?:#[^"']*)?)["']/g;
const srcRegex = /src=["']([^"']+\.js)["']/g;
const windowLocationRegex = /window\.location\.href\s*=\s*["']([^"']+)["']/g;
const windowAssignRegex = /window\.location\.assign\(["']([^"']+)["']\)/g;
const windowReplaceRegex = /window\.location\.replace\(["']([^"']+)["']\)/g;
const locationHrefRegex = /location\.href\s*=\s*["']([^"']+)["']/g;

// Parse html files
htmlFiles.forEach(file => {
    const filePath = path.join(rootDir, file);
    const content = fs.readFileSync(filePath, 'utf8');
    
    // Find HTML references
    let match;
    while ((match = hrefRegex.exec(content)) !== null) {
        let target = match[1].split('#')[0];
        if (htmlFiles.includes(target)) {
            if (!fileLinks[file].includes(target)) {
                fileLinks[file].push(target);
            }
            if (!fileBacklinks[target].includes(file)) {
                fileBacklinks[target].push(file);
            }
        } else {
            console.log(`[Broken/External Link] in ${file}: ${match[1]}`);
        }
    }
});

// Parse js files
jsFiles.forEach(file => {
    const filePath = path.join(rootDir, file);
    const content = fs.readFileSync(filePath, 'utf8');
    
    const findJsRedirects = (regex) => {
        let match;
        while ((match = regex.exec(content)) !== null) {
            let target = match[1].split('#')[0].split('?')[0];
            if (htmlFiles.includes(target)) {
                console.log(`[JS Redirect] in ${file} -> ${target}`);
                // Since JS links are runtime, we can register that this JS redirects to target.
                // We'll see which HTML files include this JS.
                htmlFiles.forEach(htmlFile => {
                    const htmlPath = path.join(rootDir, htmlFile);
                    const htmlContent = fs.readFileSync(htmlPath, 'utf8');
                    if (htmlContent.includes(file)) {
                        if (!fileLinks[htmlFile].includes(target)) {
                            fileLinks[htmlFile].push(target);
                        }
                        if (!fileBacklinks[target].includes(htmlFile)) {
                            fileBacklinks[target].push(htmlFile);
                        }
                    }
                });
            } else if (target.endsWith('.html')) {
                console.log(`[JS Broken Redirect] in ${file} -> ${match[1]}`);
            }
        }
    };
    
    findJsRedirects(windowLocationRegex);
    findJsRedirects(windowAssignRegex);
    findJsRedirects(windowReplaceRegex);
    findJsRedirects(locationHrefRegex);
});

console.log('\n--- Link Analysis ---');
htmlFiles.forEach(file => {
    console.log(`\nFile: ${file}`);
    console.log(`  Outgoing links: ${fileLinks[file].join(', ')}`);
    console.log(`  Incoming links (Backlinks): ${fileBacklinks[file].join(', ')}`);
});

console.log('\n--- Orphans (No incoming links) ---');
htmlFiles.forEach(file => {
    if (fileBacklinks[file].length === 0 && file !== 'index.html') {
        console.log(`  Orphan: ${file}`);
    }
});

console.log('\n--- Dead Ends (No outgoing links) ---');
htmlFiles.forEach(file => {
    if (fileLinks[file].length === 0) {
        console.log(`  Dead End: ${file}`);
    }
});
