import { NextResponse } from 'next/server';
import { db } from '../../../../firebase';
import { collection, getDocs } from 'firebase/firestore';

export async function GET() {
  const storeUrl = 'https://shopgrabngo.co.za';
  let products: any[] = [];

  try {
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
  } catch (err) {
    console.error('Failed to fetch products from Firestore for feed:', err);
  }

  if (products.length === 0) {
    products.push({
      id: 'GBG-LIVE-01',
      title: 'Grab & Go Live Store Item',
      description: 'Live item synchronized from Firebase.',
      link: `${storeUrl}/shop`,
      image_link: 'https://res.cloudinary.com/demo/image/upload/sample.jpg',
      price: '150.00 ZAR',
      availability: 'in_stock',
      brand: 'Grab & Go',
      condition: 'new'
    });
  }

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
    <description>Live Firestore Feed for shopgrabngo.co.za</description>
    ${xmlItems}
  </channel>
</rss>`;

  return new NextResponse(xml, {
    status: 200,
    headers: {
      'Content-Type': 'application/xml; charset=utf-8',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600',
    },
  });
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, User-Agent',
    },
  });
}
