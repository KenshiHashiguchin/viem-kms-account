import {createPublicClient, http, TransactionSerializable} from 'viem';
import { toKmsAccount } from '../../src';
import { KmsSignerAdapter } from '../test-utils/kms-signer-adapter';

// Create a KmsSignerAdapter instance directly
const kmsSignerAdapter = new KmsSignerAdapter();

// Define the local development chain
const localChain = {
  id: 1337,
  name: 'Local',
  network: 'local',
  nativeCurrency: {
    decimals: 18,
    name: 'Ether',
    symbol: 'ETH',
  },
  rpcUrls: {
    default: {
      http: ['http://localhost:8545'],
    },
    public: {
      http: ['http://localhost:8545'],
    },
  },
};

describe('KMS Account E2E Tests', () => {
  const runE2E = process.env.RUN_E2E === 'true';

  beforeAll(() => {
    if (!runE2E) {
      console.log('Skipping E2E tests. Set RUN_E2E=true to run them.');
    }
  });

  it('should connect to local Geth node', async () => {
    const publicClient = createPublicClient({
      chain: localChain,
      transport: http(),
    });

    // Check if we can get the block number
    const blockNumber = await publicClient.getBlockNumber();
    expect(blockNumber).toBeDefined();
    console.log(`Current block number: ${blockNumber}`);
  });

  it('should create a KMS account and get its address', async () => {
    // Use toAccount with KmsSignerAdapter directly
    const account = await toKmsAccount(kmsSignerAdapter);
    expect(account.address).toBeDefined();
    const address = account.address;
    console.log(`Account address: ${address.toString()}`);
  });

  it('should sign a message with KMS account', async () => {
    // Use toAccount with KmsSignerAdapter directly
    const account = await toKmsAccount(kmsSignerAdapter);
    const signature = await account.signMessage({ message: 'Hello, world!' });
    expect(signature).toBeDefined();
  });

  it('should sign an EIP-1559 transaction with KMS account', async () => {
    const account = await toKmsAccount(kmsSignerAdapter);

    const tx: TransactionSerializable = {
      to: account.address,
      value: BigInt(0),
      gas: BigInt(21000),
      chainId: 1337,
      type: 'eip1559', // EIP-1559タイプのトランザクション
      maxPriorityFeePerGas: BigInt(1),
      maxFeePerGas: BigInt(1),
    };

    const signature = await account.signTransaction(tx as any);
    expect(signature).toMatch(/^0x[0-9a-fA-F]{130}$/);
  });

  it('should sign a legacy transaction with KMS account', async () => {
    const account = await toKmsAccount(kmsSignerAdapter);

    const tx: TransactionSerializable = {
      type: 'legacy',
      to: account.address,
      value: 0n,
      gas: 21000n,
      gasPrice: 1n,
    };

    const signature = await account.signTransaction(tx);
    expect(signature).toMatch(/^0x[0-9a-fA-F]{130}$/);
  });

  it('should sign an EIP-2930 transaction with KMS account', async () => {
    const account = await toKmsAccount(kmsSignerAdapter);

    const tx: TransactionSerializable = {
      chainId: 1337,
      type: 'eip2930',
      to: account.address,
      value: 0n,
      gas: 21000n,
      gasPrice: 1n,
      accessList: [],
    };

    const signature = await account.signTransaction(tx);
    expect(signature).toMatch(/^0x[0-9a-fA-F]{130}$/);
  });

  // TODO sendRawTransaction
});
