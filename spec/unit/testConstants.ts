import type {
  PostBlockBody,
  TransactionRequestBody,
} from '@/routes/blockRoutes/schema/postBlock';
import { mock } from 'bun:test';

const mockGenesisBlock: PostBlockBody = {
  height: 1,
  id: 'genesis-block-id',
  transactions: [
    {
      id: 'genesis-tx',
      inputs: [],
      outputs: [
        { address: 'miner-address', value: 50 },
        { address: 'another-address', value: 25 },
      ],
    },
  ],
};

const mockRegularTransaction: TransactionRequestBody = {
  id: 'regular-tx',
  inputs: [{ txId: 'previous-tx', index: 0 }],
  outputs: [
    { address: 'recipient1', value: 30 },
    { address: 'recipient2', value: 20 },
  ],
};

const mockRegularBlock: PostBlockBody = {
  height: 2,
  id: 'regular-block-id',
  transactions: [mockRegularTransaction],
};

const mockExistingOutputs = [
  {
    txId: 'previous-tx',
    index: 0,
    address: 'previous-address',
    amount: '50',
    blockHeight: 1,
  },
];

const mockTransactionProcessor = {
  processOutput: mock(() =>
    Promise.resolve({
      currentTransactionRow: [{ id: 'tx-id', blockHeight: 1 }],
      currentOutputRows: [
        {
          txId: 'tx-id',
          index: 0,
          address: 'addr',
          amount: '50',
          blockHeight: 1,
        },
      ],
    })
  ),
  processSpentOutput: mock(() =>
    Promise.resolve({
      currentSpentOutputRows: [],
      currentBalanceDeltas: new Map(),
    })
  ),
  formatBalanceDeltaTableRows: mock(() => [
    { address: 'addr', balanceDelta: '50', blockHeight: 1 },
  ]),
};

export {
  mockExistingOutputs,
  mockGenesisBlock,
  mockRegularBlock,
  mockRegularTransaction,
  mockTransactionProcessor,
};
