require('dotenv').config();
const bcrypt = require('bcrypt');
const pool   = require('./db');

// ── Data ──────────────────────────────────────────────────────────────────────

const demoUsers = [
  { name: 'Budi Santoso',  email: 'budi@tripmate.id', password: 'Demo1234' },
  { name: 'Siti Rahayu',   email: 'siti@tripmate.id', password: 'Demo1234' },
];

const budiJournals = [
  {
    title: 'Sunrise di Bromo yang Menakjubkan',
    destination: 'Bromo, Jawa Timur',
    date: '2026-01-15',
    description: 'Perjalanan tak terlupakan menuju puncak Bromo. Kami berangkat pukul 03.00 dini hari untuk mengejar sunrise. Udara dingin menusuk tulang namun semua terbayar saat matahari perlahan muncul di balik cakrawala dengan semburat warna oranye keemasan yang memukau.',
    latitude: -7.9425, longitude: 112.9530,
  },
  {
    title: 'Menjelajahi Keajaiban Bawah Laut Raja Ampat',
    destination: 'Raja Ampat, Papua Barat',
    date: '2026-02-20',
    description: 'Raja Ampat adalah surga tersembunyi di ujung timur Indonesia. Snorkeling di sini bagaikan berenang di akuarium raksasa dengan ribuan ikan warna-warni dan terumbu karang yang masih sangat terjaga keasliannya.',
    latitude: -0.2330, longitude: 130.5260,
  },
  {
    title: 'Petualangan Kuliner di Yogyakarta',
    destination: 'Yogyakarta, DIY',
    date: '2026-03-05',
    description: 'Yogyakarta bukan hanya tentang Borobudur dan Prambanan. Kota ini menyimpan kekayaan kuliner yang luar biasa. Dari gudeg Bu Tjitro yang legendaris hingga bakpia fresh dari oven di Pathuk.',
    latitude: -7.7956, longitude: 110.3695,
  },
  {
    title: 'Sunset Romantis di Labuan Bajo',
    destination: 'Labuan Bajo, NTT',
    date: '2026-03-18',
    description: 'Dermaga Labuan Bajo menjadi tempat favorit kami menyaksikan sunset. Langit berubah menjadi kanvas raksasa dengan gradasi warna merah, oranye, dan ungu yang memantul indah di permukaan laut Flores.',
    latitude: -8.4539, longitude: 119.8840,
  },
  {
    title: 'Berselancar di Pantai Kuta Lombok',
    destination: 'Lombok, NTB',
    date: '2026-04-01',
    description: 'Berbeda dari Kuta Bali yang ramai, Kuta Lombok masih menawarkan ketenangan dan ombak yang sempurna untuk berselancar. Pasir putih yang bersih dan air biru jernih membuat tempat ini benar-benar surga bagi para surfer.',
    latitude: -8.8955, longitude: 116.2686,
  },
];

const sitiJournals = [
  {
    title: 'Wisata Budaya Keraton Yogyakarta',
    destination: 'Yogyakarta, DIY',
    date: '2026-02-10',
    description: 'Mengunjungi Keraton Yogyakarta memberikan pengalaman menyelami budaya Jawa yang kaya. Guide lokal kami menjelaskan sejarah panjang kesultanan dengan sangat menarik.',
    latitude: -7.8052, longitude: 110.3642,
  },
  {
    title: 'Snorkeling di Gili Trawangan',
    destination: 'Gili Islands, NTB',
    date: '2026-03-12',
    description: 'Gili Trawangan adalah destinasi impian para backpacker. Tidak ada kendaraan bermotor di sini, hanya cidomo dan sepeda. Snorkeling di sekitar gili menemukan penyu-penyu yang berenang bebas.',
    latitude: -8.3522, longitude: 116.0378,
  },
  {
    title: 'Hiking ke Kawah Ijen',
    destination: 'Banyuwangi, Jawa Timur',
    date: '2026-04-05',
    description: 'Blue fire Kawah Ijen adalah fenomena alam langka yang hanya ada dua di dunia. Kami hiking tengah malam dengan headlamp untuk menyaksikan api biru memukau yang keluar dari kawah belerang.',
    latitude: -8.0583, longitude: 114.2422,
  },
];

const sampleDestinations = [
  {
    name: 'Bali Paradise Resort',      province: 'Bali',          category: 'hotel',
    price_per_night: 850000,  rating: 4.8,
    description: 'Resort mewah di tepi pantai Seminyak dengan pemandangan sunset yang memukau',
    image_url: 'https://images.unsplash.com/photo-1537996194471-e657df975ab4?w=800',
  },
  {
    name: 'Explore Yogyakarta',         province: 'DI Yogyakarta', category: 'tur',
    price_per_night: 450000,  rating: 4.7,
    description: 'Paket wisata Candi Borobudur, Prambanan dan Keraton Yogyakarta bersama pemandu profesional',
    image_url: 'https://images.unsplash.com/photo-1555400038-63f5ba517a47?w=800',
  },
  {
    name: 'Raja Ampat Dive Resort',     province: 'Papua Barat',   category: 'hotel',
    price_per_night: 1200000, rating: 4.9,
    description: 'Resort selam eksklusif di jantung segitiga terumbu karang dunia',
    image_url: 'https://images.unsplash.com/photo-1516690561799-46d8f74f9abf?w=800',
  },
  {
    name: 'Labuan Bajo Adventure',      province: 'NTT',           category: 'tur',
    price_per_night: 650000,  rating: 4.6,
    description: 'Paket petualangan Komodo Island, Pink Beach dan snorkeling di perairan Flores',
    image_url: 'https://images.unsplash.com/photo-1544551763-46a013bb70d5?w=800',
  },
  {
    name: 'Lombok Surf Villa',          province: 'NTB',           category: 'hotel',
    price_per_night: 750000,  rating: 4.5,
    description: 'Villa tepi pantai dengan akses langsung ke spot surfing terbaik di Lombok',
    image_url: 'https://images.unsplash.com/photo-1573843981267-be1999ff37cd?w=800',
  },
  {
    name: 'Bromo Tengger Camp',         province: 'Jawa Timur',    category: 'tur',
    price_per_night: 350000,  rating: 4.7,
    description: 'Paket camping dan sunrise tour di kawasan Taman Nasional Bromo Tengger Semeru',
    image_url: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800',
  },
];

// Bookings reference destination by name for readability
const budiBookings = [
  {
    destination_name: 'Bali Paradise Resort',
    check_in_date: '2026-05-10', check_out_date: '2026-05-13',
    status: 'confirmed', payment_method: 'dompet_digital',
  },
  {
    destination_name: 'Explore Yogyakarta',
    check_in_date: '2026-06-01', check_out_date: '2026-06-03',
    status: 'confirmed', payment_method: 'transfer',
  },
];

// ── Helpers ───────────────────────────────────────────────────────────────────

function generateBookingCode() {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let code = '';
  for (let i = 0; i < 8; i++) code += chars[Math.floor(Math.random() * chars.length)];
  return code;
}

async function uniqueBookingCode(conn) {
  let code, exists;
  do {
    code = generateBookingCode();
    const [[row]] = await conn.query('SELECT id FROM bookings WHERE booking_code = ?', [code]);
    exists = !!row;
  } while (exists);
  return code;
}

// ── Seed sections ─────────────────────────────────────────────────────────────

async function seedUsers(conn) {
  console.log('👤 Seeding users...');
  const ids = {};
  for (const u of demoUsers) {
    const [[existing]] = await conn.query('SELECT id FROM users WHERE email = ?', [u.email]);
    if (existing) {
      console.log(`  ✓ "${u.email}" already exists (id: ${existing.id})`);
      ids[u.email] = existing.id;
    } else {
      const hash = await bcrypt.hash(u.password, 10);
      const [r] = await conn.query(
        'INSERT INTO users (name, email, password) VALUES (?, ?, ?)',
        [u.name, u.email, hash]
      );
      ids[u.email] = r.insertId;
      console.log(`  ✓ Created "${u.name}" (id: ${r.insertId})`);
    }
  }
  return ids;
}

async function seedJournals(conn, userId, journals, label) {
  console.log(`\n📖 Seeding journals for ${label}...`);
  const ids = [];
  for (const j of journals) {
    const [[existing]] = await conn.query(
      'SELECT id FROM journals WHERE user_id = ? AND title = ?', [userId, j.title]
    );
    if (existing) {
      console.log(`  ✓ "${j.title}" already exists (id: ${existing.id})`);
      ids.push(existing.id);
    } else {
      const [r] = await conn.query(
        `INSERT INTO journals (user_id, title, destination, date, description, latitude, longitude)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [userId, j.title, j.destination, j.date, j.description, j.latitude, j.longitude]
      );
      ids.push(r.insertId);
      console.log(`  ✓ Created "${j.title}" (id: ${r.insertId})`);
    }
  }
  return ids;
}

async function seedLikes(conn, fromUserId, journalIds, fromLabel) {
  console.log(`\n❤️  Seeding likes from ${fromLabel}...`);
  for (const jid of journalIds) {
    const [[existing]] = await conn.query(
      'SELECT id FROM likes WHERE user_id = ? AND journal_id = ?', [fromUserId, jid]
    );
    if (existing) {
      console.log(`  ✓ Like already exists (journal: ${jid})`);
    } else {
      await conn.query('INSERT INTO likes (user_id, journal_id) VALUES (?, ?)', [fromUserId, jid]);
      console.log(`  ✓ Liked journal ${jid}`);
    }
  }
}

async function seedDestinations(conn) {
  console.log('\n🌍 Seeding destinations...');
  const ids = {};
  for (const d of sampleDestinations) {
    const [[existing]] = await conn.query('SELECT id FROM destinations WHERE name = ?', [d.name]);
    if (existing) {
      console.log(`  ✓ "${d.name}" already exists (id: ${existing.id})`);
      ids[d.name] = existing.id;
    } else {
      const [r] = await conn.query(
        `INSERT INTO destinations (name, province, category, price_per_night, rating, description, image_url)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [d.name, d.province, d.category, d.price_per_night, d.rating, d.description, d.image_url]
      );
      ids[d.name] = r.insertId;
      console.log(`  ✓ Created "${d.name}" (id: ${r.insertId})`);
    }
  }
  return ids;
}

async function seedBookings(conn, userId, destIds) {
  console.log('\n🎫 Seeding bookings for budi@tripmate.id...');
  const bookingIds = [];
  for (const b of budiBookings) {
    const destId = destIds[b.destination_name];
    if (!destId) {
      console.warn(`  ⚠ Destination "${b.destination_name}" not found, skipping.`);
      continue;
    }

    const [[existing]] = await conn.query(
      'SELECT id FROM bookings WHERE user_id = ? AND destination_id = ? AND check_in_date = ?',
      [userId, destId, b.check_in_date]
    );
    if (existing) {
      console.log(`  ✓ Booking "${b.destination_name}" already exists (id: ${existing.id})`);
      bookingIds.push({ id: existing.id, destination_name: b.destination_name });
      continue;
    }

    const [[dest]] = await conn.query('SELECT price_per_night FROM destinations WHERE id = ?', [destId]);
    const checkIn  = new Date(b.check_in_date);
    const checkOut = new Date(b.check_out_date);
    const duration_days = Math.round((checkOut - checkIn) / 86_400_000);
    const total_price   = parseFloat(dest.price_per_night) * duration_days;
    const booking_code  = await uniqueBookingCode(conn);

    const [r] = await conn.query(
      `INSERT INTO bookings
         (user_id, destination_id, check_in_date, check_out_date,
          duration_days, total_price, status, payment_method, booking_code)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [userId, destId, b.check_in_date, b.check_out_date,
       duration_days, total_price, b.status, b.payment_method, booking_code]
    );
    bookingIds.push({ id: r.insertId, destination_name: b.destination_name, booking_code });
    console.log(`  ✓ Created booking "${b.destination_name}" — code: ${booking_code} (id: ${r.insertId})`);
  }
  return bookingIds;
}

async function seedNotifications(conn, userId, bookings) {
  console.log('\n🔔 Seeding notifications for budi@tripmate.id...');

  const baliBooking = bookings.find(b => b.destination_name === 'Bali Paradise Resort');
  const baliCode    = baliBooking?.booking_code ?? '--------';

  const notifications = [
    {
      title:   'Booking Dikonfirmasi! ✈️',
      message: `Booking ke Bali Paradise Resort berhasil dikonfirmasi. Kode booking: ${baliCode}`,
      type:    'booking',
    },
    {
      title:   'Pengingat Perjalanan H-1 ✈️',
      message: 'Besok kamu berangkat ke Bali Paradise Resort! Jangan lupa cek dokumen perjalanan dan packing.',
      type:    'reminder',
    },
    {
      title:   'Tips Perjalanan ke Bali 🌤️',
      message: 'Pastikan cek cuaca sebelum berangkat. Bawa perlengkapan sesuai kondisi cuaca destinasi kamu.',
      type:    'weather',
    },
  ];

  for (const n of notifications) {
    const [[existing]] = await conn.query(
      'SELECT id FROM notifications WHERE user_id = ? AND title = ?', [userId, n.title]
    );
    if (existing) {
      console.log(`  ✓ "${n.title}" already exists (id: ${existing.id})`);
    } else {
      const [r] = await conn.query(
        'INSERT INTO notifications (user_id, title, message, type) VALUES (?, ?, ?, ?)',
        [userId, n.title, n.message, n.type]
      );
      console.log(`  ✓ Created "${n.title}" (id: ${r.insertId})`);
    }
  }
}

// ── Main ──────────────────────────────────────────────────────────────────────

async function seed() {
  const conn = await pool.getConnection();
  try {
    console.log('🌱 Starting TripMate demo data seeding...\n');

    const userIds    = await seedUsers(conn);
    const budiId     = userIds['budi@tripmate.id'];
    const sitiId     = userIds['siti@tripmate.id'];

    if (!budiId || !sitiId) throw new Error('Demo users could not be created.');

    const budiJournalIds = await seedJournals(conn, budiId, budiJournals, 'budi@tripmate.id');
    const sitiJournalIds = await seedJournals(conn, sitiId, sitiJournals, 'siti@tripmate.id');

    await seedLikes(conn, sitiId, budiJournalIds, 'siti@tripmate.id → Budi journals');
    await seedLikes(conn, budiId, sitiJournalIds, 'budi@tripmate.id → Siti journals');

    const destIds = await seedDestinations(conn);
    const bookings = await seedBookings(conn, budiId, destIds);
    await seedNotifications(conn, budiId, bookings);

    console.log('\n✅ Seeding completed successfully!\n');
    console.log('📊 Summary:');
    console.log(`  • Users        : ${demoUsers.length}`);
    console.log(`  • Journals     : ${budiJournals.length} (Budi) + ${sitiJournals.length} (Siti)`);
    console.log(`  • Destinations : ${sampleDestinations.length}`);
    console.log(`  • Bookings     : ${budiBookings.length} (Budi)`);
    console.log(`  • Notifications: 3 (Budi)`);
    console.log('\n🚀 Login credentials:');
    console.log('  budi@tripmate.id | Demo1234');
    console.log('  siti@tripmate.id | Demo1234\n');
  } catch (err) {
    console.error('\n❌ Seeding failed:', err.message);
    process.exit(1);
  } finally {
    conn.release();
    await pool.end();
  }
}

seed();
