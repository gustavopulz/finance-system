# 💰 Finance System

Sistema completo de gestão financeira colaborativa com interface moderna e backend robusto.

## 📋 Sobre o Projeto

O Finance System é uma aplicação web para gerenciamento de finanças pessoais e colaborativas, permitindo:

- 📊 **Dashboard intuitivo** com visualização clara das finanças
- 👥 **Gestão de colaboradores** com compartilhamento de acesso
- 💳 **Diferentes tipos de conta**: avulsas, fixas e parceladas
- 📱 **Design responsivo** otimizado para desktop e mobile
- 🔐 **Autenticação segura** com JWT e cookies httpOnly
- ☁️ **Deploy na nuvem** com Netlify

## 🏗️ Arquitetura

```
finance-system/
├── frontend/          # React + TypeScript + Vite
├── backend/           # Next.js API Routes + Firebase
└── README.md         # Este arquivo
```

### Frontend

- **React 19** com TypeScript
- **Vite** para build e desenvolvimento
- **Tailwind CSS** para estilização
- **React Hook Form + Zod** para formulários
- **@dnd-kit** para drag-and-drop
- **Deploy**: Netlify

### Backend

- **Next.js** com API Routes
- **Firebase Firestore** como banco de dados
- **JWT** para autenticação
- **bcryptjs** para hash de senhas
- **Deploy**: Netlify Functions

## 🚀 Tecnologias Principais

| Frontend     | Backend    | Banco     | Deploy    |
| ------------ | ---------- | --------- | --------- |
| React 19     | Next.js 15 | Firebase  | Netlify   |
| TypeScript   | TypeScript | Firestore | Docker    |
| Tailwind CSS | JWT        | -         | CDN       |
| Vite         | bcryptjs   | -         | -         |

## ⚡ Quick Start

### 1. Clone o repositório

```bash
git clone <url-do-repositorio>
cd finance-system
```

### 2. Configure o Backend

```bash
cd backend
npm install
cp .env.example .env.local
# Configure as variáveis de ambiente
npm run dev
```

### 3. Configure o Frontend

```bash
cd ../frontend
npm install
npm run dev
```

### 4. Acesse a aplicação

- Frontend: `http://localhost:5173`
- Backend: `http://localhost:3000`

## 🎯 Funcionalidades

### 💰 Gestão Financeira

- **Contas Avulsas**: Lançamentos únicos para o mês específico
- **Contas Fixas**: Aparecem mensalmente a partir da criação
- **Contas Parceladas**: Divididas em N parcelas mensais
- **Status**: Pendente, Pago, Cancelado

### 👥 Colaboração

- Sistema de usuários com roles (admin/user)
- Compartilhamento via tokens temporários
- Gestão de colaboradores por usuário
- Visualização consolidada de finanças

### 📊 Dashboard

- Filtros por mês/ano ou visualização completa
- Totalizadores automáticos (Total, Pendente, Pago)
- Sidebar com resumo dos colaboradores
- Design adaptativo desktop/mobile

### 🎨 Interface

- **Desktop**: Sidebar fixa + área principal
- **Mobile**: Card de totais + navegação otimizada
- Drag-and-drop para reordenar colaboradores
- Tabelas responsivas com ações inline

## 📱 Screenshots

### Desktop

![Dashboard Desktop](./docs/desktop-dashboard.png)

### Mobile

![Dashboard Mobile](./docs/mobile-dashboard.png)

## 🔧 Configuração

### Variáveis de Ambiente (Backend)

```env
# Firebase
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_PRIVATE_KEY=your-private-key
FIREBASE_CLIENT_EMAIL=your-client-email

# JWT
JWT_SECRET=your-super-secret-key
```

### URLs de Produção

- **Frontend**: https://finance-system-br.netlify.app
- **Backend**: https://finance-system-br-backend.netlify.app

## 📚 Documentação Detalhada

- [Frontend README](./frontend/README.md) - Documentação detalhada do frontend
- [Backend README](./backend/README.md) - Documentação detalhada do backend

## 🚀 Deploy

### Netlify (Recomendado)

1. **Backend**:

   - Configure as variáveis de ambiente no painel do Netlify
   - Deploy automático via Git

2. **Frontend**:
   - Build command: `npm run build`
   - Publish directory: `dist`
   - Deploy automático via Git

### Docker (Alternativo)

```bash
# Build das imagens
docker-compose build

# Executar em desenvolvimento
docker-compose up -d

# Executar em produção
docker-compose -f docker-compose.prod.yml up -d
```

## 🛠️ Scripts Úteis

```bash
# Instalar dependências em ambos os projetos
npm run install:all

# Executar ambos em desenvolvimento
npm run dev:all

# Build para produção
npm run build:all

# Testes
npm run test:all

# Lint
npm run lint:all
```

## 📊 Status do Projeto

- ✅ **Backend API** - Completo e funcional
- ✅ **Frontend React** - Interface completa
- ✅ **Autenticação** - JWT + Cookies seguros
- ✅ **Banco de dados** - Firebase Firestore
- ✅ **Deploy** - Netlify em produção
- ✅ **Responsivo** - Desktop e Mobile
- ⚠️ **Testes** - Em desenvolvimento
- ⚠️ **Documentação** - Em aprimoramento

## 🤝 Contribuição

1. Fork o projeto
2. Crie sua feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit suas mudanças (`git commit -m 'Add: nova funcionalidade incrível'`)
4. Push para a branch (`git push origin feature/AmazingFeature`)
5. Abra um Pull Request

## 👨‍💻 Desenvolvido por

**Gustavo Pulz** - [GitHub](https://github.com/gustavopulz)

## 📝 Licença

Este projeto é privado e proprietário. Todos os direitos reservados.

---

⭐ Se este projeto foi útil para você, considere dar uma estrela no repositório!
