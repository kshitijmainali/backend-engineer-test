import GetAddressBalanceSchema from '@/routes/blockRoutes/schema/getAdressBalance';
import { describe, expect, test } from 'bun:test';
import { validateWithSchema } from 'spec/helpers';

describe('GetAddressBalance Schema Validation', () => {
  describe('Schema Structure Validation', () => {
    test('should have correct structure for params schema', () => {
      expect(GetAddressBalanceSchema.params).toBeDefined();
      expect(GetAddressBalanceSchema.params.type).toBe('object');
    });

    test('should have address field in params schema', () => {
      // TypeBox schemas have specific structure we can validate
      const schema = GetAddressBalanceSchema.params as any;
      expect(schema.properties).toBeDefined();
      expect(schema.properties.address).toBeDefined();
      expect(schema.properties.address.type).toBe('string');
      expect(schema.properties.address.minLength).toBe(1);
      expect(schema.properties.address.pattern).toBe('^[a-zA-Z0-9]+$');
    });

    test('should have response schema defined', () => {
      expect(GetAddressBalanceSchema.response).toBeDefined();
      expect(GetAddressBalanceSchema.response[200]).toBeDefined();
      expect(GetAddressBalanceSchema.response[400]).toBeDefined();
    });

    test('should have correct success response structure', () => {
      const successResponse = GetAddressBalanceSchema.response[200] as any;
      expect(successResponse.type).toBe('object');
      expect(successResponse.properties).toBeDefined();
      expect(successResponse.properties.balance).toBeDefined();
      expect(successResponse.properties.balance.type).toBe('number');
    });

    test('should have correct error response structure', () => {
      const errorResponse = GetAddressBalanceSchema.response[400] as any;
      expect(errorResponse.type).toBe('object');
      expect(errorResponse.properties).toBeDefined();
      expect(errorResponse.properties.message).toBeDefined();
      expect(errorResponse.properties.message.type).toBe('string');
    });
  });

  describe('Address Parameter Validation', () => {
    test('should accept valid alphanumeric addresses', () => {
      const validAddresses = [
        'a',
        'abc123',
        'ABC123',
        '123456789',
        'ValidAddress',
        'UPPERCASE',
        'lowercase',
        'MixedCase123',
        '123',
        'Address123',
        'TestAddress',
        'a'.repeat(100),
      ];

      validAddresses.forEach((address) => {
        const { isValid } = validateWithSchema(GetAddressBalanceSchema.params, {
          address,
        });

        expect(isValid).toBe(true);
      });
    });

    test('should reject addresses with special characters, empty, whitespace, null or non string values', () => {
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
        const { isValid } = validateWithSchema(GetAddressBalanceSchema.params, {
          address,
        });

        expect(isValid).toBe(false);
      });
    });
  });
});
