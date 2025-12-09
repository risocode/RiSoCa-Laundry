
import { AppHeader } from '@/components/app-header';
import { AppFooter } from '@/components/app-footer';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { MapPin, Phone, Link as LinkIcon } from 'lucide-react';
import Link from 'next/link';

const branches = [
    { 
        name: "Main Branch", 
        address: "228 Divisoria Enrile Cagayan", 
        mapLink: "https://maps.app.goo.gl/CDcYYu91x34uhuHm9",
        phoneNumbers: [
            "09157079908",
            "09459787490",
            "09154354549",
            "09288112476"
        ] 
    },
]

export default function BranchesPage() {
  return (
    <div className="flex flex-col h-screen">
      <AppHeader showLogo={true} />
      <main className="flex-1 overflow-y-auto container mx-auto px-4 flex flex-col items-center justify-center">
        <div className="flex flex-col items-center text-center mb-8">
            <h1 className="text-2xl md:text-4xl font-bold text-primary">Our Branches</h1>
            <p className="text-sm md:text-lg text-muted-foreground mt-2">Find an RKR Laundry location near you.</p>
        </div>
        
        <div className="grid grid-cols-1 gap-4 md:gap-8 w-full max-w-md">
            {branches.map(branch => (
                <Card key={branch.name}>
                    <CardHeader className="p-4">
                        <CardTitle className="text-base md:text-xl">{branch.name}</CardTitle>
                    </CardHeader>
                    <CardContent className="p-4 pt-0 space-y-4">
                        <div className="flex items-start gap-3 text-muted-foreground text-sm">
                            <MapPin className="h-5 w-5 mt-0.5 flex-shrink-0" />
                            <span>{branch.address}</span>
                        </div>
                        
                        <div className="flex items-center gap-3 text-muted-foreground text-sm">
                            <LinkIcon className="mr-2 h-4 w-4" />
                            <Link href={branch.mapLink} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
                                RKR Laundry Shop
                            </Link>
                        </div>
                        
                        <div className="space-y-2">
                             <div className="flex items-start gap-3 text-muted-foreground text-sm">
                                <Phone className="h-5 w-5 mt-0.5 flex-shrink-0" />
                                <div className="flex flex-col">
                                    {branch.phoneNumbers.map(phone => (
                                        <a key={phone} href={`tel:${phone}`} className="hover:text-primary">{phone}</a>
                                    ))}
                                </div>
                            </div>
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
