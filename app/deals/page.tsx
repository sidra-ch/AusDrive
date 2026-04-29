"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Heart, ArrowRight, Zap } from "lucide-react";
import { Navbar } from "@/components/shared/navbar";
import { deals } from "@/lib/landing-data";

export default function DealsPage() {
  const router = useRouter();

  function goToBookingFromDeal(dealName: string) {
    const params = new URLSearchParams({
      carType: dealName,
      location: "Sydney",
    });
    router.push(`/book?${params.toString()}`);
  }

  return (
    <div className="min-h-screen bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(120,119,198,0.3),rgba(255,255,255,0))]">
      <Navbar />

      {/* Hero Section */}
      <section className="pt-28 pb-16 md:pt-40 md:pb-24">
        <div className="mx-auto max-w-7xl px-4 md:px-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-center"
          >
            <div className="inline-flex items-center gap-2 rounded-full border border-rose-500/30 bg-rose-500/10 px-4 py-2 text-xs font-semibold text-rose-400 uppercase tracking-wider">
              <Zap className="h-4 w-4" />
              Hot Deals — Limited Time
            </div>
            <h1 className="mt-6 text-5xl font-bold text-white md:text-6xl lg:text-7xl">
              Save on Premium Vehicles
            </h1>
            <p className="mt-4 text-lg text-white/50 md:text-xl max-w-2xl mx-auto">
              Unbeatable discounts on our most popular cars. Book before they&apos;re gone.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Deals Grid */}
      <section className="pb-24 md:pb-32">
        <div className="mx-auto max-w-7xl px-4 md:px-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {deals.map((deal, index) => (
              <motion.article
                key={`${deal.name}-${index}`}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.08 }}
                whileHover={{ y: -8 }}
                className="group overflow-hidden rounded-3xl border border-white/10 bg-white/5 backdrop-blur-xl hover:border-violet-500/40 transition-all duration-300"
              >
                {/* Image Section */}
                <div className="relative h-56 overflow-hidden">
                  <Image
                    src={deal.image}
                    alt={deal.name}
                    fill
                    className="object-cover group-hover:scale-110 transition-transform duration-500"
                    sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />

                  {/* Discount Badge */}
                  <motion.div
                    initial={{ scale: 0.8, opacity: 0 }}
                    whileInView={{ scale: 1, opacity: 1 }}
                    transition={{ delay: index * 0.08 + 0.2 }}
                    className="absolute left-4 top-4 rounded-full bg-gradient-to-r from-rose-500 to-rose-600 px-4 py-2 text-sm font-bold text-white shadow-lg"
                  >
                    {deal.discount}
                  </motion.div>

                  {/* Wishlist Button */}
                  <button className="absolute right-4 top-4 rounded-full border border-white/20 bg-black/30 p-2.5 backdrop-blur transition hover:border-rose-400/50 hover:bg-rose-500/20">
                    <Heart className="h-5 w-5 text-white/70 transition group-hover:text-rose-400" />
                  </button>
                </div>

                {/* Content */}
                <div className="p-6 space-y-4">
                  <div>
                    <h3 className="text-xl font-bold text-white">{deal.name}</h3>
                    <p className="text-xs text-white/50 mt-1">Limited time offer</p>
                  </div>

                  {/* Pricing */}
                  <div className="border-t border-white/10 pt-4">
                    <div className="flex items-baseline gap-2">
                      <p className="text-3xl font-bold text-cyan-400">
                        {deal.price}
                      </p>
                      <p className="text-sm text-white/50 line-through">
                        {deal.original}
                      </p>
                    </div>
                    <p className="text-xs text-white/40 mt-2">
                      You save {((parseFloat(deal.original.slice(1)) - parseFloat(deal.price.slice(1))) * 100 / parseFloat(deal.original.slice(1))).toFixed(0)}%
                    </p>
                  </div>

                  {/* CTA Button */}
                  <motion.button
                    whileHover={{ x: 4 }}
                    type="button"
                    onClick={() => goToBookingFromDeal(deal.name)}
                    className="w-full flex items-center justify-between rounded-lg bg-gradient-to-r from-cyan-500 to-violet-500 px-4 py-3 text-sm font-bold text-white transition hover:shadow-lg hover:shadow-cyan-500/50"
                  >
                    <span>Book Now</span>
                    <ArrowRight className="h-4 w-4" />
                  </motion.button>
                </div>
              </motion.article>
            ))}
          </div>
        </div>
      </section>

      {/* Deal Benefits */}
      <section className="py-24 md:py-32 border-t border-white/10">
        <div className="mx-auto max-w-7xl px-4 md:px-6">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-white">
              Why Book These Deals?
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                title: "Best Price Guarantee",
                desc: "If you find a lower price, we'll match it plus give you 10% off",
              },
              {
                title: "Instant Confirmation",
                desc: "Book online and get your confirmation email in seconds",
              },
              {
                title: "Free Cancellation",
                desc: "Cancel for free up to 24 hours before pickup",
              },
              {
                title: "Premium Vehicles",
                desc: "All deals are on recently serviced, premium quality cars",
              },
              {
                title: "Flexible Dates",
                desc: "Extend or shorten your rental with zero additional fees",
              },
              {
                title: "24/7 Support",
                desc: "Our team is available anytime to help you out",
              },
            ].map((benefit, index) => (
              <motion.div
                key={benefit.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-xl hover:border-cyan-500/40 transition-colors"
              >
                <h3 className="text-lg font-semibold text-white">
                  {benefit.title}
                </h3>
                <p className="mt-2 text-sm text-white/60">
                  {benefit.desc}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Limited Time Banner */}
      <section className="py-16 md:py-24">
        <div className="mx-auto max-w-4xl px-4 md:px-6">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            className="rounded-3xl border border-rose-500/30 bg-gradient-to-br from-rose-500/10 to-violet-500/10 p-8 md:p-12 text-center backdrop-blur-xl"
          >
            <div className="inline-flex items-center gap-2 mb-4">
              <Zap className="h-5 w-5 text-rose-400" />
              <span className="text-sm font-semibold text-rose-400 uppercase">
                Ending Soon
              </span>
            </div>
            <h2 className="text-3xl md:text-4xl font-bold text-white">
              These Deals Won&apos;t Last Long
            </h2>
            <p className="mt-4 text-white/60">
              Limited inventory at special prices. Book now to secure your preferred vehicle.
            </p>
            <motion.button
              whileHover={{ scale: 1.05 }}
              type="button"
              onClick={() => router.push("/deals")}
              className="mt-8 rounded-lg bg-gradient-to-r from-rose-500 to-rose-600 px-8 py-4 text-base font-bold text-white transition hover:shadow-lg hover:shadow-rose-500/50"
            >
              View All Deals
            </motion.button>
          </motion.div>
        </div>
      </section>
    </div>
  );
}
