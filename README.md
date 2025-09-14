# FIFA 25 Turnuva Takip Sistemi

Modern ve kullanıcı dostu FIFA 25 turnuva yönetim sistemi. React ve Node.js ile geliştirilmiştir.

## 🚀 Özellikler

- **Dinamik Lig Sistemi**: Admin panelinden kolayca lig oluşturma
- **Takım Yönetimi**: 2 renkli otomatik logo oluşturma sistemi
- **Otomatik Fikstür**: Round-robin lig sistemi
- **Gerçek Zamanlı Puan Durumu**: Otomatik hesaplanan istatistikler
- **Maç Yönetimi**: Skor girişi, tarih/saha/hava durumu takibi
- **Responsive Tasarım**: Mobil ve masaüstü uyumlu
- **Türkçe Arayüz**: Tamamen Türkçe kullanıcı deneyimi

## 🛠️ Teknolojiler

- **Frontend**: React, React Router, Axios
- **Backend**: Node.js, Express, SQLite
- **Auth**: JWT, bcryptjs
- **Styling**: CSS3, Flexbox, Grid
- **Deployment**: Vercel Ready

## 📦 Kurulum

### 1. Bağımlılıkları Yükle

```bash
# Root dependencies
npm install

# Frontend dependencies
cd frontend
npm install
```

### 2. Geliştirme Ortamında Çalıştır

```bash
# Root dizinde - hem backend hem frontend'i başlatır
npm run dev

# Veya ayrı ayrı:
npm run server  # Backend (port 5000)
npm run client  # Frontend (port 3000)
```

### 3. Production Build

```bash
npm run build
npm start
```

## 🔧 Yapılandırma

### Environment Variables (.env)
```
PORT=5000
JWT_SECRET=your-secret-key
NODE_ENV=development
```

### Database
SQLite veritabanı otomatik olarak `database/tournament.db` konumunda oluşturulur.

## 👤 Admin Erişimi

- **URL**: `/admin`
- **Kullanıcı Adı**: `batuhan`
- **Şifre**: `das`

## 📱 Kullanım

### 1. Lig Oluşturma
1. Admin paneline giriş yapın
2. "Lig Yönetimi" sekmesinden yeni lig oluşturun
3. Takım sayısı ve tur sayısını belirleyin

### 2. Takım Ekleme
1. Oluşturulan ligi seçin
2. "Takım Yönetimi" sekmesine geçin
3. Takım adı ve renklerini seçerek takım ekleyin

### 3. Fikstür Oluşturma
1. Tüm takımları ekledikten sonra "Fikstür Oluştur" butonuna tıklayın
2. Sistem otomatik olarak round-robin fikstür oluşturacak

### 4. Maç Sonuçları
1. "Maç Yönetimi" sekmesinden maçları yönetin
2. Skor, tarih, saha ve hava durumu bilgilerini güncelleyin

## 🚀 Deployment (Vercel)

### 1. Vercel CLI Kurulumu
```bash
npm i -g vercel
```

### 2. Deploy
```bash
vercel --prod
```

### 3. Vercel Yapılandırması
`vercel.json` dosyası projeye dahil edilmiştir.

## 📊 API Endpoints

### Authentication
- `POST /api/auth/login` - Admin girişi
- `GET /api/auth/verify` - Token doğrulama

### Leagues
- `GET /api/leagues` - Tüm ligler
- `POST /api/leagues` - Yeni lig (Admin)
- `GET /api/leagues/:id` - Lig detayı
- `GET /api/leagues/:id/standings` - Puan durumu

### Teams
- `GET /api/teams/league/:leagueId` - Lig takımları
- `POST /api/teams` - Takım ekle (Admin)
- `GET /api/teams/:id` - Takım detayı ve maç geçmişi

### Matches
- `GET /api/matches/league/:leagueId` - Lig maçları
- `POST /api/matches/generate-fixture` - Fikstür oluştur (Admin)
- `PUT /api/matches/:id/result` - Maç sonucu güncelle (Admin)

## 🔒 Güvenlik

- JWT tabanlı authentication
- bcryptjs ile şifre hashleme
- CORS koruması
- SQL injection koruması

## 🐛 Sorun Giderme

### Port Çakışması
Eğer 3000 veya 5000 portları kullanımdaysa:
```bash
PORT=3001 npm run client
PORT=5001 npm run server
```

### Database Sorunu
Database dosyasını silip yeniden başlatın:
```bash
rm database/tournament.db
npm run server
```

## 📄 Lisans

MIT License - Kişisel ve ticari kullanım için ücretsizdir.

## 🤝 Katkıda Bulunma

1. Fork yapın
2. Feature branch oluşturun (`git checkout -b feature/AmazingFeature`)
3. Commit yapın (`git commit -m 'Add some AmazingFeature'`)
4. Push yapın (`git push origin feature/AmazingFeature`)
5. Pull Request açın

## 📞 Destek

Herhangi bir sorun veya öneri için issue açabilirsiniz.

---

⚽ **FIFA 25 Turnuva Takip Sistemi** - Arkadaşlarınızla turnuva keyfi!
