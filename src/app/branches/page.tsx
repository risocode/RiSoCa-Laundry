
import { AppHeader } from '@/components/app-header';
import { AppFooter } from '@/components/app-footer';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { MapPin, Phone } from 'lucide-react';

const branches = [
    { name: "Downtown Branch", address: "123 Main St, Cityville", phone: "555-0101" },
    { name: "North Suburb Branch", address: "456 Oak Ave, Northtown", phone: "555-0102" },
    { name: "Eastside Branch", address: "789 Pine Ln, Eastwick", phone: "555-0103" },
    { name: "West End Branch", address: "101 Maple Dr, Westburg", phone: "555-0104" },
]

export default function BranchesPage() {
  return (
    <div className="flex flex-col min-h-screen">
      <AppHeader />
      <main className="flex-1 container mx-auto px-4 py-12">
        <div className="flex flex-col items-center text-center mb-12">
            <h1 className="text-3xl md:text-4xl font-bold text-primary">Our Branches</h1>
            <p className="text-base md:text-lg text-muted-foreground mt-2">Find an RKR Laundry location near you.</p>
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {branches.map(branch => (
                <Card key={branch.name}>
                    <CardHeader>
                        <CardTitle>{branch.name}</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                        <div className="flex items-center gap-2 text-muted-foreground">
                            <MapPin className="h-4 w-4" />
                            <span>{branch.address}</span>
                        </div>
                        <div className="flex items-center gap-2 text-muted-foreground">
                            <Phone className="h-4 w-4" />
                            <span>{branch.phone}</span>
                        </div>
                    </CardContent>
                </Card>
            ))}
        </div>
      </main>
      <AppFooter />
    </div>
  );
}
