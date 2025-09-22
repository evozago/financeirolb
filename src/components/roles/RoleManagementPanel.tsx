import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Trash2, Plus, Search, UserCheck, UserX } from 'lucide-react';
import { useSalesData } from '@/hooks/useSalesData';

const AVAILABLE_ROLES = [
  { value: 'vendedora', label: 'Vendedora', color: 'bg-green-100 text-green-800' },
  { value: 'funcionario', label: 'Funcionário', color: 'bg-blue-100 text-blue-800' },
  { value: 'fornecedor', label: 'Fornecedor', color: 'bg-purple-100 text-purple-800' },
  { value: 'cliente', label: 'Cliente', color: 'bg-orange-100 text-orange-800' },
];

export const RoleManagementPanel: React.FC = () => {
  const { salespersons, loading, assignRole, removeRole, refetch } = useSalesData();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRole, setSelectedRole] = useState<string>('');
  const [selectedPerson, setSelectedPerson] = useState<string>('');

  const filteredPersons = salespersons.filter(person =>
    person.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
    person.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    person.cpf?.includes(searchTerm)
  );

  const handleAssignRole = async () => {
    if (!selectedPerson || !selectedRole) return;

    const success = await assignRole(selectedPerson, selectedRole);
    if (success) {
      setSelectedPerson('');
      setSelectedRole('');
      refetch();
    }
  };

  const handleRemoveRole = async (personId: string, roleName: string) => {
    const success = await removeRole(personId, roleName);
    if (success) {
      refetch();
    }
  };

  const getRoleColor = (roleName: string) => {
    const role = AVAILABLE_ROLES.find(r => r.value === roleName);
    return role?.color || 'bg-gray-100 text-gray-800';
  };

  const getRoleLabel = (roleName: string) => {
    const role = AVAILABLE_ROLES.find(r => r.value === roleName);
    return role?.label || roleName;
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Gerenciamento de Papéis</CardTitle>
          <CardDescription>Carregando pessoas...</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <UserCheck className="h-5 w-5" />
            Gerenciamento de Papéis
          </CardTitle>
          <CardDescription>
            Atribua e gerencie papéis para pessoas no sistema
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Seção de Atribuição de Papéis */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-gray-50 rounded-lg">
            <div>
              <Label htmlFor="person-select">Selecionar Pessoa</Label>
              <Select value={selectedPerson} onValueChange={setSelectedPerson}>
                <SelectTrigger>
                  <SelectValue placeholder="Escolha uma pessoa" />
                </SelectTrigger>
                <SelectContent>
                  {salespersons.map(person => (
                    <SelectItem key={person.id} value={person.id}>
                      {person.nome}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="role-select">Selecionar Papel</Label>
              <Select value={selectedRole} onValueChange={setSelectedRole}>
                <SelectTrigger>
                  <SelectValue placeholder="Escolha um papel" />
                </SelectTrigger>
                <SelectContent>
                  {AVAILABLE_ROLES.map(role => (
                    <SelectItem key={role.value} value={role.value}>
                      {role.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-end">
              <Button 
                onClick={handleAssignRole}
                disabled={!selectedPerson || !selectedRole}
                className="w-full"
              >
                <Plus className="h-4 w-4 mr-2" />
                Atribuir Papel
              </Button>
            </div>
          </div>

          {/* Busca */}
          <div className="relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Buscar por nome, email ou CPF..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardContent>
      </Card>

      {/* Tabela de Pessoas e Papéis */}
      <Card>
        <CardHeader>
          <CardTitle>Pessoas e Seus Papéis</CardTitle>
          <CardDescription>
            Lista de todas as pessoas e os papéis atribuídos a elas
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>CPF</TableHead>
                <TableHead>Papéis</TableHead>
                <TableHead>Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredPersons.map(person => (
                <TableRow key={person.id}>
                  <TableCell className="font-medium">{person.nome}</TableCell>
                  <TableCell>{person.email || '-'}</TableCell>
                  <TableCell>{person.cpf || '-'}</TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1">
                      {person.papeis.length > 0 ? (
                        person.papeis.map(papel => (
                          <Badge 
                            key={papel} 
                            variant="secondary"
                            className={getRoleColor(papel)}
                          >
                            {getRoleLabel(papel)}
                          </Badge>
                        ))
                      ) : (
                        <span className="text-gray-500 text-sm">Nenhum papel</span>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      {person.papeis.map(papel => (
                        <Button
                          key={papel}
                          variant="outline"
                          size="sm"
                          onClick={() => handleRemoveRole(person.id, papel)}
                          className="h-8 w-8 p-0"
                          title={`Remover papel: ${getRoleLabel(papel)}`}
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      ))}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          {filteredPersons.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              {searchTerm ? 'Nenhuma pessoa encontrada com os critérios de busca.' : 'Nenhuma pessoa cadastrada.'}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Estatísticas */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {AVAILABLE_ROLES.map(role => {
          const count = salespersons.filter(p => p.papeis.includes(role.value)).length;
          return (
            <Card key={role.value}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">{role.label}</p>
                    <p className="text-2xl font-bold">{count}</p>
                  </div>
                  <Badge className={role.color}>
                    {count === 1 ? '1 pessoa' : `${count} pessoas`}
                  </Badge>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
};
