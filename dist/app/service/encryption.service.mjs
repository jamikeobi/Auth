import sjcl from "sjcl";
import dotenv from "dotenv";
dotenv.config();
export class EncryptionService {
  psk = process.env.PRIVATE_SESSION_KEY;
  constructor() {}

  /**
   * Calculate a 32 bit FNV-1a hash
   * Found here: https://gist.github.com/vaiorabbit/5657561
   * Ref.: http://isthe.com/chongo/tech/comp/fnv/
   *
   * @param {string} str the input value
   * @param {boolean} [asString=false] set to true to return the hash value as
   *     8-digit hex string instead of an integer
   * @param {integer} [seed] optionally pass the hash of the previous chunk
   * @returns {integer | string}
   */
  hashFnv32a(str, asString, seed = undefined) {
    /*jshint bitwise:false */
    var i,
      l,
      hval = seed === undefined ? 0x811c9dc5 : seed;

    for (i = 0, l = str.length; i < l; i++) {
      hval ^= str.charCodeAt(i);
      hval +=
        (hval << 1) + (hval << 4) + (hval << 7) + (hval << 8) + (hval << 24);
    }
    if (asString) {
      // Convert to 8 digit hex string
      return ("0000000" + (hval >>> 0).toString(16)).substr(-8);
    }
    return hval >>> 0;
  }

  hashSha256(data) {
    let dataBit = sjcl.hash.sha256.hash(data);
    let dataHash = sjcl.codec.hex.fromBits(dataBit);
    return dataHash;
  }
  encryptSha256(data) {
    return sjcl.encrypt(this.psk, data);
  }
  decryptSha256(data) {
    return sjcl.decrypt(this.psk, data);
  }
}
