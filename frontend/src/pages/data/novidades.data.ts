export interface NovidadeCard {
  date: string; // ISO ou dd/MM/yyyy
  title: string;
  highlights: string[];
  adjustments: string[];
  mobile: string[];
}

export const novidadesCards: NovidadeCard[] = [
  {
    date: "26/11/2025",
    title: "Versão 1.1.0 - Melhorias na Gestão de Colaboradores",
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
