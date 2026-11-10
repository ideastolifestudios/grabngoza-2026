import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs } from 'firebase/firestore';
import fs from 'fs';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function buildFeed() {
  const storeUrl = 'https://shopgrabngo.co.za';
  let products = [];

  const querySnapshot = await getDocs(collection(db, 'products'));
  querySnapshot.forEach((doc) => {
    const data = doc.data();
    products.push({
      id: doc.id,
      title: data.name || data.title || 'Untitled Product',
      description: data.description || 'Grab & Go ZA product',
      link: `${storeUrl}/product/${doc.id}`,
      image_link: data.image || data.imageUrl || 'https://res.cloudinary.com/demo/image/upload/sample.jpg',
      price: `${data.price || 0}.00 ZAR`,
      availability: (data.stock || data.quantity || 0) > 0 ? 'in_stock' : 'out_of_stock',
      brand: 'Grab & Go',
      condition: 'new'
    });
  });

  const xmlItems = products.map((p) => `
    <item>
      <g:id>${p.id}</g:id>
      <title><![CDATA[${p.title}]]></title>
      <description><![CDATA[${p.description}]]></description>
      <link>${p.link}</link>
      <g:image_link>${p.image_link}</g:image_link>
      <g:price>${p.price}</g:price>
      <g:availability>${p.availability}</g:availability>
      <g:brand><![CDATA[${p.brand}]]></g:brand>
      <g:condition>${p.condition}</g:condition>
    </item>
  `).join('');

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:g="http://base.google.com/ns/1.0">
  <channel>
    <title>Grab &amp; Go ZA Live Product Feed</title>
    <link>${storeUrl}</link>
    <description>Static Feed for shopgrabngo.co.za</description>
    ${xmlItems}
  </channel>
</rss>`;

  fs.writeFileSync('public/google-merchant.xml', xml.trim());
  console.log('Successfully generated public/google-merchant.xml');
  process.exit(0);
}

buildFeed().catch(console.error);
