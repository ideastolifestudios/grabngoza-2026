import { Product, Testimonial, Partner } from './types';

export const PRODUCTS: Product[] = [
  {
    id: '1',
    name: 'CUSTOMBYREBA Essential Tee',
    price: 450,
    image: 'https://picsum.photos/seed/tee1/800/1000',
    categories: ['Apparel'],
    isDrop: true,
    description: 'Premium heavyweight cotton tee. Studio-born quality.'
  },
  {
    id: '2',
    name: 'Grab & Go "Fast" Hoodie',
    price: 850,
    image: 'https://picsum.photos/seed/hoodie1/800/1000',
    categories: ['Apparel'],
    isDrop: true,
    description: 'Limited edition collaboration hoodie.'
  },
  {
    id: '3',
    name: 'Lifestyle Bundle Pack',
    price: 1200,
    image: 'https://picsum.photos/seed/bundle1/800/1000',
    categories: ['Bundles'],
    isBundle: true,
    description: 'Tee + Cap + Tote. The ultimate starter pack.'
  },
  {
    id: '4',
    name: 'Studio Tote Bag',
    price: 250,
    image: 'https://picsum.photos/seed/tote1/800/1000',
    categories: ['Accessories'],
    description: 'Durable canvas tote for your daily grab.'
  }
];

export const TESTIMONIALS: Testimonial[] = [
  {
    id: '1',
    user: 'Lindiwe M.',
    handle: '@lindi_m',
    content: 'Literally grabbed and it was here the next day. So smooth! 🔥',
    type: 'instagram'
  },
  {
    id: '3',
    user: 'Zanele K.',
    handle: '@zane_k_vibe',
    content: 'Quality is insane. CUSTOMBYREBA never misses.',
    type: 'instagram'
  }
];

export const PARTNERS: Partner[] = [
  {
    id: '1',
    name: 'Cotton Fest',
    logo: 'https://picsum.photos/seed/cotton/200/200',
    description: 'Official lifestyle partner for the culture.'
  }
];
