export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "12.2.12 (cd3cf9e)"
  }
  public: {
    Tables: {
      ap_audit_log: {
        Row: {
          changed_at: string | null
          changed_by: string | null
          id: string
          new_data: Json | null
          old_data: Json | null
          operation: string
          record_id: string | null
          table_name: string
        }
        Insert: {
          changed_at?: string | null
          changed_by?: string | null
          id?: string
          new_data?: Json | null
          old_data?: Json | null
          operation: string
          record_id?: string | null
          table_name: string
        }
        Update: {
          changed_at?: string | null
          changed_by?: string | null
          id?: string
          new_data?: Json | null
          old_data?: Json | null
          operation?: string
          record_id?: string | null
          table_name?: string
        }
        Relationships: []
      }
      ap_installments: {
        Row: {
          banco: string | null
          banco_pagador: string | null
          categoria: string | null
          comprovante_path: string | null
          conta_bancaria_id: string | null
          created_at: string
          dados_pagamento: string | null
          data_emissao: string | null
          data_hora_pagamento: string | null
          data_pagamento: string | null
          data_vencimento: string
          deleted_at: string | null
          descricao: string
          eh_recorrente: boolean | null
          entidade_id: string | null
          filial_id: string | null
          forma_pagamento: string | null
          fornecedor: string
          funcionario_id: string | null
          id: string
          installment_norm: string | null
          invoice_number_norm: string | null
          is_duplicate: boolean | null
          numero_documento: string | null
          numero_nfe: string | null
          numero_parcela: number | null
          observacoes: string | null
          recurring_occurrence_id: string | null
          status: string
          supplier_key: string | null
          tipo_recorrencia: string | null
          total_parcelas: number | null
          updated_at: string
          valor: number
          valor_fixo: boolean | null
          valor_pago: number | null
          valor_total_titulo: number | null
        }
        Insert: {
          banco?: string | null
          banco_pagador?: string | null
          categoria?: string | null
          comprovante_path?: string | null
          conta_bancaria_id?: string | null
          created_at?: string
          dados_pagamento?: string | null
          data_emissao?: string | null
          data_hora_pagamento?: string | null
          data_pagamento?: string | null
          data_vencimento: string
          deleted_at?: string | null
          descricao: string
          eh_recorrente?: boolean | null
          entidade_id?: string | null
          filial_id?: string | null
          forma_pagamento?: string | null
          fornecedor: string
          funcionario_id?: string | null
          id?: string
          installment_norm?: string | null
          invoice_number_norm?: string | null
          is_duplicate?: boolean | null
          numero_documento?: string | null
          numero_nfe?: string | null
          numero_parcela?: number | null
          observacoes?: string | null
          recurring_occurrence_id?: string | null
          status?: string
          supplier_key?: string | null
          tipo_recorrencia?: string | null
          total_parcelas?: number | null
          updated_at?: string
          valor: number
          valor_fixo?: boolean | null
          valor_pago?: number | null
          valor_total_titulo?: number | null
        }
        Update: {
          banco?: string | null
          banco_pagador?: string | null
          categoria?: string | null
          comprovante_path?: string | null
          conta_bancaria_id?: string | null
          created_at?: string
          dados_pagamento?: string | null
          data_emissao?: string | null
          data_hora_pagamento?: string | null
          data_pagamento?: string | null
          data_vencimento?: string
          deleted_at?: string | null
          descricao?: string
          eh_recorrente?: boolean | null
          entidade_id?: string | null
          filial_id?: string | null
          forma_pagamento?: string | null
          fornecedor?: string
          funcionario_id?: string | null
          id?: string
          installment_norm?: string | null
          invoice_number_norm?: string | null
          is_duplicate?: boolean | null
          numero_documento?: string | null
          numero_nfe?: string | null
          numero_parcela?: number | null
          observacoes?: string | null
          recurring_occurrence_id?: string | null
          status?: string
          supplier_key?: string | null
          tipo_recorrencia?: string | null
          total_parcelas?: number | null
          updated_at?: string
          valor?: number
          valor_fixo?: boolean | null
          valor_pago?: number | null
          valor_total_titulo?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "ap_installments_conta_bancaria_id_fkey"
            columns: ["conta_bancaria_id"]
            isOneToOne: false
            referencedRelation: "contas_bancarias"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ap_installments_entidade_fkey"
            columns: ["entidade_id"]
            isOneToOne: false
            referencedRelation: "entidades_corporativas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ap_installments_entidade_fkey"
            columns: ["entidade_id"]
            isOneToOne: false
            referencedRelation: "vw_ap_titulos"
            referencedColumns: ["entidade_id"]
          },
          {
            foreignKeyName: "ap_installments_filial_id_fkey"
            columns: ["filial_id"]
            isOneToOne: false
            referencedRelation: "filiais"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ap_installments_funcionario_id_fkey"
            columns: ["funcionario_id"]
            isOneToOne: false
            referencedRelation: "funcionarios"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ap_installments_recurring_occurrence_id_fkey"
            columns: ["recurring_occurrence_id"]
            isOneToOne: false
            referencedRelation: "recurring_bill_occurrences"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ap_installments_recurring_occurrence_id_fkey"
            columns: ["recurring_occurrence_id"]
            isOneToOne: false
            referencedRelation: "recurring_events_next7"
            referencedColumns: ["occurrence_id"]
          },
        ]
      }
      arquivos_sistema: {
        Row: {
          created_at: string
          id: string
          mime_type: string
          nome_arquivo: string
          nome_original: string
          sha256_hash: string
          storage_path: string
          tamanho_bytes: number
          uploaded_by: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          mime_type: string
          nome_arquivo: string
          nome_original: string
          sha256_hash: string
          storage_path: string
          tamanho_bytes: number
          uploaded_by?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          mime_type?: string
          nome_arquivo?: string
          nome_original?: string
          sha256_hash?: string
          storage_path?: string
          tamanho_bytes?: number
          uploaded_by?: string | null
        }
        Relationships: []
      }
      backup_entidade_papeis_20250928: {
        Row: {
          ativo: boolean | null
          created_at: string | null
          data_fim: string | null
          data_inicio: string | null
          entidade_id: string | null
          id: string | null
          observacoes: string | null
          papel_id: string | null
          updated_at: string | null
        }
        Insert: {
          ativo?: boolean | null
          created_at?: string | null
          data_fim?: string | null
          data_inicio?: string | null
          entidade_id?: string | null
          id?: string | null
          observacoes?: string | null
          papel_id?: string | null
          updated_at?: string | null
        }
        Update: {
          ativo?: boolean | null
          created_at?: string | null
          data_fim?: string | null
          data_inicio?: string | null
          entidade_id?: string | null
          id?: string | null
          observacoes?: string | null
          papel_id?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      backup_entidades_20250928: {
        Row: {
          ativo: boolean | null
          cnpj_cpf: string | null
          created_at: string | null
          email: string | null
          id: string | null
          nome: string | null
          razao_social: string | null
          telefone: string | null
          tipo: string | null
          updated_at: string | null
        }
        Insert: {
          ativo?: boolean | null
          cnpj_cpf?: string | null
          created_at?: string | null
          email?: string | null
          id?: string | null
          nome?: string | null
          razao_social?: string | null
          telefone?: string | null
          tipo?: string | null
          updated_at?: string | null
        }
        Update: {
          ativo?: boolean | null
          cnpj_cpf?: string | null
          created_at?: string | null
          email?: string | null
          id?: string | null
          nome?: string | null
          razao_social?: string | null
          telefone?: string | null
          tipo?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      backup_fornecedores_20250928: {
        Row: {
          ativo: boolean | null
          cargo_id: string | null
          categoria_id: string | null
          categorias: Json | null
          chave_pix: string | null
          cnpj_cpf: string | null
          comissao_padrao: number | null
          comissao_supermeta: number | null
          contato_representante: string | null
          cpf: string | null
          cpf_cnpj_normalizado: string | null
          created_at: string | null
          data_admissao: string | null
          data_cadastro: string | null
          data_demissao: string | null
          data_fundacao: string | null
          data_nascimento: string | null
          dias_uteis_mes: number | null
          eh_fornecedor: boolean | null
          eh_funcionario: boolean | null
          eh_vendedora: boolean | null
          email: string | null
          email_normalizado: string | null
          email_representante: string | null
          endereco: string | null
          entidade_id: string | null
          estado_civil: string | null
          filial_id: string | null
          genero: string | null
          id: string | null
          inscricao_estadual: string | null
          meta_mensal: number | null
          nacionalidade: string | null
          nome: string | null
          nome_fantasia: string | null
          observacoes: string | null
          profissao: string | null
          representante_email: string | null
          representante_nome: string | null
          representante_telefone: string | null
          rg: string | null
          salario: number | null
          setor_id: string | null
          status_funcionario: string | null
          telefone: string | null
          telefone_representante: string | null
          tipo_chave_pix: string | null
          tipo_pessoa: string | null
          updated_at: string | null
          valor_transporte_dia: number | null
          valor_transporte_total: number | null
        }
        Insert: {
          ativo?: boolean | null
          cargo_id?: string | null
          categoria_id?: string | null
          categorias?: Json | null
          chave_pix?: string | null
          cnpj_cpf?: string | null
          comissao_padrao?: number | null
          comissao_supermeta?: number | null
          contato_representante?: string | null
          cpf?: string | null
          cpf_cnpj_normalizado?: string | null
          created_at?: string | null
          data_admissao?: string | null
          data_cadastro?: string | null
          data_demissao?: string | null
          data_fundacao?: string | null
          data_nascimento?: string | null
          dias_uteis_mes?: number | null
          eh_fornecedor?: boolean | null
          eh_funcionario?: boolean | null
          eh_vendedora?: boolean | null
          email?: string | null
          email_normalizado?: string | null
          email_representante?: string | null
          endereco?: string | null
          entidade_id?: string | null
          estado_civil?: string | null
          filial_id?: string | null
          genero?: string | null
          id?: string | null
          inscricao_estadual?: string | null
          meta_mensal?: number | null
          nacionalidade?: string | null
          nome?: string | null
          nome_fantasia?: string | null
          observacoes?: string | null
          profissao?: string | null
          representante_email?: string | null
          representante_nome?: string | null
          representante_telefone?: string | null
          rg?: string | null
          salario?: number | null
          setor_id?: string | null
          status_funcionario?: string | null
          telefone?: string | null
          telefone_representante?: string | null
          tipo_chave_pix?: string | null
          tipo_pessoa?: string | null
          updated_at?: string | null
          valor_transporte_dia?: number | null
          valor_transporte_total?: number | null
        }
        Update: {
          ativo?: boolean | null
          cargo_id?: string | null
          categoria_id?: string | null
          categorias?: Json | null
          chave_pix?: string | null
          cnpj_cpf?: string | null
          comissao_padrao?: number | null
          comissao_supermeta?: number | null
          contato_representante?: string | null
          cpf?: string | null
          cpf_cnpj_normalizado?: string | null
          created_at?: string | null
          data_admissao?: string | null
          data_cadastro?: string | null
          data_demissao?: string | null
          data_fundacao?: string | null
          data_nascimento?: string | null
          dias_uteis_mes?: number | null
          eh_fornecedor?: boolean | null
          eh_funcionario?: boolean | null
          eh_vendedora?: boolean | null
          email?: string | null
          email_normalizado?: string | null
          email_representante?: string | null
          endereco?: string | null
          entidade_id?: string | null
          estado_civil?: string | null
          filial_id?: string | null
          genero?: string | null
          id?: string | null
          inscricao_estadual?: string | null
          meta_mensal?: number | null
          nacionalidade?: string | null
          nome?: string | null
          nome_fantasia?: string | null
          observacoes?: string | null
          profissao?: string | null
          representante_email?: string | null
          representante_nome?: string | null
          representante_telefone?: string | null
          rg?: string | null
          salario?: number | null
          setor_id?: string | null
          status_funcionario?: string | null
          telefone?: string | null
          telefone_representante?: string | null
          tipo_chave_pix?: string | null
          tipo_pessoa?: string | null
          updated_at?: string | null
          valor_transporte_dia?: number | null
          valor_transporte_total?: number | null
        }
        Relationships: []
      }
      backup_papeis_20250928: {
        Row: {
          ativo: boolean | null
          created_at: string | null
          descricao: string | null
          id: string | null
          nome: string | null
          nome_norm: string | null
          papel_pai_id: string | null
          updated_at: string | null
        }
        Insert: {
          ativo?: boolean | null
          created_at?: string | null
          descricao?: string | null
          id?: string | null
          nome?: string | null
          nome_norm?: string | null
          papel_pai_id?: string | null
          updated_at?: string | null
        }
        Update: {
          ativo?: boolean | null
          created_at?: string | null
          descricao?: string | null
          id?: string | null
          nome?: string | null
          nome_norm?: string | null
          papel_pai_id?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      backup_papeis_pessoa_20250928: {
        Row: {
          ativo: boolean | null
          created_at: string | null
          entidade_id: string | null
          id: string | null
          papel_id: string | null
          pessoa_id: string | null
          updated_at: string | null
        }
        Insert: {
          ativo?: boolean | null
          created_at?: string | null
          entidade_id?: string | null
          id?: string | null
          papel_id?: string | null
          pessoa_id?: string | null
          updated_at?: string | null
        }
        Update: {
          ativo?: boolean | null
          created_at?: string | null
          entidade_id?: string | null
          id?: string | null
          papel_id?: string | null
          pessoa_id?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      backup_pessoas_20250928: {
        Row: {
          ativo: boolean | null
          cargo_id: string | null
          categorias: Json | null
          cnpj: string | null
          cpf: string | null
          cpf_cnpj_normalizado: string | null
          created_at: string | null
          dados_fornecedor: Json | null
          dados_funcionario: Json | null
          dados_vendedora: Json | null
          data_fundacao: string | null
          data_nascimento: string | null
          email: string | null
          email_normalizado: string | null
          endereco: string | null
          estado_civil: string | null
          filial_id: string | null
          genero: string | null
          id: string | null
          inscricao_estadual: string | null
          nacionalidade: string | null
          nome: string | null
          nome_fantasia: string | null
          observacoes: string | null
          profissao: string | null
          razao_social: string | null
          rg: string | null
          setor_id: string | null
          telefone: string | null
          tipo_pessoa: string | null
          updated_at: string | null
        }
        Insert: {
          ativo?: boolean | null
          cargo_id?: string | null
          categorias?: Json | null
          cnpj?: string | null
          cpf?: string | null
          cpf_cnpj_normalizado?: string | null
          created_at?: string | null
          dados_fornecedor?: Json | null
          dados_funcionario?: Json | null
          dados_vendedora?: Json | null
          data_fundacao?: string | null
          data_nascimento?: string | null
          email?: string | null
          email_normalizado?: string | null
          endereco?: string | null
          estado_civil?: string | null
          filial_id?: string | null
          genero?: string | null
          id?: string | null
          inscricao_estadual?: string | null
          nacionalidade?: string | null
          nome?: string | null
          nome_fantasia?: string | null
          observacoes?: string | null
          profissao?: string | null
          razao_social?: string | null
          rg?: string | null
          setor_id?: string | null
          telefone?: string | null
          tipo_pessoa?: string | null
          updated_at?: string | null
        }
        Update: {
          ativo?: boolean | null
          cargo_id?: string | null
          categorias?: Json | null
          cnpj?: string | null
          cpf?: string | null
          cpf_cnpj_normalizado?: string | null
          created_at?: string | null
          dados_fornecedor?: Json | null
          dados_funcionario?: Json | null
          dados_vendedora?: Json | null
          data_fundacao?: string | null
          data_nascimento?: string | null
          email?: string | null
          email_normalizado?: string | null
          endereco?: string | null
          estado_civil?: string | null
          filial_id?: string | null
          genero?: string | null
          id?: string | null
          inscricao_estadual?: string | null
          nacionalidade?: string | null
          nome?: string | null
          nome_fantasia?: string | null
          observacoes?: string | null
          profissao?: string | null
          razao_social?: string | null
          rg?: string | null
          setor_id?: string | null
          telefone?: string | null
          tipo_pessoa?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      backup_pessoas_completo_20250928: {
        Row: {
          ativo: boolean | null
          cnpj: string | null
          cpf: string | null
          cpf_cnpj_normalizado: string | null
          created_at: string | null
          dados_cliente: Json | null
          dados_fornecedor: Json | null
          dados_funcionario: Json | null
          dados_vendedor: Json | null
          data_fundacao: string | null
          data_nascimento: string | null
          email: string | null
          email_normalizado: string | null
          endereco: Json | null
          estado_civil: string | null
          filial_id: string | null
          genero: string | null
          id: string | null
          inscricao_estadual: string | null
          nacionalidade: string | null
          nome: string | null
          nome_fantasia: string | null
          nome_normalizado: string | null
          observacoes: string | null
          porte_empresa: string | null
          profissao: string | null
          ramo_atividade: string | null
          razao_social: string | null
          rg: string | null
          telefone: string | null
          tipo_pessoa: string | null
          updated_at: string | null
        }
        Insert: {
          ativo?: boolean | null
          cnpj?: string | null
          cpf?: string | null
          cpf_cnpj_normalizado?: string | null
          created_at?: string | null
          dados_cliente?: Json | null
          dados_fornecedor?: Json | null
          dados_funcionario?: Json | null
          dados_vendedor?: Json | null
          data_fundacao?: string | null
          data_nascimento?: string | null
          email?: string | null
          email_normalizado?: string | null
          endereco?: Json | null
          estado_civil?: string | null
          filial_id?: string | null
          genero?: string | null
          id?: string | null
          inscricao_estadual?: string | null
          nacionalidade?: string | null
          nome?: string | null
          nome_fantasia?: string | null
          nome_normalizado?: string | null
          observacoes?: string | null
          porte_empresa?: string | null
          profissao?: string | null
          ramo_atividade?: string | null
          razao_social?: string | null
          rg?: string | null
          telefone?: string | null
          tipo_pessoa?: string | null
          updated_at?: string | null
        }
        Update: {
          ativo?: boolean | null
          cnpj?: string | null
          cpf?: string | null
          cpf_cnpj_normalizado?: string | null
          created_at?: string | null
          dados_cliente?: Json | null
          dados_fornecedor?: Json | null
          dados_funcionario?: Json | null
          dados_vendedor?: Json | null
          data_fundacao?: string | null
          data_nascimento?: string | null
          email?: string | null
          email_normalizado?: string | null
          endereco?: Json | null
          estado_civil?: string | null
          filial_id?: string | null
          genero?: string | null
          id?: string | null
          inscricao_estadual?: string | null
          nacionalidade?: string | null
          nome?: string | null
          nome_fantasia?: string | null
          nome_normalizado?: string | null
          observacoes?: string | null
          porte_empresa?: string | null
          profissao?: string | null
          ramo_atividade?: string | null
          razao_social?: string | null
          rg?: string | null
          telefone?: string | null
          tipo_pessoa?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      categorias_produtos: {
        Row: {
          ativo: boolean
          created_at: string
          id: string
          nome: string
          updated_at: string
        }
        Insert: {
          ativo?: boolean
          created_at?: string
          id?: string
          nome: string
          updated_at?: string
        }
        Update: {
          ativo?: boolean
          created_at?: string
          id?: string
          nome?: string
          updated_at?: string
        }
        Relationships: []
      }
      config_vendas: {
        Row: {
          created_at: string
          dias_uteis_considerados: string | null
          id: string
          meta_loja_mensal: number | null
          observacoes: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          dias_uteis_considerados?: string | null
          id?: string
          meta_loja_mensal?: number | null
          observacoes?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          dias_uteis_considerados?: string | null
          id?: string
          meta_loja_mensal?: number | null
          observacoes?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      contas_a_pagar_demo: {
        Row: {
          categoria_id: string | null
          data_emissao: string | null
          data_vencimento: string | null
          descricao: string | null
          entidade_id: string | null
          id: string
          recurring_occurrence_id: string | null
          status: string | null
          valor: number | null
        }
        Insert: {
          categoria_id?: string | null
          data_emissao?: string | null
          data_vencimento?: string | null
          descricao?: string | null
          entidade_id?: string | null
          id?: string
          recurring_occurrence_id?: string | null
          status?: string | null
          valor?: number | null
        }
        Update: {
          categoria_id?: string | null
          data_emissao?: string | null
          data_vencimento?: string | null
          descricao?: string | null
          entidade_id?: string | null
          id?: string
          recurring_occurrence_id?: string | null
          status?: string | null
          valor?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "contas_a_pagar_demo_entidade_fkey"
            columns: ["entidade_id"]
            isOneToOne: false
            referencedRelation: "entidades_corporativas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contas_a_pagar_demo_entidade_fkey"
            columns: ["entidade_id"]
            isOneToOne: false
            referencedRelation: "vw_ap_titulos"
            referencedColumns: ["entidade_id"]
          },
        ]
      }
      contas_bancarias: {
        Row: {
          agencia: string | null
          ativo: boolean
          conta: string | null
          created_at: string
          filial_id: string | null
          id: string
          nome_banco: string
          observacoes: string | null
          saldo_atual: number
          tipo_conta: string | null
          updated_at: string
        }
        Insert: {
          agencia?: string | null
          ativo?: boolean
          conta?: string | null
          created_at?: string
          filial_id?: string | null
          id?: string
          nome_banco: string
          observacoes?: string | null
          saldo_atual?: number
          tipo_conta?: string | null
          updated_at?: string
        }
        Update: {
          agencia?: string | null
          ativo?: boolean
          conta?: string | null
          created_at?: string
          filial_id?: string | null
          id?: string
          nome_banco?: string
          observacoes?: string | null
          saldo_atual?: number
          tipo_conta?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "contas_bancarias_filial_id_fkey"
            columns: ["filial_id"]
            isOneToOne: false
            referencedRelation: "filiais"
            referencedColumns: ["id"]
          },
        ]
      }
      contas_pagar_corporativas: {
        Row: {
          categoria_id: string | null
          created_at: string
          created_by: string | null
          credor_id: string
          data_competencia: string | null
          data_emissao: string
          descricao: string
          documento_fiscal_id: string | null
          filial_id: string | null
          id: string
          numero_documento: string | null
          numero_nota: string | null
          observacoes: string | null
          origem: string | null
          status: string | null
          updated_at: string
          valor_total: number
        }
        Insert: {
          categoria_id?: string | null
          created_at?: string
          created_by?: string | null
          credor_id: string
          data_competencia?: string | null
          data_emissao: string
          descricao: string
          documento_fiscal_id?: string | null
          filial_id?: string | null
          id?: string
          numero_documento?: string | null
          numero_nota?: string | null
          observacoes?: string | null
          origem?: string | null
          status?: string | null
          updated_at?: string
          valor_total: number
        }
        Update: {
          categoria_id?: string | null
          created_at?: string
          created_by?: string | null
          credor_id?: string
          data_competencia?: string | null
          data_emissao?: string
          descricao?: string
          documento_fiscal_id?: string | null
          filial_id?: string | null
          id?: string
          numero_documento?: string | null
          numero_nota?: string | null
          observacoes?: string | null
          origem?: string | null
          status?: string | null
          updated_at?: string
          valor_total?: number
        }
        Relationships: [
          {
            foreignKeyName: "contas_pagar_corporativas_categoria_id_fkey"
            columns: ["categoria_id"]
            isOneToOne: false
            referencedRelation: "categorias_produtos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contas_pagar_corporativas_categoria_id_fkey"
            columns: ["categoria_id"]
            isOneToOne: false
            referencedRelation: "vw_dim_categorias"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contas_pagar_corporativas_credor_id_fkey"
            columns: ["credor_id"]
            isOneToOne: false
            referencedRelation: "entidades_corporativas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contas_pagar_corporativas_credor_id_fkey"
            columns: ["credor_id"]
            isOneToOne: false
            referencedRelation: "vw_ap_titulos"
            referencedColumns: ["entidade_id"]
          },
          {
            foreignKeyName: "contas_pagar_corporativas_documento_fiscal_id_fkey"
            columns: ["documento_fiscal_id"]
            isOneToOne: false
            referencedRelation: "documentos_fiscais"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contas_pagar_corporativas_filial_id_fkey"
            columns: ["filial_id"]
            isOneToOne: false
            referencedRelation: "filiais"
            referencedColumns: ["id"]
          },
        ]
      }
      contas_recorrentes: {
        Row: {
          ativo: boolean
          categoria_id: string | null
          created_at: string
          created_by: string | null
          credor_id: string
          dia_base: number
          filial_id: string | null
          id: string
          nome: string
          observacoes: string | null
          periodicidade: string
          proxima_geracao: string | null
          updated_at: string
          valor_padrao: number
        }
        Insert: {
          ativo?: boolean
          categoria_id?: string | null
          created_at?: string
          created_by?: string | null
          credor_id: string
          dia_base: number
          filial_id?: string | null
          id?: string
          nome: string
          observacoes?: string | null
          periodicidade: string
          proxima_geracao?: string | null
          updated_at?: string
          valor_padrao: number
        }
        Update: {
          ativo?: boolean
          categoria_id?: string | null
          created_at?: string
          created_by?: string | null
          credor_id?: string
          dia_base?: number
          filial_id?: string | null
          id?: string
          nome?: string
          observacoes?: string | null
          periodicidade?: string
          proxima_geracao?: string | null
          updated_at?: string
          valor_padrao?: number
        }
        Relationships: [
          {
            foreignKeyName: "contas_recorrentes_categoria_id_fkey"
            columns: ["categoria_id"]
            isOneToOne: false
            referencedRelation: "categorias_produtos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contas_recorrentes_categoria_id_fkey"
            columns: ["categoria_id"]
            isOneToOne: false
            referencedRelation: "vw_dim_categorias"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contas_recorrentes_credor_id_fkey"
            columns: ["credor_id"]
            isOneToOne: false
            referencedRelation: "entidades_corporativas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contas_recorrentes_credor_id_fkey"
            columns: ["credor_id"]
            isOneToOne: false
            referencedRelation: "vw_ap_titulos"
            referencedColumns: ["entidade_id"]
          },
          {
            foreignKeyName: "contas_recorrentes_filial_id_fkey"
            columns: ["filial_id"]
            isOneToOne: false
            referencedRelation: "filiais"
            referencedColumns: ["id"]
          },
        ]
      }
      contatos: {
        Row: {
          ativo: boolean
          created_at: string
          id: string
          pessoa_id: string
          principal: boolean | null
          tipo_contato: string
          updated_at: string
          valor: string
        }
        Insert: {
          ativo?: boolean
          created_at?: string
          id?: string
          pessoa_id: string
          principal?: boolean | null
          tipo_contato: string
          updated_at?: string
          valor: string
        }
        Update: {
          ativo?: boolean
          created_at?: string
          id?: string
          pessoa_id?: string
          principal?: boolean | null
          tipo_contato?: string
          updated_at?: string
          valor?: string
        }
        Relationships: []
      }
      documentos_fiscais: {
        Row: {
          arquivo_pdf_id: string | null
          arquivo_xml_id: string | null
          chave_nfe: string
          created_at: string
          created_by: string | null
          data_emissao: string
          data_entrada: string | null
          destinatario_id: string | null
          emitente_id: string
          id: string
          numero_documento: string
          observacoes: string | null
          serie: string
          situacao: string | null
          tipo_documento: string
          updated_at: string
          valor_cofins: number | null
          valor_icms: number | null
          valor_ipi: number | null
          valor_pis: number | null
          valor_total: number
        }
        Insert: {
          arquivo_pdf_id?: string | null
          arquivo_xml_id?: string | null
          chave_nfe: string
          created_at?: string
          created_by?: string | null
          data_emissao: string
          data_entrada?: string | null
          destinatario_id?: string | null
          emitente_id: string
          id?: string
          numero_documento: string
          observacoes?: string | null
          serie: string
          situacao?: string | null
          tipo_documento: string
          updated_at?: string
          valor_cofins?: number | null
          valor_icms?: number | null
          valor_ipi?: number | null
          valor_pis?: number | null
          valor_total: number
        }
        Update: {
          arquivo_pdf_id?: string | null
          arquivo_xml_id?: string | null
          chave_nfe?: string
          created_at?: string
          created_by?: string | null
          data_emissao?: string
          data_entrada?: string | null
          destinatario_id?: string | null
          emitente_id?: string
          id?: string
          numero_documento?: string
          observacoes?: string | null
          serie?: string
          situacao?: string | null
          tipo_documento?: string
          updated_at?: string
          valor_cofins?: number | null
          valor_icms?: number | null
          valor_ipi?: number | null
          valor_pis?: number | null
          valor_total?: number
        }
        Relationships: [
          {
            foreignKeyName: "documentos_fiscais_arquivo_pdf_id_fkey"
            columns: ["arquivo_pdf_id"]
            isOneToOne: false
            referencedRelation: "arquivos_sistema"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "documentos_fiscais_arquivo_xml_id_fkey"
            columns: ["arquivo_xml_id"]
            isOneToOne: false
            referencedRelation: "arquivos_sistema"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "documentos_fiscais_destinatario_id_fkey"
            columns: ["destinatario_id"]
            isOneToOne: false
            referencedRelation: "entidades_corporativas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "documentos_fiscais_destinatario_id_fkey"
            columns: ["destinatario_id"]
            isOneToOne: false
            referencedRelation: "vw_ap_titulos"
            referencedColumns: ["entidade_id"]
          },
          {
            foreignKeyName: "documentos_fiscais_emitente_id_fkey"
            columns: ["emitente_id"]
            isOneToOne: false
            referencedRelation: "entidades_corporativas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "documentos_fiscais_emitente_id_fkey"
            columns: ["emitente_id"]
            isOneToOne: false
            referencedRelation: "vw_ap_titulos"
            referencedColumns: ["entidade_id"]
          },
        ]
      }
      endereco_detalhado: {
        Row: {
          bairro: string | null
          cep: string | null
          cidade: string | null
          complemento: string | null
          created_at: string
          id: string
          logradouro: string | null
          numero: string | null
          pais: string | null
          uf: string | null
          updated_at: string
        }
        Insert: {
          bairro?: string | null
          cep?: string | null
          cidade?: string | null
          complemento?: string | null
          created_at?: string
          id?: string
          logradouro?: string | null
          numero?: string | null
          pais?: string | null
          uf?: string | null
          updated_at?: string
        }
        Update: {
          bairro?: string | null
          cep?: string | null
          cidade?: string | null
          complemento?: string | null
          created_at?: string
          id?: string
          logradouro?: string | null
          numero?: string | null
          pais?: string | null
          uf?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      enderecos: {
        Row: {
          ativo: boolean
          bairro: string | null
          cep: string | null
          cidade: string | null
          complemento: string | null
          created_at: string
          id: string
          logradouro: string | null
          numero: string | null
          pais: string | null
          pessoa_id: string
          tipo_endereco: string
          uf: string | null
          updated_at: string
        }
        Insert: {
          ativo?: boolean
          bairro?: string | null
          cep?: string | null
          cidade?: string | null
          complemento?: string | null
          created_at?: string
          id?: string
          logradouro?: string | null
          numero?: string | null
          pais?: string | null
          pessoa_id: string
          tipo_endereco?: string
          uf?: string | null
          updated_at?: string
        }
        Update: {
          ativo?: boolean
          bairro?: string | null
          cep?: string | null
          cidade?: string | null
          complemento?: string | null
          created_at?: string
          id?: string
          logradouro?: string | null
          numero?: string | null
          pais?: string | null
          pessoa_id?: string
          tipo_endereco?: string
          uf?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      entidade_aliases: {
        Row: {
          confidence: number
          created_at: string
          entidade_id: string
          id: string
          source_id: string
          source_system: string
          source_table: string
        }
        Insert: {
          confidence?: number
          created_at?: string
          entidade_id: string
          id?: string
          source_id: string
          source_system: string
          source_table: string
        }
        Update: {
          confidence?: number
          created_at?: string
          entidade_id?: string
          id?: string
          source_id?: string
          source_system?: string
          source_table?: string
        }
        Relationships: []
      }
      entidade_enderecos: {
        Row: {
          created_at: string
          endereco_id: string
          entidade_id: string
          id: string
          principal: boolean
          tipo: string
        }
        Insert: {
          created_at?: string
          endereco_id: string
          entidade_id: string
          id?: string
          principal?: boolean
          tipo: string
        }
        Update: {
          created_at?: string
          endereco_id?: string
          entidade_id?: string
          id?: string
          principal?: boolean
          tipo?: string
        }
        Relationships: [
          {
            foreignKeyName: "entidade_enderecos_endereco_id_fkey"
            columns: ["endereco_id"]
            isOneToOne: false
            referencedRelation: "endereco_detalhado"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "entidade_enderecos_entidade_id_fkey"
            columns: ["entidade_id"]
            isOneToOne: false
            referencedRelation: "entidades_corporativas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "entidade_enderecos_entidade_id_fkey"
            columns: ["entidade_id"]
            isOneToOne: false
            referencedRelation: "vw_ap_titulos"
            referencedColumns: ["entidade_id"]
          },
        ]
      }
      entidade_papeis: {
        Row: {
          ativo: boolean
          created_at: string
          data_fim: string | null
          data_inicio: string
          entidade_id: string
          id: string
          observacoes: string | null
          papel_id: string
          updated_at: string
        }
        Insert: {
          ativo?: boolean
          created_at?: string
          data_fim?: string | null
          data_inicio?: string
          entidade_id: string
          id?: string
          observacoes?: string | null
          papel_id: string
          updated_at?: string
        }
        Update: {
          ativo?: boolean
          created_at?: string
          data_fim?: string | null
          data_inicio?: string
          entidade_id?: string
          id?: string
          observacoes?: string | null
          papel_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "entidade_papeis_entidade_id_fkey"
            columns: ["entidade_id"]
            isOneToOne: false
            referencedRelation: "entidades_corporativas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "entidade_papeis_entidade_id_fkey"
            columns: ["entidade_id"]
            isOneToOne: false
            referencedRelation: "vw_ap_titulos"
            referencedColumns: ["entidade_id"]
          },
          {
            foreignKeyName: "entidade_papeis_papel_id_fkey"
            columns: ["papel_id"]
            isOneToOne: false
            referencedRelation: "papeis"
            referencedColumns: ["id"]
          },
        ]
      }
      entidades: {
        Row: {
          ativo: boolean
          cnpj_cpf: string | null
          created_at: string
          email: string | null
          id: string
          nome: string
          razao_social: string | null
          telefone: string | null
          tipo: string
          updated_at: string
        }
        Insert: {
          ativo?: boolean
          cnpj_cpf?: string | null
          created_at?: string
          email?: string | null
          id?: string
          nome: string
          razao_social?: string | null
          telefone?: string | null
          tipo: string
          updated_at?: string
        }
        Update: {
          ativo?: boolean
          cnpj_cpf?: string | null
          created_at?: string
          email?: string | null
          id?: string
          nome?: string
          razao_social?: string | null
          telefone?: string | null
          tipo?: string
          updated_at?: string
        }
        Relationships: []
      }
      entidades_corporativas: {
        Row: {
          ativo: boolean
          cpf_cnpj: string | null
          cpf_cnpj_normalizado: string | null
          created_at: string
          created_by: string | null
          data_fundacao: string | null
          data_nascimento: string | null
          email: string | null
          email_normalizado: string | null
          estado_civil: string | null
          genero: string | null
          id: string
          inscricao_estadual: string | null
          nacionalidade: string | null
          nome_fantasia: string | null
          nome_razao_social: string
          observacoes: string | null
          profissao: string | null
          rg: string | null
          telefone: string | null
          tipo_pessoa: string
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          ativo?: boolean
          cpf_cnpj?: string | null
          cpf_cnpj_normalizado?: string | null
          created_at?: string
          created_by?: string | null
          data_fundacao?: string | null
          data_nascimento?: string | null
          email?: string | null
          email_normalizado?: string | null
          estado_civil?: string | null
          genero?: string | null
          id?: string
          inscricao_estadual?: string | null
          nacionalidade?: string | null
          nome_fantasia?: string | null
          nome_razao_social: string
          observacoes?: string | null
          profissao?: string | null
          rg?: string | null
          telefone?: string | null
          tipo_pessoa: string
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          ativo?: boolean
          cpf_cnpj?: string | null
          cpf_cnpj_normalizado?: string | null
          created_at?: string
          created_by?: string | null
          data_fundacao?: string | null
          data_nascimento?: string | null
          email?: string | null
          email_normalizado?: string | null
          estado_civil?: string | null
          genero?: string | null
          id?: string
          inscricao_estadual?: string | null
          nacionalidade?: string | null
          nome_fantasia?: string | null
          nome_razao_social?: string
          observacoes?: string | null
          profissao?: string | null
          rg?: string | null
          telefone?: string | null
          tipo_pessoa?: string
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: []
      }
      filiais: {
        Row: {
          ativo: boolean
          cnpj: string
          created_at: string
          id: string
          nome: string
          updated_at: string
        }
        Insert: {
          ativo?: boolean
          cnpj: string
          created_at?: string
          id?: string
          nome: string
          updated_at?: string
        }
        Update: {
          ativo?: boolean
          cnpj?: string
          created_at?: string
          id?: string
          nome?: string
          updated_at?: string
        }
        Relationships: []
      }
      fornecedores: {
        Row: {
          ativo: boolean
          cargo_id: string | null
          categoria_id: string | null
          categorias: Json | null
          chave_pix: string | null
          cnpj_cpf: string | null
          comissao_padrao: number | null
          comissao_supermeta: number | null
          contato_representante: string | null
          cpf: string | null
          cpf_cnpj_normalizado: string | null
          created_at: string
          data_admissao: string | null
          data_cadastro: string | null
          data_demissao: string | null
          data_fundacao: string | null
          data_nascimento: string | null
          dias_uteis_mes: number | null
          eh_fornecedor: boolean | null
          eh_funcionario: boolean | null
          eh_vendedora: boolean | null
          email: string | null
          email_normalizado: string | null
          email_representante: string | null
          endereco: string | null
          entidade_id: string | null
          estado_civil: string | null
          filial_id: string | null
          genero: string | null
          id: string
          inscricao_estadual: string | null
          meta_mensal: number | null
          nacionalidade: string | null
          nome: string
          nome_fantasia: string | null
          observacoes: string | null
          profissao: string | null
          representante_email: string | null
          representante_nome: string | null
          representante_telefone: string | null
          rg: string | null
          salario: number | null
          setor_id: string | null
          status_funcionario: string | null
          telefone: string | null
          telefone_representante: string | null
          tipo_chave_pix: string | null
          tipo_pessoa: string | null
          updated_at: string
          valor_transporte_dia: number | null
          valor_transporte_total: number | null
        }
        Insert: {
          ativo?: boolean
          cargo_id?: string | null
          categoria_id?: string | null
          categorias?: Json | null
          chave_pix?: string | null
          cnpj_cpf?: string | null
          comissao_padrao?: number | null
          comissao_supermeta?: number | null
          contato_representante?: string | null
          cpf?: string | null
          cpf_cnpj_normalizado?: string | null
          created_at?: string
          data_admissao?: string | null
          data_cadastro?: string | null
          data_demissao?: string | null
          data_fundacao?: string | null
          data_nascimento?: string | null
          dias_uteis_mes?: number | null
          eh_fornecedor?: boolean | null
          eh_funcionario?: boolean | null
          eh_vendedora?: boolean | null
          email?: string | null
          email_normalizado?: string | null
          email_representante?: string | null
          endereco?: string | null
          entidade_id?: string | null
          estado_civil?: string | null
          filial_id?: string | null
          genero?: string | null
          id?: string
          inscricao_estadual?: string | null
          meta_mensal?: number | null
          nacionalidade?: string | null
          nome: string
          nome_fantasia?: string | null
          observacoes?: string | null
          profissao?: string | null
          representante_email?: string | null
          representante_nome?: string | null
          representante_telefone?: string | null
          rg?: string | null
          salario?: number | null
          setor_id?: string | null
          status_funcionario?: string | null
          telefone?: string | null
          telefone_representante?: string | null
          tipo_chave_pix?: string | null
          tipo_pessoa?: string | null
          updated_at?: string
          valor_transporte_dia?: number | null
          valor_transporte_total?: number | null
        }
        Update: {
          ativo?: boolean
          cargo_id?: string | null
          categoria_id?: string | null
          categorias?: Json | null
          chave_pix?: string | null
          cnpj_cpf?: string | null
          comissao_padrao?: number | null
          comissao_supermeta?: number | null
          contato_representante?: string | null
          cpf?: string | null
          cpf_cnpj_normalizado?: string | null
          created_at?: string
          data_admissao?: string | null
          data_cadastro?: string | null
          data_demissao?: string | null
          data_fundacao?: string | null
          data_nascimento?: string | null
          dias_uteis_mes?: number | null
          eh_fornecedor?: boolean | null
          eh_funcionario?: boolean | null
          eh_vendedora?: boolean | null
          email?: string | null
          email_normalizado?: string | null
          email_representante?: string | null
          endereco?: string | null
          entidade_id?: string | null
          estado_civil?: string | null
          filial_id?: string | null
          genero?: string | null
          id?: string
          inscricao_estadual?: string | null
          meta_mensal?: number | null
          nacionalidade?: string | null
          nome?: string
          nome_fantasia?: string | null
          observacoes?: string | null
          profissao?: string | null
          representante_email?: string | null
          representante_nome?: string | null
          representante_telefone?: string | null
          rg?: string | null
          salario?: number | null
          setor_id?: string | null
          status_funcionario?: string | null
          telefone?: string | null
          telefone_representante?: string | null
          tipo_chave_pix?: string | null
          tipo_pessoa?: string | null
          updated_at?: string
          valor_transporte_dia?: number | null
          valor_transporte_total?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "fornecedores_categoria_id_fkey"
            columns: ["categoria_id"]
            isOneToOne: false
            referencedRelation: "categorias_produtos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fornecedores_categoria_id_fkey"
            columns: ["categoria_id"]
            isOneToOne: false
            referencedRelation: "vw_dim_categorias"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fornecedores_filial_id_fkey"
            columns: ["filial_id"]
            isOneToOne: false
            referencedRelation: "filiais"
            referencedColumns: ["id"]
          },
        ]
      }
      funcionarios: {
        Row: {
          ativo: boolean
          cargo: string | null
          chave_pix: string | null
          cpf: string | null
          created_at: string
          data_admissao: string | null
          dias_uteis_mes: number
          email: string | null
          endereco: string | null
          id: string
          nome: string
          salario: number
          setor: string | null
          status_funcionario: string | null
          telefone: string | null
          tipo_chave_pix: string | null
          updated_at: string
          valor_transporte_dia: number
          valor_transporte_total: number
        }
        Insert: {
          ativo?: boolean
          cargo?: string | null
          chave_pix?: string | null
          cpf?: string | null
          created_at?: string
          data_admissao?: string | null
          dias_uteis_mes?: number
          email?: string | null
          endereco?: string | null
          id?: string
          nome: string
          salario?: number
          setor?: string | null
          status_funcionario?: string | null
          telefone?: string | null
          tipo_chave_pix?: string | null
          updated_at?: string
          valor_transporte_dia?: number
          valor_transporte_total?: number
        }
        Update: {
          ativo?: boolean
          cargo?: string | null
          chave_pix?: string | null
          cpf?: string | null
          created_at?: string
          data_admissao?: string | null
          dias_uteis_mes?: number
          email?: string | null
          endereco?: string | null
          id?: string
          nome?: string
          salario?: number
          setor?: string | null
          status_funcionario?: string | null
          telefone?: string | null
          tipo_chave_pix?: string | null
          updated_at?: string
          valor_transporte_dia?: number
          valor_transporte_total?: number
        }
        Relationships: []
      }
      funcionarios_detalhes: {
        Row: {
          cargo_id: string | null
          chave_pix: string | null
          created_at: string
          data_admissao: string | null
          data_demissao: string | null
          dias_uteis_mes: number | null
          entidade_id: string
          filial_id: string | null
          id: string
          salario_base: number | null
          setor_id: string | null
          status_funcionario: string | null
          tipo_chave_pix: string | null
          updated_at: string
          valor_transporte_dia: number | null
          valor_transporte_total: number | null
        }
        Insert: {
          cargo_id?: string | null
          chave_pix?: string | null
          created_at?: string
          data_admissao?: string | null
          data_demissao?: string | null
          dias_uteis_mes?: number | null
          entidade_id: string
          filial_id?: string | null
          id: string
          salario_base?: number | null
          setor_id?: string | null
          status_funcionario?: string | null
          tipo_chave_pix?: string | null
          updated_at?: string
          valor_transporte_dia?: number | null
          valor_transporte_total?: number | null
        }
        Update: {
          cargo_id?: string | null
          chave_pix?: string | null
          created_at?: string
          data_admissao?: string | null
          data_demissao?: string | null
          dias_uteis_mes?: number | null
          entidade_id?: string
          filial_id?: string | null
          id?: string
          salario_base?: number | null
          setor_id?: string | null
          status_funcionario?: string | null
          tipo_chave_pix?: string | null
          updated_at?: string
          valor_transporte_dia?: number | null
          valor_transporte_total?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "funcionarios_detalhes_cargo_id_fkey"
            columns: ["cargo_id"]
            isOneToOne: false
            referencedRelation: "hr_cargos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "funcionarios_detalhes_entidade_id_fkey"
            columns: ["entidade_id"]
            isOneToOne: false
            referencedRelation: "entidades_corporativas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "funcionarios_detalhes_entidade_id_fkey"
            columns: ["entidade_id"]
            isOneToOne: false
            referencedRelation: "vw_ap_titulos"
            referencedColumns: ["entidade_id"]
          },
          {
            foreignKeyName: "funcionarios_detalhes_filial_id_fkey"
            columns: ["filial_id"]
            isOneToOne: false
            referencedRelation: "filiais"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "funcionarios_detalhes_setor_id_fkey"
            columns: ["setor_id"]
            isOneToOne: false
            referencedRelation: "hr_setores"
            referencedColumns: ["id"]
          },
        ]
      }
      hr_cargos: {
        Row: {
          ativo: boolean | null
          created_at: string | null
          descricao: string | null
          id: string
          nome: string
          salario_base_sugerido: number | null
          setor_id: string | null
          updated_at: string | null
        }
        Insert: {
          ativo?: boolean | null
          created_at?: string | null
          descricao?: string | null
          id?: string
          nome: string
          salario_base_sugerido?: number | null
          setor_id?: string | null
          updated_at?: string | null
        }
        Update: {
          ativo?: boolean | null
          created_at?: string | null
          descricao?: string | null
          id?: string
          nome?: string
          salario_base_sugerido?: number | null
          setor_id?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "hr_cargos_setor_id_fkey"
            columns: ["setor_id"]
            isOneToOne: false
            referencedRelation: "hr_setores"
            referencedColumns: ["id"]
          },
        ]
      }
      hr_contracts: {
        Row: {
          ativo: boolean | null
          carga_horaria_semanal: number | null
          comissao_habilitada: boolean | null
          created_at: string | null
          data_fim: string | null
          data_inicio: string
          funcionario_id: string
          id: string
          percentual_comissao: number | null
          salario_base: number
          tipo_contrato: string
          updated_at: string | null
          vale_transporte_habilitado: boolean | null
        }
        Insert: {
          ativo?: boolean | null
          carga_horaria_semanal?: number | null
          comissao_habilitada?: boolean | null
          created_at?: string | null
          data_fim?: string | null
          data_inicio: string
          funcionario_id: string
          id?: string
          percentual_comissao?: number | null
          salario_base?: number
          tipo_contrato?: string
          updated_at?: string | null
          vale_transporte_habilitado?: boolean | null
        }
        Update: {
          ativo?: boolean | null
          carga_horaria_semanal?: number | null
          comissao_habilitada?: boolean | null
          created_at?: string | null
          data_fim?: string | null
          data_inicio?: string
          funcionario_id?: string
          id?: string
          percentual_comissao?: number | null
          salario_base?: number
          tipo_contrato?: string
          updated_at?: string | null
          vale_transporte_habilitado?: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: "hr_contracts_funcionario_id_fkey"
            columns: ["funcionario_id"]
            isOneToOne: false
            referencedRelation: "funcionarios"
            referencedColumns: ["id"]
          },
        ]
      }
      hr_earnings_deductions: {
        Row: {
          base_calculo: number | null
          codigo: string
          created_at: string | null
          descricao: string
          id: string
          observacoes: string | null
          payslip_id: string
          percentual: number | null
          tipo: string
          valor: number
        }
        Insert: {
          base_calculo?: number | null
          codigo: string
          created_at?: string | null
          descricao: string
          id?: string
          observacoes?: string | null
          payslip_id: string
          percentual?: number | null
          tipo: string
          valor: number
        }
        Update: {
          base_calculo?: number | null
          codigo?: string
          created_at?: string | null
          descricao?: string
          id?: string
          observacoes?: string | null
          payslip_id?: string
          percentual?: number | null
          tipo?: string
          valor?: number
        }
        Relationships: [
          {
            foreignKeyName: "hr_earnings_deductions_payslip_id_fkey"
            columns: ["payslip_id"]
            isOneToOne: false
            referencedRelation: "hr_payslips"
            referencedColumns: ["id"]
          },
        ]
      }
      hr_payroll_runs: {
        Row: {
          ano: number
          created_at: string | null
          created_by: string | null
          data_competencia: string
          data_fechamento: string | null
          data_processamento: string | null
          descricao: string | null
          id: string
          mes: number
          observacoes: string | null
          status: string
          tipo_folha: string
          total_descontos: number | null
          total_liquido: number | null
          total_proventos: number | null
          updated_at: string | null
        }
        Insert: {
          ano: number
          created_at?: string | null
          created_by?: string | null
          data_competencia: string
          data_fechamento?: string | null
          data_processamento?: string | null
          descricao?: string | null
          id?: string
          mes: number
          observacoes?: string | null
          status?: string
          tipo_folha?: string
          total_descontos?: number | null
          total_liquido?: number | null
          total_proventos?: number | null
          updated_at?: string | null
        }
        Update: {
          ano?: number
          created_at?: string | null
          created_by?: string | null
          data_competencia?: string
          data_fechamento?: string | null
          data_processamento?: string | null
          descricao?: string | null
          id?: string
          mes?: number
          observacoes?: string | null
          status?: string
          tipo_folha?: string
          total_descontos?: number | null
          total_liquido?: number | null
          total_proventos?: number | null
          updated_at?: string | null
        }
        Relationships: []
      }
      hr_payslips: {
        Row: {
          abono_pecuniario: boolean | null
          adiantamento: number | null
          adicional_noturno: number | null
          base_calculo_13: number | null
          cargo: string | null
          comissao_vendas: number | null
          contract_id: string
          created_at: string | null
          deleted_at: string | null
          dias_faltas: number | null
          dias_ferias: number | null
          dias_trabalhados: number | null
          fgts: number | null
          funcionario_id: string
          funcionario_nome: string
          horas_extras: number | null
          horas_extras_valor: number | null
          id: string
          inss: number | null
          irrf: number | null
          observacoes: string | null
          outros_descontos: number | null
          outros_proventos: number | null
          parcela_13_numero: number | null
          parcela_13_total: number | null
          payroll_run_id: string
          periodo_ferias_fim: string | null
          periodo_ferias_inicio: string | null
          salario_base: number
          salario_liquido: number | null
          salario_mensal: number | null
          setor: string | null
          terco_ferias: number | null
          total_descontos: number | null
          total_proventos: number | null
          updated_at: string | null
          vale_transporte: number | null
        }
        Insert: {
          abono_pecuniario?: boolean | null
          adiantamento?: number | null
          adicional_noturno?: number | null
          base_calculo_13?: number | null
          cargo?: string | null
          comissao_vendas?: number | null
          contract_id: string
          created_at?: string | null
          deleted_at?: string | null
          dias_faltas?: number | null
          dias_ferias?: number | null
          dias_trabalhados?: number | null
          fgts?: number | null
          funcionario_id: string
          funcionario_nome: string
          horas_extras?: number | null
          horas_extras_valor?: number | null
          id?: string
          inss?: number | null
          irrf?: number | null
          observacoes?: string | null
          outros_descontos?: number | null
          outros_proventos?: number | null
          parcela_13_numero?: number | null
          parcela_13_total?: number | null
          payroll_run_id: string
          periodo_ferias_fim?: string | null
          periodo_ferias_inicio?: string | null
          salario_base: number
          salario_liquido?: number | null
          salario_mensal?: number | null
          setor?: string | null
          terco_ferias?: number | null
          total_descontos?: number | null
          total_proventos?: number | null
          updated_at?: string | null
          vale_transporte?: number | null
        }
        Update: {
          abono_pecuniario?: boolean | null
          adiantamento?: number | null
          adicional_noturno?: number | null
          base_calculo_13?: number | null
          cargo?: string | null
          comissao_vendas?: number | null
          contract_id?: string
          created_at?: string | null
          deleted_at?: string | null
          dias_faltas?: number | null
          dias_ferias?: number | null
          dias_trabalhados?: number | null
          fgts?: number | null
          funcionario_id?: string
          funcionario_nome?: string
          horas_extras?: number | null
          horas_extras_valor?: number | null
          id?: string
          inss?: number | null
          irrf?: number | null
          observacoes?: string | null
          outros_descontos?: number | null
          outros_proventos?: number | null
          parcela_13_numero?: number | null
          parcela_13_total?: number | null
          payroll_run_id?: string
          periodo_ferias_fim?: string | null
          periodo_ferias_inicio?: string | null
          salario_base?: number
          salario_liquido?: number | null
          salario_mensal?: number | null
          setor?: string | null
          terco_ferias?: number | null
          total_descontos?: number | null
          total_proventos?: number | null
          updated_at?: string | null
          vale_transporte?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "hr_payslips_contract_id_fkey"
            columns: ["contract_id"]
            isOneToOne: false
            referencedRelation: "hr_contracts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "hr_payslips_funcionario_id_fkey"
            columns: ["funcionario_id"]
            isOneToOne: false
            referencedRelation: "funcionarios"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "hr_payslips_payroll_run_id_fkey"
            columns: ["payroll_run_id"]
            isOneToOne: false
            referencedRelation: "hr_payroll_runs"
            referencedColumns: ["id"]
          },
        ]
      }
      hr_setores: {
        Row: {
          ativo: boolean | null
          created_at: string | null
          descricao: string | null
          id: string
          nome: string
          responsavel_id: string | null
          updated_at: string | null
        }
        Insert: {
          ativo?: boolean | null
          created_at?: string | null
          descricao?: string | null
          id?: string
          nome: string
          responsavel_id?: string | null
          updated_at?: string | null
        }
        Update: {
          ativo?: boolean | null
          created_at?: string | null
          descricao?: string | null
          id?: string
          nome?: string
          responsavel_id?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "hr_setores_responsavel_id_fkey"
            columns: ["responsavel_id"]
            isOneToOne: false
            referencedRelation: "funcionarios"
            referencedColumns: ["id"]
          },
        ]
      }
      itens_venda: {
        Row: {
          created_at: string
          desconto_unitario: number | null
          descricao: string
          id: string
          marca_id: string | null
          observacoes: string | null
          preco_unitario: number
          produto_id: string | null
          quantidade: number
          sku: string | null
          valor_total: number
          venda_id: string
        }
        Insert: {
          created_at?: string
          desconto_unitario?: number | null
          descricao: string
          id?: string
          marca_id?: string | null
          observacoes?: string | null
          preco_unitario: number
          produto_id?: string | null
          quantidade?: number
          sku?: string | null
          valor_total: number
          venda_id: string
        }
        Update: {
          created_at?: string
          desconto_unitario?: number | null
          descricao?: string
          id?: string
          marca_id?: string | null
          observacoes?: string | null
          preco_unitario?: number
          produto_id?: string | null
          quantidade?: number
          sku?: string | null
          valor_total?: number
          venda_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "itens_venda_marca_id_fkey"
            columns: ["marca_id"]
            isOneToOne: false
            referencedRelation: "marcas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "itens_venda_produto_id_fkey"
            columns: ["produto_id"]
            isOneToOne: false
            referencedRelation: "produtos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "itens_venda_venda_id_fkey"
            columns: ["venda_id"]
            isOneToOne: false
            referencedRelation: "vendas_corporativas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "itens_venda_venda_id_fkey"
            columns: ["venda_id"]
            isOneToOne: false
            referencedRelation: "vw_fato_vendas"
            referencedColumns: ["id_venda"]
          },
        ]
      }
      label_templates: {
        Row: {
          created_at: string | null
          id: string
          name: string
          template_data: Json
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          name: string
          template_data: Json
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          name?: string
          template_data?: Json
          user_id?: string
        }
        Relationships: []
      }
      marcas: {
        Row: {
          ativo: boolean
          created_at: string
          entidade_id: string | null
          id: string
          nome: string
          updated_at: string
        }
        Insert: {
          ativo?: boolean
          created_at?: string
          entidade_id?: string | null
          id?: string
          nome: string
          updated_at?: string
        }
        Update: {
          ativo?: boolean
          created_at?: string
          entidade_id?: string | null
          id?: string
          nome?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "marcas_entidade_fkey"
            columns: ["entidade_id"]
            isOneToOne: false
            referencedRelation: "entidades_corporativas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "marcas_entidade_fkey"
            columns: ["entidade_id"]
            isOneToOne: false
            referencedRelation: "vw_ap_titulos"
            referencedColumns: ["entidade_id"]
          },
        ]
      }
      meios_pagamento_vendas: {
        Row: {
          ativo: boolean
          created_at: string
          id: string
          nome: string
        }
        Insert: {
          ativo?: boolean
          created_at?: string
          id?: string
          nome: string
        }
        Update: {
          ativo?: boolean
          created_at?: string
          id?: string
          nome?: string
        }
        Relationships: []
      }
      messages: {
        Row: {
          content: string
          created_at: string | null
          id: number
          role: string
          user_id: string | null
        }
        Insert: {
          content: string
          created_at?: string | null
          id?: never
          role: string
          user_id?: string | null
        }
        Update: {
          content?: string
          created_at?: string | null
          id?: never
          role?: string
          user_id?: string | null
        }
        Relationships: []
      }
      metas_mensais: {
        Row: {
          ano: number
          comissao_calculada: number | null
          created_at: string
          id: string
          mes: number
          meta_valor: number
          supermeta_valor: number | null
          updated_at: string
          vendas_realizadas: number | null
          vendedora_id: string
        }
        Insert: {
          ano: number
          comissao_calculada?: number | null
          created_at?: string
          id?: string
          mes: number
          meta_valor: number
          supermeta_valor?: number | null
          updated_at?: string
          vendas_realizadas?: number | null
          vendedora_id: string
        }
        Update: {
          ano?: number
          comissao_calculada?: number | null
          created_at?: string
          id?: string
          mes?: number
          meta_valor?: number
          supermeta_valor?: number | null
          updated_at?: string
          vendas_realizadas?: number | null
          vendedora_id?: string
        }
        Relationships: []
      }
      nfe_data: {
        Row: {
          chave_acesso: string
          cnpj_destinatario: string | null
          cnpj_emitente: string
          created_at: string
          data_emissao: string
          id: string
          nome_destinatario: string | null
          nome_emitente: string
          numero_nfe: string
          serie: string
          updated_at: string
          valor_cofins: number | null
          valor_icms: number | null
          valor_ipi: number | null
          valor_pis: number | null
          valor_total: number
          xml_content: string
        }
        Insert: {
          chave_acesso: string
          cnpj_destinatario?: string | null
          cnpj_emitente: string
          created_at?: string
          data_emissao: string
          id?: string
          nome_destinatario?: string | null
          nome_emitente: string
          numero_nfe: string
          serie: string
          updated_at?: string
          valor_cofins?: number | null
          valor_icms?: number | null
          valor_ipi?: number | null
          valor_pis?: number | null
          valor_total: number
          xml_content: string
        }
        Update: {
          chave_acesso?: string
          cnpj_destinatario?: string | null
          cnpj_emitente?: string
          created_at?: string
          data_emissao?: string
          id?: string
          nome_destinatario?: string | null
          nome_emitente?: string
          numero_nfe?: string
          serie?: string
          updated_at?: string
          valor_cofins?: number | null
          valor_icms?: number | null
          valor_ipi?: number | null
          valor_pis?: number | null
          valor_total?: number
          xml_content?: string
        }
        Relationships: []
      }
      papeis: {
        Row: {
          ativo: boolean
          created_at: string
          descricao: string | null
          id: string
          nome: string
          nome_norm: string | null
          papel_pai_id: string | null
          updated_at: string
        }
        Insert: {
          ativo?: boolean
          created_at?: string
          descricao?: string | null
          id?: string
          nome: string
          nome_norm?: string | null
          papel_pai_id?: string | null
          updated_at?: string
        }
        Update: {
          ativo?: boolean
          created_at?: string
          descricao?: string | null
          id?: string
          nome?: string
          nome_norm?: string | null
          papel_pai_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "papeis_papel_pai_id_fkey"
            columns: ["papel_pai_id"]
            isOneToOne: false
            referencedRelation: "papeis"
            referencedColumns: ["id"]
          },
        ]
      }
      papeis_pessoa: {
        Row: {
          ativo: boolean
          created_at: string
          entidade_id: string | null
          id: string
          papel_id: string
          pessoa_id: string
          updated_at: string
        }
        Insert: {
          ativo?: boolean
          created_at?: string
          entidade_id?: string | null
          id?: string
          papel_id: string
          pessoa_id: string
          updated_at?: string
        }
        Update: {
          ativo?: boolean
          created_at?: string
          entidade_id?: string | null
          id?: string
          papel_id?: string
          pessoa_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "papeis_pessoa_entidade_id_fkey"
            columns: ["entidade_id"]
            isOneToOne: false
            referencedRelation: "entidades"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "papeis_pessoa_papel_id_fkey"
            columns: ["papel_id"]
            isOneToOne: false
            referencedRelation: "papeis"
            referencedColumns: ["id"]
          },
        ]
      }
      parcelas_conta_pagar: {
        Row: {
          comprovante_id: string | null
          comprovante_path: string | null
          conta_bancaria_id: string | null
          conta_pagar_id: string
          created_at: string
          data_pagamento: string | null
          data_vencimento: string
          desconto: number | null
          forma_pagamento: string | null
          id: string
          juros: number | null
          meio_pagamento: string | null
          multa: number | null
          numero_parcela: number
          observacoes: string | null
          status: string | null
          total_parcelas: number | null
          updated_at: string
          valor_pago: number | null
          valor_parcela: number
        }
        Insert: {
          comprovante_id?: string | null
          comprovante_path?: string | null
          conta_bancaria_id?: string | null
          conta_pagar_id: string
          created_at?: string
          data_pagamento?: string | null
          data_vencimento: string
          desconto?: number | null
          forma_pagamento?: string | null
          id?: string
          juros?: number | null
          meio_pagamento?: string | null
          multa?: number | null
          numero_parcela: number
          observacoes?: string | null
          status?: string | null
          total_parcelas?: number | null
          updated_at?: string
          valor_pago?: number | null
          valor_parcela: number
        }
        Update: {
          comprovante_id?: string | null
          comprovante_path?: string | null
          conta_bancaria_id?: string | null
          conta_pagar_id?: string
          created_at?: string
          data_pagamento?: string | null
          data_vencimento?: string
          desconto?: number | null
          forma_pagamento?: string | null
          id?: string
          juros?: number | null
          meio_pagamento?: string | null
          multa?: number | null
          numero_parcela?: number
          observacoes?: string | null
          status?: string | null
          total_parcelas?: number | null
          updated_at?: string
          valor_pago?: number | null
          valor_parcela?: number
        }
        Relationships: [
          {
            foreignKeyName: "parcelas_conta_pagar_comprovante_id_fkey"
            columns: ["comprovante_id"]
            isOneToOne: false
            referencedRelation: "arquivos_sistema"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "parcelas_conta_pagar_conta_bancaria_id_fkey"
            columns: ["conta_bancaria_id"]
            isOneToOne: false
            referencedRelation: "contas_bancarias"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "parcelas_conta_pagar_conta_pagar_id_fkey"
            columns: ["conta_pagar_id"]
            isOneToOne: false
            referencedRelation: "contas_pagar_corporativas"
            referencedColumns: ["id"]
          },
        ]
      }
      pedidos_produtos: {
        Row: {
          arquivo_origem: string | null
          codigo_barras: string | null
          cor: string | null
          created_at: string
          custo_unitario: number
          data_pedido: string | null
          desconto_porcentagem: number | null
          desconto_valor: number | null
          descricao: string | null
          id: string
          marca_id: string | null
          numero_pedido: string | null
          observacoes: string | null
          pessoas: string
          produto_id: string | null
          quantidade: number
          quantidade_referencias: number | null
          referencia: string
          representante_email: string | null
          representante_nome: string | null
          representante_telefone: string | null
          status: string
          tamanho: string | null
          tipo_desconto: string | null
          updated_at: string
          valor_medio_peca: number | null
          valor_total_bruto: number | null
          valor_total_liquido: number | null
        }
        Insert: {
          arquivo_origem?: string | null
          codigo_barras?: string | null
          cor?: string | null
          created_at?: string
          custo_unitario?: number
          data_pedido?: string | null
          desconto_porcentagem?: number | null
          desconto_valor?: number | null
          descricao?: string | null
          id?: string
          marca_id?: string | null
          numero_pedido?: string | null
          observacoes?: string | null
          pessoas: string
          produto_id?: string | null
          quantidade?: number
          quantidade_referencias?: number | null
          referencia: string
          representante_email?: string | null
          representante_nome?: string | null
          representante_telefone?: string | null
          status?: string
          tamanho?: string | null
          tipo_desconto?: string | null
          updated_at?: string
          valor_medio_peca?: number | null
          valor_total_bruto?: number | null
          valor_total_liquido?: number | null
        }
        Update: {
          arquivo_origem?: string | null
          codigo_barras?: string | null
          cor?: string | null
          created_at?: string
          custo_unitario?: number
          data_pedido?: string | null
          desconto_porcentagem?: number | null
          desconto_valor?: number | null
          descricao?: string | null
          id?: string
          marca_id?: string | null
          numero_pedido?: string | null
          observacoes?: string | null
          pessoas?: string
          produto_id?: string | null
          quantidade?: number
          quantidade_referencias?: number | null
          referencia?: string
          representante_email?: string | null
          representante_nome?: string | null
          representante_telefone?: string | null
          status?: string
          tamanho?: string | null
          tipo_desconto?: string | null
          updated_at?: string
          valor_medio_peca?: number | null
          valor_total_bruto?: number | null
          valor_total_liquido?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "pedidos_produtos_entidade_fkey"
            columns: ["pessoas"]
            isOneToOne: false
            referencedRelation: "entidades_corporativas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pedidos_produtos_entidade_fkey"
            columns: ["pessoas"]
            isOneToOne: false
            referencedRelation: "vw_ap_titulos"
            referencedColumns: ["entidade_id"]
          },
          {
            foreignKeyName: "pedidos_produtos_marca_id_fkey"
            columns: ["marca_id"]
            isOneToOne: false
            referencedRelation: "marcas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pedidos_produtos_produto_id_fkey"
            columns: ["produto_id"]
            isOneToOne: false
            referencedRelation: "produtos"
            referencedColumns: ["id"]
          },
        ]
      }
      pessoa_papeis: {
        Row: {
          ativo: boolean
          configuracao: Json | null
          created_at: string
          data_fim: string | null
          data_inicio: string
          id: string
          observacoes: string | null
          papel_id: string
          pessoa_id: string
          updated_at: string
        }
        Insert: {
          ativo?: boolean
          configuracao?: Json | null
          created_at?: string
          data_fim?: string | null
          data_inicio?: string
          id?: string
          observacoes?: string | null
          papel_id: string
          pessoa_id: string
          updated_at?: string
        }
        Update: {
          ativo?: boolean
          configuracao?: Json | null
          created_at?: string
          data_fim?: string | null
          data_inicio?: string
          id?: string
          observacoes?: string | null
          papel_id?: string
          pessoa_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "pessoa_papeis_papel_id_fkey"
            columns: ["papel_id"]
            isOneToOne: false
            referencedRelation: "papeis"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pessoa_papeis_pessoa_id_fkey"
            columns: ["pessoa_id"]
            isOneToOne: false
            referencedRelation: "pessoas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pessoa_papeis_pessoa_id_fkey"
            columns: ["pessoa_id"]
            isOneToOne: false
            referencedRelation: "vw_pessoas_com_papeis"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pessoa_papeis_pessoa_id_fkey"
            columns: ["pessoa_id"]
            isOneToOne: false
            referencedRelation: "vw_vendedores"
            referencedColumns: ["id"]
          },
        ]
      }
      pessoas: {
        Row: {
          ativo: boolean
          cnpj: string | null
          cpf: string | null
          cpf_cnpj_normalizado: string | null
          created_at: string
          dados_cliente: Json | null
          dados_fornecedor: Json | null
          dados_funcionario: Json | null
          dados_vendedor: Json | null
          data_fundacao: string | null
          data_nascimento: string | null
          email: string | null
          email_normalizado: string | null
          endereco: Json | null
          estado_civil: string | null
          filial_id: string | null
          genero: string | null
          id: string
          inscricao_estadual: string | null
          nacionalidade: string | null
          nome: string
          nome_fantasia: string | null
          nome_normalizado: string | null
          observacoes: string | null
          porte_empresa: string | null
          profissao: string | null
          ramo_atividade: string | null
          razao_social: string | null
          rg: string | null
          telefone: string | null
          tipo_pessoa: string
          updated_at: string
        }
        Insert: {
          ativo?: boolean
          cnpj?: string | null
          cpf?: string | null
          cpf_cnpj_normalizado?: string | null
          created_at?: string
          dados_cliente?: Json | null
          dados_fornecedor?: Json | null
          dados_funcionario?: Json | null
          dados_vendedor?: Json | null
          data_fundacao?: string | null
          data_nascimento?: string | null
          email?: string | null
          email_normalizado?: string | null
          endereco?: Json | null
          estado_civil?: string | null
          filial_id?: string | null
          genero?: string | null
          id?: string
          inscricao_estadual?: string | null
          nacionalidade?: string | null
          nome: string
          nome_fantasia?: string | null
          nome_normalizado?: string | null
          observacoes?: string | null
          porte_empresa?: string | null
          profissao?: string | null
          ramo_atividade?: string | null
          razao_social?: string | null
          rg?: string | null
          telefone?: string | null
          tipo_pessoa: string
          updated_at?: string
        }
        Update: {
          ativo?: boolean
          cnpj?: string | null
          cpf?: string | null
          cpf_cnpj_normalizado?: string | null
          created_at?: string
          dados_cliente?: Json | null
          dados_fornecedor?: Json | null
          dados_funcionario?: Json | null
          dados_vendedor?: Json | null
          data_fundacao?: string | null
          data_nascimento?: string | null
          email?: string | null
          email_normalizado?: string | null
          endereco?: Json | null
          estado_civil?: string | null
          filial_id?: string | null
          genero?: string | null
          id?: string
          inscricao_estadual?: string | null
          nacionalidade?: string | null
          nome?: string
          nome_fantasia?: string | null
          nome_normalizado?: string | null
          observacoes?: string | null
          porte_empresa?: string | null
          profissao?: string | null
          ramo_atividade?: string | null
          razao_social?: string | null
          rg?: string | null
          telefone?: string | null
          tipo_pessoa?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "pessoas_filial_id_fkey"
            columns: ["filial_id"]
            isOneToOne: false
            referencedRelation: "filiais"
            referencedColumns: ["id"]
          },
        ]
      }
      produto_variacoes: {
        Row: {
          codigo_barras_variacao: string | null
          cor: string
          created_at: string
          custo_unitario: number
          id: string
          preco_venda: number
          produto_id: string | null
          quantidade_estoque: number
          sku: string | null
          tamanho: string
          updated_at: string
        }
        Insert: {
          codigo_barras_variacao?: string | null
          cor: string
          created_at?: string
          custo_unitario?: number
          id?: string
          preco_venda?: number
          produto_id?: string | null
          quantidade_estoque?: number
          sku?: string | null
          tamanho: string
          updated_at?: string
        }
        Update: {
          codigo_barras_variacao?: string | null
          cor?: string
          created_at?: string
          custo_unitario?: number
          id?: string
          preco_venda?: number
          produto_id?: string | null
          quantidade_estoque?: number
          sku?: string | null
          tamanho?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "produto_variacoes_produto_id_fkey"
            columns: ["produto_id"]
            isOneToOne: false
            referencedRelation: "produtos"
            referencedColumns: ["id"]
          },
        ]
      }
      produtos: {
        Row: {
          categoria_id: string | null
          codigo_barras: string | null
          created_at: string
          custo_medio: number | null
          detalhes: string[] | null
          genero: string
          id: string
          marca_id: string | null
          nfe_id: string | null
          observacoes: string | null
          origem: string
          preco_venda_base: number | null
          referencia: string | null
          status: string
          tipo_manga_id: string | null
          titulo_completo: string
          updated_at: string
        }
        Insert: {
          categoria_id?: string | null
          codigo_barras?: string | null
          created_at?: string
          custo_medio?: number | null
          detalhes?: string[] | null
          genero: string
          id?: string
          marca_id?: string | null
          nfe_id?: string | null
          observacoes?: string | null
          origem?: string
          preco_venda_base?: number | null
          referencia?: string | null
          status?: string
          tipo_manga_id?: string | null
          titulo_completo: string
          updated_at?: string
        }
        Update: {
          categoria_id?: string | null
          codigo_barras?: string | null
          created_at?: string
          custo_medio?: number | null
          detalhes?: string[] | null
          genero?: string
          id?: string
          marca_id?: string | null
          nfe_id?: string | null
          observacoes?: string | null
          origem?: string
          preco_venda_base?: number | null
          referencia?: string | null
          status?: string
          tipo_manga_id?: string | null
          titulo_completo?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "produtos_categoria_id_fkey"
            columns: ["categoria_id"]
            isOneToOne: false
            referencedRelation: "categorias_produtos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "produtos_categoria_id_fkey"
            columns: ["categoria_id"]
            isOneToOne: false
            referencedRelation: "vw_dim_categorias"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "produtos_marca_id_fkey"
            columns: ["marca_id"]
            isOneToOne: false
            referencedRelation: "marcas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "produtos_nfe_id_fkey"
            columns: ["nfe_id"]
            isOneToOne: false
            referencedRelation: "nfe_data"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          created_at: string
          email: string | null
          full_name: string | null
          id: string
          role: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          email?: string | null
          full_name?: string | null
          id: string
          role?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          email?: string | null
          full_name?: string | null
          id?: string
          role?: string
          updated_at?: string
        }
        Relationships: []
      }
      recurring_bill_occurrences: {
        Row: {
          closed_at: string | null
          closing_date: string | null
          created_at: string
          due_date: string
          expected_amount: number
          id: string
          is_closed_for_month: boolean
          recurring_bill_id: string
          updated_at: string
          year_month: string
        }
        Insert: {
          closed_at?: string | null
          closing_date?: string | null
          created_at?: string
          due_date: string
          expected_amount?: number
          id?: string
          is_closed_for_month?: boolean
          recurring_bill_id: string
          updated_at?: string
          year_month: string
        }
        Update: {
          closed_at?: string | null
          closing_date?: string | null
          created_at?: string
          due_date?: string
          expected_amount?: number
          id?: string
          is_closed_for_month?: boolean
          recurring_bill_id?: string
          updated_at?: string
          year_month?: string
        }
        Relationships: [
          {
            foreignKeyName: "recurring_bill_occurrences_recurring_bill_id_fkey"
            columns: ["recurring_bill_id"]
            isOneToOne: false
            referencedRelation: "recurring_bills"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "recurring_bill_occurrences_recurring_bill_id_fkey"
            columns: ["recurring_bill_id"]
            isOneToOne: false
            referencedRelation: "recurring_events_next7"
            referencedColumns: ["recurring_bill_id"]
          },
        ]
      }
      recurring_bills: {
        Row: {
          active: boolean
          category_id: string | null
          closing_day: number | null
          created_at: string
          due_day: number
          end_date: string | null
          expected_amount: number
          filial_id: string | null
          id: string
          name: string
          notes: string | null
          open_ended: boolean
          recorrente_livre: boolean | null
          supplier_id: string | null
          updated_at: string
        }
        Insert: {
          active?: boolean
          category_id?: string | null
          closing_day?: number | null
          created_at?: string
          due_day: number
          end_date?: string | null
          expected_amount?: number
          filial_id?: string | null
          id?: string
          name: string
          notes?: string | null
          open_ended?: boolean
          recorrente_livre?: boolean | null
          supplier_id?: string | null
          updated_at?: string
        }
        Update: {
          active?: boolean
          category_id?: string | null
          closing_day?: number | null
          created_at?: string
          due_day?: number
          end_date?: string | null
          expected_amount?: number
          filial_id?: string | null
          id?: string
          name?: string
          notes?: string | null
          open_ended?: boolean
          recorrente_livre?: boolean | null
          supplier_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "recurring_bills_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categorias_produtos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "recurring_bills_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "vw_dim_categorias"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "recurring_bills_filial_id_fkey"
            columns: ["filial_id"]
            isOneToOne: false
            referencedRelation: "filiais"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "recurring_bills_supplier_id_fkey"
            columns: ["supplier_id"]
            isOneToOne: false
            referencedRelation: "fornecedores"
            referencedColumns: ["id"]
          },
        ]
      }
      representantes_contatos: {
        Row: {
          ativo: boolean
          created_at: string
          email: string
          entidade_id: string | null
          id: string
          marcas: string | null
          nome_representante: string
          observacoes: string | null
          telefone: string | null
          updated_at: string
        }
        Insert: {
          ativo?: boolean
          created_at?: string
          email: string
          entidade_id?: string | null
          id?: string
          marcas?: string | null
          nome_representante: string
          observacoes?: string | null
          telefone?: string | null
          updated_at?: string
        }
        Update: {
          ativo?: boolean
          created_at?: string
          email?: string
          entidade_id?: string | null
          id?: string
          marcas?: string | null
          nome_representante?: string
          observacoes?: string | null
          telefone?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "representantes_contatos_entidade_fkey"
            columns: ["entidade_id"]
            isOneToOne: false
            referencedRelation: "entidades_corporativas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "representantes_contatos_entidade_fkey"
            columns: ["entidade_id"]
            isOneToOne: false
            referencedRelation: "vw_ap_titulos"
            referencedColumns: ["entidade_id"]
          },
        ]
      }
      sales_goals: {
        Row: {
          created_at: string | null
          entity_id: string | null
          goal_amount: number
          id: string
          month: number
          salesperson_id: string | null
          updated_at: string | null
          year: number
        }
        Insert: {
          created_at?: string | null
          entity_id?: string | null
          goal_amount: number
          id?: string
          month: number
          salesperson_id?: string | null
          updated_at?: string | null
          year: number
        }
        Update: {
          created_at?: string | null
          entity_id?: string | null
          goal_amount?: number
          id?: string
          month?: number
          salesperson_id?: string | null
          updated_at?: string | null
          year?: number
        }
        Relationships: [
          {
            foreignKeyName: "sales_goals_entity_id_fkey"
            columns: ["entity_id"]
            isOneToOne: false
            referencedRelation: "entidades_corporativas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sales_goals_entity_id_fkey"
            columns: ["entity_id"]
            isOneToOne: false
            referencedRelation: "vw_ap_titulos"
            referencedColumns: ["entidade_id"]
          },
          {
            foreignKeyName: "sales_goals_salesperson_id_fkey"
            columns: ["salesperson_id"]
            isOneToOne: false
            referencedRelation: "fornecedores"
            referencedColumns: ["id"]
          },
        ]
      }
      salesperson_sales: {
        Row: {
          created_at: string
          entity_id: string
          id: string
          month: number
          sales_amount: number
          salesperson_id: string
          updated_at: string
          year: number
        }
        Insert: {
          created_at?: string
          entity_id: string
          id?: string
          month: number
          sales_amount?: number
          salesperson_id: string
          updated_at?: string
          year: number
        }
        Update: {
          created_at?: string
          entity_id?: string
          id?: string
          month?: number
          sales_amount?: number
          salesperson_id?: string
          updated_at?: string
          year?: number
        }
        Relationships: []
      }
      store_monthly_sales: {
        Row: {
          created_at: string | null
          entity_id: string | null
          id: string
          month: number
          total_sales: number
          updated_at: string | null
          year: number
        }
        Insert: {
          created_at?: string | null
          entity_id?: string | null
          id?: string
          month: number
          total_sales: number
          updated_at?: string | null
          year: number
        }
        Update: {
          created_at?: string | null
          entity_id?: string | null
          id?: string
          month?: number
          total_sales?: number
          updated_at?: string | null
          year?: number
        }
        Relationships: [
          {
            foreignKeyName: "store_monthly_sales_entity_id_fkey"
            columns: ["entity_id"]
            isOneToOne: false
            referencedRelation: "entidades_corporativas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "store_monthly_sales_entity_id_fkey"
            columns: ["entity_id"]
            isOneToOne: false
            referencedRelation: "vw_ap_titulos"
            referencedColumns: ["entidade_id"]
          },
        ]
      }
      system_configurations: {
        Row: {
          config_data: Json
          config_type: string
          created_at: string
          id: string
          updated_at: string
        }
        Insert: {
          config_data?: Json
          config_type: string
          created_at?: string
          id?: string
          updated_at?: string
        }
        Update: {
          config_data?: Json
          config_type?: string
          created_at?: string
          id?: string
          updated_at?: string
        }
        Relationships: []
      }
      vendas: {
        Row: {
          cliente_nome: string | null
          created_at: string
          data_venda: string
          forma_pagamento: string | null
          id: string
          observacoes: string | null
          updated_at: string
          valor_venda: number
          vendedora_id: string
        }
        Insert: {
          cliente_nome?: string | null
          created_at?: string
          data_venda: string
          forma_pagamento?: string | null
          id?: string
          observacoes?: string | null
          updated_at?: string
          valor_venda: number
          vendedora_id: string
        }
        Update: {
          cliente_nome?: string | null
          created_at?: string
          data_venda?: string
          forma_pagamento?: string | null
          id?: string
          observacoes?: string | null
          updated_at?: string
          valor_venda?: number
          vendedora_id?: string
        }
        Relationships: []
      }
      vendas_corporativas: {
        Row: {
          cliente_id: string
          created_at: string
          created_by: string | null
          data_venda: string
          desconto_total: number | null
          filial_id: string | null
          id: string
          meio_pagamento: string | null
          numero_venda: string | null
          observacoes: string | null
          status_venda: string | null
          updated_at: string
          valor_total: number
          vendedor_id: string
        }
        Insert: {
          cliente_id: string
          created_at?: string
          created_by?: string | null
          data_venda?: string
          desconto_total?: number | null
          filial_id?: string | null
          id?: string
          meio_pagamento?: string | null
          numero_venda?: string | null
          observacoes?: string | null
          status_venda?: string | null
          updated_at?: string
          valor_total?: number
          vendedor_id: string
        }
        Update: {
          cliente_id?: string
          created_at?: string
          created_by?: string | null
          data_venda?: string
          desconto_total?: number | null
          filial_id?: string | null
          id?: string
          meio_pagamento?: string | null
          numero_venda?: string | null
          observacoes?: string | null
          status_venda?: string | null
          updated_at?: string
          valor_total?: number
          vendedor_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "vendas_cliente_fkey"
            columns: ["cliente_id"]
            isOneToOne: false
            referencedRelation: "entidades_corporativas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "vendas_cliente_fkey"
            columns: ["cliente_id"]
            isOneToOne: false
            referencedRelation: "vw_ap_titulos"
            referencedColumns: ["entidade_id"]
          },
          {
            foreignKeyName: "vendas_corporativas_cliente_id_fkey"
            columns: ["cliente_id"]
            isOneToOne: false
            referencedRelation: "entidades_corporativas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "vendas_corporativas_cliente_id_fkey"
            columns: ["cliente_id"]
            isOneToOne: false
            referencedRelation: "vw_ap_titulos"
            referencedColumns: ["entidade_id"]
          },
          {
            foreignKeyName: "vendas_corporativas_filial_id_fkey"
            columns: ["filial_id"]
            isOneToOne: false
            referencedRelation: "filiais"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "vendas_corporativas_vendedor_id_fkey"
            columns: ["vendedor_id"]
            isOneToOne: false
            referencedRelation: "entidades_corporativas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "vendas_corporativas_vendedor_id_fkey"
            columns: ["vendedor_id"]
            isOneToOne: false
            referencedRelation: "vw_ap_titulos"
            referencedColumns: ["entidade_id"]
          },
          {
            foreignKeyName: "vendas_vendedor_fkey"
            columns: ["vendedor_id"]
            isOneToOne: false
            referencedRelation: "entidades_corporativas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "vendas_vendedor_fkey"
            columns: ["vendedor_id"]
            isOneToOne: false
            referencedRelation: "vw_ap_titulos"
            referencedColumns: ["entidade_id"]
          },
        ]
      }
      vendas_mensais_detalhadas: {
        Row: {
          ano: number
          created_at: string
          id: string
          mes: number
          updated_at: string
          valor_vendas: number
          vendedora_id: string
        }
        Insert: {
          ano: number
          created_at?: string
          id?: string
          mes: number
          updated_at?: string
          valor_vendas?: number
          vendedora_id: string
        }
        Update: {
          ano?: number
          created_at?: string
          id?: string
          mes?: number
          updated_at?: string
          valor_vendas?: number
          vendedora_id?: string
        }
        Relationships: []
      }
      vendas_mensais_totais: {
        Row: {
          ano: number
          created_at: string
          id: string
          mes: number
          total_vendas: number
          updated_at: string
        }
        Insert: {
          ano: number
          created_at?: string
          id?: string
          mes: number
          total_vendas?: number
          updated_at?: string
        }
        Update: {
          ano?: number
          created_at?: string
          id?: string
          mes?: number
          total_vendas?: number
          updated_at?: string
        }
        Relationships: []
      }
      vendedora_config: {
        Row: {
          ativa: boolean
          created_at: string | null
          entidade_id: string
          metas: Json | null
          pessoa_id: string
          preferencia: Json | null
          updated_at: string | null
        }
        Insert: {
          ativa?: boolean
          created_at?: string | null
          entidade_id: string
          metas?: Json | null
          pessoa_id: string
          preferencia?: Json | null
          updated_at?: string | null
        }
        Update: {
          ativa?: boolean
          created_at?: string | null
          entidade_id?: string
          metas?: Json | null
          pessoa_id?: string
          preferencia?: Json | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "vendedora_config_entidade_id_fkey"
            columns: ["entidade_id"]
            isOneToOne: false
            referencedRelation: "entidades"
            referencedColumns: ["id"]
          },
        ]
      }
      vendedora_ferias: {
        Row: {
          aprovado: boolean
          created_at: string
          data_fim: string
          data_inicio: string
          id: string
          observacoes: string | null
          tipo_ferias: string
          updated_at: string
          vendedora_id: string
        }
        Insert: {
          aprovado?: boolean
          created_at?: string
          data_fim: string
          data_inicio: string
          id?: string
          observacoes?: string | null
          tipo_ferias?: string
          updated_at?: string
          vendedora_id: string
        }
        Update: {
          aprovado?: boolean
          created_at?: string
          data_fim?: string
          data_inicio?: string
          id?: string
          observacoes?: string | null
          tipo_ferias?: string
          updated_at?: string
          vendedora_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      recurring_events_next7: {
        Row: {
          active: boolean | null
          category_id: string | null
          closing_date: string | null
          default_expected_amount: number | null
          due_date: string | null
          end_date: string | null
          expected_amount: number | null
          is_closed_for_month: boolean | null
          name: string | null
          next_event_date: string | null
          next_event_type: string | null
          occurrence_id: string | null
          open_ended: boolean | null
          recurring_bill_id: string | null
          supplier_id: string | null
          year_month: string | null
        }
        Relationships: [
          {
            foreignKeyName: "recurring_bills_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categorias_produtos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "recurring_bills_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "vw_dim_categorias"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "recurring_bills_supplier_id_fkey"
            columns: ["supplier_id"]
            isOneToOne: false
            referencedRelation: "fornecedores"
            referencedColumns: ["id"]
          },
        ]
      }
      vw_ap_titulos: {
        Row: {
          cpf_cnpj_normalizado: string | null
          credor: string | null
          data_vencimento: string | null
          entidade_id: string | null
          id: string | null
          status: string | null
          valor: number | null
        }
        Relationships: []
      }
      vw_dim_categorias: {
        Row: {
          ativo: boolean | null
          id: string | null
          nome: string | null
        }
        Insert: {
          ativo?: boolean | null
          id?: string | null
          nome?: string | null
        }
        Update: {
          ativo?: boolean | null
          id?: string | null
          nome?: string | null
        }
        Relationships: []
      }
      vw_fato_parcelas: {
        Row: {
          ano_vencimento: number | null
          banco_pagamento: string | null
          categoria: string | null
          conta_descricao: string | null
          conta_pagar_id: string | null
          created_at: string | null
          credor_documento: string | null
          credor_id: string | null
          credor_nome: string | null
          data_pagamento: string | null
          data_vencimento: string | null
          desconto: number | null
          filial: string | null
          forma_pagamento: string | null
          id: string | null
          juros: number | null
          mes_vencimento: number | null
          multa: number | null
          numero_documento: string | null
          numero_parcela: number | null
          status: string | null
          status_formatado: string | null
          total_parcelas: number | null
          updated_at: string | null
          valor_pago: number | null
          valor_parcela: number | null
        }
        Relationships: [
          {
            foreignKeyName: "contas_pagar_corporativas_credor_id_fkey"
            columns: ["credor_id"]
            isOneToOne: false
            referencedRelation: "entidades_corporativas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contas_pagar_corporativas_credor_id_fkey"
            columns: ["credor_id"]
            isOneToOne: false
            referencedRelation: "vw_ap_titulos"
            referencedColumns: ["entidade_id"]
          },
          {
            foreignKeyName: "parcelas_conta_pagar_conta_pagar_id_fkey"
            columns: ["conta_pagar_id"]
            isOneToOne: false
            referencedRelation: "contas_pagar_corporativas"
            referencedColumns: ["id"]
          },
        ]
      }
      vw_fato_vendas: {
        Row: {
          ano_venda: string | null
          data_venda: string | null
          id_cliente: string | null
          id_filial: string | null
          id_venda: string | null
          id_vendedor: string | null
          mes_venda: string | null
          status_venda: string | null
          valor: number | null
        }
        Insert: {
          ano_venda?: never
          data_venda?: string | null
          id_cliente?: string | null
          id_filial?: string | null
          id_venda?: string | null
          id_vendedor?: string | null
          mes_venda?: never
          status_venda?: string | null
          valor?: number | null
        }
        Update: {
          ano_venda?: never
          data_venda?: string | null
          id_cliente?: string | null
          id_filial?: string | null
          id_venda?: string | null
          id_vendedor?: string | null
          mes_venda?: never
          status_venda?: string | null
          valor?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "vendas_cliente_fkey"
            columns: ["id_cliente"]
            isOneToOne: false
            referencedRelation: "entidades_corporativas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "vendas_cliente_fkey"
            columns: ["id_cliente"]
            isOneToOne: false
            referencedRelation: "vw_ap_titulos"
            referencedColumns: ["entidade_id"]
          },
          {
            foreignKeyName: "vendas_corporativas_cliente_id_fkey"
            columns: ["id_cliente"]
            isOneToOne: false
            referencedRelation: "entidades_corporativas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "vendas_corporativas_cliente_id_fkey"
            columns: ["id_cliente"]
            isOneToOne: false
            referencedRelation: "vw_ap_titulos"
            referencedColumns: ["entidade_id"]
          },
          {
            foreignKeyName: "vendas_corporativas_filial_id_fkey"
            columns: ["id_filial"]
            isOneToOne: false
            referencedRelation: "filiais"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "vendas_corporativas_vendedor_id_fkey"
            columns: ["id_vendedor"]
            isOneToOne: false
            referencedRelation: "entidades_corporativas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "vendas_corporativas_vendedor_id_fkey"
            columns: ["id_vendedor"]
            isOneToOne: false
            referencedRelation: "vw_ap_titulos"
            referencedColumns: ["entidade_id"]
          },
          {
            foreignKeyName: "vendas_vendedor_fkey"
            columns: ["id_vendedor"]
            isOneToOne: false
            referencedRelation: "entidades_corporativas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "vendas_vendedor_fkey"
            columns: ["id_vendedor"]
            isOneToOne: false
            referencedRelation: "vw_ap_titulos"
            referencedColumns: ["entidade_id"]
          },
        ]
      }
      vw_pedidos_fornecedor: {
        Row: {
          arquivo_origem: string | null
          codigo_barras: string | null
          cor: string | null
          created_at: string | null
          custo_unitario: number | null
          data_pedido: string | null
          desconto_porcentagem: number | null
          desconto_valor: number | null
          descricao: string | null
          entidade_id: string | null
          fornecedor: string | null
          id: string | null
          marca_id: string | null
          numero_pedido: string | null
          observacoes: string | null
          produto_id: string | null
          quantidade: number | null
          quantidade_referencias: number | null
          referencia: string | null
          representante_email: string | null
          representante_nome: string | null
          representante_telefone: string | null
          status: string | null
          tamanho: string | null
          tipo_desconto: string | null
          updated_at: string | null
          valor_medio_peca: number | null
          valor_total_bruto: number | null
          valor_total_liquido: number | null
        }
        Relationships: [
          {
            foreignKeyName: "pedidos_produtos_entidade_fkey"
            columns: ["entidade_id"]
            isOneToOne: false
            referencedRelation: "entidades_corporativas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pedidos_produtos_entidade_fkey"
            columns: ["entidade_id"]
            isOneToOne: false
            referencedRelation: "vw_ap_titulos"
            referencedColumns: ["entidade_id"]
          },
          {
            foreignKeyName: "pedidos_produtos_marca_id_fkey"
            columns: ["marca_id"]
            isOneToOne: false
            referencedRelation: "marcas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pedidos_produtos_produto_id_fkey"
            columns: ["produto_id"]
            isOneToOne: false
            referencedRelation: "produtos"
            referencedColumns: ["id"]
          },
        ]
      }
      vw_pessoas_com_papeis: {
        Row: {
          ativo: boolean | null
          cnpj: string | null
          cpf: string | null
          email: string | null
          id: string | null
          nome: string | null
          nome_fantasia: string | null
          papeis: string[] | null
          papeis_norm: string[] | null
          razao_social: string | null
          telefone: string | null
          tipo_pessoa: string | null
          total_papeis: number | null
        }
        Relationships: []
      }
      vw_vendedores: {
        Row: {
          ativo: boolean | null
          cnpj: string | null
          config_vendedor: Json | null
          cpf: string | null
          cpf_cnpj_normalizado: string | null
          created_at: string | null
          dados_cliente: Json | null
          dados_fornecedor: Json | null
          dados_funcionario: Json | null
          dados_vendedor: Json | null
          data_fundacao: string | null
          data_inicio_vendas: string | null
          data_nascimento: string | null
          email: string | null
          email_normalizado: string | null
          endereco: Json | null
          estado_civil: string | null
          filial_id: string | null
          genero: string | null
          id: string | null
          inscricao_estadual: string | null
          nacionalidade: string | null
          nome: string | null
          nome_fantasia: string | null
          nome_normalizado: string | null
          observacoes: string | null
          porte_empresa: string | null
          profissao: string | null
          ramo_atividade: string | null
          razao_social: string | null
          rg: string | null
          telefone: string | null
          tipo_pessoa: string | null
          updated_at: string | null
        }
        Relationships: [
          {
            foreignKeyName: "pessoas_filial_id_fkey"
            columns: ["filial_id"]
            isOneToOne: false
            referencedRelation: "filiais"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Functions: {
      add_papel_to_pessoa: {
        Args: { p_papel_nome: string; p_pessoa_id: string }
        Returns: boolean
      }
      assign_vendedora: {
        Args: { p_entidade_id: string; p_pessoa_id: string }
        Returns: undefined
      }
      calculate_brazilian_payroll: {
        Args: {
          p_comissao_vendas?: number
          p_dias_trabalhados?: number
          p_funcionario_id: string
          p_horas_extras?: number
          p_payroll_run_id: string
          p_salario_base?: number
        }
        Returns: string
      }
      calculate_commission_real_time: {
        Args: { p_month: number; p_vendedora_id: string; p_year: number }
        Returns: number
      }
      calculate_mom_growth: {
        Args: { p_month: number; p_year: number }
        Returns: {
          current_sales: number
          growth_percentage: number
          previous_sales: number
          vendedora_id: string
          vendedora_nome: string
        }[]
      }
      calculate_yoy_growth: {
        Args: { p_month: number; p_year: number }
        Returns: {
          current_sales: number
          growth_percentage: number
          previous_year_sales: number
          vendedora_id: string
          vendedora_nome: string
        }[]
      }
      check_pessoa_duplicates: {
        Args: Record<PropertyKey, never>
        Returns: {
          ids: string
          nome: string
          quantidade: number
        }[]
      }
      cleanup_duplicate_pessoas: {
        Args: Record<PropertyKey, never>
        Returns: {
          action_type: string
          affected_count: number
          details: string
        }[]
      }
      clear_all_papel_mappings: {
        Args: Record<PropertyKey, never>
        Returns: Json
      }
      create_payable_from_recurring: {
        Args:
          | {
              p_amount?: number
              p_recurring_bill_id: string
              p_year_month?: string
            }
          | { p_recurring_bill_id: string; p_year_month?: string }
        Returns: string
      }
      desativar_entidade_papel: {
        Args: { _entidade: string; _papel_nome: string }
        Returns: undefined
      }
      ensure_entidade: {
        Args: { p_doc_norm: string; p_nome: string }
        Returns: string
      }
      ensure_papel: {
        Args: { ent_id: string; papel_nome: string }
        Returns: undefined
      }
      ensure_pessoa_in_entidades_corporativas: {
        Args: { p_pessoa_id: string }
        Returns: string
      }
      extract_invoice_number: {
        Args: { description: string }
        Returns: string
      }
      generate_recurring_bill_occurrences: {
        Args: { p_months_ahead?: number; p_recurring_bill_id: string }
        Returns: undefined
      }
      get_ap_installments_complete: {
        Args: Record<PropertyKey, never>
        Returns: {
          banco: string
          categoria: string
          comprovante_path: string
          conta_bancaria_id: string
          conta_banco_nome: string
          created_at: string
          dados_pagamento: string
          data_hora_pagamento: string
          data_pagamento: string
          data_vencimento: string
          descricao: string
          eh_recorrente: boolean
          entidade_id: string
          entidade_nome: string
          entidade_tipo: string
          forma_pagamento: string
          fornecedor: string
          funcionario_id: string
          funcionario_nome: string
          id: string
          nfe_id: string
          numero_documento: string
          numero_nfe_display: string
          numero_parcela: number
          observacoes: string
          status: string
          status_calculado: string
          tipo_recorrencia: string
          total_parcelas: number
          updated_at: string
          valor: number
          valor_fixo: boolean
          valor_total_titulo: number
        }[]
      }
      get_current_user_role: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      get_dashboard_financeiro_stats: {
        Args: Record<PropertyKey, never>
        Returns: Json
      }
      get_dashboard_stats: {
        Args: Record<PropertyKey, never>
        Returns: {
          pagos_mes_atual: number
          total_aberto: number
          vencendo_hoje: number
          vencidos: number
        }[]
      }
      get_entidade_dashboard: {
        Args: { p_entidade_id: string }
        Returns: Json
      }
      get_expenses_by_category: {
        Args:
          | Record<PropertyKey, never>
          | { p_end_date?: string; p_start_date?: string }
        Returns: {
          categoria: string
          count_items: number
          total_valor: number
        }[]
      }
      get_financial_panel_stats: {
        Args: Record<PropertyKey, never>
        Returns: {
          contas_pagas_hoje: number
          contas_vencendo_ate_fim_mes: number
          contas_vencendo_hoje: number
          contas_vencidas: number
        }[]
      }
      get_financial_panel_stats_extended: {
        Args: Record<PropertyKey, never>
        Returns: {
          contas_pagas_hoje: number
          contas_pagas_hoje_count: number
          contas_pendentes_nao_recorrentes: number
          contas_pendentes_nao_recorrentes_count: number
          contas_vencendo_ate_fim_mes: number
          contas_vencendo_ate_fim_mes_count: number
          contas_vencendo_hoje: number
          contas_vencendo_hoje_count: number
          contas_vencidas: number
          contas_vencidas_count: number
        }[]
      }
      get_papeis_hierarquicos: {
        Args: Record<PropertyKey, never>
        Returns: {
          ativo: boolean
          descricao: string
          id: string
          nivel: number
          nome: string
          papel_pai_id: string
          papel_pai_nome: string
        }[]
      }
      get_pessoas_with_papeis: {
        Args: Record<PropertyKey, never>
        Returns: {
          ativo: boolean
          cpf: string
          email: string
          id: string
          nome: string
          papeis: string[]
          telefone: string
          tipo_pessoa: string
        }[]
      }
      get_sales_kpi_data: {
        Args: { p_month: number; p_year: number }
        Returns: {
          active_salespeople: number
          goal_achievement_percentage: number
          mom_growth_percentage: number
          top_performer_name: string
          top_performer_sales: number
          total_goal: number
          total_sales: number
          yoy_growth_percentage: number
        }[]
      }
      gtrgm_compress: {
        Args: { "": unknown }
        Returns: unknown
      }
      gtrgm_decompress: {
        Args: { "": unknown }
        Returns: unknown
      }
      gtrgm_in: {
        Args: { "": unknown }
        Returns: unknown
      }
      gtrgm_options: {
        Args: { "": unknown }
        Returns: undefined
      }
      gtrgm_out: {
        Args: { "": unknown }
        Returns: unknown
      }
      is_admin: {
        Args: Record<PropertyKey, never>
        Returns: boolean
      }
      log_merge_alias: {
        Args: { a: string; b: string }
        Returns: undefined
      }
      map_cnpj_to_filial: {
        Args: { cnpj_emitente: string }
        Returns: string
      }
      merge_entidades: {
        Args: { a: string; b: string }
        Returns: undefined
      }
      migrate_ap_installments_to_corporative_v2: {
        Args: Record<PropertyKey, never>
        Returns: number
      }
      migrate_fornecedores_to_pessoas: {
        Args: Record<PropertyKey, never>
        Returns: number
      }
      migrate_funcionarios_to_pessoas: {
        Args: Record<PropertyKey, never>
        Returns: number
      }
      norm_doc: {
        Args: { doc: string }
        Returns: string
      }
      norm_email: {
        Args: { e: string }
        Returns: string
      }
      norm_phone: {
        Args: { t: string }
        Returns: string
      }
      normaliza_cpf_cnpj: {
        Args: { input_text: string }
        Returns: string
      }
      normaliza_email: {
        Args: { input_text: string }
        Returns: string
      }
      normalize_cpf_cnpj: {
        Args: { doc: string }
        Returns: string
      }
      normalize_installment_info: {
        Args: { numero_parcela: number; total_parcelas: number; valor: number }
        Returns: string
      }
      normalize_supplier_name: {
        Args: { supplier_name: string }
        Returns: string
      }
      process_payroll_run: {
        Args: { p_payroll_run_id: string }
        Returns: undefined
      }
      promote_user_to_admin: {
        Args: { user_email: string }
        Returns: undefined
      }
      refresh_recurring_bills: {
        Args: { p_months_ahead?: number }
        Returns: undefined
      }
      remove_papel_from_pessoa: {
        Args: { p_papel_nome: string; p_pessoa_id: string }
        Returns: boolean
      }
      rpc_papeis_ativos_da_entidade: {
        Args: { _entidade: string }
        Returns: {
          papel: string
        }[]
      }
      search_ap_installments: {
        Args: {
          p_categoria?: string
          p_data_fim?: string
          p_data_inicio?: string
          p_fornecedor?: string
          p_limit?: number
          p_offset?: number
          p_search_term?: string
          p_status?: string
        }
        Returns: {
          data: Json
          total_aberto: number
          total_count: number
          total_pago: number
          total_vencido: number
        }[]
      }
      search_entidades_corporativas: {
        Args: {
          p_limite?: number
          p_offset?: number
          p_papel?: string
          p_query?: string
        }
        Returns: {
          ativo: boolean
          cpf_cnpj: string
          email: string
          id: string
          nome_fantasia: string
          nome_razao_social: string
          papeis: string[]
          telefone: string
          tipo_pessoa: string
        }[]
      }
      search_entidades_fornecedores: {
        Args: { p_limit?: number; p_offset?: number; p_search?: string }
        Returns: {
          ativo: boolean
          cpf_cnpj: string
          created_at: string
          email: string
          id: string
          nome_fantasia: string
          nome_razao_social: string
          telefone: string
          tipo_pessoa: string
          updated_at: string
        }[]
      }
      search_entidades_pessoas: {
        Args: { p_limit?: number; p_offset?: number; p_search?: string }
        Returns: {
          ativo: boolean
          cpf_cnpj: string
          created_at: string
          email: string
          id: string
          nome_fantasia: string
          nome_razao_social: string
          papeis: string[]
          telefone: string
          tipo_pessoa: string
          updated_at: string
        }[]
      }
      search_text_in_schema: {
        Args: { p_schema: string; p_term: string }
        Returns: {
          column_name: string
          row_ctid: unknown
          schema_name: string
          table_name: string
        }[]
      }
      set_limit: {
        Args: { "": number }
        Returns: number
      }
      set_vendedora_config: {
        Args: {
          p_ativa?: boolean
          p_entidade_id: string
          p_metas?: Json
          p_pessoa_id: string
          p_preferencia?: Json
        }
        Returns: undefined
      }
      show_limit: {
        Args: Record<PropertyKey, never>
        Returns: number
      }
      show_trgm: {
        Args: { "": string }
        Returns: string[]
      }
      sync_papeis_pessoa_to_entidade: {
        Args: { p_pessoa_id: string }
        Returns: number
      }
      sync_pessoa_categorias: {
        Args: Record<PropertyKey, never>
        Returns: number
      }
      unaccent: {
        Args: { "": string }
        Returns: string
      }
      unaccent_init: {
        Args: { "": unknown }
        Returns: unknown
      }
      update_ap_installments_relationships: {
        Args: Record<PropertyKey, never>
        Returns: number
      }
      upsert_entidade_papel: {
        Args: { _entidade: string; _papel_nome: string }
        Returns: undefined
      }
      upsert_entidade_por_pessoa: {
        Args: { _pessoa_id: string }
        Returns: string
      }
      validate_pessoas_papeis_integrity: {
        Args: Record<PropertyKey, never>
        Returns: {
          check_name: string
          count_found: number
          description: string
          status: string
        }[]
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
