// Keyword → canonical category name (must match categories.name_en in DB)
const RULES: Array<{ category: string; keywords: string[] }> = [
  {
    category: "Bakery & Sweets",
    keywords: [
      "cake", "cakes", "cupcake", "cookie", "cookies", "brownie", "muffin", "donut", "doughnut",
      "pastry", "pastries", "bread", "loaf", "bun", "croissant", "pie", "tart", "cheesecake",
      "chocolate", "candy", "sweet", "dessert", "kunafa", "knafeh", "basbousa", "baklava",
      "كيك", "كيكة", "كوكيز", "حلو", "حلوى", "حلويات", "خبز", "كرواسون", "كنافة", "بسبوسة", "بقلاوة", "شوكولاتة",
    ],
  },
  {
    category: "Electronics",
    keywords: [
      "phone", "mobile", "iphone", "samsung", "xiaomi", "huawei", "android", "smartphone",
      "laptop", "macbook", "notebook", "computer", "pc", "desktop", "monitor", "screen",
      "tv", "television", "tablet", "ipad", "headphone", "headset", "earbud", "earphone", "airpods",
      "speaker", "camera", "lens", "console", "playstation", "xbox", "nintendo", "charger", "cable",
      "router", "wifi", "drone", "smartwatch", "watch",
      "موبايل", "جوال", "تليفون", "هاتف", "آيفون", "ايفون", "لابتوب", "كمبيوتر", "شاشة", "تلفزيون",
      "تلفاز", "تابلت", "سماعة", "سماعات", "كاميرا", "شاحن", "ساعة",
    ],
  },
  {
    category: "Groceries",
    keywords: [
      "rice", "pasta", "flour", "sugar", "salt", "oil", "milk", "cheese", "yogurt", "egg", "eggs",
      "tomato", "onion", "potato", "vegetable", "fruit", "apple", "banana", "orange", "meat",
      "chicken", "beef", "fish", "spice", "tea", "coffee", "juice", "water",
      "أرز", "مكرونة", "دقيق", "سكر", "ملح", "زيت", "حليب", "لبن", "جبنة", "زبادي", "بيض", "طماطم",
      "بصل", "بطاطس", "خضار", "فاكهة", "تفاح", "موز", "برتقال", "لحم", "دجاج", "فراخ", "سمك", "شاي", "قهوة", "عصير",
    ],
  },
  {
    category: "Food & Beverages",
    keywords: [
      "meal", "lunch", "dinner", "breakfast", "pizza", "burger", "sandwich", "shawarma", "kebab",
      "koshary", "molokhia", "fattah", "soup", "salad", "drink", "beverage", "soda", "smoothie",
      "وجبة", "غداء", "عشاء", "فطار", "إفطار", "بيتزا", "برجر", "ساندوتش", "شاورما", "كباب",
      "كشري", "ملوخية", "فتة", "شوربة", "سلطة", "مشروب",
    ],
  },
  {
    category: "Home & Kitchen",
    keywords: [
      "sofa", "couch", "chair", "table", "bed", "mattress", "pillow", "blanket", "curtain",
      "rug", "carpet", "lamp", "light", "kitchen", "pan", "pot", "knife", "plate", "cup", "mug",
      "blender", "mixer", "microwave", "fridge", "refrigerator", "oven", "vacuum", "iron",
      "كنبة", "كرسي", "ترابيزة", "طاولة", "سرير", "مرتبة", "وسادة", "بطانية", "ستارة", "سجاد",
      "مطبخ", "حلة", "طاسة", "سكين", "طبق", "كوب", "خلاط", "ميكروويف", "ثلاجة", "فرن",
    ],
  },
  {
    category: "Fashion",
    keywords: [
      "shirt", "tshirt", "t-shirt", "pants", "trousers", "jeans", "dress", "skirt", "jacket",
      "coat", "hoodie", "sweater", "shoes", "sneaker", "boot", "sandal", "bag", "handbag",
      "wallet", "belt", "scarf", "hijab", "abaya", "kaftan",
      "قميص", "بنطلون", "جينز", "فستان", "تنورة", "جاكيت", "هودي", "بلوفر", "حذاء", "جزمة",
      "صندل", "حقيبة", "شنطة", "محفظة", "حزام", "وشاح", "حجاب", "عباية", "قفطان",
    ],
  },
  {
    category: "Beauty & Personal Care",
    keywords: [
      "makeup", "lipstick", "mascara", "foundation", "perfume", "fragrance", "shampoo", "conditioner",
      "soap", "lotion", "cream", "skincare", "sunscreen", "razor", "shaver", "deodorant",
      "مكياج", "أحمر شفاه", "روج", "مسكرة", "عطر", "برفان", "شامبو", "بلسم", "صابون", "كريم",
      "غسول", "حلاقة", "مزيل عرق",
    ],
  },
  {
    category: "Baby & Kids",
    keywords: [
      "baby", "infant", "toddler", "diaper", "stroller", "crib", "toy", "toys", "doll", "lego",
      "puzzle", "kid", "child", "children",
      "بيبي", "رضيع", "حفاضة", "حفاضات", "عربة", "سرير أطفال", "لعبة", "ألعاب", "عروسة", "طفل", "أطفال",
    ],
  },
  {
    category: "Health & Wellness",
    keywords: [
      "vitamin", "supplement", "medicine", "medical", "thermometer", "bandage", "first aid",
      "protein", "fitness supplement",
      "فيتامين", "مكمل", "دواء", "طبي", "ترمومتر", "ضمادة", "بروتين",
    ],
  },
  {
    category: "Sports & Outdoor",
    keywords: [
      "yoga", "mat", "dumbbell", "weights", "treadmill", "bicycle", "bike", "football", "soccer",
      "basketball", "tennis", "racket", "swim", "gym", "running", "hiking", "camping", "tent",
      "يوغا", "دامبل", "أوزان", "دراجة", "كرة قدم", "سلة", "تنس", "مضرب", "سباحة", "جيم", "جري", "خيمة",
    ],
  },
  {
    category: "Books & Stationery",
    keywords: [
      "book", "novel", "notebook", "pen", "pencil", "marker", "highlighter", "stationery",
      "diary", "planner", "eraser", "ruler", "backpack", "schoolbag",
      "كتاب", "رواية", "دفتر", "قلم", "ممحاة", "مسطرة", "حقيبة مدرسية",
    ],
  },
  {
    category: "Services",
    keywords: [
      "cleaning service", "tutoring", "lesson", "lessons", "repair", "installation", "delivery service",
      "consulting", "babysitting", "training",
      "تنظيف", "دروس", "درس", "تصليح", "تركيب", "استشارة", "تدريب",
    ],
  },
];

export function suggestCategoryName(input: string): string | null {
  if (!input) return null;
  const text = input.toLowerCase().trim();
  if (!text) return null;
  for (const rule of RULES) {
    for (const kw of rule.keywords) {
      const k = kw.toLowerCase();
      // Word-boundary-ish check for latin, simple includes for arabic
      if (/^[a-z0-9 ]+$/.test(k)) {
        const re = new RegExp(`(^|[^a-z0-9])${k.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}([^a-z0-9]|$)`, "i");
        if (re.test(text)) return rule.category;
      } else if (text.includes(k)) {
        return rule.category;
      }
    }
  }
  return null;
}
