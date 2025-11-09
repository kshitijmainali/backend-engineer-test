import { expect } from 'bun:test';
const genesisBlock = {
  height: 1,
  id: '162485272432eda0c84e3d0733c200a7b93afeef465f78d95c21725da7d011fb',
  transactions: [
    {
      id: 'genesistx123',
      inputs: [],
      outputs: [
        {
          address: '1',
          value: 50,
        },
        {
          address: '2',
          value: 25,
        },
      ],
    },
  ],
};

export const genesisBlockRow = {
  id: genesisBlock.id,
  height: 1,
  createdAt: expect.any(String),
};

export const genesisTransactions = {
  id: genesisBlock.transactions[0].id,
  blockHeight: 1,
  createdAt: expect.any(String),
};

export const genesisOutputs = [
  {
    txId: genesisBlock.transactions[0].id,
    index: 0,
    address: '1',
    amount: '50',
    blockHeight: 1,
  },
  {
    txId: genesisBlock.transactions[0].id,
    index: 1,
    address: '2',
    amount: '25',
    blockHeight: 1,
  },
];
export const genesisBalanceDeltas = [
  {
    address: '1',
    balanceDelta: '50',
    blockHeight: 1,
  },
  {
    address: '2',
    balanceDelta: '25',
    blockHeight: 1,
  },
];

const regularBlockAfterGenesisBlock = {
  height: 2,
  id: '1024d352a6716d0b0931a76b3dfe8e0519c417eb41ccf396bc827ff89c5c2153',
  transactions: [
    {
      id: 'regulartx123',
      inputs: [{ txId: genesisBlock.transactions[0].id, index: 0 }],
      outputs: [
        {
          address: '3',
          value: 25,
        },
        {
          address: '4',
          value: 25,
        },
      ],
    },
  ],
};

export const regularBlockRow = {
  id: regularBlockAfterGenesisBlock.id,
  height: regularBlockAfterGenesisBlock.height,
  createdAt: expect.any(String),
};

export const regularBlockTransactions = {
  id: regularBlockAfterGenesisBlock.transactions[0].id,
  blockHeight: regularBlockAfterGenesisBlock.height,
  createdAt: expect.any(String),
};

export const regularBlockOutputs = [
  {
    txId: regularBlockAfterGenesisBlock.transactions[0].id,
    index: 0,
    address: '3',
    amount: '25',
    blockHeight: 2,
  },
  {
    txId: regularBlockAfterGenesisBlock.transactions[0].id,
    index: 1,
    address: '4',
    amount: '25',
    blockHeight: 2,
  },
];
export const regularBlockBalanceDeltas = [
  {
    address: '1',
    balanceDelta: '-50',
    blockHeight: 2,
  },
  {
    address: '3',
    balanceDelta: '25',
    blockHeight: 2,
  },
  {
    address: '4',
    balanceDelta: '25',
    blockHeight: 2,
  },
];

export const regularBlockSpentOutputs = [
  {
    txId: genesisBlock.transactions[0].id,
    index: 0,
    spentAtHeight: 2,
    spentByTransactionId: regularBlockAfterGenesisBlock.transactions[0].id,
  },
];

export const blockWithIncompleteInputBalanceSpending = {
  height: 2,
  id: '1024d352a6716d0b0931a76b3dfe8e0519c417eb41ccf396bc827ff89c5c2153',
  transactions: [
    {
      id: 'regulartx123',
      inputs: [{ txId: genesisBlock.transactions[0].id, index: 0 }],
      outputs: [
        {
          address: '5',
          value: 25,
        },
      ],
    },
  ],
};

export const blockWithInvalidInputTransactionAndIndexPair = {
  height: 2,
  id: '1024d352a6716d0b0931a76b3dfe8e0519c417eb41ccf396bc827ff89c5c2153',
  transactions: [
    {
      id: 'regulartx123',
      inputs: [{ txId: 'invalidTxId', index: 1 }],
      outputs: [
        {
          address: '5',
          value: 25,
        },
      ],
    },
  ],
};

export { genesisBlock, regularBlockAfterGenesisBlock };
