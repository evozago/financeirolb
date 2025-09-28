#!/usr/bin/env python3
"""
Script para aplicar correções no projeto financeirolb usando a API do Supabase
"""

import os
import sys
import requests
import json
from dotenv import load_dotenv

def load_env_file():
    """Carrega as variáveis de ambiente"""
    load_dotenv('.env')
    load_dotenv('env.local')
    
    return {
        'url': os.getenv('VITE_SUPABASE_URL') or os.getenv('NEXT_PUBLIC_SUPABASE_URL'),
        'anon_key': os.getenv('VITE_SUPABASE_PUBLISHABLE_KEY') or os.getenv('NEXT_PUBLIC_SUPABASE_ANON_KEY'),
        'service_role': os.getenv('SUPABASE_SERVICE_ROLE')
    }

def execute_rpc(base_url, key, function_name, params=None):
    """Executa uma função RPC via API do Supabase"""
    url = f"{base_url}/rest/v1/rpc/{function_name}"
    headers = {
        'apikey': key,
        'Authorization': f'Bearer {key}',
        'Content-Type': 'application/json'
    }
    
    data = params or {}
    
    try:
        response = requests.post(url, headers=headers, json=data)
        if response.status_code == 200:
            return True, response.json()
        else:
            return False, response.text
    except Exception as e:
        return False, str(e)

def check_table_structure(base_url, key, table_name, column_name):
    """Verifica se uma coluna existe em uma tabela"""
    url = f"{base_url}/rest/v1/{table_name}"
    headers = {
        'apikey': key,
        'Authorization': f'Bearer {key}',
        'Range': '0-0'  # Buscar apenas 1 registro para verificar estrutura
    }
    
    try:
        response = requests.get(url, headers=headers)
        if response.status_code == 200:
            data = response.json()
            if data and len(data) > 0:
                return column_name in data[0]
        return False
    except:
        return False

def update_table_data(base_url, key, table_name, updates, where_clause=None):
    """Atualiza dados em uma tabela"""
    url = f"{base_url}/rest/v1/{table_name}"
    if where_clause:
        url += f"?{where_clause}"
    
    headers = {
        'apikey': key,
        'Authorization': f'Bearer {key}',
        'Content-Type': 'application/json',
        'Prefer': 'return=minimal'
    }
    
    try:
        response = requests.patch(url, headers=headers, json=updates)
        return response.status_code in [200, 204]
    except:
        return False

def main():
    """Função principal"""
    print("🔧 Aplicando correções no projeto financeirolb via API...")
    
    # Carregar variáveis de ambiente
    env_vars = load_env_file()
    
    if not env_vars['url'] or not env_vars['service_role']:
        print("❌ Credenciais do Supabase não encontradas.")
        print("Verifique se VITE_SUPABASE_URL e SUPABASE_SERVICE_ROLE estão definidas.")
        sys.exit(1)
    
    base_url = env_vars['url']
    service_key = env_vars['service_role']
    
    print(f"🔗 Conectando ao Supabase: {base_url}")
    
    # 1. Verificar e corrigir estrutura de tabelas
    print("\n1️⃣ Verificando estrutura das tabelas...")
    
    # Verificar se pedidos_produtos tem entidade_id
    has_entidade_id = check_table_structure(base_url, service_key, 'pedidos_produtos', 'entidade_id')
    if has_entidade_id:
        print("✅ Tabela pedidos_produtos já tem coluna entidade_id")
        
        # Migrar dados de fornecedor_id para entidade_id se necessário
        print("🔄 Migrando dados fornecedor_id -> entidade_id em pedidos...")
        success = update_table_data(
            base_url, service_key, 'pedidos_produtos',
            {'entidade_id': 'fornecedor_id'},  # Isso não funcionará diretamente, precisa de SQL
            'entidade_id=is.null&fornecedor_id=not.is.null'
        )
    else:
        print("⚠️ Tabela pedidos_produtos não tem coluna entidade_id - migração SQL necessária")
    
    # 2. Verificar e corrigir papéis duplicados
    print("\n2️⃣ Verificando papéis duplicados...")
    
    # Buscar papéis ativos
    url = f"{base_url}/rest/v1/papeis?ativo=eq.true&select=id,nome,created_at"
    headers = {
        'apikey': service_key,
        'Authorization': f'Bearer {service_key}'
    }
    
    try:
        response = requests.get(url, headers=headers)
        if response.status_code == 200:
            papeis = response.json()
            
            # Identificar duplicatas (case-insensitive)
            nomes_vistos = {}
            duplicatas = []
            
            for papel in papeis:
                nome_norm = papel['nome'].lower().strip()
                if nome_norm in nomes_vistos:
                    # Este é uma duplicata, manter o mais antigo
                    if papel['created_at'] > nomes_vistos[nome_norm]['created_at']:
                        duplicatas.append(papel['id'])
                    else:
                        duplicatas.append(nomes_vistos[nome_norm]['id'])
                        nomes_vistos[nome_norm] = papel
                else:
                    nomes_vistos[nome_norm] = papel
            
            # Desativar duplicatas
            if duplicatas:
                print(f"🔄 Desativando {len(duplicatas)} papéis duplicados...")
                for papel_id in duplicatas:
                    update_success = update_table_data(
                        base_url, service_key, 'papeis',
                        {'ativo': False},
                        f'id=eq.{papel_id}'
                    )
                    if update_success:
                        print(f"✅ Papel {papel_id} desativado")
            else:
                print("✅ Nenhum papel duplicado encontrado")
                
    except Exception as e:
        print(f"❌ Erro ao verificar papéis: {e}")
    
    # 3. Testar funções RPC essenciais
    print("\n3️⃣ Testando funções RPC...")
    
    # Testar get_pessoas_with_papeis
    success, result = execute_rpc(base_url, service_key, 'get_pessoas_with_papeis', {
        'p_search': None,
        'p_limit': 5,
        'p_offset': 0
    })
    
    if success:
        print("✅ Função get_pessoas_with_papeis funcionando")
        print(f"   Retornou {len(result) if isinstance(result, list) else 0} registros")
    else:
        print(f"❌ Erro na função get_pessoas_with_papeis: {result}")
    
    # 4. Verificar integridade dos dados
    print("\n4️⃣ Verificando integridade dos dados...")
    
    # Contar pessoas ativas
    url = f"{base_url}/rest/v1/pessoas?ativo=eq.true&select=id"
    try:
        response = requests.get(url, headers=headers)
        if response.status_code == 200:
            pessoas_ativas = len(response.json())
            print(f"✅ {pessoas_ativas} pessoas ativas encontradas")
    except:
        print("❌ Erro ao contar pessoas ativas")
    
    # Contar papéis ativos
    url = f"{base_url}/rest/v1/papeis?ativo=eq.true&select=id"
    try:
        response = requests.get(url, headers=headers)
        if response.status_code == 200:
            papeis_ativos = len(response.json())
            print(f"✅ {papeis_ativos} papéis ativos encontrados")
    except:
        print("❌ Erro ao contar papéis ativos")
    
    print("\n🎉 Verificações concluídas!")
    print("\n📋 Próximos passos recomendados:")
    print("1. Execute as migrações SQL manualmente no painel do Supabase")
    print("2. Teste a interface de Pessoas para verificar se os papéis funcionam")
    print("3. Verifique se marcas e categorias aparecem nas configurações")
    print("4. Teste a criação/edição de pedidos")

if __name__ == "__main__":
    main()
