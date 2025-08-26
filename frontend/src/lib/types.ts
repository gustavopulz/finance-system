export type Status = 'ativo' | 'cancelado' | 'quitado';

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
  status: Status;
  createdAt: string;
  updatedAt: string;
  cancelledAt?: string;
};

export type Finance = {
  id: string;
  pessoa: string;
  descricao: string;
  valor: number;
  start?: Competencia;
  parcelasTotal: number | 'X';
  status: 'ativo' | 'cancelado' | 'quitado';
  createdAt: string;
  competencia?: Competencia;
};
