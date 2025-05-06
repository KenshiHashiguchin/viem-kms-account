import {Signature} from 'aws-kms-signer';
import {
  Address,
  CustomSource,
  Hash,
  hashTypedData,
  Hex,
  keccak256, LocalAccount,
  serializeTransaction,
  SerializeTransactionFn,
  SignableMessage,
  toBytes,
  TransactionSerializable,
  TypedData,
  TypedDataDefinition,
} from 'viem';

/**
 * Interface for a signer that can be used with toAccount
 * This is a subset of the KmsSigner interface that only includes
 * the methods we actually use
 */
export interface KmsSignerLike {
  sign(digest: Uint8Array): Promise<Signature>;
  getAddress(): Promise<Address>;
}

/**
 * Creates a viem-compatible CustomSource using AWS KMS for signing
 * @param signer KmsSignerLike instance
 * @returns A viem-compatible CustomSource
 */
export async function toKmsAccount(signer: KmsSignerLike): Promise<LocalAccount> {

  let address: Address = await signer.getAddress() as Address;
  const publicKey = '0x' + '00'.repeat(33) as Hex;
  return {
    address,
    publicKey: publicKey,// TODO
    source: 'aws-kms',
    type: 'local',

    // Optional sign method for signing raw hashes
    sign: async ({ hash }: { hash: Hash }): Promise<Hex> => {
      const hashBuffer = Buffer.from(hash.slice(2), 'hex');
      const signature: any = await signer.sign(hashBuffer); // => Signature object

      let hexSignature: string;
      if (typeof signature === 'string') {
        hexSignature = signature.startsWith('0x') ? signature : `0x${signature}`;
      } else {
        hexSignature = `0x${signature.toString('hex')}`;
      }

      return hexSignature as Hex;
    },

    // Sign message according to EIP-191
    signMessage: async ({ message }: { message: SignableMessage }): Promise<Hex> => {
      // Convert message to Buffer
      let msgBuffer: Buffer;
      if (typeof message === 'string') {
        msgBuffer = Buffer.from(message);
      } else {
        // Handle ByteArray case (which has a 'raw' property)
        const rawData = message.raw;
        if (typeof rawData === 'string') {
          // Handle hex string
          msgBuffer = Buffer.from(rawData.slice(2), 'hex');
        } else {
          // Handle Uint8Array
          msgBuffer = Buffer.from(rawData);
        }
      }

      const prefix = Buffer.from(`\x19Ethereum Signed Message:\n${msgBuffer.length}`);
      const prefixedMsg = Buffer.concat([prefix, msgBuffer]);

      // Hash the prefixed message with keccak256
      const digest = keccak256(prefixedMsg);

      // Sign the digest
      const signature: any = await signer.sign(toBytes(digest));

      let hexSignature: string;
      if (typeof signature === 'string') {
        hexSignature = signature.startsWith('0x') ? signature : `0x${signature}`;
      } else {
        hexSignature = `0x${signature.toString('hex')}`;
      }

      return hexSignature as Hex;
    },

    // Sign transaction with optional serializer
    signTransaction: async (
      transaction: TransactionSerializable,
      options?: { serializer?: SerializeTransactionFn<TransactionSerializable> }
    ): Promise<Hex> => {
      const serializer = options?.serializer ?? serializeTransaction;

      const serialized = serializer(transaction);
      const digest = keccak256(serialized);

      // sign expects Uint8Array
      const signature: any = await signer.sign(toBytes(digest));

      // Ensure the signature is in the correct Hex format (0x-prefixed)
      let hexSignature: string;
      if (typeof signature === 'string') {
        hexSignature = signature.startsWith('0x') ? signature : `0x${signature}`;
      } else {
        hexSignature = `0x${signature.toString('hex')}`;
      }

      return hexSignature as Hex;
    },

    // Sign typed data according to EIP-712
    signTypedData: async <
      const typedData extends TypedData | Record<string, unknown>,
      primaryType extends keyof typedData | 'EIP712Domain' = keyof typedData,
    >(
      parameters: TypedDataDefinition<typedData, primaryType>,
    ): Promise<Hex> => {
      const digest = hashTypedData(parameters); // 正しいEIP-712形式のdigest
      const signature: any = await signer.sign(toBytes(digest));

      return typeof signature === 'string'
        ? (signature.startsWith('0x') ? signature : `0x${signature}`) as Hex
        : (`0x${Buffer.from(signature).toString('hex')}`) as Hex;
    },
  };
}
