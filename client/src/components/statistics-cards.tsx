import { TableIcon, DollarSign, Package, Images } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { TableRow } from "@shared/schema";

interface StatisticsCardsProps {
  rows: TableRow[];
  isLoading?: boolean;
}

export function StatisticsCards({ rows, isLoading = false }: StatisticsCardsProps) {
  const calculateSum = (field: 'quantity' | 'revenue') => {
    if (field === 'quantity') {
      // Use 'no' field as quantity since it's the numeric field available
      return rows.reduce((sum, row) => sum + (row.no || 0), 0);
    } else {
      // Calculate revenue based on no field (as quantity) multiplied by a base value
      return rows.reduce((sum, row) => {
        const quantity = row.no || 0;
        const basePrice = 100; // Base price per unit
        return sum + (quantity * basePrice);
      }, 0);
    }
  };

  const countImages = () => {
    return rows.reduce((count, row) => count + row.images.length, 0);
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-MY', {
      style: 'currency',
      currency: 'MYR',
      currencyDisplay: 'symbol'
    }).format(value).replace('MYR', 'RM');
  };

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6" data-testid="statistics-cards">
        {Array.from({ length: 4 }).map((_, index) => (
          <Card key={index} className={`stats-card-glass border-none rounded-xl fade-in-stagger`}>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="space-y-2">
                  <div className="skeleton w-16 h-3" />
                  <div className="skeleton w-12 h-3" />
                </div>
                <div className="skeleton w-6 h-6 rounded" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6" data-testid="statistics-cards">
      <Card className="stats-card-glass border-none rounded-xl fade-in-stagger">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-muted-foreground" style={{fontSize: '11px'}} data-testid="text-total-rows-label">Total Rows</p>
              <p className="font-bold text-white" style={{fontSize: '11px'}} data-testid="text-total-rows-value">{rows.length}</p>
            </div>
            <TableIcon className="text-primary text-2xl" />
          </div>
        </CardContent>
      </Card>
      
      <Card className="stats-card-glass border-none rounded-xl fade-in-stagger">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-muted-foreground" style={{fontSize: '11px'}} data-testid="text-revenue-sum-label">Touch n Go</p>
              <p className="font-bold text-emerald-400" style={{fontSize: '11px'}} data-testid="text-revenue-sum-value">
                {formatCurrency(calculateSum('revenue'))}
              </p>
            </div>
            <DollarSign className="text-emerald-400 text-2xl" />
          </div>
        </CardContent>
      </Card>
      
      <Card className="stats-card-glass border-none rounded-xl fade-in-stagger">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-muted-foreground" style={{fontSize: '11px'}} data-testid="text-quantity-sum-label">Quantity Sum</p>
              <p className="font-bold text-blue-400" style={{fontSize: '11px'}} data-testid="text-quantity-sum-value">
                {calculateSum('quantity').toLocaleString()}
              </p>
            </div>
            <Package className="text-blue-400 text-2xl" />
          </div>
        </CardContent>
      </Card>
      
      <Card className="stats-card-glass border-none rounded-xl fade-in-stagger">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-muted-foreground" style={{fontSize: '11px'}} data-testid="text-images-count-label">Images</p>
              <p className="font-bold text-purple-400" style={{fontSize: '11px'}} data-testid="text-images-count-value">
                {countImages()}
              </p>
            </div>
            <Images className="text-purple-400 text-2xl" />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
