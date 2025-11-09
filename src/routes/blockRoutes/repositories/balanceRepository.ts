import type { DatabaseClient } from '@/@types/fastify';
import { balanceDeltas } from '@/db/schema';
import { NotFoundError } from '@/utils/appError';
import { eq, sum } from 'drizzle-orm';

class BalanceRepository {
  constructor(private db: DatabaseClient) {}

  async getAddressBalance(address: string) {
    const [totalBalance] = await this.db
      .select({
        balance: sum(balanceDeltas.balanceDelta),
      })
      .from(balanceDeltas)
      .where(eq(balanceDeltas.address, address));

    if (totalBalance.balance == null) {
      throw new NotFoundError('Address not found');
    }

    return totalBalance.balance ?? 0;
  }
}

export default BalanceRepository;
