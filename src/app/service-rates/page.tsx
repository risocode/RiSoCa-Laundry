
import { AppHeader } from '@/components/app-header';
import { AppFooter } from '@/components/app-footer';
import { PromoBanner } from '@/components/promo-banner';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

const services = [
    { service: 'Wash, Dry, Fold (per 7.5kg load)', price: '180.00' },
];

const deliverySurcharges = [
    { distance: 'First 1 km', price: 'Free' },
    { distance: 'Each additional km', price: '20.00' },
];

export default function ServiceRatesPage() {
  return (
    <div className="flex flex-col h-screen">
      <AppHeader />
      <PromoBanner />
      <main className="flex-1 scrollable container mx-auto px-4 flex flex-col items-center justify-center pb-14">
        <div className="flex flex-col items-center text-center mb-8">
            <h1 className="text-2xl md:text-4xl font-bold text-primary">Service Rates</h1>
            <p className="text-sm md:text-lg text-muted-foreground mt-2">Transparent pricing for all our services.</p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-8 max-w-4xl mx-auto w-full">
            <Card>
                <CardHeader className="p-3">
                    <CardTitle className="text-lg">Standard Services</CardTitle>
                </CardHeader>
                <CardContent className="p-3 pt-0">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead className="h-8 text-xs">Service</TableHead>
                                <TableHead className="text-right h-8 text-xs">Price (₱)</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {services.map((item) => (
                                <TableRow key={item.service}>
                                    <TableCell className="p-2 text-xs">{item.service}</TableCell>
                                    <TableCell className="text-right p-2 text-xs">{item.price}</TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>

            <Card>
                <CardHeader className="p-3">
                    <CardTitle className="text-lg">Delivery Surcharges</CardTitle>
                </CardHeader>
                <CardContent className="p-3 pt-0">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead className="h-8 text-xs">Distance</TableHead>
                                <TableHead className="text-right h-8 text-xs">Price (₱)</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {deliverySurcharges.map((item) => (
                                <TableRow key={item.distance}>
                                    <TableCell className="p-2 text-xs">{item.distance}</TableCell>
                                    <TableCell className="text-right p-2 text-xs">{item.price}</TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div>

      </main>
      <AppFooter />
    </div>
  );
}
