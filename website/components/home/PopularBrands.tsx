"use client"

type Brand = {
  name: string;
  logo: string;
};

const BRANDS: Brand[] = [
  { name: "Audi", logo: "/logo/audi.jfif" },
  { name: "BMW", logo: "/logo/bmw.png" },
  { name: "Kia", logo: "/logo/kia.png" },
  { name: "Lamborghini", logo: "/logo/lamborghini.jfif" },
  { name: "Mercedes", logo: "/logo/merceds.jfif" },
  { name: "Mustang", logo: "/logo/mustang.png" },
  { name: "Toyota", logo: "/logo/toyoto.jfif" },
];

const BrandCard = ({ brand }: { brand: Brand }) => (
  <a
    href="#"
    className="flex flex-col items-center gap-4 p-6 cursor-pointer"
  >
    <div className="w-20 h-20 rounded-xl flex items-center justify-center bg-gray-50 p-3">
      <img
        src={brand.logo}
        alt={brand.name}
        className="w-full h-full object-contain"
      />
    </div>

    <div className="text-center">
      <h3 className="font-bold text-gray-900 text-base line-clamp-2">
        {brand.name}
      </h3>
    </div>
  </a>
);

export default function PopularBrands() {
  return (
    <section className="bg-gradient-to-b from-white to-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-16">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-8 h-0.5 bg-red-600" />
            <p className="text-xs font-semibold text-red-600 uppercase tracking-widest">Browse Manufacturers</p>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6">
            <div className="flex-1">
              <h2 className="text-4xl sm:text-5xl font-black text-gray-900 mb-3">
                Popular Brands
              </h2>
              <p className="text-gray-600 text-base max-w-lg">
                Explore top manufacturers across {BRANDS.length} brands. Find your perfect car today.
              </p>
            </div>
            <a href="#" className="inline-flex items-center gap-2 text-sm font-semibold text-red-600 cursor-pointer whitespace-nowrap">
              View all brands
              <svg className="w-4 h-4" viewBox="0 0 12 12" fill="none">
                <path d="M2 6h8M8 2l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </a>
          </div>
        </div>

        {/* Brand Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-7 gap-4 sm:gap-5 mb-16">
          {BRANDS.map((brand) => (
            <BrandCard key={brand.name} brand={brand} />
          ))}
        </div>
      </div>
    </section>
  );
}