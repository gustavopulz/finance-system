# Finance System - Frontend

Frontend da aplicação de gestão financeira construído com React, TypeScript e Vite.

## 🚀 Tecnologias

- **React 19** - Biblioteca para interfaces de usuário
- **TypeScript** - Superset do JavaScript com tipagem estática
- **Vite** - Build tool e dev server rápido
- **Tailwind CSS** - Framework CSS utilitário
- **React Hook Form** - Gerenciamento de formulários
- **Zod** - Validação de schemas
- **Lucide React** - Biblioteca de ícones
- **@dnd-kit** - Drag and drop para React
- **React Router DOM** - Roteamento
- **Date-fns** - Biblioteca de manipulação de datas

## 🛠️ Instalação e Execução

### Pré-requisitos

- Node.js 18+
- npm ou yarn

### Instalação

```bash
# Clone o repositório (se ainda não clonou)
git clone <url-do-repositorio>

# Acesse o diretório do frontend
cd finance-system/frontend

# Instale as dependências
npm install
```

### Execução

```bash
# Desenvolvimento
npm run dev

# Build para produção
npm run build

# Preview do build
npm run preview

# Lint
npm run lint
```

O aplicativo estará disponível em `http://localhost:5173`

## 🏗️ Estrutura do Projeto

```
frontend/
├── src/
│   ├── components/          # Componentes reutilizáveis
│   │   ├── AddCollaboratorDialog.tsx
│   │   ├── AddFinanceDialog.tsx
│   │   ├── FinanceTable.tsx
│   │   ├── Header.tsx
│   │   ├── SidebarTotalColabs.tsx
│   │   └── SkeletonCard.tsx
│   ├── context/             # Contextos React
│   │   └── AuthContext.tsx
│   ├── lib/                 # Utilitários e helpers
│   │   ├── api.ts          # Chamadas para API
│   │   ├── auth.tsx        # Autenticação
│   │   ├── date.ts         # Manipulação de datas
│   │   ├── format.ts       # Formatação
│   │   ├── share.ts        # Compartilhamento
│   │   ├── storage.ts      # Lógica de storage/filtros
│   │   └── types.ts        # Tipos TypeScript
│   ├── pages/              # Páginas da aplicação
│   │   ├── AdminPage.tsx
│   │   ├── HomePage.tsx
│   │   ├── InfoPage.tsx
│   │   ├── LoginPage.tsx
│   │   └── UserPanelPage.tsx
│   ├── assets/             # Assets estáticos
│   ├── App.tsx             # Componente raiz
│   ├── main.tsx           # Entry point
│   └── index.css          # Estilos globais
├── public/                # Arquivos públicos estáticos
├── package.json
├── tsconfig.json
├── vite.config.ts
└── tailwind.config.js
```

## 🎯 Funcionalidades

### 📊 Dashboard Financeiro

- Visualização de finanças por colaborador
- Filtros por mês/ano
- Totalizadores automáticos
- Cards responsivos com drag-and-drop

### 💰 Gestão de Contas

- **Contas Avulsas**: Aparecem apenas no mês específico
- **Contas Fixas**: Aparecem todos os meses a partir da criação
- **Contas Parceladas**: Divididas ao longo de N meses
- Marcar contas como pagas
- Cancelar/reativar contas

### 👥 Colaboradores

- Adicionar/remover colaboradores
- Reordenação por drag-and-drop
- Totalizadores individuais

### 📱 Design Responsivo

- **Desktop**: Sidebar com totais e lista de colaboradores
- **Mobile**: Card de totais no topo, sidebar oculta
- Interface adaptativa com Tailwind CSS

### 🔐 Autenticação

- Sistema de login seguro
- Contexto de autenticação
- Rotas protegidas

### 🔗 Compartilhamento

- Tokens de compartilhamento
- Visualização colaborativa de finanças

## 🎨 Componentes Principais

### `FinanceTable`

Tabela principal que exibe as finanças de um colaborador:

- Ordenação por colunas
- Ações inline (editar, cancelar, excluir)
- Checkbox para marcar como pago
- Design responsivo (desktop/mobile)

### `HomePage`

Página principal com:

- Filtros de mês/ano
- Sidebar com totais (desktop)
- Cards de colaboradores com drag-and-drop
- Modais de adição/edição

### `AddFinanceDialog`

Modal para criar/editar finanças:

- Validação com Zod
- Campos dinâmicos
- Suporte a parcelas/contas fixas/avulsas

## 🔧 Configuração

### Variáveis de Ambiente

O frontend se conecta ao backend através da URL configurada em `src/lib/api.ts`:

```typescript
const API_URL = 'https://finance-system-api.prxlab.app/api';
```

### Tailwind CSS

Configuração personalizada com:

- Design system consistente
- Classes utilitárias customizadas
- Suporte a dark mode
- Responsive design

## 🚀 Deploy

O projeto está configurado para deploy no Netlify:

- Build automático com `npm run build`
- Configuração em `netlify.toml`
- Deploy contínuo via Git

## 🤝 Contribuição

1. Faça um fork do projeto
2. Crie uma branch para sua feature (`git checkout -b feature/AmazingFeature`)
3. Commit suas mudanças (`git commit -m 'Add some AmazingFeature'`)
4. Push para a branch (`git push origin feature/AmazingFeature`)
5. Abra um Pull Request

## 📝 Licença

Este projeto é privado e não possui licença pública.
