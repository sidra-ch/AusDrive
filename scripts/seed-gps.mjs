/**
 * GPS Seed – populates latitude/longitude on existing Car records
 * and seeds GPSLog entries for live tracking demo.
 */
import pg from "pg";
import { config } from "dotenv";
config({ path: ".env.local" });

const client = new pg.Client({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

// City center coordinates (lat, lng) with small random spread
const CITY_COORDS = {
  Sydney:    { lat: -33.8688, lng: 151.2093 },
  Melbourne: { lat: -37.8136, lng: 144.9631 },
  Brisbane:  { lat: -27.4698, lng: 153.0251 },
  Perth:     { lat: -31.9505, lng: 115.8605 },
  Adelaide:  { lat: -34.9285, lng: 138.6007 },
  Canberra:  { lat: -35.2809, lng: 149.1300 },
  Hobart:    { lat: -42.8821, lng: 147.3272 },
  Darwin:    { lat: -12.4634, lng: 130.8456 },
};

function spread(base, range = 0.08) {
  return base + (Math.random() - 0.5) * range * 2;
}

await client.connect();

// Get all cars
const cars = await client.query(`SELECT id, city FROM "Car"`);
console.log(`Updating ${cars.rows.length} cars with GPS coordinates...`);

let updated = 0;
for (const car of cars.rows) {
  const city = car.city || "Sydney";
  const base = CITY_COORDS[city] ?? CITY_COORDS.Sydney;
  const lat = spread(base.lat, 0.06);
  const lng = spread(base.lng, 0.08);

  await client.query(
    `UPDATE "Car" SET latitude=$1, longitude=$2, "lastGpsUpdate"=NOW() WHERE id=$3`,
    [lat, lng, car.id]
  );
  updated++;
}
console.log(`✓ Updated ${updated} cars with lat/lng`);

// Seed GPSLog entries (3-5 per car for history)
const carIds = cars.rows.map(r => r.id);
let logCount = 0;

for (const carId of carIds) {
  const city = cars.rows.find(r => r.id === carId)?.city || "Sydney";
  const base = CITY_COORDS[city] ?? CITY_COORDS.Sydney;

  // Check if GPSLog already has entries for this car
  const existing = await client.query(
    `SELECT COUNT(*) FROM "GPSLog" WHERE "carId"=$1`,
    [carId]
  );
  if (Number(existing.rows[0].count) > 0) continue;

  // 4 history entries per car (every 5 minutes)
  for (let i = 3; i >= 0; i--) {
    const lat = spread(base.lat, 0.04);
    const lng = spread(base.lng, 0.05);
    const speed = Math.floor(Math.random() * 80);
    const ts = new Date(Date.now() - i * 5 * 60000);

    await client.query(
      `INSERT INTO "GPSLog" (id, "carId", latitude, longitude, speed, "timestamp")
       VALUES (gen_random_uuid(), $1, $2, $3, $4, $5)`,
      [carId, lat, lng, speed, ts]
    );
    logCount++;
  }
}
console.log(`✓ Inserted ${logCount} GPSLog entries`);

await client.end();
console.log("🗺  GPS seed complete! Live map should now show all vehicles.");
