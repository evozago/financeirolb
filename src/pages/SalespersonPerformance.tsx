import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useSalesData } from '@/hooks/useSalesData';
import { useAuth } from '@/components/auth/AuthProvider';

const months = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];

export function SalespersonPerformance() {
  const { user } = useAuth();
  const { loading, salespersonData, updateSalespersonGoal, currentYear } = useSalesData();

  if (!user) {
    return <p className="text-center text-muted-foreground">Por favor, faça login para continuar.</p>;
  }

  if (loading) {
    return <p className="text-center text-muted-foreground">Carregando metas dos vendedores...</p>;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Metas de Vendedores - {currentYear}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[200px]">Vendedor</TableHead>
                {months.map(month => <TableHead key={month} className="text-center">{month}</TableHead>)}
              </TableRow>
            </TableHeader>
            <TableBody>
              {salespersonData.map(person => (
                <TableRow key={person.salesperson_id}>
                  <TableCell className="font-medium">{person.salesperson_name}</TableCell>
                  {months.map((_, index) => {
                    const month = index + 1;
                    return (
                      <TableCell key={month}>
                        <Input
                          type="number"
                          placeholder="Meta"
                          value={person.monthly_goals[month] || ''}
                          onChange={(e) => updateSalespersonGoal(person.salesperson_id, month, e.target.value)}
                          className="min-w-[100px] text-right"
                        />
                      </TableCell>
                    );
                  })}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}

export default SalespersonPerformance;

