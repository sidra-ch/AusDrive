export type City = 'Sydney' | 'Melbourne' | 'Brisbane' | 'Perth' | 'Adelaide';

const CITY_MULTIPLIERS: Record<City, number> = {
  'Sydney': 1.3, // Premium Pricing (Highest demand)
  'Melbourne': 1.1, // Mid Pricing
  'Brisbane': 1.0, // Standard Pricing
  'Perth': 0.95, // Discounted Pricing
  'Adelaide': 0.85, // Budget Pricing
};

export const PricingService = {
  calculateTotal: (basePrice: number, days: number, city: City = 'Sydney') => {
    let total = basePrice * days;
    
    // Apply City Multiplier
    const multiplier = CITY_MULTIPLIERS[city] || 1.0;
    total *= multiplier;
    
    // Apply Duration Discounts
    let discount = 0;
    if (days >= 30) {
      discount = 0.20; // 20% for 30+ days
    } else if (days >= 7) {
      discount = 0.10; // 10% for 7+ days
    }
    
    const discountedTotal = total * (1 - discount);
    
    return {
      subtotal: total,
      discount: total * discount,
      total: discountedTotal,
      multiplier,
      isDiscounted: discount > 0,
      discountPercentage: discount * 100
    };
  }
};
