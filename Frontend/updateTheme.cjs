const fs = require('fs');
const path = require('path');

const adminDir = '/Users/vishnu/Documents/Documents - Mac/CSE(AI&ML)/Projects/Clients/1.Hair Saloon/Christalin_Mirrors/Frontend/src/admin';
const pagesDir = path.join(adminDir, 'pages');

const cssFiles = [
    path.join(adminDir, 'AdminShared.css'),
    path.join(adminDir, 'AdminLayout.css'),
    path.join(pagesDir, 'Billing.css'),
];

fs.readdirSync(pagesDir).forEach(file => {
    if (file.endsWith('.css') && file !== 'Billing.css') {
        cssFiles.push(path.join(pagesDir, file));
    }
});

const themeRoot = `
:root[data-theme="dark"] {
  --bg-primary: #0a0a0a;
  --bg-secondary: #0B0B0F;
  --bg-card: #141418;
  --bg-card-hover: rgba(255, 255, 255, 0.04);
  --bg-card-alt: rgba(255, 255, 255, 0.02);
  --text-primary: #E8E8E8;
  --text-bright: #FFFFFF;
  --text-secondary: #CCCCCC;
  --text-muted: #888888;
  --text-dim: #666666;
  --border-color: rgba(255, 255, 255, 0.06);
  --border-light: rgba(255, 255, 255, 0.1);
  --border-strong: rgba(255, 255, 255, 0.15);
  --border-extreme: rgba(255, 255, 255, 0.3);
  --input-bg: #0B0B0F;
  --sidebar-bg: #101014;
  --topbar-bg: #0B0B0F;
  --accent: #C17F59;
  --accent-hover: #a96d4d;
  --accent-alt: #d4a847;
  --accent-alt-hover: #c19535;
  --success: #10b981;
  --success-light: #4ADE80;
  --danger: #E85D5D;
  --danger-strong: #ef4444;
  --warning: #f59e0b;
  --warning-light: #FBBF24;
  --info: #60A5FA;
  --purple: #A78BFA;
  --pink: #F472B6;
  --red-light: #F87171;
  --black-solid: #000000;
}

:root[data-theme="light"] {
  --bg-primary: #f4f4f0;
  --bg-secondary: #ffffff;
  --bg-card: #ffffff;
  --bg-card-hover: #f9f9f7;
  --bg-card-alt: #fafafa;
  --text-primary: #1a1a1a;
  --text-bright: #000000;
  --text-secondary: #555555;
  --text-muted: #777777;
  --text-dim: #999999;
  --border-color: #e5e5e0;
  --border-light: #d1d1cc;
  --border-strong: #bcbcbc;
  --border-extreme: #a0a099;
  --input-bg: #fdfdfc;
  --sidebar-bg: #101014; 
  --topbar-bg: #0B0B0F;  
  --accent: #C17F59;
  --accent-hover: #a96d4d;
  --accent-alt: #d4a847;
  --accent-alt-hover: #c19535;
  --success: #059669;
  --success-light: #10b981;
  --danger: #dc2626;
  --danger-strong: #b91c1c;
  --warning: #d97706;
  --warning-light: #f59e0b;
  --info: #2563eb;
  --purple: #7c3aed;
  --pink: #db2777;
  --red-light: #ef4444;
  --black-solid: #000000;
}
`;

function processFile(filePath) {
    if (!fs.existsSync(filePath)) return;
    let css = fs.readFileSync(filePath, 'utf8');

    // Remove old variables block if it exists (run multiple times safe)
    if (css.includes(':root[data-theme="dark"]')) {
       return; // Already processed
    }

    const replacements = [
        [/#141418/gi, 'var(--bg-card)'],
        [/#0B0B0F/gi, 'var(--bg-secondary)'],
        [/#0a0a0a/gi, 'var(--bg-primary)'],
        [/#0f0f0f/gi, 'var(--bg-primary)'],
        [/#151515/gi, 'var(--bg-card)'],
        [/#111111/gi, 'var(--bg-card)'],
        [/#1a1a1a/gi, 'var(--bg-card-hover)'],
        [/#000\b/gi, 'var(--black-solid)'],
        [/#000000/gi, 'var(--black-solid)'],
        [/#E8E8E8/gi, 'var(--text-primary)'],
        [/#FFFFFF/g, 'var(--text-bright)'],
        [/#fff\b/gi, 'var(--text-bright)'],
        [/#CCC(CCC)?\b/gi, 'var(--text-secondary)'],
        [/#AAA(AAA)?\b/gi, 'var(--text-muted)'],
        [/#888(888)?\b/gi, 'var(--text-muted)'],
        [/#777(777)?\b/gi, 'var(--text-dim)'],
        [/#666(666)?\b/gi, 'var(--text-dim)'],
        [/#555(555)?\b/gi, 'var(--text-dim)'],
        [/#444(444)?\b/gi, 'var(--text-dim)'],
        [/#333(333)?\b/gi, 'var(--text-dim)'],
        [/#222(222)?\b/gi, 'var(--border-strong)'],
        [/#101014/gi, 'var(--sidebar-bg)'],
        [/#C17F59/gi, 'var(--accent)'],
        [/#a96d4d/gi, 'var(--accent-hover)'],
        [/#d4a847/gi, 'var(--accent-alt)'],
        [/#e5b958/gi, 'var(--accent-alt-hover)'],
        [/#10b981/gi, 'var(--success)'],
        [/#0d9467/gi, 'var(--success)'],
        [/#4ADE80/gi, 'var(--success-light)'],
        [/#E85D5D/gi, 'var(--danger)'],
        [/#ef4444/gi, 'var(--danger-strong)'],
        [/#f59e0b/gi, 'var(--warning)'],
        [/#FBBF24/gi, 'var(--warning-light)'],
        [/#60A5FA/gi, 'var(--info)'],
        [/#A78BFA/gi, 'var(--purple)'],
        [/#F472B6/gi, 'var(--pink)'],
        [/#F87171/gi, 'var(--red-light)'],
        
        // RGBA alphas
        [/rgba\(\s*255\s*,\s*255\s*,\s*255\s*,\s*0\.06\s*\)/g, 'var(--border-color)'],
        [/rgba\(\s*255\s*,\s*255\s*,\s*255\s*,\s*0\.05\s*\)/g, 'var(--border-color)'],
        [/rgba\(\s*255\s*,\s*255\s*,\s*255\s*,\s*0\.08\s*\)/g, 'var(--border-color)'],
        [/rgba\(\s*255\s*,\s*255\s*,\s*255\s*,\s*0\.1\s*\)/g, 'var(--border-light)'],
        [/rgba\(\s*255\s*,\s*255\s*,\s*255\s*,\s*0\.15\s*\)/g, 'var(--border-strong)'],
        [/rgba\(\s*255\s*,\s*255\s*,\s*255\s*,\s*0\.3\s*\)/g, 'var(--border-extreme)'],
        [/rgba\(\s*255\s*,\s*255\s*,\s*255\s*,\s*0\.04\s*\)/g, 'var(--bg-card-hover)'],
        [/rgba\(\s*255\s*,\s*255\s*,\s*255\s*,\s*0\.02\s*\)/g, 'var(--bg-card-alt)'],
        [/rgba\(\s*255\s*,\s*255\s*,\s*255\s*,\s*0\.03\s*\)/g, 'var(--bg-card-alt)'],
        
        // specific bg exceptions for inputs (safe override)
        [/background:\s*var\(--bg-secondary\)/g, 'background: var(--input-bg)'],
        [/background:\s*var\(--bg-primary\)/g, 'background: var(--bg-primary)'],
    ];

    replacements.forEach(([pattern, replacer]) => {
        css = css.replace(pattern, replacer);
    });

    if (filePath.endsWith('AdminShared.css')) {
        css = themeRoot + '\n' + css;
    }

    fs.writeFileSync(filePath, css);
    console.log(`Updated ${filePath}`);
}

cssFiles.forEach(processFile);
