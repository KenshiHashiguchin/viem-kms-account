# viem-kms-account

A viem Custom Account implementation that uses AWS KMS to sign transactions and messages.

## Installation

```bash
npm install viem-kms-account
```

## Usage

```typescript
import { createPublicClient, http } from 'viem';
import { mainnet } from 'viem/chains';
import { toAccount } from 'viem-kms-account';

// Create a viem account using your AWS KMS key ID
const account = toAccount('arn:aws:kms:region:account-id:key/key-id');

// Use the account with viem
const publicClient = createPublicClient({
  chain: mainnet,
  transport: http()
});

// Get the account address
const address = await account.getAddress();
console.log('Account address:', address);

// Sign a message
const signature = await account.signMessage('Hello, world!');
console.log('Message signature:', signature);

// Sign a transaction
const signedTx = await account.signTransaction({
  to: '0x...',
  value: '0x...',
  gasLimit: '0x...',
  maxFeePerGas: '0x...',
  maxPriorityFeePerGas: '0x...',
  nonce: 0,
  type: 2,
  chainId: 1
});
console.log('Signed transaction:', signedTx);
```

## Features

- Implements viem's Account interface
- Uses AWS KMS for secure key management and signing
- Supports EIP-191 for message signing
- Supports transaction signing

## Requirements

- AWS credentials configured in your environment
- An asymmetric ECC_SECG_P256K1 key in AWS KMS

## E2E Testing

This project includes an end-to-end testing environment using Docker Compose and Geth.

### Prerequisites

- Docker and Docker Compose installed on your machine
- Node.js and npm

### Running E2E Tests

To run the end-to-end tests:

```bash
# Make the script executable
chmod +x scripts/run-e2e-tests.sh

# Run the tests
./scripts/run-e2e-tests.sh
```

This script will:
1. Start a Docker container with Geth running in development mode
2. Run the e2e tests against the local Geth node
3. Stop the Docker container when tests are complete

### Manual Testing

You can also start the Docker environment manually:

```bash
# Start the Docker containers
docker-compose up -d

# Run the e2e tests
RUN_E2E=true npx jest --testMatch="**/test/e2e/**/*.e2e.test.ts"

# Stop the Docker containers
docker-compose down
```

## License

MIT
