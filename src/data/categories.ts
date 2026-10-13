import {
  Smartphone,
  Shirt,
  Armchair,
  Car,
  Home,
  Briefcase,
  Wrench,
  Store,
  Grid
} from 'lucide-react';
import React from 'react';

export interface CategoryMeta {
  id: string;
  name: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  subcategories: string[];
}

export const CATEGORIES_LIST: CategoryMeta[] = [
  {
    id: 'mobiles-electronics',
    name: 'Mobiles & Electronics',
    description: 'Smartphones, laptops, cameras, home appliances & gadgets',
    icon: Smartphone,
    subcategories: ['Mobile Phones', 'Laptops & Computers', 'Cameras & Optics', 'Audio & Headphones', 'Home Appliances', 'TV & Video', 'Other Gadgets']
  },
  {
    id: 'fashion-clothing',
    name: 'Fashion & Clothing',
    description: 'Sarees, panjabis, western wear, shoes & accessories',
    icon: Shirt,
    subcategories: ["Men's Clothing", "Women's Clothing", 'Shoes & Footwear', 'Watches & Jewelry', 'Bags & Wallets', 'Kids & Babies']
  },
  {
    id: 'home-living',
    name: 'Home & Living',
    description: 'Furniture, decor, kitchenware, bedding & crafts',
    icon: Armchair,
    subcategories: ['Living Room Furniture', 'Bedroom & Beds', 'Kitchen & Dining', 'Home Decor', 'Lighting & Fans', 'Tools & Hardware']
  },
  {
    id: 'vehicles',
    name: 'Vehicles',
    description: 'Motorcycles, cars, bicycles, auto parts & commercial',
    icon: Car,
    subcategories: ['Motorcycles & Scooters', 'Cars & Sedans', 'Bicycles', 'Commercial Vehicles', 'Auto Parts & Accessories', 'Boats & Watercraft']
  },
  {
    id: 'property',
    name: 'Property',
    description: 'Apartments for rent, commercial spaces & plots',
    icon: Home,
    subcategories: ['Apartments for Rent', 'Apartments for Sale', 'Commercial Space', 'Plots & Land', 'Room / Sublet']
  },
  {
    id: 'jobs',
    name: 'Jobs',
    description: 'IT, sales, office management, delivery & remote roles',
    icon: Briefcase,
    subcategories: ['IT & Software', 'Sales & Marketing', 'Office & Admin', 'Delivery & Driver', 'Customer Support', 'Remote Work']
  },
  {
    id: 'services',
    name: 'Services',
    description: 'Home repairs, AC servicing, tailoring, tutoring & events',
    icon: Wrench,
    subcategories: ['Home & Appliance Repair', 'AC Servicing', 'Cleaning & Shifting', 'Tuition & Education', 'Tailoring & Design', 'Events & Catering']
  },
  {
    id: 'local-businesses',
    name: 'Local Businesses',
    description: 'Wholesale suppliers, grocery stores & artisan crafts',
    icon: Store,
    subcategories: ['Wholesale & B2B', 'Grocery & Super shops', 'Retail Outlets', 'Handicrafts & Artisans', 'Farming & Agro']
  },
  {
    id: 'other',
    name: 'Other',
    description: 'Books, musical instruments, hobbies & collectibles',
    icon: Grid,
    subcategories: ['Books & Magazines', 'Sports & Fitness', 'Musical Instruments', 'Pets & Pet Care', 'Hobbies & Collectibles']
  }
];

