import { prisma } from './prisma';

interface PricingInputs {
  carId: string;
  pickupDate: Date;
  dropoffDate: Date;
  pickupLocation: string;
  distance?: number; // in km
  promoCode?: string;
}

interface PricingBreakdown {
  basePrice: number;
  distancePrice: number;
  timeMultiplier: number;
  demandMultiplier: number;
  seasonMultiplier: number;
  discountAmount: number;
  totalPrice: number;
  breakdown: {
    dailyRate: number;
    days: number;
    baseFare: number;
    surgeMultiplier: number;
    distanceFee: number;
    discount: number;
    finalPrice: number;
  };
}

class DynamicPricingService {
  // Base pricing configuration
  private readonly BASE_DAILY_RATE = 50; // AUD
  private readonly PER_KM_RATE = 0.50; // AUD per km
  private readonly PEAK_HOUR_SURGE = 1.5; // 50% increase during peak hours
  private readonly WEEKEND_SURGE = 1.3; // 30% increase on weekends
  private readonly HOLIDAY_SURGE = 1.8; // 80% increase on holidays
  private readonly HIGH_DEMAND_SURGE = 2.0; // 100% increase during high demand

  // AI-based pricing weights
  private readonly AI_WEIGHTS = {
    demand: 0.4,      // 40% weight on current demand
    seasonal: 0.2,    // 20% weight on seasonal trends
    weather: 0.15,    // 15% weight on weather conditions
    events: 0.15,     // 15% weight on local events
    historical: 0.1   // 10% weight on historical data
  };

  // Australian public holidays (simplified)
  private readonly PUBLIC_HOLIDAYS = [
    '01-01', // New Year's Day
    '01-26', // Australia Day
    '04-25', // ANZAC Day
    '12-25', // Christmas Day
    '12-26', // Boxing Day
    // Add more holidays as needed
  ];

  async calculateDynamicPrice(inputs: PricingInputs): Promise<PricingBreakdown> {
    const { carId, pickupDate, dropoffDate, pickupLocation, distance = 0, promoCode } = inputs;

    // Get car information
    const car = await prisma.car.findUnique({
      where: { id: carId },
      select: {
        dailyRate: true,
        make: true,
        model: true,
        city: true
      }
    });

    if (!car) {
      throw new Error('Car not found');
    }

    // Calculate rental duration
    const days = Math.ceil((dropoffDate.getTime() - pickupDate.getTime()) / (1000 * 60 * 60 * 24));
    if (days <= 0) {
      throw new Error('Invalid rental duration');
    }

    // Base price calculation
    const baseDailyRate = car.dailyRate || this.BASE_DAILY_RATE;
    const basePrice = baseDailyRate * days;

    // Distance pricing
    const distancePrice = distance * this.PER_KM_RATE;

    // Time-based multipliers
    const timeMultiplier = this.calculateTimeMultiplier(pickupDate, dropoffDate);
    
    // Demand-based multiplier
    const demandMultiplier = await this.calculateDemandMultiplier(pickupDate, dropoffDate, car.city);
    
    // Seasonal multiplier
    const seasonMultiplier = this.calculateSeasonMultiplier(pickupDate);

    // Calculate total before discount
    const surgeMultiplier = timeMultiplier * demandMultiplier * seasonMultiplier;
    const totalPriceBeforeDiscount = (basePrice + distancePrice) * surgeMultiplier;

    // Apply promo code discount
    const discountAmount = await this.calculatePromoDiscount(promoCode, totalPriceBeforeDiscount);
    const finalPrice = Math.max(0, totalPriceBeforeDiscount - discountAmount);

    return {
      basePrice,
      distancePrice,
      timeMultiplier,
      demandMultiplier,
      seasonMultiplier,
      discountAmount,
      totalPrice: finalPrice,
      breakdown: {
        dailyRate: baseDailyRate,
        days,
        baseFare: basePrice,
        surgeMultiplier: parseFloat(surgeMultiplier.toFixed(2)),
        distanceFee: distancePrice,
        discount: discountAmount,
        finalPrice: parseFloat(finalPrice.toFixed(2))
      }
    };
  }

  private calculateTimeMultiplier(pickupDate: Date, dropoffDate: Date): number {
    let multiplier = 1.0;

    // Check if rental period includes peak hours (7-9 AM, 5-7 PM)
    const pickupHour = pickupDate.getHours();
    const dropoffHour = dropoffDate.getHours();
    
    const isPeakHour = (pickupHour >= 7 && pickupHour <= 9) || 
                      (pickupHour >= 17 && pickupHour <= 19) ||
                      (dropoffHour >= 7 && dropoffHour <= 9) || 
                      (dropoffHour >= 17 && dropoffHour <= 19);

    if (isPeakHour) {
      multiplier *= this.PEAK_HOUR_SURGE;
    }

    // Weekend surcharge
    const pickupDay = pickupDate.getDay();
    const dropoffDay = dropoffDate.getDay();
    
    const isWeekend = pickupDay === 0 || pickupDay === 6 || dropoffDay === 0 || dropoffDay === 6;
    if (isWeekend) {
      multiplier *= this.WEEKEND_SURGE;
    }

    // Holiday surcharge
    const isHoliday = this.isPublicHoliday(pickupDate) || this.isPublicHoliday(dropoffDate);
    if (isHoliday) {
      multiplier *= this.HOLIDAY_SURGE;
    }

    return multiplier;
  }

  private async calculateDemandMultiplier(pickupDate: Date, dropoffDate: Date, city: string): Promise<number> {
    try {
      // Count active bookings in the same city for the same period
      const activeBookings = await prisma.booking.count({
        where: {
          status: {
            in: ['CONFIRMED', 'ACTIVE']
          },
          pickupLocation: city,
          OR: [
            {
              AND: [
                { pickupDate: { lte: pickupDate } },
                { dropoffDate: { gte: pickupDate } }
              ]
            },
            {
              AND: [
                { pickupDate: { lte: dropoffDate } },
                { dropoffDate: { gte: dropoffDate } }
              ]
            }
          ]
        }
      });

      // Get total available cars in the city
      const totalCars = await prisma.car.count({
        where: {
          city,
          isAvailable: true
        }
      });

      if (totalCars === 0) return 1.0;

      // Calculate utilization rate
      const utilizationRate = activeBookings / totalCars;

      // Apply demand multiplier based on utilization
      if (utilizationRate > 0.9) {
        return this.HIGH_DEMAND_SURGE; // Very high demand
      } else if (utilizationRate > 0.7) {
        return 1.5; // High demand
      } else if (utilizationRate > 0.5) {
        return 1.2; // Moderate demand
      } else {
        return 1.0; // Normal demand
      }
    } catch (error) {
      console.error('[Pricing] Error calculating demand multiplier:', error);
      return 1.0; // Default to normal demand on error
    }
  }

  private calculateSeasonMultiplier(date: Date): number {
    const month = date.getMonth() + 1; // 1-12
    
    // Australian seasons
    // Summer (Dec-Feb): High season
    if (month >= 12 || month <= 2) {
      return 1.4;
    }
    // Autumn (Mar-May): Shoulder season
    else if (month >= 3 && month <= 5) {
      return 1.1;
    }
    // Winter (Jun-Aug): Low season
    else if (month >= 6 && month <= 8) {
      return 0.9;
    }
    // Spring (Sep-Nov): Shoulder season
    else {
      return 1.1;
    }
  }

  private isPublicHoliday(date: Date): boolean {
    const monthDay = `${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
    return this.PUBLIC_HOLIDAYS.includes(monthDay);
  }

  private async calculatePromoDiscount(promoCode: string | undefined, totalPrice: number): Promise<number> {
    if (!promoCode) return 0;

    try {
      const promo = await prisma.promoCode.findUnique({
        where: { code: promoCode.toUpperCase() }
      });

      if (!promo || !promo.isActive) {
        return 0;
      }

      // Check if expired
      if (new Date() > promo.expiresAt) {
        return 0;
      }

      // Check usage limit
      if (promo.maxUses && promo.currentUses >= promo.maxUses) {
        return 0;
      }

      // Calculate discount
      let discount = 0;
      if (promo.discountType === 'PERCENTAGE') {
        discount = totalPrice * (promo.discountValue / 100);
      } else if (promo.discountType === 'FIXED') {
        discount = promo.discountValue;
      }

      // Ensure discount doesn't exceed total price
      return Math.min(discount, totalPrice);
    } catch (error) {
      console.error('[Pricing] Error calculating promo discount:', error);
      return 0;
    }
  }

  // Get real-time price estimate for a car
  async getPriceEstimate(carId: string, pickupDate: Date, dropoffDate: Date, pickupLocation: string): Promise<{
    estimatedPrice: number;
    priceRange: { min: number; max: number };
    surgeMultiplier: number;
    confidence: 'high' | 'medium' | 'low';
  }> {
    try {
      // Calculate base price
      const basePricing = await this.calculateDynamicPrice({
        carId,
        pickupDate,
        dropoffDate,
        pickupLocation
      });

      // Calculate price range with variations
      const variation = 0.1; // 10% variation
      const minPrice = basePricing.totalPrice * (1 - variation);
      const maxPrice = basePricing.totalPrice * (1 + variation);

      // Determine confidence based on data availability
      const confidence = this.calculatePriceConfidence(pickupDate, dropoffDate);

      return {
        estimatedPrice: basePricing.totalPrice,
        priceRange: {
          min: parseFloat(minPrice.toFixed(2)),
          max: parseFloat(maxPrice.toFixed(2))
        },
        surgeMultiplier: basePricing.breakdown.surgeMultiplier,
        confidence
      };
    } catch (error) {
      console.error('[Pricing] Error getting price estimate:', error);
      throw error;
    }
  }

  private calculatePriceConfidence(pickupDate: Date, dropoffDate: Date): 'high' | 'medium' | 'low' {
    const daysUntilPickup = Math.ceil((pickupDate.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
    
    if (daysUntilPickup <= 7) {
      return 'high'; // Near-term bookings have more accurate pricing
    } else if (daysUntilPickup <= 30) {
      return 'medium'; // Medium-term bookings
    } else {
      return 'low'; // Long-term bookings have more uncertainty
    }
  }

  // AI-powered predictive pricing
  async calculateAIPrice(inputs: PricingInputs): Promise<PricingBreakdown & {
    aiInsights: {
      demandPrediction: number;
      confidenceScore: number;
      recommendedPrice: number;
      factors: {
        demand: string;
        seasonal: string;
        weather: string;
        events: string;
        historical: string;
      };
    };
  }> {
    const basePricing = await this.calculateDynamicPrice(inputs);
    
    // AI-based demand prediction
    const demandPrediction = await this.predictDemand(inputs);
    
    // Confidence score based on data quality
    const confidenceScore = this.calculateConfidenceScore(inputs);
    
    // AI-recommended price
    const recommendedPrice = this.calculateAIRecommendedPrice(basePricing, demandPrediction);
    
    // AI insights
    const aiInsights = {
      demandPrediction,
      confidenceScore,
      recommendedPrice,
      factors: await this.analyzePricingFactors(inputs)
    };

    return {
      ...basePricing,
      aiInsights
    };
  }

  private async predictDemand(inputs: PricingInputs): Promise<number> {
    try {
      // Get historical booking data for similar periods
      const historicalData = await this.getHistoricalDemand(inputs);
      
      // Get current bookings
      const currentDemand = await this.calculateDemandMultiplier(
        inputs.pickupDate, 
        inputs.dropoffDate, 
        inputs.pickupLocation
      );
      
      // Simple ML-like prediction using weighted average
      const prediction = (
        historicalData * this.AI_WEIGHTS.historical +
        currentDemand * this.AI_WEIGHTS.demand
      );
      
      return Math.max(1.0, Math.min(3.0, prediction)); // Clamp between 1x and 3x
    } catch (error) {
      console.error('[Pricing] Error predicting demand:', error);
      return 1.0;
    }
  }

  private async getHistoricalDemand(inputs: PricingInputs): Promise<number> {
    try {
      // Get bookings from same period last year
      const lastYearStart = new Date(inputs.pickupDate);
      lastYearStart.setFullYear(lastYearStart.getFullYear() - 1);
      
      const lastYearEnd = new Date(inputs.dropoffDate);
      lastYearEnd.setFullYear(lastYearEnd.getFullYear() - 1);

      const historicalBookings = await prisma.booking.count({
        where: {
          status: { in: ['CONFIRMED', 'ACTIVE'] },
          pickupLocation: inputs.pickupLocation,
          pickupDate: { gte: lastYearStart },
          dropoffDate: { lte: lastYearEnd }
        }
      });

      // Convert to demand multiplier
      return Math.max(1.0, historicalBookings / 10); // Normalize
    } catch (error) {
      console.error('[Pricing] Error getting historical demand:', error);
      return 1.0;
    }
  }

  private calculateConfidenceScore(inputs: PricingInputs): number {
    let score = 0.5; // Base confidence

    // Higher confidence for near-term bookings
    const daysUntilPickup = Math.ceil((inputs.pickupDate.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
    if (daysUntilPickup <= 7) score += 0.3;
    else if (daysUntilPickup <= 30) score += 0.1;

    // Higher confidence for popular locations
    const popularCities = ['Sydney', 'Melbourne', 'Brisbane'];
    if (popularCities.includes(inputs.pickupLocation)) score += 0.2;

    return Math.min(1.0, score);
  }

  private calculateAIRecommendedPrice(basePricing: PricingBreakdown, demandPrediction: number): number {
    // AI recommendation based on predicted demand
    const aiAdjustment = 1 + (demandPrediction - 1) * 0.5; // Conservative AI adjustment
    return basePricing.totalPrice * aiAdjustment;
  }

  private async analyzePricingFactors(inputs: PricingInputs): Promise<{
    demand: string;
    seasonal: string;
    weather: string;
    events: string;
    historical: string;
  }> {
    return {
      demand: await this.getDemandInsight(inputs),
      seasonal: this.getSeasonalInsight(inputs.pickupDate),
      weather: this.getWeatherInsight(inputs.pickupLocation, inputs.pickupDate),
      events: await this.getEventsInsight(inputs.pickupLocation, inputs.pickupDate),
      historical: await this.getHistoricalInsight(inputs)
    };
  }

  private async getDemandInsight(inputs: PricingInputs): Promise<string> {
    const demandMultiplier = await this.calculateDemandMultiplier(
      inputs.pickupDate, 
      inputs.dropoffDate, 
      inputs.pickupLocation
    );
    
    if (demandMultiplier >= 2.0) return "Very high demand expected";
    if (demandMultiplier >= 1.5) return "High demand expected";
    if (demandMultiplier >= 1.2) return "Moderate demand expected";
    return "Normal demand expected";
  }

  private getSeasonalInsight(date: Date): string {
    const month = date.getMonth() + 1;
    if (month >= 12 || month <= 2) return "Summer peak season";
    if (month >= 3 && month <= 5) return "Autumn shoulder season";
    if (month >= 6 && month <= 8) return "Winter low season";
    return "Spring shoulder season";
  }

  private getWeatherInsight(location: string, date: Date): string {
    // Simplified weather analysis - in production, integrate with real weather API
    const month = date.getMonth() + 1;
    const isWinter = month >= 6 && month <= 8;
    
    if (isWinter && ['Sydney', 'Melbourne'].includes(location)) {
      return "Winter conditions may increase demand";
    }
    return "Weather conditions normal";
  }

  private async getEventsInsight(location: string, date: Date): Promise<string> {
    // Simplified events analysis - in production, integrate with events API
    const month = date.getMonth() + 1;
    
    // Major Australian events
    if (location === 'Melbourne' && month === 3) return "Formula 1 period";
    if (location === 'Sydney' && month === 1) return "New Year period";
    if (location === 'Brisbane' && month === 9) return "Brisbane Festival period";
    
    return "No major events detected";
  }

  private async getHistoricalInsight(inputs: PricingInputs): Promise<string> {
    const historicalDemand = await this.getHistoricalDemand(inputs);
    
    if (historicalDemand >= 1.5) return "Historical demand was high";
    if (historicalDemand >= 1.2) return "Historical demand was moderate";
    return "Historical demand was normal";
  }

  // Update promo code usage
  async usePromoCode(promoCode: string): Promise<boolean> {
    try {
      const promo = await prisma.promoCode.findUnique({
        where: { code: promoCode.toUpperCase() }
      });

      if (!promo) return false;

      await prisma.promoCode.update({
        where: { id: promo.id },
        data: {
          currentUses: promo.currentUses + 1
        }
      });

      return true;
    } catch (error) {
      console.error('[Pricing] Error using promo code:', error);
      return false;
    }
  }
}

export const pricingService = new DynamicPricingService();
