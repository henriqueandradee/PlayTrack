# Plano de Producao - Seguranca, LGPD e Operacao (PlayTrack)

Data: 10 de abril de 2026
Escopo: Go-live de backend, frontend, dados, juridico e operacao

## 1. Checklist de Seguranca em Producao

### 1.1 Infra e transporte
- [ ] HTTPS obrigatorio em 100% das rotas (TLS 1.2+; preferir TLS 1.3)
- [ ] Redirecionamento HTTP -> HTTPS no edge/load balancer
- [ ] HSTS habilitado com preload quando dominio estabilizar
- [ ] Certificados com renovacao automatica (ACME ou provedor cloud)

### 1.2 Backend e API
- [ ] CORS estrito com allowlist de dominios oficiais
- [x] Cookies de sessao com `HttpOnly`, `Secure`, `SameSite=Strict`
- [x] Rate limiting por rota sensivel (auth, export, gdpr, dmca, stats)
- [x] Limite de payload e validacao centralizada de entrada
- [x] Sanitizacao de input contra NoSQL operator injection
- [x] Protecao CSRF para metodos mutaveis com cookie auth
- [ ] Rotacao de JWT secret e tempo de sessao revisado por risco
- [ ] Matriz de autorizacao por recurso (ownership + RBAC)

### 1.3 Segredos e configuracao
- [ ] Secrets manager (AWS/GCP/Azure/Vault) no lugar de `.env` em runtime
- [ ] Rotacao trimestral de secrets (JWT, DB, SMTP, Stripe, YouTube)
- [ ] Ambiente separado por stage: dev, staging, production
- [ ] Politica de minimo privilegio para usuarios de banco e servicos

### 1.4 Dados, backup e recuperacao
- [ ] Backup diario criptografado com teste de restore mensal
- [ ] RPO/RTO definidos (ex.: RPO <= 24h, RTO <= 4h)
- [ ] Politica de retencao de logs e dados pessoais documentada
- [ ] Plano de continuidade para indisponibilidade de API externa (YouTube)

### 1.5 Monitoramento e deteccao
- [ ] Observabilidade centralizada (logs, metricas, traces)
- [ ] Alertas para 5xx, latencia, falha de login, burst de exportacoes
- [ ] Dashboard de seguranca (tentativas bloqueadas, 401/403/429)
- [ ] Auditoria de acessos administrativos e eventos LGPD

## 2. Checklist Juridico em Producao

### 2.1 Publicacao e transparencia
- [ ] Publicar e versionar: Politica de Privacidade, Termos de Uso e Politica de Cookies
- [ ] Exibir links legais no cadastro, login e area autenticada
- [ ] Registro de versao de termos aceitos por usuario (data/hora/IP)

### 2.2 LGPD
- [ ] Fluxo operacional completo dos direitos do titular:
  - [ ] Acesso
  - [ ] Retificacao
  - [ ] Exclusao
  - [ ] Portabilidade
  - [ ] Oposicao (marketing)
- [ ] SLA interno para respostas LGPD (ate 15 dias, salvo excecoes legais)
- [ ] Registro de base legal por finalidade de tratamento
- [ ] Inventario de dados e mapa de operadores/suboperadores

### 2.3 Marco Civil e registros
- [ ] Politica de retencao de logs de acesso conforme necessidade legal
- [ ] Processo de preservacao de evidencias em caso de ordem judicial
- [ ] Canal de contato juridico/compliance publicado

### 2.4 CDC (freemium e assinatura)
- [ ] Informar preco, recorrencia, cancelamento e efeitos do downgrade
- [ ] Fluxo de cancelamento simples e rastreavel
- [ ] Politica de reembolso e arrependimento (quando aplicavel)
- [ ] Confirmacao de assinatura/cobranca por email

### 2.5 YouTube ToS e direitos autorais
- [ ] Revisar implementacao final contra Termos da API do YouTube
- [ ] Explicitar responsabilidade do usuario sobre direitos de terceiros
- [ ] Procedimento DMCA com SLA e trilha de auditoria
- [ ] Revisar funcionalidade de export para evitar violacao contratual

## 3. Operacao e Resposta a Incidentes

### 3.1 Playbook de incidentes
- [ ] Definir severidade (SEV1-SEV4) e tempos de resposta
- [ ] Runbooks para: vazamento de dados, indisponibilidade, abuso de API
- [ ] Equipe responsavel (engenharia, juridico, suporte, produto)
- [ ] Checklist de notificacao e comunicacao com usuarios

### 3.2 Ferramentas recomendadas
- Logs/metricas: OpenTelemetry + Grafana + Loki/ELK
- Erros frontend/backend: Sentry
- Vulnerabilidade: npm audit + SCA continuo (Dependabot/Renovate)
- WAF e edge security: Cloudflare/AWS WAF
- Segredos: AWS Secrets Manager / GCP Secret Manager / HashiCorp Vault

## 4. Riscos Principais para Go-Live

### Seguranca
- Abuso de rotas custosas sem tuning de rate limit e quotas
- Exfiltracao de dados em endpoints de direitos se o fluxo de confirmacao voltar a usar token no URL
- Regressao de autorizacao horizontal em rotas novas

### Juridico
- Promessa de direitos LGPD sem fluxo operacional completo
- Politica comercial de assinatura sem detalhes de cancelamento/reembolso
- Risco de direitos autorais em conteudo de terceiros e exportacoes

## 5. Priorizacao (30/60/90 dias)

### 0-30 dias (bloqueadores de producao)
- [ ] Fechar fluxo LGPD operacional completo
- [ ] Hardening final de endpoints sensiveis (auth, gdpr, export, stats)
- [ ] Politicas legais finais aprovadas por revisao juridica
- [ ] Infra com HTTPS, segredos gerenciados e monitoramento minimo

### 31-60 dias
- [ ] SIEM basico e alertas de seguranca orientados a risco
- [ ] Testes automatizados AppSec (authz, abuso, input fuzzing)
- [ ] Simulado de incidente e tabletop de vazamento de dados

### 61-90 dias
- [ ] Auditoria externa (pentest + revisao juridica independente)
- [ ] Otimizacao de custos e capacidade em rotas de export
- [ ] Maturidade de governanca de dados e auditoria continua
