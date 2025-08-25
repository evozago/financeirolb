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
        ]
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
      detalhes_produtos: {
        Row: {
          ativo: boolean
          created_at: string
          id: string
          nome: string
          tipo: string
          updated_at: string
        }
        Insert: {
          ativo?: boolean
          created_at?: string
          id?: string
          nome: string
          tipo: string
          updated_at?: string
        }
        Update: {
          ativo?: boolean
          created_at?: string
          id?: string
          nome?: string
          tipo?: string
          updated_at?: string
        }
        Relationships: []
      }
      entidades: {
        Row: {
          ativo: boolean
          cnpj_cpf: string | null
          created_at: string
          id: string
          nome: string
          razao_social: string | null
          tipo: string
          updated_at: string
        }
        Insert: {
          ativo?: boolean
          cnpj_cpf?: string | null
          created_at?: string
          id?: string
          nome: string
          razao_social?: string | null
          tipo: string
          updated_at?: string
        }
        Update: {
          ativo?: boolean
          cnpj_cpf?: string | null
          created_at?: string
          id?: string
          nome?: string
          razao_social?: string | null
          tipo?: string
          updated_at?: string
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
          categoria_id: string | null
          cnpj_cpf: string | null
          contato_representante: string | null
          created_at: string
          data_cadastro: string | null
          email: string | null
          email_representante: string | null
          endereco: string | null
          filial_id: string | null
          id: string
          nome: string
          representante_email: string | null
          representante_nome: string | null
          representante_telefone: string | null
          telefone: string | null
          telefone_representante: string | null
          updated_at: string
        }
        Insert: {
          ativo?: boolean
          categoria_id?: string | null
          cnpj_cpf?: string | null
          contato_representante?: string | null
          created_at?: string
          data_cadastro?: string | null
          email?: string | null
          email_representante?: string | null
          endereco?: string | null
          filial_id?: string | null
          id?: string
          nome: string
          representante_email?: string | null
          representante_nome?: string | null
          representante_telefone?: string | null
          telefone?: string | null
          telefone_representante?: string | null
          updated_at?: string
        }
        Update: {
          ativo?: boolean
          categoria_id?: string | null
          cnpj_cpf?: string | null
          contato_representante?: string | null
          created_at?: string
          data_cadastro?: string | null
          email?: string | null
          email_representante?: string | null
          endereco?: string | null
          filial_id?: string | null
          id?: string
          nome?: string
          representante_email?: string | null
          representante_nome?: string | null
          representante_telefone?: string | null
          telefone?: string | null
          telefone_representante?: string | null
          updated_at?: string
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
          chave_pix: string | null
          cpf: string | null
          created_at: string
          dias_uteis_mes: number
          email: string | null
          endereco: string | null
          id: string
          nome: string
          salario: number
          telefone: string | null
          tipo_chave_pix: string | null
          updated_at: string
          valor_transporte_dia: number
          valor_transporte_total: number
        }
        Insert: {
          ativo?: boolean
          chave_pix?: string | null
          cpf?: string | null
          created_at?: string
          dias_uteis_mes?: number
          email?: string | null
          endereco?: string | null
          id?: string
          nome: string
          salario?: number
          telefone?: string | null
          tipo_chave_pix?: string | null
          updated_at?: string
          valor_transporte_dia?: number
          valor_transporte_total?: number
        }
        Update: {
          ativo?: boolean
          chave_pix?: string | null
          cpf?: string | null
          created_at?: string
          dias_uteis_mes?: number
          email?: string | null
          endereco?: string | null
          id?: string
          nome?: string
          salario?: number
          telefone?: string | null
          tipo_chave_pix?: string | null
          updated_at?: string
          valor_transporte_dia?: number
          valor_transporte_total?: number
        }
        Relationships: []
      }
      marcas: {
        Row: {
          ativo: boolean
          created_at: string
          fornecedor_id: string | null
          id: string
          nome: string
          updated_at: string
        }
        Insert: {
          ativo?: boolean
          created_at?: string
          fornecedor_id?: string | null
          id?: string
          nome: string
          updated_at?: string
        }
        Update: {
          ativo?: boolean
          created_at?: string
          fornecedor_id?: string | null
          id?: string
          nome?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "marcas_fornecedor_id_fkey"
            columns: ["fornecedor_id"]
            isOneToOne: false
            referencedRelation: "fornecedores"
            referencedColumns: ["id"]
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
        Relationships: [
          {
            foreignKeyName: "metas_mensais_vendedora_id_fkey"
            columns: ["vendedora_id"]
            isOneToOne: false
            referencedRelation: "vendedoras"
            referencedColumns: ["id"]
          },
        ]
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
          fornecedor_id: string | null
          id: string
          marca_id: string | null
          numero_pedido: string | null
          observacoes: string | null
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
          fornecedor_id?: string | null
          id?: string
          marca_id?: string | null
          numero_pedido?: string | null
          observacoes?: string | null
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
          fornecedor_id?: string | null
          id?: string
          marca_id?: string | null
          numero_pedido?: string | null
          observacoes?: string | null
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
            foreignKeyName: "pedidos_produtos_fornecedor_id_fkey"
            columns: ["fornecedor_id"]
            isOneToOne: false
            referencedRelation: "fornecedores"
            referencedColumns: ["id"]
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
          {
            foreignKeyName: "produtos_tipo_manga_id_fkey"
            columns: ["tipo_manga_id"]
            isOneToOne: false
            referencedRelation: "tipos_manga"
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
          id: string
          name: string
          notes: string | null
          open_ended: boolean
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
          id?: string
          name: string
          notes?: string | null
          open_ended?: boolean
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
          id?: string
          name?: string
          notes?: string | null
          open_ended?: boolean
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
          fornecedor_id: string
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
          fornecedor_id: string
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
          fornecedor_id?: string
          id?: string
          marcas?: string | null
          nome_representante?: string
          observacoes?: string | null
          telefone?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "representantes_contatos_fornecedor_id_fkey"
            columns: ["fornecedor_id"]
            isOneToOne: false
            referencedRelation: "fornecedores"
            referencedColumns: ["id"]
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
      tipos_manga: {
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
        Relationships: [
          {
            foreignKeyName: "vendas_vendedora_id_fkey"
            columns: ["vendedora_id"]
            isOneToOne: false
            referencedRelation: "vendedoras"
            referencedColumns: ["id"]
          },
        ]
      }
      vendedoras: {
        Row: {
          ativo: boolean
          comissao_padrao: number | null
          comissao_supermeta: number | null
          created_at: string
          email: string | null
          id: string
          meta_mensal: number | null
          nome: string
          telefone: string | null
          updated_at: string
        }
        Insert: {
          ativo?: boolean
          comissao_padrao?: number | null
          comissao_supermeta?: number | null
          created_at?: string
          email?: string | null
          id?: string
          meta_mensal?: number | null
          nome: string
          telefone?: string | null
          updated_at?: string
        }
        Update: {
          ativo?: boolean
          comissao_padrao?: number | null
          comissao_supermeta?: number | null
          created_at?: string
          email?: string | null
          id?: string
          meta_mensal?: number | null
          nome?: string
          telefone?: string | null
          updated_at?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      extract_invoice_number: {
        Args: { description: string }
        Returns: string
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
      get_dashboard_stats: {
        Args: Record<PropertyKey, never>
        Returns: {
          pagos_mes_atual: number
          total_aberto: number
          vencendo_hoje: number
          vencidos: number
        }[]
      }
      get_expenses_by_category: {
        Args: { p_end_date?: string; p_start_date?: string }
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
      is_admin: {
        Args: Record<PropertyKey, never>
        Returns: boolean
      }
      map_cnpj_to_filial: {
        Args: { cnpj_emitente: string }
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
      promote_user_to_admin: {
        Args: { user_email: string }
        Returns: undefined
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
