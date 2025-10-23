import { PrismaClient } from '@prisma/client';
import { prisma } from '../lib/database';

export abstract class BaseService {
  protected db: PrismaClient;

  constructor() {
    this.db = prisma;
  }

  protected async executeTransaction<T>(
    operations: (tx: Omit<PrismaClient, '$connect' | '$disconnect' | '$on' | '$transaction' | '$use' | '$extends'>) => Promise<T>
  ): Promise<T> {
    return this.db.$transaction(operations);
  }

  protected handleError(error: any, context: string): never {
    console.error(`Error in ${context}:`, error);
    throw error;
  }
}