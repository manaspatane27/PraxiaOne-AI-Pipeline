const fs = require('fs');
const path = require('path');

function replaceBorderRadius(dir) {
    const files = fs.readdirSync(dir);
    for (const f of files) {
        const full = path.join(dir, f);
        if (fs.statSync(full).isDirectory()) {
            replaceBorderRadius(full);
        } else if (full.endsWith('.tsx') || full.endsWith('.ts')) {
            let txt = fs.readFileSync(full, 'utf8');
            let orig = txt;

            // Replace simple numeric borderRadius
            txt = txt.replace(/borderRadius:\s*\d+(\.\d+)?/g, 'borderRadius: 0');

            // Replace string borderRadius (e.g. "50%")
            txt = txt.replace(/borderRadius:\s*["'][^"']*["']/g, 'borderRadius: 0');

            if (txt !== orig) {
                fs.writeFileSync(full, txt, 'utf8');
                console.log('Squared', full);
            }
        }
    }
}
replaceBorderRadius('./app');
