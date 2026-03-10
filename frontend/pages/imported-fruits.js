"use client";
import React from 'react';
import ShopLayout from '../components/ShopLayout';
import CategoryPage from '../components/CategoryPage';

const importedFruits = [
  { id: 1, name: 'Kiwifruit', price: 199.0, size: '4 pcs', image: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQ6fcc0pIVEhGg_BPG8sdqaxXrXDljtiZYK4A&s' },
  { id: 2, name: 'Persimmon', price: 149.0, size: '4 pcs', image: 'https://cdn.shopify.com/s/files/1/0272/40...' },
  { id: 3, name: 'Pomegranate (Imported)', price: 349.0, size: '1 KG', image: 'https://images.unsplash.com/photo-1435467333723-7b2ca...' },
  { id: 4, name: 'Blueberry (Imported)', price: 599.0, size: '125 GM', image: 'https://images.unsplash.com/photo-1515378791036-0648a3ef77b2' },
];

export default function ImportedFruitsPage() {
  return (
    <ShopLayout>
      <CategoryPage
        title="Imported Fruits"
        description="Premium imported fruits selected for quality and freshness."
        category="Imported Fruits"
        products={importedFruits}
        getRouteId={(product) => `imported-fruit-${product.id}`}
      />
    </ShopLayout>
  );
}