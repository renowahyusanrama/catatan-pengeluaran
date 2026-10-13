export interface Transaction {
  id: string;
  amount: number;
  description: string;
  category: string;
  date: string;
  note: string;
  createdAt: string;
}

export interface Budget {
  month: string;
  amount: number;
}

export type TransactionInput = {
  amount: number;
  description: string;
  category: string;
  date: string;
  note: string;
};

export type DbStatus = 'local' | 'remote' | 'remote_unconfigured' | 'remote_auth_required' | 'remote_error';

export interface ApiError {
  error: string;
  detail?: string;
}

export interface ListResult {
  data: Transaction[];
  total: number;
}