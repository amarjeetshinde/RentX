/**
 * DEMO DATA — Phase 1 Only
 * ─────────────────────────────────────────────────────────────────────
 * These are static placeholder records used to build and preview the UI.
 * They are NOT connected to Supabase and will be replaced in a later phase
 * once the database tables and API calls are implemented.
 *
 * To identify demo data anywhere in the codebase, look for files inside
 * src/data/  — everything here is display-only.
 */

export const DEMO_CATEGORIES = [
  {
    id: 'cameras',
    label: 'Cameras & Lenses',
    icon: 'Camera',
    description: 'DSLRs, mirrorless, video cameras and accessories',
    count: 48,
    color: 'bg-violet-50 text-violet-600 border-violet-100',
  },
  {
    id: 'laptops',
    label: 'Laptops & PCs',
    icon: 'Laptop',
    description: 'High-performance laptops for any task',
    count: 35,
    color: 'bg-sky-50 text-sky-600 border-sky-100',
  },
  {
    id: 'projectors',
    label: 'Projectors & Displays',
    icon: 'Monitor',
    description: 'Full-HD and 4K projectors for events and classrooms',
    count: 22,
    color: 'bg-amber-50 text-amber-600 border-amber-100',
  },
  {
    id: 'electronics',
    label: 'Electronics Kits',
    icon: 'Cpu',
    description: 'Arduino, Raspberry Pi, robotics and lab kits',
    count: 64,
    color: 'bg-emerald-50 text-emerald-600 border-emerald-100',
  },
  {
    id: 'audio',
    label: 'Audio Equipment',
    icon: 'Mic',
    description: 'Microphones, mixers, speakers and studio gear',
    count: 31,
    color: 'bg-rose-50 text-rose-600 border-rose-100',
  },
  {
    id: 'sports',
    label: 'Sports & Outdoor',
    icon: 'Bike',
    description: 'Sports equipment for fitness and outdoor adventures',
    count: 19,
    color: 'bg-teal-50 text-teal-600 border-teal-100',
  },
];

export const DEMO_EQUIPMENT = [
  {
    id: 'demo-1',
    name: 'Sony Alpha A7 III Full-Frame Camera',
    category: 'cameras',
    pricePerDay: 1200,
    rating: 4.9,
    reviewCount: 87,
    isAvailable: true,
    location: 'Delhi, India',
    ownerName: 'Priya Sharma',
    ownerAvatar: 'PS',
    image: null,            // Will use placeholder gradient
    tag: 'Most Popular',
    description: 'Professional mirrorless full-frame camera. Ideal for photography projects, events, and short films.',
  },
  {
    id: 'demo-2',
    name: 'MacBook Pro 16" M3 Pro',
    category: 'laptops',
    pricePerDay: 800,
    rating: 4.8,
    reviewCount: 124,
    isAvailable: true,
    location: 'Mumbai, India',
    ownerName: 'Arjun Mehta',
    ownerAvatar: 'AM',
    image: null,
    tag: 'Top Rated',
    description: 'Apple M3 Pro chip, 18 GB RAM, 512 GB SSD. Perfect for video editing, coding, and design work.',
  },
  {
    id: 'demo-3',
    name: 'Epson EB-PU1007B 4K Laser Projector',
    category: 'projectors',
    pricePerDay: 2500,
    rating: 4.7,
    reviewCount: 43,
    isAvailable: false,
    location: 'Bengaluru, India',
    ownerName: 'Kavitha Nair',
    ownerAvatar: 'KN',
    image: null,
    tag: 'Premium',
    description: 'Ultra-bright 7000 lumen laser projector. Best for large lecture halls and conference rooms.',
  },
  {
    id: 'demo-4',
    name: 'Arduino Mega Starter Kit (Complete)',
    category: 'electronics',
    pricePerDay: 250,
    rating: 4.6,
    reviewCount: 209,
    isAvailable: true,
    location: 'Hyderabad, India',
    ownerName: 'Rahul Gupta',
    ownerAvatar: 'RG',
    image: null,
    tag: 'Student Favourite',
    description: 'Full Arduino kit with sensors, modules, breadboards and components. Great for IoT projects.',
  },
  {
    id: 'demo-5',
    name: 'Rode NT-USB Professional Microphone',
    category: 'audio',
    pricePerDay: 350,
    rating: 4.8,
    reviewCount: 156,
    isAvailable: true,
    location: 'Pune, India',
    ownerName: 'Sneha Joshi',
    ownerAvatar: 'SJ',
    image: null,
    tag: 'Best Value',
    description: 'Studio-quality USB condenser microphone. Ideal for podcasts, voiceovers and online classes.',
  },
  {
    id: 'demo-6',
    name: 'DJI Mavic 3 Pro Drone',
    category: 'cameras',
    pricePerDay: 3500,
    rating: 5.0,
    reviewCount: 32,
    isAvailable: true,
    location: 'Chennai, India',
    ownerName: 'Vikram Iyer',
    ownerAvatar: 'VI',
    image: null,
    tag: 'New Arrival',
    description: 'Professional tri-camera drone with Hasselblad optics. Stunning aerial shots for film projects.',
  },
];

export const DEMO_STATS = [
  { label: 'Equipment Listed', value: '2,400+' },
  { label: 'Happy Renters', value: '18,000+' },
  { label: 'Cities Covered', value: '35+' },
  { label: 'Average Rating', value: '4.8 ★' },
];
