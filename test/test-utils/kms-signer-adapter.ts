import { ec as EC } from 'elliptic';
import { randomBytes } from 'crypto';
import { publicKeyToAddress } from 'viem/utils';
import { Address } from 'viem'; // viem の型
import { Buffer } from 'buffer';
import { Signature } from "aws-kms-signer";

const ec = new EC('secp256k1');

export class KmsSignerAdapter {
  private readonly keyPair: EC.KeyPair;

  constructor() {
    const privateKey = randomBytes(32);
    this.keyPair = ec.keyFromPrivate(privateKey);
  }

  async sign(digest: Uint8Array): Promise<Signature> {
    const sig = this.keyPair.sign(digest, { canonical: true });
    const r = sig.r.toArrayLike(Buffer, 'be', 32);
    const s = sig.s.toArrayLike(Buffer, 'be', 32);
    const v = (sig.recoveryParam ?? 0) + 27;

    return Signature.fromRSV(r, s, v);
  }

  async getAddress(): Promise<Address> {
    const pubKey = this.keyPair.getPublic(false, 'hex'); // 非圧縮公開鍵（hex文字列）
    const pubKeyBuf = Buffer.from(pubKey, 'hex');
    return publicKeyToAddress(`0x${pubKeyBuf}`) as Address;
  }
}
