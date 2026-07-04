const fs = require('fs');
const path = require('path');

const directoryPath = 'c:\\Users\\Azizbek\\OneDrive\\Desktop\\yordamchi';

fs.readdir(directoryPath, (err, files) => {
    if (err) {
        return console.log('Unable to scan directory: ' + err);
    }
    files.forEach(file => {
        if (path.extname(file) === '.html') {
            const filePath = path.join(directoryPath, file);
            let content = fs.readFileSync(filePath, 'utf8');
            if (/src="auth\.js(?:\?v=\d+)?"/.test(content)) {
                content = content.replace(/src="auth\.js(?:\?v=\d+)?"/g, 'src="auth.js?v=5"');
                fs.writeFileSync(filePath, content, 'utf8');
                console.log(`Updated cache buster to v=5 in ${file}`);
            }
        }
    });
});
