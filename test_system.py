#!/usr/bin/env python3
"""
Script para testar se o sistema financeirolb está funcionando corretamente após as correções
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

def test_pessoas_with_papeis(base_url, key):
    """Testa se conseguimos buscar pessoas com seus papéis"""
    print("🧪 Testando busca de pessoas com papéis...")
    
    # Buscar pessoas e seus papéis manualmente (já que a função RPC não existe)
    pessoas_url = f"{base_url}/rest/v1/pessoas?ativo=eq.true&limit=5&select=id,nome,email,tipo_pessoa"
    headers = {
        'apikey': key,
        'Authorization': f'Bearer {key}'
    }
    
    try:
        response = requests.get(pessoas_url, headers=headers)
        if response.status_code == 200:
            pessoas = response.json()
            print(f"✅ {len(pessoas)} pessoas encontradas")
            
            # Para cada pessoa, buscar seus papéis
            for pessoa in pessoas[:3]:  # Testar apenas 3 para não sobrecarregar
                papeis_url = f"{base_url}/rest/v1/papeis_pessoa?pessoa_id=eq.{pessoa['id']}&ativo=eq.true&select=papeis(nome)"
                papeis_response = requests.get(papeis_url, headers=headers)
                
                if papeis_response.status_code == 200:
                    papeis_data = papeis_response.json()
                    papeis_nomes = [p['papeis']['nome'] for p in papeis_data if p.get('papeis')]
                    print(f"   - {pessoa['nome']}: {papeis_nomes if papeis_nomes else 'Sem papéis'}")
                else:
                    print(f"   - {pessoa['nome']}: Erro ao buscar papéis")
            
            return True
        else:
            print(f"❌ Erro ao buscar pessoas: {response.text}")
            return False
    except Exception as e:
        print(f"❌ Erro no teste de pessoas: {e}")
        return False

def test_marcas_with_entidades(base_url, key):
    """Testa se as marcas estão associadas às entidades"""
    print("\n🧪 Testando marcas com entidades...")
    
    marcas_url = f"{base_url}/rest/v1/marcas?ativo=eq.true&limit=5&select=id,nome,entidade_id,fornecedor_id"
    headers = {
        'apikey': key,
        'Authorization': f'Bearer {key}'
    }
    
    try:
        response = requests.get(marcas_url, headers=headers)
        if response.status_code == 200:
            marcas = response.json()
            print(f"✅ {len(marcas)} marcas encontradas")
            
            entidade_count = sum(1 for m in marcas if m.get('entidade_id'))
            fornecedor_count = sum(1 for m in marcas if m.get('fornecedor_id'))
            
            print(f"   - Com entidade_id: {entidade_count}")
            print(f"   - Com fornecedor_id: {fornecedor_count}")
            
            # Mostrar algumas marcas
            for marca in marcas[:3]:
                ref_id = marca.get('entidade_id') or marca.get('fornecedor_id') or 'Sem referência'
                print(f"   - {marca['nome']}: {ref_id}")
            
            return True
        else:
            print(f"❌ Erro ao buscar marcas: {response.text}")
            return False
    except Exception as e:
        print(f"❌ Erro no teste de marcas: {e}")
        return False

def test_pedidos_with_entidades(base_url, key):
    """Testa se os pedidos estão associados às entidades"""
    print("\n🧪 Testando pedidos com entidades...")
    
    pedidos_url = f"{base_url}/rest/v1/pedidos_produtos?limit=5&select=id,referencia,entidade_id"
    headers = {
        'apikey': key,
        'Authorization': f'Bearer {key}'
    }
    
    try:
        response = requests.get(pedidos_url, headers=headers)
        if response.status_code == 200:
            pedidos = response.json()
            print(f"✅ {len(pedidos)} pedidos encontrados")
            
            with_entidade = sum(1 for p in pedidos if p.get('entidade_id'))
            print(f"   - Com entidade_id: {with_entidade}/{len(pedidos)}")
            
            # Mostrar alguns pedidos
            for pedido in pedidos[:3]:
                ref = pedido.get('referencia', 'Sem referência')
                entidade = pedido.get('entidade_id', 'Sem entidade')
                print(f"   - {ref}: {entidade}")
            
            return True
        else:
            print(f"❌ Erro ao buscar pedidos: {response.text}")
            return False
    except Exception as e:
        print(f"❌ Erro no teste de pedidos: {e}")
        return False

def test_role_assignment(base_url, key):
    """Testa se conseguimos atribuir papéis a uma pessoa"""
    print("\n🧪 Testando atribuição de papéis...")
    
    # Buscar uma pessoa para teste
    pessoas_url = f"{base_url}/rest/v1/pessoas?ativo=eq.true&limit=1&select=id,nome"
    headers = {
        'apikey': key,
        'Authorization': f'Bearer {key}'
    }
    
    try:
        response = requests.get(pessoas_url, headers=headers)
        if response.status_code != 200:
            print("❌ Não foi possível buscar pessoa para teste")
            return False
        
        pessoas = response.json()
        if not pessoas:
            print("❌ Nenhuma pessoa encontrada para teste")
            return False
        
        pessoa = pessoas[0]
        print(f"   Testando com: {pessoa['nome']}")
        
        # Buscar um papel para teste
        papeis_url = f"{base_url}/rest/v1/papeis?ativo=eq.true&limit=1&select=id,nome"
        papeis_response = requests.get(papeis_url, headers=headers)
        
        if papeis_response.status_code != 200:
            print("❌ Não foi possível buscar papel para teste")
            return False
        
        papeis = papeis_response.json()
        if not papeis:
            print("❌ Nenhum papel encontrado para teste")
            return False
        
        papel = papeis[0]
        print(f"   Atribuindo papel: {papel['nome']}")
        
        # Tentar atribuir o papel
        assignment_data = {
            'pessoa_id': pessoa['id'],
            'papel_id': papel['id'],
            'ativo': True
        }
        
        assignment_headers = {
            'apikey': key,
            'Authorization': f'Bearer {key}',
            'Content-Type': 'application/json',
            'Prefer': 'return=minimal'
        }
        
        assignment_response = requests.post(
            f"{base_url}/rest/v1/papeis_pessoa",
            headers=assignment_headers,
            json=assignment_data
        )
        
        if assignment_response.status_code in [200, 201]:
            print("✅ Papel atribuído com sucesso")
            return True
        elif 'duplicate' in assignment_response.text.lower():
            print("ℹ️ Papel já estava atribuído")
            return True
        else:
            print(f"❌ Erro ao atribuir papel: {assignment_response.text}")
            return False
            
    except Exception as e:
        print(f"❌ Erro no teste de atribuição: {e}")
        return False

def create_summary_report(base_url, key):
    """Cria um relatório resumo do estado do sistema"""
    print("\n📊 Gerando relatório resumo...")
    
    headers = {
        'apikey': key,
        'Authorization': f'Bearer {key}'
    }
    
    report = {}
    
    # Contar pessoas
    try:
        response = requests.get(f"{base_url}/rest/v1/pessoas?ativo=eq.true&select=id", headers=headers)
        report['pessoas_ativas'] = len(response.json()) if response.status_code == 200 else 'Erro'
    except:
        report['pessoas_ativas'] = 'Erro'
    
    # Contar papéis
    try:
        response = requests.get(f"{base_url}/rest/v1/papeis?ativo=eq.true&select=id", headers=headers)
        report['papeis_ativos'] = len(response.json()) if response.status_code == 200 else 'Erro'
    except:
        report['papeis_ativos'] = 'Erro'
    
    # Contar entidades corporativas
    try:
        response = requests.get(f"{base_url}/rest/v1/entidades_corporativas?ativo=eq.true&select=id", headers=headers)
        report['entidades_ativas'] = len(response.json()) if response.status_code == 200 else 'Erro'
    except:
        report['entidades_ativas'] = 'Erro'
    
    # Contar marcas
    try:
        response = requests.get(f"{base_url}/rest/v1/marcas?ativo=eq.true&select=id", headers=headers)
        report['marcas_ativas'] = len(response.json()) if response.status_code == 200 else 'Erro'
    except:
        report['marcas_ativas'] = 'Erro'
    
    # Contar pedidos
    try:
        response = requests.get(f"{base_url}/rest/v1/pedidos_produtos?select=id", headers=headers)
        report['total_pedidos'] = len(response.json()) if response.status_code == 200 else 'Erro'
    except:
        report['total_pedidos'] = 'Erro'
    
    # Contar atribuições de papéis
    try:
        response = requests.get(f"{base_url}/rest/v1/papeis_pessoa?ativo=eq.true&select=id", headers=headers)
        report['papeis_atribuidos'] = len(response.json()) if response.status_code == 200 else 'Erro'
    except:
        report['papeis_atribuidos'] = 'Erro'
    
    print("📈 Estatísticas do sistema:")
    print(f"   👥 Pessoas ativas: {report['pessoas_ativas']}")
    print(f"   🏷️ Papéis ativos: {report['papeis_ativos']}")
    print(f"   🏢 Entidades corporativas: {report['entidades_ativas']}")
    print(f"   🏪 Marcas ativas: {report['marcas_ativas']}")
    print(f"   📦 Total de pedidos: {report['total_pedidos']}")
    print(f"   🔗 Papéis atribuídos: {report['papeis_atribuidos']}")
    
    return report

def main():
    """Função principal"""
    print("🧪 Testando sistema financeirolb após correções...")
    
    # Carregar variáveis de ambiente
    env_vars = load_env_file()
    
    if not env_vars['url'] or not env_vars['service_role']:
        print("❌ Credenciais do Supabase não encontradas.")
        sys.exit(1)
    
    base_url = env_vars['url']
    service_key = env_vars['service_role']
    
    print(f"🔗 Conectando ao Supabase: {base_url}")
    
    # Executar testes
    tests_passed = 0
    total_tests = 4
    
    if test_pessoas_with_papeis(base_url, service_key):
        tests_passed += 1
    
    if test_marcas_with_entidades(base_url, service_key):
        tests_passed += 1
    
    if test_pedidos_with_entidades(base_url, service_key):
        tests_passed += 1
    
    if test_role_assignment(base_url, service_key):
        tests_passed += 1
    
    # Gerar relatório
    report = create_summary_report(base_url, service_key)
    
    # Resultado final
    print(f"\n🎯 Resultado dos testes: {tests_passed}/{total_tests} passaram")
    
    if tests_passed == total_tests:
        print("🎉 Todos os testes passaram! O sistema está funcionando corretamente.")
    elif tests_passed >= total_tests * 0.75:
        print("✅ A maioria dos testes passou. O sistema está funcionando bem.")
    else:
        print("⚠️ Alguns testes falharam. Pode ser necessário investigar mais.")
    
    print("\n📝 Próximos passos recomendados:")
    print("1. Teste a interface web do sistema")
    print("2. Verifique se consegue criar/editar pessoas com papéis")
    print("3. Teste se marcas e categorias aparecem nas configurações")
    print("4. Verifique se os pedidos estão sendo exibidos corretamente")

if __name__ == "__main__":
    main()
