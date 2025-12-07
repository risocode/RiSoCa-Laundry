
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
        answer: "We charge per kilogram for most services like wash, dry, and fold. Special items like suits or dresses are priced per piece. You can check our Service Rates page for more details."
    },
    {
        question: "What is the turnaround time?",
        answer: "Standard service takes 24-48 hours. We also offer express services for same-day delivery at an additional cost."
    },
    {
        question: "Do you offer pickup and delivery?",
        answer: "Yes, we offer pickup and delivery services. The charges are based on your distance from our nearest branch."
    },
    {
        question: "How can I track my order?",
        answer: "You can track your order in real-time using the 'Order Status' feature on our website or mobile app. You will receive notifications at every stage of the process."
    },
]

export default function FaqsPage() {
  return (
    <div className="flex flex-col min-h-screen">
      <AppHeader />
      <main className="flex-1 container mx-auto px-4 py-12">
        <div className="flex flex-col items-center text-center mb-12">
            <h1 className="text-4xl font-bold text-primary">Frequently Asked Questions</h1>
            <p className="text-lg text-muted-foreground mt-2">Find answers to common questions about our services.</p>
        </div>
        
        <div className="max-w-3xl mx-auto">
            <Accordion type="single" collapsible className="w-full">
                {faqs.map((faq, index) => (
                     <AccordionItem key={index} value={`item-${index}`}>
                        <AccordionTrigger className="text-lg text-left">{faq.question}</AccordionTrigger>
                        <AccordionContent className="text-base text-muted-foreground">
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
