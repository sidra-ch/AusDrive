const { expo } = require("./app.json");

module.exports = () => {
  const googleMapsApiKey = process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY;

  return {
    ...expo,
    ios: {
      ...(expo.ios || {}),
      config: {
        ...((expo.ios && expo.ios.config) || {}),
        ...(googleMapsApiKey ? { googleMapsApiKey } : {}),
      },
    },
    android: {
      ...(expo.android || {}),
      config: {
        ...((expo.android && expo.android.config) || {}),
        ...(googleMapsApiKey
          ? { googleMaps: { apiKey: googleMapsApiKey } }
          : {}),
      },
    },
  };
};