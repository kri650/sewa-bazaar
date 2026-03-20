const DEFAULT_PRODUCT_IMAGE = '/product-images/grocery.svg'

const toText = (value) => (value == null ? '' : String(value))
const normalize = (value) => toText(value).toLowerCase()

const includesAny = (haystack, needles) => needles.some((needle) => haystack.includes(needle))

const isLikelyRemote = (src) => {
  const value = toText(src).trim().toLowerCase()
  return value.startsWith('http://') || value.startsWith('https://') || value.startsWith('data:')
}

const isPublicPath = (src) => {
  const value = toText(src).trim()
  return value.startsWith('/') && !value.startsWith('//') && !value.startsWith('/_next')
}

export function resolveProductImage({ name, category, image } = {}) {
  const src = toText(image).trim()

  // If the data already provides a local public asset (and it's not the old missing /images/* set), prefer it.
  if (src && isPublicPath(src) && !src.startsWith('/images/')) return src
  // If the data provides a remote/data URL, use it directly.
  if (src && isLikelyRemote(src)) return src

  const haystack = `${normalize(name)} ${normalize(category)}`.trim()

  // Baby care
  if (includesAny(haystack, ['baby', 'diaper', 'nappy', 'wipes', 'formula', 'powder', 'feeding', 'pacifier'])) {
    return '/product-images/baby.svg'
  }

  // Pooja essentials
  if (
    includesAny(haystack, [
      'pooja',
      'puja',
      'agarbatti',
      'incense',
      'dhoop',
      'camphor',
      'kapoor',
      'diya',
      'kumkum',
      'rangoli',
      'havansamagri',
      'havan',
    ])
  ) {
    return '/product-images/pooja.svg'
  }

  // Milk & dairy
  if (includesAny(haystack, ['milk', 'dairy', 'curd', 'dahi', 'paneer', 'cheese', 'butter', 'yogurt', 'lassi', 'cream'])) {
    return '/product-images/dairy.svg'
  }

  // Beverages
  if (includesAny(haystack, ['beverage', 'juice', 'tea', 'coffee', 'soft drink', 'soda', 'cola', 'energy drink', 'drink'])) {
    return '/product-images/beverages.svg'
  }

  // Oil & ghee
  if (includesAny(haystack, ['oil', 'ghee', 'olive', 'mustard oil', 'sunflower', 'groundnut', 'coconut oil'])) {
    return '/product-images/oil.svg'
  }

  // Grains / staples
  if (includesAny(haystack, ['atta', 'flour', 'wheat', 'rice', 'basmati', 'dal', 'lentil', 'gram', 'sooji', 'rava', 'poha', 'oats'])) {
    return '/product-images/grains.svg'
  }

  // Snacks
  if (includesAny(haystack, ['snack', 'chips', 'biscuit', 'cookie', 'namkeen', 'crackers', 'bhujia', 'chocolate'])) {
    return '/product-images/snacks.svg'
  }

  // Cleaning / detergents
  if (includesAny(haystack, ['detergent', 'soap', 'dishwash', 'floor', 'cleaner', 'phenyl', 'toilet', 'laundry'])) {
    return '/product-images/cleaning.svg'
  }

  // Personal care / bath & body
  if (includesAny(haystack, ['shampoo', 'conditioner', 'body', 'bath', 'lotion', 'cream', 'deodorant', 'facewash', 'toothpaste', 'toothbrush'])) {
    return '/product-images/personal-care.svg'
  }

  // Fruits
  if (
    includesAny(haystack, [
      'fruit',
      'apple',
      'banana',
      'orange',
      'mango',
      'grape',
      'guava',
      'pineapple',
      'kiwi',
      'papaya',
      'watermelon',
      'pomegranate',
      'melon',
      'strawberry',
      'cherry',
      'pear',
      'peach',
      'plum',
      'nectarine',
      'avocado',
    ])
  ) {
    return '/product-images/fruits.svg'
  }

  // Vegetables
  if (
    includesAny(haystack, [
      'vegetable',
      'tomato',
      'potato',
      'onion',
      'carrot',
      'cucumber',
      'capsicum',
      'okra',
      'lady finger',
      'spinach',
      'cabbage',
      'cauliflower',
      'gourd',
      'pumpkin',
      'beetroot',
      'brinjal',
      'eggplant',
      'beans',
      'broccoli',
      'methi',
      'coriander',
      'mint',
      'dill',
      'lemongrass',
    ])
  ) {
    return '/product-images/vegetables.svg'
  }

  // Combos / bundles
  if (includesAny(haystack, ['combo', 'basket', 'value pack', 'bundle'])) {
    return '/product-images/combos.svg'
  }

  return DEFAULT_PRODUCT_IMAGE
}

export { DEFAULT_PRODUCT_IMAGE }
