#!/usr/bin/env python3
import requests
import json
import os

# Configurações do Supabase
SUPABASE_URL = "https://mnxemxgcucfuoedqkygw.supabase.co"
SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1ueGVteGdjdWNmdW9lZHFreWd3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTM4OTY5MTYsImV4cCI6MjA2OTQ3MjkxNn0.JeDMKgnwRcK71KOIun8txqFFBWEHSKdPzIF8Qm9tw1o"

def execute_sql(sql_command):
    """Executa comando SQL via API REST do Supabase"""
    headers = {
        'apikey': SUPABASE_KEY,
        'Authorization': f'Bearer {SUPABASE_KEY}',
        'Content-Type': 'application/json',
        'Prefer': 'return=minimal'
    }
    
    # Usar a API RPC para executar SQL
    url = f"{SUPABASE_URL}/rest/v1/rpc/exec_sql"
    
    payload = {
        'sql': sql_command
    }
    
    response = requests.post(url, headers=headers, json=payload)
    return response

def apply_migration():
    """Aplica a migração de correção dos papéis"""
    
    # Primeiro, vamos criar a função exec_sql se não existir
    create_function_sql = """
    CREATE OR REPLACE FUNCTION exec_sql(sql text)
    RETURNS void
    LANGUAGE plpgsql
    SECURITY DEFINER
    AS $$
    BEGIN
        EXECUTE sql;
    END;
    $$;
    """
    
    print("Criando função exec_sql...")
    response = execute_sql(create_function_sql)
    print(f"Status: {response.status_code}")
    
    # Agora aplicar a migração
    migration_sql = """
    -- Remover constraints duplicadas se existirem
    DO $$ 
    BEGIN
        -- Remover constraint duplicada se existir
        IF EXISTS (SELECT 1 FROM information_schema.table_constraints 
                   WHERE constraint_name = 'entidade_papeis_entidade_id_papel_id_key' 
                   AND table_name = 'entidade_papeis') THEN
            ALTER TABLE entidade_papeis DROP CONSTRAINT entidade_papeis_entidade_id_papel_id_key;
        END IF;
        
        -- Remover constraint duplicada se existir
        IF EXISTS (SELECT 1 FROM information_schema.table_constraints 
                   WHERE constraint_name = 'entidade_papeis_unique' 
                   AND table_name = 'entidade_papeis') THEN
            ALTER TABLE entidade_papeis DROP CONSTRAINT entidade_papeis_unique;
        END IF;
    END $$;
    
    -- Remover duplicatas existentes
    DELETE FROM entidade_papeis 
    WHERE id NOT IN (
        SELECT MIN(id) 
        FROM entidade_papeis 
        GROUP BY entidade_id, papel_id
    );
    
    -- Criar índice único para evitar duplicatas futuras
    CREATE UNIQUE INDEX IF NOT EXISTS idx_entidade_papeis_unique 
    ON entidade_papeis(entidade_id, papel_id);
    
    -- Função para gerenciar papéis com segurança
    CREATE OR REPLACE FUNCTION manage_entity_role(
        p_entidade_id UUID,
        p_papel_id UUID,
        p_action TEXT DEFAULT 'add'
    )
    RETURNS JSON
    LANGUAGE plpgsql
    SECURITY DEFINER
    AS $$
    DECLARE
        result JSON;
        existing_id UUID;
    BEGIN
        -- Verificar se já existe
        SELECT id INTO existing_id 
        FROM entidade_papeis 
        WHERE entidade_id = p_entidade_id AND papel_id = p_papel_id;
        
        IF p_action = 'add' THEN
            IF existing_id IS NULL THEN
                INSERT INTO entidade_papeis (entidade_id, papel_id)
                VALUES (p_entidade_id, p_papel_id)
                RETURNING id INTO existing_id;
                
                result := json_build_object(
                    'success', true,
                    'action', 'created',
                    'id', existing_id
                );
            ELSE
                result := json_build_object(
                    'success', true,
                    'action', 'already_exists',
                    'id', existing_id
                );
            END IF;
        ELSIF p_action = 'remove' THEN
            IF existing_id IS NOT NULL THEN
                DELETE FROM entidade_papeis WHERE id = existing_id;
                result := json_build_object(
                    'success', true,
                    'action', 'removed',
                    'id', existing_id
                );
            ELSE
                result := json_build_object(
                    'success', false,
                    'action', 'not_found',
                    'message', 'Role assignment not found'
                );
            END IF;
        END IF;
        
        RETURN result;
    END;
    $$;
    
    -- Função para buscar vendedoras
    CREATE OR REPLACE FUNCTION get_salespersons()
    RETURNS TABLE (
        id UUID,
        nome TEXT,
        email TEXT,
        telefone TEXT,
        is_vendedora BOOLEAN
    )
    LANGUAGE plpgsql
    SECURITY DEFINER
    AS $$
    BEGIN
        RETURN QUERY
        SELECT 
            p.id,
            p.nome,
            p.email,
            p.telefone,
            CASE WHEN ep.id IS NOT NULL THEN true ELSE false END as is_vendedora
        FROM pessoas p
        LEFT JOIN entidade_papeis ep ON p.id = ep.entidade_id
        LEFT JOIN papeis pa ON ep.papel_id = pa.id AND pa.nome = 'vendedora'
        ORDER BY p.nome;
    END;
    $$;
    """
    
    print("Aplicando migração...")
    response = execute_sql(migration_sql)
    print(f"Status: {response.status_code}")
    print(f"Response: {response.text}")
    
    if response.status_code == 200:
        print("✅ Migração aplicada com sucesso!")
        return True
    else:
        print(f"❌ Erro ao aplicar migração: {response.text}")
        return False

if __name__ == "__main__":
    success = apply_migration()
    if success:
        print("Sistema de papéis corrigido!")
    else:
        print("Falha ao corrigir sistema de papéis")
