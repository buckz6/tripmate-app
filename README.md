# TripMate — Travel + Booking + Jurnal

<div align="center">

![TripMate](https://img.shields.io/badge/TripMate-Travel%20App-teal?style=for-the-badge)
![React](https://img.shields.io/badge/React-19-61DAFB?style=for-the-badge&logo=react)
![Node.js](https://img.shields.io/badge/Node.js-Express-339933?style=for-the-badge&logo=node.js)
![MySQL](https://img.shields.io/badge/MySQL-8.0-4479A1?style=for-the-badge&logo=mysql)
![Gemini](https://img.shields.io/badge/Google-Gemini%20AI-4285F4?style=for-the-badge&logo=google)

</div>

---

## Deskripsi Proyek

**TripMate** adalah aplikasi web full-stack untuk perencanaan perjalanan yang membantu pengguna merencanakan, mendokumentasikan, dan berbagi pengalaman wisata mereka. Aplikasi ini menggabungkan kecerdasan buatan (Google Gemini) untuk menghasilkan itinerary perjalanan secara otomatis, sistem jurnal perjalanan dengan peta interaktif, fitur komunitas untuk berbagi cerita, serta sistem pemesanan destinasi wisata.

TripMate dibangun sebagai proyek akhir mata kuliah dengan arsitektur **REST API** menggunakan Node.js + Express di backend dan **React.js** di frontend, terhubung ke database **MySQL** melalui XAMPP.

---

## Teknologi yang Digunakan

### Frontend
| Teknologi | Versi | Kegunaan |
|---|---|---|
| React.js | 19.x | Library UI utama |
| Tailwind CSS | 3.x | Styling dan desain responsif |
| React Router DOM | 7.x | Navigasi antar halaman |
| Axios | 1.x | HTTP client untuk API calls |
| React Leaflet | 5.x | Peta interaktif |
| React Hot Toast | 2.x | Notifikasi UI |

### Backend
| Teknologi | Versi | Kegunaan |
|---|---|---|
| Node.js | 18+ | Runtime JavaScript |
| Express.js | 5.x | Framework REST API |
| MySQL2 | 3.x | Driver database MySQL |
| JSON Web Token | 9.x | Autentikasi berbasis token |
| Bcrypt | 6.x | Hashing password |
| Multer | 2.x | Upload file/foto |
| Helmet | 8.x | Security HTTP headers |
| Morgan | 1.x | HTTP request logging |
| Express Rate Limit | 8.x | Pembatasan request |
| Express Validator | 7.x | Validasi input |

### AI & Database
| Teknologi | Kegunaan |
|---|---|
| Google Gemini API (`gemini-2.0-flash`) | Generasi itinerary perjalanan otomatis |
| MySQL 8.0 (via XAMPP) | Database relasional |

### Tools Pengembangan
| Tool | Kegunaan |
|---|---|
| VS Code | Code editor utama |
| XAMPP | Local server MySQL & Apache |
| GitHub | Version control & kolaborasi |
| Amazon Q Developer | AI coding assistant (IDE plugin) |
| Postman | Testing API endpoints |

---

## Fitur Utama

### 1. 🔐 Autentikasi Pengguna
Sistem registrasi dan login yang aman menggunakan **JWT (JSON Web Token)**. Password di-hash menggunakan **bcrypt** dengan salt rounds 12. Token disimpan di `localStorage` dan otomatis dikirim di setiap request ke protected routes. Token expired otomatis mengarahkan pengguna ke halaman login.

### 2. 📓 Jurnal Perjalanan
Pengguna dapat membuat, mengedit, dan menghapus jurnal perjalanan pribadi. Setiap jurnal mendukung judul, destinasi, tanggal, deskripsi, foto (upload ke server), serta koordinat GPS (latitude & longitude). Data jurnal tersimpan permanen di database MySQL.

### 3. 🤖 AI Trip Planner
Fitur unggulan yang menggunakan **Google Gemini AI** untuk menghasilkan itinerary perjalanan harian secara otomatis. Pengguna cukup memasukkan destinasi, durasi (1–14 hari), dan preferensi wisata (kuliner, alam, budaya, belanja, petualangan, relaksasi). AI akan menghasilkan rencana pagi, siang, dan malam untuk setiap hari dalam Bahasa Indonesia.

### 4. 🗺️ Peta Interaktif
Peta berbasis **OpenStreetMap** menggunakan React Leaflet yang memungkinkan pengguna menandai lokasi wisata secara interaktif. Lokasi yang disimpan terhubung ke jurnal dan tersimpan di database, sehingga dapat diakses kembali kapan saja.

### 5. 🌍 Explore Destinasi
Halaman eksplorasi destinasi wisata dengan fitur pencarian berdasarkan nama, lokasi, atau deskripsi. Setiap destinasi menampilkan gambar, rating, dan informasi lengkap. Halaman ini bersifat publik dan dapat diakses tanpa login.

### 6. 👥 Komunitas
Fitur sosial yang memungkinkan pengguna berbagi jurnal perjalanan mereka ke komunitas. Pengguna lain dapat memberikan **like** pada jurnal yang menarik. Tersedia fitur pencarian jurnal komunitas berdasarkan judul atau destinasi. Sistem like menggunakan mekanisme atomic toggle yang aman dari race condition.

---

## Cara Menjalankan Proyek

### Prasyarat
Pastikan sudah terinstall:
- [Node.js](https://nodejs.org/) versi 18 atau lebih baru
- [XAMPP](https://www.apachefriends.org/) (untuk MySQL)
- [Git](https://git-scm.com/)

---

### Langkah 1 — Clone / Download Proyek

```bash
git clone https://github.com/username/tripmate.git
cd tripmate
```

Atau download ZIP dari GitHub lalu ekstrak ke folder `C:\xampp\htdocs\tripmate`.

---

### Langkah 2 — Setup Database

1. Buka **XAMPP Control Panel**
2. Klik **Start** pada MySQL
3. Buka browser, akses `http://localhost/phpmyadmin`
4. Klik **New** → buat database baru dengan nama `tripmate`
5. Pilih collation: `utf8mb4_unicode_ci`

---

### Langkah 3 — Konfigurasi File `.env`

Masuk ke folder backend dan buat file `.env`:

```bash
cd backend
copy .env.example .env
```

Edit file `.env` sesuai konfigurasi lokal:

```env
NODE_ENV=development
PORT=5000
BASE_URL=http://localhost:5000

# MySQL
DB_HOST=localhost
DB_PORT=3306
DB_NAME=tripmate
DB_USER=root
DB_PASSWORD=

# Auth — generate dengan: node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
JWT_SECRET=isi_dengan_string_random_minimal_32_karakter

# Google Gemini — https://aistudio.google.com/app/apikey
GEMINI_API_KEY=isi_dengan_api_key_gemini_kamu

# CORS
ALLOWED_ORIGIN=http://localhost:3000
```

> ⚠️ **Penting:** Jangan pernah commit file `.env` ke GitHub. File ini sudah terdaftar di `.gitignore`.

Buat juga file `.env` untuk frontend:

```bash
cd ../frontend
```

Buat file `frontend/.env`:

```env
REACT_APP_API_URL=http://localhost:5000
```

---

### Langkah 4 — Install Dependencies

**Backend:**
```bash
cd backend
npm install
```

**Frontend:**
```bash
cd ../frontend
npm install
```

---

### Langkah 5 — Jalankan Migrasi Database

Dari folder `backend`, jalankan script migrasi untuk membuat semua tabel:

```bash
cd backend
node migrate.js
```

Output yang diharapkan:
```
Connected to database "tripmate" @ localhost

  ✓  Table "users" is ready.
  ✓  Table "journals" is ready.
  ✓  Table "likes" is ready.
  ✓  Table "locations" is ready.
  ✓  Table "destinations" is ready.
  ✓  Table "bookings" is ready.

Migration completed — 6 table(s) processed.
```

---

### Langkah 6 — Jalankan Backend

```bash
cd backend
npm run dev
```

Output yang diharapkan:
```
Database connected successfully.
Server running on port 5000 [development]
```

Backend berjalan di: `http://localhost:5000`

Cek status: `http://localhost:5000/api/health`

---

### Langkah 7 — Jalankan Frontend

Buka terminal baru:

```bash
cd frontend
npm start
```

Frontend berjalan di: `http://localhost:3000`

Browser akan otomatis terbuka. Jika tidak, buka manual di `http://localhost:3000`.

---

## Struktur Folder

```
tripmate/
├── backend/                        # Node.js + Express REST API
│   ├── middleware/
│   │   ├── auth.js                 # JWT verification middleware
│   │   └── upload.js               # Multer file upload middleware
│   ├── routes/
│   │   ├── auth.js                 # POST /register, POST /login
│   │   ├── journals.js             # CRUD jurnal + upload foto
│   │   ├── community.js            # Feed publik + like toggle
│   │   ├── profile.js              # GET/PUT profil + ganti password
│   │   ├── locations.js            # CRUD lokasi peta
│   │   ├── destinations.js         # GET destinasi + search
│   │   ├── bookings.js             # CRUD pemesanan
│   │   └── ai.js                   # POST /plan (Gemini AI)
│   ├── uploads/                    # Folder penyimpanan foto upload
│   ├── .env                        # Konfigurasi environment (tidak di-commit)
│   ├── .env.example                # Template konfigurasi
│   ├── db.js                       # MySQL connection pool
│   ├── migrate.js                  # Script pembuatan tabel database
│   ├── server.js                   # Entry point Express app
│   └── package.json
│
├── frontend/                       # React.js SPA
│   ├── public/
│   │   └── index.html
│   ├── src/
│   │   ├── api/                    # Service layer (axios wrappers)
│   │   │   ├── axios.js            # Axios instance + interceptors
│   │   │   ├── authService.js
│   │   │   ├── journalService.js
│   │   │   ├── communityService.js
│   │   │   ├── profileService.js
│   │   │   ├── aiService.js
│   │   │   ├── locationService.js
│   │   │   ├── destinationService.js
│   │   │   └── bookingService.js
│   │   ├── components/             # Reusable UI components
│   │   │   ├── Navbar.jsx
│   │   │   ├── Layout.jsx
│   │   │   ├── PrivateRoute.jsx    # Route guard dengan JWT expiry check
│   │   │   ├── MapView.jsx         # Leaflet interactive map
│   │   │   ├── ErrorBoundary.jsx
│   │   │   └── ...
│   │   ├── pages/                  # Halaman-halaman aplikasi
│   │   │   ├── LoginPage.jsx
│   │   │   ├── RegisterPage.jsx
│   │   │   ├── HomePage.jsx
│   │   │   ├── JournalPage.jsx
│   │   │   ├── CreateJournalPage.jsx
│   │   │   ├── JournalDetailPage.jsx
│   │   │   ├── AIPlan.jsx
│   │   │   ├── Explore.jsx
│   │   │   ├── CommunityPage.jsx
│   │   │   ├── ProfilePage.jsx
│   │   │   └── NotFoundPage.jsx
│   │   ├── App.jsx                 # Router + AuthLogoutListener
│   │   └── index.js
│   ├── .env                        # REACT_APP_API_URL
│   └── package.json
│
├── .gitignore                      # Root gitignore (melindungi .env)
└── README.md
```

---

## API Endpoints

### 🔐 Autentikasi
| Method | URL | Deskripsi | Auth |
|---|---|---|---|
| `POST` | `/api/auth/register` | Registrasi akun baru | ❌ |
| `POST` | `/api/auth/login` | Login, mendapatkan JWT token | ❌ |

### 👤 Profil
| Method | URL | Deskripsi | Auth |
|---|---|---|---|
| `GET` | `/api/profile` | Ambil data profil pengguna | ✅ |
| `PUT` | `/api/profile` | Update nama dan email | ✅ |
| `PUT` | `/api/profile/password` | Ganti password | ✅ |
| `GET` | `/api/profile/stats` | Statistik jurnal pengguna | ✅ |

### 📓 Jurnal
| Method | URL | Deskripsi | Auth |
|---|---|---|---|
| `GET` | `/api/journals` | Ambil semua jurnal milik user | ✅ |
| `GET` | `/api/journals/public` | Ambil semua jurnal publik | ❌ |
| `GET` | `/api/journals/:id` | Detail satu jurnal | ✅ |
| `POST` | `/api/journals` | Buat jurnal baru | ✅ |
| `PUT` | `/api/journals/:id` | Update jurnal | ✅ |
| `DELETE` | `/api/journals/:id` | Hapus jurnal | ✅ |
| `POST` | `/api/journals/upload` | Upload foto jurnal | ✅ |

### 👥 Komunitas
| Method | URL | Deskripsi | Auth |
|---|---|---|---|
| `GET` | `/api/community` | Feed jurnal komunitas + like count | ✅ |
| `GET` | `/api/community/search?q=` | Cari jurnal komunitas | ✅ |
| `POST` | `/api/community/like/:journalId` | Toggle like jurnal | ✅ |

### 🗺️ Lokasi
| Method | URL | Deskripsi | Auth |
|---|---|---|---|
| `GET` | `/api/locations` | Ambil semua lokasi user | ✅ |
| `POST` | `/api/locations` | Simpan lokasi baru | ✅ |
| `DELETE` | `/api/locations/:id` | Hapus lokasi | ✅ |

### 🌍 Destinasi
| Method | URL | Deskripsi | Auth |
|---|---|---|---|
| `GET` | `/api/destinations` | Daftar semua destinasi | ❌ |
| `GET` | `/api/destinations/:id` | Detail destinasi | ❌ |
| `GET` | `/api/destinations/search?q=` | Cari destinasi | ❌ |

### 🎫 Pemesanan
| Method | URL | Deskripsi | Auth |
|---|---|---|---|
| `GET` | `/api/bookings` | Daftar pemesanan user | ✅ |
| `GET` | `/api/bookings/:id` | Detail pemesanan | ✅ |
| `POST` | `/api/bookings` | Buat pemesanan baru | ✅ |
| `PUT` | `/api/bookings/:id/cancel` | Batalkan pemesanan | ✅ |

### 🤖 AI Planner
| Method | URL | Deskripsi | Auth |
|---|---|---|---|
| `POST` | `/api/ai/plan` | Generate itinerary dengan Gemini AI | ✅ |

### ⚙️ Sistem
| Method | URL | Deskripsi | Auth |
|---|---|---|---|
| `GET` | `/` | Status API | ❌ |
| `GET` | `/api/health` | Health check + timestamp | ❌ |
| `GET` | `/uploads/:filename` | Akses foto yang diupload | ❌ |

> **Keterangan:** ✅ = Membutuhkan header `Authorization: Bearer <token>` &nbsp;|&nbsp; ❌ = Publik

---

## Screenshot

### Halaman Login
> 📸 *Screenshot halaman login*

---

### Halaman Home / Dashboard
> 📸 *Screenshot halaman home setelah login*

---

### AI Trip Planner
> 📸 *Screenshot form input dan hasil itinerary dari AI*

---

### Jurnal Perjalanan
> 📸 *Screenshot daftar jurnal dan form tambah jurnal*

---

### Peta Interaktif
> 📸 *Screenshot peta dengan marker lokasi*

---

### Halaman Komunitas
> 📸 *Screenshot feed komunitas dengan fitur like*

---

### Explore Destinasi
> 📸 *Screenshot halaman explore dengan search*

---

## Anggota Tim

| Nama | NIM | Peran |
|---|---|---|
| `<Nama Anggota 1>` | `<NIM>` | Project Manager / Fullstack Developer |
| `<Nama Anggota 2>` | `<NIM>` | Frontend Developer |
| `<Nama Anggota 3>` | `<NIM>` | Backend Developer |
| `<Nama Anggota 4>` | `<NIM>` | UI/UX Designer |

---

## Lisensi

Proyek ini dibuat untuk keperluan akademik. Seluruh hak cipta dimiliki oleh tim pengembang TripMate.

---

<div align="center">
  <p>Dibuat dengan ❤️ oleh Tim TripMate</p>
  <p><strong>TripMate</strong> — <em>Travel planning reimagined</em> ✈️</p>
</div>
