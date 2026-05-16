Aqui está o PRD completo para o sistema de gerenciamento de leads via WhatsApp:

---

# PRD — WhatsApp Lead Manager

**Product Requirements Document | v1.0 | Maio/2026**

---

## 1. Visão Geral do Produto

## O **WhatsApp Lead Manager** é uma plataforma web SaaS de gerenciamento de leads integrada ao WhatsApp via Evolution API, permitindo que o operador gerencie dois números de telefone em uma interface unificada, com inteligência artificial embutida para análise de conversas, geração de insights e despacho automatizado de resumos para equipes internas. [github](https://github.com/ZadeFrontier/Wsapp-evolution-api)

## 2. Objetivos e Métricas de Sucesso

**Objetivos estratégicos:**

- Centralizar a gestão de leads de 2 linhas WhatsApp em uma interface única e profissional
- Eliminar perda de contexto entre atendimentos e equipes internas
- Reduzir tempo de qualificação de lead via análise automática por IA

**KPIs de sucesso:**

- Tempo médio de resposta < 5 min por lead
- Taxa de conversão de leads qualificados ≥ 30% acima do baseline manual
- Tempo de geração de resumo IA < 10 segundos por conversa

---

## 3. Stakeholders

| Papel              | Responsabilidade                                  |
| ------------------ | ------------------------------------------------- |
| Operador Principal | Usa as 2 linhas, gerencia leads, aciona despachos |
| Secretaria         | Recebe resumos e dados de leads despachados       |
| Equipe Interna     | Recebe briefings com contexto de negociação       |
| Dev Lead           | Desenvolvimento e manutenção da plataforma        |

---

## 4. Personas

**Persona 1 — O Operador Comercial**
Profissional que utiliza as 2 linhas WhatsApp para prospecção e negociação ativa. Precisa de visão consolidada, histórico contextual e acesso rápido a perfis de leads sem perder o fio da conversa.

**Persona 2 — A Secretaria / Equipe Interna**
Recebe resumos prontos no próprio WhatsApp com dados estruturados. Não usa a plataforma diretamente — é o destino final do despacho de informação gerado pela IA.

---

## 5. Arquitetura de Integração

O sistema conecta-se à **Evolution API v2**, criando duas instâncias separadas (uma por número), ambas via Baileys (WhatsApp Web) ou Cloud API oficial, dependendo da disponibilidade dos números no Meta Business. Os eventos de mensagens chegam via **webhook** para o backend da plataforma, onde são processados, armazenados e disponibilizados em tempo real via WebSocket para o front-end. [github](https://github.com/ZadeFrontier/Wsapp-evolution-api)

**Stack técnica sugerida:**

- **Backend:** Node.js + TypeScript / ou Go (para performance em real-time)
- **Banco de dados:** PostgreSQL (dados relacionais) + Supabase (realtime + auth)
- **IA:** LLM via API (Claude Sonnet / GPT-4o) para geração de insights e resumos
- **Frontend:** React/Next.js com TailwindCSS
- **Mensageria:** WebSocket (Socket.io) para inbox em tempo real
- **Infraestrutura:** Docker Compose + VPS dedicada

---

## 6. Módulos e Funcionalidades

### 6.1 — Inbox Unificada (Multi-linha)

- Visualização de conversas das **2 instâncias** numa única tela, com indicador visual de qual linha pertence cada conversa [github](https://github.com/ZadeFrontier/Wsapp-evolution-api)
- Painel estilo coluna esquerda (lista de conversas) + coluna direita (chat aberto)
- Badge de notificação por número de linha
- Indicadores de status: online, digitando, lido/entregue
- Busca full-text em conversas e contatos
- Filtro por **tags**, **linha**, **status do lead** (novo, em negociação, qualificado, perdido)
- Ordenação por: última mensagem, prioridade, data de criação do lead

### 6.2 — Perfil do Lead (Lead Card)

Ao clicar em qualquer contato, um painel lateral ou modal exibe o **Lead Card** completo:

| Zona              | Conteúdo                                                                        |
| ----------------- | ------------------------------------------------------------------------------- |
| **Identificação** | Nome, telefone, linha vinculada, avatar, data de primeiro contato               |
| **Tags**          | Tags múltiplas coloridas, adicionáveis/removíveis inline                        |
| **Notas**         | Editor de texto livre com histórico de notas por data/hora                      |
| **Detalhes**      | Campos customizáveis: empresa, cargo, cidade, canal de origem, estágio do funil |
| **Insights IA**   | Painel gerado automaticamente após análise das conversas                        |
| **Timeline**      | Histórico cronológico de todas as interações e eventos do lead                  |
| **Ações**         | Botões de despacho para Secretaria, Equipe Interna, e exportação                |

### 6.3 — Sistema de Tags e Segmentação

- Tags com nome, cor customizável e ícone opcional [linkedin](https://www.linkedin.com/posts/suscin-innovation-labs_top-5-dos-for-whatsapp-crm-1-personalize-activity-7326500533358211072-_HhT)
- Criação de tags diretamente no perfil do lead ou em configurações globais
- Filtro na inbox por **uma ou múltiplas tags** (operadores AND/OR)
- Grupos de tags por categoria: ex. "Origem", "Interesse", "Estágio", "Prioridade"
- Tags podem ser aplicadas em bulk (seleção múltipla de contatos)

### 6.4 — Motor de IA — Análise e Geração de Insights

Este é o core diferencial do produto. Quando acionado (manualmente ou de forma automática ao final de uma conversa):

1. O sistema coleta o **histórico completo da conversa** com aquele lead
2. Envia para o LLM (Claude Sonnet ou GPT-4o) com um prompt estruturado contendo: contexto do lead, notas existentes e a transcrição
3. O modelo retorna:
   - **Resumo executivo** da conversa (3-5 linhas)
   - **Insights identificados** (necessidades, objeções, interesse estimado)
   - **Próximos passos sugeridos**
   - **Score de qualificação** (0–100)
   - **Tags sugeridas** automaticamente

**Prompt Engineering:** O sistema deve ter um **prompt base configurável** pelo admin, permitindo personalizar o tom e o foco da análise (ex: foco em imóveis, agronegócio, serviços, etc.).

### 6.5 — Painel de Ações e Despacho

Dentro do Lead Card, a seção **Ações** exibe botões de despacho rápido:

**→ Enviar para Secretaria**

- Compila automaticamente: dados do lead + resumo IA + insights + próximos passos
- Envia via WhatsApp (pela linha 1 ou 2, configurável) para o número da secretaria
- Formato da mensagem: estruturado com emojis e seções claras (nome, telefone, resumo, insights, ação esperada)
- Log da ação registrado na timeline do lead

**→ Enviar para Equipe Interna**

- Mesmo fluxo, porém com template diferente (mais técnico/comercial)
- Pode ser enviado para um grupo WhatsApp ou número individual da equipe
- Inclui link direto para o perfil do lead na plataforma (deep link)

**→ Agendar Follow-up**

- Define lembrete com data/hora e nota rápida
- Notifica o operador via push ou WhatsApp no momento definido

### 6.6 — Dashboard e Analytics

- Cards de métricas: total de leads, novos hoje, em negociação, qualificados
- Gráfico de volume de conversas por linha e por dia
- Top tags mais usadas
- Funil de leads por estágio
- Leads sem resposta há mais de X horas (alerta de inatividade)

---

## 7. Fluxos Críticos (User Stories)

**US-01 — Conversar e Taguear**

> Como operador, quero abrir a inbox, selecionar uma conversa, responder o lead e adicionar tags ao seu perfil sem sair da tela de chat.

**US-02 — Gerar Insight com IA**

> Como operador, ao finalizar uma negociação, quero clicar em "Analisar com IA" e receber em segundos um resumo e score do lead, salvo automaticamente no seu perfil.

**US-03 — Despachar para Secretaria**

> Como operador, quero clicar em "Enviar p/ Secretaria" e ter certeza de que ela receberá um WhatsApp formatado com todos os dados relevantes do lead, sem precisar digitar nada manualmente.

**US-04 — Filtrar por Segmento**

> Como operador, quero filtrar a inbox por tag "Interessado em Soja" para ver apenas os leads desse grupo e dar continuidade às conversas de forma focada.

---

## 8. Requisitos Não-Funcionais

- **Performance:** Inbox deve carregar em < 2s; mensagens devem aparecer em tempo real via WebSocket
- **Segurança:** Autenticação JWT + HTTPS obrigatório; chaves da Evolution API armazenadas em variáveis de ambiente criptografadas
- **Disponibilidade:** 99.5% uptime; reconexão automática com a Evolution API em caso de queda [github](https://github.com/ZadeFrontier/Wsapp-evolution-api)
- **Escalabilidade:** Arquitetura preparada para adicionar novas linhas WhatsApp sem refatoração
- **Privacidade:** Dados de conversas armazenados em banco próprio (não em terceiros), conformidade com LGPD

---

## 9. Fora do Escopo (v1.0)

- Chatbot automatizado (bot de atendimento)
- Integração com CRMs externos (Salesforce, HubSpot)
- Campanhas de disparo em massa
- Suporte a Instagram/Messenger (Evolution API suporta, mas v1.0 foca em WhatsApp) [github](https://github.com/ZadeFrontier/Wsapp-evolution-api)
- App mobile nativo

---

## 10. Roadmap de Desenvolvimento

| Fase             | Entregável                                                           | Prazo estimado |
| ---------------- | -------------------------------------------------------------------- | -------------- |
| **MVP (Fase 1)** | Inbox unificada + 2 instâncias Evolution API + perfil básico de lead | 6 semanas      |
| **Fase 2**       | Sistema de tags + filtros avançados + notas e detalhes no Lead Card  | 3 semanas      |
| **Fase 3**       | Motor de IA (análise + geração de insights) + despacho via WhatsApp  | 4 semanas      |
| **Fase 4**       | Dashboard analytics + agendamento de follow-up + polish UI/UX        | 3 semanas      |
| **Beta Launch**  | Testes com usuário real + correções                                  | 2 semanas      |

**Total estimado: ~18 semanas** para produto completo e estável.

---

## 11. Riscos e Mitigações

| Risco                                           | Probabilidade | Mitigação                                                                                                                        |
| ----------------------------------------------- | ------------- | -------------------------------------------------------------------------------------------------------------------------------- |
| Banimento do número pelo WhatsApp (via Baileys) | Média         | Usar Cloud API oficial para linhas de alto volume [doc.evolution-api](https://doc.evolution-api.com/v2/pt/integrations/cloudapi) |
| Latência na geração de insights pela IA         | Baixa         | Processamento assíncrono com indicador de loading                                                                                |
| Custo de tokens LLM elevado                     | Média         | Limitar tamanho do contexto enviado; cachear resumos já gerados                                                                  |
| Perda de conexão com Evolution API              | Baixa         | Reconexão automática + fila de mensagens pendentes                                                                               |
