import type { DatabaseClient } from '@/@types/fastify';
import BalanceRepository from '../repositories/balanceRepository';

class BalanceService {
  private repository: BalanceRepository;
  constructor(private db: DatabaseClient) {
    this.repository = new BalanceRepository(db);
  }

  async getAddressBalance(address: string) {
    try {
      const totalBalance = await this.repository.getAddressBalance(address);
      return totalBalance;
    } catch (error) {
      console.error(error);
      throw error;
    }
  }
}

export default BalanceService;
