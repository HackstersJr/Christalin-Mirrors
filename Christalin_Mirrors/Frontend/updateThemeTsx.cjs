const fs = require('fs');
const path = require('path');

const adminDir = '/Users/vishnu/Documents/Documents - Mac/CSE(AI&ML)/Projects/Clients/1.Hair Saloon/Christalin_Mirrors/Frontend/src/admin';
const pagesDir = path.join(adminDir, 'pages');

const tsxFiles = [
    path.join(adminDir, 'AdminLayout.tsx'),
];

fs.readdirSync(pagesDir).forEach(file => {
    if (file.endsWith('.tsx')) {
        tsxFiles.push(path.join(pagesDir, file));
    }
});

function processTsxFile(filePath) {
    if (!fs.existsSync(filePath)) return;
    let code = fs.readFileSync(filePath, 'utf8');

    const replacements = [
        [/'#141418'/gi, "'var(--bg-card)'"],
        [/'#0B0B0F'/gi, "'var(--bg-secondary)'"],
        [/'#0a0a0a'/gi, "'var(--bg-primary)'"],
        [/'#111111'/gi, "'var(--bg-card)'"],
        [/'#1a1a1a'/gi, "'var(--bg-card-hover)'"],
        [/'#E8E8E8'/gi, "'var(--text-primary)'"],
        [/'#FFFFFF'/g, "'var(--text-bright)'"],
        [/'#fff'/gi, "'var(--text-bright)'"],
        [/'#CCC'/gi, "'var(--text-secondary)'"],
        [/'#AAA'/gi, "'var(--text-muted)'"],
        [/'#888'/gi, "'var(--text-muted)'"],
        [/'#777'/gi, "'var(--text-dim)'"],
        [/'#666'/gi, "'var(--text-dim)'"],
        [/'#555'/gi, "'var(--text-dim)'"],
        [/'#444'/gi, "'var(--text-dim)'"],
        [/'#333'/gi, "'var(--text-dim)'"],
        [/'#222'/gi, "'var(--border-strong)'"],
        [/'#101014'/gi, "'var(--sidebar-bg)'"],
        [/'#C17F59'/gi, "'var(--accent)'"],
        [/'#a96d4d'/gi, "'var(--accent-hover)'"],
        [/'#d4a847'/gi, "'var(--accent-alt)'"],
        [/'#e5b958'/gi, "'var(--accent-alt-hover)'"],
        [/'#10b981'/gi, "'var(--success)'"],
        [/'#0d9467'/gi, "'var(--success)'"],
        [/'#4ADE80'/gi, "'var(--success-light)'"],
        [/'#E85D5D'/gi, "'var(--danger)'"],
        [/'#ef4444'/gi, "'var(--danger-strong)'"],
        [/'#f59e0b'/gi, "'var(--warning)'"],
        [/'#FBBF24'/gi, "'var(--warning-light)'"],
        [/'#60A5FA'/gi, "'var(--info)'"],
        [/'#A78BFA'/gi, "'var(--purple)'"],
        [/'#F472B6'/gi, "'var(--pink)'"],
        [/'#F87171'/gi, "'var(--red-light)'"],
        [/'#25D366'/g, "'#25D366'"], // Whatsapp color exception
        
        // RGBA alphas
        [/'rgba\(255,\\s*255,\\s*255,\\s*0\.06\)'/g, "'var(--border-color)'"],
        [/'rgba\(255,\\s*255,\\s*255,\\s*0\.08\)'/g, "'var(--border-color)'"],
        [/'rgba\(255,\\s*255,\\s*255,\\s*0\.1\)'/g, "'var(--border-light)'"],
        [/'rgba\(255,\\s*255,\\s*255,\\s*0\.15\)'/g, "'var(--border-strong)'"],
        [/'rgba\(255,\\s*255,\\s*255,\\s*0\.3\)'/g, "'var(--border-extreme)'"],
        [/'rgba\(255,\\s*255,\\s*255,\\s*0\.04\)'/g, "'var(--bg-card-hover)'"],
        [/'rgba\(255,\\s*255,\\s*255,\\s*0\.02\)'/g, "'var(--bg-card-alt)'"],
        [/'rgba\(255,\\s*255,\\s*255,\\s*0\.03\)'/g, "'var(--bg-card-alt)'"],
    ];

    replacements.forEach(([pattern, replacer]) => {
        code = code.replace(pattern, replacer);
    });

    fs.writeFileSync(filePath, code);
    console.log(`Updated TSX: ${filePath}`);
}

tsxFiles.forEach(processTsxFile);
