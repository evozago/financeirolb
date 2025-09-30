# 📊 Padrão de Importação de Planilhas - Contas a Pagar

## ✅ Implementação Completa

O sistema de importação de planilhas Excel foi **100% implementado** no financeirolb, permitindo importação em massa de contas a pagar através de arquivos .xlsx.

## 📋 Estrutura da Planilha

### Colunas Obrigatórias:
1. **Fornecedor** - Nome da empresa ou pessoa física
2. **Descrição** - Descrição do produto/serviço fornecido
3. **Valor** - Valor da conta a pagar (aceita formatos: 1250.50 ou 1.250,50)
4. **Data Vencimento** - Data de vencimento da conta

### Colunas Opcionais:
5. **Categoria** - Tipo da despesa (padrão: "Geral")
6. **Número Documento** - Número da nota fiscal ou documento
7. **Data Emissão** - Data de emissão (padrão: data atual)
8. **Filial** - Nome da filial (deve existir no sistema)
9. **Observações** - Informações adicionais

## 📝 Exemplo de Planilha

| Fornecedor | Descrição | Valor | Data Vencimento | Categoria | Número Documento | Data Emissão | Filial | Observações |
|------------|-----------|-------|-----------------|-----------|------------------|--------------|--------|-------------|
| Empresa ABC Ltda | Fornecimento de materiais de escritório | 1250.50 | 2025-10-15 | Material de Escritório | NF-001234 | 2025-09-30 | Matriz | Pedido #12345 |
| Fornecedor XYZ S.A. | Serviços de manutenção | 850.00 | 2025-10-20 | Serviços | NF-005678 | 2025-09-30 | Filial SP | Contrato anual |
| Distribuidora 123 | Produtos para revenda | 3200.75 | 2025-11-05 | Mercadorias | NF-009876 | 2025-09-30 | | Lote #789 |

## 🔧 Funcionalidades Implementadas

### Processamento Inteligente:
- **Detecção automática de colunas** - Sistema reconhece colunas mesmo com nomes diferentes
- **Validação de dados** - Verifica se dados obrigatórios estão presentes
- **Conversão de formatos** - Converte datas e valores automaticamente
- **Criação automática de fornecedores** - Cria entidades que não existem no sistema

### Formatos Aceitos:

#### Datas:
- `2025-10-15` (formato ISO)
- `15/10/2025` (formato brasileiro)
- Números do Excel (conversão automática)

#### Valores:
- `1250.50` (formato decimal)
- `1.250,50` (formato brasileiro)
- Remove automaticamente símbolos de moeda

#### Texto:
- Nomes de fornecedores sem caracteres especiais
- Descrições detalhadas
- Categorias personalizadas

## 🎯 Como Usar

### 1. Baixar Modelo:
1. Acesse "Contas a Pagar"
2. Clique "Importar Planilha"
3. Clique "Baixar Modelo"
4. Arquivo será baixado com exemplos e instruções

### 2. Preencher Dados:
1. Use a aba "Contas a Pagar" do modelo
2. Mantenha os cabeçalhos na primeira linha
3. Preencha os dados nas linhas seguintes
4. Não deixe linhas vazias entre os dados

### 3. Importar:
1. Salve a planilha como .xlsx
2. No sistema, clique "Importar Planilha"
3. Selecione o arquivo
4. Aguarde o processamento
5. Verifique relatório de importação

## 🛡️ Validações e Segurança

### Validações Automáticas:
- ✅ Verifica se colunas obrigatórias existem
- ✅ Valida formato de datas
- ✅ Verifica se valores são numéricos
- ✅ Confirma se fornecedor foi informado
- ✅ Valida se filial existe no sistema

### Tratamento de Erros:
- ✅ Relatório detalhado de erros por linha
- ✅ Avisos para dados opcionais inválidos
- ✅ Continuação do processamento mesmo com erros
- ✅ Rollback automático em caso de falha crítica

### Criação Automática:
- ✅ **Fornecedores novos** são criados automaticamente como PJ
- ✅ **Entidades** são vinculadas ou criadas conforme necessário
- ✅ **Categorias** são aceitas mesmo se não existirem previamente

## 📊 Relatório de Importação

Após a importação, o sistema exibe:

### Informações de Sucesso:
- Número total de registros processados
- Contas importadas com sucesso
- Fornecedores criados automaticamente

### Avisos:
- Linhas com dados opcionais inválidos
- Filiais não encontradas
- Formatos de data convertidos

### Erros:
- Linhas com dados obrigatórios ausentes
- Valores inválidos
- Problemas de formato

## 🎨 Template Automático

O sistema gera automaticamente um template Excel com:

### Aba "Contas a Pagar":
- Cabeçalhos formatados
- Exemplos de dados reais
- Larguras de coluna otimizadas
- Formatação profissional

### Aba "Instruções":
- Guia completo de uso
- Lista de colunas obrigatórias e opcionais
- Formatos aceitos
- Dicas de preenchimento

## 🔄 Integração com Sistema

### Dados Criados:
- **ap_installments** - Registro principal da conta
- **entidades** - Fornecedores (se não existirem)
- Vinculação com **filiais** existentes

### Campos Preenchidos:
- `descricao` - Descrição informada
- `fornecedor` - Nome do fornecedor
- `valor` - Valor da parcela
- `valor_total_titulo` - Mesmo valor (parcela única)
- `data_vencimento` - Data de vencimento
- `data_emissao` - Data de emissão
- `status` - "aberto" (padrão)
- `numero_documento` - Número do documento
- `categoria` - Categoria informada
- `entidade_id` - ID do fornecedor
- `filial_id` - ID da filial (se informada)
- `numero_parcela` - 1 (parcela única)
- `total_parcelas` - 1 (parcela única)
- `observacoes` - Observações + origem da importação

## 🚀 Status Final

**✅ SISTEMA 100% FUNCIONAL**

- Importação de planilhas Excel implementada
- Template automático com instruções
- Validações robustas
- Relatórios detalhados
- Integração completa com banco de dados
- Criação automática de fornecedores
- Suporte a múltiplos formatos de data e valor

O sistema está pronto para importação em massa de contas a pagar via planilhas Excel!
