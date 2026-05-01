/**
 * AusDrive Premium – Comprehensive Sample Data Seed Script
 * Usage: node scripts/seed-data.mjs
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

async function checkTableExists(tableName) {
  const res = await client.query(`SELECT to_regclass('public."${tableName}"') as result`);
  return res.rows[0].result !== null;
}

async function run() {
  await client.connect();
  console.log('✅ Connected to database');

  // Check what tables exist
  const hasBooking = await checkTableExists('Booking');
  const hasCar = await checkTableExists('Car');
  const hasUser = await checkTableExists('User');
  const hasPayment = await checkTableExists('Payment');
  const hasMaintenance = await checkTableExists('Maintenance') || await checkTableExists('MaintenanceRecord');
  const maintenanceTable = (await checkTableExists('Maintenance')) ? 'Maintenance' : 'MaintenanceRecord';
  const hasAuditLog = await checkTableExists('AuditLog');
  const hasNotification = await checkTableExists('Notification');

  console.log(`Tables found: Car=${hasCar}, User=${hasUser}, Booking=${hasBooking}, Payment=${hasPayment}, Maintenance=${hasMaintenance}(${maintenanceTable}), AuditLog=${hasAuditLog}`);

  // ─── SEED CARS ─────────────────────────────────────────
  if (hasCar) {
    const existingCars = await client.query('SELECT COUNT(*) as count FROM "Car"');
    const carCount = parseInt(existingCars.rows[0].count);

    if (carCount === 0) {
      console.log('Seeding cars...');
      for (const car of CARS) {
        try {
          await client.query(`
            INSERT INTO "Car" (id, make, model, year, rego, color, seats, transmission, "fuelType", mileage, "dailyRate", city, location, "imageUrl", "isAvailable", features, "createdAt", "updatedAt")
            VALUES (gen_random_uuid(), $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, true, $14, NOW() - (random() * interval '200 days')::interval, NOW())
            ON CONFLICT DO NOTHING
          `, [car.make, car.model, car.year, car.rego, car.color, car.seats, car.transmission, car.fuelType, car.mileage, car.dailyRate, car.city, car.location, car.imageUrl, car.features]);
        } catch (e) {
          console.error(`  Failed car ${car.rego}:`, e.message);
        }
      }
      const finalCount = await client.query('SELECT COUNT(*) as count FROM "Car"');
      console.log(`  ✅ Cars seeded: ${finalCount.rows[0].count}`);
    } else {
      console.log(`  ℹ️  Cars already seeded: ${carCount}`);
    }
  }

  // ─── SEED USERS/CUSTOMERS ──────────────────────────────
  if (hasUser) {
    const existingUsers = await client.query("SELECT COUNT(*) as count FROM \"User\" WHERE role IN ('USER','STAFF','ADMIN')");
    const userCount = parseInt(existingUsers.rows[0].count);

    if (userCount < 3) {
      console.log('Seeding customers & staff...');
      const pwHash = await bcrypt.hash('Password123!', 10);
      const allPeople = [...CUSTOMERS, ...STAFF];

      for (const person of allPeople) {
        try {
          await client.query(`
            INSERT INTO "User" (id, name, email, password, phone, role, "isVerified", provider, "createdAt", "updatedAt")
            VALUES (gen_random_uuid(), $1, $2, $3, $4, $5, true, 'email', NOW() - (random() * interval '300 days'), NOW())
            ON CONFLICT (email) DO NOTHING
          `, [person.name, person.email, pwHash, person.phone, person.role]);
        } catch (e) {
          console.error(`  Failed user ${person.email}:`, e.message);
        }
      }
      const finalCount = await client.query("SELECT COUNT(*) as count FROM \"User\" WHERE role='USER'");
      console.log(`  ✅ Customers seeded: ${finalCount.rows[0].count}`);
    } else {
      console.log(`  ℹ️  Users already exist: ${userCount}`);
    }
  }

  // ─── SEED BOOKINGS ─────────────────────────────────────
  if (hasBooking && hasUser && hasCar) {
    const existingBookings = await client.query('SELECT COUNT(*) as count FROM "Booking"');
    const bookingCount = parseInt(existingBookings.rows[0].count);

    if (bookingCount < 5) {
      console.log('Seeding bookings...');
      const cars = await client.query('SELECT id, "dailyRate", rego, make, model FROM "Car" ORDER BY random() LIMIT 20');
      const users = await client.query("SELECT id, name, email, phone FROM \"User\" WHERE role='USER' ORDER BY random() LIMIT 10");

      if (cars.rows.length > 0 && users.rows.length > 0) {
        const statuses = ['ACTIVE', 'COMPLETED', 'CONFIRMED', 'PENDING_PAYMENT', 'CANCELLED', 'OVERDUE'];
        const statusWeights = [3, 4, 2, 2, 1, 1]; // more active and completed
        const locations = ['Sydney CBD', 'Sydney Airport', 'Melbourne CBD', 'Brisbane CBD', 'Perth Airport'];

        let created = 0;
        for (let i = 0; i < 20; i++) {
          try {
            const user = users.rows[i % users.rows.length];
            const car = cars.rows[i % cars.rows.length];
            const daysAgo = Math.floor(Math.random() * 60);
            const duration = Math.floor(Math.random() * 10) + 1;
            const pickupDate = new Date(Date.now() - daysAgo * 86400000);
            const dropoffDate = new Date(pickupDate.getTime() + duration * 86400000);

            let weightSum = 0;
            const rand = Math.random() * statusWeights.reduce((a, b) => a + b, 0);
            let statusIdx = 0;
            for (let j = 0; j < statusWeights.length; j++) {
              weightSum += statusWeights[j];
              if (rand < weightSum) { statusIdx = j; break; }
            }
            const status = statuses[statusIdx];
            const total = parseFloat(car.dailyrate || car.dailyRate || 100) * duration;
            const location = locations[i % locations.length];

            const bRes = await client.query(`
              INSERT INTO "Booking" (id, "userId", "carId", status, "pickupDate", "dropoffDate", "pickupLocation", "dropoffLocation", "totalPrice", "pricePerDay", "createdAt", "updatedAt")
              VALUES (gen_random_uuid(), $1, $2, $3, $4, $5, $6, $6, $7, $8, $9, NOW())
              RETURNING id
            `, [user.id, car.id, status, pickupDate, dropoffDate, location, total, car.dailyRate || car.dailyrate || 100, new Date(Date.now() - daysAgo * 86400000)]);

            // Mark car as rented if booking is active
            if (status === 'ACTIVE') {
              await client.query(`UPDATE "Car" SET "isAvailable"=false WHERE id=$1`, [car.id]);
            }

            // Seed payment for completed/active bookings
            if (hasPayment && (status === 'COMPLETED' || status === 'ACTIVE' || status === 'CONFIRMED')) {
              const payStatus = status === 'COMPLETED' ? 'COMPLETED' : status === 'ACTIVE' ? 'COMPLETED' : 'PENDING';
              await client.query(`
                INSERT INTO "Payment" (id, "bookingId", amount, currency, status, "paymentMethod", "createdAt", "updatedAt")
                VALUES (gen_random_uuid(), $1, $2, 'AUD', $3, 'card', NOW(), NOW())
                ON CONFLICT DO NOTHING
              `, [bRes.rows[0].id, total, payStatus]);
            }

            created++;
          } catch (e) {
            // skip conflicts
          }
        }
        console.log(`  ✅ Bookings seeded: ${created}`);
      }
    } else {
      console.log(`  ℹ️  Bookings already exist: ${bookingCount}`);
    }
  }

  // ─── SEED MAINTENANCE ──────────────────────────────────
  if (hasMaintenance) {
    const tbl = `"${maintenanceTable}"`;
    const existingMaint = await client.query(`SELECT COUNT(*) as count FROM ${tbl}`);
    const maintCount = parseInt(existingMaint.rows[0].count);

    if (maintCount < 3) {
      console.log('Seeding maintenance records...');
      const cars = await client.query('SELECT id, make, model FROM "Car" ORDER BY random() LIMIT 10');

      // Detect columns
      const colRes = await client.query(`SELECT column_name FROM information_schema.columns WHERE table_name='${maintenanceTable}' AND table_schema='public'`);
      const cols = new Set(colRes.rows.map(r => r.column_name));
      const hasCarId = cols.has('carId');
      const hasType = cols.has('serviceType') || cols.has('type');
      const typeCol = cols.has('serviceType') ? 'serviceType' : 'type';
      const hasCost = cols.has('cost');
      const hasStatus = cols.has('status');
      const hasNextDue = cols.has('nextServiceDate') || cols.has('next_due');
      const nextDueCol = cols.has('nextServiceDate') ? 'nextServiceDate' : 'next_due';
      const hasNotes = cols.has('notes');
      const hasServiceDate = cols.has('serviceDate') || cols.has('service_date') || cols.has('scheduledDate');
      const serviceDateCol = cols.has('serviceDate') ? 'serviceDate' : cols.has('service_date') ? 'service_date' : 'scheduledDate';

      const serviceTypes = ['Oil Change', 'Brake Service', 'Tyre Rotation', 'Annual Inspection', 'Air Filter', 'Battery Check', 'Transmission Service'];
      const statuses = ['COMPLETED', 'COMPLETED', 'COMPLETED', 'SCHEDULED', 'IN_PROGRESS'];

      let created = 0;
      for (let i = 0; i < 15; i++) {
        try {
          const car = cars.rows[i % cars.rows.length];
          const serviceDate = new Date(Date.now() - Math.floor(Math.random() * 120) * 86400000);
          const nextDue = new Date(serviceDate.getTime() + 90 * 86400000);
          const status = statuses[i % statuses.length];

          const insertCols = ['id'];
          const insertVals = ['gen_random_uuid()'];
          const params = [];

          if (hasCarId) { insertCols.push('"carId"'); params.push(car.id); insertVals.push(`$${params.length}`); }
          if (hasType) { insertCols.push(`"${typeCol}"`); params.push(serviceTypes[i % serviceTypes.length]); insertVals.push(`$${params.length}`); }
          if (hasCost) { insertCols.push('"cost"'); params.push(Math.floor(Math.random() * 400) + 80); insertVals.push(`$${params.length}`); }
          if (hasStatus) { insertCols.push('"status"'); params.push(status); insertVals.push(`$${params.length}`); }
          if (hasServiceDate) { insertCols.push(`"${serviceDateCol}"`); params.push(serviceDate); insertVals.push(`$${params.length}`); }
          if (hasNextDue) { insertCols.push(`"${nextDueCol}"`); params.push(nextDue); insertVals.push(`$${params.length}`); }
          if (hasNotes) { insertCols.push('"notes"'); params.push(`Routine service for ${car.make} ${car.model}`); insertVals.push(`$${params.length}`); }
          insertCols.push('"createdAt"', '"updatedAt"');
          insertVals.push('NOW()', 'NOW()');

          await client.query(`INSERT INTO ${tbl} (${insertCols.join(',')}) VALUES (${insertVals.join(',')})`, params);
          created++;
        } catch (e) {
          // skip
        }
      }
      console.log(`  ✅ Maintenance records seeded: ${created}`);
    } else {
      console.log(`  ℹ️  Maintenance already exists: ${maintCount}`);
    }
  }

  // ─── SEED AUDIT LOGS ───────────────────────────────────
  if (hasAuditLog) {
    const existingAudit = await client.query('SELECT COUNT(*) as count FROM "AuditLog"');
    const auditCount = parseInt(existingAudit.rows[0].count);

    if (auditCount < 10) {
      console.log('Seeding audit logs...');
      let adminUser = null;
      try {
        const res = await client.query("SELECT id, name FROM \"User\" WHERE role IN ('ADMIN','SUPER_ADMIN') LIMIT 1");
        adminUser = res.rows[0];
      } catch (e) {}

      const colRes = await client.query(`SELECT column_name FROM information_schema.columns WHERE table_name='AuditLog' AND table_schema='public'`);
      const cols = new Set(colRes.rows.map(r => r.column_name));
      const hasAction = cols.has('action');
      const hasModule = cols.has('module');
      const hasUserName = cols.has('userName');
      const hasUserId = cols.has('userId');

      const actions = [
        { action: 'CREATE', module: 'Cars', desc: 'Added new vehicle to fleet' },
        { action: 'UPDATE', module: 'Bookings', desc: 'Updated booking status to ACTIVE' },
        { action: 'CREATE', module: 'Bookings', desc: 'Created new booking' },
        { action: 'PAYMENT_CREATE', module: 'Payments', desc: 'Payment processed successfully' },
        { action: 'LOGIN', module: 'Auth', desc: 'Admin login' },
        { action: 'UPDATE', module: 'Cars', desc: 'Vehicle status changed to MAINTENANCE' },
        { action: 'BOOKING_CONFIRM', module: 'Bookings', desc: 'Booking confirmed' },
        { action: 'UPDATE', module: 'Customers', desc: 'Customer details updated' },
      ];

      let created = 0;
      for (let i = 0; i < 20; i++) {
        try {
          const entry = actions[i % actions.length];
          const insertCols = ['id'];
          const insertVals = ['gen_random_uuid()'];
          const params = [];

          if (hasUserId && adminUser) { insertCols.push('"userId"'); params.push(adminUser.id); insertVals.push(`$${params.length}`); }
          if (hasUserName) { insertCols.push('"userName"'); params.push(adminUser?.name || 'System Admin'); insertVals.push(`$${params.length}`); }
          if (hasAction) { insertCols.push('"action"'); params.push(entry.action); insertVals.push(`$${params.length}::\"AuditAction\"`); }
          if (hasModule) { insertCols.push('"module"'); params.push(entry.module); insertVals.push(`$${params.length}`); }
          insertCols.push('"createdAt"');
          insertVals.push(`NOW() - interval '${i} hours'`);

          await client.query(`INSERT INTO "AuditLog" (${insertCols.join(',')}) VALUES (${insertVals.join(',')})`, params);
          created++;
        } catch (e) {
          // skip
        }
      }
      console.log(`  ✅ Audit logs seeded: ${created}`);
    } else {
      console.log(`  ℹ️  Audit logs already exist: ${auditCount}`);
    }
  }

  // ─── SEED NOTIFICATIONS ────────────────────────────────
  if (hasNotification && hasUser) {
    const existingNotifs = await client.query('SELECT COUNT(*) as count FROM "Notification"');
    const notifCount = parseInt(existingNotifs.rows[0].count);

    if (notifCount < 5) {
      console.log('Seeding notifications...');
      const users = await client.query("SELECT id FROM \"User\" WHERE role='USER' LIMIT 5");
      const colRes = await client.query(`SELECT column_name FROM information_schema.columns WHERE table_name='Notification' AND table_schema='public'`);
      const cols = new Set(colRes.rows.map(r => r.column_name));

      const hasType = cols.has('type');
      const hasChannel = cols.has('channel');
      const hasTitle = cols.has('title');
      const hasMessage = cols.has('message');
      const hasStatus = cols.has('status');

      const templates = [
        { type: 'BOOKING', channel: 'EMAIL', title: 'Booking Confirmed', message: 'Your booking has been confirmed. Pickup ready at Sydney CBD.', status: 'SENT' },
        { type: 'PAYMENT', channel: 'EMAIL', title: 'Payment Received', message: 'Thank you! Your payment of $245.00 has been processed.', status: 'SENT' },
        { type: 'REMINDER', channel: 'SMS', title: 'Return Reminder', message: 'Your vehicle is due for return tomorrow. Please ensure on-time return.', status: 'DELIVERED' },
        { type: 'BOOKING', channel: 'EMAIL', title: 'Booking Cancelled', message: 'Your booking has been cancelled. Refund will be processed in 3-5 days.', status: 'SENT' },
        { type: 'SYSTEM', channel: 'IN_APP', title: 'Welcome to AusDrive', message: 'Welcome! Your account is verified and ready to use.', status: 'DELIVERED' },
      ];

      let created = 0;
      for (let i = 0; i < 12; i++) {
        try {
          const user = users.rows[i % Math.max(1, users.rows.length)];
          const tmpl = templates[i % templates.length];

          const insertCols = ['id'];
          const insertVals = ['gen_random_uuid()'];
          const params = [];

          insertCols.push('"userId"'); params.push(user.id); insertVals.push(`$${params.length}`);
          if (hasType) { insertCols.push('"type"'); params.push(tmpl.type); insertVals.push(`$${params.length}::\"NotificationType\"`); }
          if (hasChannel) { insertCols.push('"channel"'); params.push(tmpl.channel); insertVals.push(`$${params.length}::\"NotificationChannel\"`); }
          if (hasTitle) { insertCols.push('"title"'); params.push(tmpl.title); insertVals.push(`$${params.length}`); }
          if (hasMessage) { insertCols.push('"message"'); params.push(tmpl.message); insertVals.push(`$${params.length}`); }
          if (hasStatus) { insertCols.push('"status"'); params.push(tmpl.status); insertVals.push(`$${params.length}::\"NotificationStatus\"`); }
          insertCols.push('"createdAt"');
          insertVals.push(`NOW() - interval '${i * 3} hours'`);

          await client.query(`INSERT INTO "Notification" (${insertCols.join(',')}) VALUES (${insertVals.join(',')})`, params);
          created++;
        } catch (e) {
          // skip
        }
      }
      console.log(`  ✅ Notifications seeded: ${created}`);
    } else {
      console.log(`  ℹ️  Notifications already exist: ${notifCount}`);
    }
  }

  await client.end();
  console.log('\n🎉 Seed complete! Refresh your admin dashboard.');
}

run().catch(async (e) => {
  console.error('Seed failed:', e.message);
  await client.end().catch(() => {});
  process.exit(1);
});
