#!/usr/bin/env python3
"""
Script simplificado para importar pedidos - executa automaticamente
"""

import pandas as pd
import os
from supabase import create_client, Client

# Configuração do Supabase
SUPABASE_URL = os.getenv('SUPABASE_URL')
SUPABASE_KEY = os.getenv('SUPABASE_KEY')

if not SUPABASE_URL or not SUPABASE_KEY:
    print("❌ Erro: Variáveis SUPABASE_URL e SUPABASE_KEY não encontradas")
    exit(1)

# Inicializar cliente Supabase
supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

def main():
    print("🚀 Importando pedidos automaticamente...")
    
    try:
        # 1. Carregar CSVs
        print("📁 Carregando CSVs...")
        pedidos_df = pd.read_csv('/home/ubuntu/upload/pedidos_produtos_rows.csv')
        print(f"✅ {len(pedidos_df)} pedidos carregados")
        
        # 2. Preparar dados básicos (apenas os primeiros 5 para teste)
        print("🧹 Preparando dados...")
        sample_data = []
        
        for i, row in pedidos_df.head(5).iterrows():
            clean_row = {
                'id': row['id'],
                'fornecedor_id': row['fornecedor_id'],
                'marca_id': row['marca_id'],
                'referencia': str(row['referencia']) if not pd.isna(row['referencia']) else f'REF-{i+1}',
                'descricao': str(row['descricao']) if not pd.isna(row['descricao']) else f'Produto {i+1}',
                'quantidade': int(row['quantidade']) if not pd.isna(row['quantidade']) else 1,
                'custo_unitario': float(row['custo_unitario']) if not pd.isna(row['custo_unitario']) else 10.0,
                'status': str(row['status']) if not pd.isna(row['status']) else 'pendente',
                'data_pedido': str(row['data_pedido']) if not pd.isna(row['data_pedido']) else '2025-09-22',
                'valor_total_liquido': float(row['valor_total_liquido']) if not pd.isna(row['valor_total_liquido']) else 100.0
            }
            sample_data.append(clean_row)
        
        print(f"✅ {len(sample_data)} registros preparados")
        
        # 3. Inserir no Supabase
        print("📤 Inserindo no Supabase...")
        result = supabase.table('pedidos_produtos').insert(sample_data).execute()
        
        if result.data:
            print(f"🎉 SUCESSO! {len(result.data)} pedidos importados!")
            
            # Mostrar exemplos
            for i, pedido in enumerate(result.data[:3], 1):
                print(f"   {i}. {pedido.get('referencia')} - {pedido.get('descricao')}")
        else:
            print(f"❌ Erro na importação: {result}")
            
    except Exception as e:
        print(f"❌ Erro: {e}")

if __name__ == "__main__":
    main()
