/**
 * Shared product catalogue — imports directly from each category page
 * so images, prices and names are always in sync with the website.
 */
import { products as regularVegs }     from '../pages/vegetables/regular-vegetables'
import { products as leafyVegs }        from '../pages/vegetables/leafy-vegetables'
import { products as rootVegs }         from '../pages/root-vegetables'
import { products as seasonalProds }    from '../pages/seasonal-special'
import { products as hydroponicProds }  from '../pages/hydroponic-vegetables'
import { fruitProducts }                from '../pages/fruits/index'
import { exoticProducts }               from '../pages/exotic-fruits/index'
import { organicSpecials }              from '../pages/organic-specials'
import { fruitBaskets }                 from '../pages/fruit-baskets'
import { farmFreshProducts }            from '../pages/farm-fresh-picks'

const tag = (arr, category, prefix) =>
  (arr || []).map((p, i) => ({ ...p, id: `${prefix}-${p.id ?? i}`, category: p.category || category }))

export const allProducts = [
  ...tag(regularVegs,      'Regular Vegetables',   'rv'),
  ...tag(leafyVegs,        'Leafy Vegetables',     'lv'),
  ...tag(rootVegs,         'Root Vegetables',      'rt'),
  ...tag(seasonalProds,    'Seasonal Specials',    'ss'),
  ...tag(hydroponicProds,  'Hydroponic Veggies',   'hv'),
  ...tag(fruitProducts,    'Fruits',               'fr'),
  ...tag(exoticProducts,   'Exotic Fruits',        'ef'),
  ...tag(organicSpecials,  'Organic Specials',     'os'),
  ...tag(fruitBaskets,     'Fruit Baskets',        'fb'),
  ...tag(farmFreshProducts,'Farm Fresh Picks',     'ff'),
]

export default allProducts
