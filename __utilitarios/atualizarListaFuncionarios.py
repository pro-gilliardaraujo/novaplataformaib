#!/usr/bin/env python3
"""
Script para atualizar a tabela 'funcionarios' no Supabase
com os dados do arquivo 'funcionarios.csv'

Requisitos:
pip install supabase python-dotenv

Uso:
python atualizarListaFuncionarios.py
"""

import os
import sys
import csv
from typing import List, Dict, Any
from supabase import create_client, Client
from dotenv import load_dotenv

# Carrega variáveis de ambiente do arquivo .env.local da raiz do projeto
# Obtém o diretório raiz do projeto (um nível acima da pasta __utilitarios)
project_root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
env_path = os.path.join(project_root, '.env.local')
load_dotenv(env_path)

def get_supabase_client() -> Client:
    """Cria e retorna cliente do Supabase"""
    
    # Configurações do Supabase
    url = os.getenv('NEXT_PUBLIC_SUPABASE_URL')
    service_key = os.getenv('SUPABASE_SERVICE_ROLE_KEY')
    
    if not url:
        print("❌ ERRO: NEXT_PUBLIC_SUPABASE_URL não encontrada nas variáveis de ambiente")
        print("Configure as variáveis de ambiente ou crie um arquivo .env.local com:")
        print("NEXT_PUBLIC_SUPABASE_URL=sua_url_aqui")
        print("SUPABASE_SERVICE_ROLE_KEY=sua_service_key_aqui")
        sys.exit(1)
    
    if not service_key:
        print("❌ ERRO: SUPABASE_SERVICE_ROLE_KEY não encontrada nas variáveis de ambiente")
        print("Configure as variáveis de ambiente ou crie um arquivo .env.local com:")
        print("NEXT_PUBLIC_SUPABASE_URL=sua_url_aqui")
        print("SUPABASE_SERVICE_ROLE_KEY=sua_service_key_aqui")
        sys.exit(1)
    
    return create_client(url, service_key)

def ler_funcionarios_csv() -> List[Dict[str, Any]]:
    """Lê o arquivo funcionarios.csv e retorna lista de funcionários"""
    
    arquivo_csv = os.path.join(os.path.dirname(__file__), 'funcionarios.CSV')
    
    if not os.path.exists(arquivo_csv):
        print(f"❌ ERRO: Arquivo {arquivo_csv} não encontrado")
        sys.exit(1)
    
    funcionarios = []
    
    try:
        # Tenta várias codificações comuns
        encodings = ['utf-8', 'windows-1252', 'iso-8859-1', 'cp1252']
        file_content = None
        used_encoding = None
        
        for encoding in encodings:
            try:
                with open(arquivo_csv, 'r', encoding=encoding) as file:
                    file_content = file.read()
                    used_encoding = encoding
                    break
            except UnicodeDecodeError:
                continue
        
        if file_content is None:
            raise Exception("Não foi possível decodificar o arquivo CSV com nenhuma codificação testada")
        
        print(f"📝 Arquivo CSV lido com codificação: {used_encoding}")
        
        # Agora processa o conteúdo
        from io import StringIO
        file = StringIO(file_content)
        
        # Detecta o delimitador (pode ser ; ou ,)
        sample = file.read(1024)
        file.seek(0)
        
        if ';' in sample:
            delimiter = ';'
        else:
            delimiter = ','
        
        reader = csv.DictReader(file, delimiter=delimiter)
        
        for i, row in enumerate(reader, 1):
            # Limpa espaços em branco
            funcionario = {
                'nome': row['nome'].strip() if row['nome'] else '',
                'cpf': row['cpf'].strip() if row['cpf'] else '',
                'funcao': row['funcao'].strip() if row['funcao'] else '',
                'ativo': row['ativo'].strip().upper() == 'SIM' if row['ativo'] else False,
                'unidade': row['unidade'].strip() if row['unidade'] else ''
            }
            
            # Valida dados obrigatórios
            if not funcionario['nome']:
                print(f"⚠️  Linha {i}: Nome vazio, pulando...")
                continue
            
            if not funcionario['cpf']:
                print(f"⚠️  Linha {i}: CPF vazio para {funcionario['nome']}, pulando...")
                continue
            
            funcionarios.append(funcionario)
                
    except Exception as e:
        print(f"❌ ERRO ao ler arquivo CSV: {e}")
        sys.exit(1)
    
    return funcionarios

def verificar_tabela_funcionarios(supabase: Client):
    """Verifica se a tabela funcionarios existe"""
    
    print("🔍 Verificando se a tabela 'funcionarios' existe...")
    
    try:
        # Tenta fazer uma query simples para verificar se a tabela existe
        result = supabase.table('funcionarios').select('id').limit(1).execute()
        print("✅ Tabela 'funcionarios' encontrada!")
        return True
    except Exception as e:
        print(f"⚠️  Tabela 'funcionarios' não encontrada: {e}")
        
        # SQL para criar a tabela
        sql_create_table = """
CREATE TABLE funcionarios (
    id BIGSERIAL PRIMARY KEY,
    nome TEXT NOT NULL,
    cpf TEXT UNIQUE NOT NULL,
    funcao TEXT,
    ativo BOOLEAN DEFAULT true,
    unidade TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para performance
CREATE INDEX idx_funcionarios_cpf ON funcionarios(cpf);
CREATE INDEX idx_funcionarios_nome ON funcionarios(nome);
CREATE INDEX idx_funcionarios_ativo ON funcionarios(ativo);
        """
        
        print("\n📝 EXECUTE O SQL ABAIXO NO SUPABASE SQL EDITOR:")
        print("="*60)
        print(sql_create_table)
        print("="*60)
        
        resposta = input("\n✅ Após executar o SQL acima, pressione ENTER para continuar ou 'q' para sair: ").strip().lower()
        if resposta == 'q':
            print("❌ Operação cancelada.")
            sys.exit(0)
            
        return False

def atualizar_funcionarios(supabase: Client, funcionarios: List[Dict[str, Any]]):
    """Atualiza a tabela funcionarios com os dados do CSV"""
    
    print(f"📊 Processando {len(funcionarios)} funcionários...")
    
    sucessos = 0
    erros = 0
    atualizados = 0
    inseridos = 0
    
    for i, funcionario in enumerate(funcionarios, 1):
        try:
            # Primeiro, tenta buscar se o funcionário já existe (por CPF)
            result = supabase.table('funcionarios').select('id').eq('cpf', funcionario['cpf']).execute()
            
            if result.data and len(result.data) > 0:
                # Funcionário existe, atualiza (sem mexer em timestamps)
                funcionario_update = {
                    'nome': funcionario['nome'],
                    'funcao': funcionario['funcao'],
                    'ativo': funcionario['ativo'],
                    'unidade': funcionario['unidade']
                }
                result = supabase.table('funcionarios').update(funcionario_update).eq('cpf', funcionario['cpf']).execute()
                atualizados += 1
                print(f"🔄 [{i:4d}/{len(funcionarios)}] Atualizado: {funcionario['nome']}")
            else:
                # Funcionário não existe, insere (sem especificar timestamps)
                funcionario_insert = {
                    'nome': funcionario['nome'],
                    'cpf': funcionario['cpf'],
                    'funcao': funcionario['funcao'],
                    'ativo': funcionario['ativo'],
                    'unidade': funcionario['unidade']
                }
                result = supabase.table('funcionarios').insert(funcionario_insert).execute()
                inseridos += 1
                print(f"➕ [{i:4d}/{len(funcionarios)}] Inserido: {funcionario['nome']}")
            
            sucessos += 1
            
        except Exception as e:
            erros += 1
            print(f"❌ [{i:4d}/{len(funcionarios)}] Erro ao processar {funcionario['nome']}: {e}")
    
    print("\n" + "="*60)
    print("📈 RESUMO DA OPERAÇÃO:")
    print(f"   ✅ Sucessos: {sucessos}")
    print(f"   ➕ Inseridos: {inseridos}")
    print(f"   🔄 Atualizados: {atualizados}")
    print(f"   ❌ Erros: {erros}")
    print(f"   📊 Total processado: {len(funcionarios)}")
    print("="*60)

def main():
    """Função principal"""
    
    print("🚀 Iniciando atualização da tabela 'funcionarios'...\n")
    
    # 1. Conecta ao Supabase
    print("🔌 Conectando ao Supabase...")
    supabase = get_supabase_client()
    print("✅ Conectado ao Supabase com sucesso!\n")
    
    # 2. Verifica se tabela existe
    verificar_tabela_funcionarios(supabase)
    print()
    
    # 3. Lê dados do CSV
    print("📄 Lendo dados do arquivo CSV...")
    funcionarios = ler_funcionarios_csv()
    print(f"✅ {len(funcionarios)} funcionários carregados do CSV\n")
    
    # 4. Confirma antes de prosseguir
    resposta = input("🤔 Deseja prosseguir com a atualização? (s/N): ").strip().lower()
    if resposta not in ['s', 'sim', 'y', 'yes']:
        print("❌ Operação cancelada pelo usuário.")
        sys.exit(0)
    
    print()
    
    # 5. Atualiza funcionários
    atualizar_funcionarios(supabase, funcionarios)
    
    print("\n✅ Atualização concluída!")

if __name__ == "__main__":
    main()
