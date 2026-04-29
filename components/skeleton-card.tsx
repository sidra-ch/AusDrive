"use client";

export function SkeletonCard() {
  return (
    <div className="bg-[#1a1a2e] rounded-2xl overflow-hidden border border-white/5 animate-pulse">
      {/* Image skeleton */}
      <div className="w-full h-48 bg-gradient-to-r from-gray-700 via-gray-600 to-gray-700 bg-[length:200%_100%] animate-shimmer" />

      {/* Content skeleton */}
      <div className="p-6 space-y-4">
        {/* Title skeleton */}
        <div className="h-6 bg-gradient-to-r from-gray-700 via-gray-600 to-gray-700 bg-[length:200%_100%] animate-shimmer rounded-lg w-3/4" />

        {/* Price skeleton */}
        <div className="h-5 bg-gradient-to-r from-gray-700 via-gray-600 to-gray-700 bg-[length:200%_100%] animate-shimmer rounded-lg w-1/2" />

        {/* Button skeleton */}
        <div className="h-10 bg-gradient-to-r from-gray-700 via-gray-600 to-gray-700 bg-[length:200%_100%] animate-shimmer rounded-lg w-full mt-4" />
      </div>
    </div>
  );
}

export function SkeletonDashboardCard() {
  return (
    <div className="bg-[#1a1a2e] rounded-2xl border border-white/5 p-6 animate-pulse">
      {/* Header skeleton */}
      <div className="flex items-start justify-between mb-4">
        <div className="space-y-2 flex-1">
          <div className="h-4 bg-gradient-to-r from-gray-700 via-gray-600 to-gray-700 bg-[length:200%_100%] animate-shimmer rounded w-1/3" />
          <div className="h-8 bg-gradient-to-r from-gray-700 via-gray-600 to-gray-700 bg-[length:200%_100%] animate-shimmer rounded w-1/2" />
        </div>
        <div className="w-12 h-12 bg-gradient-to-r from-gray-700 via-gray-600 to-gray-700 bg-[length:200%_100%] animate-shimmer rounded-xl" />
      </div>

      {/* Stats skeleton */}
      <div className="h-4 bg-gradient-to-r from-gray-700 via-gray-600 to-gray-700 bg-[length:200%_100%] animate-shimmer rounded w-2/3" />
    </div>
  );
}

export function SkeletonBookingCard() {
  return (
    <div className="bg-[#1a1a2e] rounded-2xl border border-white/5 p-6 animate-pulse space-y-4">
      {/* Title skeleton */}
      <div className="h-6 bg-gradient-to-r from-gray-700 via-gray-600 to-gray-700 bg-[length:200%_100%] animate-shimmer rounded w-1/2" />

      {/* Details skeleton */}
      <div className="space-y-3">
        <div className="h-4 bg-gradient-to-r from-gray-700 via-gray-600 to-gray-700 bg-[length:200%_100%] animate-shimmer rounded w-full" />
        <div className="h-4 bg-gradient-to-r from-gray-700 via-gray-600 to-gray-700 bg-[length:200%_100%] animate-shimmer rounded w-5/6" />
        <div className="h-4 bg-gradient-to-r from-gray-700 via-gray-600 to-gray-700 bg-[length:200%_100%] animate-shimmer rounded w-4/5" />
      </div>

      {/* Button skeleton */}
      <div className="h-10 bg-gradient-to-r from-gray-700 via-gray-600 to-gray-700 bg-[length:200%_100%] animate-shimmer rounded-lg w-full mt-4" />
    </div>
  );
}
