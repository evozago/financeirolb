#!/usr/bin/env python3
"""
Script para corrigir problemas críticos identificados no financeirolb
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
        'service_role': os.getenv('SUPABASE_SERVICE_ROLE')
    }

def create_basic_roles(base_url, key):
    """Cria os papéis básicos necessários"""
    url = f"{base_url}/rest/v1/papeis"
    headers = {
        'apikey': key,
        'Authorization': f'Bearer {key}',
        'Content-Type': 'application/json',
        'Prefer': 'return=minimal'
    }
    
    basic_roles = [
        {'nome': 'Funcionário', 'ativo': True},
        {'nome': 'Vendedor', 'ativo': True},
        {'nome': 'Vendedora', 'ativo': True},
        {'nome': 'Fornecedor', 'ativo': True},
        {'nome': 'Cliente', 'ativo': True}
    ]
    
    created_count = 0
    for role in basic_roles:
        try:
            response = requests.post(url, headers=headers, json=role)
            if response.status_code in [200, 201]:
                print(f"✅ Papel '{role['nome']}' criado")
                created_count += 1
            elif 'duplicate' in response.text.lower() or 'unique' in response.text.lower():
                print(f"ℹ️ Papel '{role['nome']}' já existe")
            else:
                print(f"❌ Erro ao criar papel '{role['nome']}': {response.text}")
        except Exception as e:
            print(f"❌ Erro ao criar papel '{role['nome']}': {e}")
    
    return created_count

def activate_existing_roles(base_url, key):
    """Ativa papéis existentes que possam estar desativados"""
    # Primeiro, buscar todos os papéis
    url = f"{base_url}/rest/v1/papeis?select=id,nome,ativo"
    headers = {
        'apikey': key,
        'Authorization': f'Bearer {key}'
    }
    
    try:
        response = requests.get(url, headers=headers)
        if response.status_code == 200:
            papeis = response.json()
            
            # Ativar papéis desativados
            activated_count = 0
            for papel in papeis:
                if not papel['ativo']:
                    update_url = f"{base_url}/rest/v1/papeis?id=eq.{papel['id']}"
                    update_headers = {
                        'apikey': key,
                        'Authorization': f'Bearer {key}',
                        'Content-Type': 'application/json',
                        'Prefer': 'return=minimal'
                    }
                    
                    update_response = requests.patch(
                        update_url, 
                        headers=update_headers, 
                        json={'ativo': True}
                    )
                    
                    if update_response.status_code in [200, 204]:
                        print(f"✅ Papel '{papel['nome']}' ativado")
                        activated_count += 1
                    else:
                        print(f"❌ Erro ao ativar papel '{papel['nome']}'")
            
            return activated_count
        else:
            print(f"❌ Erro ao buscar papéis: {response.text}")
            return 0
    except Exception as e:
        print(f"❌ Erro ao ativar papéis: {e}")
        return 0

def create_entidades_corporativas_entries(base_url, key):
    """Garante que pessoas tenham entradas em entidades_corporativas"""
    # Buscar pessoas que não têm entrada em entidades_corporativas
    pessoas_url = f"{base_url}/rest/v1/pessoas?ativo=eq.true&select=id,nome,tipo_pessoa,cpf,cnpj,email,telefone,created_at,updated_at"
    headers = {
        'apikey': key,
        'Authorization': f'Bearer {key}'
    }
    
    try:
        response = requests.get(pessoas_url, headers=headers)
        if response.status_code != 200:
            print(f"❌ Erro ao buscar pessoas: {response.text}")
            return 0
        
        pessoas = response.json()
        print(f"📊 Encontradas {len(pessoas)} pessoas ativas")
        
        # Buscar entidades existentes
        entidades_url = f"{base_url}/rest/v1/entidades_corporativas?select=id"
        entidades_response = requests.get(entidades_url, headers=headers)
        
        if entidades_response.status_code == 200:
            entidades_existentes = {e['id'] for e in entidades_response.json()}
        else:
            entidades_existentes = set()
        
        # Criar entradas para pessoas que não têm
        created_count = 0
        for pessoa in pessoas:
            if pessoa['id'] not in entidades_existentes:
                entidade_data = {
                    'id': pessoa['id'],
                    'tipo_pessoa': pessoa['tipo_pessoa'],
                    'nome_razao_social': pessoa['nome'],
                    'cpf_cnpj': pessoa.get('cpf') or pessoa.get('cnpj'),
                    'email': pessoa.get('email'),
                    'telefone': pessoa.get('telefone'),
                    'ativo': True,
                    'created_at': pessoa['created_at'],
                    'updated_at': pessoa['updated_at']
                }
                
                create_headers = {
                    'apikey': key,
                    'Authorization': f'Bearer {key}',
                    'Content-Type': 'application/json',
                    'Prefer': 'return=minimal'
                }
                
                create_response = requests.post(
                    f"{base_url}/rest/v1/entidades_corporativas",
                    headers=create_headers,
                    json=entidade_data
                )
                
                if create_response.status_code in [200, 201]:
                    created_count += 1
                else:
                    print(f"❌ Erro ao criar entidade para {pessoa['nome']}: {create_response.text}")
        
        if created_count > 0:
            print(f"✅ {created_count} entidades corporativas criadas")
        else:
            print("ℹ️ Todas as pessoas já têm entidades corporativas")
        
        return created_count
        
    except Exception as e:
        print(f"❌ Erro ao criar entidades corporativas: {e}")
        return 0

def fix_pedidos_entidade_id(base_url, key):
    """Corrige entidade_id em pedidos_produtos"""
    # Buscar pedidos sem entidade_id mas com fornecedor_id
    url = f"{base_url}/rest/v1/pedidos_produtos?entidade_id=is.null&fornecedor_id=not.is.null&select=id,fornecedor_id"
    headers = {
        'apikey': key,
        'Authorization': f'Bearer {key}'
    }
    
    try:
        response = requests.get(url, headers=headers)
        if response.status_code == 200:
            pedidos = response.json()
            
            if not pedidos:
                print("✅ Todos os pedidos já têm entidade_id")
                return 0
            
            print(f"🔄 Corrigindo {len(pedidos)} pedidos sem entidade_id")
            
            fixed_count = 0
            for pedido in pedidos:
                update_url = f"{base_url}/rest/v1/pedidos_produtos?id=eq.{pedido['id']}"
                update_headers = {
                    'apikey': key,
                    'Authorization': f'Bearer {key}',
                    'Content-Type': 'application/json',
                    'Prefer': 'return=minimal'
                }
                
                update_response = requests.patch(
                    update_url,
                    headers=update_headers,
                    json={'entidade_id': pedido['fornecedor_id']}
                )
                
                if update_response.status_code in [200, 204]:
                    fixed_count += 1
                else:
                    print(f"❌ Erro ao corrigir pedido {pedido['id']}")
            
            print(f"✅ {fixed_count} pedidos corrigidos")
            return fixed_count
        else:
            print(f"❌ Erro ao buscar pedidos: {response.text}")
            return 0
    except Exception as e:
        print(f"❌ Erro ao corrigir pedidos: {e}")
        return 0

def main():
    """Função principal"""
    print("🚨 Corrigindo problemas críticos do financeirolb...")
    
    # Carregar variáveis de ambiente
    env_vars = load_env_file()
    
    if not env_vars['url'] or not env_vars['service_role']:
        print("❌ Credenciais do Supabase não encontradas.")
        sys.exit(1)
    
    base_url = env_vars['url']
    service_key = env_vars['service_role']
    
    print(f"🔗 Conectando ao Supabase: {base_url}")
    
    # 1. Criar/ativar papéis básicos
    print("\n1️⃣ Corrigindo papéis...")
    activated = activate_existing_roles(base_url, service_key)
    created = create_basic_roles(base_url, service_key)
    print(f"📊 {activated} papéis ativados, {created} papéis criados")
    
    # 2. Garantir entidades corporativas
    print("\n2️⃣ Garantindo entidades corporativas...")
    entidades_created = create_entidades_corporativas_entries(base_url, service_key)
    
    # 3. Corrigir pedidos
    print("\n3️⃣ Corrigindo pedidos...")
    pedidos_fixed = fix_pedidos_entidade_id(base_url, service_key)
    
    # 4. Verificação final
    print("\n4️⃣ Verificação final...")
    
    # Contar papéis ativos
    url = f"{base_url}/rest/v1/papeis?ativo=eq.true&select=id,nome"
    headers = {'apikey': service_key, 'Authorization': f'Bearer {service_key}'}
    
    try:
        response = requests.get(url, headers=headers)
        if response.status_code == 200:
            papeis_ativos = response.json()
            print(f"✅ {len(papeis_ativos)} papéis ativos:")
            for papel in papeis_ativos:
                print(f"   - {papel['nome']}")
    except:
        print("❌ Erro ao verificar papéis finais")
    
    print("\n🎉 Correções críticas concluídas!")
    print("\n📋 Resultados:")
    print(f"✅ Papéis corrigidos: {activated + created}")
    print(f"✅ Entidades criadas: {entidades_created}")
    print(f"✅ Pedidos corrigidos: {pedidos_fixed}")
    
    print("\n🔄 Próximos passos:")
    print("1. Teste a interface de Pessoas - os papéis agora devem aparecer")
    print("2. Execute a migração SQL completa quando possível")
    print("3. Teste criação/edição de pessoas com papéis")

if __name__ == "__main__":
    main()
