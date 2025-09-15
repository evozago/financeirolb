# Sistema de Gestão Financeira - LB Finance

Sistema web para gestão financeira empresarial com foco em contas a pagar, vendas e relatórios.

## Tecnologias

- React + TypeScript + Vite
- Tailwind CSS (design system)
- Supabase (backend completo)
- GitHub Pages (deploy automático)

## 🚀 Operação 100% pelo Navegador (Sem Terminal Local)

### Pré-requisitos
- Conta GitHub
- Conta Supabase
- Navegador moderno

### 1. Configuração do Supabase

#### 1.1 Executar Scripts SQL
Acesse o [SQL Editor do Supabase](https://supabase.com/dashboard/project/mnxemxgcucfuoedqkygw/sql/new) e execute na ordem:

1. **Primeiro:** `supabase/sql/lb_sales_schema_and_policies.sql`
   - Cria tabelas de vendas e metas
   - Configura índices únicos e triggers
   - Define políticas RLS para usuários autenticados

2. **Segundo:** `supabase/sql/000_all_in_one.sql`  
   - Unifica entidades duplicadas (não-destrutivo)
   - Cria modelo canônico com views de diagnóstico
   - Mapeia relacionamentos entre tabelas legadas

3. **Terceiro:** `supabase/sql/verify_checks.sql`
   - Verifica se tudo foi aplicado corretamente
   - Mostra estatísticas de unificação
   - Lista duplicidades encontradas

#### 1.2 Configurar Autenticação
No [painel de Auth](https://supabase.com/dashboard/project/mnxemxgcucfuoedqkygw/auth/providers):

**URL Configuration:**
- Site URL: `https://evozago.github.io/financeirolb`
- Redirect URLs: `https://evozago.github.io/financeirolb/*`

**Criar Usuário de Teste:**
Acesse [Auth > Users](https://supabase.com/dashboard/project/mnxemxgcucfuoedqkygw/auth/users) → Add User:
- Email: `teste@empresa.com`
- Password: `123456789`
- Email Confirm: ✅ (marcar como confirmado)

### 2. Configuração do GitHub Pages

Acesse as configurações do repositório no GitHub:
- Settings → Pages
- Source: Deploy from branch
- Branch: `main` (ou `master`)
- Folder: `/` (root)

O deploy é automático a cada push na branch principal.

### 3. Teste de Funcionamento

1. **Acesso:** https://evozago.github.io/financeirolb
2. **Login:** Use o usuário de teste criado
3. **Navegação:** Acesse "Vendas / Gestão de Vendas"
4. **Teste de Persistência:**
   - Selecione uma entidade (obrigatório)
   - Edite valores nas abas "Comparativo Anual" e "Vendedoras"
   - Clique em "💾 SALVAR TODOS OS DADOS"
   - Atualize a página (F5)
   - Verifique se os dados persistiram

### 4. Estrutura do Projeto

```
src/
├── integrations/supabase/
│   └── client.ts              # Cliente Supabase (configurado)
├── hooks/
│   ├── useSalesData.ts        # Persistência de vendas
│   ├── useParcelas.ts         # Sistema corporativo
│   └── useEntidadesCorporativas.ts
├── components/
│   ├── sales/                 # Gestão de vendas
│   └── features/payables/     # Contas a pagar corporativas
└── pages/
    ├── SalesManagement.tsx    # Dashboard de vendas
    └── AccountsPayable.tsx    # Contas a pagar

supabase/sql/
├── lb_sales_schema_and_policies.sql  # Schema de vendas
├── 000_all_in_one.sql               # Unificação de entidades
└── verify_checks.sql                # Verificações
```

## 🔧 Funcionalidades Implementadas

### ✅ Persistência de Vendas
- Metas mensais por vendedora com índices únicos
- Totais de vendas por mês/entidade
- Triggers automáticos de `updated_at`
- RLS configurado para usuários autenticados
- Upsert automático (sem duplicatas)

### ✅ Unificação de Entidades (Não-Destrutiva)
- Modelo canônico `entidades_unicas`
- Mapeamento `entidade_map` preserva dados originais
- Views de diagnóstico para duplicidades:
  - `vw_entidades_dup_cpf_cnpj`
  - `vw_entidades_dup_email` 
  - `vw_entidades_dup_phone`
- Views canônicas para consumo:
  - `vw_vendedoras_canon`
  - `vw_fornecedores_canon`
  - `vw_pessoas_canon`

### ✅ Sistema Corporativo
- Migração completa de `ap_installments` → modelo corporativo
- API REST via Edge Functions
- Gestão de parcelas com pagamentos
- Entidades com múltiplos papéis (cliente, fornecedor, vendedor)

## 🛡️ Segurança

- **Frontend:** Apenas `anon_key` (seguro para exposição)
- **RLS:** Políticas restritivas por usuário autenticado
- **Triggers:** Validações automáticas no banco
- **Edge Functions:** Processamento server-side quando necessário

## 📊 Monitoramento

### Verificar Saúde do Sistema
Execute no SQL Editor:
```sql
-- Verificar duplicidades
SELECT * FROM vw_entidades_dup_cpf_cnpj;
SELECT * FROM vw_entidades_dup_email;

-- Status das vendas
SELECT COUNT(*) as metas FROM sales_goals;
SELECT COUNT(*) as vendas FROM store_monthly_sales;

-- Últimas atualizações
SELECT table_name, MAX(updated_at) as ultima_atualizacao
FROM (
  SELECT 'sales_goals' as table_name, updated_at FROM sales_goals
  UNION ALL
  SELECT 'store_monthly_sales', updated_at FROM store_monthly_sales
) t GROUP BY table_name;
```

## 🚨 Troubleshooting

### Problema: Dados não persistem após salvar
**Solução:**
1. Verificar se usuário está logado
2. Confirmar se entidade foi selecionada
3. Verificar console do navegador para erros
4. Testar políticas RLS no SQL Editor

### Problema: Erro de "row violates RLS policy"  
**Solução:**
1. Confirmar que o usuário está autenticado (`auth.uid() IS NOT NULL`)
2. Verificar se as políticas permitem INSERT/UPDATE para authenticated
3. Revisar se `entity_id` está sendo passado corretamente

### Problema: Componentes não carregam vendedoras
**Solução:**
1. Verificar se a view `vendedoras_view` foi criada
2. Confirmar dados na tabela `pessoas` com `tipo_pessoa = 'Vendedor'`
3. Testar query manualmente no SQL Editor

### Links Úteis
- [Dashboard Supabase](https://supabase.com/dashboard/project/mnxemxgcucfuoedqkygw)
- [SQL Editor](https://supabase.com/dashboard/project/mnxemxgcucfuoedqkygw/sql/new)
- [Logs Auth](https://supabase.com/dashboard/project/mnxemxgcucfuoedqkygw/auth/users)
- [GitHub Pages](https://evozago.github.io/financeirolb)
- [Repositório](https://github.com/evozago/financeirolb)