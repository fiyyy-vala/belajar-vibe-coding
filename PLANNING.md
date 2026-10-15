# Project Architecture & Planning Guide

Dokumen ini disusun sebagai panduan **high-level** untuk **Programmer Junior** atau **Model AI (Budget / Cheaper Model)** dalam mengimplementasikan fitur-fitur backend API pada proyek ini.

---

## 1. Tech Stack
* **Runtime & Package Manager**: [Bun](https://bun.sh/)
* **Web Framework**: [ElysiaJS](https://elysiajs.com/)
* **ORM**: [Drizzle ORM](https://orm.drizzle.team/)
* **Database Driver**: MySQL (`mysql2`)
* **Migration Tool**: `drizzle-kit`

---

## 2. Struktur Folder Standar (High-Level)

Gunakan struktur berbasis modul (Feature-based Modular Structure) agar rapi dan mudah di-scale:

```text
├── drizzle/                  # File migrasi yang di-generate otomatis
├── src/
│   ├── db/
│   │   ├── index.ts          # Inisialisasi pool MySQL & client Drizzle
│   │   └── schema.ts         # Definisi tabel Drizzle (MySQL)
│   ├── modules/              # Folder modul fitur (e.g. users, products, orders)
│   │   └── [feature]/
│   │       ├── [feature].controller.ts  # Elysia routes & validasi request (Elysia 't')
│   │       └── [feature].service.ts     # Business logic & query database (Drizzle)
│   └── index.ts              # Entry point utama, registrasi plugin & modul
├── .env                      # Environment variables lokal
├── .env.example              # Template environment variables
├── drizzle.config.ts         # Konfigurasi Drizzle Kit
├── package.json
└── tsconfig.json
```

---

## 3. Pola Arsitektur (High-Level Pattern)

Setiap fitur mengikuti alur 3 lapis sederhana:

```text
[HTTP Request]
       │
       ▼
1. Controller ([feature].controller.ts)
   - Menangani route path (GET, POST, PUT, DELETE).
   - Validasi payload/param menggunakan schema `t` bawaan Elysia.
   - Memanggil Service.
       │
       ▼
2. Service ([feature].service.ts)
   - Berisi business logic, sanitasi data, atau kalkulasi.
   - Melakukan query langsung ke database menggunakan instance `db` dari Drizzle.
       │
       ▼
3. Database (MySQL via Drizzle ORM)
```

### Konvensi Respons API:
* **Sukses**: Return objek JSON standar: `{ success: true, data: ..., message?: string }`
* **Error**: Gunakan `set.status` dari context Elysia atau lempar error terstruktur: `{ success: false, error: string }`

---

## 4. Perintah Utama (Cheatsheet)

| Perintah | Deskripsi |
|---|---|
| `bun run dev` | Menjalankan server lokal dengan hot-reload (`src/index.ts`) |
| `bun run db:push` | Sinkronisasi perubahan schema langsung ke database MySQL |
| `bun run db:generate` | Membuat file migrasi SQL baru berdasarkan perubahan schema |
| `bun run db:studio` | Membuka UI web Drizzle Studio untuk inspeksi data database |

---

## 5. Roadmap Implementasi (Instruksi Bertahap)

### Tahap 1: Setup Database & Koneksi
- Pastikan MySQL lokal / Docker aktif.
- Perbarui URL koneksi di file `.env` (`DATABASE_URL=mysql://user:pass@host:port/dbname`).
- Jalankan `bun run dev` untuk memastikan server berjalan normal di port 3000.

### Tahap 2: Definisi Schema Data
- Buka `src/db/schema.ts`.
- Tambahkan tabel sesuai domain fitur (gunakan tipe data dari `drizzle-orm/mysql-core`).
- Eksekusi `bun run db:push` agar tabel otomatis dibuat di database.

### Tahap 3: Implementasi Modul Fitur
Untuk setiap fitur baru:
1. Buat folder di `src/modules/<nama-fitur>/`.
2. Buat file `service`: Tulis fungsi-fungsi query database (Create, Read, Update, Delete).
3. Buat file `controller`: Buat route Elysia (misal `.group('/<nama-fitur>', ...)`) dan pasang validasi request (`t.Object(...)`).
4. Daftarkan controller tersebut ke file `src/index.ts` menggunakan `.use(featureController)`.

### Tahap 4: Verifikasi & Testing
- Uji endpoint menggunakan curl, Postman, Bruno, atau browser.
- Pastikan endpoint merespons dengan status code dan payload yang benar.

---

## 6. Template Prompt untuk Model AI Murah (Cheaper LLM Prompt)

Gunakan template di bawah ini saat mendelegasikan pembuatan fitur ke model AI yang lebih hemat:

```markdown
Kamu adalah programmer yang bertugas mengimplementasikan fitur backend menggunakan:
- Runtime: Bun
- Framework: ElysiaJS
- ORM: Drizzle ORM (MySQL)

Tolong buatkan modul: [NAMA FITUR, contoh: 'products']

Aturan Implementasi:
1. Buat schema tabel di `src/db/schema.ts` (jika belum ada).
2. Buat `src/modules/[nama-fitur]/[nama-fitur].service.ts` yang berisi fungsi CRUD menggunakan instance Drizzle `db`.
3. Buat `src/modules/[nama-fitur]/[nama-fitur].controller.ts` berupa Elysia instance (`new Elysia({ prefix: '/[nama-fitur]' })`), lengkapi dengan validasi schema `t`.
4. Berikan instruksi cara mendaftarkannya di `src/index.ts`.
5. Tulis kode yang ringkas, bersih, dan langsung dapat dieksekusi.
```
