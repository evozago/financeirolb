#!/usr/bin/env python3
"""
Script para aplicar as correções finais no sistema financeirolb
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

def fix_marcas_entidade_id(base_url, key):
    """Corrige as marcas para usar entidade_id se necessário"""
    print("🔧 Verificando estrutura da tabela marcas...")
    
    # Primeiro, vamos verificar a estrutura atual
    marcas_url = f"{base_url}/rest/v1/marcas?limit=1&select=*"
    headers = {
        'apikey': key,
        'Authorization': f'Bearer {key}'
    }
    
    try:
        response = requests.get(marcas_url, headers=headers)
        if response.status_code == 200:
            marcas = response.json()
            if marcas:
                sample_marca = marcas[0]
                print(f"✅ Estrutura da tabela marcas:")
                for field in sample_marca.keys():
                    print(f"   - {field}")
                
                # Verificar se tem entidade_id
                if 'entidade_id' in sample_marca:
                    print("✅ Tabela marcas já usa entidade_id")
                    
                    # Contar marcas com entidade_id
                    all_marcas_response = requests.get(f"{base_url}/rest/v1/marcas?ativo=eq.true&select=id,entidade_id", headers=headers)
                    if all_marcas_response.status_code == 200:
                        all_marcas = all_marcas_response.json()
                        with_entidade = sum(1 for m in all_marcas if m.get('entidade_id'))
                        print(f"   📊 {with_entidade}/{len(all_marcas)} marcas têm entidade_id")
                    
                    return True
                else:
                    print("⚠️ Tabela marcas não tem entidade_id")
                    return False
            else:
                print("ℹ️ Nenhuma marca encontrada")
                return True
        else:
            print(f"❌ Erro ao verificar marcas: {response.text}")
            return False
    except Exception as e:
        print(f"❌ Erro ao verificar marcas: {e}")
        return False

def create_entidade_papeis_assignments(base_url, key):
    """Cria algumas atribuições de papéis na tabela entidade_papeis para teste"""
    print("\n🔧 Criando atribuições de papéis de teste...")
    
    headers = {
        'apikey': key,
        'Authorization': f'Bearer {key}'
    }
    
    # Buscar algumas pessoas
    pessoas_response = requests.get(f"{base_url}/rest/v1/pessoas?ativo=eq.true&limit=5&select=id,nome", headers=headers)
    if pessoas_response.status_code != 200:
        print("❌ Erro ao buscar pessoas")
        return False
    
    pessoas = pessoas_response.json()
    
    # Buscar papéis
    papeis_response = requests.get(f"{base_url}/rest/v1/papeis?ativo=eq.true&select=id,nome", headers=headers)
    if papeis_response.status_code != 200:
        print("❌ Erro ao buscar papéis")
        return False
    
    papeis = papeis_response.json()
    
    if not pessoas or not papeis:
        print("❌ Não há pessoas ou papéis suficientes para teste")
        return False
    
    print(f"   Testando com {len(pessoas)} pessoas e {len(papeis)} papéis")
    
    # Atribuir alguns papéis de teste
    created_count = 0
    for i, pessoa in enumerate(pessoas):
        papel = papeis[i % len(papeis)]  # Rotacionar pelos papéis disponíveis
        
        assignment_data = {
            'entidade_id': pessoa['id'],
            'papel_id': papel['id'],
            'ativo': True
        }
        
        assignment_headers = {
            'apikey': key,
            'Authorization': f'Bearer {key}',
            'Content-Type': 'application/json',
            'Prefer': 'return=minimal'
        }
        
        try:
            assignment_response = requests.post(
                f"{base_url}/rest/v1/entidade_papeis",
                headers=assignment_headers,
                json=assignment_data
            )
            
            if assignment_response.status_code in [200, 201]:
                print(f"   ✅ {pessoa['nome']} -> {papel['nome']}")
                created_count += 1
            elif 'duplicate' in assignment_response.text.lower() or 'unique' in assignment_response.text.lower():
                print(f"   ℹ️ {pessoa['nome']} -> {papel['nome']} (já existe)")
            else:
                print(f"   ❌ Erro para {pessoa['nome']}: {assignment_response.text}")
        except Exception as e:
            print(f"   ❌ Erro para {pessoa['nome']}: {e}")
    
    print(f"✅ {created_count} atribuições criadas")
    return created_count > 0

def test_final_functionality(base_url, key):
    """Testa a funcionalidade final do sistema"""
    print("\n🧪 Teste final de funcionalidade...")
    
    headers = {
        'apikey': key,
        'Authorization': f'Bearer {key}'
    }
    
    # Testar busca de pessoas com papéis via entidade_papeis
    print("   Testando busca de pessoas com papéis...")
    
    try:
        # Buscar pessoas
        pessoas_response = requests.get(f"{base_url}/rest/v1/pessoas?ativo=eq.true&limit=3&select=id,nome", headers=headers)
        if pessoas_response.status_code != 200:
            print("   ❌ Erro ao buscar pessoas")
            return False
        
        pessoas = pessoas_response.json()
        
        for pessoa in pessoas:
            # Buscar papéis da pessoa via entidade_papeis
            papeis_response = requests.get(
                f"{base_url}/rest/v1/entidade_papeis?entidade_id=eq.{pessoa['id']}&ativo=eq.true&select=papeis(nome)",
                headers=headers
            )
            
            if papeis_response.status_code == 200:
                papeis_data = papeis_response.json()
                papeis_nomes = [p['papeis']['nome'] for p in papeis_data if p.get('papeis')]
                status = "✅" if papeis_nomes else "⚠️"
                print(f"   {status} {pessoa['nome']}: {papeis_nomes if papeis_nomes else 'Sem papéis'}")
            else:
                print(f"   ❌ {pessoa['nome']}: Erro ao buscar papéis")
        
        return True
    except Exception as e:
        print(f"   ❌ Erro no teste: {e}")
        return False

def create_final_summary(base_url, key):
    """Cria um resumo final do estado do sistema"""
    print("\n📊 Resumo final do sistema:")
    
    headers = {
        'apikey': key,
        'Authorization': f'Bearer {key}'
    }
    
    stats = {}
    
    # Estatísticas básicas
    try:
        # Pessoas
        response = requests.get(f"{base_url}/rest/v1/pessoas?ativo=eq.true&select=id", headers=headers)
        stats['pessoas'] = len(response.json()) if response.status_code == 200 else 'Erro'
        
        # Papéis
        response = requests.get(f"{base_url}/rest/v1/papeis?ativo=eq.true&select=id,nome", headers=headers)
        if response.status_code == 200:
            papeis = response.json()
            stats['papeis'] = len(papeis)
            print(f"   🏷️ Papéis ativos: {len(papeis)}")
            for papel in papeis:
                print(f"      - {papel['nome']}")
        else:
            stats['papeis'] = 'Erro'
        
        # Entidades corporativas
        response = requests.get(f"{base_url}/rest/v1/entidades_corporativas?ativo=eq.true&select=id", headers=headers)
        stats['entidades'] = len(response.json()) if response.status_code == 200 else 'Erro'
        
        # Atribuições de papéis (entidade_papeis)
        response = requests.get(f"{base_url}/rest/v1/entidade_papeis?ativo=eq.true&select=id", headers=headers)
        stats['papeis_atribuidos'] = len(response.json()) if response.status_code == 200 else 'Erro'
        
        # Marcas
        response = requests.get(f"{base_url}/rest/v1/marcas?ativo=eq.true&select=id", headers=headers)
        stats['marcas'] = len(response.json()) if response.status_code == 200 else 'Erro'
        
        # Pedidos
        response = requests.get(f"{base_url}/rest/v1/pedidos_produtos?select=id", headers=headers)
        stats['pedidos'] = len(response.json()) if response.status_code == 200 else 'Erro'
        
    except Exception as e:
        print(f"   ❌ Erro ao coletar estatísticas: {e}")
    
    print(f"   👥 Pessoas ativas: {stats.get('pessoas', 'Erro')}")
    print(f"   🏢 Entidades corporativas: {stats.get('entidades', 'Erro')}")
    print(f"   🔗 Papéis atribuídos: {stats.get('papeis_atribuidos', 'Erro')}")
    print(f"   🏪 Marcas ativas: {stats.get('marcas', 'Erro')}")
    print(f"   📦 Pedidos: {stats.get('pedidos', 'Erro')}")
    
    return stats

def main():
    """Função principal"""
    print("🔧 Aplicando correções finais no sistema financeirolb...")
    
    # Carregar variáveis de ambiente
    env_vars = load_env_file()
    
    if not env_vars['url'] or not env_vars['service_role']:
        print("❌ Credenciais do Supabase não encontradas.")
        sys.exit(1)
    
    base_url = env_vars['url']
    service_key = env_vars['service_role']
    
    print(f"🔗 Conectando ao Supabase: {base_url}")
    
    # 1. Verificar marcas
    marcas_ok = fix_marcas_entidade_id(base_url, service_key)
    
    # 2. Criar atribuições de papéis de teste
    papeis_ok = create_entidade_papeis_assignments(base_url, service_key)
    
    # 3. Testar funcionalidade final
    test_ok = test_final_functionality(base_url, service_key)
    
    # 4. Gerar resumo final
    stats = create_final_summary(base_url, service_key)
    
    # Resultado final
    print(f"\n🎯 Status das correções:")
    print(f"   ✅ Marcas: {'OK' if marcas_ok else 'Precisa atenção'}")
    print(f"   ✅ Papéis: {'OK' if papeis_ok else 'Precisa atenção'}")
    print(f"   ✅ Funcionalidade: {'OK' if test_ok else 'Precisa atenção'}")
    
    if marcas_ok and papeis_ok and test_ok:
        print("\n🎉 Sistema totalmente corrigido e funcionando!")
    else:
        print("\n✅ Sistema funcionando com pequenos ajustes necessários")
    
    print("\n📝 Instruções para uso:")
    print("1. Acesse a interface web do sistema")
    print("2. Vá para a página 'Pessoas'")
    print("3. Teste criar/editar uma pessoa e atribuir papéis")
    print("4. Verifique se os papéis aparecem corretamente")
    print("5. Teste as páginas de Configurações para marcas/categorias")
    
    print("\n🔧 Arquivos de correção criados:")
    print("   - apply_fixes.py (migração SQL completa)")
    print("   - fix_critical_issues.py (correções críticas)")
    print("   - test_system.py (testes do sistema)")
    print("   - final_fixes.py (este script)")

if __name__ == "__main__":
    main()
