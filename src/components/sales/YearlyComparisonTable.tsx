import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { useSalesData } from "@/hooks/useSalesData";
import { Skeleton } from "@/components/ui/skeleton";

export function YearlyComparisonTable() {
  const { loading, yearlyData, updateYearlySale, currentYear } = useSalesData();

  const years = [currentYear, currentYear - 1, currentYear - 2];

  if (loading) {
    return (
      <div className="space-y-2">
        <Skeleton className="h-10 w-full" />
        {Array.from({ length: 12 }).map((_, i) => (
          <Skeleton key={i} className="h-12 w-full" />
        ))}
      </div>
    );
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead className="w-[150px]">Mês</TableHead>
          {years.map(year => (
            <TableHead key={year} className="text-right">Vendas {year}</TableHead>
          ))}
        </TableRow>
      </TableHeader>
      <TableBody>
        {yearlyData.map(({ month, monthName, years: yearValues }) => (
          <TableRow key={month}>
            <TableCell className="font-medium">{monthName}</TableCell>
            {years.map(year => (
              <TableCell key={year} className="text-right">
                <Input
                  type="number"
                  placeholder="R$ 0,00"
                  className="text-right"
                  value={yearValues[year] || ''}
                  onChange={(e) => updateYearlySale(month, year, e.target.value)}
                />
              </TableCell>
            ))}
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}

