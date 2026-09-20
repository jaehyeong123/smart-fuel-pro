const QRCode = require('qrcode');
const fs = require('fs');
const path = require('path');

const url = 'https://jaehyeong123.github.io/smart-fuel-pro/';
const publicDir = path.resolve(__dirname, '../public');
const artifactDir = 'C:\\Users\\userpro\\.gemini\\antigravity\\brain\\2d6dcf93-3973-4a29-af28-d371d6d80432';

async function main() {
  // 1. Generate SVG
  const svgString = await QRCode.toString(url, { type: 'svg', margin: 2 });
  fs.writeFileSync(path.join(publicDir, 'mobile-qr.svg'), svgString);

  // 2. Generate PNG in public
  await QRCode.toFile(path.join(publicDir, 'mobile-qr.png'), url, {
    width: 400,
    margin: 2,
    color: { dark: '#065f46', light: '#ffffff' }
  });

  // 3. Copy to artifact dir for markdown embedding
  if (fs.existsSync(artifactDir)) {
    await QRCode.toFile(path.join(artifactDir, 'mobile-qr.png'), url, {
      width: 400,
      margin: 2,
      color: { dark: '#065f46', light: '#ffffff' }
    });
  }

  // 4. Print terminal string
  const termStr = await QRCode.toString(url, { type: 'terminal', small: true });
  console.log('\n=== 스마트폰 카메라로 스캔하세요 ===\n');
  console.log(termStr);
  console.log(`\n접속 URL: ${url}\n`);
}

main().catch(console.error);
