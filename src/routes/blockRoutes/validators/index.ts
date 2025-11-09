import { BadRequestError } from '@/utils/appError';
import crypto from 'crypto';
import type { BlockRepository } from '../repositories/blockRepository';
import type {
  InputRequestBody,
  PostBlockBody,
  TransactionRequestBody,
} from '../schema/postBlock';

class BlockValidator {
  constructor(private repository: BlockRepository) {}

  async validateBlock({ height, id, transactions }: PostBlockBody) {
    const transactionIds = transactions
      .map((transaction) => transaction.id)
      .join('');

    const blockId = crypto
      .createHash('sha256')
      .update(height.toString() + transactionIds)
      .digest('hex');

    console.log('blockId', blockId);

    if (blockId !== id) {
      throw new BadRequestError('Invalid block id');
    }

    const latestBlock = await this.repository.getLatestBlock();

    if (latestBlock.recentHeight && latestBlock.recentHeight !== height - 1) {
      throw new BadRequestError('Invalid block height');
    }

    if (!latestBlock.recentHeight && height !== 1) {
      throw new BadRequestError('Invalid block height');
    }

    if (height > 1 && !transactions.length) {
      throw new BadRequestError(
        'Transactions are required for non-coinbase blocks'
      );
    }
  }

  async validateTransactionId(transactionsBody: TransactionRequestBody[]) {
    if (transactionsBody.length === 0) {
      return;
    }

    const transactionIds = transactionsBody.map(
      (transaction) => transaction.id
    );

    const uniqueTransactionIds = [...new Set(transactionIds)];

    if (uniqueTransactionIds.length !== transactionIds.length) {
      throw new BadRequestError('Duplicate transaction ids found in the block');
    }

    const existingTransactionWithSameIds =
      await this.repository.getTransactionWithSameIds(transactionIds);

    return existingTransactionWithSameIds;
  }

  async validateIfTransactionAreSpent(transactionInputs: InputRequestBody[]) {
    if (!transactionInputs.length) {
      return;
    }

    const alreadySpentOutputs =
      await this.repository.getSpentOutputsByTransactionAndIndex(
        transactionInputs
      );

    if (alreadySpentOutputs?.length > 0) {
      throw new BadRequestError(
        `The outputs with transaction and index pairs ${alreadySpentOutputs.map((spentOutput) => `(${spentOutput.txId}, ${spentOutput.index})`).join(', ')} have already been spent`
      );
    }
  }

  async validateOutputBalance(transaction: TransactionRequestBody) {
    if (!transaction.inputs.length) {
      return [];
    }

    const existingOutputs =
      await this.repository.getOutputsByTransactionAndIndex(transaction.inputs);

    if (existingOutputs?.length !== transaction.inputs.length) {
      throw new BadRequestError(
        `Some of the input transaction and index pairs do not exist!`
      );
    }

    const totalInputAmount = existingOutputs.reduce(
      (acc, output) => acc + parseFloat(output.amount),
      0
    );

    const totalOutputAmount = transaction.outputs.reduce(
      (acc, output) => acc + output.value,
      0
    );

    if (totalInputAmount !== totalOutputAmount) {
      throw new BadRequestError(
        'Total input amount does not match total output amount'
      );
    }

    return existingOutputs;
  }
}

export default BlockValidator;
