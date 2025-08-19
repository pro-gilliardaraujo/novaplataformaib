#!/usr/bin/env python3
"""
Script para atualizar as tabelas 'boletins_cav' e 'boletins_cav_agregado' no Supabase
com os dados do arquivo CSV fornecido

Requisitos:
pip install supabase python-dotenv

Uso:
python atualizarBoletinsCAV.py
"""

import os
import sys
import csv
from typing import List, Dict, Any
from datetime import datetime
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

def ler_boletins_csv() -> List[Dict[str, Any]]:
    """Lê o arquivo CSV de boletins CAV e retorna lista de boletins"""
    
    # Procura por arquivos CSV com padrões comuns para boletins
    possibles_files = [
        'boletins_cav.csv',
        'boletins.csv', 
        'cav.csv',
        'dados_cav.csv'
    ]
    
    arquivo_csv = None
    for filename in possibles_files:
        filepath = os.path.join(os.path.dirname(__file__), filename)
        if os.path.exists(filepath):
            arquivo_csv = filepath
            break
    
    if not arquivo_csv:
        print("❌ ERRO: Nenhum arquivo CSV encontrado")
        print("Arquivos procurados:")
        for filename in possibles_files:
            print(f"  - {filename}")
        print("\nCertifique-se de que o arquivo CSV está na pasta __utilitarios/")
        sys.exit(1)
    
    print(f"📁 Usando arquivo: {os.path.basename(arquivo_csv)}")
    
    boletins = []
    
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
        
        print(f"🔍 Delimitador detectado: '{delimiter}'")
        
        reader = csv.DictReader(file, delimiter=delimiter)
        
        print("📋 Colunas encontradas no CSV:")
        for col in reader.fieldnames:
            print(f"  - {col}")
        print()
        
        for i, row in enumerate(reader, 1):
            try:
                # Adapte estas colunas conforme o CSV que você fornecerá
                boletim = {
                    'data': row.get('data', '').strip(),
                    'codigo': row.get('codigo', '').strip(),
                    'frente': row.get('frente', '').strip(),
                    'setor': row.get('setor', '').strip().upper(),
                    'frota': int(row.get('frota', 0)) if row.get('frota', '').strip() else None,
                    'turno': row.get('turno', '').strip().upper(),
                    'operador': row.get('operador', '').strip(),
                    'producao': float(row.get('producao', 0)) if row.get('producao', '').strip() else 0.0,
                    'observacoes': row.get('observacoes', '').strip() if row.get('observacoes') else None
                }
                
                # Valida dados obrigatórios
                if not boletim['data']:
                    print(f"⚠️  Linha {i}: Data vazia, pulando...")
                    continue
                    
                if not boletim['codigo']:
                    print(f"⚠️  Linha {i}: Código vazio, pulando...")
                    continue
                    
                if not boletim['frente']:
                    print(f"⚠️  Linha {i}: Frente vazia, pulando...")
                    continue
                    
                if not boletim['setor']:
                    print(f"⚠️  Linha {i}: Setor vazio, pulando...")
                    continue
                
                # Valida setor
                if boletim['setor'] not in ['GUA', 'MOE', 'ALE']:
                    print(f"⚠️  Linha {i}: Setor inválido '{boletim['setor']}', pulando...")
                    continue
                
                # Valida frente
                frentes_validas = ['Frente 1', 'Frente 2', 'Frente 3', 'Iturama', 'Ouroeste']
                if boletim['frente'] not in frentes_validas:
                    print(f"⚠️  Linha {i}: Frente inválida '{boletim['frente']}', pulando...")
                    continue
                
                # Valida turno
                if boletim['turno'] and boletim['turno'] not in ['A', 'B', 'C']:
                    print(f"⚠️  Linha {i}: Turno inválido '{boletim['turno']}', pulando...")
                    continue
                
                # Converte data para formato ISO se necessário
                # Assumindo formato dd/MM/yyyy ou yyyy-MM-dd
                try:
                    if '/' in boletim['data']:
                        # Formato dd/MM/yyyy
                        data_obj = datetime.strptime(boletim['data'], '%d/%m/%Y')
                        boletim['data'] = data_obj.strftime('%Y-%m-%d')
                    elif '-' in boletim['data'] and len(boletim['data']) == 10:
                        # Formato yyyy-MM-dd (já correto)
                        datetime.strptime(boletim['data'], '%Y-%m-%d')  # Valida apenas
                    else:
                        raise ValueError("Formato de data não reconhecido")
                except ValueError as e:
                    print(f"⚠️  Linha {i}: Data inválida '{boletim['data']}', pulando...")
                    continue
                
                boletins.append(boletim)
                
            except Exception as e:
                print(f"❌ Linha {i}: Erro ao processar linha: {e}")
                continue
                
    except Exception as e:
        print(f"❌ ERRO ao ler arquivo CSV: {e}")
        sys.exit(1)
    
    return boletins

def verificar_tabelas_cav(supabase: Client):
    """Verifica se as tabelas CAV existem"""
    
    print("🔍 Verificando se as tabelas CAV existem...")
    
    tabelas_ok = True
    
    # Verifica boletins_cav
    try:
        result = supabase.table('boletins_cav').select('id').limit(1).execute()
        print("✅ Tabela 'boletins_cav' encontrada!")
    except Exception as e:
        print(f"⚠️  Tabela 'boletins_cav' não encontrada: {e}")
        tabelas_ok = False
    
    # Verifica boletins_cav_agregado
    try:
        result = supabase.table('boletins_cav_agregado').select('id').limit(1).execute()
        print("✅ Tabela 'boletins_cav_agregado' encontrada!")
    except Exception as e:
        print(f"⚠️  Tabela 'boletins_cav_agregado' não encontrada: {e}")
        tabelas_ok = False
    
    if not tabelas_ok:
        print("\n📝 Execute as migrações do Supabase primeiro:")
        print("npx supabase db reset  # ou aplique as migrações manualmente")
        sys.exit(1)
    
    return True

def calcular_agregados(boletins_por_grupo: Dict) -> Dict[str, Any]:
    """Calcula os valores agregados para um grupo de boletins"""
    
    lamina_alvo = 2.5  # Valor padrão usado no sistema
    
    # Soma a produção total
    total_producao = sum(b['producao'] for b in boletins_por_grupo)
    
    # Para este script, assumimos que total_viagens_feitas será fornecido
    # ou calculado de alguma forma. Por agora, vamos usar um valor padrão
    # que pode ser ajustado conforme necessário
    total_viagens_feitas = total_producao * 0.5  # Ajuste conforme necessário
    
    # Calcula valores derivados
    total_viagens_orcadas = (total_producao * lamina_alvo) / 60
    lamina_aplicada = total_viagens_feitas * 60 / total_producao if total_producao > 0 else 0
    
    # Calcula diferenças percentuais (fórmulas corrigidas)
    dif_viagens_perc = ((total_viagens_feitas - total_viagens_orcadas) / total_viagens_orcadas * 100) if total_viagens_orcadas > 0 else 0
    dif_lamina_perc = ((lamina_aplicada - lamina_alvo) / lamina_alvo * 100) if lamina_alvo > 0 else 0
    
    return {
        'total_producao': round(total_producao, 2),
        'total_viagens_feitas': round(total_viagens_feitas, 2),
        'total_viagens_orcadas': round(total_viagens_orcadas, 2),
        'dif_viagens_perc': round(dif_viagens_perc, 2),
        'lamina_alvo': lamina_alvo,
        'lamina_aplicada': round(lamina_aplicada, 2),
        'dif_lamina_perc': round(dif_lamina_perc, 2)
    }

def inserir_boletins(supabase: Client, boletins: List[Dict[str, Any]]):
    """Insere os boletins nas tabelas"""
    
    print(f"📊 Processando {len(boletins)} boletins...")
    
    sucessos_individuais = 0
    sucessos_agregados = 0
    erros = 0
    
    # Agrupa boletins por data + frente + codigo + setor para criar agregados
    grupos = {}
    
    for boletim in boletins:
        chave = f"{boletim['data']}|{boletim['frente']}|{boletim['codigo']}|{boletim['setor']}"
        if chave not in grupos:
            grupos[chave] = []
        grupos[chave].append(boletim)
    
    print(f"📋 {len(grupos)} grupos agregados serão criados")
    
    # Processa cada grupo
    for i, (chave, boletins_grupo) in enumerate(grupos.items(), 1):
        try:
            data, frente, codigo, setor = chave.split('|')
            
            print(f"🔄 [{i:3d}/{len(grupos)}] Processando: {frente} - {data} - {codigo} - {setor}")
            
            # 1. Insere boletins individuais
            boletins_inseridos = 0
            for boletim in boletins_grupo:
                try:
                    # Remove campos que não estão na tabela ou são calculados
                    boletim_insert = {
                        'data': boletim['data'],
                        'codigo': boletim['codigo'],
                        'frente': boletim['frente'],
                        'setor': boletim['setor'],
                        'frota': boletim['frota'],
                        'turno': boletim['turno'],
                        'operador': boletim['operador'],
                        'producao': boletim['producao'],
                        'observacoes': boletim['observacoes']
                    }
                    
                    result = supabase.table('boletins_cav').insert(boletim_insert).execute()
                    boletins_inseridos += 1
                    
                except Exception as e:
                    print(f"    ❌ Erro ao inserir boletim individual: {e}")
                    erros += 1
            
            if boletins_inseridos > 0:
                sucessos_individuais += boletins_inseridos
                
                # 2. Calcula e insere agregado
                try:
                    agregado = calcular_agregados(boletins_grupo)
                    
                    agregado_insert = {
                        'data': data,
                        'codigo': codigo,
                        'frente': frente,
                        'setor': setor,
                        **agregado
                    }
                    
                    result = supabase.table('boletins_cav_agregado').insert(agregado_insert).execute()
                    sucessos_agregados += 1
                    print(f"    ✅ Agregado criado: {agregado['total_producao']}ha, {boletins_inseridos} boletins")
                    
                except Exception as e:
                    print(f"    ❌ Erro ao inserir agregado: {e}")
                    erros += 1
            
        except Exception as e:
            print(f"❌ [{i:3d}/{len(grupos)}] Erro ao processar grupo {chave}: {e}")
            erros += 1
    
    print("\n" + "="*60)
    print("📈 RESUMO DA OPERAÇÃO:")
    print(f"   ✅ Boletins individuais inseridos: {sucessos_individuais}")
    print(f"   ✅ Registros agregados criados: {sucessos_agregados}")
    print(f"   ❌ Erros: {erros}")
    print(f"   📊 Total de grupos processados: {len(grupos)}")
    print("="*60)

def main():
    """Função principal"""
    
    print("🚀 Iniciando importação de boletins CAV...\n")
    
    # 1. Conecta ao Supabase
    print("🔌 Conectando ao Supabase...")
    supabase = get_supabase_client()
    print("✅ Conectado ao Supabase com sucesso!\n")
    
    # 2. Verifica se tabelas existem
    verificar_tabelas_cav(supabase)
    print()
    
    # 3. Lê dados do CSV
    print("📄 Lendo dados do arquivo CSV...")
    boletins = ler_boletins_csv()
    print(f"✅ {len(boletins)} boletins carregados do CSV\n")
    
    if len(boletins) == 0:
        print("⚠️  Nenhum boletim válido encontrado no CSV.")
        sys.exit(0)
    
    # 4. Mostra preview dos dados
    print("👀 Preview dos primeiros 3 boletins:")
    for i, boletim in enumerate(boletins[:3], 1):
        print(f"   {i}. {boletim['data']} | {boletim['setor']} | {boletim['frente']} | {boletim['codigo']} | {boletim['operador']} | {boletim['producao']}ha")
    if len(boletins) > 3:
        print(f"   ... e mais {len(boletins) - 3} boletins")
    print()
    
    # 5. Confirma antes de prosseguir
    resposta = input("🤔 Deseja prosseguir com a importação? (s/N): ").strip().lower()
    if resposta not in ['s', 'sim', 'y', 'yes']:
        print("❌ Operação cancelada pelo usuário.")
        sys.exit(0)
    
    print()
    
    # 6. Insere boletins
    inserir_boletins(supabase, boletins)
    
    print("\n✅ Importação concluída!")

if __name__ == "__main__":
    main()
