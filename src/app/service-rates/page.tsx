
import { AppHeader } from '@/components/app-header';
import { AppFooter } from '@/components/app-footer';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

const services = [
    { service: 'Wash & Fold (per kg)', price: '8.00' },
    { service: 'Drying (per kg)', price: '5.00' },
    { service: 'Ironing (per piece)', price: '3.00' },
    { service: 'Stain Removal (per piece)', price: '10.00' },
    { service: 'Delicate Wash (per piece)', price: '12.00' },
    { service: 'Beddings & Linens (per kg)', price: '15.00' },
];

const deliverySurcharges = [
    { distance: '0-5 miles', price: '5.00' },
    { distance: '5-10 miles', price: '10.00' },
    { distance: '10+ miles', price: '15.00' },
];

export default function ServiceRatesPage() {
  return (
    <div className="flex flex-col h-screen">
      <AppHeader />
      <main className="flex-1 overflow-y-auto pt-4 pb-20 container mx-auto px-4">
        <div className="flex flex-col items-center text-center mb-12">
            <h1 className="text-3xl md:text-4xl font-bold text-primary">Service Rates</h1>
            <p className="text-base md:text-lg text-muted-foreground mt-2">Transparent pricing for all our services.</p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            <Card>
                <CardHeader>
                    <CardTitle>Standard Services</CardTitle>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Service</TableHead>
                                <TableHead className="text-right">Price ($)</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {services.map((item) => (
                                <TableRow key={item.service}>
                                    <TableCell>{item.service}</TableCell>
                                    <TableCell className="text-right">{item.price}</TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>Delivery Surcharges</CardTitle>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Distance</TableHead>
                                <TableHead className="text-right">Price ($)</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {deliverySurcharges.map((item) => (
                                <TableRow key={item.distance}>
                                    <TableCell>{item.distance}</TableCell>
                                    <TableCell className="text-right">{item.price}</TableCell>
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
