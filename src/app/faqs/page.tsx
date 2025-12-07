
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
        answer: "We are open from 8:00 AM to 10:00 PM, Monday to Sunday."
    },
    {
        question: "How does the pricing work?",
        answer: "We charge per kilogram for most services. Special items are priced per piece."
    },
    {
        question: "What is the turnaround time?",
        answer: "Standard service takes 24-48 hours. Express services are available."
    },
    {
        question: "Do you offer pickup and delivery?",
        answer: "Yes, we offer pickup and delivery services based on your distance."
    },
    {
        question: "How can I track my order?",
        answer: "You can track your order in real-time on our website or mobile app."
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
