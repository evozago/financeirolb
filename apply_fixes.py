#!/usr/bin/env python3
"""
Script para aplicar as correções identificadas no projeto financeirolb
Executa as migrações SQL diretamente no banco de dados Supabase
"""

import os
import sys
import psycopg2
from dotenv import load_dotenv

def load_env_file():
    """Carrega as variáveis de ambiente do arquivo .env"""
    load_dotenv('.env')
    
    # Tentar também o env.local
    if os.path.exists('env.local'):
        load_dotenv('env.local')
    
    return {
        'url': os.getenv('VITE_SUPABASE_URL'),
        'key': os.getenv('VITE_SUPABASE_ANON_KEY'),
        'db_url': os.getenv('DATABASE_URL'),
        'db_password': os.getenv('SUPABASE_DB_PASSWORD')
    }

def get_connection_string(env_vars):
    """Constrói a string de conexão PostgreSQL"""
    if env_vars['db_url']:
        return env_vars['db_url']
    
    if env_vars['url'] and env_vars['db_password']:
        # Extrair informações da URL do Supabase
        url = env_vars['url'].replace('https://', '')
        project_id = url.split('.')[0]
        
        return f"postgresql://postgres:{env_vars['db_password']}@db.{project_id}.supabase.co:5432/postgres"
    
    return None

def execute_migration(connection_string, migration_file):
    """Executa um arquivo de migração SQL"""
    try:
        with open(migration_file, 'r', encoding='utf-8') as f:
            sql_content = f.read()
        
        print(f"Executando migração: {migration_file}")
        
        conn = psycopg2.connect(connection_string)
        conn.autocommit = True
        
        with conn.cursor() as cursor:
            cursor.execute(sql_content)
            print("✅ Migração executada com sucesso!")
        
        conn.close()
        return True
        
    except Exception as e:
        print(f"❌ Erro ao executar migração {migration_file}: {str(e)}")
        return False

def main():
    """Função principal"""
    print("🔧 Aplicando correções no projeto financeirolb...")
    
    # Carregar variáveis de ambiente
    env_vars = load_env_file()
    
    # Construir string de conexão
    connection_string = get_connection_string(env_vars)
    
    if not connection_string:
        print("❌ Não foi possível obter as credenciais do banco de dados.")
        print("Verifique se as variáveis VITE_SUPABASE_URL e SUPABASE_DB_PASSWORD estão definidas.")
        sys.exit(1)
    
    print(f"🔗 Conectando ao banco de dados...")
    
    # Executar a migração principal
    migration_file = 'supabase/migrations/20250927170000_fix_all_identified_issues.sql'
    
    if not os.path.exists(migration_file):
        print(f"❌ Arquivo de migração não encontrado: {migration_file}")
        sys.exit(1)
    
    success = execute_migration(connection_string, migration_file)
    
    if success:
        print("🎉 Todas as correções foram aplicadas com sucesso!")
        print("\n📋 Resumo das correções aplicadas:")
        print("✅ Persistência de papéis corrigida")
        print("✅ Migração fornecedor_id -> entidade_id em pedidos")
        print("✅ Marcas e categorias usando entidade_id")
        print("✅ Padronização de papéis com índice único")
        print("✅ Views e consultas atualizadas")
    else:
        print("❌ Falha ao aplicar as correções.")
        sys.exit(1)

if __name__ == "__main__":
    main()
