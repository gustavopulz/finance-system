export interface NovidadeCard {
  date: string;
  title: string;
  highlights: string[];
  adjustments: string[];
  mobile: string[];
  modalTitle?: string;
  modalDescription?: string;
}

export const novidadesCards: NovidadeCard[] = [
  {
    date: "03/02/2026",
    title: "Versão 1.1.2 - Feedback, Correções e Notificações",
    modalTitle: "Atualização 1.1.2 disponível!",
    modalDescription:
      "Adicionamos um fluxo de feedback (sugestão/bug) e fizemos ajustes importantes na experiência de finanças e notificações.",
    highlights: [
      "*Feedback no header*: _Novo botão 'Feedback' para enviar Sugestões/Ideias ou reportar Problemas/Bugs._",
    ],
    adjustments: [
      "*Finanças avulsas*: _Ajustado um bug que fazia finanças avulsas serem cadastradas como fixas._",
      "*Valor formatado*: _Campo de valor no modal de finança sempre inicia e permanece com 2 casas decimais._",
      "*Notificações unificadas*: _Removidas notificações duplicadas; agora o app usa apenas a barra superior._",
      "*Login mais estável*: _Corrigido um caso onde o login podia dar sucesso e logo em seguida pedir autenticação novamente._",
    ],
    mobile: ["Melhorias herdadas automaticamente do desktop."],
  },
  {
    date: "03/01/2026",
    title: "Versão 1.1.1 - Refinos de UI e Tabelas",
    modalTitle: "Confira a nova versão: 1.1.1!",
    modalDescription:
      "Refinamos o header, melhoramos a consistência dos modais e adicionamos um modo de compactação de tabelas para facilitar a visualização.",
    highlights: [
      "*Ajustes no header*: _Links fixos agora destacam texto e ícone (antes só havia a barra)._",
      "*Correção de hover*: _Bug onde o hover dos links fixos ocultava o ícone foi corrigido._",
      "*Tabelas*: _Adicionado botão para compactação, facilitando a visualização de grandes volumes de dados._",
    ],
    adjustments: [
      "*Melhorias em modais*: _Refatoração e otimização do código dos modais, resultando em maior consistência visual e melhor manutenção._",
    ],
    mobile: ["Sem mudanças específicas para mobile nesta versão."],
  },
  {
    date: "26/11/2025",
    title: "Versão 1.1.0 - Melhorias na Gestão de Colaboradores",
    modalTitle: "Confira a nova versão: 1.1.0!",
    modalDescription:
      "Agora ficou ainda mais fácil gerenciar colaboradores, duplicar finanças e visualizar totais rapidamente. Veja as principais novidades e melhorias desta atualização!",
    highlights: [
      "*Duplicar Finança*: _Agora disponível diretamente no menu Ações._",
      "*Seleção inteligente*: _Ao selecionar itens da tabela, o valor total selecionado é exibido automaticamente na sidebar._",
      "*Filtro de Data na Sidebar*: _O filtro de período agora aparece na própria sidebar, permitindo ajustes rápidos e práticos._",
      "*Cadastro de Colaborador pela Sidebar*: _Agora é possível cadastrar colaboradores diretamente pela sidebar e também colapsá-los por ali._",
      "*Novo Filtro “Status”*: _Adicionado ao conjunto de filtros para facilitar segmentações._",
    ],
    adjustments: [
      "*Layout otimizado*: _Tamanho da tela ajustado para melhorar a visualização geral das informações._",
      "*Tabela mais limpa*: _Redução de colunas para facilitar leitura e navegação._",
      "*Campo “Pago” reposicionado*: _Removido das colunas e movido para o menu Ações._",
      "*Controle de ordem mais seguro*: _Não é mais possível mover cards sem ativar a opção “Personalizar Ordem”._",
      "*Comportamento de Colaborador colapsado*: _Ao colapsar um colaborador, todos os seus itens e o cabeçalho correspondente são ocultados corretamente._",
    ],
    mobile: [
      "*Gerenciamento de Conta*: _Ajustado problema de responsividade na tela de gerenciamento de conta._",
      "Algumas das melhorias do desktop também foram adaptadas para o mobile.",
      "No entanto, certas funcionalidades continuam exclusivas da versão Desktop devido à complexidade e ao espaço de tela necessário.",
    ],
  },
];
