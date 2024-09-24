// backend/base62.js
const BASE62_ALPHABET = '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ';

function encode(num) {
  let encoded = '';
  while (num > 0) {
    encoded = BASE62_ALPHABET[num % 62] + encoded;
    num = Math.floor(num / 62);
  }
  return encoded || BASE62_ALPHABET[0];
}

module.exports = { encode };
