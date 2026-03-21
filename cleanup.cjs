const fs = require('fs');
const path = require('path');

const filesToClean = [
    'src/app/layout.jsx',
    'src/app/page.jsx',
    'src/authUtils.jsx',
    'src/utils/spendingPredictor.jsx',
    'src/utils/smsParser.jsx',
    'src/utils/csvExport.jsx',
    'src/utils/autoCategory.jsx',
    'src/utils/pdfExport.jsx',
    'src/hooks/useInstallPrompt.jsx',
    'src/hooks/useNetwork.jsx',
    'src/lib/authUtils.jsx',
    'src/lib/firebase.jsx',
    'src/firebase.jsx'
];

for (const f of filesToClean) {
    const p = path.join(process.cwd(), f);
    if (fs.existsSync(p)) {
        const lines = fs.readFileSync(p, 'utf8').split('\n');
        if (lines[0] === "import React from 'react';" && lines[1] === "  ") {
            // Strip the first 10 lines
            const newLines = lines.slice(10);
            const originalPath = p.replace(/\.jsx$/, '.js');
            // write backup
            fs.writeFileSync(originalPath, newLines.join('\n'));
            // remove old corrupted .jsx file
            fs.unlinkSync(p);
            console.log(`Cleaned and renamed: ${f} -> ${originalPath}`);
        } else {
            console.log(`Skipped (did not match pattern): ${f}`);
        }
    } else {
        console.log(`File not found: ${f}`);
    }
}
