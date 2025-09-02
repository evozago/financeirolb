-- Create HR/Payroll module with Brazilian compliance

-- Extend existing funcionarios table if needed
ALTER TABLE funcionarios ADD COLUMN IF NOT EXISTS data_admissao DATE;
ALTER TABLE funcionarios ADD COLUMN IF NOT EXISTS cargo TEXT;
ALTER TABLE funcionarios ADD COLUMN IF NOT EXISTS setor TEXT;
ALTER TABLE funcionarios ADD COLUMN IF NOT EXISTS status_funcionario TEXT DEFAULT 'ativo' CHECK (status_funcionario IN ('ativo', 'inativo', 'rescindido'));

-- Employee contracts table
CREATE TABLE hr_contracts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  funcionario_id UUID NOT NULL REFERENCES funcionarios(id) ON DELETE CASCADE,
  tipo_contrato TEXT NOT NULL DEFAULT 'clt' CHECK (tipo_contrato IN ('clt', 'pj', 'estagiario', 'terceirizado')),
  salario_base NUMERIC(15,2) NOT NULL DEFAULT 0,
  data_inicio DATE NOT NULL,
  data_fim DATE,
  carga_horaria_semanal INTEGER DEFAULT 44,
  vale_transporte_habilitado BOOLEAN DEFAULT true,
  comissao_habilitada BOOLEAN DEFAULT false,
  percentual_comissao NUMERIC(5,2) DEFAULT 0,
  ativo BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Payroll runs table
CREATE TABLE hr_payroll_runs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ano INTEGER NOT NULL,
  mes INTEGER NOT NULL CHECK (mes BETWEEN 1 AND 12),
  tipo_folha TEXT NOT NULL DEFAULT 'mensal' CHECK (tipo_folha IN ('mensal', 'decimo_terceiro', 'ferias', 'rescisao')),
  descricao TEXT,
  status TEXT NOT NULL DEFAULT 'rascunho' CHECK (status IN ('rascunho', 'simulacao', 'processada', 'fechada')),
  data_competencia DATE NOT NULL,
  data_processamento TIMESTAMPTZ,
  data_fechamento TIMESTAMPTZ,
  total_proventos NUMERIC(15,2) DEFAULT 0,
  total_descontos NUMERIC(15,2) DEFAULT 0,
  total_liquido NUMERIC(15,2) DEFAULT 0,
  observacoes TEXT,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(ano, mes, tipo_folha)
);

-- Payslips table (holerites)
CREATE TABLE hr_payslips (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  payroll_run_id UUID NOT NULL REFERENCES hr_payroll_runs(id) ON DELETE CASCADE,
  funcionario_id UUID NOT NULL REFERENCES funcionarios(id) ON DELETE CASCADE,
  contract_id UUID NOT NULL REFERENCES hr_contracts(id) ON DELETE CASCADE,
  
  -- Employee info snapshot
  funcionario_nome TEXT NOT NULL,
  cargo TEXT,
  setor TEXT,
  
  -- Salary calculation period
  dias_trabalhados INTEGER DEFAULT 30,
  dias_ferias INTEGER DEFAULT 0,
  dias_faltas INTEGER DEFAULT 0,
  horas_extras NUMERIC(5,2) DEFAULT 0,
  
  -- Base values
  salario_base NUMERIC(15,2) NOT NULL,
  
  -- Earnings (proventos)
  salario_mensal NUMERIC(15,2) DEFAULT 0,
  horas_extras_valor NUMERIC(15,2) DEFAULT 0,
  comissao_vendas NUMERIC(15,2) DEFAULT 0,
  adicional_noturno NUMERIC(15,2) DEFAULT 0,
  outros_proventos NUMERIC(15,2) DEFAULT 0,
  total_proventos NUMERIC(15,2) DEFAULT 0,
  
  -- Deductions (descontos)
  vale_transporte NUMERIC(15,2) DEFAULT 0,
  inss NUMERIC(15,2) DEFAULT 0,
  irrf NUMERIC(15,2) DEFAULT 0,
  fgts NUMERIC(15,2) DEFAULT 0,
  adiantamento NUMERIC(15,2) DEFAULT 0,
  outros_descontos NUMERIC(15,2) DEFAULT 0,
  total_descontos NUMERIC(15,2) DEFAULT 0,
  
  -- Final values
  salario_liquido NUMERIC(15,2) DEFAULT 0,
  
  -- 13th salary specific fields
  parcela_13_numero INTEGER DEFAULT 1,
  parcela_13_total INTEGER DEFAULT 1,
  base_calculo_13 NUMERIC(15,2) DEFAULT 0,
  
  -- Vacation specific fields
  periodo_ferias_inicio DATE,
  periodo_ferias_fim DATE,
  abono_pecuniario BOOLEAN DEFAULT false,
  terco_ferias NUMERIC(15,2) DEFAULT 0,
  
  -- Audit fields
  observacoes TEXT,
  deleted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(payroll_run_id, funcionario_id)
);

-- Earnings and deductions log for audit
CREATE TABLE hr_earnings_deductions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  payslip_id UUID NOT NULL REFERENCES hr_payslips(id) ON DELETE CASCADE,
  tipo TEXT NOT NULL CHECK (tipo IN ('provento', 'desconto')),
  codigo TEXT NOT NULL,
  descricao TEXT NOT NULL,
  valor NUMERIC(15,2) NOT NULL,
  percentual NUMERIC(5,2),
  base_calculo NUMERIC(15,2),
  observacoes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- HR positions/roles lookup table
CREATE TABLE hr_cargos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome TEXT NOT NULL UNIQUE,
  descricao TEXT,
  salario_base_sugerido NUMERIC(15,2),
  ativo BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- HR departments lookup table
CREATE TABLE hr_setores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome TEXT NOT NULL UNIQUE,
  descricao TEXT,
  responsavel_id UUID REFERENCES funcionarios(id),
  ativo BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS on all HR tables
ALTER TABLE hr_contracts ENABLE ROW LEVEL SECURITY;
ALTER TABLE hr_payroll_runs ENABLE ROW LEVEL SECURITY;
ALTER TABLE hr_payslips ENABLE ROW LEVEL SECURITY;
ALTER TABLE hr_earnings_deductions ENABLE ROW LEVEL SECURITY;
ALTER TABLE hr_cargos ENABLE ROW LEVEL SECURITY;
ALTER TABLE hr_setores ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for HR tables
-- Only admins and HR managers can access HR data
CREATE POLICY "HR data access for admins only" ON hr_contracts
  FOR ALL USING (is_admin());

CREATE POLICY "HR payroll runs access for admins only" ON hr_payroll_runs
  FOR ALL USING (is_admin());

CREATE POLICY "HR payslips access for admins only" ON hr_payslips
  FOR ALL USING (is_admin());

CREATE POLICY "HR earnings deductions access for admins only" ON hr_earnings_deductions
  FOR ALL USING (is_admin());

CREATE POLICY "HR positions access for authenticated users" ON hr_cargos
  FOR SELECT USING (true);

CREATE POLICY "HR positions modify for admins only" ON hr_cargos
  FOR ALL USING (is_admin());

CREATE POLICY "HR departments access for authenticated users" ON hr_setores
  FOR SELECT USING (true);

CREATE POLICY "HR departments modify for admins only" ON hr_setores
  FOR ALL USING (is_admin());

-- Create triggers for updated_at
CREATE OR REPLACE FUNCTION update_hr_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_hr_contracts_updated_at
  BEFORE UPDATE ON hr_contracts
  FOR EACH ROW
  EXECUTE FUNCTION update_hr_updated_at_column();

CREATE TRIGGER update_hr_payroll_runs_updated_at
  BEFORE UPDATE ON hr_payroll_runs
  FOR EACH ROW
  EXECUTE FUNCTION update_hr_updated_at_column();

CREATE TRIGGER update_hr_payslips_updated_at
  BEFORE UPDATE ON hr_payslips
  FOR EACH ROW
  EXECUTE FUNCTION update_hr_updated_at_column();

CREATE TRIGGER update_hr_cargos_updated_at
  BEFORE UPDATE ON hr_cargos
  FOR EACH ROW
  EXECUTE FUNCTION update_hr_updated_at_column();

CREATE TRIGGER update_hr_setores_updated_at
  BEFORE UPDATE ON hr_setores
  FOR EACH ROW
  EXECUTE FUNCTION update_hr_updated_at_column();

-- Brazilian payroll calculation function
CREATE OR REPLACE FUNCTION calculate_brazilian_payroll(
  p_funcionario_id UUID,
  p_payroll_run_id UUID,
  p_salario_base NUMERIC DEFAULT NULL,
  p_dias_trabalhados INTEGER DEFAULT 30,
  p_horas_extras NUMERIC DEFAULT 0,
  p_comissao_vendas NUMERIC DEFAULT 0
) RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_payslip_id UUID;
  v_contract hr_contracts%ROWTYPE;
  v_funcionario funcionarios%ROWTYPE;
  v_salario_proporcional NUMERIC;
  v_valor_hora NUMERIC;
  v_horas_extras_valor NUMERIC;
  v_vale_transporte NUMERIC;
  v_inss NUMERIC;
  v_irrf NUMERIC;
  v_fgts NUMERIC;
  v_total_proventos NUMERIC;
  v_total_descontos NUMERIC;
  v_salario_liquido NUMERIC;
BEGIN
  -- Get employee and contract data
  SELECT * INTO v_funcionario FROM funcionarios WHERE id = p_funcionario_id;
  SELECT * INTO v_contract FROM hr_contracts 
  WHERE funcionario_id = p_funcionario_id AND ativo = true 
  ORDER BY data_inicio DESC LIMIT 1;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'No active contract found for employee %', p_funcionario_id;
  END IF;
  
  -- Use provided salary or contract base salary
  v_salario_proporcional := COALESCE(p_salario_base, v_contract.salario_base) * (p_dias_trabalhados::NUMERIC / 30);
  
  -- Calculate overtime (50% extra for first 2 hours, 100% after)
  v_valor_hora := v_contract.salario_base / 220; -- 220 working hours per month
  v_horas_extras_valor := p_horas_extras * v_valor_hora * 1.5;
  
  -- Calculate transport allowance (max 6% of salary)
  IF v_contract.vale_transporte_habilitado THEN
    v_vale_transporte := LEAST(v_funcionario.valor_transporte_total, v_contract.salario_base * 0.06);
  ELSE
    v_vale_transporte := 0;
  END IF;
  
  -- Calculate INSS (Brazilian social security - simplified rates)
  v_total_proventos := v_salario_proporcional + v_horas_extras_valor + COALESCE(p_comissao_vendas, 0);
  
  IF v_total_proventos <= 1412.00 THEN
    v_inss := v_total_proventos * 0.075;
  ELSIF v_total_proventos <= 2666.68 THEN
    v_inss := v_total_proventos * 0.09;
  ELSIF v_total_proventos <= 4000.03 THEN
    v_inss := v_total_proventos * 0.12;
  ELSE
    v_inss := v_total_proventos * 0.14;
  END IF;
  
  -- Calculate IRRF (Brazilian income tax - simplified)
  IF v_total_proventos > 2259.20 THEN
    v_irrf := (v_total_proventos - v_inss) * 0.075; -- Simplified calculation
  ELSE
    v_irrf := 0;
  END IF;
  
  -- Calculate FGTS (8% - employer contribution, shown for transparency)
  v_fgts := v_total_proventos * 0.08;
  
  v_total_descontos := v_vale_transporte + v_inss + v_irrf;
  v_salario_liquido := v_total_proventos - v_total_descontos;
  
  -- Create or update payslip
  INSERT INTO hr_payslips (
    payroll_run_id, funcionario_id, contract_id,
    funcionario_nome, cargo, setor,
    dias_trabalhados, horas_extras,
    salario_base, salario_mensal, horas_extras_valor, comissao_vendas,
    total_proventos, vale_transporte, inss, irrf, fgts,
    total_descontos, salario_liquido
  ) VALUES (
    p_payroll_run_id, p_funcionario_id, v_contract.id,
    v_funcionario.nome, v_funcionario.cargo, v_funcionario.setor,
    p_dias_trabalhados, p_horas_extras,
    v_contract.salario_base, v_salario_proporcional, v_horas_extras_valor, COALESCE(p_comissao_vendas, 0),
    v_total_proventos, v_vale_transporte, v_inss, v_irrf, v_fgts,
    v_total_descontos, v_salario_liquido
  ) 
  ON CONFLICT (payroll_run_id, funcionario_id) 
  DO UPDATE SET
    dias_trabalhados = EXCLUDED.dias_trabalhados,
    horas_extras = EXCLUDED.horas_extras,
    salario_mensal = EXCLUDED.salario_mensal,
    horas_extras_valor = EXCLUDED.horas_extras_valor,
    comissao_vendas = EXCLUDED.comissao_vendas,
    total_proventos = EXCLUDED.total_proventos,
    vale_transporte = EXCLUDED.vale_transporte,
    inss = EXCLUDED.inss,
    irrf = EXCLUDED.irrf,
    fgts = EXCLUDED.fgts,
    total_descontos = EXCLUDED.total_descontos,
    salario_liquido = EXCLUDED.salario_liquido,
    updated_at = NOW()
  RETURNING id INTO v_payslip_id;
  
  RETURN v_payslip_id;
END;
$$;

-- Process entire payroll run function
CREATE OR REPLACE FUNCTION process_payroll_run(p_payroll_run_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_run hr_payroll_runs%ROWTYPE;
  v_employee RECORD;
  v_total_proventos NUMERIC := 0;
  v_total_descontos NUMERIC := 0;
  v_total_liquido NUMERIC := 0;
BEGIN
  -- Get payroll run
  SELECT * INTO v_run FROM hr_payroll_runs WHERE id = p_payroll_run_id;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Payroll run not found: %', p_payroll_run_id;
  END IF;
  
  -- Process each active employee with contract
  FOR v_employee IN 
    SELECT f.id, f.nome, c.salario_base
    FROM funcionarios f
    JOIN hr_contracts c ON f.id = c.funcionario_id
    WHERE f.ativo = true AND c.ativo = true
    ORDER BY f.nome
  LOOP
    PERFORM calculate_brazilian_payroll(
      v_employee.id,
      p_payroll_run_id,
      v_employee.salario_base
    );
  END LOOP;
  
  -- Update payroll run totals
  SELECT 
    COALESCE(SUM(total_proventos), 0),
    COALESCE(SUM(total_descontos), 0),
    COALESCE(SUM(salario_liquido), 0)
  INTO v_total_proventos, v_total_descontos, v_total_liquido
  FROM hr_payslips
  WHERE payroll_run_id = p_payroll_run_id AND deleted_at IS NULL;
  
  UPDATE hr_payroll_runs
  SET 
    total_proventos = v_total_proventos,
    total_descontos = v_total_descontos,
    total_liquido = v_total_liquido,
    status = 'processada',
    data_processamento = NOW(),
    updated_at = NOW()
  WHERE id = p_payroll_run_id;
END;
$$;

-- Insert sample data
INSERT INTO hr_cargos (nome, descricao, salario_base_sugerido) VALUES
  ('Vendedor(a)', 'Vendedor(a) de loja', 1500.00),
  ('Gerente', 'Gerente de loja', 3000.00),
  ('Supervisor(a)', 'Supervisor(a) de vendas', 2200.00),
  ('Caixa', 'Operador(a) de caixa', 1400.00),
  ('Estoquista', 'Controle de estoque', 1350.00);

INSERT INTO hr_setores (nome, descricao) VALUES
  ('Vendas', 'Setor de vendas e atendimento'),
  ('Administração', 'Setor administrativo'),
  ('Estoque', 'Controle de estoque e logística'),
  ('Gerência', 'Gestão e supervisão'),
  ('Recursos Humanos', 'Gestão de pessoas');