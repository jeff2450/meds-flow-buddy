import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { useLanguage } from "@/contexts/LanguageContext";
import { Package } from "lucide-react";

interface CategorySales {
  name: string;
  value: number;
  quantity: number;
}

interface ProductSales {
  name: string;
  quantity: number;
  revenue: number;
}

interface SalesBreakdownProps {
  categorySales: CategorySales[];
  topProducts: ProductSales[];
  leastProducts: ProductSales[];
}

const COLORS = ['hsl(var(--primary))', 'hsl(var(--chart-2))', 'hsl(var(--chart-3))', 'hsl(var(--chart-4))'];

const SalesBreakdownSection = ({ categorySales, topProducts, leastProducts }: SalesBreakdownProps) => {
  const { t } = useLanguage();

  const chartConfig = {
    value: { label: "Revenue", color: "hsl(var(--primary))" },
    quantity: { label: "Quantity", color: "hsl(var(--chart-2))" },
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Package className="h-5 w-5 text-primary" />
          {t("salesBreakdown")}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="category">
          <TabsList className="mb-4">
            <TabsTrigger value="category">{t("byCategory")}</TabsTrigger>
            <TabsTrigger value="product">{t("byProduct")}</TabsTrigger>
          </TabsList>
          
          <TabsContent value="category">
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <h4 className="font-medium mb-4">{t("revenuePerMedicine")}</h4>
                {categorySales.length > 0 ? (
                  <ChartContainer config={chartConfig} className="h-[250px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={categorySales}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          outerRadius={80}
                          fill="#8884d8"
                          dataKey="value"
                          label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                        >
                          {categorySales.map((_, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <ChartTooltip content={<ChartTooltipContent />} />
                      </PieChart>
                    </ResponsiveContainer>
                  </ChartContainer>
                ) : (
                  <p className="text-center text-muted-foreground py-8">{t("noData")}</p>
                )}
              </div>
              <div>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>{t("category")}</TableHead>
                      <TableHead className="text-right">{t("quantity")}</TableHead>
                      <TableHead className="text-right">{t("totalRevenue")}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {categorySales.map((cat) => (
                      <TableRow key={cat.name}>
                        <TableCell className="font-medium">{cat.name}</TableCell>
                        <TableCell className="text-right">{cat.quantity}</TableCell>
                        <TableCell className="text-right">{t("currency")} {cat.value.toLocaleString()}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>
          </TabsContent>
          
          <TabsContent value="product">
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <h4 className="font-medium mb-4">{t("topSellingMedicines")}</h4>
                {topProducts.length > 0 ? (
                  <ChartContainer config={chartConfig} className="h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={topProducts} layout="vertical">
                        <XAxis type="number" />
                        <YAxis dataKey="name" type="category" width={100} tick={{ fontSize: 12 }} />
                        <ChartTooltip content={<ChartTooltipContent />} />
                        <Bar dataKey="revenue" fill="hsl(var(--primary))" radius={[0, 4, 4, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </ChartContainer>
                ) : (
                  <p className="text-center text-muted-foreground py-8">{t("noData")}</p>
                )}
              </div>
              <div>
                <h4 className="font-medium mb-4">{t("leastSellingMedicines")}</h4>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>{t("medicine")}</TableHead>
                      <TableHead className="text-right">{t("quantitySold")}</TableHead>
                      <TableHead className="text-right">{t("totalRevenue")}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {leastProducts.length > 0 ? leastProducts.map((prod) => (
                      <TableRow key={prod.name}>
                        <TableCell className="font-medium">{prod.name}</TableCell>
                        <TableCell className="text-right">{prod.quantity}</TableCell>
                        <TableCell className="text-right">{t("currency")} {prod.revenue.toLocaleString()}</TableCell>
                      </TableRow>
                    )) : (
                      <TableRow>
                        <TableCell colSpan={3} className="text-center text-muted-foreground">{t("noData")}</TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};

export default SalesBreakdownSection;