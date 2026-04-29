"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Image from "next/image";
import { Calendar, Users, MapPin, CreditCard } from "lucide-react";
import Link from "next/link";
import { useAuth } from "@/components/auth-context";

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
    description: "Experience the future of driving with the Tesla Model 3.",
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
    description: "The BMW 3 Series combines luxury with performance.",
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
    description: "Elegance meets performance in the Mercedes C-Class.",
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
    description: "The Audi A4 delivers sporty performance with refined comfort.",
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
    description: "The iconic Porsche 911 offers thrilling performance.",
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
    description: "The Range Rover combines luxury with capability.",
    specs: {
      transmission: "Automatic",
      fuelType: "Petrol",
      seats: 7,
      luggage: 900,
    },
  },
};

export default function BookingPage() {
  const params = useParams();
  const router = useRouter();
  const { isAuthenticated, isLoading: authLoading, user } = useAuth();
  const [car, setCar] = useState<Car | null>(null);
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState({
    pickupDate: "",
    returnDate: "",
    pickupLocation: "",
    returnLocation: "",
  });
  const [days, setDays] = useState(1);
  const [totalPrice, setTotalPrice] = useState(0);
  const [submitted, setSubmitted] = useState(false);
  const [bookingError, setBookingError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const carId = parseInt(params.id as string);
    const carData = CARS_DATA[carId];

    if (carData) {
      setCar(carData);
      setTotalPrice(carData.price);
    }
    setLoading(false);
  }, [params.id]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));

    if (name === "pickupDate" && formData.returnDate) {
      const pickup = new Date(value);
      const returnDate = new Date(formData.returnDate);
      const diffTime = Math.abs(returnDate.getTime() - pickup.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) || 1;
      setDays(diffDays);
      if (car) setTotalPrice(car.price * diffDays);
    }

    if (name === "returnDate" && formData.pickupDate) {
      const pickup = new Date(formData.pickupDate);
      const returnDate = new Date(value);
      const diffTime = Math.abs(returnDate.getTime() - pickup.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) || 1;
      setDays(diffDays);
      if (car) setTotalPrice(car.price * diffDays);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAuthenticated) {
      router.push(`/login?redirect=/book/${params.id as string}`);
      return;
    }
    setBookingError("");
    setSubmitting(true);
    try {
      const res = await fetch("/api/bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          car_id: parseInt(params.id as string),
          pickup_date: formData.pickupDate,
          return_date: formData.returnDate,
          pickup_location: formData.pickupLocation,
          notes: formData.returnLocation ? `Return location: ${formData.returnLocation}` : undefined,
          payment_method: "card",
        }),
      });
      const data = await res.json() as { error?: string };
      if (!res.ok) throw new Error(data.error ?? "Booking failed");
      setSubmitted(true);
    } catch (err) {
      setBookingError(err instanceof Error ? err.message : "Booking failed. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0B0B0B] flex items-center justify-center">
        <div className="text-white">Loading...</div>
      </div>
    );
  }

  if (authLoading) {
    return (
      <div className="min-h-screen bg-[#0B0B0B] flex items-center justify-center">
        <div className="text-white">Checking session…</div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-[#0B0B0B] flex flex-col items-center justify-center gap-6 px-4 text-center">
        <h2 className="text-2xl font-bold text-white">Sign in to book a car</h2>
        <p className="text-gray-400">You need to be logged in to complete a booking.</p>
        <Link
          href={`/login?redirect=/book/${params.id as string}`}
          className="px-8 py-3 rounded-lg bg-gradient-to-r from-cyan-500 to-blue-500 text-white font-semibold hover:shadow-lg hover:shadow-cyan-500/50 transition-all"
        >
          Sign In
        </Link>
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

  if (submitted) {
    return (
      <div className="min-h-screen bg-[#0B0B0B] flex items-center justify-center">
        <div className="text-center px-6">
          <div className="w-20 h-20 rounded-full bg-emerald-500/20 flex items-center justify-center mx-auto mb-6">
            <svg className="w-10 h-10 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h2 className="text-3xl font-bold text-white mb-2">Booking Confirmed!</h2>
          <p className="text-gray-400 mb-1">
            Your booking for <span className="text-cyan-400 font-semibold">{car.name}</span> is confirmed.
          </p>
          <p className="text-gray-400 mb-6">
            Total: <span className="text-white font-bold">${totalPrice}</span>
          </p>
          <button
            onClick={() => router.push("/")}
            className="px-8 py-3 rounded-lg bg-gradient-to-r from-cyan-500 to-blue-500 text-white font-semibold hover:shadow-lg hover:shadow-cyan-500/50 transition-all"
          >
            Back to Home
          </button>
        </div>
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
          <h1 className="text-3xl font-bold text-white">Book {car.name}</h1>
          <div className="w-8"></div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Car Summary */}
          <div className="lg:col-span-1">
            <div className="sticky top-8 bg-[#1a1a2e] rounded-2xl border border-white/5 p-6 space-y-4">
              <div className="relative w-full h-40 rounded-lg overflow-hidden">
                <Image
                  src={car.image}
                  alt={car.name}
                  fill
                  className="object-cover"
                />
              </div>
              <div>
                <h3 className="text-xl font-bold text-white">{car.name}</h3>
                <div className="flex items-center gap-2 mt-2">
                  <span className="text-yellow-400">★</span>
                  <span className="text-white">{car.rating}</span>
                  <span className="text-gray-400 text-sm">({car.reviews})</span>
                </div>
              </div>
              <div className="border-t border-white/5 pt-4">
                <p className="text-gray-400 text-sm mb-2">Price per day</p>
                <p className="text-3xl font-bold text-white">${car.price}</p>
              </div>
              <div className="bg-white/5 rounded-lg p-4">
                <p className="text-gray-400 text-sm mb-2">Rental days</p>
                <p className="text-2xl font-bold text-cyan-400">{days}</p>
              </div>
              <div className="border-t border-white/5 pt-4">
                <p className="text-gray-400 text-sm mb-2">Total price</p>
                <p className="text-3xl font-bold text-white">${totalPrice}</p>
              </div>
            </div>
          </div>

          {/* Booking Form */}
          <div className="lg:col-span-2">
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Dates Section */}
              <div className="bg-[#1a1a2e] rounded-2xl border border-white/5 p-6">
                <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
                  <Calendar size={24} className="text-cyan-400" />
                  Rental Dates
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-gray-400 text-sm mb-2">
                      Pickup Date
                    </label>
                    <input
                      type="date"
                      name="pickupDate"
                      value={formData.pickupDate}
                      onChange={handleInputChange}
                      required
                      className="w-full px-4 py-2 rounded-lg bg-white/5 border border-white/10 text-white placeholder-gray-500 focus:outline-none focus:border-cyan-400"
                    />
                  </div>
                  <div>
                    <label className="block text-gray-400 text-sm mb-2">
                      Return Date
                    </label>
                    <input
                      type="date"
                      name="returnDate"
                      value={formData.returnDate}
                      onChange={handleInputChange}
                      required
                      className="w-full px-4 py-2 rounded-lg bg-white/5 border border-white/10 text-white placeholder-gray-500 focus:outline-none focus:border-cyan-400"
                    />
                  </div>
                </div>
              </div>

              {/* Location Section */}
              <div className="bg-[#1a1a2e] rounded-2xl border border-white/5 p-6">
                <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
                  <MapPin size={24} className="text-cyan-400" />
                  Pickup & Return Location
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-gray-400 text-sm mb-2">
                      Pickup Location
                    </label>
                    <input
                      type="text"
                      name="pickupLocation"
                      value={formData.pickupLocation}
                      onChange={handleInputChange}
                      placeholder="e.g., Sydney Airport"
                      required
                      className="w-full px-4 py-2 rounded-lg bg-white/5 border border-white/10 text-white placeholder-gray-500 focus:outline-none focus:border-cyan-400"
                    />
                  </div>
                  <div>
                    <label className="block text-gray-400 text-sm mb-2">
                      Return Location
                    </label>
                    <input
                      type="text"
                      name="returnLocation"
                      value={formData.returnLocation}
                      onChange={handleInputChange}
                      placeholder="e.g., Sydney Airport"
                      required
                      className="w-full px-4 py-2 rounded-lg bg-white/5 border border-white/10 text-white placeholder-gray-500 focus:outline-none focus:border-cyan-400"
                    />
                  </div>
                </div>
              </div>

              {/* Personal Info Section */}
              <div className="bg-[#1a1a2e] rounded-2xl border border-white/5 p-6">
                <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
                  <Users size={24} className="text-cyan-400" />
                  Personal Information
                </h2>
                <div className="rounded-lg bg-white/5 border border-white/10 px-4 py-3">
                  <p className="text-white font-medium">{user?.name}</p>
                  <p className="text-gray-400 text-sm">{user?.email}</p>
                </div>
              </div>

              {/* Payment Section */}
              <div className="bg-[#1a1a2e] rounded-2xl border border-white/5 p-6">
                <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
                  <CreditCard size={24} className="text-cyan-400" />
                  Payment Summary
                </h2>
                <div className="space-y-3 text-gray-400">
                  <div className="flex justify-between">
                    <span>${car.price} × {days} days</span>
                    <span className="text-white font-semibold">${totalPrice}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Insurance (included)</span>
                    <span className="text-white font-semibold">Free</span>
                  </div>
                  <div className="border-t border-white/5 pt-3 flex justify-between text-lg">
                    <span>Total</span>
                    <span className="text-cyan-400 font-bold">${totalPrice}</span>
                  </div>
                </div>
              </div>

              {/* Submit Button */}
              {bookingError && (
                <div className="rounded-lg bg-rose-500/15 border border-rose-500/30 px-4 py-3 text-rose-300 text-sm">
                  {bookingError}
                </div>
              )}
              <button
                type="submit"
                disabled={submitting}
                className="w-full px-6 py-4 rounded-lg bg-gradient-to-r from-cyan-500 to-blue-500 text-white font-bold text-lg hover:shadow-lg hover:shadow-cyan-500/50 transition-all disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {submitting ? "Confirming…" : "Confirm Booking"}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
