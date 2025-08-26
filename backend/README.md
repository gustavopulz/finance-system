# Finance System - Backend

Backend da aplicação de gestão financeira construído com Next.js, Firebase e TypeScript.

## 🚀 Tecnologias

- **Next.js 15** - Framework React para produção
- **TypeScript** - Superset do JavaScript com tipagem estática
- **Firebase Admin SDK** - Integração com Firestore
- **JWT** - Autenticação com tokens
- **bcryptjs** - Hash de senhas
- **Netlify Functions** - Serverless deployment

## 🛠️ Instalação e Execução

### Pré-requisitos

- Node.js 18+
- npm ou yarn
- Projeto Firebase configurado

### Configuração Firebase

1. Crie um projeto no [Firebase Console](https://console.firebase.google.com)
2. Ative o Firestore Database
3. Gere uma chave de serviço (Service Account Key)
4. Baixe o arquivo JSON e extraia as credenciais

### Instalação

```bash
# Clone o repositório (se ainda não clonou)
git clone <url-do-repositorio>

# Acesse o diretório do backend
cd finance-system/backend

# Instale as dependências
npm install

# Configure as variáveis de ambiente
cp .env.example .env.local
```

### Variáveis de Ambiente

Crie o arquivo `.env.local` na raiz do backend:

```env
# Firebase Configuration
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nYour-Private-Key\n-----END PRIVATE KEY-----\n"
FIREBASE_CLIENT_EMAIL=your-service-account@your-project.iam.gserviceaccount.com

# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key-here

# Environment
NODE_ENV=development
```

### Execução

```bash
# Desenvolvimento com Turbopack (mais rápido)
npm run dev

# Desenvolvimento tradicional
npx next dev

# Build para produção
npm run build

# Executar em produção
npm start
```

O servidor estará disponível em `http://localhost:3000`

## 🏗️ Estrutura do Projeto

```
backend/
├── src/
│   ├── app/
│   │   └── api/                 # Rotas da API
│   │       ├── route.ts         # Health check
│   │       ├── login/           # Autenticação
│   │       │   └── route.ts
│   │       ├── users/           # Gestão de usuários
│   │       │   ├── route.ts
│   │       │   └── me/
│   │       ├── accounts/        # Contas financeiras
│   │       │   ├── route.ts
│   │       │   └── [id]/
│   │       ├── collabs/         # Colaboradores
│   │       │   ├── route.ts
│   │       │   └── [id]/
│   │       └── shared/          # Compartilhamento
│   │           ├── finances/
│   │           ├── generate-token/
│   │           └── use-token/
│   ├── lib/                     # Utilitários
│   │   ├── firestore.ts        # Configuração Firebase
│   │   └── jwt.ts              # Utilitários JWT
│   └── middleware.ts            # Middleware global
├── package.json
├── tsconfig.json
├── next.config.ts
└── netlify.toml                 # Configuração Netlify
```

## 🔌 Endpoints da API

### Autenticação

- `POST /api/login` - Login de usuário

### Usuários

- `GET /api/users` - Listar usuários (admin)
- `POST /api/users` - Criar usuário (admin)
- `DELETE /api/users/:id` - Deletar usuário (admin)
- `GET /api/users/me` - Dados do usuário atual
- `PATCH /api/users/me` - Atualizar perfil
- `PATCH /api/users/me/password` - Alterar senha

### Contas

- `GET /api/accounts` - Listar contas
- `POST /api/accounts` - Criar conta
- `PUT /api/accounts/:id` - Atualizar conta
- `DELETE /api/accounts/:id` - Deletar conta
- `PATCH /api/accounts/:id/toggle-cancel` - Cancelar/reativar
- `PATCH /api/accounts/:id/mark-paid` - Marcar como pago

### Colaboradores

- `GET /api/collabs` - Listar colaboradores
- `POST /api/collabs` - Criar colaborador
- `POST /api/collabs/order` - Salvar ordem
- `DELETE /api/collabs/:id` - Deletar colaborador

### Compartilhamento

- `POST /api/shared/generate-token` - Gerar token
- `POST /api/shared/use-token` - Usar token
- `GET /api/shared/finances` - Finanças compartilhadas
- `POST /api/shared/unlink/:userId` - Desvincular

## 🗄️ Estrutura do Banco (Firestore)

### Collections

#### `users`

```typescript
{
  id: string,
  username: string,
  password: string, // hash bcrypt
  role: 'admin' | 'user',
  createdAt: string,
  updatedAt: string
}
```

#### `collaborators`

```typescript
{
  id: string,
  name: string,
  userId: string, // referência ao usuário
  orderId?: number, // ordem de exibição
  createdAt: string,
  updatedAt: string
}
```

#### `accounts`

```typescript
{
  id: string,
  collaboratorId: string,
  collaboratorName: string,
  description: string,
  value: number,
  parcelasTotal: number | null, // null = fixa, 0 = avulsa, >0 = parcelada
  month: number, // 1-12
  year: number,
  status: 'Pendente' | 'Cancelado' | 'quitado',
  paid?: boolean,
  userId: string,
  createdAt: string,
  updatedAt: string,
  cancelledAt?: string
}
```

## 🔐 Autenticação

### Sistema JWT + Cookies

1. **Login**: `POST /api/login`
   - Valida credenciais
   - Gera JWT token
   - Define cookie httpOnly seguro
2. **Middleware**: Validação automática

   - Verifica cookie em todas as rotas protegidas
   - Extrai dados do usuário do token
   - Bloqueia acesso não autorizado

3. **Cookies Seguros**:
   - `httpOnly: true` - Não acessível via JavaScript
   - `secure: true` - Apenas HTTPS (produção)
   - `sameSite: 'lax'` - Proteção CSRF

## 🚀 Deploy

Configurado para deploy no [Netlify](https://finance-system-br-backend.netlify.app):

```bash
# Build para produção
npm run build

# Deploy automático via Git
git push origin main
```

## 🤝 Contribuição

1. Fork o projeto
2. Crie uma branch (`git checkout -b feature/nova-feature`)
3. Commit suas mudanças (`git commit -m 'Add: nova feature'`)
4. Push para a branch (`git push origin feature/nova-feature`)
5. Abra um Pull Request

## 📝 Licença

Este projeto é privado e não possui licença pública.
