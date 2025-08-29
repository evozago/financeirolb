import requests
import json
from datetime import datetime, date
import uuid

SUPABASE_URL = 'https://mnxemxgcucfuoedqkygw.supabase.co'
SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1ueGVteGdjdWNmdW9lZHFreWd3Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1Mzg5NjkxNiwiZXhwIjoyMDY5NDcyOTE2fQ.y7G0xBAt6BiKJq6gKaAsN243GqzGmTOh30_dMBqJByk'

headers = {
    'apikey': SUPABASE_KEY,
    'Authorization': f'Bearer {SUPABASE_KEY}',
    'Content-Type': 'application/json'
}

def launch_current_month(bill_id):
    """
    Lança uma conta recorrente como conta a pagar no mês vigente
    """
    try:
        # 1. Buscar os dados da conta recorrente
        response = requests.get(
            f'{SUPABASE_URL}/rest/v1/recurring_bills?id=eq.{bill_id}&select=*,supplier:fornecedores(nome),category:categorias_produtos(nome)',
            headers=headers
        )
        
        if response.status_code != 200:
            return {'error': f'Erro ao buscar conta recorrente: {response.status_code}'}
        
        bills = response.json()
        if not bills:
            return {'error': 'Conta recorrente não encontrada'}
        
        bill = bills[0]
        
        # 2. Calcular a data de vencimento para o mês atual
        today = date.today()
        due_day = bill['due_day']
        
        # Se o dia já passou no mês atual, usar o próximo mês
        if today.day > due_day:
            if today.month == 12:
                due_date = date(today.year + 1, 1, due_day)
            else:
                due_date = date(today.year, today.month + 1, due_day)
        else:
            due_date = date(today.year, today.month, due_day)
        
        # 3. Verificar se já existe uma conta a pagar para este mês
        check_response = requests.get(
            f'{SUPABASE_URL}/rest/v1/ap_installments?fornecedor_id=eq.{bill["supplier_id"]}&data_vencimento=eq.{due_date}&eh_recorrente=eq.true',
            headers=headers
        )
        
        if check_response.status_code == 200:
            existing = check_response.json()
            if existing:
                return {'error': 'Já existe uma conta a pagar para este fornecedor neste mês'}
        
        # 4. Criar a nova conta a pagar
        new_payable = {
            'id': str(uuid.uuid4()),
            'descricao': bill['name'],
            'fornecedor_id': bill['supplier_id'],
            'fornecedor': bill['supplier']['nome'] if bill.get('supplier') else 'N/A',
            'valor': bill['expected_amount'],
            'data_vencimento': due_date.isoformat(),
            'data_emissao': today.isoformat(),
            'categoria': bill['category']['nome'] if bill.get('category') else 'Geral',
            'status': 'aberto',
            'numero_parcela': 1,
            'total_parcelas': 1,
            'valor_total_titulo': bill['expected_amount'],
            'eh_recorrente': True,
            'filial_id': bill.get('filial_id'),
            'observacoes': f'Lançamento automático da conta recorrente: {bill["name"]}',
            'created_at': datetime.now().isoformat(),
            'updated_at': datetime.now().isoformat()
        }
        
        # 5. Inserir na tabela ap_installments
        insert_response = requests.post(
            f'{SUPABASE_URL}/rest/v1/ap_installments',
            headers=headers,
            json=new_payable
        )
        
        if insert_response.status_code == 201:
            return {'success': True, 'data': new_payable}
        else:
            return {'error': f'Erro ao criar conta a pagar: {insert_response.status_code} - {insert_response.text}'}
            
    except Exception as e:
        return {'error': f'Erro interno: {str(e)}'}

# Teste da função
if __name__ == "__main__":
    # Pegar o primeiro ID de conta recorrente para testar
    response = requests.get(f'{SUPABASE_URL}/rest/v1/recurring_bills?limit=1', headers=headers)
    if response.status_code == 200:
        bills = response.json()
        if bills:
            test_id = bills[0]['id']
            print(f"Testando com ID: {test_id}")
            result = launch_current_month(test_id)
            print(json.dumps(result, indent=2, default=str))
        else:
            print("Nenhuma conta recorrente encontrada para teste")
    else:
        print(f"Erro ao buscar contas recorrentes: {response.status_code}")
