# Landing page tautan pribadi

Landing page statis dengan panel admin terpisah di `/atur`. Setelah setup satu
kali, Anda dapat masuk dengan email dan kata sandi, lalu menambah, mengedit,
dan menghapus tautan tanpa mengubah kode atau mengelola database secara manual.
Tampilannya memakai nuansa homepage Jepang era 90-an: tekstur kertas, tinta
indigo dan vermilion, aksen cap, serta tipografi bergaya mesin ketik.

## Status koneksi Supabase

Proyek ini sudah terhubung ke proyek Supabase `linker` dan tabel tautan serta
aturan akses sudah dibuat. Pengunjung dapat membaca tautan, sedangkan perubahan
hanya diizinkan untuk akun admin yang ditentukan.

## Setup admin satu kali

1. Di Supabase **Authentication → Users**, pilih **Add user** dan buat akun
   dengan email admin yang sudah dipasangkan ke policy di `supabase-setup.sql`.
   Tetapkan kata sandi pribadi di Supabase; jangan kirimkan ke orang lain.
2. Pastikan email pendaftaran publik dimatikan di pengaturan Authentication.
   Aturan database hanya mengizinkan email admin tersebut mengubah tautan.
3. Deploy folder proyek ke Vercel, lalu buka halaman admin di `/atur` dan masuk
   dengan akun admin.

Publishable key memang digunakan oleh situs di browser; perlindungannya berasal
dari aturan Row Level Security. Jangan pernah memasukkan `service_role` key atau
kata sandi Supabase ke file proyek.
Untuk memperbarui aplikasi statis setelah setup, deploy folder proyek seperti
biasa; pengelolaan tautan sehari-hari tidak memerlukan perubahan kode atau SQL.

## Menggunakan panel admin di `/atur`

- Isi nama, URL, keterangan, dan ikon, lalu pilih **Tambah tautan**.
- Pilih template ikon **Favicon website** untuk mengambil favicon yang terdaftar
  pada domain tujuan, termasuk favicon dengan nama/path khusus. Jika layanan
  favicon tidak menemukan ikon, halaman mencoba `/favicon.ico` lalu memakai
  simbol sebagai cadangan. Pencarian favicon memakai layanan pihak ketiga
  Icon Horse, sehingga hostname tujuan dikirim ke layanan tersebut.
- Pilih template sosial/website, emoji/simbol, atau **Gambar dari URL**.
  URL gambar khusus harus menggunakan HTTPS.
- Atur **Sesuaikan gambar** ke fit width atau fit height, dan pilih **Warna
  latar ikon**.
- Isi **Grup** untuk mengelompokkan tautan, misalnya `Karya`, `Sosial`, atau
  `Favorit`. Tautan tanpa grup masuk ke bagian **Lainnya**.
- Centang **Tampilkan sebagai ikon sosial di bawah nama** untuk menampilkan
  tautan sebagai ikon bulat di profil. Ikon yang Anda isi dipakai sebagai
  simbolnya.
- Pilih **Edit** atau **Hapus** pada daftar tautan yang tersimpan.
- Seret ikon ⠿ di samping tautan untuk mengubah urutannya. Keyboard: fokuskan
  ikon pegangan, lalu gunakan `Alt` + panah atas/bawah.
- URL menerima `https://`, `http://`, atau `mailto:`.
- Centang **Sorot tautan ini** untuk menampilkan tautan dengan warna khusus.

Halaman utama menampilkan ikon sosial di bawah nama, mengelompokkan tautan
menurut grupnya, dan menyediakan pencarian langsung berdasarkan nama,
keterangan, URL, maupun grup. Tautan dan perubahan tampil di halaman publik
setelah disimpan. HTML, CSS, dan JavaScript di-host sebagai file statis;
Supabase menangani login dan penyimpanan online.

Metadata Open Graph/Twitter, deskripsi halaman, `favicon.svg`, dan gambar kartu
berbagi `social-preview.png` (1200×630) disiapkan untuk preview saat tautan dibagikan.
Setelah mendapat domain Vercel sendiri, ubah `og:image` dan `twitter:image` di
`index.html` menjadi URL absolut situs Anda (misalnya
`https://domain-anda.vercel.app/social-preview.png`) agar preview WhatsApp dapat
mengambil gambarnya secara konsisten. Anda juga dapat menambahkan `og:url`
dengan URL halaman utama tersebut. Cache preview WhatsApp mungkin perlu
beberapa waktu untuk diperbarui.

## Deploy ke Vercel

1. Unggah folder proyek ini ke repository GitHub.
2. Di Vercel, pilih **Add New → Project**, lalu impor repository tersebut.
3. Pilih preset **Other** jika diminta. Biarkan build command dan output
   directory kosong, lalu klik **Deploy**. File `vercel.json` mengarahkan
   alamat `/atur` ke halaman admin.
