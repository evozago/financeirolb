# Sistema de Gestão de Contas a Pagar

Um sistema completo para gestão de contas a pagar com funcionalidades avançadas de importação, controle de parcelas e navegação drill-down.

## 🚀 Tecnologias Utilizadas

### Frontend
- **React 18** com TypeScript
- **Tailwind CSS** para estilização
- **Recharts** para gráficos e visualizações
- **TanStack Query** para gerenciamento de estado do servidor
- **React Router** para navegação
- **react-dropzone** para upload de arquivos
- **shadcn/ui** para componentes de interface

### Funcionalidades Principais

#### 📊 Dashboard Interativo
- KPIs clicáveis que direcionam para listagens filtradas
- Gráficos de evolução das despesas
- Resumo financeiro em tempo real
- Navegação por contexto (drill-down)

#### 📋 Gestão de Contas a Pagar
- Listagem avançada com filtros personalizáveis
- Controle de parcelas individual
- Status automático (Pendente, Pago, Vencido)
- Ações em massa (marcar como pago, excluir)
- Seleção múltipla com checkboxes

#### 📥 Importação de Dados
- **Importação XML**: Suporte a múltiplos arquivos XML de notas fiscais
- **Importação Excel**: Upload de planilhas com modelo padronizado
- **Download de Template**: Modelo pré-formatado para importação
- Validação e relatório de erros/avisos

#### 🏢 Gestão de Fornecedores
- Cadastro completo com CNPJ e razão social
- Vinculação com marcas/brands
- Histórico de contas por fornecedor

#### 📊 Relatórios e Exportação
- Exportação para Excel com filtros aplicados
- Relatórios de vencimentos
- Análise de tendências

## 🏗️ Arquitetura do Sistema

### Filosofia de Navegação (Drill-Down)
O sistema utiliza uma navegação hierárquica sem menu tradicional:

1. **Nível 1 - Dashboard**: KPIs clicáveis e visão geral
2. **Nível 2 - Listagens**: Tabelas filtradas de contas a pagar
3. **Nível 3 - Detalhes**: Informações completas de uma conta específica
4. **Nível 4 - Sub-detalhes**: Detalhes de fornecedores e marcas

### Estrutura de Componentes

```
src/
├── components/
│   ├── ui/                     # Componentes base (shadcn/ui)
│   │   └── data-table.tsx      # Tabela genérica com funcionalidades avançadas
│   └── features/               # Componentes específicos do domínio
│       ├── dashboard/
│       │   └── PayablesSummaryCard.tsx
│       └── payables/
│           ├── PayablesTable.tsx       # Tabela especializada
│           ├── PayableFilters.tsx      # Filtros avançados
│           └── ImportModal.tsx         # Modal de importação
├── pages/
│   ├── DashboardPayables.tsx   # Dashboard principal
│   ├── AccountsPayable.tsx     # Listagem de contas
│   └── BillDetail.tsx          # Detalhes da conta
├── types/
│   └── payables.ts             # Definições de tipos TypeScript
└── assets/
    └── dashboard-hero.jpg      # Imagem do dashboard
```

## 🎨 Design System

O sistema utiliza um design system consistente baseado em:

- **Cores semânticas**: Tokens CSS para cores de status (pago, pendente, vencido)
- **Gradientes**: Gradientes profissionais para elementos visuais
- **Tipografia**: Sistema de fontes hierárquico
- **Espaçamento**: Grid system responsivo
- **Estados**: Hover, focus e active states consistentes

### Cores Principais
- **Primary**: Azul corporativo (#3b82f6)
- **Success**: Verde para status "Pago" (#16a34a)
- **Warning**: Amarelo para status "Pendente" (#eab308)
- **Destructive**: Vermelho para status "Vencido" (#dc2626)

## 📱 Responsividade

O sistema é totalmente responsivo com:
- Layout adaptativo para desktop, tablet e mobile
- Tabelas com scroll horizontal em telas menores
- Navegação otimizada para touch
- Cards empilháveis em dispositivos móveis

## 🔧 Instalação e Desenvolvimento

### Pré-requisitos
- Node.js 18+ 
- npm ou yarn

### Instalação
```bash
# Clone o repositório
git clone <URL_DO_REPOSITORIO>
cd contas-a-pagar

# Instale as dependências
npm install

# Inicie o servidor de desenvolvimento
npm run dev
```

### Scripts Disponíveis
```bash
npm run dev          # Servidor de desenvolvimento
npm run build        # Build para produção
npm run preview      # Preview do build
npm run lint         # Verificação de lint
npm run type-check   # Verificação de tipos
```

## 📊 Formato da Planilha de Importação

Para importar dados via planilha Excel, utilize o seguinte formato:

| Coluna | Tipo | Descrição | Exemplo |
|--------|------|-----------|---------|
| Fornecedor_CNPJ | Texto | CNPJ do fornecedor | 12.345.678/0001-90 |
| Fornecedor_Nome | Texto | Nome do fornecedor | EMPRESA LTDA |
| Descricao | Texto | Descrição da conta | NFe 123456 |
| Valor_Total | Número | Valor total da conta | 1000.50 |
| Total_Parcelas | Número | Número de parcelas | 3 |
| Numero_Parcela | Número | Número da parcela atual | 1 |
| Valor_Parcela | Número | Valor da parcela | 333.50 |
| Vencimento | Data | Data de vencimento | 2024-12-31 |
| Status | Texto | Status da parcela | Pendente |

### Regras de Importação
- Uma linha por parcela
- CNPJ deve estar no formato XX.XXX.XXX/XXXX-XX
- Datas no formato YYYY-MM-DD
- Status aceitos: "Pendente", "Pago", "Vencido"
- Valores numéricos com ponto como separador decimal

## 🔍 Funcionalidades da Tabela

### Ordenação
- Clique nos cabeçalhos para ordenar crescente/decrescente
- Indicadores visuais de direção da ordenação
- Múltiplas colunas ordenáveis

### Personalização de Colunas
- Menu dropdown para mostrar/ocultar colunas
- Estado salvo no localStorage
- Colunas reordenáveis (futura implementação)

### Seleção Múltipla
- Checkbox para seleção individual
- Checkbox master para seleção total
- Estado indeterminado quando parcialmente selecionado
- Ações em massa disponíveis para itens selecionados

### Filtros Avançados
- Busca textual global
- Filtros por status, fornecedor, período e valor
- Filtros aplicados mostrados como badges removíveis
- Estado dos filtros preservado na URL

## 🎯 Roadmap de Funcionalidades

### Versão Atual (v1.0)
- ✅ Dashboard com KPIs clicáveis
- ✅ Listagem de contas com filtros
- ✅ Detalhes de contas e parcelas
- ✅ Importação XML e Excel
- ✅ Navegação drill-down
- ✅ Design system consistente

### Próximas Versões
- 🔄 **Backend Integration**: API real com Prisma + PostgreSQL
- 🔄 **Autenticação**: Sistema de login com JWT
- 🔄 **Notificações**: Alertas de vencimento
- 🔄 **Dashboard Avançado**: Mais gráficos e métricas
- 🔄 **Mobile App**: Aplicativo nativo
- 🔄 **Relatórios PDF**: Geração de relatórios
- 🔄 **Auditoria**: Log de alterações
- 🔄 **Multi-empresa**: Suporte a múltiplas empresas

## 🤝 Contribuição

1. Fork o projeto
2. Crie uma branch para sua feature (`git checkout -b feature/AmazingFeature`)
3. Commit suas mudanças (`git commit -m 'Add some AmazingFeature'`)
4. Push para a branch (`git push origin feature/AmazingFeature`)
5. Abra um Pull Request

## 📝 Licença

Este projeto está sob a licença MIT. Veja o arquivo [LICENSE](LICENSE) para mais detalhes.

## 🆘 Suporte

Para suporte e dúvidas:
- Abra uma issue no GitHub
- Entre em contato com a equipe de desenvolvimento
- Consulte a documentação técnica

---

Desenvolvido com ❤️ para gestão financeira eficiente