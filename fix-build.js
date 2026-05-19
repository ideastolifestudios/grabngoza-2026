const fs = require('fs');

console.log("Running batch fixes...");

// 1. Fix quote syntax in React components
const components = [
  './components/collections/SortSelect.tsx',
  './components/checkout/CheckoutForm.tsx'
];

components.forEach(file => {
  if (fs.existsSync(file)) {
    let code = fs.readFileSync(file, 'utf8');
    // Replaces broken nested quotes: "url("data:...")" -> `url("data:...")`
    code = code.replace(/backgroundImage:\s*"url\("data:(.*?)"\)"/g, 'backgroundImage: `url("data:$1")`');
    fs.writeFileSync(file, code);
    console.log(`✅ Fixed SVG quote syntax in ${file}`);
  }
});

// 2. Fix layout.tsx (Server Action & CSS path)
const layout = './app/layout.tsx';
if (fs.existsSync(layout)) {
  let code = fs.readFileSync(layout, 'utf8');
  
  // Remove 'use server' directive which breaks the layout
  code = code.replace(/"use server";?\r?\n/g, '');
  code = code.replace(/'use server';?\r?\n/g, '');
  
  // Auto-correct CSS path if globals.css is actually in the styles folder
  if (!fs.existsSync('./app/globals.css')) {
    code = code.replace(/import "\.\/globals\.css";/g, 'import "../styles/globals.css";');
    code = code.replace(/import '\.\/globals\.css';/g, 'import "../styles/globals.css";');
  }
  
  fs.writeFileSync(layout, code);
  console.log(`✅ Fixed Server directives and CSS paths in ${layout}`);
}

console.log("🚀 All done!");
