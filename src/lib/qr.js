import QRCode from 'qrcode-generator';
import { BANKS } from './banks.js';

const tlv = (tag, value) => `${tag}${String(value.length).padStart(2, '0')}${value}`;

const crc16 = (input) => {
  let crc = 0xffff;

  for (const char of input) {
    const code = char.charCodeAt(0) << 8;
    crc ^= code;

    for (let bit = 0; bit < 8; bit += 1) {
      crc = (crc & 0x8000) ? ((crc << 1) ^ 0x1021) & 0xffff : (crc << 1) & 0xffff;
    }
  }

  return crc.toString(16).toUpperCase().padStart(4, '0');
};

const normalizeContent = (text) => String(text)
  .normalize('NFD')
  .replace(/[\u0300-\u036f]/g, '')
  .replace(/đ/g, 'd')
  .replace(/Đ/g, 'D')
  .replace(/[^A-Za-z0-9 ]/g, '')
  .slice(0, 25)
  .trim();

export const buildQrPayload = ({ amount, content, bankKey, account }) => {
  const bankCode = BANKS[bankKey] || '970422';
  const accountInfo = tlv('00', bankCode) + tlv('01', account);
  const merchant = tlv('00', 'A000000727') + tlv('01', accountInfo) + tlv('02', 'QRIBFTTA');
  const payload = `000201010212${tlv('38', merchant)}5303704${tlv('54', String(Math.round(amount)))}5802VN${tlv('62', tlv('08', content))}6304`;
  return `${payload}${crc16(payload)}`;
};

export const buildQrText = (name) => `SplitQR ${normalizeContent(name)}`;

export const buildQrSvg = ({ amount, content, bankKey, account, ownerName }) => {
  const qr = QRCode(0, 'M');
  const payload = buildQrPayload({ amount, content, bankKey, account, ownerName });
  qr.addData(payload);
  qr.make();
  return qr.createSvgTag({ scalable: true });
};
