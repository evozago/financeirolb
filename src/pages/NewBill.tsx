// Substitua a função atual por esta versão
const loadSuppliers = async () => {
  try {
    // Uma única consulta para todos os fornecedores
    const { data, error } = await supabase
      .from('pessoas')
      .select('id, nome, tipo_pessoa')
      .contains('categorias', ['fornecedor'])
      .eq('ativo', true)
      .order('nome');

    if (error) {
      console.error('Erro ao carregar fornecedores:', error);
      return;
    }

    // Adiciona sufixo e define o tipo conforme tipo_pessoa
    const allSuppliers: UnifiedSupplier[] = (data || []).map(p => ({
      id: p.id,
      name: `${p.nome} (${p.tipo_pessoa === 'pessoa_juridica' ? 'PJ' : 'PF'})`,
      tipo: p.tipo_pessoa === 'pessoa_juridica' ? 'fornecedor' : 'pessoa'
    }));

    setSuppliers(allSuppliers);
  } catch (error) {
    console.error('Erro ao carregar fornecedores:', error);
  }
};

  const loadCategories = async () => {
    try {
      const { data, error } = await supabase
        .from('categorias_produtos')
        .select('id, nome')
        .eq('ativo', true)
        .order('nome');

      if (error) {
        console.error('Erro ao carregar categorias:', error);
        return;
      }

      setCategories(data || []);
    } catch (error) {
      console.error('Erro ao carregar categorias:', error);
    }
  };

  const loadFiliais = async () => {
    try {
      const { data, error } = await supabase
        .from('filiais')
        .select('id, nome')
        .eq('ativo', true)
        .order('nome');

      if (error) {
        console.error('Erro ao carregar filiais:', error);
        return;
      }

      setFiliais(data || []);
    } catch (error) {
      console.error('Erro ao carregar filiais:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.fornecedor_id || !formData.descricao || !formData.valor || !formData.data_vencimento || !formData.categoria) {
      toast({
        title: "Erro",
        description: "Preencha os campos obrigatórios (Fornecedor, Descrição, Valor, Data de Vencimento e Categoria)",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase
        .from('ap_installments')
        .insert({
          fornecedor_id: formData.fornecedor_id, // grava UUID real
          descricao: formData.descricao,
          valor: parseFloat(formData.valor),
          valor_total_titulo: parseFloat(formData.valor),
          data_vencimento: formData.data_vencimento,
          numero_parcela: formData.numero_parcela,
          total_parcelas: formData.total_parcelas,
          observacoes: formData.observacoes,
          categoria: formData.categoria,
          forma_pagamento: formData.forma_pagamento,
          banco: formData.banco,
          status: 'aberto',
          filial_id: formData.filial_id || null
        });

      if (error) throw error;

      toast({
        title: "Sucesso",
        description: "Conta a pagar criada com sucesso",
      });

      navigate('/accounts-payable');
    } catch (error) {
      console.error('Erro ao criar conta:', error);
      toast({
        title: "Erro",
        description: "Falha ao criar conta a pagar",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="border-b bg-card">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-4">
              <Button variant="ghost" size="sm" onClick={() => navigate('/accounts-payable')}>
                <ArrowLeft className="h-4 w-4 mr-2" />
                Voltar
              </Button>
              <div>
                <h1 className="text-2xl font-bold text-foreground">Nova Conta a Pagar</h1>
                <p className="text-muted-foreground">Preencha os dados da nova conta a pagar</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Card>
          <CardHeader>
            <CardTitle>Dados da Conta</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="fornecedor_id">Fornecedor *</Label>
                  <Select value={formData.fornecedor_id} onValueChange={(value) => handleInputChange('fornecedor_id', value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione um fornecedor" />
                    </SelectTrigger>
                    <SelectContent>
                      {suppliers.map((supplier) => (
                        <SelectItem key={supplier.id} value={supplier.id}>
                          {supplier.nome}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="categoria">Categoria *</Label>
                  <Select value={formData.categoria} onValueChange={(value) => handleInputChange('categoria', value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione uma categoria" />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map((category) => (
                        <SelectItem key={category.id} value={category.nome}>
                          {category.nome}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="filial">Filial</Label>
                  <Select value={formData.filial_id} onValueChange={(value) => handleInputChange('filial_id', value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione uma filial" />
                    </SelectTrigger>
                    <SelectContent>
                      {filiais.map((filial) => (
                        <SelectItem key={filial.id} value={filial.id}>
                          {filial.nome}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="descricao">Descrição *</Label>
                  <Input
                    id="descricao"
                    value={formData.descricao}
                    onChange={(e) => handleInputChange('descricao', e.target.value)}
                    placeholder="Descrição da conta"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="valor">Valor *</Label>
                  <Input
                    id="valor"
                    type="number"
                    step="0.01"
                    value={formData.valor}
                    onChange={(e) => handleInputChange('valor', e.target.value)}
                    placeholder="0,00"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="data_vencimento">Data de Vencimento *</Label>
                  <Input
                    id="data_vencimento"
                    type="date"
                    value={formData.data_vencimento}
                    onChange={(e) => handleInputChange('data_vencimento', e.target.value)}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="numero_parcela">Número da Parcela</Label>
                  <Input
                    id="numero_parcela"
                    type="number"
                    value={formData.numero_parcela}
                    onChange={(e) => handleInputChange('numero_parcela', e.target.value)}
                    min="1"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="total_parcelas">Total de Parcelas</Label>
                  <Input
                    id="total_parcelas"
                    type="number"
                    value={formData.total_parcelas}
                    onChange={(e) => handleInputChange('total_parcelas', e.target.value)}
                    min="1"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="forma_pagamento">Forma de Pagamento</Label>
                  <Input
                    id="forma_pagamento"
                    value={formData.forma_pagamento}
                    onChange={(e) => handleInputChange('forma_pagamento', e.target.value)}
                    placeholder="Ex: PIX, Boleto, Cartão"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="banco">Banco</Label>
                  <Input
                    id="banco"
                    value={formData.banco}
                    onChange={(e) => handleInputChange('banco', e.target.value)}
                    placeholder="Nome do banco"
                  />
                </div>

                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="observacoes">Observações</Label>
                  <Textarea
                    id="observacoes"
                    value={formData.observacoes}
                    onChange={(e) => handleInputChange('observacoes', e.target.value)}
                    placeholder="Observações adicionais..."
                    rows={3}
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => navigate('/accounts-payable')}>
                  Cancelar
                </Button>
                <Button type="submit" disabled={loading}>
                  <Save className="h-4 w-4 mr-2" />
                  {loading ? 'Salvando...' : 'Salvar'}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
