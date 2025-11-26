export type Status = "Pendente" | "Cancelado" | "quitado" | "ativo" | "Pago";

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
  paid?: boolean;
  dtPaid?: string; // Data de pagamento
};

export type Finance = {
  id: string;
  pessoa: string;
  descricao: string;
  valor: number;
  start?: Competencia;
  parcelasTotal: number | "X";
  status: Status;
  createdAt: string;
  competencia?: Competencia;
};

export interface User {
  id: string;
  role: "admin" | "user";
  name: string;
  email: string;
}
