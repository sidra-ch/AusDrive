# 📱 AusDrive Mobile App

Complete React Native mobile app for AusDrive Fleet Management System.

## 🚀 Quick Start

```bash
# Install dependencies
npm install

# Start development server
npm start

# Run on Android
npm run android

# Run on iOS
npm run ios
```

## 📖 Full Documentation

See [SETUP-GUIDE.md](./SETUP-GUIDE.md) for complete setup instructions.

## ✨ Features

- ✅ Authentication (Login/Logout)
- ✅ Dashboard with KPIs
- ✅ Cars Management
- ✅ Bookings List
- ✅ Live GPS Tracking
- ✅ Maintenance Schedule
- ✅ Bottom Tab Navigation
- ✅ Pull-to-Refresh
- ✅ Dark Theme
- ✅ Real-time Updates

## 📱 Screens

1. **Dashboard** - Overview with stats
2. **Cars** - Fleet list with filters
3. **Bookings** - Reservations management
4. **Tracking** - Live GPS monitoring
5. **Maintenance** - Service scheduling

## 🔧 Configuration

Edit `services/api.ts` to set your backend URL:

```typescript
const API_URL = 'http://YOUR_IP:3000';
```

## 📦 Building

```bash
# Build Android APK
eas build --platform android --profile preview

# Build for stores
eas build --platform android --profile production
eas build --platform ios --profile production
```

## 🎨 Customization

- **Colors**: Edit `constants/Colors.ts`
- **App Name**: Edit `app.json`
- **Icons**: Replace files in `assets/`

## 📞 Support

Check [SETUP-GUIDE.md](./SETUP-GUIDE.md) for troubleshooting.
