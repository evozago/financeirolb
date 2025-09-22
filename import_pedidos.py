#!/usr/bin/env python3
"""
Script para importar dados de pedidos_produtos para o Supabase
Lê os CSVs fornecidos e insere os dados na tabela pedidos_produtos
"""

import pandas as pd
import json
import os
from supabase import create_client, Client
from datetime import datetime
import sys

# Configuração do Supabase
SUPABASE_URL = os.getenv('SUPABASE_URL')
SUPABASE_KEY = os.getenv('SUPABASE_KEY')

if not SUPABASE_URL or not SUPABASE_KEY:
    print("❌ Erro: Variáveis SUPABASE_URL e SUPABASE_KEY não encontradas")
    print("Configure as variáveis de ambiente primeiro")
    sys.exit(1)

# Inicializar cliente Supabase
supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

def load_csv_files():
    """Carrega os arquivos CSV"""
    try:
        print("📁 Carregando arquivos CSV...")
        
        # Carregar pedidos
        pedidos_df = pd.read_csv('/home/ubuntu/upload/pedidos_produtos_rows.csv')
        print(f"✅ Pedidos carregados: {len(pedidos_df)} registros")
        
        # Carregar marcas
        marcas_df = pd.read_csv('/home/ubuntu/upload/marcas_rows(1).csv')
        print(f"✅ Marcas carregadas: {len(marcas_df)} registros")
        
        # Carregar fornecedores
        fornecedores_df = pd.read_csv('/home/ubuntu/upload/fornecedores_rows(3).csv')
        print(f"✅ Fornecedores carregados: {len(fornecedores_df)} registros")
        
        return pedidos_df, marcas_df, fornecedores_df
        
    except Exception as e:
        print(f"❌ Erro ao carregar CSVs: {e}")
        return None, None, None

def create_lookup_maps(marcas_df, fornecedores_df):
    """Cria mapas de lookup para IDs"""
    print("🗺️ Criando mapas de lookup...")
    
    # Mapa de marcas: id -> nome
    marcas_map = dict(zip(marcas_df['id'], marcas_df['nome']))
    print(f"✅ Mapa de marcas criado: {len(marcas_map)} entradas")
    
    # Mapa de fornecedores: id -> nome
    fornecedores_map = dict(zip(fornecedores_df['id'], fornecedores_df['nome']))
    print(f"✅ Mapa de fornecedores criado: {len(fornecedores_map)} entradas")
    
    return marcas_map, fornecedores_map

def clean_and_prepare_data(pedidos_df, marcas_map, fornecedores_map):
    """Limpa e prepara os dados para inserção"""
    print("🧹 Limpando e preparando dados...")
    
    cleaned_data = []
    errors = []
    
    for index, row in pedidos_df.iterrows():
        try:
            # Verificar se fornecedor e marca existem
            fornecedor_id = row['fornecedor_id']
            marca_id = row['marca_id']
            
            if pd.isna(fornecedor_id) or fornecedor_id not in fornecedores_map:
                errors.append(f"Linha {index}: Fornecedor ID {fornecedor_id} não encontrado")
                continue
                
            if pd.isna(marca_id) or marca_id not in marcas_map:
                errors.append(f"Linha {index}: Marca ID {marca_id} não encontrada")
                continue
            
            # Preparar dados limpos
            clean_row = {
                'id': row['id'],
                'fornecedor_id': fornecedor_id,
                'marca_id': marca_id,
                'referencia': row['referencia'] if not pd.isna(row['referencia']) else '',
                'codigo_barras': row['codigo_barras'] if not pd.isna(row['codigo_barras']) else '',
                'descricao': row['descricao'] if not pd.isna(row['descricao']) else '',
                'cor': row['cor'] if not pd.isna(row['cor']) else '',
                'tamanho': row['tamanho'] if not pd.isna(row['tamanho']) else '',
                'quantidade': int(row['quantidade']) if not pd.isna(row['quantidade']) else 0,
                'custo_unitario': float(row['custo_unitario']) if not pd.isna(row['custo_unitario']) else 0.0,
                'data_pedido': row['data_pedido'] if not pd.isna(row['data_pedido']) else None,
                'status': row['status'] if not pd.isna(row['status']) else 'pendente',
                'produto_id': row['produto_id'] if not pd.isna(row['produto_id']) else None,
                'observacoes': row['observacoes'] if not pd.isna(row['observacoes']) else '',
                'arquivo_origem': row['arquivo_origem'] if not pd.isna(row['arquivo_origem']) else '',
                'numero_pedido': row['numero_pedido'] if not pd.isna(row['numero_pedido']) else '',
                'desconto_valor': float(row['desconto_valor']) if not pd.isna(row['desconto_valor']) else 0.0,
                'desconto_porcentagem': float(row['desconto_porcentagem']) if not pd.isna(row['desconto_porcentagem']) else 0.0,
                'tipo_desconto': row['tipo_desconto'] if not pd.isna(row['tipo_desconto']) else 'valor',
                'quantidade_referencias': int(row['quantidade_referencias']) if not pd.isna(row['quantidade_referencias']) else 0,
                'valor_total_bruto': float(row['valor_total_bruto']) if not pd.isna(row['valor_total_bruto']) else 0.0,
                'valor_total_liquido': float(row['valor_total_liquido']) if not pd.isna(row['valor_total_liquido']) else 0.0,
                'valor_medio_peca': float(row['valor_medio_peca']) if not pd.isna(row['valor_medio_peca']) else 0.0,
                'representante_nome': row['representante_nome'] if not pd.isna(row['representante_nome']) else '',
                'representante_telefone': row['representante_telefone'] if not pd.isna(row['representante_telefone']) else '',
                'representante_email': row['representante_email'] if not pd.isna(row['representante_email']) else ''
            }
            
            # Adicionar informações de lookup para debug
            clean_row['_marca_nome'] = marcas_map.get(marca_id, 'DESCONHECIDA')
            clean_row['_fornecedor_nome'] = fornecedores_map.get(fornecedor_id, 'DESCONHECIDO')
            
            cleaned_data.append(clean_row)
            
        except Exception as e:
            errors.append(f"Linha {index}: Erro ao processar - {e}")
    
    print(f"✅ Dados limpos: {len(cleaned_data)} registros válidos")
    if errors:
        print(f"⚠️ Erros encontrados: {len(errors)}")
        for error in errors[:5]:  # Mostrar apenas os primeiros 5 erros
            print(f"   {error}")
        if len(errors) > 5:
            print(f"   ... e mais {len(errors) - 5} erros")
    
    return cleaned_data

def insert_data_to_supabase(cleaned_data):
    """Insere os dados no Supabase"""
    print("📤 Inserindo dados no Supabase...")
    
    # Remover campos de debug antes da inserção
    for row in cleaned_data:
        row.pop('_marca_nome', None)
        row.pop('_fornecedor_nome', None)
    
    try:
        # Inserir em lotes de 100 registros
        batch_size = 100
        total_inserted = 0
        
        for i in range(0, len(cleaned_data), batch_size):
            batch = cleaned_data[i:i + batch_size]
            
            print(f"📦 Inserindo lote {i//batch_size + 1}: registros {i+1} a {min(i+batch_size, len(cleaned_data))}")
            
            result = supabase.table('pedidos_produtos').insert(batch).execute()
            
            if result.data:
                batch_inserted = len(result.data)
                total_inserted += batch_inserted
                print(f"✅ Lote inserido com sucesso: {batch_inserted} registros")
            else:
                print(f"❌ Erro ao inserir lote: {result}")
        
        print(f"🎉 Importação concluída! Total inserido: {total_inserted} registros")
        return total_inserted
        
    except Exception as e:
        print(f"❌ Erro ao inserir dados: {e}")
        return 0

def verify_import():
    """Verifica se a importação foi bem-sucedida"""
    print("🔍 Verificando importação...")
    
    try:
        # Contar registros
        result = supabase.table('pedidos_produtos').select('*', count='exact').execute()
        count = result.count
        
        print(f"📊 Total de registros na tabela: {count}")
        
        # Buscar alguns exemplos
        sample = supabase.table('pedidos_produtos').select('*').limit(3).execute()
        
        if sample.data:
            print("📋 Exemplos de registros inseridos:")
            for i, record in enumerate(sample.data, 1):
                print(f"   {i}. {record.get('referencia', 'N/A')} - {record.get('descricao', 'N/A')[:50]}...")
        
        return count
        
    except Exception as e:
        print(f"❌ Erro ao verificar importação: {e}")
        return 0

def main():
    """Função principal"""
    print("🚀 Iniciando importação de pedidos...")
    print("=" * 60)
    
    # 1. Carregar CSVs
    pedidos_df, marcas_df, fornecedores_df = load_csv_files()
    if pedidos_df is None:
        return
    
    # 2. Criar mapas de lookup
    marcas_map, fornecedores_map = create_lookup_maps(marcas_df, fornecedores_df)
    
    # 3. Limpar e preparar dados
    cleaned_data = clean_and_prepare_data(pedidos_df, marcas_map, fornecedores_map)
    
    if not cleaned_data:
        print("❌ Nenhum dado válido para inserir")
        return
    
    # 4. Mostrar resumo antes da inserção
    print("\n📋 RESUMO DA IMPORTAÇÃO:")
    print(f"   • Total de pedidos: {len(cleaned_data)}")
    print(f"   • Marcas diferentes: {len(set(row['marca_id'] for row in cleaned_data))}")
    print(f"   • Fornecedores diferentes: {len(set(row['fornecedor_id'] for row in cleaned_data))}")
    print(f"   • Valor total: R$ {sum(row['valor_total_liquido'] for row in cleaned_data):,.2f}")
    
    # Confirmar antes de inserir
    response = input("\n❓ Deseja prosseguir com a importação? (s/N): ")
    if response.lower() not in ['s', 'sim', 'y', 'yes']:
        print("❌ Importação cancelada pelo usuário")
        return
    
    # 5. Inserir dados
    inserted_count = insert_data_to_supabase(cleaned_data)
    
    # 6. Verificar importação
    if inserted_count > 0:
        verify_import()
    
    print("\n🎯 Importação finalizada!")
    print("=" * 60)

if __name__ == "__main__":
    main()
