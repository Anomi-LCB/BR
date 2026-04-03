const fs = require('fs');
let globalCss = fs.readFileSync('src/app/globals.css', 'utf8');

// Strip any v4 imports
globalCss = globalCss.replace(/@import "tailwindcss";\s*/, '');
// Ensure v3 imports exist
if (!globalCss.includes('@tailwind base;')) {
    globalCss = '@tailwind base;\n@tailwind components;\n@tailwind utilities;\n\n' + globalCss;
}

fs.writeFileSync('src/app/globals.css', globalCss);
console.log('globals.css successfully reverted to Tailwind 3');
