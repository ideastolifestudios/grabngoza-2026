import React, { useState, useMemo } from 'react';
import { ChevronDown } from 'lucide-react';
import { Product } from '../types';

interface FilterBarProps {
  products: Product[];
  selectedCategory: string;
  onFilterChange: (filtered: Product[]) => void;
}

export default function FilterBar({ products, selectedCategory, onFilterChange }: FilterBarProps) {
  const [sortBy, setSortBy] = useState<string>('featured');
  const [selectedBrand, setSelectedBrand] = useState<string>('all');
  const [selectedPriceRange, setSelectedPriceRange] = useState<string>('all');

  // Extract unique brands dynamically from products
  const availableBrands = useMemo(() => {
    const brands = products.map(p => p.brand).filter(Boolean) as string[];
    return Array.from(new Set(brands));
  }, [products]);

  // Filter and Sort Logic
  const filteredAndSortedProducts = useMemo(() => {
    let result = [...products];

    // 1. Category Filter
    if (selectedCategory && selectedCategory !== 'All') {
      result = result.filter(p => 
        (p.categories || []).includes(selectedCategory) ||
        p.name.toLowerCase().includes(selectedCategory.toLowerCase())
      );
    }

    // 2. Brand Filter
    if (selectedBrand !== 'all') {
      result = result.filter(p => p.brand?.toLowerCase() === selectedBrand.toLowerCase());
    }

    // 3. Price Range Filter (in Cents or Rand based on schema)
    if (selectedPriceRange !== 'all') {
      result = result.filter(p => {
        const priceRands = p.price > 1000 ? p.price / 100 : p.price;
        switch (selectedPriceRange) {
          case 'under-250': return priceRands < 250;
          case '250-500': return priceRands >= 250 && priceRands <= 500;
          case '500-1000': return priceRands > 500 && priceRands <= 1000;
          case 'over-1000': return priceRands > 1000;
          default: return true;
        }
      });
    }

    // 4. Competitor-Grade Sorting
    result.sort((a, b) => {
      const priceA = a.price > 1000 ? a.price / 100 : a.price;
      const priceB = b.price > 1000 ? b.price / 100 : b.price;

      switch (sortBy) {
        case 'price-low':
          return priceA - priceB;
        case 'price-high':
          return priceB - priceA;
        case 'newest':
          return new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime();
        case 'discount':
          return (b.compareAtPrice ? b.compareAtPrice - b.price : 0) - (a.compareAtPrice ? a.compareAtPrice - a.price : 0);
        case 'featured':
        default:
          return 0;
      }
    });

    return result;
  }, [products, selectedCategory, selectedBrand, selectedPriceRange, sortBy]);

  // Pass filtered products back to parent component on change
  React.useEffect(() => {
    onFilterChange(filteredAndSortedProducts);
  }, [filteredAndSortedProducts, onFilterChange]);

  return (
    <div className="w-full bg-white border-b border-gray-100 py-4 px-6 md:px-10 sticky top-[72px] z-30 shadow-sm">
      <div className="max-w-[1800px] mx-auto flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        
        {/* Filter Dropdowns */}
        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
          
          {/* Sort By */}
          <div className="relative">
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="appearance-none bg-gray-50 border border-gray-200 text-black text-xs font-bold uppercase tracking-wider py-2.5 pl-4 pr-10 rounded-full cursor-pointer hover:border-black transition-all outline-none"
            >
              <option value="featured">Sort by: Featured</option>
              <option value="newest">Sort by: What's New</option>
              <option value="price-low">Price: Low to High</option>
              <option value="price-high">Price: High to Low</option>
              <option value="discount">Biggest Discount (% Off)</option>
            </select>
            <ChevronDown size={14} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none" />
          </div>

          {/* Brand Filter */}
          <div className="relative">
            <select
              value={selectedBrand}
              onChange={(e) => setSelectedBrand(e.target.value)}
              className="appearance-none bg-gray-50 border border-gray-200 text-black text-xs font-bold uppercase tracking-wider py-2.5 pl-4 pr-10 rounded-full cursor-pointer hover:border-black transition-all outline-none"
            >
              <option value="all">Brand: All</option>
              {availableBrands.map((brand) => (
                <option key={brand} value={brand}>{brand}</option>
              ))}
            </select>
            <ChevronDown size={14} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none" />
          </div>

          {/* Price Range Filter */}
          <div className="relative">
            <select
              value={selectedPriceRange}
              onChange={(e) => setSelectedPriceRange(e.target.value)}
              className="appearance-none bg-gray-50 border border-gray-200 text-black text-xs font-bold uppercase tracking-wider py-2.5 pl-4 pr-10 rounded-full cursor-pointer hover:border-black transition-all outline-none"
            >
              <option value="all">Price Range: All</option>
              <option value="under-250">Under R250</option>
              <option value="250-500">R250 – R500</option>
              <option value="500-1000">R500 – R1,000</option>
              <option value="over-1000">Over R1,000</option>
            </select>
            <ChevronDown size={14} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none" />
          </div>

        </div>

        {/* Results Counter */}
        <div className="text-xs font-bold tracking-widest text-gray-400 uppercase">
          Showing {filteredAndSortedProducts.length} items
        </div>

      </div>
    </div>
  );
}
