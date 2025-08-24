import { useEffect, useState } from 'react';

export default function InfoPage() {
  const [dashboard, setDashboard] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editSalary, setEditSalary] = useState(false);
  const [salaryInput, setSalaryInput] = useState('');

  useEffect(() => {
    setError(null);
    fetch('/api/dashboard')
      .then(async (r) => {
        // Tenta parsear como JSON, se falhar, trata erro
        try {
          const data = await r.json();
          // Se não vier objeto esperado, trata como erro
          if (!data || typeof data !== 'object' || Array.isArray(data)) {
            throw new Error('Resposta inesperada do servidor');
          }
          setDashboard(data);
          setSalaryInput(data.salary ? String(data.salary) : '');
        } catch (e) {
          setError(
            'Erro ao carregar dados. Verifique se está logado e se o servidor está ativo.'
          );
        }
      })
      .catch(() => setError('Erro de conexão com o servidor.'))
      .finally(() => setLoading(false));
  }, []);

  const handleSalarySave = async () => {
    if (!salaryInput || !dashboard) return;
    await fetch('/api/salary', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        value: Number(salaryInput),
        month: dashboard.month,
        year: dashboard.year,
      }),
    });
    setEditSalary(false);
    setLoading(true);
    setError(null);
    // Recarrega dashboard
    fetch('/api/dashboard')
      .then(async (r) => {
        try {
          const data = await r.json();
          setDashboard(data);
          setSalaryInput(data.salary ? String(data.salary) : '');
        } catch (e) {
          setError(
            'Erro ao carregar dados. Verifique se está logado e se o servidor está ativo.'
          );
        }
      })
      .catch(() => setError('Erro de conexão com o servidor.'))
      .finally(() => setLoading(false));
  };

  if (loading) return <div className="p-8">Carregando...</div>;
  if (error) return <div className="p-8 text-red-500">{error}</div>;
  if (!dashboard)
    return <div className="p-8 text-red-500">Dados não disponíveis.</div>;

  return (
    <div className="max-w-4xl mx-auto py-8">
      <h1 className="text-2xl font-bold mb-6">Dashboard de Finanças</h1>
      <div className="card p-6 mb-6">
        <h2 className="text-xl font-semibold mb-2">Resumo do Salário</h2>
        <div className="flex gap-4 items-center">
          <div>
            <span className="font-bold">Salário:</span> R${' '}
            {dashboard.salary
              ? dashboard.salary.toLocaleString('pt-BR', {
                  minimumFractionDigits: 2,
                })
              : 'Não cadastrado'}
          </div>
          {editSalary ? (
            <>
              <input
                type="number"
                className="input input-bordered"
                value={salaryInput}
                onChange={(e) => setSalaryInput(e.target.value)}
                min={0}
              />
              <button className="btn btn-success" onClick={handleSalarySave}>
                Salvar
              </button>
              <button
                className="btn btn-ghost"
                onClick={() => setEditSalary(false)}
              >
                Cancelar
              </button>
            </>
          ) : (
            <button
              className="btn btn-primary"
              onClick={() => setEditSalary(true)}
            >
              {dashboard.salary ? 'Editar Salário' : 'Cadastrar Salário'}
            </button>
          )}
        </div>
      </div>
      <div className="card p-6 mb-6">
        <h2 className="text-xl font-semibold mb-2">Resumo de Gastos</h2>
        <div className="flex gap-8 items-center">
          <div>
            <span className="font-bold">Total gasto:</span> R${' '}
            {dashboard.total?.toLocaleString('pt-BR', {
              minimumFractionDigits: 2,
            })}
          </div>
          {dashboard.salary && (
            <div>
              <span className="font-bold">% do salário gasto:</span>{' '}
              {dashboard.salary
                ? ((dashboard.total / dashboard.salary) * 100).toFixed(1)
                : '0'}
              %
            </div>
          )}
        </div>
      </div>
      <div className="card p-6">
        <h2 className="text-xl font-semibold mb-2">Contas por Origem</h2>
        <ul className="mb-4">
          {(dashboard.origem || []).map((o: any) => (
            <li key={o.origem} className="flex justify-between">
              <span>{o.origem || 'Não informado'}</span>
              <span>
                R${' '}
                {o.total?.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </span>
            </li>
          ))}
        </ul>
        <h2 className="text-xl font-semibold mb-2">Contas por Responsável</h2>
        <ul>
          {(dashboard.responsavel || []).map((r: any) => (
            <li key={r.responsavel} className="flex justify-between">
              <span>{r.responsavel || 'Não informado'}</span>
              <span>
                R${' '}
                {r.total?.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
