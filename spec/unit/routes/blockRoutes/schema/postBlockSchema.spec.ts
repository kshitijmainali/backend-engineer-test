import { PostBlockSchema } from '@/routes/blockRoutes/schema/postBlock';
import { describe, expect, test } from 'bun:test';
import { validateWithSchema } from 'spec/helpers';

describe('PostBlock Schema Validation', () => {
  describe('Height Validation', () => {
    test('should accept valid height values', () => {
      const validHeights = [1, 2, 100, 999999, Number.MAX_SAFE_INTEGER];

      validHeights.forEach((height) => {
        const { isValid } = validateWithSchema(PostBlockSchema.body, {
          height,
          id: 'valid-block-id',
          transactions: [],
        });

        expect(isValid).toBe(true);
      });
    });

    test('should reject height below 1', () => {
      const invalidHeights = [0, -1, -100, -999999];

      invalidHeights.forEach((height) => {
        const { isValid } = validateWithSchema(PostBlockSchema.body, {
          height: 0,
          id: 'valid-block-id',
          transactions: [],
        });

        expect(isValid).toBe(false);
      });
    });

    test('should reject decimal heights', () => {
      const decimalHeights = 1.5;
      const { isValid } = validateWithSchema(PostBlockSchema.body, {
        height: decimalHeights,
        id: 'valid-block-id',
        transactions: [],
      });

      expect(isValid).toBe(false);
    });

    test('should reject non-integer heights', () => {
      const nonIntegers = ['1', true, null, undefined, {}, []];

      nonIntegers.forEach((height) => {
        const { isValid } = validateWithSchema(PostBlockSchema.body, {
          height,
          id: 'valid-block-id',
          transactions: [],
        });

        expect(isValid).toBe(false);
      });
    });
  });

  describe('Block ID Validation', () => {
    test('should accept valid block IDs', () => {
      const validIds = [
        'a',
        'block-id-123',
        'UPPERCASE',
        'MixedCase123',
        '1234567890',
        'a'.repeat(1000),
        'sha256-hash-like-string-with-many-characters',
      ];

      validIds.forEach((id) => {
        const { isValid } = validateWithSchema(PostBlockSchema.body, {
          height: 1,
          id,
          transactions: [],
        });

        expect(isValid).toBe(true);
      });
    });

    test('should reject empty, null or undefined block ID', () => {
      const invalidIds = ['', null, undefined];

      invalidIds.forEach((id) => {
        const { isValid } = validateWithSchema(PostBlockSchema.body, {
          height: 1,
          id,
          transactions: [],
        });

        expect(isValid).toBe(false);
      });
    });

    test('should reject non-string block IDs', () => {
      const nonStrings = [123, true, {}, [], Symbol('id')];

      nonStrings.forEach((id) => {
        const { isValid } = validateWithSchema(PostBlockSchema.body, {
          height: 1,
          id,
          transactions: [],
        });

        expect(isValid).toBe(false);
      });
    });
  });

  describe('Transaction Array Validation', () => {
    test('should accept empty transactions array', () => {
      const { isValid } = validateWithSchema(PostBlockSchema.body, {
        height: 1,
        id: 'valid-block-id',
        transactions: [],
      });

      expect(isValid).toBe(true);
    });

    test('should accept array with valid transactions', () => {
      const validTransaction = {
        id: 'validtxid123',
        inputs: [],
        outputs: [{ address: 'validaddress123', value: 100 }],
      };

      const { isValid } = validateWithSchema(PostBlockSchema.body, {
        height: 1,
        id: 'validblockid123',
        transactions: [validTransaction],
      });

      expect(isValid).toBe(true);
    });

    test('should reject null, undefined or non-array transactions', () => {
      const nonArrays = [null, undefined, {}];

      nonArrays.forEach((transactions) => {
        const { isValid } = validateWithSchema(PostBlockSchema.body, {
          height: 1,
          id: 'valid-block-id',
          transactions,
        });

        expect(isValid).toBe(false);
      });
    });
  });

  describe('Transaction ID Validation', () => {
    test('should accept valid alphanumeric transaction IDs', () => {
      const validTxIds = [
        'a',
        'abc123',
        '123456789',
        'ValidTxId',
        'UPPERCASE',
        'lowercase',
        'MixedCase123',
      ];

      validTxIds.forEach((txId) => {
        const transaction = {
          id: txId,
          inputs: [],
          outputs: [{ address: 'validAddress123', value: 100 }],
        };

        const { isValid } = validateWithSchema(PostBlockSchema.body, {
          height: 1,
          id: 'valid-block-id',
          transactions: [transaction],
        });

        expect(isValid).toBe(true);
      });
    });

    test('should reject transaction IDs with special characters or empty', () => {
      const invalidTxIds = [
        '',
        ' ',
        'tx.with.dots',
        'tx-with-dash',
        null,
        undefined,
        'tx@with@symbol',
        'tx$with$dollar',
        'tx%with%percent',
        'tx^with^caret',
        'tx&with&ampersand',
        'tx*with*asterisk',
        'tx(with)parentheses',
        'tx[with]brackets',
        'tx{with}braces',
        'tx+with+plus',
        'tx=with=equals',
        'tx<with>angles',
        'tx:with:colon',
        'tx;with;semicolon',
        'tx"with"quotes',
        'tx`with`backtick',
        'tx~with~tilde',
        'emoji🚀tx',
        'specialñchars',
        'unicode漢字tx',
      ];

      invalidTxIds.forEach((txId) => {
        const transaction = {
          id: txId,
          inputs: [],
          outputs: [{ address: 'validAddress123', value: 100 }],
        };

        const { isValid } = validateWithSchema(PostBlockSchema.body, {
          height: 1,
          id: 'valid-block-id',
          transactions: [transaction],
        });

        expect(isValid).toBe(false);
      });
    });
  });

  describe('Input Array Validation', () => {
    test('should accept array with valid inputs', () => {
      const validInput = {
        txId: 'validTxId123',
        index: 0,
      };

      const transaction = {
        id: 'validtxid123',
        inputs: [validInput],
        outputs: [{ address: 'validAddress123', value: 100 }],
      };

      const { isValid } = validateWithSchema(PostBlockSchema.body, {
        height: 1,
        id: 'valid-block-id',
        transactions: [transaction],
      });

      expect(isValid).toBe(true);
    });

    test('should reject null, undefined or non-array inputs', () => {
      const nonArrays = [null, undefined, {}, 123];

      nonArrays.forEach((inputs) => {
        const transaction = {
          id: 'valid-tx-id',
          inputs,
          outputs: [{ address: 'validAddress123', value: 100 }],
        };

        const { isValid } = validateWithSchema(PostBlockSchema.body, {
          height: 1,
          id: 'valid-block-id',
          transactions: [transaction],
        });

        expect(isValid).toBe(false);
      });
    });

    test('should reject input txId with special characters or empty', () => {
      const invalidTxIds = [
        '',
        ' ',
        null,
        undefined,
        'tx@with@symbol',
        'tx$with$dollar',
        'tx%with%percent',
        'tx^with^caret',
        'tx&with&ampersand',
        'tx*with*asterisk',
        'tx(with)parentheses',
        'tx[with]brackets',
        'tx{with}braces',
        'tx+with+plus',
        'tx=with=equals',
        'tx<with>angles',
        'tx:with:colon',
        'tx;with;semicolon',
        'tx"with"quotes',
        'tx`with`backtick',
        'tx~with~tilde',
        'emoji🚀tx',
        'specialñchars',
        'unicode漢字tx',
      ];

      invalidTxIds.forEach((txId) => {
        const input = { txId, index: 0 };
        const transaction = {
          id: 'valid-tx-id',
          inputs: [input],
          outputs: [{ address: 'validAddress123', value: 100 }],
        };

        const { isValid } = validateWithSchema(PostBlockSchema.body, {
          height: 1,
          id: 'valid-block-id',
          transactions: [transaction],
        });

        expect(isValid).toBe(false);
      });
    });
  });

  describe('Input Field Validation', () => {
    describe('Input txId Validation', () => {
      test('should accept valid input transaction IDs', () => {
        const validTxIds = ['abc123', 'ABC123', '123456', 'ValidTxId'];

        validTxIds.forEach((txId) => {
          const input = { txId, index: 0 };
          const transaction = {
            id: 'validtxid123',
            inputs: [input],
            outputs: [{ address: 'validAddress123', value: 100 }],
          };

          const { isValid } = validateWithSchema(PostBlockSchema.body, {
            height: 1,
            id: 'validblockid123',
            transactions: [transaction],
          });

          expect(isValid).toBe(true);
        });
      });

      test('should reject input transaction IDs with special characters, empty or null', () => {
        const invalidTxIds = [
          'tx-with-dash',
          '',
          ' ',
          null,
          undefined,
          'tx@symbol',
          'emoji🚀tx',
          'specialñchars',
          'unicode漢字tx',
        ];

        invalidTxIds.forEach((txId) => {
          const input = { txId, index: 0 };
          const transaction = {
            id: 'validtxid123',
            inputs: [input],
            outputs: [{ address: 'validAddress123', value: 100 }],
          };

          const { isValid } = validateWithSchema(PostBlockSchema.body, {
            height: 1,
            id: 'validblockid123',
            transactions: [transaction],
          });

          expect(isValid).toBe(false);
        });
      });
    });

    describe('Input Index Validation', () => {
      test('should accept valid input indices', () => {
        const validIndices = [0, 1, 100, 999999];

        validIndices.forEach((index) => {
          const input = { txId: 'validTxId123', index };
          const transaction = {
            id: 'validtxid123',
            inputs: [input],
            outputs: [{ address: 'validAddress123', value: 100 }],
          };

          const { isValid } = validateWithSchema(PostBlockSchema.body, {
            height: 1,
            id: 'validblockid123',
            transactions: [transaction],
          });

          expect(isValid).toBe(true);
        });
      });

      test('should reject negative, decimal or non-number input indices', () => {
        const negativeIndices = [
          -1,
          -100,
          -999,
          1.5,
          100.1,
          0.1,
          '1',
          true,
          null,
          undefined,
          {},
          [],
          'index',
        ];

        negativeIndices.forEach((index) => {
          const input = { txId: 'validTxId123', index };
          const transaction = {
            id: 'validtxid123',
            inputs: [input],
            outputs: [{ address: 'validAddress123', value: 100 }],
          };

          const { isValid } = validateWithSchema(PostBlockSchema.body, {
            height: 1,
            id: 'validblockid123',
            transactions: [transaction],
          });

          expect(isValid).toBe(false);
        });
      });
    });
  });

  describe('Output Array Validation', () => {
    test('should accept array with valid outputs', () => {
      const validOutput = {
        address: 'validAddress123',
        value: 100,
      };

      const transaction = {
        id: 'validtxid123',
        inputs: [],
        outputs: [validOutput],
      };

      const { isValid } = validateWithSchema(PostBlockSchema.body, {
        height: 1,
        id: 'valid-block-id',
        transactions: [transaction],
      });

      expect(isValid).toBe(true);
    });

    test('should accept multiple valid outputs', () => {
      const validOutputs = [
        { address: 'validAddress1', value: 100 },
        { address: 'validAddress2', value: 200 },
        { address: 'validAddress3', value: 300 },
      ];

      const transaction = {
        id: 'validtxid123',
        inputs: [],
        outputs: validOutputs,
      };

      const { isValid } = validateWithSchema(PostBlockSchema.body, {
        height: 1,
        id: 'valid-block-id',
        transactions: [transaction],
      });

      expect(isValid).toBe(true);
    });

    test('should reject null/undefined or non-array outputs', () => {
      const nonArrays = [null, undefined, {}, 123];

      nonArrays.forEach((outputs) => {
        const transaction = {
          id: 'validtxid123',
          inputs: [],
          outputs,
        };

        const { isValid } = validateWithSchema(PostBlockSchema.body, {
          height: 1,
          id: 'valid-block-id',
          transactions: [transaction],
        });

        expect(isValid).toBe(false);
      });
    });
  });

  describe('Output Field Validation', () => {
    describe('Output Address Validation', () => {
      test('should accept valid alphanumeric addresses', () => {
        const validAddresses = [
          'a',
          'abc123',
          '123456789',
          'ValidAddress',
          'UPPERCASE',
          'lowercase',
          'MixedCase123',
          'a'.repeat(100),
        ];

        validAddresses.forEach((address) => {
          const output = { address, value: 100 };
          const transaction = {
            id: 'validtxid123',
            inputs: [],
            outputs: [output],
          };

          const { isValid } = validateWithSchema(PostBlockSchema.body, {
            height: 1,
            id: 'validblockid123',
            transactions: [transaction],
          });

          expect(isValid).toBe(true);
        });
      });

      test('should reject addresses with special characters, empty, null or non string values', () => {
        const invalidAddresses = [
          '',
          ' ',
          null,
          undefined,
          'address@with@at',
          'address#with#hash',
          'address$with$dollar',
          'address%with%percent',
          'address^with^caret',
          'address&with&ampersand',
          'address*with*asterisk',
          'address(with)parentheses',
          'address[with]brackets',
          'address{with}braces',
          'address+with+plus',
          'address=with=equals',
          'address<with>angles',
          'address:with:colon',
          'address;with;semicolon',
          'address`with`backtick',
          'address~with~tilde',
          'emoji🚀address',
          'specialñchars',
          'unicode漢字address',
        ];

        invalidAddresses.forEach((address) => {
          const output = { address, value: 100 };
          const transaction = {
            id: 'validtxid123',
            inputs: [],
            outputs: [output],
          };

          const { isValid } = validateWithSchema(PostBlockSchema.body, {
            height: 1,
            id: 'validblockid123',
            transactions: [transaction],
          });

          expect(isValid).toBe(false);
        });
      });
    });

    describe('Output Value Validation', () => {
      test('should accept valid output values', () => {
        const validValues = [0, 0.1, 1, 100, 999999.99, 123456789];

        validValues.forEach((value) => {
          const output = { address: 'validAddress123', value };
          const transaction = {
            id: 'validtxid123',
            inputs: [],
            outputs: [output],
          };

          const { isValid } = validateWithSchema(PostBlockSchema.body, {
            height: 1,
            id: 'validblockid123',
            transactions: [transaction],
          });

          expect(isValid).toBe(true);
        });
      });

      test('should reject negative, decimal, non-number or non-string output values', () => {
        const negativeValues = [
          -0.1,
          -1,
          -100,
          -999999,
          '1',
          true,
          null,
          undefined,
          {},
          [],
          'value',
          NaN,
          Infinity,
          -Infinity,
        ];

        negativeValues.forEach((value) => {
          const output = { address: 'validAddress123', value };
          const transaction = {
            id: 'validtxid123',
            inputs: [],
            outputs: [output],
          };

          const { isValid } = validateWithSchema(PostBlockSchema.body, {
            height: 1,
            id: 'validblockid123',
            transactions: [transaction],
          });

          expect(isValid).toBe(false);
        });
      });
    });
  });

  describe('Complete Valid Block Examples', () => {
    test('should accept valid coinbase transaction block', () => {
      const validBlock = {
        height: 1,
        id: 'validblockid123',
        transactions: [
          {
            id: 'coinbaseTx123',
            inputs: [],
            outputs: [
              {
                address: 'minerAddress123',
                value: 50,
              },
            ],
          },
        ],
      };

      const { isValid } = validateWithSchema(PostBlockSchema.body, validBlock);

      expect(isValid).toBe(true);
    });

    test('should accept valid regular transaction block', () => {
      const validBlock = {
        height: 2,
        id: 'validblockid123',
        transactions: [
          {
            id: 'regularTx123',
            inputs: [
              {
                txId: 'previousTx123',
                index: 0,
              },
            ],
            outputs: [
              {
                address: 'recipientAddress123',
                value: 30,
              },
              {
                address: 'changeAddress123',
                value: 20,
              },
            ],
          },
        ],
      };

      const { isValid } = validateWithSchema(PostBlockSchema.body, validBlock);

      expect(isValid).toBe(true);
    });

    test('should accept block with multiple transactions', () => {
      const validBlock = {
        height: 3,
        id: 'validblockid123',
        transactions: [
          {
            id: 'tx1',
            inputs: [],
            outputs: [
              {
                address: 'address1',
                value: 100,
              },
            ],
          },
          {
            id: 'tx2',
            inputs: [
              {
                txId: 'tx1',
                index: 0,
              },
            ],
            outputs: [
              {
                address: 'address2',
                value: 50,
              },
              {
                address: 'address3',
                value: 50,
              },
            ],
          },
        ],
      };

      const { isValid } = validateWithSchema(PostBlockSchema.body, validBlock);

      expect(isValid).toBe(true);
    });
  });

  describe('Complex Invalid Block Examples', () => {
    test('should reject block with mixed valid and invalid transactions', () => {
      const invalidBlock = {
        height: 1,
        id: 'valid-block-id',
        transactions: [
          {
            id: 'validTx123',
            inputs: [],
            outputs: [
              {
                address: 'validAddress123',
                value: 100,
              },
            ],
          },
          {
            id: 'invalid-tx-with-dash',
            inputs: [],
            outputs: [
              {
                address: 'anotherValidAddress',
                value: 50,
              },
            ],
          },
        ],
      };

      const { isValid } = validateWithSchema(
        PostBlockSchema.body,
        invalidBlock
      );

      expect(isValid).toBe(false);
    });

    test('should accept block with multiple inputs and outputs', () => {
      const validBlock = {
        height: 1,
        id: 'validblockid123',
        transactions: [
          {
            id: 'validtxid123',
            inputs: [
              {
                txId: 'validtxid123',
                index: 0,
              },
              {
                txId: 'validtxid123',
                index: 1,
              },
              {
                txId: 'validtxid123',
                index: 2,
              },
            ],
            outputs: [
              {
                address: 'validaddress123',
                value: 100,
              },
              {
                address: 'validaddress123',
                value: 100,
              },
              {
                address: 'validaddress123',
                value: 100,
              },
            ],
          },
        ],
      };

      const { isValid } = validateWithSchema(PostBlockSchema.body, validBlock);

      expect(isValid).toBe(true);
    });
  });
});
