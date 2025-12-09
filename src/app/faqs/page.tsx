
import { AppHeader } from '@/components/app-header';
import { AppFooter } from '@/components/app-footer';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"

const faqs = [
    {
        question: "What are your operating hours?",
        answer: "We are open from Monday to Sunday, 7:30 AM to 7:30 PM."
    },
    {
        question: "How does your pricing work?",
        answer: "Our standard pricing is ₱180 per 7.5kg load for wash, dry, and fold services. For services requiring delivery, we charge ₱20 per kilometer after the first kilometer, which is free. For a detailed breakdown, please visit our Service Rates page."
    },
    {
        question: "What are your service packages?",
        answer: "We offer three main packages: Package 1 (Wash, Dry, & Fold), Package 2 (One-Way Transport), and Package 3 (All-In, including both pickup and delivery). You can choose the one that best suits your needs on the Create Order page."
    },
    {
        question: "How can I track my order?",
        answer: "Once you place an order, you can track its real-time status by visiting the 'Order Status' page on our website. You will see updates from 'Order Placed' all the way to 'Delivered'."
    },
    {
        question: "Do you offer pickup and delivery?",
        answer: "Yes! Our 'Package 3' is an all-inclusive service that covers both pickup and delivery. 'Package 2' offers one-way transport, where you can choose either pickup or delivery."
    },
    {
        question: "How is the delivery fee calculated?",
        answer: "The first kilometer of delivery is free! After that, we charge a flat rate of ₱20 per kilometer. The distance is calculated from our main branch to your selected location on the map."
    },
    {
        question: "Is there a minimum weight for laundry service?",
        answer: "Our pricing is based on a standard load of 7.5kg. Any weight up to 7.5kg is considered one load. If your laundry exceeds this, it will be calculated as additional loads."
    },
]

export default function FaqsPage() {
  return (
    <div className="flex flex-col h-screen">
      <AppHeader showLogo={true} />
      <main className="flex-1 overflow-hidden container mx-auto px-4 flex flex-col items-center justify-center">
        <div className="flex flex-col items-center text-center mb-8">
            <h1 className="text-2xl md:text-4xl font-bold text-primary">Frequently Asked Questions</h1>
            <p className="text-sm md:text-lg text-muted-foreground mt-2">Find answers to common questions about our services.</p>
        </div>
        
        <div className="max-w-3xl mx-auto w-full">
            <Accordion type="single" collapsible className="w-full">
                {faqs.map((faq, index) => (
                     <AccordionItem key={index} value={`item-${index}`}>
                        <AccordionTrigger className="text-sm md:text-base text-left py-2">{faq.question}</AccordionTrigger>
                        <AccordionContent className="text-xs md:text-sm text-muted-foreground pb-2">
                            {faq.answer}
                        </AccordionContent>
                    </AccordionItem>
                ))}
            </Accordion>
        </div>
      </main>
      <AppFooter />
    </div>
  );
}
