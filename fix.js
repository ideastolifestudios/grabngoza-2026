const fs = require('fs');
let c = fs.readFileSync('src/App.tsx', 'utf8');

c = c.replace(
  `className="absolute inset-0 w-full h-full object-cover transition-opacity duration-500"`,
  'className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-500 ${i === imgIdx ? \'opacity-100\' : \'opacity-0\'}`}'
);

c = c.replace(
  '      className="group cursor-pointer relative bg-white"\n    >\n      <div className="aspect-[4/5] overflow-hidden bg-white mb-2 relative group-hover:shadow-lg transition-all duration-700">',
  '      className="group cursor-pointer relative bg-white"\n      onClick={() => router.push(`/product/${product.id}`)}\n    >\n      <div className="aspect-[4/5] overflow-hidden bg-white mb-2 relative group-hover:shadow-lg transition-all duration-700">'
);

fs.writeFileSync('src/App.tsx', c);
console.log('Done');
