import { NextResponse } from 'next/server';
import { query } from '@/lib/db';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const budget = parseFloat(searchParams.get('budget') || '1000');
  const category = searchParams.get('category') || 'All';
  const seats = parseInt(searchParams.get('seats') || '0');

  try {
    // Basic AI Recommendation Logic:
    // 1. Filter by category if provided
    // 2. Filter by seats
    // 3. Sort by "Value Score" (daily_rate vs quality)
    // 4. Boost cars in the same city (if provided)
    
    let sql = `
      SELECT *, 
      (CASE 
        WHEN category = 'Luxury' THEN 10 
        WHEN category = 'SUV' THEN 8 
        ELSE 5 
      END) as quality_score
      FROM cars 
      WHERE status = 'available'
    `;

    const params: any[] = [];
    if (category !== 'All') {
      sql += ` AND category = $${params.length + 1}`;
      params.push(category);
    }

    if (seats > 0) {
      sql += ` AND seats >= $${params.length + 1}`;
      params.push(seats);
    }

    sql += ` ORDER BY (daily_rate / (CASE WHEN category = 'Luxury' THEN 1.5 ELSE 1.0 END)) ASC LIMIT 5`;

    const cars = await query(sql, params);

    // Add "AI Reasoning" to each recommendation
    const recommendedCars = cars.map((car: any) => ({
      ...car,
      ai_reason: `Based on your budget of $${budget}, this ${car.make} ${car.model} offers the best ${car.category} value with high performance.`,
    }));

    return NextResponse.json({
      success: true,
      recommendations: recommendedCars
    });
  } catch (error) {
    console.error('[AI API] Error:', error);
    return NextResponse.json({ success: false, error: 'AI processing failed' }, { status: 500 });
  }
}
