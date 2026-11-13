// Optional AdMob mediation adapters (iOS). Off by default: list networks in app.json only after you
// create the matching mediation groups in AdMob, and add each network's SKAdNetwork IDs.
//   ["./plugins/withAdMobMediation", { "networks": ["AppLovin", "Unity", "Liftoff", "Mintegral", "Pangle", "Meta"] }]
const { withDangerousMod } = require('expo/config-plugins');
const fs = require('fs');
const path = require('path');

const PODS = {
  AppLovin: 'GoogleMobileAdsMediationAppLovin',
  Unity: 'GoogleMobileAdsMediationUnity',
  Liftoff: 'GoogleMobileAdsMediationVungle',
  Mintegral: 'GoogleMobileAdsMediationMintegral',
  Pangle: 'GoogleMobileAdsMediationPangle',
  Meta: 'GoogleMobileAdsMediationFacebook',
};
const START = '# >>> aeloria admob mediation', END = '# <<< aeloria admob mediation';
const escape = s => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

module.exports = function withAdMobMediation(config, { networks = [] } = {}) {
  return withDangerousMod(config, ['ios', async cfg => {
    const file = path.join(cfg.modRequest.platformProjectRoot, 'Podfile');
    if (!fs.existsSync(file)) return cfg;
    let pod = fs.readFileSync(file, 'utf8');
    pod = pod.replace(new RegExp(`\\n?${escape(START)}[\\s\\S]*?${escape(END)}\\n?`, 'g'), '\n');   // idempotent
    const lines = networks.filter(n => PODS[n]).map(n => `  pod '${PODS[n]}'`);
    if (lines.length && pod.includes('use_expo_modules!')) {
      pod = pod.replace(/use_expo_modules!\n/, m => `${m}${START}\n${lines.join('\n')}\n${END}\n`);
    }
    fs.writeFileSync(file, pod);
    return cfg;
  }]);
};
