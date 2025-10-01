# Recuperação de Contas a Pagar Deletadas

## Resumo da Situação
- **Total de registros deletados encontrados:** 25
- **Data/hora da deleção:** 2025-09-30 19:55:36 UTC
- **Tipo de deleção:** Soft delete (campo `deleted_at` preenchido)
- **Status:** Dados íntegros e recuperáveis

## Registros Encontrados

### Fornecedores Afetados:
1. **TEX COTTON IND. DE CONFECCOES LTDA** - 3 parcelas
2. **DUDES INDUSTRIA E COMERCIO DE ROUPAS LTDA** - 1 parcela
3. **VIDA BABY COMERCIO DE ROUPAS E ACESSORIOS LTDA** - 2 parcelas
4. **FLAJO IND E COM DE ACABAMENTOS TEXTEIS LTDA.** - 3 parcelas
5. **BRITO & CIA LTDA** - 1 parcela
6. **AZZAS 2154 S.A** - 4 parcelas
7. **IPÊ - Escola** - 1 parcela
8. **HUG FABRICACAO DE ARTIGOS INFANTIS LTDA** - 1 parcela
9. **CONFECCOES JOJO LTDA** - 1 parcela
10. **ABRANGE IND E COM CONF LTDA** - 2 parcelas
11. **COMPANHIA FABRIL LEPPER - FILIAL** - 2 parcelas
12. **CONFECCOES DILA LTDA** - 1 parcela
13. **MOAS INDUSTRIA E COMERCIO IMPORTACAO E EXPORTACAO LTDA** - 1 parcela
14. **TDB TEXTIL LTDA** - 1 parcela
15. **FAKINI MALHAS LTDA** - 1 parcela

### Valor Total Afetado:
- **Soma dos valores:** R$ 26.555,57

### Características dos Registros:
- Todos com status "vencido"
- Datas de vencimento entre 04/09/2025 e 08/09/2025
- Parcelas de diferentes NFes
- Diversos fornecedores do setor têxtil/confecção

## Plano de Recuperação:
1. ✅ Identificar registros deletados
2. ✅ Confirmar integridade dos dados
3. 🔄 Executar comando UPDATE para remover `deleted_at`
4. ⏳ Validar recuperação
5. ⏳ Confirmar funcionamento no sistema
