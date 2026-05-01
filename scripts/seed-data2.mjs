/**
 * AusDrive Premium – Seed Script (NeonDB-compatible)
 * Actual columns from DB inspection:
 *   Car: id, make, model, year, rego, color, seats, transmission, fuelType,
 *        mileage, dailyRate, city, location, imageUrl, features(text), isAvailable,
 *        latitude, longitude, lastGpsUpdate, rating, deals, createdAt, updatedAt
 *   User: id, name, email, password, provider, isVerified, role, phone,
 *         profileImage, licenseNumber, licenseExpiry, createdAt, updatedAt
 *   Booking: id, userId, carId, status, pickupDate, dropoffDate,
 *            pickupLocation, dropoffLocation, totalPrice, pricePerDay,
 *            discountCode, discountAmount, specialRequests, createdAt, updatedAt
 *   Payment: id, bookingId, stripePaymentId, amount, currency, status,
 *            paymentMethod, createdAt, updatedAt
 *   Maintenance: id, carId, type, description, cost, serviceDate, nextDueDate,
 *                status, notes, createdAt
 */

import pg from 'pg';
import bcrypt from 'bcryptjs';
import { config } from 'dotenv';

config({ path: '.env.local' });

const client = new pg.Client({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

const CARS = [
  { make: 'Toyota', model: 'Camry', year: 2023, rego: 'ABC-123', transmission: 'Automatic', fuelType: 'Petrol', seats: 5, color: 'Pearl White', dailyRate: 89, city: 'Sydney', location: 'Sydney CBD Branch', mileage: 12400, features: 'Air Conditioning, Bluetooth, GPS, Backup Camera', imageUrl: 'https://images.unsplash.com/photo-1621007947382-bb3c3994e3fb?w=600' },
  { make: 'Toyota', model: 'RAV4', year: 2023, rego: 'XYZ-456', transmission: 'Automatic', fuelType: 'Hybrid', seats: 5, color: 'Graphite', dailyRate: 120, city: 'Sydney', location: 'Sydney CBD Branch', mileage: 8900, features: 'Air Conditioning, Bluetooth, GPS, AWD', imageUrl: 'https://images.unsplash.com/photo-1612825173281-9a193378527e?w=600' },
  { make: 'Mercedes-Benz', model: 'C300', year: 2022, rego: 'LUX-001', transmission: 'Automatic', fuelType: 'Petrol', seats: 5, color: 'Obsidian Black', dailyRate: 199, city: 'Sydney', location: 'Sydney Airport Branch', mileage: 22000, features: 'Leather Seats, Sunroof, Premium Sound, GPS', imageUrl: 'https://images.unsplash.com/photo-1618843479313-40f8afb4b4d8?w=600' },
  { make: 'BMW', model: 'X5', year: 2023, rego: 'BMW-500', transmission: 'Automatic', fuelType: 'Petrol', seats: 7, color: 'Alpine White', dailyRate: 249, city: 'Melbourne', location: 'Melbourne CBD Branch', mileage: 15600, features: 'Panoramic Roof, Heated Seats, Harman Kardon', imageUrl: 'https://images.unsplash.com/photo-1556189250-72ba954cfc2b?w=600' },
  { make: 'Hyundai', model: 'i30', year: 2022, rego: 'HYU-200', transmission: 'Automatic', fuelType: 'Petrol', seats: 5, color: 'Phantom Black', dailyRate: 65, city: 'Sydney', location: 'Parramatta Branch', mileage: 31200, features: 'Apple CarPlay, Android Auto, Reverse Camera', imageUrl: 'https://images.unsplash.com/photo-1503376780353-7e6692767b70?w=600' },
  { make: 'Tesla', model: 'Model 3', year: 2023, rego: 'TSL-A01', transmission: 'Automatic', fuelType: 'Electric', seats: 5, color: 'Midnight Silver', dailyRate: 159, city: 'Melbourne', location: 'Southbank Branch', mileage: 9800, features: 'Autopilot, Full Self-Driving, Premium Audio', imageUrl: 'https://images.unsplash.com/photo-1560958089-b8a1929cea89?w=600' },
  { make: 'Ford', model: 'Ranger', year: 2023, rego: 'FRD-001', transmission: 'Automatic', fuelType: 'Diesel', seats: 5, color: 'Silver Fox', dailyRate: 130, city: 'Perth', location: 'Perth Airport Branch', mileage: 18700, features: '4WD, Tow Package, Bull Bar, Snorkel', imageUrl: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=600' },
  { make: 'Mazda', model: 'CX-5', year: 2022, rego: 'MZD-301', transmission: 'Automatic', fuelType: 'Petrol', seats: 5, color: 'Soul Red Crystal', dailyRate: 105, city: 'Brisbane', location: 'Brisbane CBD Branch', mileage: 25400, features: 'Bose Sound, Leather, Heads-Up Display', imageUrl: 'https://images.unsplash.com/photo-1585399000684-d2f72660f092?w=600' },
  { make: 'Volkswagen', model: 'Golf', year: 2022, rego: 'VWG-001', transmission: 'Automatic', fuelType: 'Petrol', seats: 5, color: 'Deep Black', dailyRate: 72, city: 'Adelaide', location: 'Adelaide Branch', mileage: 28900, features: 'Apple CarPlay, Parking Sensors, LED Lights', imageUrl: 'https://images.unsplash.com/photo-1471444928139-48c5bf5173f8?w=600' },
  { make: 'Audi', model: 'A4', year: 2023, rego: 'AUD-400', transmission: 'Automatic', fuelType: 'Petrol', seats: 5, color: 'Glacier White', dailyRate: 185, city: 'Sydney', location: 'Sydney CBD Branch', mileage: 11200, features: 'Virtual Cockpit, Bang & Olufsen, Quattro AWD', imageUrl: 'https://images.unsplash.com/photo-1603584173870-7f23fdae1b7a?w=600' },
  { make: 'Toyota', model: 'HiLux', year: 2023, rego: 'HIL-001', transmission: 'Manual', fuelType: 'Diesel', seats: 5, color: 'Graphite', dailyRate: 125, city: 'Perth', location: 'Perth CBD Branch', mileage: 15300, features: '4WD, Tow Bar, Canopy, Bluetooth', imageUrl: 'https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?w=600' },
  { make: 'Kia', model: 'Sportage', year: 2023, rego: 'KIA-001', transmission: 'Automatic', fuelType: 'Petrol', seats: 5, color: 'Aurora Black', dailyRate: 98, city: 'Melbourne', location: 'Melbourne Airport Branch', mileage: 7600, features: 'Wireless Charging, Smart Cruise Control', imageUrl: 'https://images.unsplash.com/photo-1616422285623-13ff0162193c?w=600' },
  { make: 'Honda', model: 'CR-V', year: 2022, rego: 'HON-001', transmission: 'Automatic', fuelType: 'Hybrid', seats: 7, color: 'Lunar Silver', dailyRate: 110, city: 'Sydney', location: 'Parramatta Branch', mileage: 21500, features: 'Honda Sensing, Magic Seat, Panoramic Roof', imageUrl: 'https://images.unsplash.com/photo-1502877338535-766e1452684a?w=600' },
  { make: 'Nissan', model: 'X-Trail', year: 2022, rego: 'NIS-001', transmission: 'CVT', fuelType: 'Petrol', seats: 7, color: 'Diamond White', dailyRate: 100, city: 'Brisbane', location: 'Gold Coast Branch', mileage: 33800, features: 'ProPILOT Assist, 360 Camera, Tri-Zone Climate', imageUrl: 'https://images.unsplash.com/photo-1609521263047-f8f205293f24?w=600' },
  { make: 'Porsche', model: 'Cayenne', year: 2023, rego: 'POR-001', transmission: 'Automatic', fuelType: 'Petrol', seats: 5, color: 'Jet Black', dailyRate: 349, city: 'Sydney', location: 'Sydney CBD Branch', mileage: 6200, features: 'Sport Chrono, Bose Surround, Air Suspension', imageUrl: 'https://images.unsplash.com/photo-1503376780353-7e6692767b70?w=600' },
  { make: 'Mitsubishi', model: 'Outlander', year: 2022, rego: 'MIT-001', transmission: 'Automatic', fuelType: 'Plug-in Hybrid', seats: 7, color: 'Sterling Silver', dailyRate: 115, city: 'Canberra', location: 'Canberra Branch', mileage: 14200, features: 'PHEV, Triple-Motor AWD, 20-inch Wheels', imageUrl: 'https://images.unsplash.com/photo-1601362840469-51e4d8d58785?w=600' },
  { make: 'Subaru', model: 'Forester', year: 2022, rego: 'SUB-001', transmission: 'CVT', fuelType: 'Petrol', seats: 5, color: 'Crystal White', dailyRate: 95, city: 'Hobart', location: 'Hobart Branch', mileage: 19800, features: 'EyeSight, Symmetrical AWD, X-Mode', imageUrl: 'https://images.unsplash.com/photo-1547744152-14d985cb937f?w=600' },
  { make: 'Toyota', model: 'Corolla', year: 2023, rego: 'COR-001', transmission: 'Automatic', fuelType: 'Hybrid', seats: 5, color: 'Ash Grey', dailyRate: 75, city: 'Sydney', location: 'Bondi Branch', mileage: 10500, features: 'Toyota Safety Sense, Apple CarPlay, Wireless Charge', imageUrl: 'https://images.unsplash.com/photo-1549317661-bd32c8ce0db2?w=600' },
  { make: 'Lexus', model: 'RX 350', year: 2022, rego: 'LEX-001', transmission: 'Automatic', fuelType: 'Petrol', seats: 5, color: 'Eminent White', dailyRate: 220, city: 'Melbourne', location: 'Melbourne CBD Branch', mileage: 17900, features: 'Mark Levinson Audio, HUD, Panoramic Roof', imageUrl: 'https://images.unsplash.com/photo-1549317661-bd32c8ce0db2?w=600' },
  { make: 'Volkswagen', model: 'Tiguan', year: 2023, rego: 'TIG-001', transmission: 'Automatic', fuelType: 'Petrol', seats: 7, color: 'Reflex Silver', dailyRate: 112, city: 'Perth', location: 'Fremantle Branch', mileage: 23100, features: 'Digital Cockpit, Dynaudio Sound, 4MOTION AWD', imageUrl: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=600' },
  { make: 'Toyota', model: 'Land Cruiser Prado', year: 2022, rego: 'PRA-001', transmission: 'Automatic', fuelType: 'Diesel', seats: 7, color: 'Glacier White', dailyRate: 165, city: 'Darwin', location: 'Darwin Branch', mileage: 45600, features: '4WD, Kinetic Dynamic Suspension, Crawl Control', imageUrl: 'https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?w=600' },
  { make: 'Mercedes-Benz', model: 'GLE 350', year: 2023, rego: 'GLE-001', transmission: 'Automatic', fuelType: 'Petrol', seats: 5, color: 'Selenite Grey', dailyRate: 280, city: 'Sydney', location: 'Sydney CBD Branch', mileage: 8100, features: 'AMG Line, Burmester Sound, E-Active Body Control', imageUrl: 'https://images.unsplash.com/photo-1618843479313-40f8afb4b4d8?w=600' },
  { make: 'Hyundai', model: 'Tucson', year: 2022, rego: 'TUC-001', transmission: 'Automatic', fuelType: 'Hybrid', seats: 5, color: 'Phantom Black', dailyRate: 102, city: 'Brisbane', location: 'Sunshine Coast Branch', mileage: 28300, features: 'SmartSense Safety, Heated Seats, Wireless Pad', imageUrl: 'https://images.unsplash.com/photo-1612825173281-9a193378527e?w=600' },
  { make: 'Ford', model: 'Mustang', year: 2022, rego: 'MUS-001', transmission: 'Automatic', fuelType: 'Petrol', seats: 4, color: 'Race Red', dailyRate: 175, city: 'Sydney', location: 'Sydney CBD Branch', mileage: 6800, features: 'V8 5.0L, Recaro Seats, B&O Audio, Track Apps', imageUrl: 'https://images.unsplash.com/photo-1584345604476-8ec5e12e42dd?w=600' },
  { make: 'BMW', model: '3 Series', year: 2023, rego: 'BMW-300', transmission: 'Automatic', fuelType: 'Petrol', seats: 5, color: 'Mineral White', dailyRate: 175, city: 'Melbourne', location: 'Richmond Branch', mileage: 13400, features: 'M Sport, Harman Kardon, Gesture Control', imageUrl: 'https://images.unsplash.com/photo-1555215695-3004980ad54e?w=600' },
];

const CUSTOMERS = [
  { name: 'James Wilson', email: 'james.wilson@gmail.com', phone: '0412345678', role: 'USER' },
  { name: 'Sarah Chen', email: 'sarah.chen@outlook.com', phone: '0423456789', role: 'USER' },
  { name: 'Michael Thompson', email: 'michael.t@yahoo.com', phone: '0434567890', role: 'USER' },
  { name: 'Emma Williams', email: 'emma.w@gmail.com', phone: '0445678901', role: 'USER' },
  { name: 'David Brown', email: 'david.b@hotmail.com', phone: '0456789012', role: 'USER' },
  { name: 'Olivia Martinez', email: 'olivia.m@gmail.com', phone: '0467890123', role: 'USER' },
  { name: 'Noah Davies', email: 'noah.d@outlook.com', phone: '0478901234', role: 'USER' },
  { name: 'Sophia Johnson', email: 'sophia.j@gmail.com', phone: '0489012345', role: 'USER' },
  { name: 'Liam Anderson', email: 'liam.a@gmail.com', phone: '0490123456', role: 'USER' },
  { name: 'Charlotte Taylor', email: 'charlotte.t@outlook.com', phone: '0401234567', role: 'USER' },
  { name: 'Benjamin White', email: 'ben.white@icloud.com', phone: '0411111111', role: 'USER' },
  { name: 'Isabella Harris', email: 'isabella.h@gmail.com', phone: '0422222222', role: 'USER' },
];

const STAFF = [
  { name: 'Alex Rodriguez', email: 'alex.r@ausdrive.com.au', phone: '0411000001', role: 'STAFF' },
  { name: 'Jessica Lee', email: 'jessica.l@ausdrive.com.au', phone: '0411000002', role: 'STAFF' },
  { name: 'Mark Parker', email: 'mark.p@ausdrive.com.au', phone: '0411000003', role: 'ADMIN' },
];

async function tableExists(name) {
  const r = await client.query(`SELECT to_regclass($1) AS t`, [`public."${name}"`]);
  return r.rows[0].t !== null;
}

async function run() {
  await client.connect();
  console.log('Connected to database');

  const hasCar = await tableExists('Car');
  const hasUser = await tableExists('User');
  const hasBooking = await tableExists('Booking');
  const hasPayment = await tableExists('Payment');
  const hasMaintenance = await tableExists('Maintenance');

  console.log(`Tables: Car=${hasCar}, User=${hasUser}, Booking=${hasBooking}, Payment=${hasPayment}, Maintenance=${hasMaintenance}`);

  // ─── CARS ──────────────────────────────────────────────
  if (hasCar) {
    const { rows: [{ count }] } = await client.query('SELECT COUNT(*) as count FROM "Car"');
    if (parseInt(count) > 0) {
      console.log(`Cars already seeded: ${count}`);
    } else {
      console.log('Seeding cars...');
      let ok = 0;
      for (const c of CARS) {
        try {
          await client.query(
            `INSERT INTO "Car" (id, make, model, year, rego, color, seats, transmission,
               "fuelType", mileage, "dailyRate", city, location, "imageUrl", features,
               "isAvailable", "createdAt", "updatedAt")
             VALUES (gen_random_uuid(),$1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,
               true, NOW()-(random()*interval'365 days'), NOW())
             ON CONFLICT (rego) DO NOTHING`,
            [c.make, c.model, c.year, c.rego, c.color, c.seats, c.transmission,
             c.fuelType, c.mileage, c.dailyRate, c.city, c.location, c.imageUrl, c.features]
          );
          ok++;
        } catch (e) {
          console.error(`  Car ${c.rego}: ${e.message}`);
        }
      }
      const after = await client.query('SELECT COUNT(*) as count FROM "Car"');
      console.log(`  Cars seeded: ${after.rows[0].count} (${ok} inserts attempted)`);
    }
  }

  // ─── USERS ─────────────────────────────────────────────
  if (hasUser) {
    const { rows: [{ count }] } = await client.query(`SELECT COUNT(*) as count FROM "User" WHERE role IN ('USER','STAFF','ADMIN')`);
    if (parseInt(count) >= 5) {
      console.log(`Users already seeded: ${count}`);
    } else {
      console.log('Seeding users...');
      const pwHash = await bcrypt.hash('Password123!', 10);
      let ok = 0;
      for (const p of [...CUSTOMERS, ...STAFF]) {
        try {
          await client.query(
            `INSERT INTO "User" (id, name, email, password, phone, role,
               "isVerified", provider, "createdAt", "updatedAt")
             VALUES (gen_random_uuid(),$1,$2,$3,$4,$5,true,'email',
               NOW()-(random()*interval'300 days'),NOW())
             ON CONFLICT (email) DO NOTHING`,
            [p.name, p.email, pwHash, p.phone, p.role]
          );
          ok++;
        } catch (e) {
          console.error(`  User ${p.email}: ${e.message}`);
        }
      }
      const after = await client.query(`SELECT COUNT(*) as count FROM "User" WHERE role='USER'`);
      console.log(`  Customers seeded: ${after.rows[0].count}`);
    }
  }

  // ─── BOOKINGS ──────────────────────────────────────────
  if (hasBooking && hasUser && hasCar) {
    const { rows: [{ count }] } = await client.query('SELECT COUNT(*) as count FROM "Booking"');
    if (parseInt(count) >= 5) {
      console.log(`Bookings already seeded: ${count}`);
    } else {
      console.log('Seeding bookings...');
      const { rows: cars } = await client.query('SELECT id, "dailyRate", rego, make, model FROM "Car" ORDER BY random() LIMIT 20');
      const { rows: users } = await client.query(`SELECT id FROM "User" WHERE role='USER' ORDER BY random() LIMIT 10`);

      if (!cars.length || !users.length) {
        console.log('  No cars or users yet, skipping bookings');
      } else {
        const statuses = ['ACTIVE','COMPLETED','CONFIRMED','PENDING','CANCELLED'];
        const locs = ['Sydney CBD','Sydney Airport','Melbourne CBD','Brisbane CBD','Perth Airport'];
        let created = 0;

        for (let i = 0; i < 20; i++) {
          try {
            const user = users[i % users.length];
            const car = cars[i % cars.length];
            const daysAgo = Math.floor(Math.random() * 60);
            const duration = Math.floor(Math.random() * 10) + 1;
            const pickupDate = new Date(Date.now() - daysAgo * 86400000);
            const dropoffDate = new Date(pickupDate.getTime() + duration * 86400000);
            const status = statuses[i % statuses.length];
            const dailyRate = parseFloat(car.dailyRate || 100);
            const total = dailyRate * duration;
            const loc = locs[i % locs.length];

            const { rows: [bk] } = await client.query(
              `INSERT INTO "Booking" (id, "userId", "carId",
                 "pickupDate", "dropoffDate", "pickupLocation", "dropoffLocation",
                 status, "totalPrice", "pricePerDay", "createdAt", "updatedAt")
               VALUES (gen_random_uuid(),$1,$2,$3,$4,$5,$5,$6,$7,$8,$9,NOW())
               RETURNING id`,
              [user.id, car.id, pickupDate, dropoffDate, loc, status, total, dailyRate,
               new Date(Date.now() - daysAgo * 86400000)]
            );

            if (status === 'ACTIVE') {
              await client.query(`UPDATE "Car" SET "isAvailable"=false WHERE id=$1`, [car.id]);
            }

            if (hasPayment && (status === 'COMPLETED' || status === 'ACTIVE' || status === 'CONFIRMED')) {
              const payStatus = status === 'COMPLETED' ? 'completed' : 'pending';
              await client.query(
                `INSERT INTO "Payment" (id, "bookingId", amount, currency, status, "paymentMethod", "createdAt", "updatedAt")
                 VALUES (gen_random_uuid(),$1,$2,'AUD',$3,'card',NOW(),NOW())
                 ON CONFLICT ("bookingId") DO NOTHING`,
                [bk.id, total, payStatus]
              );
            }

            created++;
          } catch (e) {
            // skip individual failures silently
          }
        }
        console.log(`  Bookings seeded: ${created}`);
      }
    }
  }

  // ─── MAINTENANCE ───────────────────────────────────────
  if (hasMaintenance) {
    const { rows: [{ count }] } = await client.query('SELECT COUNT(*) as count FROM "Maintenance"');
    if (parseInt(count) >= 5) {
      console.log(`Maintenance already seeded: ${count}`);
    } else {
      console.log('Seeding maintenance records...');
      const { rows: cars } = await client.query('SELECT id, make, model FROM "Car" ORDER BY random() LIMIT 10');
      const types = ['Oil Change','Brake Service','Tyre Rotation','Annual Inspection','Battery Check','Air Filter'];
      const statuses = ['COMPLETED','COMPLETED','COMPLETED','SCHEDULED','IN_PROGRESS'];
      let created = 0;

      for (let i = 0; i < 15; i++) {
        try {
          const car = cars[i % cars.length];
          const serviceDate = new Date(Date.now() - Math.floor(Math.random() * 120) * 86400000);
          const nextDueDate = new Date(serviceDate.getTime() + 90 * 86400000);
          await client.query(
            `INSERT INTO "Maintenance" (id, "carId", type, description, cost, "serviceDate", "nextDueDate", status, notes, "createdAt")
             VALUES (gen_random_uuid(),$1,$2,$3,$4,$5,$6,$7,$8,NOW())`,
            [car.id, types[i % types.length], `Routine ${types[i % types.length]} for ${car.make} ${car.model}`,
             Math.floor(Math.random() * 400) + 80, serviceDate, nextDueDate, statuses[i % statuses.length],
             `Service completed at ${['Sydney', 'Melbourne', 'Brisbane'][i % 3]} workshop`]
          );
          created++;
        } catch (e) {
          // skip
        }
      }
      console.log(`  Maintenance seeded: ${created}`);
    }
  }

  await client.end();
  console.log('\nSeed complete!');
}

run().catch(e => {
  console.error('Seed failed:', e.message);
  process.exit(1);
});
