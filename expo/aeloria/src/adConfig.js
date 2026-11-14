// Google AdMob for Aeloria: Age of Crowns (publisher pub-5681105275743934).
// Test ads in development (Expo Go / dev builds), real ads in store builds. Never tap your own live ads.
export const USE_TEST_ADS = __DEV__;

export const ADMOB_APP_ID_IOS = 'ca-app-pub-5681105275743934~9324813833';

// Must match ADMOB.units in www/ads.js (the game sends the unit with each request; these are the fallbacks).
export const AD_UNITS = {
  appOpen: 'ca-app-pub-5681105275743934/5339281458',
  banner: 'ca-app-pub-5681105275743934/8011732161',
  interstitial: 'ca-app-pub-5681105275743934/7165554358',
  native: 'ca-app-pub-5681105275743934/3337989981',
  rewarded: 'ca-app-pub-5681105275743934/9278526460',
  rewardedInterstitial: 'ca-app-pub-5681105275743934/2904689809',
};

// Pacing lives in the game (www/ads.js → ADMOB.pace): no interruptive ads in the first 2 minutes, below
// Citadel 4, during battles, within 3 minutes of another full-screen ad, or ever for paying players.
export const MAX_AD_CONTENT_RATING = 'G';
export const CHILD_DIRECTED = false;
