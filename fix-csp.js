const fs = require('fs');
const path = require('path');

const files = [
  'next.config.js', 'next.config.mjs', 'next.config.ts',
  'src/middleware.ts', 'src/middleware.js',
  'middleware.ts', 'middleware.js',
  'src/app/layout.tsx', 'app/layout.tsx'
];

let patched = false;

files.forEach(file => {
  const fp = path.join(process.cwd(), file);
  if (fs.existsSync(fp)) {
    let content = fs.readFileSync(fp, 'utf8');
    let original = content;

    // Dynamically append Cloudinary to connect-src (Uploads)
    if (content.includes('connect-src') && !content.includes('api.cloudinary.com')) {
      content = content.replace(/(connect-src[\s\w'*:./-]+)/g, "$1 https://api.cloudinary.com https://res.cloudinary.com");
    }
    
    // Dynamically append Cloudinary to img-src (Viewing images)
    if (content.includes('img-src') && !content.includes('res.cloudinary.com')) {
      content = content.replace(/(img-src[\s\w'*:./-]+)/g, "$1 https://api.cloudinary.com https://res.cloudinary.com");
    }

    if (original !== content) {
      fs.writeFileSync(fp, content, 'utf8');
      console.log(`✅ Successfully patched CSP in: ${file}`);
      patched = true;
    }
  }
});

if (!patched) {
  console.log('⚠️ Could not automatically find the CSP headers. They may be in an unlisted file.');
}
