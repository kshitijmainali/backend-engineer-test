import type { OutputTableRow, SpentOutputTableRow } from '@/db/schema';
import type { TransactionRequestBody } from '../schema/postBlock';

export class TransactionProcessor {
  constructor() {}

  async processOutput(transaction: TransactionRequestBody, height: number) {
    const currentOutputRows: Omit<OutputTableRow, 'id' | 'createdAt'>[] = [];

    const currentTransactionRow = [
      {
        id: transaction.id,
        blockHeight: height,
      },
    ];

    for (const [index, output] of transaction.outputs.entries()) {
      currentOutputRows.push({
        txId: transaction.id,
        index,
        address: output.address,
        amount: output.value.toString(),
        blockHeight: height,
      });
    }
    return {
      currentTransactionRow,
      currentOutputRows,
    };
  }

  processSpentOutput(
    existingOutputsBalance: OutputTableRow[],
    height: number,
    transactionId: string
  ) {
    const currentSpentOutputRows: Omit<
      SpentOutputTableRow,
      'id' | 'createdAt'
    >[] = [];
    const currentBalanceDeltas: Map<string, number> = new Map();
    for (const existingOutput of existingOutputsBalance) {
      currentSpentOutputRows.push({
        txId: existingOutput.txId,
        index: existingOutput.index,
        spentAtHeight: height,
        spentByTransactionId: transactionId,
      });
      currentBalanceDeltas.set(
        existingOutput.address,
        (currentBalanceDeltas.get(existingOutput.address) ?? 0) -
          parseFloat(existingOutput.amount)
      );
    }

    return {
      currentSpentOutputRows,
      currentBalanceDeltas,
    };
  }

  formatBalanceDeltaTableRows({
    balanceDeltaTableRows,
    height,
  }: {
    balanceDeltaTableRows: Map<string, number>;
    height: number;
  }) {
    return Array.from(balanceDeltaTableRows.entries()).map(
      ([address, balanceDelta]) => ({
        address,
        balanceDelta: balanceDelta.toString(),
        blockHeight: height,
      })
    );
  }
}
