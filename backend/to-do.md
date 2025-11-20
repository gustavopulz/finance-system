# Infraestrutura
- (A) Configurar ambiente completo Docker @infra #critical
- (A) Criar docker-compose com API, Redis, Worker Go, ClickHouse, Postgres @infra
- (B) Configurar redes internas e volumes @infra
- (B) Criar variáveis de ambiente @infra

# PostgreSQL
- (A) Adicionar campo version em Bills @db #migration
- (A) Adicionar campo version em BillOccurrences @db #migration
- (A) Adicionar updatedAt em BillOccurrences @db #migration
- (B) Criar migration Prisma @db
- (B) Criar índices extras (billId, status, userId) @db
- (C) Testar escrita e leitura após alterações @db

# API
- (A) Criar serviço Redis (XADD) @api #critical
- (A) Criar função publishEvent(event,data) @api
- (B) Emitir evento bill_created @api
- (B) Emitir evento bill_updated @api
- (B) Emitir evento bill_occur_created @api
- (B) Emitir evento bill_occur_updated @api
- (B) Emitir evento bill_occur_status_changed @api
- (C) Padronizar estrutura do JSON de eventos #events

# Redis Streams
- (A) Criar Stream bills-events @redis
- (A) Criar Consumer Group clickhouse-workers @redis
- (B) Implementar retenção opcional @redis
- (B) Testar XADD e XREADGROUP manualmente @redis
- (C) Criar script de monitoramento XPENDING @redis

# Worker Go
- (A) Criar projeto Go @worker
- (A) Criar Dockerfile do Worker @worker
- (A) Conectar ao Redis via XREADGROUP @worker
- (A) Conectar ao ClickHouse @worker
- (B) Ler eventos em batch (100) @worker
- (B) Validar payload @worker
- (A) Inserir no ClickHouse (ReplacingMergeTree) @worker #critical
- (B) Implementar XACK após sucesso @worker
- (C) Retry & backoff @worker
- (C) Logs estruturados JSON @worker
- (C) Healthcheck HTTP @worker

# ClickHouse
- (A) Criar tabela bill_occurrences com ReplacingMergeTree(version) @clickhouse
- (A) ORDER BY occurrenceId @clickhouse
- (A) PARTITION BY year, month @clickhouse
- (B) Criar SELECT base com FINAL @clickhouse
- (B) Criar SELECT para dashboard mensal @clickhouse
- (B) Criar SELECT para categorias e projeções @clickhouse

# Sincronização
- (A) Implementar versionamento incremental no PG @db @api
- (B) Worker insere nova versão no CH @worker
- (C) Idempotência nas inserções @worker
- (C) Checagem PG ↔ ClickHouse @infra

# Front / Analytics
- (B) Criar endpoint /analytics/month @api
- (B) Criar endpoint /analytics/categories @api
- (C) Cache opcional com Redis @api
- (C) Garantir SELECT FINAL nos endpoints críticos @api

# Monitoramento
- (B) Criar alerta backlog XPENDING alto @infra
- (B) Criar alerta Worker parado @infra
- (B) Criar alerta falha em ClickHouse @infra
- (C) Criar sistema de replay @infra

# Testes Finais
- (A) Testar Bill → ClickHouse @api @worker
- (A) Testar update com nova versão @api
- (A) Testar marcar como pago @api
- (B) Testar criação de parcelas @api
- (B) Testar dashboards com volume alto @clickhouse
- (C) Testar concorrência com vários workers @worker

# Documentação
- (A) Criar README explicando arquitetura @infra
- (B) Criar docs dos eventos emitidos @api
- (C) Criar docs das consultas ClickHouse @clickhouse
