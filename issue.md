# Issue: Implementasi Fitur Registrasi User Baru (POST /api/users)

> **Target Pelaksana**: Junior Programmer atau AI Model (Budget/Cheaper LLM).  
> **Tujuan**: Mengimplementasikan endpoint pendaftaran user baru dengan penyimpanan data ke MySQL melalui Drizzle ORM, enkripsi password menggunakan bcrypt, validasi input menggunakan Elysia, serta struktur kode modular (`routes` & `services`).

---

## 1. Spesifikasi Kebutuhan

### A. Tabel Database: `users`
Tabel disimpan di database MySQL menggunakan Drizzle ORM pada file `src/db/schema.ts`.

| Kolom | Tipe Data | Ketentuan | Keterangan |
|---|---|---|---|
| `id` | `INTEGER` | Primary Key, Auto Increment | ID unik user |
| `name` | `VARCHAR(255)` | NOT NULL | Nama lengkap user |
| `email` | `VARCHAR(255)` | NOT NULL, UNIQUE | Alamat email user (tidak boleh duplikat) |
| `password` | `VARCHAR(255)` | NOT NULL | Password yang sudah di-hash menggunakan **bcrypt** |
| `created_at` | `TIMESTAMP` | NOT NULL, DEFAULT `CURRENT_TIMESTAMP` | Waktu pembuatan data user |

---

### B. Spesifikasi API Endpoint

* **Method**: `POST`
* **Path**: `/api/users`
* **Content-Type**: `application/json`

#### Request Body:
```json
{
  "name": "Eko",
  "email": "eko@localhost",
  "password": "rahasia"
}
```

#### Aturan Validasi Request:
1. `name`: String, wajib diisi (minimal 1 karakter).
2. `email`: String berformat email valid, wajib diisi.
3. `password`: String, wajib diisi (minimal 6 karakter disarankan).

#### Response Body:

* **Sukses (HTTP Status `200 OK` atau `201 Created`)**:
  ```json
  {
    "data": "OK"
  }
  ```

* **Error - Email Sudah Terdaftar (HTTP Status `400 Bad Request`)**:
  ```json
  {
    "errors": "Email sudah terdaftar"
  }
  ```

* **Error - Validasi Input Tidak Sesuai (HTTP Status `400 Bad Request` / `422 Unprocessable Entity`)**:
  Menampilkan pesan error validasi input dari Elysia.

---

## 2. Struktur Folder & File

Pastikan kode diletakkan pada arsitektur folder berikut di dalam direktori `src`:

```text
src/
├── db/
│   ├── index.ts              # Inisialisasi koneksi Drizzle & MySQL (sudah ada)
│   └── schema.ts             # Definisi tabel database (perlu diperbarui)
├── routes/
│   └── users-route.ts        # Routing Elysia, validasi schema, pemanggilan service
├── services/
│   └── users-service.ts      # Business logic: hashing password, pengecekan email, query DB
└── index.ts                  # Entry point aplikasi, registrasi usersRoute
```

---

## 3. Panduan Implementasi Bertahap (Step-by-Step)

Ikuti tahapan di bawah ini secara berurutan:

### Langkah 1: Update Schema Database (`src/db/schema.ts`)
Buka file `src/db/schema.ts` dan sesuaikan definisi tabel `users`:

```typescript
import { int, mysqlTable, varchar, timestamp } from "drizzle-orm/mysql-core";

export const users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  email: varchar("email", { length: 255 }).notNull().unique(),
  password: varchar("password", { length: 255 }).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
```

---

### Langkah 2: Sinkronisasi Database (Push Schema)
Jalankan perintah berikut pada terminal untuk menerapkan perubahan struktur tabel ke database MySQL:

```bash
bun run db:push
```

> **Catatan**: Pastikan MySQL lokal sudah aktif dan koneksi pada file `.env` sudah benar (`DATABASE_URL=mysql://root:password@localhost:3306/vibe_coding_db`).

---

### Langkah 3: Buat Service Pengguna (`src/services/users-service.ts`)
Buat folder `src/services/` (jika belum ada) dan buat file `src/services/users-service.ts`.

File ini bertanggung jawab untuk:
1. Memeriksa apakah email sudah pernah terdaftar di database.
2. Meng-hash password menggunakan **bcrypt**.  
   *(Bun memiliki fitur built-in `Bun.password.hash(password, { algorithm: "bcrypt", cost: 10 })` tanpa perlu menginstal dependensi tambahan)*.
3. Menyimpan data user baru ke database menggunakan Drizzle ORM.

**Contoh Template Kode:**
```typescript
import { eq } from "drizzle-orm";
import { db } from "../db";
import { users } from "../db/schema";

export interface RegisterUserInput {
  name: string;
  email: string;
  password: string;
}

export class UsersService {
  /**
   * Mendaftarkan pengguna baru
   * @throws Error jika email sudah terdaftar
   */
  static async register(input: RegisterUserInput) {
    // 1. Cek apakah email sudah ada di database
    const existingUser = await db
      .select({ id: users.id })
      .from(users)
      .where(eq(users.email, input.email))
      .limit(1);

    if (existingUser.length > 0) {
      throw new Error("Email sudah terdaftar");
    }

    // 2. Hash password menggunakan bcrypt bawaan Bun
    const hashedPassword = await Bun.password.hash(input.password, {
      algorithm: "bcrypt",
      cost: 10,
    });

    // 3. Simpan data user baru ke database
    await db.insert(users).values({
      name: input.name,
      email: input.email,
      password: hashedPassword,
    });

    return { data: "OK" };
  }
}
```

---

### Langkah 4: Buat Route Elysia (`src/routes/users-route.ts`)
Buat folder `src/routes/` (jika belum ada) dan buat file `src/routes/users-route.ts`.

File ini bertanggung jawab untuk:
1. Menentukan endpoint `POST /api/users`.
2. Melakukan validasi tipe request body menggunakan schema `t.Object(...)` dari Elysia.
3. Memanggil `UsersService.register()`.
4. Mengembalikan `{ data: "OK" }` jika sukses, atau `{ errors: "Email sudah terdaftar" }` dengan HTTP status `400` jika terjadi error duplikasi.

**Contoh Template Kode:**
```typescript
import { Elysia, t } from "elysia";
import { UsersService } from "../services/users-service";

export const usersRoute = new Elysia({ prefix: "/api/users" })
  .post(
    "/",
    async ({ body, set }) => {
      try {
        const result = await UsersService.register({
          name: body.name,
          email: body.email,
          password: body.password,
        });

        set.status = 200; // atau 201
        return result;
      } catch (error: any) {
        if (error.message === "Email sudah terdaftar") {
          set.status = 400;
          return { errors: "Email sudah terdaftar" };
        }

        // Tangani error tidak terduga lainnya
        set.status = 500;
        return { errors: "Terjadi kesalahan internal server" };
      }
    },
    {
      body: t.Object({
        name: t.String({ minLength: 1, error: "Nama wajib diisi" }),
        email: t.String({ format: "email", error: "Format email tidak valid" }),
        password: t.String({ minLength: 1, error: "Password wajib diisi" }),
      }),
    }
  );
```

---

### Langkah 5: Daftarkan Route ke Entry Point (`src/index.ts`)
Buka file `src/index.ts` dan daftarkan `usersRoute` menggunakan method `.use(usersRoute)`:

```typescript
import { Elysia } from "elysia";
import { usersRoute } from "./routes/users-route";

const port = process.env.PORT || 3000;

const app = new Elysia()
  .get("/", () => ({
    message: "🚀 Bun + Elysia + Drizzle + MySQL Starter API is running!",
    status: "online",
    timestamp: new Date().toISOString(),
  }))
  .get("/health", () => ({
    status: "ok",
    uptime: process.uptime(),
  }))
  .use(usersRoute) // <-- Registrasi routes users
  .listen(port);

console.log(`🦊 Server is running at http://${app.server?.hostname}:${app.server?.port}`);

export type App = typeof app;
```

---

## 4. Pengujian & Verifikasi (Testing)

Jalankan server pengembangan:
```bash
bun run dev
```

### Test Case 1: Registrasi User Sukses
Jalankan perintah cURL berikut pada terminal lain:
```bash
curl -X POST http://localhost:3000/api/users \
  -H "Content-Type: application/json" \
  -d '{"name": "Eko", "email": "eko@localhost", "password": "rahasia"}'
```
**Ekspektasi Output (HTTP 200/201):**
```json
{
  "data": "OK"
}
```

---

### Test Case 2: Registrasi dengan Email yang Sama (Duplikat)
Kirim ulang perintah cURL di atas dengan email yang sama (`eko@localhost`).

**Ekspektasi Output (HTTP 400):**
```json
{
  "errors": "Email sudah terdaftar"
}
```

---

### Test Case 3: Registrasi dengan Input Kosong / Tidak Valid
```bash
curl -X POST http://localhost:3000/api/users \
  -H "Content-Type: application/json" \
  -d '{"name": "", "email": "bukan-email", "password": ""}'
```
**Ekspektasi Output:**
Server mengembalikan response status error validasi schema (HTTP 400 / 422).

---

## 5. Checklist Penyelesaian (Definition of Done)

- [ ] Kolom `password` di database menyimpan string hash bcrypt, bukan plain text (contoh format: `$2b$...` atau `$2a$...`).
- [ ] Endpoint `POST /api/users` dapat menerima request sesuai spesifikasi.
- [ ] Registrasi berhasil mengembalikan `{ "data": "OK" }`.
- [ ] Pendaftaran dengan email yang telah terdaftar mengembalikan HTTP 400 `{ "errors": "Email sudah terdaftar" }`.
- [ ] Kode terorganisir rapi di `src/routes/users-route.ts` dan `src/services/users-service.ts`.
- [ ] Type checking berjalan bersih tanpa error: `bun x tsc --noEmit`.

