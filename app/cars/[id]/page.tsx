"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Image from "next/image";
import { Heart, MapPin, Users, Zap, Shield, Clock } from "lucide-react";

interface Car {
  id: number;
  name: string;
  image: string;
  price: number;
  rating: number;
  reviews: number;
  features: string[];
  description?: string;
  specs?: {
    transmission: string;
    fuelType: string;
    seats: number;
    luggage: number;
  };
}

const CARS_DATA: Record<number, Car> = {
  1: {
    id: 1,
    name: "Tesla Model 3",
    image: "https://images.unsplash.com/photo-1560958089-b8a63dd8b50b?w=800&h=600&fit=crop",
    price: 89,
    rating: 4.9,
    reviews: 256,
    features: ["Electric", "Auto", "GPS"],
    description: "Experience the future of driving with the Tesla Model 3. Featuring cutting-edge electric technology, autopilot capabilities, and premium comfort.",
    specs: {
      transmission: "Automatic",
      fuelType: "Electric",
      seats: 5,
      luggage: 425,
    },
  },
  2: {
    id: 2,
    name: "BMW 3 Series",
    image: "https://images.unsplash.com/photo-1552820728-8ac41f1ce891?w=800&h=600&fit=crop",
    price: 79,
    rating: 4.8,
    reviews: 189,
    features: ["Luxury", "Auto", "AC"],
    description: "The BMW 3 Series combines luxury with performance. Enjoy premium leather interiors, advanced safety features, and smooth handling.",
    specs: {
      transmission: "Automatic",
      fuelType: "Petrol",
      seats: 5,
      luggage: 480,
    },
  },
  3: {
    id: 3,
    name: "Mercedes C-Class",
    image: "https://images.unsplash.com/photo-1553882900-f2b06423ff54?w=800&h=600&fit=crop",
    price: 99,
    rating: 4.9,
    reviews: 312,
    features: ["Premium", "Auto", "Leather"],
    description: "Elegance meets performance in the Mercedes C-Class. Experience German engineering with premium materials and state-of-the-art technology.",
    specs: {
      transmission: "Automatic",
      fuelType: "Petrol",
      seats: 5,
      luggage: 430,
    },
  },
  4: {
    id: 4,
    name: "Audi A4",
    image: "https://images.unsplash.com/photo-1606611013016-969c19d4a42f?w=800&h=600&fit=crop",
    price: 85,
    rating: 4.7,
    reviews: 145,
    features: ["Sporty", "Auto", "GPS"],
    description: "The Audi A4 delivers sporty performance with refined comfort. Featuring Quattro all-wheel drive and premium sound system.",
    specs: {
      transmission: "Automatic",
      fuelType: "Petrol",
      seats: 5,
      luggage: 420,
    },
  },
  5: {
    id: 5,
    name: "Porsche 911",
    image: "https://images.unsplash.com/photo-1503376780353-7e6692767b70?w=800&h=600&fit=crop",
    price: 199,
    rating: 5.0,
    reviews: 89,
    features: ["Sports", "Manual", "Premium"],
    description: "The iconic Porsche 911 offers thrilling performance and timeless design. Perfect for those seeking an unforgettable driving experience.",
    specs: {
      transmission: "Manual",
      fuelType: "Petrol",
      seats: 2,
      luggage: 280,
    },
  },
  6: {
    id: 6,
    name: "Range Rover",
    image: "https://images.unsplash.com/photo-1606611013016-969c19d4a42f?w=800&h=600&fit=crop",
    price: 149,
    rating: 4.8,
    reviews: 201,
    features: ["SUV", "Auto", "4WD"],
    description: "The Range Rover combines luxury with capability. Featuring advanced terrain response and premium comfort for any adventure.",
    specs: {
      transmission: "Automatic",
      fuelType: "Petrol",
      seats: 7,
      luggage: 900,
    },
  },
};

export default function CarDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [car, setCar] = useState<Car | null>(null);
  const [loading, setLoading] = useState(true);
  const [isFavorite, setIsFavorite] = useState(false);

  useEffect(() => {
    const carId = parseInt(params.id as string);
    const carData = CARS_DATA[carId];

    if (carData) {
      setCar(carData);
    }
    setLoading(false);
  }, [params.id]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0B0B0B] flex items-center justify-center">
        <div className="text-white">Loading...</div>
      </div>
    );
  }

  if (!car) {
    return (
      <div className="min-h-screen bg-[#0B0B0B] flex flex-col items-center justify-center">
        <h1 className="text-3xl font-bold text-white mb-4">Car Not Found</h1>
        <button
          onClick={() => router.back()}
          className="px-6 py-2 rounded-lg bg-gradient-to-r from-cyan-500 to-blue-500 text-white font-semibold hover:shadow-lg hover:shadow-cyan-500/50 transition-all"
        >
          Go Back
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0B0B0B]">
      {/* Header */}
      <div className="bg-gradient-to-b from-[#1a1a2e] to-[#0B0B0B] border-b border-white/5 py-6">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between">
          <button
            onClick={() => router.back()}
            className="text-gray-400 hover:text-white transition-colors"
          >
            ← Back
          </button>
          <h1 className="text-3xl font-bold text-white">{car.name}</h1>
          <button
            onClick={() => setIsFavorite(!isFavorite)}
            className="p-2 rounded-full bg-white/5 hover:bg-white/10 transition-colors"
          >
            <Heart
              size={24}
              className={`transition-colors ${
                isFavorite ? "fill-red-500 text-red-500" : "text-white"
              }`}
            />
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Image and Details */}
          <div className="lg:col-span-2 space-y-6">
            {/* Main Image */}
            <div className="relative w-full h-96 rounded-2xl overflow-hidden border border-white/5">
              <Image
                src={car.image}
                alt={car.name}
                fill
                className="object-cover"
              />
            </div>

            {/* Description */}
            <div className="bg-[#1a1a2e] rounded-2xl border border-white/5 p-6">
              <h2 className="text-xl font-bold text-white mb-4">About</h2>
              <p className="text-gray-400 leading-relaxed">
                {car.description || "Premium vehicle with excellent features and comfort."}
              </p>
            </div>

            {/* Specifications */}
            <div className="bg-[#1a1a2e] rounded-2xl border border-white/5 p-6">
              <h2 className="text-xl font-bold text-white mb-6">Specifications</h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="flex flex-col items-center p-4 bg-white/5 rounded-lg">
                  <Zap size={24} className="text-cyan-400 mb-2" />
                  <p className="text-gray-400 text-sm">Transmission</p>
                  <p className="text-white font-semibold text-center">
                    {car.specs?.transmission || "Auto"}
                  </p>
                </div>
                <div className="flex flex-col items-center p-4 bg-white/5 rounded-lg">
                  <Zap size={24} className="text-cyan-400 mb-2" />
                  <p className="text-gray-400 text-sm">Fuel Type</p>
                  <p className="text-white font-semibold text-center">
                    {car.specs?.fuelType || "Petrol"}
                  </p>
                </div>
                <div className="flex flex-col items-center p-4 bg-white/5 rounded-lg">
                  <Users size={24} className="text-cyan-400 mb-2" />
                  <p className="text-gray-400 text-sm">Seats</p>
                  <p className="text-white font-semibold">
                    {car.specs?.seats || 5}
                  </p>
                </div>
                <div className="flex flex-col items-center p-4 bg-white/5 rounded-lg">
                  <Shield size={24} className="text-cyan-400 mb-2" />
                  <p className="text-gray-400 text-sm">Luggage</p>
                  <p className="text-white font-semibold">
                    {car.specs?.luggage || 400}L
                  </p>
                </div>
              </div>
            </div>

            {/* Features */}
            <div className="bg-[#1a1a2e] rounded-2xl border border-white/5 p-6">
              <h2 className="text-xl font-bold text-white mb-4">Features</h2>
              <div className="flex flex-wrap gap-2">
                {car.features.map((feature) => (
                  <span
                    key={feature}
                    className="px-4 py-2 rounded-full bg-gradient-to-r from-cyan-500/20 to-blue-500/20 text-cyan-400 border border-cyan-500/30"
                  >
                    {feature}
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* Booking Card */}
          <div className="lg:col-span-1">
            <div className="sticky top-8 bg-[#1a1a2e] rounded-2xl border border-white/5 p-6 space-y-6">
              {/* Rating */}
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-400 text-sm">Rating</p>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-yellow-400 text-lg">★</span>
                    <span className="text-white font-bold">{car.rating}</span>
                    <span className="text-gray-400 text-sm">
                      ({car.reviews} reviews)
                    </span>
                  </div>
                </div>
              </div>

              {/* Price */}
              <div className="border-t border-white/5 pt-6">
                <p className="text-gray-400 text-sm mb-2">Price per day</p>
                <div className="flex items-baseline gap-1">
                  <span className="text-4xl font-bold text-white">
                    ${car.price}
                  </span>
                  <span className="text-gray-400">/day</span>
                </div>
              </div>

              {/* Booking Info */}
              <div className="bg-white/5 rounded-lg p-4 space-y-2">
                <div className="flex items-center gap-2 text-gray-400 text-sm">
                  <Clock size={16} />
                  <span>Minimum 1 day rental</span>
                </div>
                <div className="flex items-center gap-2 text-gray-400 text-sm">
                  <Shield size={16} />
                  <span>Full insurance included</span>
                </div>
                <div className="flex items-center gap-2 text-gray-400 text-sm">
                  <MapPin size={16} />
                  <span>Free delivery available</span>
                </div>
              </div>

              {/* CTA Buttons */}
              <div className="space-y-3 pt-4 border-t border-white/5">
                <button
                  onClick={() => router.push(`/book/${car.id}`)}
                  className="w-full px-6 py-3 rounded-lg bg-gradient-to-r from-cyan-500 to-blue-500 text-white font-semibold hover:shadow-lg hover:shadow-cyan-500/50 transition-all"
                >
                  Book Now
                </button>
                <button className="w-full px-6 py-3 rounded-lg border border-white/20 text-white font-semibold hover:bg-white/5 transition-all">
                  Contact Us
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
