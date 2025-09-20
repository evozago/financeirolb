# Implementação de Persistência de Estado Global

## 1. Introdução

Este documento detalha a implementação de um sistema de persistência de estado global no projeto `financeirolb`. O objetivo é melhorar a experiência do usuário, garantindo que as configurações de filtros, seleções e outras preferências sejam mantidas ao navegar entre as páginas da aplicação.

## 2. Aprimoramentos no `StatePersistenceContext`

O contexto de persistência de estado existente, `StatePersistenceContext`, foi aprimorado para suportar uma gama mais ampla de estados e fornecer uma API mais robusta para o gerenciamento desses estados.

### 2.1. Expansão da Interface `PageState`

A interface `PageState` foi expandida para incluir novos campos, permitindo a persistência de mais informações:

```typescript
interface PageState {
  filters?: Record<string, any>;
  pagination?: { page: number; pageSize: number };
  sorting?: { column: string; direction: 'asc' | 'desc' };
  selectedItems?: string[];
  columnOrder?: string[];
  columnVisibility?: Record<string, boolean>;
  viewMode?: string;
  selectedEntity?: string;
  selectedAccount?: string;
  selectedFilial?: string;
  searchTerm?: string;
  dateRange?: { from?: string; to?: string };
  customSettings?: Record<string, any>;
}
```

### 2.2. Novos Métodos no Contexto

Novos métodos foram adicionados à interface `StatePersistenceContextType` e implementados no `StatePersistenceProvider` para gerenciar os novos estados:

- `updateViewMode`: Atualiza o modo de visualização (ex: lista, grade).
- `updateSelectedEntity`: Atualiza a entidade/empresa selecionada.
- `updateSelectedAccount`: Atualiza a conta bancária selecionada.
- `updateSelectedFilial`: Atualiza a filial selecionada.
- `updateSearchTerm`: Atualiza o termo de busca.
- `updateDateRange`: Atualiza o intervalo de datas selecionado.
- `updateCustomSetting`: Atualiza uma configuração personalizada.
- `clearAllStates`: Limpa todos os estados persistidos.
- `exportStates`: Exporta todos os estados como uma string JSON.
- `importStates`: Importa estados de uma string JSON.

## 3. Hook Personalizado `usePagePersistence`

Para simplificar o uso do contexto de persistência, foi criado um novo hook personalizado, `usePagePersistence`. Este hook encapsula a lógica de interação com o `StatePersistenceContext`, fornecendo uma API mais simples e centralizada para os componentes.

O hook `usePagePersistence` pode ser usado da seguinte forma:

```typescript
import { usePagePersistence } from '@/hooks/usePagePersistence';

function MyComponent() {
  const { pageState, updateFilters, updateSorting } = usePagePersistence('my-page-key');

  // ...
}
```

O hook também inclui funções de conveniência para persistir tipos específicos de estado, como `usePersistedFilters`, `usePersistedPagination`, `usePersistedSorting` e `usePersistedSelection`.

## 4. Integração com Componentes

A nova funcionalidade de persistência de estado foi integrada em componentes-chave da aplicação.

### 4.1. `AccountsPayable.tsx`

A página de contas a pagar agora utiliza o hook `usePagePersistence` para persistir os filtros e a ordenação da tabela. O estado local do componente é sincronizado com o estado persistido, garantindo que as configurações do usuário sejam mantidas ao sair e retornar à página.

### 4.2. `EntitySelector.tsx`

O seletor de entidades foi atualizado para usar o `usePagePersistence` para lembrar a última entidade selecionada. Isso evita que o usuário tenha que selecionar a mesma entidade repetidamente ao navegar pela aplicação.

## 5. Conclusão

A implementação do sistema de persistência de estado global aprimora significativamente a usabilidade do projeto `financeirolb`. Com as configurações do usuário sendo mantidas de forma consistente, a navegação se torna mais fluida e a experiência geral do usuário é melhorada. A arquitetura baseada em contexto e hooks personalizados torna o sistema de persistência de estado fácil de manter e expandir no futuro.

