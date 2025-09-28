#!/usr/bin/env python3
"""
Script para atualizar referências das tabelas antigas (entidades, fornecedores) 
para a nova estrutura unificada usando a tabela pessoas.
"""

import os
import re
import glob

def update_file_references(file_path):
    """Atualiza as referências em um arquivo específico."""
    with open(file_path, 'r', encoding='utf-8') as f:
        content = f.read()
    
    original_content = content
    
    # Substituições para queries que usavam 'fornecedores'
    # Manter apenas as que fazem sentido migrar para 'pessoas'
    content = re.sub(
        r"\.from\(['\"]fornecedores['\"]\)",
        ".from('pessoas')",
        content
    )
    
    # Substituições para queries que usavam 'entidades' (não entidades_corporativas)
    content = re.sub(
        r"\.from\(['\"]entidades['\"]\)(?!\s*\.)",
        ".from('pessoas')",
        content
    )
    
    # Atualizar comentários que mencionam as tabelas antigas
    content = re.sub(
        r"// Load.*from fornecedores",
        "// Load from pessoas (unified table)",
        content
    )
    
    content = re.sub(
        r"Load existing employees from fornecedores",
        "Load existing employees from pessoas",
        content
    )
    
    # Atualizar seletores que precisam incluir categorias
    # Para queries que buscavam fornecedores, agora precisam filtrar por categoria
    content = re.sub(
        r"(\.from\(['\"]pessoas['\"]\)\s*\.select\([^)]+\))",
        r"\1.contains('categorias', ['fornecedor'])",
        content
    )
    
    # Se houve mudanças, salvar o arquivo
    if content != original_content:
        with open(file_path, 'w', encoding='utf-8') as f:
            f.write(content)
        print(f"Atualizado: {file_path}")
        return True
    
    return False

def main():
    """Função principal para atualizar todos os arquivos."""
    src_dir = "src"
    
    # Encontrar todos os arquivos TypeScript/JavaScript
    file_patterns = [
        "**/*.ts",
        "**/*.tsx", 
        "**/*.js",
        "**/*.jsx"
    ]
    
    updated_files = []
    
    for pattern in file_patterns:
        files = glob.glob(os.path.join(src_dir, pattern), recursive=True)
        
        for file_path in files:
            if update_file_references(file_path):
                updated_files.append(file_path)
    
    print(f"\nTotal de arquivos atualizados: {len(updated_files)}")
    
    if updated_files:
        print("\nArquivos modificados:")
        for file_path in updated_files:
            print(f"  - {file_path}")
    
    print("\nATENÇÃO: Algumas queries podem precisar de ajustes manuais para:")
    print("1. Filtrar por categorias específicas (fornecedor, funcionario, vendedora)")
    print("2. Acessar dados específicos dos campos JSONB (dados_fornecedor, etc.)")
    print("3. Usar joins com entidade_papeis quando necessário")

if __name__ == "__main__":
    main()
