const router = require('express').Router();
const https  = require('https');
const { GoogleGenerativeAI } = require('@google/generative-ai');

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({
  model: 'gemini-2.5-flash-lite',
  generationConfig: { maxOutputTokens: 4096, temperature: 0.7 },
});

// ── Nominatim geocoder (OpenStreetMap, no API key needed) ─────────────────────
function geocode(placeName, city) {
  return new Promise((resolve) => {
    const query = encodeURIComponent(`${placeName}, ${city}, Indonesia`);
    const options = {
      hostname: 'nominatim.openstreetmap.org',
      path: `/search?q=${query}&format=json&limit=1`,
      headers: { 'User-Agent': 'TripMate/1.0 (academic project)' },
    };
    const req = https.get(options, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        try {
          const results = JSON.parse(data);
          if (results.length) {
            resolve({ lat: parseFloat(results[0].lat), lng: parseFloat(results[0].lon) });
          } else {
            resolve(null);
          }
        } catch {
          resolve(null);
        }
      });
    });
    req.on('error', () => resolve(null));
    req.setTimeout(5000, () => { req.destroy(); resolve(null); });
  });
}

// Geocode all places in itinerary (rate-limit: 1 req/sec per Nominatim ToS)
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function geocodePlaces(itinerary, destination) {
  for (const day of itinerary) {
    for (const place of day.places) {
      if (!place.lat || !place.lng) {
        place.coords = await geocode(place.name, destination);
        await sleep(1100); // Nominatim rate limit
      } else {
        place.coords = { lat: place.lat, lng: place.lng };
      }
    }
  }
  return itinerary;
}

// ── Prompt builder ────────────────────────────────────────────────────────────
const buildPrompt = (destination, duration, preferences, weather) => {
  const prefs = preferences?.length ? preferences.join(', ') : 'wisata umum';
  const weatherCtx = weather
    ? `Cuaca saat ini di ${destination}: ${weather.condition}, suhu ${weather.temp}°C.`
    : '';

  return `Kamu adalah pemandu wisata lokal ahli di ${destination}, Indonesia.
${weatherCtx}
Buatkan itinerary NYATA dan DETAIL untuk ${duration} hari di ${destination} dengan preferensi: ${prefs}.

PENTING: Gunakan nama tempat NYATA yang benar-benar ada di ${destination}.
Setiap sesi (pagi/siang/malam) harus menyebut 1 tempat spesifik.

Balas HANYA dengan JSON array berikut, tanpa teks lain:
[
  {
    "day": 1,
    "morning":   "Deskripsi aktivitas pagi dengan nama tempat nyata",
    "afternoon": "Deskripsi aktivitas siang dengan nama tempat nyata",
    "evening":   "Deskripsi aktivitas malam dengan nama tempat nyata",
    "places": [
      { "name": "Nama Tempat Nyata", "type": "wisata|kuliner|hotel|belanja", "session": "morning|afternoon|evening", "lat": null, "lng": null }
    ],
    "tips": "Tips lokal singkat untuk hari ini (cuaca, transportasi, dll)"
  }
]

Pastikan jumlah objek tepat ${duration}. Nama tempat harus spesifik, bukan generik.`;
};

// ── Helpers ───────────────────────────────────────────────────────────────────
const stripJson = (raw) => {
  const match = raw.match(/```(?:json)?\s*([\s\S]*?)```/);
  return match ? match[1].trim() : raw.trim();
};

const validateItinerary = (data, duration) =>
  Array.isArray(data) &&
  data.length === duration &&
  data.every(
    (d) =>
      typeof d.day       === 'number' &&
      typeof d.morning   === 'string' &&
      typeof d.afternoon === 'string' &&
      typeof d.evening   === 'string'
  );

const isQuotaError = (err) => {
  const msg = err.message || '';
  return err.status === 429 || msg.includes('RESOURCE_EXHAUSTED') || msg.includes('quota');
};

// ── Fallback ──────────────────────────────────────────────────────────────────
const FALLBACK_DATA = {
  'bali': [
    {
      morning:   'Kunjungi Tanah Lot saat sunrise — pura di atas batu karang tepi laut, pemandangan terbaik sebelum ramai wisatawan.',
      afternoon: 'Makan siang di Warung Mak Beng (Jl. Hang Tuah No.45, Sanur) — legendaris sejak 1941, wajib coba ikan goreng + kuah.',
      evening:   'Sunset di Pantai Seminyak lalu makan malam di Merah Putih Restaurant (Jl. Petitenget No.100).',
      places: [
        { name: 'Tanah Lot',          type: 'wisata',  session: 'morning'   },
        { name: 'Warung Mak Beng',    type: 'kuliner', session: 'afternoon' },
        { name: 'Pantai Seminyak',    type: 'wisata',  session: 'evening'   },
      ],
      tips: 'Datang ke Tanah Lot sebelum jam 08.00 untuk menghindari keramaian. Sewa motor Rp 70–80k/hari lebih praktis.',
    },
    {
      morning:   'Jelajahi Ubud Art Market (Pasar Seni Ubud) di Jl. Raya Ubud — belanja kain, ukiran, dan kerajinan tangan khas Bali.',
      afternoon: 'Makan siang di Ibu Oka (Jl. Suweta No.2, Ubud) — warung babi guling paling terkenal di Bali, antre sejak siang.',
      evening:   'Nonton pertunjukan Tari Kecak di Pura Uluwatu saat sunset — pertunjukan dimulai pukul 18.00.',
      places: [
        { name: 'Ubud Art Market',    type: 'belanja', session: 'morning'   },
        { name: 'Ibu Oka Ubud',       type: 'kuliner', session: 'afternoon' },
        { name: 'Pura Uluwatu',       type: 'wisata',  session: 'evening'   },
      ],
      tips: 'Bawa sarung untuk masuk pura (biasanya disediakan). Tari Kecak tiket Rp 150k, beli online lebih murah.',
    },
    {
      morning:   'Trekking di Ceking Rice Terrace (Jl. Raya Tegalalang, Ubud) — sawah terasering ikonik, foto terbaik pagi hari.',
      afternoon: 'Kunjungi Garuda Wisnu Kencana (Jl. Raya Uluwatu No.1, Ungasan) — patung GWK setinggi 121 meter.',
      evening:   'Belanja oleh-oleh di Krisna Oleh-Oleh (Jl. Nusa Indah No.79, Denpasar) lalu makan malam di Jimbaran Bay Seafood.',
      places: [
        { name: 'Ceking Rice Terrace',  type: 'wisata',  session: 'morning'   },
        { name: 'Garuda Wisnu Kencana', type: 'wisata',  session: 'afternoon' },
        { name: 'Jimbaran Bay Seafood', type: 'kuliner', session: 'evening'   },
      ],
      tips: 'Ceking Rice Terrace buka 24 jam, tapi pagi sebelum jam 09.00 paling sepi dan cahaya terbaik untuk foto.',
    },
  ],
  'yogyakarta': [
    {
      morning:   'Kunjungi Candi Borobudur (Jl. Badrawati, Magelang) saat sunrise — naik ke stupa utama melihat kabut pagi.',
      afternoon: 'Makan siang Gudeg Yu Djum (Jl. Kaliurang Km 4.5) — gudeg kering paling otentik di Yogyakarta sejak 1950.',
      evening:   'Jalan-jalan di Malioboro, belanja batik dan bakpia, makan malam lesehan di sepanjang jalan.',
      places: [
        { name: 'Candi Borobudur',  type: 'wisata',  session: 'morning'   },
        { name: 'Gudeg Yu Djum',    type: 'kuliner', session: 'afternoon' },
        { name: 'Malioboro',        type: 'belanja', session: 'evening'   },
      ],
      tips: 'Tiket Borobudur Rp 50k (lokal) / Rp 350k (mancanegara). Berangkat dari Yogya jam 04.30 untuk sunrise.',
    },
    {
      morning:   'Kunjungi Candi Prambanan (Jl. Raya Solo-Yogya Km 16) — kompleks candi Hindu terbesar di Indonesia.',
      afternoon: 'Eksplorasi Keraton Yogyakarta (Jl. Rotowijayan Blok No.1) dan Museum Kereta Keraton.',
      evening:   'Nonton Sendratari Ramayana di Prambanan Open Air Theatre (jadwal Selasa, Kamis, Sabtu).',
      places: [
        { name: 'Candi Prambanan',      type: 'wisata',  session: 'morning'   },
        { name: 'Keraton Yogyakarta',   type: 'wisata',  session: 'afternoon' },
        { name: 'Prambanan Open Theatre', type: 'wisata', session: 'evening'  },
      ],
      tips: 'Kombinasi tiket Borobudur-Prambanan lebih hemat. Keraton tutup Jumat.',
    },
    {
      morning:   'Trekking ke Pantai Parangtritis (45 menit dari kota) — pantai selatan dengan pasir hitam dan ombak besar.',
      afternoon: 'Belanja batik di Pasar Beringharjo (Jl. Margo Mulyo No.16) — pasar batik terlengkap di Yogyakarta.',
      evening:   'Makan malam di Bale Raos (Jl. Magangan Kulon No.1) — restoran dalam keraton, menu masakan kerajaan Jawa.',
      places: [
        { name: 'Pantai Parangtritis', type: 'wisata',  session: 'morning'   },
        { name: 'Pasar Beringharjo',   type: 'belanja', session: 'afternoon' },
        { name: 'Bale Raos',           type: 'kuliner', session: 'evening'   },
      ],
      tips: 'Parangtritis berbahaya untuk berenang — nikmati dari tepi saja. Bawa uang tunai untuk Pasar Beringharjo.',
    },
  ],
  'raja ampat': [
    {
      morning:   'Snorkeling di Cape Kri — titik dengan rekor jumlah spesies ikan terbanyak di dunia (374 spesies).',
      afternoon: 'Makan siang di resort lalu island hopping ke Pulau Mansuar dan Pulau Arborek.',
      evening:   'Sunset dari dermaga Arborek Village — desa nelayan tradisional Papua Barat.',
      places: [
        { name: 'Cape Kri',         type: 'wisata',  session: 'morning'   },
        { name: 'Pulau Arborek',    type: 'wisata',  session: 'afternoon' },
        { name: 'Arborek Village',  type: 'wisata',  session: 'evening'   },
      ],
      tips: 'Bawa sunscreen reef-safe. Arus di Cape Kri kuat, wajib pakai pelampung.',
    },
    {
      morning:   'Trekking ke Puncak Wayag — pemandangan gugusan pulau karst dari atas, ikon Raja Ampat.',
      afternoon: 'Snorkeling di Pianemo — laguna biru tersembunyi di antara tebing karst.',
      evening:   'Kembali ke penginapan, makan malam seafood segar hasil tangkapan nelayan lokal.',
      places: [
        { name: 'Wayag Island',  type: 'wisata',  session: 'morning'   },
        { name: 'Pianemo',       type: 'wisata',  session: 'afternoon' },
        { name: 'Misool Island', type: 'wisata',  session: 'evening'   },
      ],
      tips: 'Trekking Wayag butuh fisik prima — sekitar 45 menit mendaki. Bawa air minum cukup.',
    },
    {
      morning:   'Diving di Misool — terumbu karang terbaik dengan penyu, hiu karang, dan manta ray.',
      afternoon: 'Kunjungi Goa Tengkorak (Skull Cave) di Pulau Gam — situs bersejarah dengan tengkorak leluhur.',
      evening:   'Perpisahan dengan sunset di atas kapal pinisi sambil menikmati papeda dan ikan kuah kuning.',
      places: [
        { name: 'Misool',       type: 'wisata',  session: 'morning'   },
        { name: 'Goa Tengkorak', type: 'wisata', session: 'afternoon' },
        { name: 'Waisai Port',  type: 'wisata',  session: 'evening'   },
      ],
      tips: 'Raja Ampat terbaik dikunjungi Oktober–April. Bawa cash karena ATM sangat terbatas.',
    },
  ],
  'lombok': [
    {
      morning:   'Snorkeling di Gili Trawangan — temukan penyu laut di sekitar Turtle Point, spot paling populer.',
      afternoon: 'Makan siang di Scallywags Beach Club (Gili Trawangan) — seafood segar dengan view laut.',
      evening:   'Sunset di pantai barat Gili Trawangan, lanjut makan malam di Night Market Gili.',
      places: [
        { name: 'Gili Trawangan',   type: 'wisata',  session: 'morning'   },
        { name: 'Scallywags Beach Club', type: 'kuliner', session: 'afternoon' },
        { name: 'Gili Night Market', type: 'kuliner', session: 'evening'  },
      ],
      tips: 'Tidak ada motor di Gili — sewa sepeda Rp 50k/hari atau naik cidomo.',
    },
    {
      morning:   'Kunjungi Pantai Kuta Lombok (berbeda dari Kuta Bali) — pasir putih bersih, ombak bagus untuk surfing.',
      afternoon: 'Jelajahi Desa Sade (Dusun Sade, Rembitan) — desa adat Sasak dengan rumah tradisional.',
      evening:   'Makan malam di Ashtari Restaurant (Jl. Raya Kuta, Lombok) — view bukit dengan sunset spektakuler.',
      places: [
        { name: 'Pantai Kuta Lombok', type: 'wisata',  session: 'morning'   },
        { name: 'Desa Sade',          type: 'wisata',  session: 'afternoon' },
        { name: 'Ashtari Restaurant', type: 'kuliner', session: 'evening'   },
      ],
      tips: 'Kuta Lombok 1 jam dari Mataram. Sewa motor lebih fleksibel untuk eksplor pantai-pantai tersembunyi.',
    },
    {
      morning:   'Trekking Gunung Rinjani via Senaru — minimal 2 hari, tapi bisa day hike ke Air Terjun Sendang Gile.',
      afternoon: 'Kunjungi Pura Lingsar (Jl. Lingsar, Narmada) — pura unik yang disucikan Hindu dan Islam sekaligus.',
      evening:   'Belanja oleh-oleh kerajinan gerabah di Desa Banyumulek, makan malam di Taliwang Irama (ayam taliwang asli).',
      places: [
        { name: 'Air Terjun Sendang Gile', type: 'wisata',  session: 'morning'   },
        { name: 'Pura Lingsar',            type: 'wisata',  session: 'afternoon' },
        { name: 'Taliwang Irama',          type: 'kuliner', session: 'evening'   },
      ],
      tips: 'Ayam Taliwang asli Lombok jauh lebih pedas dari versi di luar Lombok. Minta level pedas sesuai kemampuan.',
    },
  ],
  'labuan bajo': [
    {
      morning:   'Island hopping ke Pulau Padar — trekking 30 menit ke puncak untuk view tiga teluk berwarna berbeda.',
      afternoon: 'Snorkeling di Pink Beach (Pantai Merah) — pantai dengan pasir berwarna merah muda unik di dunia.',
      evening:   'Kembali ke Labuan Bajo, makan malam di Bajo Bakery & Cafe (Jl. Soekarno Hatta) dengan view pelabuhan.',
      places: [
        { name: 'Pulau Padar',   type: 'wisata',  session: 'morning'   },
        { name: 'Pink Beach',    type: 'wisata',  session: 'afternoon' },
        { name: 'Bajo Bakery',   type: 'kuliner', session: 'evening'   },
      ],
      tips: 'Trekking Padar paling nyaman pagi hari sebelum jam 09.00 — siang sangat panas dan terik.',
    },
    {
      morning:   'Kunjungi Pulau Komodo — trekking dengan ranger melihat komodo liar di habitat aslinya.',
      afternoon: 'Snorkeling di Manta Point — berenang bersama pari manta raksasa di perairan Komodo.',
      evening:   'Sunset dari Bukit Cinta (Love Hill) Labuan Bajo — spot terbaik melihat matahari tenggelam di atas laut.',
      places: [
        { name: 'Pulau Komodo',  type: 'wisata',  session: 'morning'   },
        { name: 'Manta Point',   type: 'wisata',  session: 'afternoon' },
        { name: 'Bukit Cinta Labuan Bajo', type: 'wisata', session: 'evening' },
      ],
      tips: 'Wajib pakai ranger resmi di Pulau Komodo — jangan jalan sendiri. Tiket masuk Rp 150k.',
    },
    {
      morning:   'Kunjungi Batu Cermin Cave (Gua Batu Cermin) — gua dengan kristal yang memantulkan cahaya seperti cermin.',
      afternoon: 'Belanja souvenir di Pasar Labuan Bajo, coba kopi Flores di kedai lokal.',
      evening:   'Makan malam seafood di Kampung Ujung (dermaga lama) — ikan bakar segar langsung dari nelayan.',
      places: [
        { name: 'Gua Batu Cermin',  type: 'wisata',  session: 'morning'   },
        { name: 'Pasar Labuan Bajo', type: 'belanja', session: 'afternoon' },
        { name: 'Kampung Ujung',    type: 'kuliner', session: 'evening'   },
      ],
      tips: 'Bawa uang tunai — banyak tempat di Labuan Bajo belum terima kartu. ATM BRI paling mudah ditemukan.',
    },
  ],
};

const buildFallback = (destination, duration) => {
  const key = Object.keys(FALLBACK_DATA).find((k) => destination.toLowerCase().includes(k));
  const templates = FALLBACK_DATA[key] || FALLBACK_DATA['bali'];
  return Array.from({ length: duration }, (_, i) => {
    const t = templates[i % templates.length];
    return {
      day: i + 1,
      morning:   t.morning,
      afternoon: t.afternoon,
      evening:   t.evening,
      places:    t.places.map((p) => ({ ...p, coords: null })),
      tips:      t.tips,
    };
  });
};

// ── Gemini call ───────────────────────────────────────────────────────────────
const callGemini = async (prompt) => {
  try {
    const result = await model.generateContent(prompt);
    return result.response.text();
  } catch (err) {
    if (isQuotaError(err)) {
      await sleep(2000);
      const result = await model.generateContent(prompt);
      return result.response.text();
    }
    throw err;
  }
};

// ── POST /api/ai/plan ─────────────────────────────────────────────────────────
router.post('/plan', async (req, res) => {
  const { destination, duration, preferences, weather } = req.body;

  if (!destination || typeof destination !== 'string' || !destination.trim())
    return res.status(400).json({ error: 'destination wajib diisi.' });
  if (!duration || typeof duration !== 'number' || duration < 1 || duration > 30)
    return res.status(400).json({ error: 'duration harus angka antara 1–30.' });
  if (preferences !== undefined && !Array.isArray(preferences))
    return res.status(400).json({ error: 'preferences harus berupa array.' });

  try {
    const raw = await callGemini(buildPrompt(destination.trim(), duration, preferences, weather));

    let itinerary;
    try {
      itinerary = JSON.parse(stripJson(raw));
    } catch {
      return res.status(502).json({ error: 'AI mengembalikan respons tidak valid. Coba lagi.' });
    }

    if (!validateItinerary(itinerary, duration))
      return res.status(502).json({ error: 'Struktur data AI tidak sesuai. Coba lagi.' });

    // Geocode places that Gemini didn't provide coordinates for
    itinerary = await geocodePlaces(itinerary, destination.trim());

    return res.json({ destination: destination.trim(), duration, itinerary, isFromFallback: false });

  } catch (err) {
    if (isQuotaError(err)) {
      console.warn('[ai:plan] Quota exhausted — serving fallback.');
      const fallback = await geocodePlaces(buildFallback(destination.trim(), duration), destination.trim());
      return res.json({ destination: destination.trim(), duration, itinerary: fallback, isFromFallback: true });
    }

    const msg = err.message || '';
    if (msg.includes('API_KEY_INVALID') || msg.includes('API key'))
      return res.status(500).json({ error: 'GEMINI_API_KEY tidak valid.' });
    if (msg.includes('UNAVAILABLE') || msg.includes('503'))
      return res.status(503).json({ error: 'Layanan Gemini sedang tidak tersedia.' });

    res.status(500).json({ error: 'Gagal membuat itinerary.', details: msg });
  }
});

module.exports = router;
