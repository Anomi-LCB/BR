const fs = require('fs');

// Fix JournalView.tsx
let c1 = fs.readFileSync('src/components/JournalView.tsx', 'utf8').split(/\r?\n/);
c1[51] = '        let formatted = text.replace(/(습니다|합니다|입니다|했습니다|은|는|이|가|을|를|에게|에서|로|으로)(?![\\s.,!?])/g, \'$1 \');';
c1[52] = '        return formatted.replace(/\\s+/g, \' \').trim();';
c1[53] = '';
fs.writeFileSync('src/components/JournalView.tsx', c1.join('\n'));

// Fix badge-service.ts
let c2 = fs.readFileSync('src/lib/badge-service.ts', 'utf8');
c2 = c2.replace(/badge\.criteria\.value/g, '(badge.criteria as any).value');
fs.writeFileSync('src/lib/badge-service.ts', c2);
