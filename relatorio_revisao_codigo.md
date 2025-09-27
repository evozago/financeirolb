# Tarefas sugeridas

## Corrigir erro de digitação
- **Arquivo:** `src/hooks/useSalesData.ts`
- **Descrição:** A linha de comentário `// Persistência (UPERT idempotente)` contém um erro ortográfico em "UPERT" — o correto é "UPSERT" para refletir a operação usada logo abaixo.

## Corrigir bug
- **Arquivo:** `src/hooks/useSalesData.ts`
- **Descrição:** A função `getSingleDefaultEntityId` sempre retorna a primeira entidade de `entidades_corporativas`, mesmo quando há múltiplos registros. Isso contraria o comportamento documentado (usar fallback apenas quando existir exatamente uma entidade) e pode fazer com que dados de outra entidade sejam carregados ou sobrescritos sem seleção explícita.

## Ajustar comentário/documentação
- **Arquivo:** `src/hooks/useSalesData.ts`
- **Descrição:** O cabeçalho do arquivo afirma que o fallback automático só ocorre quando há exatamente uma entidade, porém o código atual (linha que retorna sempre `data[0].id`) não aplica essa verificação. Atualizar o comentário ou alinhar o comportamento é necessário para evitar discrepâncias de documentação.

## Melhorar teste
- **Arquivo:** `launch_recurring_bill.py`
- **Descrição:** Não há cobertura automatizada para a lógica de cálculo da data de vencimento em `launch_current_month`. Criar testes unitários (ex.: usando `pytest`) que validem os cenários de virada de mês/dezembro garantiria que regressões nessa lógica sejam detectadas sem precisar chamar a API real.
