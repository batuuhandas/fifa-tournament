# FIFA 25 Turnuva Takip Sistemi

Bu proje, React frontend ve Node.js/Express backend ile geliştirilmiş modern bir FIFA 25 turnuva yönetim sistemidir.

## Proje Yapısı

- **Frontend**: React 18, React Router, Axios (Port: 3000)
- **Backend**: Node.js, Express, SQLite3, JWT Auth (Port: 5001) 
- **Database**: SQLite - otomatik oluşturulur
- **Styling**: CSS3 Grid/Flexbox, modern gradient tasarım

## Özellikler Tamamlandı ✅

- ✅ Dinamik lig oluşturma sistemi
- ✅ Takım yönetimi (2 renkli otomatik logo)
- ✅ Otomatik round-robin fikstür oluşturma
- ✅ Maç sonucu girişi ve programlama
- ✅ Gerçek zamanlı puan durumu hesaplama
- ✅ Admin authentication (batuhan:das)
- ✅ Responsive tasarım
- ✅ Türkçe arayüz
- ✅ SQLite database otomatik kurulum

## Çalıştırma

```bash
# Backend (Terminal 1)
cd fifa-tournament-tracker
PORT=5001 node backend/server.js

# Frontend (Terminal 2) 
cd fifa-tournament-tracker/frontend
npm start
```

**URL'ler:**
- Ana site: http://localhost:3000
- Admin panel: http://localhost:3000/admin
- API: http://localhost:5001/api

## Admin Erişim
- Kullanıcı adı: `batuhan`
- Şifre: `das`

## Deployment Ready
- Vercel yapılandırması hazır (vercel.json)
- Environment variables tanımlandı
- Production build script'leri hazır

## Geliştirilecek Özellikler (İsteğe Bağlı)
- ⚪ Email bildirim sistemi
- ⚪ Kullanıcı kayıt sistemi
- ⚪ CSV export özelliği
- ⚪ Takım istatistik grafikleri
