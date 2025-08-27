export type Status = 'Pendente' | 'Cancelado' | 'quitado';

export type Collaborator = {
  id: string;
  name: string;
  orderId?: number;
};

export interface Competencia {
  year: number;
  month: number;
}

export type Account = {
  id: string;
  collaboratorId: string;
  collaboratorName: string;
  description: string;
  value: number;
  parcelasTotal: number | null;
  month: number;
  year: number;
  status: 'Cancelado' | 'quitado' | 'ativo' | 'Pendente';
  createdAt: string;
  updatedAt: string;
  cancelledAt?: string;
  paid?: boolean;
  paidByMonth?: { [monthKey: string]: boolean }; // Para contas recorrentes: "2024-08": true
};

export type Finance = {
  id: string;
  pessoa: string;
  descricao: string;
  valor: number;
  start?: Competencia;
  parcelasTotal: number | 'X';
  status: 'ativo' | 'Pendente' | 'Cancelado' | 'quitado';
  createdAt: string;
  competencia?: Competencia;
};
