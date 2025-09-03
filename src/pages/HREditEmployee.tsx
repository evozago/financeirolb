import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowLeft, Save } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface Employee {
  id: string;
  nome: string;
  cpf: string;
  email?: string;
  telefone?: string;
  cargo_id?: string;
  cargo?: string;
  data_admissao: string;
  salario?: number;
  ativo: boolean;
  dados_funcionario?: any;
}

export default function HREditEmployee() {
  const navigate = useNavigate();
  const { id } = useParams();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [formData, setFormData] = useState({
    name: '',
    cpf: '',
    email: '',
    telefone: '',
    position_id: '',
    admission_date: '',
    salary: '',
    status: 'active'
  });
  
  const [positions, setPositions] = useState<{id: string, nome: string}[]>([]);

  useEffect(() => {
    loadEmployee();
    loadPositions();
  }, [id]);

  const loadPositions = async () => {
    try {
      const { data, error } = await supabase
        .from('hr_cargos')
        .select('id, nome')
        .eq('ativo', true)
        .order('nome');
      
      if (error) throw error;
      setPositions(data || []);
    } catch (error) {
      console.error('Error loading positions:', error);
    }
  };

  const loadEmployee = async () => {
    if (!id) return;
    
    try {
      const { data, error } = await supabase
        .from('pessoas')
        .select(`
          id, nome, cpf, email, telefone, ativo, cargo_id,
          dados_funcionario,
          hr_cargos!cargo_id(nome)
        `)
        .contains('categorias', ['funcionario'])
        .eq('id', id)
        .single();

      if (error) throw error;
      
      setFormData({
        name: data.nome,
        cpf: data.cpf || '',
        email: data.email || '',
        telefone: data.telefone || '',
        position_id: data.cargo_id || '',
        admission_date: (data.dados_funcionario as any)?.data_admissao || '',
        salary: (data.dados_funcionario as any)?.salario?.toString() || '',
        status: data.ativo ? 'active' : 'inactive'
      });
    } catch (error) {
      console.error('Error loading employee:', error);
      toast({
        title: "Erro ao carregar funcionário",
        description: "Não foi possível carregar os dados do funcionário.",
        variant: "destructive"
      });
    } finally {
      setInitialLoading(false);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { error } = await supabase
        .from('pessoas')
        .update({
          nome: formData.name,
          cpf: formData.cpf,
          email: formData.email || null,
          telefone: formData.telefone || null,
          cargo_id: formData.position_id || null,
          ativo: formData.status === 'active',
          dados_funcionario: {
            data_admissao: formData.admission_date,
            salario: formData.salary ? parseFloat(formData.salary) : null,
            status_funcionario: formData.status
          }
        })
        .eq('id', id);

      if (error) throw error;

      toast({
        title: "Funcionário atualizado com sucesso!",
        description: "As informações do funcionário foram salvas."
      });

      navigate(`/hr/employees/${id}`);
    } catch (error) {
      console.error('Error updating employee:', error);
      toast({
        title: "Erro ao atualizar funcionário",
        description: "Ocorreu um erro ao salvar os dados. Tente novamente.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  if (initialLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b bg-card">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate(`/hr/employees/${id}`)}
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Voltar
              </Button>
              <div>
                <h1 className="text-2xl font-bold text-foreground">Editar Funcionário</h1>
                <p className="text-muted-foreground">Alterar informações do funcionário</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Card>
          <CardHeader>
            <CardTitle>Informações do Funcionário</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Nome Completo *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => handleInputChange('name', e.target.value)}
                    required
                    placeholder="Digite o nome completo"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="cpf">CPF *</Label>
                  <Input
                    id="cpf"
                    value={formData.cpf}
                    onChange={(e) => handleInputChange('cpf', e.target.value)}
                    required
                    placeholder="000.000.000-00"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => handleInputChange('email', e.target.value)}
                    placeholder="email@exemplo.com"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="telefone">Telefone</Label>
                  <Input
                    id="telefone"
                    value={formData.telefone}
                    onChange={(e) => handleInputChange('telefone', e.target.value)}
                    placeholder="(11) 99999-9999"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="position">Cargo *</Label>
                  <Select
                    value={formData.position_id}
                    onValueChange={(value) => handleInputChange('position_id', value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione o cargo" />
                    </SelectTrigger>
                    <SelectContent>
                      {positions.map((position) => (
                        <SelectItem key={position.id} value={position.id}>
                          {position.nome}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="admission_date">Data de Admissão *</Label>
                  <Input
                    id="admission_date"
                    type="date"
                    value={formData.admission_date}
                    onChange={(e) => handleInputChange('admission_date', e.target.value)}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="salary">Salário Base</Label>
                  <Input
                    id="salary"
                    type="number"
                    step="0.01"
                    value={formData.salary}
                    onChange={(e) => handleInputChange('salary', e.target.value)}
                    placeholder="0.00"
                  />
                </div>

                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="status">Status</Label>
                  <Select value={formData.status} onValueChange={(value) => handleInputChange('status', value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione o status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="active">Ativo</SelectItem>
                      <SelectItem value="inactive">Inativo</SelectItem>
                      <SelectItem value="vacation">Férias</SelectItem>
                      <SelectItem value="leave">Licença</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="flex justify-end gap-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => navigate(`/hr/employees/${id}`)}
                >
                  Cancelar
                </Button>
                <Button
                  type="submit"
                  disabled={loading}
                  className="gap-2"
                >
                  <Save className="h-4 w-4" />
                  {loading ? 'Salvando...' : 'Salvar Alterações'}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}