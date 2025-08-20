export type Account = {
  id: number;
  description: string;
  value: number;
  installment?: string;
  type: 'nubank' | 'boleto' | 'outro_cartao';
  owner?: { id: number; name: string };
  dueDate?: string;
};

export async function listAccounts(): Promise<Account[]> {
  const res = await fetch('/api/accounts');
  if (!res.ok) throw new Error('Erro ao buscar contas');
  return res.json();
}

export async function createAccount(account: Partial<Account>) {
  const res = await fetch('/api/accounts', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(account),
  });
  if (!res.ok) throw new Error('Erro ao criar conta');
  return res.json();
}
