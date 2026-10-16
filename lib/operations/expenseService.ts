import 'server-only';
import { adminDb } from '@/lib/firebase/admin';
import { Expense, ExpenseSchema, ExpenseCategory } from '@/lib/schemas/operations';
import { logAuditEvent } from '@/lib/audit/auditLogger';
import { hasPermission, type UserRole } from '@/lib/auth/roles';

export async function createExpense(
  data: Omit<Expense, 'id' | 'expenseNumber' | 'createdAt' | 'updatedAt'>,
  actorUid: string,
  actorRole: UserRole
): Promise<Expense> {
  if (actorRole === 'customer' || !hasPermission(actorRole, 'finance:manage')) {
    throw new Error('Forbidden: Insufficient permissions to record expenses');
  }

  const timestamp = Date.now();
  const year = new Date().getFullYear();
  const randomSuffix = Math.floor(1000 + Math.random() * 9000);
  const expenseNumber = `EXP-${year}-${randomSuffix}`;

  const expenseRef = adminDb.collection('expenses').doc();

  const validated = ExpenseSchema.parse({
    ...data,
    id: expenseRef.id,
    expenseNumber,
    createdAt: timestamp,
    updatedAt: timestamp,
  });

  await expenseRef.set(validated);

  await logAuditEvent({
    actorUid,
    actorRole,
    action: 'expense_recorded',
    targetType: 'expenses',
    targetId: validated.id,
    afterSummary: {
      expenseNumber: validated.expenseNumber,
      category: validated.category,
      amountPaise: validated.amountPaise,
      vendorName: validated.vendorName,
    },
  });

  return validated;
}

export async function listExpenses(options?: {
  category?: string;
  startDate?: number;
  endDate?: number;
  limit?: number;
}): Promise<Expense[]> {
  let query = adminDb.collection('expenses').orderBy('date', 'desc');

  if (options?.category && options.category !== 'all') {
    query = query.where('category', '==', options.category) as any;
  }

  const snapshot = await query.limit(options?.limit || 100).get();
  let expenses: Expense[] = [];
  snapshot.forEach((doc) => expenses.push(doc.data() as Expense));

  if (options?.startDate) {
    expenses = expenses.filter((e) => e.date >= options.startDate!);
  }
  if (options?.endDate) {
    expenses = expenses.filter((e) => e.date <= options.endDate!);
  }

  return expenses;
}

export interface ExpenseSummary {
  totalExpensePaise: number;
  byCategory: Record<ExpenseCategory, number>;
  expenseCount: number;
}

export async function getExpenseSummary(): Promise<ExpenseSummary> {
  const expenses = await listExpenses({ limit: 500 });
  const byCategory: Record<string, number> = {};
  let totalExpensePaise = 0;

  for (const exp of expenses) {
    totalExpensePaise += exp.amountPaise;
    byCategory[exp.category] = (byCategory[exp.category] || 0) + exp.amountPaise;
  }

  return {
    totalExpensePaise,
    byCategory: byCategory as Record<ExpenseCategory, number>,
    expenseCount: expenses.length,
  };
}
