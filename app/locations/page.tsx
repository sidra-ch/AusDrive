"use client";

import Image from "next/image";
import { motion } from "framer-motion";
import { MapPin, Phone, Clock } from "lucide-react";
import { Navbar } from "@/components/shared/navbar";
import { locations } from "@/lib/landing-data";

export default function LocationsPage() {
  const locationDetails = [
    {
      city: "Sydney",
      address: "123 Market Street, Sydney NSW 2000",
      phone: "(02) 9000 1234",
      hours: "7:00 AM - 7:00 PM",
      vehicles: "450+",
    },
    {
      city: "Melbourne",
      address: "456 Collins Street, Melbourne VIC 3000",
      phone: "(03) 9000 5678",
      hours: "7:00 AM - 7:00 PM",
      vehicles: "380+",
    },
    {
      city: "Brisbane",
      address: "789 Queen Street, Brisbane QLD 4000",
      phone: "(07) 3000 9012",
      hours: "7:00 AM - 7:00 PM",
      vehicles: "320+",
    },
    {
      city: "Perth",
      address: "321 Murray Street, Perth WA 6000",
      phone: "(08) 9000 3456",
      hours: "7:00 AM - 7:00 PM",
      vehicles: "280+",
    },
    {
      city: "Gold Coast",
      address: "654 Surfers Paradise, Gold Coast QLD 4217",
      phone: "(07) 5500 7890",
      hours: "8:00 AM - 6:00 PM",
      vehicles: "220+",
    },
    {
      city: "Adelaide",
      address: "987 King William Street, Adelaide SA 5000",
      phone: "(08) 8000 4567",
      hours: "7:00 AM - 7:00 PM",
      vehicles: "250+",
    },
  ];

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
            <span className="inline-block rounded-full border border-cyan-500/30 bg-cyan-500/10 px-4 py-2 text-xs font-semibold text-cyan-400 uppercase tracking-wider">
              60+ Pickup Locations
            </span>
            <h1 className="mt-6 text-5xl font-bold text-white md:text-6xl lg:text-7xl">
              Conveniently Located
            </h1>
            <p className="mt-4 text-lg text-white/50 md:text-xl max-w-2xl mx-auto">
              Find a pickup location near you across major Australian cities. Fast, hassle-free rental experience at every location.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Locations Grid */}
      <section className="pb-24 md:pb-32">
        <div className="mx-auto max-w-7xl px-4 md:px-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {locations.map((location, index) => {
              const details = locationDetails[index];
              return (
                <motion.article
                  key={location.city}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.1 }}
                  className="group overflow-hidden rounded-3xl border border-white/10 bg-white/5 backdrop-blur-xl hover:border-violet-500/40 transition-all duration-300"
                >
                  {/* Image */}
                  <div className="relative h-48 overflow-hidden">
                    <Image
                      src={location.image}
                      alt={location.city}
                      fill
                      className="object-cover group-hover:scale-105 transition-transform duration-500"
                      sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                    <div className="absolute bottom-4 left-4">
                      <h3 className="text-2xl font-bold text-white">{location.city}</h3>
                    </div>
                  </div>

                  {/* Content */}
                  <div className="p-6 space-y-4">
                    <div>
                      <p className="text-lg font-semibold bg-gradient-to-r from-cyan-400 to-violet-400 bg-clip-text text-transparent">
                        {location.price}
                      </p>
                      <p className="text-xs text-white/50 mt-1">{details?.vehicles} vehicles available</p>
                    </div>

                    {/* Details */}
                    <div className="space-y-3 border-t border-white/10 pt-4">
                      <div className="flex items-start gap-3">
                        <MapPin className="h-5 w-5 text-cyan-400 flex-shrink-0 mt-0.5" />
                        <div>
                          <p className="text-xs text-white/50 font-medium">ADDRESS</p>
                          <p className="text-sm text-white">{details?.address}</p>
                        </div>
                      </div>

                      <div className="flex items-start gap-3">
                        <Phone className="h-5 w-5 text-cyan-400 flex-shrink-0 mt-0.5" />
                        <div>
                          <p className="text-xs text-white/50 font-medium">PHONE</p>
                          <p className="text-sm text-white">{details?.phone}</p>
                        </div>
                      </div>

                      <div className="flex items-start gap-3">
                        <Clock className="h-5 w-5 text-cyan-400 flex-shrink-0 mt-0.5" />
                        <div>
                          <p className="text-xs text-white/50 font-medium">HOURS</p>
                          <p className="text-sm text-white">{details?.hours}</p>
                        </div>
                      </div>
                    </div>

                    {/* CTA */}
                    <button className="w-full mt-4 rounded-lg border border-cyan-500/30 bg-cyan-500/10 py-2 text-sm font-semibold text-cyan-400 transition hover:bg-cyan-500/20 hover:border-cyan-500/50">
                      Get Directions
                    </button>
                  </div>
                </motion.article>
              );
            })}
          </div>
        </div>
      </section>

      {/* Map Placeholder Section */}
      <section className="py-24 md:py-32 border-t border-white/10">
        <div className="mx-auto max-w-7xl px-4 md:px-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="rounded-3xl border border-white/10 bg-white/5 backdrop-blur-xl overflow-hidden"
          >
            <div className="relative h-96 bg-gradient-to-br from-cyan-500/10 to-violet-500/10 flex items-center justify-center">
              <div className="text-center">
                <MapPin className="h-16 w-16 text-cyan-400/30 mx-auto mb-4" />
                <p className="text-white/50">Interactive map coming soon</p>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Contact CTA */}
      <section className="py-16 md:py-24">
        <div className="mx-auto max-w-4xl px-4 md:px-6">
          <div className="rounded-3xl border border-cyan-500/30 bg-gradient-to-br from-cyan-500/10 to-violet-500/10 p-8 md:p-12 text-center backdrop-blur-xl">
            <h2 className="text-3xl md:text-4xl font-bold text-white">
              Can't find your location?
            </h2>
            <p className="mt-4 text-white/60">
              Contact us and we'll arrange a pickup from your preferred location.
            </p>
            <motion.button
              whileHover={{ scale: 1.05 }}
              className="mt-8 rounded-lg bg-gradient-to-r from-cyan-500 to-violet-500 px-8 py-4 text-base font-bold text-white transition hover:shadow-lg hover:shadow-cyan-500/50"
            >
              Get in Touch
            </motion.button>
          </div>
        </div>
      </section>
    </div>
  );
}
