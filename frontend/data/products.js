// Centralized product data for all categories
// All existing product images are preserved here

const allProducts = [
  // Best Deal Products
  { id: 'deal-tomato', name: 'Fresh Tomato', price: 22.00, originalPrice: 32.00, size: '500 GM', category: 'Best Deal', image: 'https://images.unsplash.com/photo-1592924357228-91a4daadcfea?w=400&q=80', discount: '30% OFF' },
  { id: 'deal-basmati', name: 'Basmati Rice', price: 224.00, originalPrice: 320.00, size: '5 KG', category: 'Best Deal', image: 'https://5.imimg.com/data5/ECOM/Default/2024/10/458187235/IG/MR/TQ/90021126/jun110004048xx26jun23-5-b-500x500.jpg', discount: '30% OFF' },
  { id: 'deal-mustard-oil', name: 'Pure Mustard Oil', price: 126.00, originalPrice: 180.00, size: '1 L', category: 'Best Deal', image: 'https://images.unsplash.com/photo-1608571423902-eed4a5ad8108?w=400&q=80', discount: '30% OFF' },
  { id: 'deal-milk', name: 'Full Cream Milk', price: 42.00, originalPrice: 60.00, size: '1 L', category: 'Best Deal', image: 'https://images.unsplash.com/photo-1563636619-e9143da7973b?w=400&q=80', discount: '30% OFF' },
  { id: 'deal-potato-chips', name: 'Salted Potato Chips', price: 14.00, originalPrice: 20.00, size: '50 GM', category: 'Best Deal', image: 'https://cdn.grofers.com/da/cms-assets/cms/product/d659ecce-67a3-4092-b878-fd889f5faced.jpg', discount: '30% OFF' },
  { id: 'deal-body-wash', name: 'Moisturizing Body Wash', price: 126.00, originalPrice: 180.00, size: '200 ML', category: 'Best Deal', image: 'https://images.unsplash.com/photo-1608248597279-f99d160bfcbc?w=400&q=80', discount: '30% OFF' },
  { id: 'deal-detergent', name: 'Laundry Detergent Powder', price: 196.00, originalPrice: 280.00, size: '2 KG', category: 'Best Deal', image: 'https://m.media-amazon.com/images/I/71v+67aeZuL.jpg', discount: '30% OFF' },
  { id: 'deal-diapers', name: 'Baby Diapers (Medium)', price: 315.00, originalPrice: 450.00, size: '46 PCS', category: 'Best Deal', image: 'https://letsallter.com/cdn/shop/files/M-32_-Breeze-Diaper-Pants_128fa9f2-b756-4dcb-a598-3f4c4f3ec097.png?v=1770962187&width=2160', discount: '30% OFF' },
  { id: 'deal-incense', name: 'Fragrant Incense Sticks', price: 31.50, originalPrice: 45.00, size: '100 GM', category: 'Best Deal', image: 'https://m.media-amazon.com/images/I/41c-3zs-gwL.jpg', discount: '30% OFF' },
  { id: 'deal-apple', name: 'Red Apple', price: 126.00, originalPrice: 180.00, size: '1 KG', category: 'Best Deal', image: 'https://images.unsplash.com/photo-1560806887-1e4cd0b6cbd6?w=400&q=80', discount: '30% OFF' },
  { id: 'deal-oats', name: 'Rolled Oats', price: 112.00, originalPrice: 160.00, size: '1 KG', category: 'Best Deal', image: 'https://true-elements.com/cdn/shop/files/Rolled_Oats_1.2kg_FOP.png?v=1756121233', discount: '30% OFF' },
  { id: 'deal-ghee', name: 'Pure Cow Ghee', price: 406.00, originalPrice: 580.00, size: '1 L', category: 'Best Deal', image: 'https://ueirorganic.com/cdn/shop/files/purecowghee.jpg?v=1689066451', discount: '30% OFF' },
  { id: 'deal-paneer', name: 'Fresh Paneer', price: 59.50, originalPrice: 85.00, size: '200 GM', category: 'Best Deal', image: 'https://m.media-amazon.com/images/I/51Rk1mu9IlL.jpg', discount: '30% OFF' },
  { id: 'deal-cookies', name: 'Choco Chip Cookies', price: 42.00, originalPrice: 60.00, size: '150 GM', category: 'Best Deal', image: 'https://www.bbassets.com/media/uploads/p/l/267154_4-unibic-cookies-chocolate-chip.jpg', discount: '30% OFF' },
  { id: 'deal-shampoo', name: 'Natural Hair Shampoo', price: 175.00, originalPrice: 250.00, size: '200 ML', category: 'Best Deal', image: 'https://images.unsplash.com/photo-1631729371254-42c2892f0e6e?w=400&q=80', discount: '30% OFF' },
  { id: 'deal-floor-cleaner', name: 'Floor Cleaner Liquid', price: 112.00, originalPrice: 160.00, size: '1 L', category: 'Best Deal', image: 'https://www.purecult.in/cdn/shop/files/FLOOR_CLEANER_5L_FRONT.png?v=1764594421', discount: '30% OFF' },
  { id: 'deal-baby-lotion', name: 'Baby Body Lotion', price: 126.00, originalPrice: 180.00, size: '200 ML', category: 'Best Deal', image: 'https://bumtum.in/cdn/shop/files/Body_Lotion_200ML_b92718cb-a792-49ae-bb80-5a16a43a062f_600x.png?v=1754935124', discount: '30% OFF' },
  { id: 'deal-camphor', name: 'Pure Camphor Tablets', price: 28.00, originalPrice: 40.00, size: '100 GM', category: 'Best Deal', image: 'https://chitrashila.com/cdn/shop/files/onwhite.jpg?v=1750503887&width=2000', discount: '30% OFF' },
  { id: 'deal-onion', name: 'Red Onion', price: 36.40, originalPrice: 52.00, size: '1 KG', category: 'Best Deal', image: 'https://images.unsplash.com/photo-1618512496248-a07fe83aa8cb?w=400&q=80', discount: '30% OFF' },
  { id: 'deal-wheat-flour', name: 'Whole Wheat Flour', price: 196.00, originalPrice: 280.00, size: '5 KG', category: 'Best Deal', image: 'https://www.jiomart.com/images/product/original/rv2jldvfii/five-rivers-whole-wheat-flour-5kg-product-images-orv2jldvfii-p611924631-0-202507101606.png?im=Resize=(420,420)', discount: '30% OFF' },
  
  // Fruits
  { id: 'apple', name: 'Red Apple', price: 180.00, size: '1 KG', category: 'Fruits', image: 'https://images.unsplash.com/photo-1560806887-1e4cd0b6cbd6?w=400&q=80' },
  { id: 'banana', name: 'Fresh Banana', price: 60.00, size: '1 DOZEN', category: 'Fruits', image: 'https://images.unsplash.com/photo-1603833665858-e61d17a86224?w=400&q=80' },
  { id: 'mango', name: 'Alphonso Mango', price: 210.00, size: '1 KG', category: 'Fruits', image: 'https://images.unsplash.com/photo-1605440846964-c6297a046b0c?w=400&q=80' },
  { id: 'orange', name: 'Fresh Orange', price: 120.00, size: '1 KG', category: 'Fruits', image: 'https://images.unsplash.com/photo-1580013759032-c96505e24c1f?w=400&q=80' },
  { id: 'grapes', name: 'Green Grapes', price: 95.00, size: '500 GM', category: 'Fruits', image: 'https://images.unsplash.com/photo-1599819177626-c2f9c9ca1a07?w=400&q=80' },
  { id: 'pomegranate', name: 'Pomegranate', price: 220.00, size: '1 KG', category: 'Fruits', image: 'https://images.unsplash.com/photo-1580495165843-7396311f2bff?w=400&q=80' },
  { id: 'papaya', name: 'Fresh Papaya', price: 45.00, size: '1 PC', category: 'Fruits', image: 'https://images.unsplash.com/photo-1617112848923-cc2234396a8d?w=400&q=80' },
  { id: 'watermelon', name: 'Watermelon', price: 40.00, size: '1 KG', category: 'Fruits', image: 'https://images.unsplash.com/photo-1587049352846-4a222e784366?w=400&q=80' },
  { id: 'pineapple', name: 'Fresh Pineapple', price: 80.00, size: '1 PC', category: 'Fruits', image: 'https://images.unsplash.com/photo-1550258987-190a2d41a8ba?w=400&q=80' },
  { id: 'kiwi', name: 'Kiwi Fruit', price: 150.00, size: '500 GM', category: 'Fruits', image: 'https://images.unsplash.com/photo-1585059895524-72359e06133a?w=400&q=80' },
  { id: 'strawberry', name: 'Fresh Strawberry', price: 280.00, size: '500 GM', category: 'Fruits', image: 'https://images.unsplash.com/photo-1464965911861-746a04b4bca6?w=400&q=80' },
  { id: 'guava', name: 'Pink Guava', price: 60.00, size: '500 GM', category: 'Fruits', image: 'https://images.unsplash.com/photo-1536511132770-e5058c7e8c46?w=400&q=80' },
  { id: 'lychee', name: 'Fresh Lychee', price: 180.00, size: '500 GM', category: 'Fruits', image: 'https://images.unsplash.com/photo-1618897996318-5a901fa6ca71?w=400&q=80' },
  { id: 'dragon-fruit', name: 'Dragon Fruit', price: 220.00, size: '500 GM', category: 'Fruits', image: 'https://images.unsplash.com/photo-1527325678964-54921661f888?w=400&q=80' },
  { id: 'avocado', name: 'Fresh Avocado', price: 280.00, size: '500 GM', category: 'Fruits', image: 'https://images.unsplash.com/photo-1523049673857-eb18f1d7b578?w=400&q=80' },
  { id: 'peach', name: 'Juicy Peach', price: 200.00, size: '500 GM', category: 'Fruits', image: 'https://images.unsplash.com/photo-1629828874514-d5e0c5b91859?w=400&q=80' },
  { id: 'plum', name: 'Fresh Plum', price: 180.00, size: '500 GM', category: 'Fruits', image: 'https://images.unsplash.com/photo-1596361004893-ee6cf199fcaf?w=400&q=80' },
  { id: 'pear', name: 'Green Pear', price: 160.00, size: '1 KG', category: 'Fruits', image: 'https://images.unsplash.com/photo-1568142091455-60dcb96fc253?w=400&q=80' },
  { id: 'cherry', name: 'Fresh Cherry', price: 480.00, size: '500 GM', category: 'Fruits', image: 'https://images.unsplash.com/photo-1528821128474-27f963b062bf?w=400&q=80' },
  { id: 'blueberry', name: 'Blueberries', price: 420.00, size: '250 GM', category: 'Fruits', image: 'https://images.unsplash.com/photo-1498557850523-fd3d118b962e?w=400&q=80' },

  // Vegetables
  { id: 'tomato', name: 'Fresh Tomato', price: 32.00, size: '500 GM', category: 'Vegetables', image: 'https://images.unsplash.com/photo-1592924357228-91a4daadcfea?w=400&q=80' },
  { id: 'potato', name: 'Organic Potato', price: 50.00, size: '1 KG', category: 'Vegetables', image: 'https://images.unsplash.com/photo-1518977676601-b53f82aba655?w=400&q=80' },
  { id: 'onion', name: 'Red Onion', price: 52.00, size: '1 KG', category: 'Vegetables', image: 'https://images.unsplash.com/photo-1618512496248-a07fe83aa8cb?w=400&q=80' },
  { id: 'carrot', name: 'Fresh Carrot', price: 48.00, size: '500 GM', category: 'Vegetables', image: 'https://images.unsplash.com/photo-1598170845058-32b9d6a5da37?w=400&q=80' },
  { id: 'cabbage', name: 'Green Cabbage', price: 35.00, size: '1 PC', category: 'Vegetables', image: 'https://images.unsplash.com/photo-1594282486552-05b4d80fbb9f?w=400&q=80' },
  { id: 'cauliflower', name: 'Cauliflower', price: 42.00, size: '1 PC', category: 'Vegetables', image: 'https://images.unsplash.com/photo-1568584711271-6ec8e8a9d39a?w=400&q=80' },
  { id: 'spinach', name: 'Fresh Spinach', price: 25.00, size: '250 GM', category: 'Vegetables', image: 'https://images.unsplash.com/photo-1576045057995-568f588f82fb?w=400&q=80' },
  { id: 'cucumber', name: 'Cucumber', price: 36.00, size: '500 GM', category: 'Vegetables', image: 'https://images.unsplash.com/photo-1589621316382-008455b857cd?w=400&q=80' },
  { id: 'capsicum', name: 'Green Capsicum', price: 42.00, size: '500 GM', category: 'Vegetables', image: 'https://images.unsplash.com/photo-1563565375-f3fdfdbefa83?w=400&q=80' },
  { id: 'broccoli', name: 'Fresh Broccoli', price: 55.00, size: '500 GM', category: 'Vegetables', image: 'https://images.unsplash.com/photo-1459411621453-7b03977f4bfc?w=400&q=80' },
  { id: 'beans', name: 'Green Beans', price: 40.00, size: '500 GM', category: 'Vegetables', image: 'https://images.unsplash.com/photo-1610348725531-843dff563e2c?w=400&q=80' },
  { id: 'beetroot', name: 'Fresh Beetroot', price: 44.00, size: '500 GM', category: 'Vegetables', image: 'https://images.unsplash.com/photo-1599807875674-4982d8223b92?w=400&q=80' },
  { id: 'peas', name: 'Green Peas', price: 50.00, size: '500 GM', category: 'Vegetables', image: 'https://images.unsplash.com/photo-1587735243615-c03f25aaff15?w=400&q=80' },
  { id: 'eggplant', name: 'Eggplant (Brinjal)', price: 38.00, size: '500 GM', category: 'Vegetables', image: 'https://images.unsplash.com/photo-1618643824458-a4949a609b10?w=400&q=80' },
  { id: 'okra', name: 'Okra (Ladyfinger)', price: 45.00, size: '500 GM', category: 'Vegetables', image: 'https://images.unsplash.com/photo-1626200419199-391ae4be7a41?w=400&q=80' },
  { id: 'radish', name: 'White Radish', price: 30.00, size: '500 GM', category: 'Vegetables', image: 'https://images.unsplash.com/photo-1616684398170-1155566a6c87?w=400&q=80' },
  { id: 'lettuce', name: 'Fresh Lettuce', price: 35.00, size: '1 PC', category: 'Vegetables', image: 'https://images.unsplash.com/photo-1622206151226-18ca2c9ab4a1?w=400&q=80' },
  { id: 'mushroom', name: 'Button Mushroom', price: 80.00, size: '200 GM', category: 'Vegetables', image: 'https://images.unsplash.com/photo-1565969190283-48f9fad28f49?w=400&q=80' },
  { id: 'pumpkin', name: 'Fresh Pumpkin', price: 38.00, size: '1 KG', category: 'Vegetables', image: 'https://images.unsplash.com/photo-1570586437263-ab629fccc818?w=400&q=80' },
  { id: 'corn', name: 'Sweet Corn', price: 50.00, size: '2 PCS', category: 'Vegetables', image: 'https://images.unsplash.com/photo-1551754655-cd27e38d2076?w=400&q=80' },

  // Baby Care
  { id: 'baby-diapers', name: 'Baby Diapers (Medium)', price: 450.00, size: '46 PCS', category: 'Baby Care', image: 'https://www.bbassets.com/media/uploads/p/l/40359022_1-mamypoko-all-night-absorb-disposable-baby-diaper-medium-ideal-for-7-12-kg.jpg' },
  { id: 'baby-wipes', name: 'Baby Wet Wipes', price: 120.00, size: '80 PCS', category: 'Baby Care', image: 'https://www.jiomart.com/images/product/original/492393012/little-s-soft-cleansing-baby-wipes-with-lid-80-pcs-product-images-o492393012-p590628682-0-202403271729.jpg?im=Resize=(1000,1000)' },
  { id: 'baby-lotion', name: 'Baby Body Lotion', price: 180.00, size: '200 ML', category: 'Baby Care', image: 'https://www.planethealth.in/image/cache/catalog/34289-600x315.jpg' },
  { id: 'baby-shampoo', name: 'Gentle Baby Shampoo', price: 220.00, size: '200 ML', category: 'Baby Care', image: 'https://tiimg.tistatic.com/fp/1/007/517/200ml-himalayas-gentle-baby-shampoo-for-nourishes-soften-the-hair-with-no-tears-139.jpg' },
  { id: 'baby-soap', name: 'Mild Baby Soap', price: 45.00, size: '125 GM', category: 'Baby Care', image: 'https://www.clickoncare.com/cdn/shop/files/4_3b591577-9065-4590-b330-735fabd69be9.jpg?v=1716378231&width=416' },
  { id: 'baby-powder', name: 'Baby Powder', price: 140.00, size: '200 GM', category: 'Baby Care', image: 'https://kiranamarket.com/wp-content/uploads/2020/09/8901138831561.jpg' },
  { id: 'baby-oil', name: 'Nourishing Baby Oil', price: 160.00, size: '200 ML', category: 'Baby Care', image: 'https://images.apollo247.in/pub/media/catalog/product/d/a/dab0363_1.jpg?tr=q-80,f-webp,w-400,dpr-3,c-at_max%20400w' },
  { id: 'baby-cream', name: 'Baby Moisturizing Cream', price: 150.00, size: '100 GM', category: 'Baby Care', image: 'https://assets.myntassets.com/h_1440,q_75,w_1080/v1/assets/images/2025/OCTOBER/3/FibTYvUI_8148804ae377406b853f8b0ffb4a3bc8.jpg' },
  { id: 'baby-wash', name: 'Baby Body Wash', price: 200.00, size: '200 ML', category: 'Baby Care', image: 'https://cdn01.pharmeasy.in/dam/products_otc/C60330/equalstwo-two-in-one-baby-body-wash-200-ml-2-1754374571.jpg?dim=400x0&dpr=1&q=100' },
  { id: 'feeding-bottle', name: 'Baby Feeding Bottle', price: 180.00, size: '250 ML', category: 'Baby Care', image: 'https://breeze-media.vega.co.in/media/catalog/product/cache/1ef41c8834aa6b772f4686b0f4051c34/1/a/1a.webp' },
  { id: 'baby-toothbrush', name: 'Baby Toothbrush', price: 60.00, size: '1 PC', category: 'Baby Care', image: 'https://www.hopop.in/cdn/shop/files/1a_3_ae49e52a-0b8f-430d-ba1c-8bda992a8be7_600x.jpg?v=1765884225' },
  { id: 'baby-toothpaste', name: 'Baby Toothpaste', price: 80.00, size: '50 GM', category: 'Baby Care', image: 'https://images.mamaearth.in/catalog/product/f/d/fds_3318_egp6w22wfajlmuvb.jpg?format=auto&height=600' },
  { id: 'baby-towel', name: 'Soft Baby Towel', price: 250.00, size: '1 PC', category: 'Baby Care', image: 'https://www.jiomart.com/images/product/original/rvhja84e4h/the-little-lookers-blue-soft-cotton-baby-towel-60-cm-x-105-cm-product-images-orvhja84e4h-p590823253-2-202206301025.jpg?im=Resize=(420,420)' },
  { id: 'baby-blanket', name: 'Cozy Baby Blanket', price: 450.00, size: '1 PC', category: 'Baby Care', image: 'https://m.media-amazon.com/images/I/61H2fby1zVL._AC_UF894,1000_QL80_.jpg' },
  { id: 'diaper-rash', name: 'Diaper Rash Cream', price: 180.00, size: '100 GM', category: 'Baby Care', image: 'https://5.imimg.com/data5/SELLER/Default/2024/1/374115993/VW/UD/JD/208062795/diaper-rash-cream-500x500.png' },

  // Atta, Rice & Grains
  { id: 'basmati-rice', name: 'Basmati Rice', price: 320.00, size: '5 KG', category: 'Atta, Rice & Grains', image: 'https://instamart-media-assets.swiggy.com/swiggy/image/upload/fl_lossy,f_auto,q_auto/NI_CATALOG/IMAGES/ciw/2025/12/16/6054ec58-81e3-4508-bb25-0a80b809f68c_FK0ND8FKBK_MN_16122025.png' },
  { id: 'brown-rice', name: 'Brown Rice', price: 180.00, size: '2 KG', category: 'Atta, Rice & Grains', image: 'https://5.imimg.com/data5/SELLER/Default/2024/7/434211797/YS/GU/FY/29891919/1-500x500.jpg' },
  { id: 'wheat-flour', name: 'Whole Wheat Flour', price: 280.00, size: '5 KG', category: 'Atta, Rice & Grains', image: 'https://5.imimg.com/data5/SELLER/Default/2021/7/EQ/AA/AY/6428050/5-kg-wheat-flour-500x500.jpeg' },
  { id: 'multigrain-atta', name: 'Multigrain Atta', price: 340.00, size: '5 KG', category: 'Atta, Rice & Grains', image: 'https://cdn.grofers.com/da/cms-assets/cms/product/b0c9edcf-ac79-4f25-9657-1362bdfbc9ad.jpg' },
  { id: 'maida', name: 'Maida (All Purpose Flour)', price: 60.00, size: '1 KG', category: 'Atta, Rice & Grains', image: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSC_7G56_PVTwsalVbNehnBMAtt_yMJbwdaTw&s' },
  { id: 'suji', name: 'Suji (Semolina)', price: 70.00, size: '1 KG', category: 'Atta, Rice & Grains', image: 'https://instamart-media-assets.swiggy.com/swiggy/image/upload/fl_lossy,f_auto,q_auto,h_600/NI_CATALOG/IMAGES/ciw/2025/12/16/e4349e6b-609a-4449-8cfa-8bbf25de840b_Y5Y0WQDWKK_MN_15122025.png' },
  { id: 'oats', name: 'Rolled Oats', price: 160.00, size: '1 KG', category: 'Atta, Rice & Grains', image: 'https://m.media-amazon.com/images/I/81Rvu+8RBeL._AC_UF350,350_QL80_.jpg' },
  { id: 'quinoa', name: 'Organic Quinoa', price: 380.00, size: '500 GM', category: 'Atta, Rice & Grains', image: 'https://m.media-amazon.com/images/I/71E4CU4lfYL.jpg' },

  // Oil & Ghee
  { id: 'mustard-oil', name: 'Pure Mustard Oil', price: 180.00, size: '1 L', category: 'Oil & Ghee', image: 'https://images.unsplash.com/photo-1608571423902-eed4a5ad8108?w=400&q=80' },
  { id: 'sunflower-oil', name: 'Sunflower Oil', price: 220.00, size: '1 L', category: 'Oil & Ghee', image: 'https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?w=400&q=80' },
  { id: 'olive-oil', name: 'Extra Virgin Olive Oil', price: 650.00, size: '500 ML', category: 'Oil & Ghee', image: 'https://m.media-amazon.com/images/I/41Bctmy3w6L.jpg' },
  { id: 'coconut-oil', name: 'Pure Coconut Oil', price: 240.00, size: '1 L', category: 'Oil & Ghee', image: 'https://instamart-media-assets.swiggy.com/swiggy/image/upload/fl_lossy,f_auto,q_auto/NI_CATALOG/IMAGES/ciw/2026/2/11/85f159ae-8792-4298-9122-db1d1781454a_FFCI48AN55_MN_11022026.png' },
  { id: 'groundnut-oil', name: 'Groundnut Oil', price: 200.00, size: '1 L', category: 'Oil & Ghee', image: 'https://m.media-amazon.com/images/I/61wz8dFQJTL.jpg' },
  { id: 'rice-bran-oil', name: 'Rice Bran Oil', price: 190.00, size: '1 L', category: 'Oil & Ghee', image: 'https://harikeshri.com/cdn/shop/files/Frame23.png?v=1765290818&width=1000' },
  { id: 'sesame-oil', name: 'Cold Pressed Sesame Oil', price: 280.00, size: '500 ML', category: 'Oil & Ghee', image: 'https://cpimg.tistatic.com/06482463/b/4/500-ML-Cold-Pressed-Sesame-Oil.jpg' },
  { id: 'cow-ghee', name: 'Pure Cow Ghee', price: 580.00, size: '1 L', category: 'Oil & Ghee', image: 'https://5.imimg.com/data5/SELLER/Default/2023/6/313563824/FI/AF/GP/105805471/pure-cow-ghee.jpg' },
  { id: 'buffalo-ghee', name: 'Buffalo Ghee', price: 520.00, size: '1 L', category: 'Oil & Ghee', image: 'https://kasutam.com/cdn/shop/files/17091307416107743_large.webp?v=1735123501' },
  { id: 'organic-ghee', name: 'Organic Cow Ghee', price: 720.00, size: '1 L', category: 'Oil & Ghee', image: 'https://5.imimg.com/data5/SELLER/Default/2025/10/552600697/NA/TN/HC/79373812/desi-cow-ghee-250x250.png' },
  { id: 'refined-oil', name: 'Refined Cooking Oil', price: 160.00, size: '1 L', category: 'Oil & Ghee', image: 'https://content.jdmagicbox.com/quickquotes/images_main/cookwell-refined-soyabean-oil-1-litre-bottle-2025720430-i05ckoeu.jpg?impolicy=queryparam&im=Resize=(360,360),aspect=fit' },
  { id: 'cold-pressed-oil', name: 'Cold Pressed Mustard Oil', price: 220.00, size: '1 L', category: 'Oil & Ghee', image: 'https://5.imimg.com/data5/SELLER/Default/2025/7/524400544/SY/QS/ZC/143892393/500ml-taishiraj-mustard-oil-250x250.jpg' },
  { id: 'cooking-oil-combo', name: 'Cooking Oil Combo Pack', price: 380.00, size: '2 L', category: 'Oil & Ghee', image: 'https://www.jiomart.com/images/product/original/rvz3apzb5t/jivo-canola-oil-mustard-oil-and-sunflower-oil-2-ltr-each-combo-product-images-orvz3apzb5t-p593482109-0-202210261301.jpg?im=Resize=(420,420)' },
  { id: 'pure-desi-ghee', name: 'Pure Desi Ghee', price: 550.00, size: '1 L', category: 'Oil & Ghee', image: 'https://5.imimg.com/data5/ANDROID/Default/2020/12/EP/UA/LY/53310506/img-20201112-wa0001-jpg.jpg' },
  { id: 'premium-olive-oil', name: 'Premium Olive Oil', price: 580.00, size: '500 ML', category: 'Oil & Ghee', image: 'https://5.imimg.com/data5/SELLER/Default/2025/3/493719401/XF/CB/CK/237080793/500-ml-purete-extra-light-olive-oil.jpg' },
  { id: 'extra-virgin-olive', name: 'Italian Extra Virgin Olive Oil', price: 750.00, size: '500 ML', category: 'Oil & Ghee', image: 'https://cdn.grofers.com/da/cms-assets/cms/product/667f402b-e7c4-4c6a-b30c-8e71189298ce.jpg' },
  { id: 'palm-oil', name: 'Palm Oil', price: 140.00, size: '1 L', category: 'Oil & Ghee', image: 'https://m.media-amazon.com/images/I/61APit0of7L.jpg_BO30,255,255,255_UF750,750_SR1910,1000,0,C_QL100_.jpg' },
  { id: 'vegetable-oil', name: 'Vegetable Cooking Oil', price: 150.00, size: '1 L', category: 'Oil & Ghee', image: 'https://5.imimg.com/data5/SELLER/Default/2026/1/576276808/ST/JT/EX/241004939/customer-choice-vegetable-oil-250x250.png' },
  { id: 'herbal-oil', name: 'Herbal Hair Oil', price: 120.00, size: '200 ML', category: 'Oil & Ghee', image: 'https://noyyalgogreen.in/wp-content/uploads/2024/04/77.jpg' },
  { id: 'cooking-oil-pack', name: 'Family Cooking Oil Pack', price: 450.00, size: '5 L', category: 'Oil & Ghee', image: 'https://www.jiomart.com/images/product/original/rvo2fdfng7/jivo-canola-cold-press-oil-healthiest-cooking-oil-5-ltr-product-images-orvo2fdfng7-p591500094-0-202210171934.jpg?im=Resize=(420,420)' },

  // Milk & Dairy
  { id: 'milk', name: 'Fresh Milk', price: 55.00, size: '1 L', category: 'Milk & Dairy', image: 'https://images.unsplash.com/photo-1563636619-e9143da7973b?w=400&q=80' },
  { id: 'toned-milk', name: 'Toned Milk', price: 52.00, size: '1 L', category: 'Milk & Dairy', image: 'https://images.unsplash.com/photo-1550583724-b2692b85b150?w=400&q=80' },
  { id: 'full-cream-milk', name: 'Full Cream Milk', price: 60.00, size: '1 L', category: 'Milk & Dairy', image: 'https://images.unsplash.com/photo-1563636619-e9143da7973b?w=400&q=80' },
  { id: 'butter', name: 'Unsalted Butter', price: 95.00, size: '200 GM', category: 'Milk & Dairy', image: 'https://images.unsplash.com/photo-1589985270826-4b7bb135bc9d?w=400&q=80' },
  { id: 'paneer', name: 'Fresh Paneer', price: 85.00, size: '200 GM', category: 'Milk & Dairy', image: 'https://m.media-amazon.com/images/I/51Rk1mu9IlL.jpg_BO30,255,255,255_UF750,750_SR1910,1000,0,C_QL100_.jpg' },
  { id: 'cheese-slices', name: 'Cheese Slices', price: 120.00, size: '200 GM', category: 'Milk & Dairy', image: 'https://images.unsplash.com/photo-1618164436241-4473940d1f5c?w=400&q=80' },
  { id: 'cheese-block', name: 'Cheddar Cheese Block', price: 240.00, size: '500 GM', category: 'Milk & Dairy', image: 'https://www.bananablue.com.au/images/product/9300639618227_1.jpg?cb=1723011555' },
  { id: 'curd', name: 'Fresh Curd', price: 40.00, size: '500 GM', category: 'Milk & Dairy', image: 'https://5.imimg.com/data5/FQ/WF/KO/SELLER-47304508/001.jpg' },
  { id: 'yogurt', name: 'Greek Yogurt', price: 60.00, size: '400 GM', category: 'Milk & Dairy', image: 'https://cdn.grofers.com/cdn-cgi/image/f=auto,fit=scale-down,q=70,metadata=none,w=270/da/cms-assets/cms/product/e73a7dd1-2660-4397-9a4f-29a1ec2bf95d.png' },
  { id: 'lassi', name: 'Sweet Lassi', price: 35.00, size: '200 ML', category: 'Milk & Dairy', image: 'https://cdn.grofers.com/cdn-cgi/image/f=auto,fit=scale-down,q=70,metadata=none,w=1080/da/cms-assets/cms/product/e638e020-e8c3-4145-9fb4-be7106880cac.png?bg_token=color.background.quaternary' },
  { id: 'buttermilk', name: 'Fresh Buttermilk', price: 25.00, size: '500 ML', category: 'Milk & Dairy', image: 'https://5.imimg.com/data5/SELLER/Default/2022/3/ID/DS/QY/6688632/butter-milk-400ml-500x500.png' },
  { id: 'cream', name: 'Fresh Cream', price: 70.00, size: '250 ML', category: 'Milk & Dairy', image: 'https://cdn.grofers.com/da/cms-assets/cms/product/47460b56-5545-474a-9582-10814a1fa8b8.jpg' },
  { id: 'condensed-milk', name: 'Condensed Milk', price: 85.00, size: '400 GM', category: 'Milk & Dairy', image: 'https://m.media-amazon.com/images/I/71CE0VUaGmL.jpg' },
  { id: 'milk-powder', name: 'Milk Powder', price: 320.00, size: '1 KG', category: 'Milk & Dairy', image: 'https://m.media-amazon.com/images/I/71fwfzc-iSL.jpg' },
  { id: 'flavoured-milk', name: 'Chocolate Flavoured Milk', price: 30.00, size: '200 ML', category: 'Milk & Dairy', image: 'https://m.media-amazon.com/images/I/61qXgSCscGL.jpg' },
 
  // Chips & Biscuits
  { id: 'potato-chips', name: 'Salted Potato Chips', price: 20.00, size: '50 GM', category: 'Chips & Biscuits', image: 'https://images.unsplash.com/photo-1566478989037-eec170784d0b?w=400&q=80' },
  { id: 'nachos', name: 'Cheese Nachos', price: 35.00, size: '100 GM', category: 'Chips & Biscuits', image: 'https://cdn.grofers.com/cdn-cgi/image/f=auto,fit=scale-down,q=70,metadata=none,w=1080/da/cms-assets/cms/product/729792bc-f395-4569-ab7d-42829daf5f94.png?bg_token=color.background.quaternary' },
  { id: 'cream-biscuits', name: 'Cream Biscuits', price: 30.00, size: '100 GM', category: 'Chips & Biscuits', image: 'https://www.bbassets.com/media/uploads/p/l/40135739_1-cremica-cream-biscuit-premium-chocolate.jpg' },
  { id: 'chocolate-biscuits', name: 'Chocolate Biscuits', price: 40.00, size: '150 GM', category: 'Chips & Biscuits', image: 'https://www.jiomart.com/images/product/original/491935066/mayora-malkist-chocolate-cracker-biscuits-144-g-product-images-o491935066-p590126711-0-202306091435.jpg?im=Resize=(420,420)' },
  { id: 'butter-cookies', name: 'Butter Cookies', price: 55.00, size: '200 GM', category: 'Chips & Biscuits', image: 'https://5.imimg.com/data5/ON/UR/MX/SELLER-16699599/parle-20-20-cashew-biscuits-500x500.jpg' },
  { id: 'oat-biscuits', name: 'Healthy Oat Biscuits', price: 45.00, size: '150 GM', category: 'Chips & Biscuits', image: 'https://haribansha.com/wp-content/uploads/2025/06/Britannia-Nutri-Choice-Cookies-Oats-Biscuits-150-gm-Carton.webp' },
  { id: 'salted-chips', name: 'Plain Salted Chips', price: 20.00, size: '50 GM', category: 'Chips & Biscuits', image: 'https://5.imimg.com/data5/SELLER/Default/2021/3/WK/YT/QN/63039086/new-product.jpeg' },
  { id: 'banana-chips', name: 'Crispy Banana Chips', price: 30.00, size: '100 GM', category: 'Chips & Biscuits', image: 'https://instamart-media-assets.swiggy.com/swiggy/image/upload/fl_lossy,f_auto,q_auto/NI_CATALOG/IMAGES/ciw/2025/12/18/db61a3f7-7e64-4cd4-b0f1-81ec7f4aa777_0863A1MJWN_MN_17122025.png' },
  { id: 'masala-chips', name: 'Spicy Masala Chips', price: 20.00, size: '50 GM', category: 'Chips & Biscuits', image: 'https://cdn.grofers.com/da/cms-assets/cms/product/8e5438e8-e529-4053-bd0a-06674fb8394a.jpg' },
  { id: 'crackers', name: 'Salted Crackers', price: 40.00, size: '150 GM', category: 'Chips & Biscuits', image: 'https://goraieb.com/wp-content/uploads/2023/10/croco-1.jpg' },
  { id: 'digestive-biscuits', name: 'Digestive Biscuits', price: 45.00, size: '200 GM', category: 'Chips & Biscuits', image: 'https://www.jiomart.com/images/product/original/491551732/mcvitie-s-digestive-biscuits-value-pack-200-g-product-images-o491551732-p491551732-0-202305241859.jpg?im=Resize=(1000,1000)' },
  { id: 'marie-biscuits', name: 'Classic Marie Biscuits', price: 25.00, size: '100 GM', category: 'Chips & Biscuits', image: 'https://cdn.grofers.com/da/cms-assets/cms/product/85df4e16-b296-487f-b5db-0f11651708be.jpg' },
  { id: 'chocolate-cookies', name: 'Choco Chip Cookies', price: 60.00, size: '150 GM', category: 'Chips & Biscuits', image: 'https://m.media-amazon.com/images/I/71Z9F1riMUL.jpg' },
  { id: 'wafer-rolls', name: 'Chocolate Wafer Rolls', price: 35.00, size: '100 GM', category: 'Chips & Biscuits', image: 'https://m.media-amazon.com/images/I/61vJzZipZcL.jpg_BO30,255,255,255_UF750,750_SR1910,1000,0,C_QL100_.jpg' },
  { id: 'snack-mix', name: 'Assorted Snack Mix', price: 50.00, size: '200 GM', category: 'Chips & Biscuits', image: 'https://eatanytime.in/cdn/shop/files/ActivityBoosterTMFront.png?v=1760451794&width=1946' },
 
  // Bath & Body
  { id: 'body-wash', name: 'Moisturizing Body Wash', price: 180.00, size: '200 ML', category: 'Bath & Body', image: 'https://www.clinikally.com/cdn/shop/products/Moisturexwash200ml.jpg?v=1676098775&width=1000' },
  { id: 'soap-bar', name: 'Herbal Soap Bar', price: 35.00, size: '125 GM', category: 'Bath & Body', image: 'https://m.media-amazon.com/images/I/819p4biJ0ML._AC_UF350,350_QL80_.jpg' },
  { id: 'face-wash', name: 'Deep Cleansing Face Wash', price: 150.00, size: '100 ML', category: 'Bath & Body', image: 'https://atomicpharmacy.in/cdn/shop/files/washac-deep-cleansing-face-wash-154382.jpg?v=1755265199' },
  { id: 'body-lotion', name: 'Nourishing Body Lotion', price: 200.00, size: '200 ML', category: 'Bath & Body', image: 'https://assets.myntassets.com/assets/images/2274009/2018/4/17/11523955566788-Nivea-Cocoa-Nourish-Oil-in-Lotion-Body-Lotion-For-Very-Dry-Skin-200-ml-2761523955566633-1.jpg' },
  { id: 'hand-wash', name: 'Liquid Hand Wash', price: 120.00, size: '250 ML', category: 'Bath & Body', image: 'https://m.m53msedia-amazon.com/images/I/51xlJmANl+L.jpg_BO30,255,255,255_UF750,750_SR1910,1000,0,C_QL100_.jpg' },
  { id: 'shampoo', name: 'Natural Hair Shampoo', price: 250.00, size: '200 ML', category: 'Bath & Body', image: 'https://cpimg.tistatic.com/6639871/b/1/200-ml-hair-shine-shampoo.jpg' },
  { id: 'conditioner', name: 'Hair Conditioner', price: 220.00, size: '200 ML', category: 'Bath & Body', image: 'https://www.thedravyastore.com/cdn/shop/files/CONDITIONER.jpg?v=1719760199&width=3840' },
  { id: 'shower-gel', name: 'Refreshing Shower Gel', price: 220.00, size: '250 ML', category: 'Bath & Body', image: 'https://mavenspick.com/cdn/shop/files/avel0090.jpg?v=1754911044' },
  { id: 'bath-soap-pack', name: 'Bath Soap Pack (3 pcs)', price: 90.00, size: '375 GM', category: 'Bath & Body', image: 'https://images.meesho.com/images/products/563848665/utscu_512.webp?width=512' },
  { id: 'herbal-soap', name: 'Ayurvedic Herbal Soap', price: 45.00, size: '125 GM', category: 'Bath & Body', image: 'https://i0.wp.com/www.amariapharmacy.in/wp-content/uploads/2018/05/Ambery-Herbal-Soap-for-acne-pimples-blemishes-e1633264060697.jpeg?fit=700%2C846&ssl=1' },
  { id: 'moisturizer', name: 'Daily Moisturizer Cream', price: 280.00, size: '100 GM', category: 'Bath & Body', image: 'https://www.clinikally.com/cdn/shop/files/150gmDailymoiztEverydayMoisturiserCream1.jpg?v=1771497133&width=1024' },
  { id: 'face-cleanser', name: 'Gentle Face Cleanser', price: 160.00, size: '150 ML', category: 'Bath & Body', image: 'https://cdn.grofers.com/cdn-cgi/image/f=auto,fit=scale-down,q=70,metadata=none,w=1080/da/cms-assets/cms/product/rc-upload-1771992965724-2664.png?bg_token=color.background.quaternary' },
  { id: 'body-scrub', name: 'Exfoliating Body Scrub', price: 320.00, size: '200 GM', category: 'Bath & Body', image: 'https://www.jiomart.com/images/product/original/1128358/be-bodywise-10-aha-body-scrub-for-even-skin-texture-200-gm-prod-1128358-0-202405271546.jpg?im=Resize=(600,600)' },
  { id: 'bath-oil', name: 'Aromatherapy Bath Oil', price: 380.00, size: '100 ML', category: 'Bath & Body', image: 'https://m.media-amazon.com/images/I/611qDfFQsdL.jpg' },
  { id: 'charcoal-soap', name: 'Activated Charcoal Soap', price: 55.00, size: '125 GM', category: 'Bath & Body', image: 'https://rukminim2.flixcart.com/image/480/640/xif0q/soap/v/f/a/charcoal-soap-for-face-and-body-125-gm-pack-of-1-7elwa-original-imagp6n4cvcjfzfu.jpeg?q=90' },
  
  // Soap & Detergents
  { id: 'laundry-detergent', name: 'Laundry Detergent Powder', price: 280.00, size: '2 KG', category: 'Soap & Detergents', image: 'https://cdn.grofers.com/cdn-cgi/image/f=auto,fit=scale-down,q=70,metadata=none,w=270/da/cms-assets/cms/product/e2048b30-b5d0-4d8a-afa2-72dbdff0d4a9.png' },
  { id: 'detergent-powder', name: 'Premium Detergent Powder', price: 320.00, size: '3 KG', category: 'Soap & Detergents', image: 'https://images.jdmagicbox.com/quickquotes/images_main/mtc0ndcwntu3mq-1744705571-vop2uwd5.jpg' },
  { id: 'detergent-liquid', name: 'Liquid Detergent', price: 240.00, size: '1 L', category: 'Soap & Detergents', image: 'https://5.imimg.com/data5/AB/FR/LG/SELLER-63867408/1-litre-liquid-detergent.jpg' },
  { id: 'washing-bar', name: 'Washing Bar Soap', price: 45.00, size: '250 GM', category: 'Soap & Detergents', image: 'https://5.imimg.com/data5/SELLER/Default/2022/9/OM/KO/XQ/51128674/surf-excel-washing-bar-250-g.jpg' },
  { id: 'dish-wash-liquid', name: 'Dishwash Liquid', price: 120.00, size: '500 ML', category: 'Soap & Detergents', image: 'https://www.jiomart.com/images/product/original/rv59oybnwz/ayushmi-care-plus-dishwash-liquid-500ml-product-images-orv59oybnwz-p612552810-0-202509271818.jpg?im=Resize=(420,420)' },
  { id: 'dish-wash-bar', name: 'Dishwash Bar', price: 15.00, size: '200 GM', category: 'Soap & Detergents', image: 'https://m.media-amazon.com/images/I/612JAc-iJyL.jpg' },
  { id: 'floor-cleaner', name: 'Floor Cleaner Liquid', price: 160.00, size: '1 L', category: 'Soap & Detergents', image: 'https://tbn-prod-assets.s3.ap-south-1.amazonaws.com/PRODUCT_NEW/PRODUCT_104494009.jpeg' },
  { id: 'toilet-cleaner', name: 'Toilet Bowl Cleaner', price: 95.00, size: '500 ML', category: 'Soap & Detergents', image: 'https://rinser.in/wp-content/uploads/2024/09/toilet-1.jpg' },
  { id: 'fabric-softener', name: 'Fabric Softener', price: 180.00, size: '1 L', category: 'Soap & Detergents', image: 'https://www.bbassets.com/media/uploads/p/xl/40308595_1-soft-fresh-fabric-conditioner-softener-after-wash-freshness-burst-pink-coral.jpg' },
  { id: 'stain-remover', name: 'Stain Remover Spray', price: 140.00, size: '500 ML', category: 'Soap & Detergents', image: 'https://www.choice.com.au/wp-content/uploads/2025/11/sard-super-power-stain-remover-toughest-stains.jpg' },
  { id: 'cleaning-powder', name: 'Surface Cleaning Powder', price: 85.00, size: '500 GM', category: 'Soap & Detergents', image: 'https://5.imimg.com/data5/NH/XV/MY-77460870/dish-wash-cleaning-powder-500x500.jpg' },
  { id: 'glass-cleaner', name: 'Glass & Window Cleaner', price: 110.00, size: '500 ML', category: 'Soap & Detergents', image: 'https://cdn.grofers.com/cdn-cgi/image/f=auto,fit=scale-down,q=70,metadata=none,w=1080/da/cms-assets/cms/product/48b2c0a8-73c2-4b28-86b1-ccc79eda8e17.png?bg_token=color.background.quaternary' },
  { id: 'surface-cleaner', name: 'Multipurpose Surface Cleaner', price: 130.00, size: '500 ML', category: 'Soap & Detergents', image: 'https://m.media-amazon.com/images/I/41dbVKcEi8L.jpg_BO30,255,255,255_UF750,750_SR1910,1000,0,C_QL100_.jpg' },
  { id: 'kitchen-cleaner', name: 'Kitchen Grease Cleaner', price: 125.00, size: '500 ML', category: 'Soap & Detergents', image: 'https://gokhaleherbals.com/wp-content/uploads/2018/06/Kitchen-Cleaner-Product-Image.png' },
  { id: 'hand-wash-liquid', name: 'Hand Wash Liquid Refill', price: 90.00, size: '500 ML', category: 'Soap & Detergents', image: 'https://www.hotpackwebstore.com/cdn/shop/files/500-ml-soft-n-cool-liquid-hand-wash-317142.jpg?v=1770017776' },
  
  // Pooja Essentials
  { id: 'incense-sticks', name: 'Fragrant Incense Sticks', price: 45.00, size: '100 GM', category: 'Pooja Essentials', image: 'https://scentingsecrets.com/cdn/shop/files/Shirin_Gold.jpg?v=1733397279' },
  { id: 'dhoop-sticks', name: 'Pure Dhoop Sticks', price: 50.00, size: '50 GM', category: 'Pooja Essentials', image: 'https://sugandhlok.com/cdn/shop/files/PureChandan_Withsticks.jpg?v=1690366939&width=1946' },
  { id: 'camphor', name: 'Pure Camphor Tablets', price: 40.00, size: '100 GM', category: 'Pooja Essentials', image: 'https://www.jiomart.com/images/product/original/rvakfsqmph/fragrance-of-virtue-100-pure-camphor-100-gram-each-kapoor-tablet-pack-of-2-product-images-orvakfsqmph-p611393140-1-202505050101.jpg?im=Resize=(420,420)' },
  { id: 'cotton-wicks', name: 'Cotton Wicks (Batti)', price: 25.00, size: '100 PCS', category: 'Pooja Essentials', image: 'https://www.mystore.in/s/62ea2c599d1398fa16dbae0a/g/684a7cf4e0fe15dde2a1c54a/chatgpt-image-jun-12-2025-12_33_23-pm.png' },
  { id: 'ghee-diya', name: 'Ghee Diya Set', price: 120.00, size: '12 PCS', category: 'Pooja Essentials', image: 'https://giri.in/cdn/shop/files/42500312_Giri_Pure_Ghee_Diya_Champa_50_pcs_02_700x700.webp?v=1717073380' },
  { id: 'pooja-thali', name: 'Brass Pooja Thali', price: 450.00, size: '1 PC', category: 'Pooja Essentials', image: 'https://www.rasoishop.com/cdn/shop/files/BOROPUJA.jpg?v=1727343781' },
  { id: 'kumkum', name: 'Pure Kumkum Powder', price: 30.00, size: '50 GM', category: 'Pooja Essentials', image: 'https://cycle.in/cdn/shop/products/Kumkum-vermilion_657747f7-2f02-4204-8ea5-cb00d352d6eb.jpg?v=1754992870' },
  { id: 'chandan-powder', name: 'Sandalwood (Chandan) Powder', price: 85.00, size: '50 GM', category: 'Pooja Essentials', image: 'https://m.media-amazon.com/images/I/61HAAqBlRdL._AC_UF894,1000_QL80_.jpg' },
  { id: 'pooja-oil', name: 'Pooja Lamp Oil', price: 60.00, size: '500 ML', category: 'Pooja Essentials', image: 'https://cdn.grofers.com/cdn-cgi/image/f=auto,fit=scale-down,q=70,metadata=none,w=1080/da/cms-assets/cms/product/51a25204-fa6d-42c9-a40b-f2616fbc2ea6.png?bg_token=color.background.quaternary' },
  { id: 'agarbatti-pack', name: 'Premium Agarbatti Pack', price: 120.00, size: '200 GM', category: 'Pooja Essentials', image: 'https://rukminim2.flixcart.com/image/480/640/xif0q/incense-stick/m/6/i/image-premium-agarbatti-set-of-12-packs-14g-charcoal-free-original-imahgueh58ydjjxr.jpeg?q=90' },
 
  // Beverages
  { id: 'bev-green-tea', name: 'Organic Green Tea', price: 180.00, size: '100 GM', category: 'Beverages', image: 'https://m.media-amazon.com/images/I/51hakthbY5L.jpg' },
  { id: 'bev-assam-tea', name: 'Assam Black Tea', price: 160.00, size: '250 GM', category: 'Beverages', image: 'https://m.media-amazon.com/images/I/616PxfMr18L.jpg' },
  { id: 'bev-instant-coffee', name: 'Instant Coffee', price: 220.00, size: '200 GM', category: 'Beverages', image: 'https://images.meesho.com/images/products/231894071/jxb3y_512.webp?width=512' },
  { id: 'bev-coffee-beans', name: 'Premium Coffee Beans', price: 420.00, size: '500 GM', category: 'Beverages', image: 'https://5.imimg.com/data5/SELLER/Default/2023/7/323142990/AR/TZ/MX/28292928/500g-coffee-day-cafe-intenso.webp' },
  { id: 'bev-coconut-water', name: 'Natural Coconut Water', price: 60.00, size: '200 ML', category: 'Beverages', image: 'https://cdn.grofers.com/cdn-cgi/image/f=auto,fit=scale-down,q=70,metadata=none,w=1080/da/cms-assets/cms/product/a1d9d409-0438-463d-8e13-6366acca23a0.png?bg_token=color.background.quaternary' },
  { id: 'bev-mango-juice', name: 'Mango Juice', price: 80.00, size: '1 L', category: 'Beverages', image: 'https://images.jdmagicbox.com/quickquotes/images_main/maaza-mango-juice-2217014100-yy82xvtl.jpg' },
  { id: 'bev-orange-juice', name: 'Orange Juice', price: 90.00, size: '1 L', category: 'Beverages', image: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSvEGmhXNmcQbI9oDQszMPY0_9C_tnac4e1MA&s' },
  { id: 'bev-lemonade', name: 'Classic Lemonade', price: 55.00, size: '500 ML', category: 'Beverages', image: 'https://m.media-amazon.com/images/I/51Au3PKGPnL._AC_UF350,350_QL80_.jpg' },
  { id: 'bev-masala-chai', name: 'Masala Chai Premix', price: 140.00, size: '200 GM', category: 'Beverages', image: 'https://m.media-amazon.com/images/I/51jsZXsxBxL.jpg' },
  { id: 'bev-herbal-tea', name: 'Herbal Tea Blend', price: 210.00, size: '100 GM', category: 'Beverages', image: 'https://www.dawnlee.in/wp-content/uploads/2023/07/Herbal-Tea-1.webp' },
  
  // Dry Fruits & Nuts
  { id: 'dry-almonds', name: 'Premium Almonds', price: 520.00, size: '500 GM', category: 'Dry Fruits & Nuts', image: 'https://content.jdmagicbox.com/quickquotes/images_main/salted-almonds-500g-802858403-r4jdal2w.jpg?impolicy=queryparam&im=Resize=(360,360),aspect=fit' },
  { id: 'dry-cashews', name: 'Whole Cashews', price: 680.00, size: '500 GM', category: 'Dry Fruits & Nuts', image: 'https://5.imimg.com/data5/ECOM/Default/2025/7/523761425/VY/MP/VW/114136878/large-images-jpeg-8f38fe8a-c9d0-4e9d-92e6-c3618555f388jpgts1713777271-32404d1c-cb3a-46cb-974d-1a2986.jpg' },
  { id: 'dry-walnuts', name: 'Walnuts', price: 760.00, size: '500 GM', category: 'Dry Fruits & Nuts', image: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQG25B5HNaetTwquBziZrH39-GiiKRl7Z4LaA&s' },
  { id: 'dry-pistachios', name: 'Pistachios', price: 820.00, size: '500 GM', category: 'Dry Fruits & Nuts', image: 'https://m.media-amazon.com/images/I/71NKbSA25aL.jpg' },
  { id: 'dry-raisins', name: 'Raisins (Kishmish)', price: 260.00, size: '500 GM', category: 'Dry Fruits & Nuts', image: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRgnZLtBuKzlrKDlhQNi4h9ntvVIimmmPGNhg&s' },
  { id: 'dry-dates', name: 'Dates (Khajoor)', price: 340.00, size: '500 GM', category: 'Dry Fruits & Nuts', image: 'https://www.jiomart.com/images/product/original/rvym15pgvg/chatokde-yellow-dry-dates-sukha-khajoor-chuhara-500gm-product-images-orvym15pgvg-p605759531-0-202512170035.png?im=Resize=(420,420)' },
  { id: 'dry-figs', name: 'Dried Figs (Anjeer)', price: 620.00, size: '250 GM', category: 'Dry Fruits & Nuts', image: 'https://images-eu.ssl-images-amazon.com/images/I/71SveqJ2P2L._AC_UL495_SR435,495_.jpg' },
  { id: 'dry-apricots', name: 'Dried Apricots', price: 580.00, size: '250 GM', category: 'Dry Fruits & Nuts', image: 'https://2020dryfruits.com/wp-content/uploads/2022/04/APRICOT-ROYAL-250-img-1.webp' },
  { id: 'dry-peanuts', name: 'Roasted Peanuts', price: 120.00, size: '500 GM', category: 'Dry Fruits & Nuts', image: 'https://5.imimg.com/data5/QP/UQ/MY-468492/60000541-roasted-peanuts-plain-200g-front-500x500.jpg' },
  { id: 'dry-makhana', name: 'Makhana (Fox Nuts)', price: 210.00, size: '250 GM', category: 'Dry Fruits & Nuts', image: 'https://www.jiomart.com/images/product/original/rvllhvn1kh/kwality-eat-premium-phool-makhana-250g-jumbo-size-fox-nut-product-images-orvllhvn1kh-p611196669-0-202503241316.png?im=Resize=(420,420)' },
  
  // Fruits & Vegetables (Combined)
  { id: 'tomato', name: 'Fresh Tomato', price: 32.00, size: '500 GM', category: 'Fruits & Vegetables', image: 'https://images.unsplash.com/photo-1592924357228-91a4daadcfea?w=400&q=80' },
  { id: 'potato', name: 'Organic Potato', price: 50.00, size: '1 KG', category: 'Fruits & Vegetables', image: 'https://images.unsplash.com/photo-1518977676601-b53f82aba655?w=400&q=80' },
  { id: 'onion', name: 'Red Onion', price: 52.00, size: '1 KG', category: 'Fruits & Vegetables', image: 'https://images.unsplash.com/photo-1618512496248-a07fe83aa8cb?w=400&q=80' },
  { id: 'banana', name: 'Fresh Banana', price: 60.00, size: '1 DOZEN', category: 'Fruits & Vegetables', image: 'https://images.unsplash.com/photo-1603833665858-e61d17a86224?w=400&q=80' },
  { id: 'apple', name: 'Red Apple', price: 180.00, size: '1 KG', category: 'Fruits & Vegetables', image: 'https://images.unsplash.com/photo-1560806887-1e4cd0b6cbd6?w=400&q=80' },
  { id: 'mango', name: 'Alphonso Mango', price: 210.00, size: '1 KG', category: 'Fruits & Vegetables', image: 'https://images.unsplash.com/photo-1605440846964-c6297a046b0c?w=400&q=80' },
  { id: 'papaya', name: 'Fresh Papaya', price: 45.00, size: '1 PC', category: 'Fruits & Vegetables', image: 'https://images.unsplash.com/photo-1617112848923-cc2234396a8d?w=400&q=80' },
  { id: 'carrot', name: 'Fresh Carrot', price: 48.00, size: '500 GM', category: 'Fruits & Vegetables', image: 'https://images.unsplash.com/photo-1598170845058-32b9d6a5da37?w=400&q=80' },
  { id: 'cabbage', name: 'Green Cabbage', price: 35.00, size: '1 PC', category: 'Fruits & Vegetables', image: 'https://images.unsplash.com/photo-1594282486552-05b4d80fbb9f?w=400&q=80' },
  { id: 'cauliflower', name: 'Cauliflower', price: 42.00, size: '1 PC', category: 'Fruits & Vegetables', image: 'https://images.unsplash.com/photo-1568584711271-6ec8e8a9d39a?w=400&q=80' },
  { id: 'spinach', name: 'Fresh Spinach', price: 25.00, size: '250 GM', category: 'Fruits & Vegetables', image: 'https://images.unsplash.com/photo-1576045057995-568f588f82fb?w=400&q=80' },
  { id: 'cucumber', name: 'Cucumber', price: 36.00, size: '500 GM', category: 'Fruits & Vegetables', image: 'https://images.unsplash.com/photo-1589621316382-008455b857cd?w=400&q=80' },
  { id: 'capsicum', name: 'Green Capsicum', price: 42.00, size: '500 GM', category: 'Fruits & Vegetables', image: 'https://images.unsplash.com/photo-1563911302283-d2bc129e7570?w=400&q=80' },
  { id: 'lemon', name: 'Fresh Lemon', price: 28.00, size: '250 GM', category: 'Fruits & Vegetables', image: 'https://images.unsplash.com/photo-1590502593747-42a996133562?w=400&q=80' },
  { id: 'pumpkin', name: 'Pumpkin', price: 38.00, size: '1 KG', category: 'Fruits & Vegetables', image: 'https://images.unsplash.com/photo-1570586437263-ab629fccc818?w=400&q=80' },
  { id: 'broccoli', name: 'Fresh Broccoli', price: 55.00, size: '500 GM', category: 'Fruits & Vegetables', image: 'https://images.unsplash.com/photo-1459411621453-7b03977f4bfc?w=400&q=80' },
  { id: 'beans', name: 'Green Beans', price: 40.00, size: '500 GM', category: 'Fruits & Vegetables', image: 'https://images.unsplash.com/photo-1610348725531-843dff563e2c?w=400&q=80' },
  { id: 'beetroot', name: 'Fresh Beetroot', price: 44.00, size: '500 GM', category: 'Fruits & Vegetables', image: 'https://images.unsplash.com/photo-1599807875674-4982d8223b92?w=400&q=80' },
  { id: 'peas', name: 'Green Peas', price: 50.00, size: '500 GM', category: 'Fruits & Vegetables', image: 'https://images.unsplash.com/photo-1587735243615-c03f25aaff15?w=400&q=80' },
  { id: 'garlic', name: 'Fresh Garlic', price: 120.00, size: '250 GM', category: 'Fruits & Vegetables', image: 'https://images.unsplash.com/photo-1599228874005-6d0c7463c92e?w=400&q=80' },
]

/**
 * Get products by category
 * @param {string} category - Category name to filter by
 * @returns {Array} Filtered products array
 */
export function getProductsByCategory(category) {
  if (!category) return allProducts
  return allProducts.filter(product => product.category === category)
}

/**
 * Get all products
 * @returns {Array} All products
 */
export function getAllProducts() {
  return allProducts
}

/**
 * Get product by ID
 * @param {string} id - Product ID
 * @returns {Object|undefined} Product object or undefined
 */
export function getProductById(id) {
  return allProducts.find(product => product.id === id)
}

export default allProducts
