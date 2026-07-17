Frontend + Backend : Next.js (App Router, TypeScript)
Database           : MySQL
ORM                : Prisma
Realtime           : Socket.io (opsional, atau polling)
File Storage       : Local filesystem atau MinIO
Auth               : NextAuth.js / JWT custom
Chart              : react-chartjs-2
Deployment         : Node.js + PM2 + Nginx di server kamu

-- ============================================
-- 1. USERS & ROLES (needed for Approval Chain)
-- ============================================
CREATE TABLE users (
  id            INT AUTO_INCREMENT PRIMARY KEY,
  nama          VARCHAR(100) NOT NULL,
  username      VARCHAR(50) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  role          ENUM('PIC','TL','GL','ADM') NOT NULL,
  factory       ENUM('F2','F3','F4') NOT NULL,
  shift         ENUM('Nonshift','Shift A','Shift B'),
  created_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- 2. LAPORAN MAINTENANCE (Report History)
-- ============================================
CREATE TABLE laporan (
  id            INT AUTO_INCREMENT PRIMARY KEY,
  no_mold       VARCHAR(50) NOT NULL,
  jenis         ENUM('OH Mold','CM','Preventive','Lainnya') NOT NULL,
  factory       ENUM('F2','F3','F4') NOT NULL,
  pic_id        INT NOT NULL,
  tanggal       DATE NOT NULL,
  part          VARCHAR(100),
  komentar      TEXT,
  jadwal_id     INT NULL,             -- kalau ditarik dari jadwal (buatLaporanDariJadwal)
  created_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (pic_id) REFERENCES users(id),
  FOREIGN KEY (jadwal_id) REFERENCES jadwal_mingguan(id),
  INDEX idx_no_mold (no_mold),
  INDEX idx_tanggal (tanggal),
  INDEX idx_factory (factory)
);

-- ============================================
-- 3. CHECKSHEET (1:1 dengan laporan)
-- ============================================
CREATE TABLE checksheet (
  id            INT AUTO_INCREMENT PRIMARY KEY,
  laporan_id    INT NOT NULL UNIQUE,   -- 1 laporan = 1 checksheet
  checklist     JSON,                  -- item OK/NG, fleksibel, jarang di-query per-field
  jam_mulai     TIME,
  jam_selesai   TIME,
  jumlah_orang  INT DEFAULT 1,
  tarif_per_jam DECIMAL(12,2),         -- standar tarif MP cost
  created_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (laporan_id) REFERENCES laporan(id) ON DELETE CASCADE
);

-- Sparepart diganti -> baris terpisah, bukan array JSON,
-- supaya bisa di-SUM langsung untuk Mold History cost calc
CREATE TABLE checksheet_sparepart (
  id            INT AUTO_INCREMENT PRIMARY KEY,
  checksheet_id INT NOT NULL,
  nama_sparepart VARCHAR(150) NOT NULL,
  qty           INT NOT NULL DEFAULT 1,
  harga_satuan  DECIMAL(12,2) NOT NULL,
  FOREIGN KEY (checksheet_id) REFERENCES checksheet(id) ON DELETE CASCADE
);

-- Foto checksheet
CREATE TABLE checksheet_foto (
  id            INT AUTO_INCREMENT PRIMARY KEY,
  checksheet_id INT NOT NULL,
  file_path     VARCHAR(255) NOT NULL,  -- path lokal atau URL MinIO
  uploaded_at   TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (checksheet_id) REFERENCES checksheet(id) ON DELETE CASCADE
);

-- ============================================
-- 4. APPROVAL (baris per role, BUKAN 1 JSON gabungan)
-- Ini kunci fix untuk logic "Belum Masuk Tahap Anda"
-- ============================================
CREATE TABLE checksheet_approval (
  id            INT AUTO_INCREMENT PRIMARY KEY,
  checksheet_id INT NOT NULL,
  role          ENUM('PIC','TL','GL','ADM') NOT NULL,
  user_id       INT NULL,              -- NULL = belum ttd
  signed_at     TIMESTAMP NULL,
  UNIQUE KEY uniq_checksheet_role (checksheet_id, role),
  FOREIGN KEY (checksheet_id) REFERENCES checksheet(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id)
);
-- Query "pending untuk TL": role='PIC' signed_at IS NOT NULL
--                            AND role='TL' signed_at IS NULL (same checksheet_id)

-- ============================================
-- 5. JADWAL MINGGUAN
-- ============================================
CREATE TABLE jadwal_mingguan (
  id            INT AUTO_INCREMENT PRIMARY KEY,
  minggu_ke     INT NOT NULL,
  tahun         INT NOT NULL,
  no_mold       VARCHAR(50) NOT NULL,
  pic_id        INT NOT NULL,
  tanggal_rencana DATE,
  status        ENUM('Belum Dikerjakan','Sudah Dikerjakan') DEFAULT 'Belum Dikerjakan',
  FOREIGN KEY (pic_id) REFERENCES users(id),
  INDEX idx_minggu (minggu_ke, tahun)
);

-- ============================================
-- 6. MOLD BOOK (static DB + cloud override)
-- ============================================
CREATE TABLE mold_book (
  no_mold         VARCHAR(50) PRIMARY KEY,
  tonase          VARCHAR(50),
  mesin           VARCHAR(100),
  heater_standar  JSON,
  foto_mold       VARCHAR(255),
  foto_produk     VARCHAR(255),
  updated_by      INT NULL,
  updated_at      TIMESTAMP NULL,
  FOREIGN KEY (updated_by) REFERENCES users(id)
);
-- Catatan: MOLD_DB besar dari file HTML jadi SEED DATA (migration/seeder),
-- bukan hardcode di frontend lagi. Kolom di atas jadi source of truth tunggal
-- (tidak perlu tabel override terpisah karena ini sudah menggantikan constant + override jadi satu).

-- ============================================
-- 7. DASHBOARD: OVERTIME & PLANNING TARGET
-- ============================================
CREATE TABLE overtime_entry (
  id            INT AUTO_INCREMENT PRIMARY KEY,
  user_id       INT NOT NULL,
  bulan         DATE NOT NULL,         -- simpan sbg tanggal 1 (YYYY-MM-01)
  jam_rencana   DECIMAL(6,2) DEFAULT 0,
  jam_aktual    DECIMAL(6,2) DEFAULT 0,
  FOREIGN KEY (user_id) REFERENCES users(id),
  UNIQUE KEY uniq_user_bulan (user_id, bulan)
);

CREATE TABLE planning_target (
  id            INT AUTO_INCREMENT PRIMARY KEY,
  bulan         DATE NOT NULL,
  shift         ENUM('Nonshift','Shift A','Shift B') NOT NULL,
  target_oh     INT NOT NULL,
  UNIQUE KEY uniq_bulan_shift (bulan, shift)
);

-- ============================================
-- 8. SAFETY CALENDAR
-- ============================================
CREATE TABLE safety_log (
  id            INT AUTO_INCREMENT PRIMARY KEY,
  tanggal       DATE NOT NULL UNIQUE,
  status        ENUM('No Accident','Accident') NOT NULL,
  keterangan    TEXT
);

sugity-mold-maintenance/
├── prisma/
│   ├── schema.prisma              # schema MySQL (tabel dari diskusi sebelumnya)
│   ├── seed.ts                    # seeder MOLD_DB besar dari Index_v21.html
│   └── migrations/
│
├── public/
│   └── uploads/                   # foto mold/produk/checksheet (kalau storage lokal)
│
├── src/
│   ├── app/
│   │   ├── (auth)/
│   │   │   └── login/
│   │   │       └── page.tsx
│   │   │
│   │   ├── (dashboard)/                 # grup route setelah login
│   │   │   ├── layout.tsx               # sidebar + role-based nav
│   │   │   ├── dashboard/
│   │   │   │   └── page.tsx             # modul 5: Dashboard & Chart.js
│   │   │   │
│   │   │   ├── laporan/
│   │   │   │   ├── page.tsx             # modul 2: Riwayat Laporan (list + filter)
│   │   │   │   ├── baru/page.tsx        # buat laporan manual
│   │   │   │   └── [id]/
│   │   │   │       ├── page.tsx         # detail laporan
│   │   │   │       └── checksheet/page.tsx  # form checksheet
│   │   │   │
│   │   │   ├── mold-history/
│   │   │   │   └── page.tsx             # modul 3: cari & cetak riwayat per no. mold
│   │   │   │
│   │   │   ├── mold-book/
│   │   │   │   ├── page.tsx             # modul 4: list & search
│   │   │   │   └── [no_mold]/page.tsx   # detail + edit (role ADM/GL)
│   │   │   │
│   │   │   ├── jadwal/
│   │   │   │   └── page.tsx             # jadwal mingguan
│   │   │   │
│   │   │   └── approval/
│   │   │       └── page.tsx             # modul 6: antrean approval sesuai role login
│   │   │
│   │   ├── api/                         # route handlers (backend logic)
│   │   │   ├── auth/[...nextauth]/route.ts
│   │   │   ├── laporan/
│   │   │   │   ├── route.ts             # GET (list+filter), POST (create)
│   │   │   │   └── [id]/route.ts        # GET detail, PATCH, DELETE
│   │   │   ├── checksheet/
│   │   │   │   ├── route.ts
│   │   │   │   └── [id]/
│   │   │   │       ├── route.ts
│   │   │   │       └── approve/route.ts # POST tandaTanganChecksheet()
│   │   │   ├── mold-book/
│   │   │   │   ├── route.ts
│   │   │   │   └── [no_mold]/route.ts
│   │   │   ├── mold-history/route.ts    # kalkulasi cost per mold
│   │   │   ├── dashboard/
│   │   │   │   ├── overtime/route.ts
│   │   │   │   ├── planning/route.ts
│   │   │   │   ├── safety/route.ts
│   │   │   │   └── approval-progress/route.ts
│   │   │   ├── jadwal/route.ts
│   │   │   └── upload/route.ts          # handle foto (kompres + simpan)
│   │   │
│   │   ├── layout.tsx
│   │   └── globals.css
│   │
│   ├── components/
│   │   ├── ui/                          # button, input, modal, table (reusable)
│   │   ├── charts/
│   │   │   ├── OvertimeChart.tsx
│   │   │   ├── PlanningChart.tsx
│   │   │   ├── FrekuensiHarianChart.tsx
│   │   │   ├── SafetyChart.tsx
│   │   │   └── ApprovalProgressChart.tsx
│   │   ├── laporan/
│   │   │   ├── LaporanTable.tsx
│   │   │   ├── LaporanFilter.tsx
│   │   │   └── ChecksheetForm.tsx
│   │   ├── mold-book/
│   │   │   ├── MoldBookTable.tsx
│   │   │   └── MoldBookEditForm.tsx
│   │   └── approval/
│   │       └── ApprovalQueueCard.tsx
│   │
│   ├── lib/
│   │   ├── prisma.ts                    # Prisma client singleton
│   │   ├── auth.ts                      # NextAuth config + role helper
│   │   ├── costCalculator.ts            # logic MP cost & sparepart cost (modul 3)
│   │   ├── approvalChain.ts             # logic urutan PIC->TL->GL->ADM (modul 6)
│   │   └── imageCompress.ts             # ganti canvas compress dari HTML lama
│   │
│   ├── types/
│   │   ├── laporan.ts
│   │   ├── checksheet.ts
│   │   └── moldbook.ts
│   │
│   └── middleware.ts                    # proteksi route by role (PIC/TL/GL/ADM)
│
├── .env                                 # DATABASE_URL, NEXTAUTH_SECRET, dll
├── .env.example
├── next.config.js
├── package.json
├── tsconfig.json
└── README.md

# Context: Aplikasi Maintenance Mold - PT Sugity Creatives

Dokumen ini berisi rangkuman keseluruhan logika dari `Index_v21.html`. Rangkuman ini akan digunakan sebagai dasar (context) untuk memigrasikan aplikasi ke arsitektur yang lebih modern (seperti Next.js atau Vite) ke depannya.

## 1. Sistem Penyimpanan Data (Storage & Submit)
- **Hybrid Storage**: Aplikasi secara default menggunakan **Firebase Firestore** untuk menyimpan data (jika `FIREBASE_AKTIF` bernilai true). Jika Firebase gagal atau dimatikan, aplikasi akan fallback menggunakan **LocalStorage** browser.
- **Struktur Key-Value**: Semua data disimpan dalam format Key-Value string (JSON stringified). Terdapat pola penamaan (prefix) untuk key:
  - `laporan:<id>` untuk data Laporan Maintenance.
  - `checksheet:<id>` untuk detail Checksheet (termasuk OK/NG, komentar, sparepart, dan approval).
  - `jadwal:<minggu>:<id>` untuk jadwal maintenance mingguan.
  - `moldbuku:<no>` untuk override data Mold Book statis.
  - `overtime:<bulan>` dan `planningTarget:<bulan>:<shift>` untuk target dashboard.
- **Submit Laporan & Checksheet**: 
  - Laporan dapat dibuat secara manual maupun ditarik dari jadwal (`buatLaporanDariJadwal`) yang akan meng-autofill form.
  - Data Checksheet (`simpanChecksheet`) disimpan sebagai JSON yang memuat `checklist`, `costBox`, `spareparts`, `foto`, dan data `ttd` (Tanda Tangan/Approval).

## 2. Riwayat Laporan (Report History)
**Alur Kerja (Workflow):**
1. **Fetching Data:** Saat tab Riwayat dibuka, aplikasi (lewat fungsi `muatDaftar()`) akan meminta seluruh data ke Firebase yang memiliki *prefix* (awalan) key `laporan:`.
2. **Validasi Checksheet:** Secara bersamaan, aplikasi juga mengambil seluruh daftar ID dari key `checksheet:`. Tujuannya adalah untuk mencocokkan setiap laporan—jika laporan A memiliki ID yang sama dengan checksheet A di database, maka laporan tersebut ditandai dengan label "Sudah Isi Checksheet".
3. **Penyaringan (Filtering):** Aplikasi mengeksekusi fungsi `terapkanFilter()`. Semua data laporan mentah dimasukkan ke saringan (filter) berlapis:
   - *Tanggal*: Mencocokkan tanggal kalender yang diinput user atau otomatis hari ini.
   - *Area (Factory)*: Menyesuaikan factory yang dipilih.
   - *Pencarian Teks*: Menggunakan logika teks (huruf kecil) untuk mencari kecocokan nomor mold, nama PIC, part, atau komentar.
   - *Status Checksheet*: Jika user menekan filter "Belum CS", aplikasi hanya menyisakan data laporan yang belum punya checksheet.
4. **Pengurutan (Sorting):** Laporan yang belum diisi checksheet-nya akan dipaksa naik ke urutan paling atas. Setelah itu, sisa laporannya diurutkan dari yang usianya paling baru.
5. **Render:** Daftar tersebut diubah menjadi elemen HTML tabel riwayat agar bisa dibaca oleh Anda.

## 3. Riwayat Mold (Mold History)
**Alur Kerja (Workflow):**
1. **Pencarian Nomor Spesifik:** Saat user mengetikkan "Nomor Mold" dan melakukan pencarian, aplikasi memanggil `muatRiwayatMold()`.
2. **Penyaringan Total:** Aplikasi mengambil **semua** riwayat laporan dan menyortirnya secara khusus hanya untuk mencari laporan yang nomor mold-nya sama persis dengan yang diketikkan (mengabaikan filter tanggal).
3. **Pengambilan Detail Biaya:** Untuk setiap laporan yang cocok (misalnya ada 5 riwayat OH/CM di mold tersebut), sistem akan membuka data JSON `checksheet:`-nya satu per satu.
4. **Kalkulasi Cost Otomatis:**
   - **Man Power Cost (MP):** Dihitung dari detail pengerjaan (jam selesai dikurangi jam mulai = lama waktu, dikali jumlah orang, dikali standar tarif per jam).
   - **Sparepart Cost:** Aplikasi melooping array item sparepart yang diganti dan menjumlahkan harganya.
5. **Akumulasi Historis:** Biaya MP dan Sparepart digabung menjadi *Total Cost* per riwayat. Semua *Total Cost* dari riwayat tersebut dijumlahkan lagi menjadi *Total Keseluruhan Biaya Mold*.
6. **Tampilan & Cetak:** Datanya ditampilkan dalam tabel kronologis dan disediakan tombol khusus yang akan membuka *print area* baru untuk mencetak laporan rekam jejak tersebut ke dalam file PDF.

## 4. Mold Book
**Alur Kerja (Workflow):**
1. **Inisialisasi Database Statis:** File `Index_v21.html` memiliki sebuah variabel raksasa `const MOLD_DB` yang berisi spesifikasi bawaan (tonase, mesin, heater standar) ratusan mold. 
2. **Override Database Cloud:** Saat Mold Book dimuat, sistem mengecek Firebase (key `moldbuku:`). Jika ada mold yang spesifikasinya pernah diedit oleh Admin, spesifikasi statis bawaan dari file HTML akan "ditimpa" (di-override) dengan data dari cloud.
3. **Mode Baca vs Mode Edit:** 
   - Jika akun yang login adalah "Member" (PIC), mereka hanya bisa mencari, melihat spesifikasi, dan melihat standar parameter mesin dari mold tersebut.
   - Jika yang login adalah **ADM** atau **Group Leader (GL)**, tombol `Edit` akan muncul.
4. **Proses Edit & Upload:** Saat mode edit aktif, tabel berubah menjadi form input. Admin bisa mengubah standard parameter atau menambahkan/mengganti *foto mold* dan *foto produk*. Foto ini dikompres menggunakan kanvas secara asinkron (*base64 compress*) agar ringan saat disimpan.
5. **Penyimpanan:** Saat disimpan, data override di-push ke cloud sehingga user lain akan langsung melihat spesifikasi Mold terbaru dari perangkat manapun. Mendukung fitur export/import ke format Excel.

## 5. Dashboard
**Alur Kerja (Workflow):**
Fungsi `muatDashboard()` membungkus pemuatan analitik yang dijalankan satu per satu menggunakan modul `Chart.js`:
1. **Grafik Overtime vs Aktual:** Sistem menarik seluruh entri `overtime:` di bulan berjalan. Jam aktual dan rencana diakumulasikan berdasarkan **nama PIC**. Sistem lalu mengelompokkan PIC ke 3 Shift (Nonshift, Shift A, Shift B) dan membuat 3 grafik batang secara terpisah. Sistem juga mencari selisih terbesar untuk menentukan "Top Performer".
2. **Grafik Planning (Target vs Aktual):** 
   - Mengambil *Target Planning* (angka) bulanan yang di-set ADM.
   - Menelusuri seluruh laporan "OH Mold" aktual di bulan tersebut. Laporan aktual ini **hanya** dihitung jika array approval-nya sudah komplit (PIC, TL, GL, ADM sudah tanda tangan semua).
   - Target dibagi per minggu dan disandingkan dengan hasil aktual dalam grafik.
3. **Grafik Frekuensi Harian (Overhaul):** Aplikasi memecah data bulan tersebut berdasarkan kalender harian, menghitung ada berapa laporan OH Mold setiap tanggal, dan merendernya dalam grafik bar harian.
4. **Grafik Safety:** Bar chart untuk merekap status "No Accident" vs "Accident" bulanan berdasarkan entri kalender safety.
5. **Grafik Progress Approval:** Memfilter laporan yang masuk di "Minggu Ini". Lalu membuat 4 Pie Chart/Donat terpisah. Chart akan membandingkan total laporan minggu ini vs berapa jumlah laporan yang sudah dibubuhkan *signature* (tanda tangan) oleh masing-masing jabatan (PIC, TL, GL, ADM).

## 6. Approval System
**Alur Kerja (Workflow):**
1. **Pendeteksian Role:** Terdapat rantai persetujuan kaku: `PIC` -> `TL` -> `GL` -> `ADM`. Saat membuka tab Approval (`muatApprovalList()`), aplikasi membaca role (jabatan) dari user yang sedang login (misal user login sebagai `TL` / Team Leader).
2. **Logika Antrean (Pending List):**
   - Sistem menelusuri seluruh checksheet. 
   - Sistem akan memunculkan sebuah checksheet di layar Anda *hanya jika*: (a) Role tepat di bawah Anda (`PIC`) sudah melakukan tanda tangan, DAN (b) Anda sendiri (`TL`) belum melakukan tanda tangan.
   - Jika `PIC` belum tanda tangan, checksheet tersebut dianggap "Belum Masuk Tahap Anda" (disembunyikan).
3. **Eksekusi Tanda Tangan:** 
   - Ketika tombol "Tanda Tangan" diklik (`tandaTanganChecksheet()`), aplikasi menanamkan identitas nama akun Anda beserta *Timestamp* (waktu & tanggal saat itu juga) ke dalam file JSON checksheet (menjadi property misal: `ttdTl: {nama: "Budi", tanggal: "..."}`).
   - Sistem menyimpan perubahan tersebut kembali ke database Firebase.
4. **Eskalasi:** Begitu tersimpan, JSON terupdate. Cek syarat di nomor 2 akan dievaluasi ulang, dan checksheet tersebut akan otomatis lenyap dari layar `TL` dan langsung pindah menjadi antrean baru (muncul) di layar `GL` (Group Leader).
