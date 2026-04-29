import { NextResponse } from 'next/server';
import { query } from '@/lib/db';

type CarRow = {
  id: string | number;
  make: string;
  model: string;
  category: string;
  daily_rate: number;
  seats: number;
};

type RecommendationInput = {
  budget: number;
  category: string;
  seats: number;
};

const OPENAI_MODEL = 'gpt-4o-mini';

function parseInputFromUrl(request: Request): RecommendationInput {
  const { searchParams } = new URL(request.url);
  return {
    budget: parseFloat(searchParams.get('budget') || '1000'),
    category: searchParams.get('category') || 'All',
    seats: parseInt(searchParams.get('seats') || '0'),
  };
}

async function parseInputFromBody(request: Request): Promise<RecommendationInput> {
  const body = await request.json().catch(() => ({}));
  return {
    budget: Number(body?.budget ?? 1000),
    category: String(body?.category ?? 'All'),
    seats: Number(body?.seats ?? 0),
  };
}

function fallbackReason(car: CarRow, budget: number): string {
  return `Based on your budget of $${budget}, this ${car.make} ${car.model} offers strong ${car.category} value with practical features.`;
}

function extractJsonArray(text: string): unknown[] | null {
  const start = text.indexOf('[');
  const end = text.lastIndexOf(']');
  if (start === -1 || end === -1 || end <= start) return null;

  try {
    const parsed = JSON.parse(text.slice(start, end + 1));
    return Array.isArray(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

async function generateAiReasons(cars: CarRow[], input: RecommendationInput): Promise<Map<string, string>> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    console.warn('[AI API] OPENAI_API_KEY is missing, using fallback reasons');
    return new Map();
  }

  const compactCars = cars.map((car) => ({
    id: String(car.id),
    make: car.make,
    model: car.model,
    category: car.category,
    daily_rate: car.daily_rate,
    seats: car.seats,
  }));

  const prompt = [
    'You are an assistant for a car rental app.',
    'Return ONLY valid JSON array. No markdown.',
    'Each item must be: {"id":"<car id>","reason":"<max 24 words>"}.',
    'Use practical, honest, concise explanations based on user constraints.',
    `User preferences: budget=${input.budget}, category=${input.category}, seats=${input.seats}.`,
    `Cars: ${JSON.stringify(compactCars)}`,
  ].join(' ');

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 10000);

  try {
    const res = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: OPENAI_MODEL,
        temperature: 0.3,
        messages: [
          { role: 'system', content: 'You produce concise JSON-only recommendation reasons.' },
          { role: 'user', content: prompt },
        ],
      }),
      signal: controller.signal,
    });

    if (!res.ok) {
      const errorText = await res.text().catch(() => 'unknown error');
      console.warn('[AI API] OpenAI request failed', {
        status: res.status,
        error: errorText.slice(0, 300),
      });
      return new Map();
    }

    const payload = await res.json();
    const content = payload?.choices?.[0]?.message?.content;
    if (typeof content !== 'string') {
      console.warn('[AI API] OpenAI returned empty/non-string content');
      return new Map();
    }

    const parsed = extractJsonArray(content);
    if (!parsed) {
      console.warn('[AI API] OpenAI content was not valid JSON array');
      return new Map();
    }

    const reasons = new Map<string, string>();
    for (const item of parsed) {
      if (!item || typeof item !== 'object') continue;
      const id = (item as { id?: unknown }).id;
      const reason = (item as { reason?: unknown }).reason;
      if (typeof id === 'string' && typeof reason === 'string' && reason.trim()) {
        reasons.set(id, reason.trim());
      }
    }
    return reasons;
  } catch (error) {
    console.warn('[AI API] OpenAI request exception', error);
    return new Map();
  } finally {
    clearTimeout(timeoutId);
  }
}

async function buildRecommendations(input: RecommendationInput) {
  const budget = Number.isFinite(input.budget) ? input.budget : 1000;
  const seats = Number.isFinite(input.seats) ? input.seats : 0;
  const category = input.category || 'All';

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

  const params: Array<string | number> = [];
  if (category !== 'All') {
    sql += ` AND category = $${params.length + 1}`;
    params.push(category);
  }

  if (seats > 0) {
    sql += ` AND seats >= $${params.length + 1}`;
    params.push(seats);
  }

  sql += ` ORDER BY (daily_rate / (CASE WHEN category = 'Luxury' THEN 1.5 ELSE 1.0 END)) ASC LIMIT 5`;

  const cars = (await query(sql, params)) as CarRow[];
  const aiReasons = await generateAiReasons(cars, { budget, seats, category });

  const recommendedCars = cars.map((car) => ({
    ...car,
    ai_reason: aiReasons.get(String(car.id)) || fallbackReason(car, budget),
  }));

  return {
    success: true,
    recommendations: recommendedCars,
    ai_enabled: aiReasons.size > 0,
  };
}

export async function GET(request: Request) {
  try {
    const input = parseInputFromUrl(request);
    const result = await buildRecommendations(input);
    return NextResponse.json(result);
  } catch (error) {
    console.error('[AI API] GET Error:', error);
    return NextResponse.json({ success: false, error: 'AI processing failed' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const input = await parseInputFromBody(request);
    const result = await buildRecommendations(input);
    return NextResponse.json(result);
  } catch (error) {
    console.error('[AI API] POST Error:', error);
    return NextResponse.json({ success: false, error: 'AI processing failed' }, { status: 500 });
  }
}
