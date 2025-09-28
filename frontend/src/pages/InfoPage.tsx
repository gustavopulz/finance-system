import { useState } from 'react';
import { NavLink } from 'react-router-dom';

export default function InfoPage() {
  const [view, setView] = useState<'geral' | 'conta'>('geral');
  return (
    <div className="container-app mx-auto px-4 sm:px-6 lg:px-20 2xl:px-40 py-6 grid gap-6">
      <section className="rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 p-6">
        <h1 className="text-2xl font-bold mb-2">Como usar o Finance System</h1>
        <p className="text-slate-600 dark:text-slate-400">
          Este guia rápido mostra os principais recursos para organizar suas
          finanças por colaborador, com filtros, marcação de pagamento,
          cancelamento e muito mais.
        </p>
        <div className="mt-4 flex flex-wrap gap-2 items-center">
          <div className="inline-flex rounded border border-slate-300 dark:border-slate-700 overflow-hidden">
            <button
              className={`px-3 py-2 text-sm ${
                view === 'geral'
                  ? 'bg-blue-600 text-white'
                  : 'bg-transparent text-slate-800 dark:text-slate-200'
              }`}
              onClick={() => setView('geral')}
            >
              Guia do painel
            </button>
            <button
              className={`px-3 py-2 text-sm ${
                view === 'conta'
                  ? 'bg-blue-600 text-white'
                  : 'bg-transparent text-slate-800 dark:text-slate-200'
              }`}
              onClick={() => setView('conta')}
            >
              Configurações da conta
            </button>
          </div>
        </div>
      </section>
      {view === 'geral' ? (
        <>
          <section className="rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 p-6">
            <h2 className="text-xl font-semibold mb-2">Painel</h2>
            <p className="text-slate-700 dark:text-slate-300">
              Acesse em{' '}
              <code className="px-1 py-0.5 rounded bg-slate-100 dark:bg-slate-800">
                /summary
              </code>
              . Use a barra de resumo, os filtros e a sidebar para navegar entre
              colaboradores e lançamentos.
            </p>
            <div className="mt-3">
              <NavLink to="/summary" className="btn btn-primary">
                Abrir painel
              </NavLink>
            </div>
          </section>

          <section className="rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 p-6">
            <h2 className="text-xl font-semibold mb-3">Sumário</h2>
            <ol className="list-decimal pl-5 space-y-1 text-slate-700 dark:text-slate-300">
              <li>
                <a
                  href="#acesso"
                  className="text-blue-600 dark:text-blue-400 hover:underline"
                >
                  Acesso e sessão
                </a>
              </li>
              <li>
                <a
                  href="#resumo"
                  className="text-blue-600 dark:text-blue-400 hover:underline"
                >
                  Barra de Resumo e Filtros
                </a>
              </li>
              <li>
                <a
                  href="#sidebar"
                  className="text-blue-600 dark:text-blue-400 hover:underline"
                >
                  Sidebar de Colaboradores
                </a>
              </li>
              <li>
                <a
                  href="#tabelas"
                  className="text-blue-600 dark:text-blue-400 hover:underline"
                >
                  Tabelas de Lançamentos
                </a>
              </li>
              <li>
                <a
                  href="#dialogs"
                  className="text-blue-600 dark:text-blue-400 hover:underline"
                >
                  Adicionar Finança e Colaborador
                </a>
              </li>
              <li>
                <a
                  href="#atalhos"
                  className="text-blue-600 dark:text-blue-400 hover:underline"
                >
                  Atalhos e Dicas
                </a>
              </li>
              <li>
                <a
                  href="#faq"
                  className="text-blue-600 dark:text-blue-400 hover:underline"
                >
                  FAQ rápido
                </a>
              </li>
            </ol>
          </section>

          <section
            id="acesso"
            className="rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 p-6"
          >
            <h2 className="text-xl font-semibold mb-3">1) Acesso e sessão</h2>
            <ul className="list-disc pl-5 space-y-1 text-slate-700 dark:text-slate-300">
              <li>
                As rotas principais são protegidas: você precisa se autenticar
                em{' '}
                <code className="px-1 py-0.5 rounded bg-slate-100 dark:bg-slate-800">
                  /login
                </code>
                .
              </li>
              <li>
                Após logar, você cai no painel principal (
                <code className="px-1 py-0.5 rounded bg-slate-100 dark:bg-slate-800">
                  /
                </code>{' '}
                ou{' '}
                <code className="px-1 py-0.5 rounded bg-slate-100 dark:bg-slate-800">
                  /summary
                </code>
                ).
              </li>
              <li>
                No topo, use o botão de tema para alternar entre{' '}
                <code className="px-1 py-0.5 rounded bg-slate-100 dark:bg-slate-800">
                  Claro
                </code>
                /
                <code className="px-1 py-0.5 rounded bg-slate-100 dark:bg-slate-800">
                  Escuro
                </code>{' '}
                e o menu do usuário para{' '}
                <code className="px-1 py-0.5 rounded bg-slate-100 dark:bg-slate-800">
                  Sair
                </code>
                .
              </li>
            </ul>
          </section>

          <section
            id="resumo"
            className="rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 p-6"
          >
            <h2 className="text-xl font-semibold mb-3">
              2) Barra de Resumo e Filtros
            </h2>
            <p className="text-slate-700 dark:text-slate-300 mb-3">
              A primeira seção da página principal mostra totais e vários
              controles.
            </p>
            <ul className="list-disc pl-5 space-y-2 text-slate-700 dark:text-slate-300">
              <li>
                Ações rápidas:{' '}
                <code className="px-1 py-0.5 rounded bg-slate-100 dark:bg-slate-800">
                  Adicionar colaborador
                </code>{' '}
                e{' '}
                <code className="px-1 py-0.5 rounded bg-slate-100 dark:bg-slate-800">
                  Adicionar finança
                </code>{' '}
                (atalho{' '}
                <code className="px-1 py-0.5 rounded bg-slate-100 dark:bg-slate-800">
                  Alt+N
                </code>
                ). Quando o resumo sai da tela, aparece um botão flutuante de{' '}
                <code className="px-1 py-0.5 rounded bg-slate-100 dark:bg-slate-800">
                  +
                </code>{' '}
                e outro de{' '}
                <code className="px-1 py-0.5 rounded bg-slate-100 dark:bg-slate-800">
                  Voltar ao topo
                </code>
                .
              </li>
              <li>
                Filtros:{' '}
                <code className="px-1 py-0.5 rounded bg-slate-100 dark:bg-slate-800">
                  Descrição
                </code>
                ,{' '}
                <code className="px-1 py-0.5 rounded bg-slate-100 dark:bg-slate-800">
                  Valor
                </code>{' '}
                (exato),{' '}
                <code className="px-1 py-0.5 rounded bg-slate-100 dark:bg-slate-800">
                  Parcela
                </code>{' '}
                (
                <code className="px-1 py-0.5 rounded bg-slate-100 dark:bg-slate-800">
                  Avulso
                </code>
                ,{' '}
                <code className="px-1 py-0.5 rounded bg-slate-100 dark:bg-slate-800">
                  Fixo
                </code>{' '}
                ou{' '}
                <code className="px-1 py-0.5 rounded bg-slate-100 dark:bg-slate-800">
                  1–48
                </code>
                ),{' '}
                <code className="px-1 py-0.5 rounded bg-slate-100 dark:bg-slate-800">
                  Mês
                </code>{' '}
                (
                <code className="px-1 py-0.5 rounded bg-slate-100 dark:bg-slate-800">
                  Todos os meses
                </code>
                ) e{' '}
                <code className="px-1 py-0.5 rounded bg-slate-100 dark:bg-slate-800">
                  Ano
                </code>{' '}
                (desativado quando “Todos os meses” está selecionado).
              </li>
              <li>
                <code className="px-1 py-0.5 rounded bg-slate-100 dark:bg-slate-800">
                  Ver Cancelados
                </code>{' '}
                alterna a exibição de lançamentos cancelados.
              </li>
            </ul>
          </section>

          <section
            id="sidebar"
            className="rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 p-6"
          >
            <h2 className="text-xl font-semibold mb-3">
              3) Sidebar de Colaboradores
            </h2>
            <ul className="list-disc pl-5 space-y-2 text-slate-700 dark:text-slate-300">
              <li>
                Mostra{' '}
                <code className="px-1 py-0.5 rounded bg-slate-100 dark:bg-slate-800">
                  Total
                </code>
                ,{' '}
                <code className="px-1 py-0.5 rounded bg-slate-100 dark:bg-slate-800">
                  Total Pendente
                </code>{' '}
                e{' '}
                <code className="px-1 py-0.5 rounded bg-slate-100 dark:bg-slate-800">
                  Total Pago
                </code>{' '}
                apenas dos colaboradores visíveis.
              </li>
              <li>
                Clique no nome para destacar e rolar até a tabela do
                colaborador. Clique novamente para desfazer a seleção.
              </li>
              <li>
                Use o botão{' '}
                <code className="px-1 py-0.5 rounded bg-slate-100 dark:bg-slate-800">
                  +
                </code>{' '}
                ao lado do nome para adicionar uma finança já associada ao
                colaborador.
              </li>
              <li>
                O ícone de{' '}
                <code className="px-1 py-0.5 rounded bg-slate-100 dark:bg-slate-800">
                  olho
                </code>{' '}
                oculta/exibe a tabela do colaborador (salvo no navegador).
              </li>
            </ul>
          </section>

          <section
            id="tabelas"
            className="rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 p-6"
          >
            <h2 className="text-xl font-semibold mb-3">
              4) Tabelas de Lançamentos por colaborador
            </h2>
            <ul className="list-disc pl-5 space-y-2 text-slate-700 dark:text-slate-300">
              <li>
                Reordenar colaboradores: arraste pelo cabeçalho (ícone de{' '}
                <code className="px-1 py-0.5 rounded bg-slate-100 dark:bg-slate-800">
                  grip
                </code>
                ). A nova ordem é salva automaticamente.
              </li>
              <li>
                Colapsar/Expandir: use a{' '}
                <code className="px-1 py-0.5 rounded bg-slate-100 dark:bg-slate-800">
                  seta
                </code>{' '}
                no cabeçalho.
              </li>
              <li>
                Ordenação por coluna (
                <code className="px-1 py-0.5 rounded bg-slate-100 dark:bg-slate-800">
                  Descrição
                </code>
                ,{' '}
                <code className="px-1 py-0.5 rounded bg-slate-100 dark:bg-slate-800">
                  Valor
                </code>
                ,{' '}
                <code className="px-1 py-0.5 rounded bg-slate-100 dark:bg-slate-800">
                  Parcela
                </code>
                ,{' '}
                <code className="px-1 py-0.5 rounded bg-slate-100 dark:bg-slate-800">
                  Status
                </code>
                ) e seleção múltipla.
              </li>
              <li>
                Ações em massa:{' '}
                <code className="px-1 py-0.5 rounded bg-slate-100 dark:bg-slate-800">
                  Marcar Pago
                </code>
                ,{' '}
                <code className="px-1 py-0.5 rounded bg-slate-100 dark:bg-slate-800">
                  Marcar Pendente
                </code>{' '}
                e{' '}
                <code className="px-1 py-0.5 rounded bg-slate-100 dark:bg-slate-800">
                  Excluir
                </code>
                .
              </li>
              <li>
                Ações por linha:{' '}
                <code className="px-1 py-0.5 rounded bg-slate-100 dark:bg-slate-800">
                  Editar
                </code>
                ,{' '}
                <code className="px-1 py-0.5 rounded bg-slate-100 dark:bg-slate-800">
                  Cancelar/Reabrir
                </code>{' '}
                e{' '}
                <code className="px-1 py-0.5 rounded bg-slate-100 dark:bg-slate-800">
                  Excluir
                </code>
                . Checkbox{' '}
                <code className="px-1 py-0.5 rounded bg-slate-100 dark:bg-slate-800">
                  Pago
                </code>{' '}
                por item.
              </li>
              <li>
                Badges de status:{' '}
                <code className="px-1 py-0.5 rounded bg-slate-100 dark:bg-slate-800">
                  Pago
                </code>
                ,{' '}
                <code className="px-1 py-0.5 rounded bg-slate-100 dark:bg-slate-800">
                  Pendente
                </code>
                ,{' '}
                <code className="px-1 py-0.5 rounded bg-slate-100 dark:bg-slate-800">
                  Cancelado
                </code>{' '}
                e{' '}
                <code className="px-1 py-0.5 rounded bg-slate-100 dark:bg-slate-800">
                  Pago Futuramente
                </code>
                .
              </li>
              <li>
                Parcelas:{' '}
                <code className="px-1 py-0.5 rounded bg-slate-100 dark:bg-slate-800">
                  Avulsa
                </code>
                ,{' '}
                <code className="px-1 py-0.5 rounded bg-slate-100 dark:bg-slate-800">
                  Fixo
                </code>{' '}
                ou{' '}
                <code className="px-1 py-0.5 rounded bg-slate-100 dark:bg-slate-800">
                  1–48
                </code>
                . A coluna{' '}
                <code className="px-1 py-0.5 rounded bg-slate-100 dark:bg-slate-800">
                  Parcela
                </code>{' '}
                reflete o período filtrado.
              </li>
            </ul>
          </section>

          <section
            id="dialogs"
            className="rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 p-6"
          >
            <h2 className="text-xl font-semibold mb-3">
              5) Adicionar Finança e Colaborador
            </h2>
            <div className="space-y-3 text-slate-700 dark:text-slate-300">
              <div>
                <h3 className="font-semibold">Adicionar Finança</h3>
                <ul className="list-disc pl-5 space-y-1">
                  <li>
                    Campos:{' '}
                    <code className="px-1 py-0.5 rounded bg-slate-100 dark:bg-slate-800">
                      Colaborador
                    </code>
                    ,{' '}
                    <code className="px-1 py-0.5 rounded bg-slate-100 dark:bg-slate-800">
                      Descrição
                    </code>
                    ,{' '}
                    <code className="px-1 py-0.5 rounded bg-slate-100 dark:bg-slate-800">
                      Valor
                    </code>
                    ,{' '}
                    <code className="px-1 py-0.5 rounded bg-slate-100 dark:bg-slate-800">
                      Parcelas
                    </code>
                    ,{' '}
                    <code className="px-1 py-0.5 rounded bg-slate-100 dark:bg-slate-800">
                      Início
                    </code>{' '}
                    e{' '}
                    <code className="px-1 py-0.5 rounded bg-slate-100 dark:bg-slate-800">
                      Status
                    </code>
                    .
                  </li>
                  <li>
                    Parcelas:{' '}
                    <code className="px-1 py-0.5 rounded bg-slate-100 dark:bg-slate-800">
                      Avulsa
                    </code>{' '}
                    (apenas no mês),{' '}
                    <code className="px-1 py-0.5 rounded bg-slate-100 dark:bg-slate-800">
                      Fixo
                    </code>{' '}
                    (todo mês) ou um número{' '}
                    <code className="px-1 py-0.5 rounded bg-slate-100 dark:bg-slate-800">
                      1–48
                    </code>
                    .
                  </li>
                  <li>
                    Atalho:{' '}
                    <code className="px-1 py-0.5 rounded bg-slate-100 dark:bg-slate-800">
                      Alt+N
                    </code>{' '}
                    abre a janela para adicionar rapidamente.
                  </li>
                </ul>
              </div>
              <div>
                <h3 className="font-semibold">Novo Colaborador</h3>
                <ul className="list-disc pl-5 space-y-1">
                  <li>
                    Informe um nome curto (limite aplicado) e salve. O
                    colaborador aparece na sidebar e já pode receber
                    lançamentos.
                  </li>
                </ul>
              </div>
            </div>
          </section>

          <section
            id="atalhos"
            className="rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 p-6"
          >
            <h2 className="text-xl font-semibold mb-3">6) Atalhos e Dicas</h2>
            <ul className="list-disc pl-5 space-y-2 text-slate-700 dark:text-slate-300">
              <li>
                <b>Alt + N</b>: abrir{' '}
                <code className="px-1 py-0.5 rounded bg-slate-100 dark:bg-slate-800">
                  Adicionar finança
                </code>
                .
              </li>
              <li>
                Botões flutuantes:{' '}
                <code className="px-1 py-0.5 rounded bg-slate-100 dark:bg-slate-800">
                  +
                </code>{' '}
                e{' '}
                <code className="px-1 py-0.5 rounded bg-slate-100 dark:bg-slate-800">
                  Voltar ao topo
                </code>
                .
              </li>
              <li>
                Preferências locais:{' '}
                <code className="px-1 py-0.5 rounded bg-slate-100 dark:bg-slate-800">
                  ordenação
                </code>
                ,{' '}
                <code className="px-1 py-0.5 rounded bg-slate-100 dark:bg-slate-800">
                  colapso
                </code>{' '}
                e{' '}
                <code className="px-1 py-0.5 rounded bg-slate-100 dark:bg-slate-800">
                  visibilidade
                </code>{' '}
                são salvas no navegador.
              </li>
            </ul>
          </section>

          <section
            id="faq"
            className="rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 p-6"
          >
            <h2 className="text-xl font-semibold mb-3">7) FAQ rápido</h2>
            <div className="space-y-3 text-slate-700 dark:text-slate-300">
              <div>
                <p className="font-semibold">
                  Não vejo a tabela de um colaborador.
                </p>
                <p>
                  Verifique o ícone de{' '}
                  <code className="px-1 py-0.5 rounded bg-slate-100 dark:bg-slate-800">
                    olho
                  </code>{' '}
                  na sidebar — ele pode estar oculto.
                </p>
              </div>
              <div>
                <p className="font-semibold">
                  A ordem dos colaboradores não está salvando.
                </p>
                <p>
                  Arraste pelo cabeçalho com o ícone de{' '}
                  <code className="px-1 py-0.5 rounded bg-slate-100 dark:bg-slate-800">
                    grip
                  </code>{' '}
                  e aguarde um instante.
                </p>
              </div>
              <div>
                <p className="font-semibold">
                  Por que aparece{' '}
                  <code className="px-1 py-0.5 rounded bg-slate-100 dark:bg-slate-800">
                    Pago Futuramente
                  </code>
                  ?
                </p>
                <p>
                  Isso indica que a data de pagamento é posterior ao mês/ano
                  filtrado.
                </p>
              </div>
              <div>
                <p className="font-semibold">
                  Valores em reais não entram corretamente.
                </p>
                <p>
                  Digite apenas números; o campo formata como 0,00
                  automaticamente (ex.: 11900 vira 119,00).
                </p>
              </div>
            </div>
          </section>
        </>
      ) : (
        <>
          <section className="rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 p-6">
            <h2 className="text-xl font-semibold mb-2">
              Configurações da Conta
            </h2>
            <p className="text-slate-700 dark:text-slate-300">
              Acesse em{' '}
              <code className="px-1 py-0.5 rounded bg-slate-100 dark:bg-slate-800">
                /user-settings
              </code>
              . Use a sidebar para alternar entre as abas:{' '}
              <code className="px-1 py-0.5 rounded bg-slate-100 dark:bg-slate-800">
                Configuração de Conta
              </code>
              ,{' '}
              <code className="px-1 py-0.5 rounded bg-slate-100 dark:bg-slate-800">
                Configuração de Token
              </code>{' '}
              e{' '}
              <code className="px-1 py-0.5 rounded bg-slate-100 dark:bg-slate-800">
                Configuração de Categorias
              </code>
              .
            </p>
            <div className="mt-3">
              <NavLink to="/user-settings" className="btn btn-primary">
                Abrir configurações
              </NavLink>
            </div>
          </section>

          <section className="rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 p-6">
            <h3 className="text-lg font-semibold mb-2">
              Aba: Configuração de Conta
            </h3>
            <ul className="list-disc pl-5 space-y-2 text-slate-700 dark:text-slate-300">
              <li>
                <b>Nome</b>: clique no botão{' '}
                <code className="px-1 py-0.5 rounded bg-slate-100 dark:bg-slate-800">
                  ✎
                </code>{' '}
                (
                <code className="px-1 py-0.5 rounded bg-slate-100 dark:bg-slate-800">
                  Editar
                </code>
                ), altere o campo e depois{' '}
                <code className="px-1 py-0.5 rounded bg-slate-100 dark:bg-slate-800">
                  Salvar
                </code>
                .
              </li>
              <li>
                <b>E-mail</b>: use o botão{' '}
                <code className="px-1 py-0.5 rounded bg-slate-100 dark:bg-slate-800">
                  ✎
                </code>{' '}
                para habilitar edição e{' '}
                <code className="px-1 py-0.5 rounded bg-slate-100 dark:bg-slate-800">
                  Salvar
                </code>{' '}
                ao final.
              </li>
              <li>
                <b>Senha</b>: clique no botão com ícone de{' '}
                <code className="px-1 py-0.5 rounded bg-slate-100 dark:bg-slate-800">
                  cadeado
                </code>
                , informe a nova senha e confirme em{' '}
                <code className="px-1 py-0.5 rounded bg-slate-100 dark:bg-slate-800">
                  Salvar
                </code>
                .
              </li>
              <li>Mensagens de sucesso/erro aparecem abaixo do formulário.</li>
            </ul>
          </section>

          <section className="rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 p-6">
            <h3 className="text-lg font-semibold mb-2">
              Aba: Configuração de Token
            </h3>
            <ul className="list-disc pl-5 space-y-2 text-slate-700 dark:text-slate-300">
              <li>
                <code className="px-1 py-0.5 rounded bg-slate-100 dark:bg-slate-800">
                  Gerar Token
                </code>
                : cria um token de compartilhamento; use{' '}
                <code className="px-1 py-0.5 rounded bg-slate-100 dark:bg-slate-800">
                  Copiar
                </code>{' '}
                para colocar na área de transferência.
              </li>
              <li>
                <b>Usar Token</b>: cole um token no campo{' '}
                <code className="px-1 py-0.5 rounded bg-slate-100 dark:bg-slate-800">
                  Cole o token aqui...
                </code>{' '}
                e clique em{' '}
                <code className="px-1 py-0.5 rounded bg-slate-100 dark:bg-slate-800">
                  Mesclar
                </code>{' '}
                para vincular contas.
              </li>
              <li>
                <b>Vínculos</b>: listas “Você vê” e “Vê sua conta”. Use o botão{' '}
                <code className="px-1 py-0.5 rounded bg-slate-100 dark:bg-slate-800">
                  X
                </code>{' '}
                para desvincular um usuário.
              </li>
            </ul>
          </section>

          <section className="rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 p-6">
            <h3 className="text-lg font-semibold mb-2">
              Aba: Configuração de Categorias
            </h3>
            <ul className="list-disc pl-5 space-y-2 text-slate-700 dark:text-slate-300">
              <li>
                <b>Adicionar</b>: preencha{' '}
                <code className="px-1 py-0.5 rounded bg-slate-100 dark:bg-slate-800">
                  Nome da categoria
                </code>
                , escolha uma cor e clique em{' '}
                <code className="px-1 py-0.5 rounded bg-slate-100 dark:bg-slate-800">
                  Adicionar
                </code>
                .
              </li>
              <li>
                <b>Editar</b>: na lista, clique em{' '}
                <code className="px-1 py-0.5 rounded bg-slate-100 dark:bg-slate-800">
                  Editar
                </code>
                , ajuste nome/cor e finalize com{' '}
                <code className="px-1 py-0.5 rounded bg-slate-100 dark:bg-slate-800">
                  Salvar
                </code>
                .
              </li>
            </ul>
          </section>
        </>
      )}
    </div>
  );
}
