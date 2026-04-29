"use client";

import { useEffect, useState } from "react";
import { CarCard } from "@/components/car-card";
import { SkeletonCard } from "@/components/skeleton-card";

interface Car {
  id: number;
  name: string;
  image: string;
  price: number;
  rating: number;
  reviews: number;
  features: string[];
}

export default function CarsPage() {
  const [cars, setCars] = useState<Car[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Simulate API call
    const fetchCars = async () => {
      try {
        // Simulate delay
        await new Promise((resolve) => setTimeout(resolve, 1500));

        // Mock data
        const mockCars: Car[] = [
          {
            id: 1,
            name: "Tesla Model 3",
            image: "https://images.unsplash.com/photo-1617788138017-80ad40651399?auto=format&fit=crop&w=800&q=80",
            price: 89,
            rating: 4.9,
            reviews: 256,
            features: ["Electric", "Auto", "GPS"],
          },
          {
            id: 2,
            name: "BMW 3 Series",
            image: "https://images.unsplash.com/photo-1555215695-3004980ad54e?auto=format&fit=crop&w=800&q=80",
            price: 79,
            rating: 4.8,
            reviews: 189,
            features: ["Luxury", "Auto", "AC"],
          },
          {
            id: 3,
            name: "Mercedes C-Class",
            image: "https://images.unsplash.com/photo-1494905998402-395d579af36f?auto=format&fit=crop&w=800&q=80",
            price: 99,
            rating: 4.9,
            reviews: 312,
            features: ["Premium", "Auto", "Leather"],
          },
          {
            id: 4,
            name: "Audi A4",
            image: "https://images.unsplash.com/photo-1609521263047-f8f205293f24?auto=format&fit=crop&w=800&q=80",
            price: 85,
            rating: 4.7,
            reviews: 145,
            features: ["Sporty", "Auto", "GPS"],
          },
          {
            id: 5,
            name: "Porsche 911",
            image: "https://images.unsplash.com/photo-1503376780353-7e6692767b70?w=500&h=400&fit=crop",
            price: 199,
            rating: 5.0,
            reviews: 89,
            features: ["Sports", "Manual", "Premium"],
          },
          {
            id: 6,
            name: "Range Rover",
            image: "https://images.unsplash.com/photo-1552519507-da3b142c6e3d?auto=format&fit=crop&w=800&q=80",
            price: 149,
            rating: 4.8,
            reviews: 201,
            features: ["SUV", "Auto", "4WD"],
          },
        ];

        setCars(mockCars);
      } catch (error) {
        console.error("Error fetching cars:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchCars();
  }, []);

  return (
    <div className="min-h-screen bg-[#0B0B0B]">
      {/* Header */}
      <div className="bg-gradient-to-b from-[#1a1a2e] to-[#0B0B0B] border-b border-white/5 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
            Premium Car Collection
          </h1>
          <p className="text-gray-400 text-lg">
            Choose from our exclusive fleet of luxury vehicles
          </p>
        </div>
      </div>

      {/* Cars Grid */}
      <div className="w-full px-4 sm:px-6 lg:px-8 py-12">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {loading
            ? // Skeleton loaders
              Array.from({ length: 6 }).map((_, i) => <SkeletonCard key={i} />)
            : // Real cars
              cars.map((car) => (
                <CarCard
                  key={car.id}
                  id={car.id}
                  name={car.name}
                  image={car.image}
                  price={car.price}
                  rating={car.rating}
                  reviews={car.reviews}
                  features={car.features}
                />
              ))}
          </div>
        </div>

        {/* Empty state */}
        {!loading && cars.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-400 text-lg">No cars available</p>
          </div>
        )}
      </div>
    </div>
  );
}
