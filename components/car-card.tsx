"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Heart } from "lucide-react";
import { useState } from "react";

interface CarCardProps {
  id: number;
  name: string;
  image: string;
  price: number;
  rating?: number;
  reviews?: number;
  features?: string[];
}

export function CarCard({
  id,
  name,
  image,
  price,
  rating = 4.8,
  reviews = 128,
  features = ["Auto", "AC", "GPS"],
}: CarCardProps) {
  const router = useRouter();
  const [isFavorite, setIsFavorite] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

  const handleBookNow = (e: React.MouseEvent) => {
    e.preventDefault();
    router.push(`/book/${id}`);
  };

  return (
    <Link href={`/cars/${id}`} className="block h-full">
      <div
        className="group h-full bg-[#1a1a2e] rounded-2xl overflow-hidden border border-white/5 hover:border-cyan-400/30 transition-all duration-300 cursor-pointer flex flex-col"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        {/* Image container */}
        <div className="relative w-full h-48 overflow-hidden bg-gradient-to-br from-gray-800 to-gray-900">
          <Image
            src={image}
            alt={name}
            fill
            className={`object-cover transition-transform duration-500 ${
              isHovered ? "scale-110" : "scale-100"
            }`}
          />

          {/* Overlay gradient */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

          {/* Favorite button */}
          <button
            onClick={(e) => {
              e.preventDefault();
              setIsFavorite(!isFavorite);
            }}
            className="absolute top-4 right-4 p-2 rounded-full bg-black/40 backdrop-blur-sm hover:bg-black/60 transition-colors"
          >
            <Heart
              size={20}
              className={`transition-colors ${
                isFavorite ? "fill-red-500 text-red-500" : "text-white"
              }`}
            />
          </button>

          {/* Rating badge */}
          <div className="absolute bottom-4 left-4 flex items-center gap-1 bg-black/60 backdrop-blur-sm px-3 py-1 rounded-full">
            <span className="text-yellow-400 text-sm">★</span>
            <span className="text-white text-sm font-semibold">{rating}</span>
            <span className="text-gray-400 text-xs">({reviews})</span>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4 flex-1 flex flex-col">
          {/* Name */}
          <div>
            <h3 className="text-lg font-bold text-white group-hover:text-cyan-400 transition-colors">
              {name}
            </h3>
          </div>

          {/* Features */}
          <div className="flex gap-2 flex-wrap">
            {features.map((feature) => (
              <span
                key={feature}
                className="text-xs px-2 py-1 rounded-full bg-white/5 text-gray-300 border border-white/10"
              >
                {feature}
              </span>
            ))}
          </div>

          {/* Price and button */}
          <div className="flex items-center justify-between pt-4 border-t border-white/5 mt-auto">
            <div>
              <p className="text-gray-400 text-sm">From</p>
              <p className="text-2xl font-bold text-white">
                ${price}
                <span className="text-sm text-gray-400 font-normal">/day</span>
              </p>
            </div>

            {/* CTA Button */}
            <button
              onClick={handleBookNow}
              className="px-4 py-2 rounded-lg bg-gradient-to-r from-cyan-500 to-blue-500 text-white font-semibold hover:shadow-lg hover:shadow-cyan-500/50 transition-all duration-300 group-hover:scale-105"
            >
              Book Now
            </button>
          </div>
        </div>
      </div>
    </Link>
  );
}
