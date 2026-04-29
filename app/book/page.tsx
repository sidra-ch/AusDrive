"use client";

import { Suspense, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import { CheckCircle2 } from "lucide-react";

import { Navbar } from "@/components/shared/navbar";
import { carCategories, locationOptions } from "@/lib/landing-data";
import { SearchableSelect } from "@/components/shared/searchable-select";

type FormState = {
  location: string;
  pickupDate: string;
  pickupTime: string;
  returnDate: string;
  returnTime: string;
  carType: string;
  fullName: string;
  email: string;
  phone: string;
  notes: string;
};

const STEPS = ["Trip", "Customer", "Confirm"];

function BookPageContent() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const [step, setStep] = useState(0);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");

  const [form, setForm] = useState<FormState>({
    location: searchParams.get("location") || "Sydney",
    pickupDate: searchParams.get("pickupDate") || "",
    pickupTime: searchParams.get("pickupTime") || "10:00",
    returnDate: searchParams.get("returnDate") || "",
    returnTime: searchParams.get("returnTime") || "10:00",
    carType: searchParams.get("carType") || "all",
    fullName: "",
    email: "",
    phone: "",
    notes: "",
  });

  const today = useMemo(() => {
    const d = new Date();
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${y}-${m}-${day}`;
  }, []);

  const selectedCategory =
    form.carType === "all"
      ? null
      : carCategories.find((c) => c.name.toLowerCase() === form.carType.toLowerCase()) ?? null;

  function set<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  function validateStep(currentStep: number) {
    setError("");

    if (currentStep === 0) {
      if (!form.location.trim()) return "Please select pickup location.";
      if (!form.pickupDate || !form.returnDate) return "Please select pickup and return dates.";
      const start = new Date(`${form.pickupDate}T${form.pickupTime || "00:00"}`);
      const end = new Date(`${form.returnDate}T${form.returnTime || "00:00"}`);
      if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime()) || end <= start) {
        return "Return date/time must be after pickup date/time.";
      }
    }

    if (currentStep === 1) {
      if (!form.fullName.trim()) return "Please enter full name.";
      if (!form.email.trim() || !form.email.includes("@")) return "Please enter a valid email.";
      if (!form.phone.trim() || form.phone.length < 8) return "Please enter a valid phone number.";
    }

    return "";
  }

  function nextStep() {
    const validationError = validateStep(step);
    if (validationError) {
      setError(validationError);
      return;
    }
    setStep((s) => Math.min(s + 1, STEPS.length - 1));
  }

  function prevStep() {
    setError("");
    setStep((s) => Math.max(s - 1, 0));
  }

  function submitBooking() {
    const validationError = validateStep(1);
    if (validationError) {
      setError(validationError);
      setStep(1);
      return;
    }
    setSubmitted(true);
    setTimeout(() => {
      router.push("/");
    }, 3000);
  }

  return (
    <div className="min-h-screen bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(120,119,198,0.3),rgba(255,255,255,0))]">
      <Navbar />

      <section className="pt-28 pb-16 md:pt-36 md:pb-24">
        <div className="mx-auto max-w-5xl px-4 md:px-6">
          <div className="mb-8 text-center">
            <span className="inline-block rounded-full border border-cyan-500/30 bg-cyan-500/10 px-4 py-2 text-xs font-semibold text-cyan-400 uppercase tracking-wider">
              Step by Step Booking
            </span>
            <h1 className="mt-4 text-4xl font-bold text-white md:text-5xl">Book Your Car</h1>
            <p className="mt-2 text-white/60">Complete your reservation in 3 simple steps.</p>
          </div>

          <div className="mb-6 grid grid-cols-3 gap-3">
            {STEPS.map((label, idx) => (
              <div
                key={label}
                className={`rounded-xl border px-4 py-3 text-center text-sm font-semibold ${
                  idx <= step
                    ? "border-cyan-500/40 bg-cyan-500/10 text-cyan-300"
                    : "border-white/10 bg-white/5 text-white/40"
                }`}
              >
                {idx + 1}. {label}
              </div>
            ))}
          </div>

          <div className="rounded-3xl border border-white/10 bg-white/5 p-6 backdrop-blur-xl md:p-8">
            {submitted ? (
              <div className="py-10 text-center">
                <CheckCircle2 className="mx-auto h-16 w-16 text-emerald-400" />
                <h2 className="mt-4 text-3xl font-bold text-white">Booking Request Sent</h2>
                <p className="mt-2 text-white/60">
                  Thank you {form.fullName}. We have received your request and will contact you shortly.
                </p>
                <button
                  onClick={() => router.push("/")}
                  className="mt-6 rounded-lg bg-gradient-to-r from-cyan-500 to-violet-500 px-8 py-3 text-sm font-bold text-white"
                >
                  Back to Home
                </button>
              </div>
            ) : (
              <>
                {step === 0 && (
                  <div className="grid gap-4 md:grid-cols-2">
                    <Field label="Pickup Location">
                      <SearchableSelect
                        value={form.location}
                        onChange={(val) => set("location", val)}
                        options={[...locationOptions]}
                        placeholder="Search city..."
                      />
                    </Field>

                    <Field label="Vehicle Type">
                      <select
                        value={form.carType}
                        onChange={(e) => set("carType", e.target.value)}
                        className="w-full rounded-lg border border-white/10 bg-[#0a0b1e] px-4 py-2.5 text-sm text-white outline-none focus:border-cyan-500/40"
                      >
                        <option value="all">All Types</option>
                        {carCategories.map((car) => (
                          <option key={car.name} value={car.name}>
                            {car.name}
                          </option>
                        ))}
                      </select>
                    </Field>

                    <Field label="Pickup Date">
                      <input
                        type="date"
                        min={today}
                        value={form.pickupDate}
                        onChange={(e) => set("pickupDate", e.target.value)}
                        className="w-full rounded-lg border border-white/10 bg-[#0a0b1e] px-4 py-2.5 text-sm text-white outline-none focus:border-cyan-500/40"
                      />
                    </Field>

                    <Field label="Pickup Time">
                      <input
                        type="time"
                        value={form.pickupTime}
                        onChange={(e) => set("pickupTime", e.target.value)}
                        className="w-full rounded-lg border border-white/10 bg-[#0a0b1e] px-4 py-2.5 text-sm text-white outline-none focus:border-cyan-500/40"
                      />
                    </Field>

                    <Field label="Return Date">
                      <input
                        type="date"
                        min={form.pickupDate || today}
                        value={form.returnDate}
                        onChange={(e) => set("returnDate", e.target.value)}
                        className="w-full rounded-lg border border-white/10 bg-[#0a0b1e] px-4 py-2.5 text-sm text-white outline-none focus:border-cyan-500/40"
                      />
                    </Field>

                    <Field label="Return Time">
                      <input
                        type="time"
                        value={form.returnTime}
                        onChange={(e) => set("returnTime", e.target.value)}
                        className="w-full rounded-lg border border-white/10 bg-[#0a0b1e] px-4 py-2.5 text-sm text-white outline-none focus:border-cyan-500/40"
                      />
                    </Field>
                  </div>
                )}

                {step === 1 && (
                  <div className="grid gap-4 md:grid-cols-2">
                    <Field label="Full Name">
                      <input
                        value={form.fullName}
                        onChange={(e) => set("fullName", e.target.value)}
                        className="w-full rounded-lg border border-white/10 bg-[#0a0b1e] px-4 py-2.5 text-sm text-white outline-none focus:border-cyan-500/40"
                        placeholder="Your full name"
                      />
                    </Field>
                    <Field label="Email">
                      <input
                        type="email"
                        value={form.email}
                        onChange={(e) => set("email", e.target.value)}
                        className="w-full rounded-lg border border-white/10 bg-[#0a0b1e] px-4 py-2.5 text-sm text-white outline-none focus:border-cyan-500/40"
                        placeholder="you@email.com"
                      />
                    </Field>
                    <Field label="Phone">
                      <input
                        value={form.phone}
                        onChange={(e) => set("phone", e.target.value)}
                        className="w-full rounded-lg border border-white/10 bg-[#0a0b1e] px-4 py-2.5 text-sm text-white outline-none focus:border-cyan-500/40"
                        placeholder="+61 ..."
                      />
                    </Field>
                    <Field label="Notes (Optional)">
                      <input
                        value={form.notes}
                        onChange={(e) => set("notes", e.target.value)}
                        className="w-full rounded-lg border border-white/10 bg-[#0a0b1e] px-4 py-2.5 text-sm text-white outline-none focus:border-cyan-500/40"
                        placeholder="Any special request"
                      />
                    </Field>
                  </div>
                )}

                {step === 2 && (
                  <div className="space-y-4">
                    <SummaryRow label="Location" value={form.location} />
                    <SummaryRow label="Vehicle" value={form.carType === "all" ? "Any available" : form.carType} />
                    <SummaryRow label="Pickup" value={`${form.pickupDate} ${form.pickupTime}`} />
                    <SummaryRow label="Return" value={`${form.returnDate} ${form.returnTime}`} />
                    <SummaryRow label="Customer" value={`${form.fullName} · ${form.email} · ${form.phone}`} />
                    {selectedCategory && (
                      <div className="rounded-xl border border-cyan-500/25 bg-cyan-500/10 px-4 py-3 text-sm text-cyan-200">
                        Estimated from {selectedCategory.price} for {selectedCategory.name} category.
                      </div>
                    )}
                  </div>
                )}

                {error && (
                  <p className="mt-5 rounded-lg border border-rose-500/30 bg-rose-500/10 px-4 py-2 text-sm text-rose-300">
                    {error}
                  </p>
                )}

                <div className="mt-6 flex flex-wrap gap-3">
                  {step > 0 && (
                    <button
                      type="button"
                      onClick={prevStep}
                      className="rounded-lg border border-white/15 bg-white/5 px-6 py-2.5 text-sm font-semibold text-white/75"
                    >
                      Back
                    </button>
                  )}

                  {step < 2 ? (
                    <button
                      type="button"
                      onClick={nextStep}
                      className="rounded-lg bg-gradient-to-r from-cyan-500 to-violet-500 px-6 py-2.5 text-sm font-bold text-white"
                    >
                      Continue
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={submitBooking}
                      className="rounded-lg bg-gradient-to-r from-cyan-500 to-violet-500 px-6 py-2.5 text-sm font-bold text-white"
                    >
                      Confirm Booking
                    </button>
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-white/45">{label}</label>
      {children}
    </div>
  );
}

function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm">
      <span className="text-white/50">{label}</span>
      <span className="font-medium text-white">{value || "-"}</span>
    </div>
  );
}
export default function BookPage() {
  return (
    <Suspense fallback={<BookPageFallback />}>
      <BookPageContent />
    </Suspense>
  );
}

function BookPageFallback() {
  return (
    <div className="min-h-screen bg-[#07081f] text-white">
      <Navbar />
      <section className="pt-28 pb-16 md:pt-36 md:pb-24">
        <div className="mx-auto max-w-5xl px-4 md:px-6">
          <div className="rounded-3xl border border-white/10 bg-white/5 p-8 text-center backdrop-blur-xl">
            <p className="text-sm font-semibold uppercase tracking-[0.28em] text-cyan-300/80">Loading</p>
            <h1 className="mt-3 text-3xl font-bold">Preparing your booking</h1>
            <p className="mt-2 text-white/60">Please wait while we load your reservation details.</p>
          </div>
        </div>
      </section>
    </div>
  );
}
