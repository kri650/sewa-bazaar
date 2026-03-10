import React, { useState } from 'react'

export default function FilterBar({ onFilterChange, className = '' }) {
  const [selectedSort, setSelectedSort] = useState('popularity')
  const [selectedRating, setSelectedRating] = useState(null)
  const [priceRange, setPriceRange] = useState('all')
  const [selectedBrand, setSelectedBrand] = useState('all')

  const handleSortChange = (sortType) => {
    setSelectedSort(sortType)
    if (onFilterChange) {
      onFilterChange({ sort: sortType, rating: selectedRating, priceRange, brand: selectedBrand })
    }
  }

  const handleRatingChange = (rating) => {
    setSelectedRating(rating === selectedRating ? null : rating)
    if (onFilterChange) {
      onFilterChange({ sort: selectedSort, rating: rating === selectedRating ? null : rating, priceRange, brand: selectedBrand })
    }
  }

  const handlePriceChange = (range) => {
    setPriceRange(range)
    if (onFilterChange) {
      onFilterChange({ sort: selectedSort, rating: selectedRating, priceRange: range, brand: selectedBrand })
    }
  }

  const handleBrandChange = (brand) => {
    setSelectedBrand(brand)
    if (onFilterChange) {
      onFilterChange({ sort: selectedSort, rating: selectedRating, priceRange, brand })
    }
  }

  return (
    <div className={`filterBarContainer ${className}`}>
      <aside className="filterSidebar">
        <div className="filterSection">
          <h3 className="filterSectionTitle">Sort By</h3>
          <div className="filterOptions">
            <label className="filterOption">
              <input
                type="radio"
                name="sort"
                value="popularity"
                checked={selectedSort === 'popularity'}
                onChange={() => handleSortChange('popularity')}
              />
              <span>Most Purchased</span>
            </label>
            <label className="filterOption">
              <input
                type="radio"
                name="sort"
                value="price-low"
                checked={selectedSort === 'price-low'}
                onChange={() => handleSortChange('price-low')}
              />
              <span>Price: Low to High</span>
            </label>
            <label className="filterOption">
              <input
                type="radio"
                name="sort"
                value="price-high"
                checked={selectedSort === 'price-high'}
                onChange={() => handleSortChange('price-high')}
              />
              <span>Price: High to Low</span>
            </label>
            <label className="filterOption">
              <input
                type="radio"
                name="sort"
                value="discount"
                checked={selectedSort === 'discount'}
                onChange={() => handleSortChange('discount')}
              />
              <span>Discount</span>
            </label>
          </div>
        </div>

        <div className="filterSection">
          <h3 className="filterSectionTitle">Rating</h3>
          <div className="filterOptions">
            {[4, 3, 2, 1].map(rating => (
              <label key={rating} className="filterOption">
                <input
                  type="checkbox"
                  checked={selectedRating === rating}
                  onChange={() => handleRatingChange(rating)}
                />
                <span className="ratingLabel">
                  {rating}★ & above
                </span>
              </label>
            ))}
          </div>
        </div>

        <div className="filterSection">
          <h3 className="filterSectionTitle">Price Range</h3>
          <div className="filterOptions">
            <label className="filterOption">
              <input
                type="radio"
                name="price"
                value="all"
                checked={priceRange === 'all'}
                onChange={() => handlePriceChange('all')}
              />
              <span>All</span>
            </label>
            <label className="filterOption">
              <input
                type="radio"
                name="price"
                value="0-50"
                checked={priceRange === '0-50'}
                onChange={() => handlePriceChange('0-50')}
              />
              <span>Under ₹50</span>
            </label>
            <label className="filterOption">
              <input
                type="radio"
                name="price"
                value="50-100"
                checked={priceRange === '50-100'}
                onChange={() => handlePriceChange('50-100')}
              />
              <span>₹50 - ₹100</span>
            </label>
            <label className="filterOption">
              <input
                type="radio"
                name="price"
                value="100-200"
                checked={priceRange === '100-200'}
                onChange={() => handlePriceChange('100-200')}
              />
              <span>₹100 - ₹200</span>
            </label>
            <label className="filterOption">
              <input
                type="radio"
                name="price"
                value="200+"
                checked={priceRange === '200+'}
                onChange={() => handlePriceChange('200+')}
              />
              <span>₹200 & above</span>
            </label>
          </div>
        </div>

        <div className="filterSection">
          <h3 className="filterSectionTitle">Brand</h3>
          <div className="filterOptions">
            <label className="filterOption">
              <input
                type="radio"
                name="brand"
                value="all"
                checked={selectedBrand === 'all'}
                onChange={() => handleBrandChange('all')}
              />
              <span>All</span>
            </label>
            <label className="filterOption">
              <input
                type="radio"
                name="brand"
                value="Fresho"
                checked={selectedBrand === 'Fresho'}
                onChange={() => handleBrandChange('Fresho')}
              />
              <span>Fresho</span>
            </label>
            <label className="filterOption">
              <input
                type="radio"
                name="brand"
                value="Nature's Best"
                checked={selectedBrand === "Nature's Best"}
                onChange={() => handleBrandChange("Nature's Best")}
              />
              <span>Nature&apos;s Best</span>
            </label>
            <label className="filterOption">
              <input
                type="radio"
                name="brand"
                value="Farm Fresh"
                checked={selectedBrand === 'Farm Fresh'}
                onChange={() => handleBrandChange('Farm Fresh')}
              />
              <span>Farm Fresh</span>
            </label>
          </div>
        </div>
      </aside>

      <style jsx>{`
        .filterBarContainer {
          width: 100%;
        }

        .filterSidebar {
          background: #fff;
          border: 1px solid #e0e0e0;
          border-radius: 8px;
          padding: 16px;
          position: sticky;
          top: 20px;
          margin-right: auto;
        }

        .filterSection {
          margin-bottom: 24px;
          padding-bottom: 24px;
          border-bottom: 1px solid #e0e0e0;
        }

        .filterSection:last-child {
          margin-bottom: 0;
          padding-bottom: 0;
          border-bottom: none;
        }

        .filterSectionTitle {
          font-size: 1rem;
          font-weight: 600;
          margin: 0 0 16px 0;
          color: #333;
        }

        .filterOptions {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .filterOption {
          display: flex;
          align-items: center;
          gap: 10px;
          cursor: pointer;
          font-size: 0.95rem;
          color: #555;
        }

        .filterOption input[type="radio"],
        .filterOption input[type="checkbox"] {
          cursor: pointer;
          width: 18px;
          height: 18px;
        }

        .filterOption:hover {
          color: #2e7d32;
        }

        .ratingLabel {
          color: #555;
        }

        @media (max-width: 768px) {
          .filterSidebar {
            position: static;
          }
        }
      `}</style>
    </div>
  )
}
