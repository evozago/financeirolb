export type UUID = string;

export type AssignVendedoraBody = {
  pessoaId: UUID;
  entidadeId: UUID;
};

export type SetVendedoraConfigBody = {
  pessoaId: UUID;
  entidadeId: UUID;
  ativa?: boolean;
  metas?: Record<string, unknown> | null;
  preferencia?: Record<string, unknown> | null;
};
