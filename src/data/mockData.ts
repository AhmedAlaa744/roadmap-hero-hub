export interface Product {
  id: string;
  name_en: string;
  name_ar: string;
  description_en: string;
  description_ar: string;
  price: number;
  category: string;
  condition: "new" | "used" | "used_as_new";
  pricing_model: "fixed" | "negotiable" | "auction";
  images: string[];
  store_name: string;
  store_id: string;
  rating: number;
  reviews_count: number;
  in_stock: boolean;
  stock?: number;
}

export interface Category {
  id: string;
  name_en: string;
  name_ar: string;
  icon: string;
  product_count: number;
}

export const categories: Category[] = [
  { id: "1", name_en: "Electronics", name_ar: "إلكترونيات", icon: "📱", product_count: 45 },
  { id: "2", name_en: "Fashion", name_ar: "أزياء", icon: "👗", product_count: 62 },
  { id: "3", name_en: "Home & Garden", name_ar: "المنزل والحديقة", icon: "🏡", product_count: 38 },
  { id: "4", name_en: "Sports & Outdoors", name_ar: "رياضة", icon: "⚽", product_count: 21 },
  { id: "5", name_en: "Books & Stationery", name_ar: "كتب وقرطاسية", icon: "📚", product_count: 33 },
  { id: "6", name_en: "Beauty & Health", name_ar: "جمال وصحة", icon: "💄", product_count: 28 },
  { id: "7", name_en: "Toys & Kids", name_ar: "ألعاب وأطفال", icon: "🧸", product_count: 19 },
  { id: "8", name_en: "Food & Beverages", name_ar: "طعام ومشروبات", icon: "🍕", product_count: 41 },
  { id: "9", name_en: "Art & Handmade", name_ar: "فن ويدوي", icon: "🎨", product_count: 15 },
  { id: "10", name_en: "Services", name_ar: "خدمات", icon: "🔧", product_count: 24 },
  { id: "11", name_en: "Automotive", name_ar: "سيارات", icon: "🚗", product_count: 12 },
  { id: "12", name_en: "Other", name_ar: "أخرى", icon: "📦", product_count: 8 },
];

export const products: Product[] = [
  {
    id: "1",
    name_en: "iPhone 15 Pro Max",
    name_ar: "آيفون ١٥ برو ماكس",
    description_en: "Brand new iPhone 15 Pro Max 256GB, Natural Titanium. Sealed box with warranty.",
    description_ar: "آيفون ١٥ برو ماكس ٢٥٦ جيجا جديد بالكرتونة، تيتانيوم طبيعي. مختوم بالضمان.",
    price: 65000,
    category: "Electronics",
    condition: "new",
    pricing_model: "fixed",
    images: ["https://images.unsplash.com/photo-1695048133142-1a20484d2569?w=600"],
    store_name: "Tech Zone",
    store_id: "s1",
    rating: 4.8,
    reviews_count: 23,
    in_stock: true,
  },
  {
    id: "2",
    name_en: "Handmade Leather Bag",
    name_ar: "حقيبة جلد يدوية",
    description_en: "Beautiful handcrafted genuine leather bag, perfect for daily use.",
    description_ar: "حقيبة جلد طبيعي مصنوعة يدويًا، مثالية للاستخدام اليومي.",
    price: 1200,
    category: "Fashion",
    condition: "new",
    pricing_model: "negotiable",
    images: ["https://images.unsplash.com/photo-1548036328-c9fa89d128fa?w=600"],
    store_name: "Nour's Crafts",
    store_id: "s2",
    rating: 4.9,
    reviews_count: 45,
    in_stock: true,
  },
  {
    id: "3",
    name_en: "Samsung 55\" Smart TV",
    name_ar: "تلفزيون سامسونج ٥٥ بوصة ذكي",
    description_en: "Samsung 55 inch 4K Smart TV, used for 6 months, excellent condition.",
    description_ar: "تلفزيون سامسونج ٥٥ بوصة ٤كي ذكي، مستعمل ٦ أشهر، حالة ممتازة.",
    price: 18000,
    category: "Electronics",
    condition: "used_as_new",
    pricing_model: "negotiable",
    images: ["https://images.unsplash.com/photo-1593359677879-a4bb92f829d1?w=600"],
    store_name: "Home Deals",
    store_id: "s3",
    rating: 4.5,
    reviews_count: 12,
    in_stock: true,
  },
  {
    id: "4",
    name_en: "Yoga Mat Premium",
    name_ar: "سجادة يوغا فاخرة",
    description_en: "Premium non-slip yoga mat, 6mm thick, with carrying strap.",
    description_ar: "سجادة يوغا فاخرة مانعة للانزلاق، سمك ٦ مم، مع حزام حمل.",
    price: 450,
    category: "Sports & Outdoors",
    condition: "new",
    pricing_model: "fixed",
    images: ["https://images.unsplash.com/photo-1601925260368-ae2f83cf8b7f?w=600"],
    store_name: "FitLife Store",
    store_id: "s4",
    rating: 4.7,
    reviews_count: 31,
    in_stock: true,
  },
  {
    id: "5",
    name_en: "Homemade Kunafa Tray",
    name_ar: "صينية كنافة بيتي",
    description_en: "Freshly made traditional kunafa with cream, serves 8-10 people. Order by 2 PM for same-day delivery.",
    description_ar: "كنافة بيتي طازة بالقشطة، تكفي ٨-١٠ أشخاص. اطلب قبل الساعة ٢ للتوصيل في نفس اليوم.",
    price: 250,
    category: "Food & Beverages",
    condition: "new",
    pricing_model: "fixed",
    images: ["https://images.unsplash.com/photo-1579888944880-d98341245702?w=600"],
    store_name: "Mama's Kitchen",
    store_id: "s5",
    rating: 5.0,
    reviews_count: 89,
    in_stock: true,
  },
  {
    id: "6",
    name_en: "Wooden Coffee Table",
    name_ar: "طاولة قهوة خشبية",
    description_en: "Solid oak coffee table, modern design. Minor scratch on one leg.",
    description_ar: "طاولة قهوة من خشب البلوط الصلب، تصميم عصري. خدش بسيط في ساق واحدة.",
    price: 3500,
    category: "Home & Garden",
    condition: "used",
    pricing_model: "negotiable",
    images: ["https://images.unsplash.com/photo-1533090481720-856c6e3c1fdc?w=600"],
    store_name: "Home Deals",
    store_id: "s3",
    rating: 4.3,
    reviews_count: 8,
    in_stock: true,
  },
  {
    id: "7",
    name_en: "Kids Drawing Set",
    name_ar: "طقم رسم للأطفال",
    description_en: "Complete art set with 120 pieces: colored pencils, markers, crayons, and watercolors.",
    description_ar: "طقم فن كامل ١٢٠ قطعة: ألوان خشب، ماركرز، ألوان شمع، وألوان مائية.",
    price: 380,
    category: "Toys & Kids",
    condition: "new",
    pricing_model: "fixed",
    images: ["https://images.unsplash.com/photo-1513364776144-60967b0f800f?w=600"],
    store_name: "Happy Kids",
    store_id: "s6",
    rating: 4.6,
    reviews_count: 17,
    in_stock: true,
  },
  {
    id: "8",
    name_en: "MacBook Air M2",
    name_ar: "ماك بوك اير M2",
    description_en: "MacBook Air M2, 8GB RAM, 256GB SSD. Used for 3 months, comes with box and charger.",
    description_ar: "ماك بوك اير M2، ٨ جيجا رام، ٢٥٦ جيجا. مستعمل ٣ أشهر، مع الكرتونة والشاحن.",
    price: 42000,
    category: "Electronics",
    condition: "used_as_new",
    pricing_model: "auction",
    images: ["https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=600"],
    store_name: "Tech Zone",
    store_id: "s1",
    rating: 4.9,
    reviews_count: 5,
    in_stock: true,
  },
];
