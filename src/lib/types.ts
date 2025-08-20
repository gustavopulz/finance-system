export type Person = 'Amanda' | 'Gustavo' | 'CartaoMae' | 'Outros';
export type Status = 'ativo' | 'quitado' | 'cancelado';

export interface Competencia {
  year: number;
  month: number;
} // 1..12

export interface Finance {
  id: string;
  pessoa: Person;
  descricao: string;
  valor: number;

  // Modelo novo de parcelas:
  start?: Competencia; // competência do início do parcelamento
  parcelasTotal?: number | 'X'; // 1..12 ou "X" (Indeterminada)

  status?: Status;
  createdAt?: string;
  competencia?: Competencia; // legado (primeira competência); mantido p/ migração
}
