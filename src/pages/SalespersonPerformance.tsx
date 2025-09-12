import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/table';
import { useSalesData } from '../hooks/useSalesData';
import { useAuth } from '../components/auth/AuthProvider';

const months = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];

type SalesDataRow = {
  salesperson_id: string;
  salesperson_name: string;
  year: number;
  entity_id: string;
  monthly_goals: { month: number; goal_amount: number }[];
};

export function SalespersonPerformance() {
  const { primaryEntity } = useAuth();
  const { fetchSalespersonGoals, saveSalespersonGoal } = useSalesData(primaryEntity?.id || null);
  
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear());
  const [salesData, setSalesData] = useState<SalesDataRow[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      if (!primaryEntity?.id) {
        setIsLoading(false);
        return;
      }
      setIsLoading(true);
      const data = await fetchSalespersonGoals(currentYear);
      setSalesData(data);
      setIsLoading(false);
    }
    loadData();
  }, [currentYear, primaryEntity, fetchSalespersonGoals]);

  const handleGoalChange = (salespersonId: string, month: number, value: string) => {
    const newSalesData = salesData.map(row => {
      if (row.salesperson_id === salespersonId) {
        return {
          ...row,
          monthly_goals: row.monthly_goals.map(goal =>
            goal.month === month ? { ...goal, goal_amount: parseFloat(value) || 0 } : goal
          ),
        };
      }
      return row;
    });
    setSalesData(newSalesData);
  };

  const handleSaveGoal = (salespersonId: string, month: number) => {
    const row = salesData.find(r => r.salesperson_id === salespersonId);
    const goal = row?.monthly_goals.find(g => g.month === month);
    
    if (row && goal && primaryEntity?.id) {
      saveSalespersonGoal({
        entity_id: primaryEntity.id,
        salesperson_id: salespersonId,
        year: currentYear,
        month: month,
        goal_amount: goal.goal_amount,
      });
    }
  };

  if (!primaryEntity) {
    return <p className="text-center text-gray-500">Por favor, selecione uma entidade corporativa para continuar.</p>;
  }

  if (isLoading) {
    return <p className="text-center text-gray-500">Carregando metas dos vendedores...</p>;
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
              {salesData.map(row => (
                <TableRow key={row.salesperson_id}>
                  <TableCell className="font-medium">{row.salesperson_name}</TableCell>
                  {row.monthly_goals.map(({ month, goal_amount }) => (
                    <TableCell key={month}>
                      <Input
                        type="number"
                        placeholder="Meta"
                        value={goal_amount || ''}
                        onChange={(e) => handleGoalChange(row.salesperson_id, month, e.target.value)}
                        onBlur={() => handleSaveGoal(row.salesperson_id, month)}
                        className="min-w-[100px] text-right"
                      />
                    </TableCell>
                  ))}
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

