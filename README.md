# ARGUS

Lapisan keputusan dan bukti untuk limbah dapur MBG. Mencatat batch dari SPPG, menilai gerbang mutu, memilih fasilitas pengolahan, menugaskan armada, dan menyimpan setiap keputusan di buku besar hash chain yang bisa diverifikasi.

Tiga layanan, tiga repositori terpisah, dijalankan bersama lewat Docker Compose.

| Path | Repositori | Isi | Port |
|---|---|---|---|
| `frontend/` | [Ario627/frontendArgus](https://github.com/Ario627/frontendArgus) | React 19 + Vite: konsol DLH dan layar lapangan | `8080` |
| `backend/` | [Ario627/backendArgus](https://github.com/Ario627/backendArgus) | NestJS API, PostgreSQL + TimescaleDB, MQTT | `3001` |
| `solver/` | [Ario627/Argus-python-OR](https://github.com/Ario627/Argus-python-OR) | FastAPI + OR-Tools: penyusun rute | internal `8100` |

## Menjalankan

Prasyarat: Git, Docker 24+, dan Docker Compose v2. Tidak perlu Node, Python, PostgreSQL, atau broker MQTT di mesin Anda.

```bash
git clone --recurse-submodules https://github.com/Ario627/ARGUS.git
cd ARGUS
cp .env.example .env
docker compose up -d --build
```

Buka **http://localhost:8080**.

Build pertama memakan waktu beberapa menit. Tunggu sampai backend sehat:

```bash
docker compose ps
```

Urutan otomatis saat start: `postgres` → `migrate` → `seed` → `seed-users` → `backend` + `optimizer` → `frontend`.

### Akun demo

| Peran | Username | Password |
|---|---|---|
| Admin | `admin` | `password123` |
| Staf SPPG | `staf_demo` | `password123` |
| Pengemudi | `driver_demo` | `password123` |
| Operator fasilitas | `fasilitas_demo` | `password123` |
| Auditor DLH | `auditor_demo` | `password123` |

Kata sandi mengikuti `SEED_ADMIN_PASSWORD` di `.env`. Ubah sebelum dipakai di jaringan nyata.

### Alur uji cepat

1. Login `admin`, buka **Dashboard** untuk ringkasan dan perbandingan keputusan.
2. Login `staf_demo`, buka **Catat** (`/catat`), isi batch, simpan tanpa foto bila kamera tidak tersedia.
3. Batch otomatis masuk antrean penugasan dan memperoleh stop `AMBIL` untuk armada `DEMO-01`.
4. Login `driver_demo`, buka **Rute hari ini** (`/rute-hari-ini`) untuk melihat stop dan alternatif rute.
5. Login `fasilitas_demo` untuk konfirmasi serah terima, atau `auditor_demo` untuk membaca buku besar dan anomali.

## Yang Berjalan

| Container | Fungsi |
|---|---|
| `postgres` | TimescaleDB 2.30.2 / PostgreSQL 16 |
| `mqtt` | Eclipse Mosquitto, tanpa autentikasi (demo) |
| `optimizer` | Optimizer rute, hanya di jaringan internal |
| `migrate`, `seed`, `seed-users` | Job satu kali: skema, data demo, akun demo |
| `backend` | API `http://localhost:3001/api/v1`, health di `/health` |
| `frontend` | Nginx yang menyajikan SPA dan memproxy `/api/` ke backend |

Frontend memakai API relatif (`/api/v1`) dan Nginx meneruskannya ke backend, sehingga browser tidak perlu CORS. Foto disajikan lewat backend dengan URL bertanda tangan.

## Perintah

```bash
docker compose logs -f backend     # log satu layanan
docker compose ps                  # status dan health
docker compose up -d --build       # terapkan perubahan kode
docker compose down                # hentikan, data tetap
docker compose down -v             # hentikan dan hapus semua data demo
```

Mengubah port:

```bash
# .env
FRONTEND_PORT=9090
BACKEND_PORT=3002
```

## Clone Tanpa Submodule

Bila terlanjur clone biasa:

```bash
git submodule update --init --recursive
```

Ketiga folder akan terisi sesuai commit yang dikunci repo ini. Setiap submodule tetap punya riwayat Git sendiri; commit di repo utama hanya mencatat referensi commit.

## Catatan

- **Mode demo.** Compose memakai `NODE_ENV=development` karena mode produksi mewajibkan `MQTT_URL` berskema `mqtts://` dan rahasia berukuran penuh. Ini pilihan sadar untuk penilaian lokal, bukan konfigurasi produksi.
- **Armada demo tidak mengirim telemetri.** Status `DEMO-01` bisa berubah `STALE` setelah beberapa menit; penugasan dan rute tetap berjalan.
- **Tanpa kunci eksternal.** Google Routes dan Mapbox kosong; rute memakai OSRM publik lalu jatuh ke garis lurus bila jaringan tidak tersedia. Penyedia dipanggil dari backend, bukan dari browser.
- **Data hilang saat reset.** Semua data demo ada di volume Docker. `down -v` menghapusnya.
- **Layanan analitik tidak dijalankan.** Pemindaian digit tidak wajar akan melaporkan layanan tidak tersedia; alur utama tetap bekerja.
- **Rahasia contoh bukan untuk produksi.** Nilai di `.env.example` sengaja publik dan hanya berlaku untuk demo lokal.

## Struktur

```
ARGUS/
├── frontend/     submodule
├── backend/      submodule
├── solver/       submodule
├── docker/
├── scripts/
├── docker-compose.yml
├── .env.example
└── README.md
```

## Lisensi

UNLICENSED — perangkat lunak internal, tidak untuk didistribusikan tanpa izin.
