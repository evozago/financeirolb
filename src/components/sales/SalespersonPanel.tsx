import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { useSalesData } from "@/hooks/useSalesData";
import { Skeleton } from "@/components/ui/skeleton";

const months = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];

export function SalespersonPanel() {
  const { loading, salespersonData, updateSalespersonGoal } = useSalesData();

  if (loading) {
    return (
      <div className="space-y-2">
        <Skeleton className="h-10 w-full" />
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-12 w-full" />
        ))}
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[150px]">Vendedora</TableHead>
            {months.map(month => (
              <TableHead key={month} className="text-center min-w-[80px]">{month}</TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {salespersonData.map(({ salesperson_id, salesperson_name, monthly_goals }) => (
            <TableRow key={salesperson_id}>
              <TableCell className="font-medium">{salesperson_name}</TableCell>
              {months.map((_, index) => {
                const month = index + 1;
                return (
                  <TableCell key={month} className="text-center">
                    <Input
                      type="number"
                      placeholder="Meta"
                      className="text-center w-20"
                      value={monthly_goals[month] || ''}
                      onChange={(e) => updateSalespersonGoal(salesperson_id, month, e.target.value)}
                    />
                  </TableCell>
                );
              })}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}