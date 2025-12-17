'use client';

import { useState } from 'react';
import { AppHeader } from '@/components/app-header';
import { AppFooter } from '@/components/app-footer';
import { PromoBanner } from '@/components/promo-banner';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Search, HelpCircle, MessageCircle, Phone, Mail, MapPin, Clock, Package, Truck, DollarSign, CheckCircle2, Sparkles } from 'lucide-react';
import Link from 'next/link';

const faqs = [
    {
        question: "What are your operating hours?",
        answer: "We are open from Monday to Sunday, 7:30 AM to 7:30 PM.",
        category: "general",
        icon: Clock
    },
    {
        question: "How does your pricing work?",
        answer: "Our standard pricing is ₱180 per 7.5kg load for wash, dry, and fold services. For services requiring delivery, we charge ₱20 per kilometer after the first kilometer, which is free. For a detailed breakdown, please visit our Service Rates page.",
        category: "pricing",
        icon: DollarSign
    },
    {
        question: "What are your service packages?",
        answer: "We offer three main packages: Package 1 (Wash, Dry, & Fold), Package 2 (One-Way Transport), and Package 3 (All-In, including both pickup and delivery). You can choose the one that best suits your needs on the Create Order page.",
        category: "services",
        icon: Package
    },
    {
        question: "How can I track my order?",
        answer: "Once you place an order, you can track its real-time status by visiting the 'Order Status' page on our website. You will see updates from 'Order Placed' all the way to 'Delivered'.",
        category: "orders",
        icon: CheckCircle2
    },
    {
        question: "Do you offer pickup and delivery?",
        answer: "Yes! Our 'Package 3' is an all-inclusive service that covers both pickup and delivery. 'Package 2' offers one-way transport, where you can choose either pickup or delivery.",
        category: "services",
        icon: Truck
    },
    {
        question: "How is the delivery fee calculated?",
        answer: "The first kilometer of delivery is free! After that, we charge a flat rate of ₱20 per kilometer. The distance is calculated from our main branch to your selected location on the map.",
        category: "pricing",
        icon: MapPin
    },
    {
        question: "Is there a minimum weight for laundry service?",
        answer: "Our pricing is based on a standard load of 7.5kg. Any weight up to 7.5kg is considered one load. If your laundry exceeds this, it will be calculated as additional loads.",
        category: "pricing",
        icon: Package
    },
    {
        question: "What payment methods do you accept?",
        answer: "We accept cash payments. Payment can be made when you drop off your laundry or upon delivery. For more details, please contact us directly.",
        category: "general",
        icon: DollarSign
    },
    {
        question: "How long does it take to complete an order?",
        answer: "Standard service typically takes 24-48 hours from when your laundry arrives at the shop. Rush orders may be available upon request - please contact us for availability.",
        category: "orders",
        icon: Clock
    },
    {
        question: "Can I cancel my order?",
        answer: "Yes, you can cancel your order if it hasn't been processed yet. Please visit the Order Status page and use the cancel option, or contact us directly for assistance.",
        category: "orders",
        icon: CheckCircle2
    },
]

const categories = [
    { id: 'all', label: 'All Questions', icon: HelpCircle },
    { id: 'general', label: 'General', icon: MessageCircle },
    { id: 'pricing', label: 'Pricing', icon: DollarSign },
    { id: 'services', label: 'Services', icon: Package },
    { id: 'orders', label: 'Orders', icon: CheckCircle2 },
]

export default function FaqsPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');

  const filteredFaqs = faqs.filter(faq => {
    const matchesSearch = searchQuery.trim() === '' || 
      faq.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
      faq.answer.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || faq.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="flex flex-col h-screen">
      <AppHeader />
      <PromoBanner />
      <main className="flex-1 overflow-y-auto overflow-x-hidden scrollable pb-20">
        <div className="container mx-auto px-4 py-6 sm:py-8">
          <div className="w-full max-w-5xl mx-auto space-y-6">
            {/* Header Section */}
            <div className="text-center space-y-3">
              <div className="flex items-center justify-center gap-3 mb-2">
                <div className="p-2 rounded-lg bg-primary/10">
                  <HelpCircle className="h-6 w-6 text-primary" />
                </div>
                <h1 className="text-3xl sm:text-4xl font-bold">Frequently Asked Questions</h1>
              </div>
              <p className="text-sm sm:text-base text-muted-foreground max-w-2xl mx-auto">
                Find answers to common questions about our laundry services, pricing, and how we work.
              </p>
            </div>

            {/* Search Bar */}
            <Card className="shadow-md">
              <CardContent className="p-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                  <Input
                    placeholder="Search for questions..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10 h-12 text-base"
                  />
                </div>
              </CardContent>
            </Card>

            {/* Category Filters */}
            <div className="flex flex-wrap gap-2 justify-center">
              {categories.map((category) => {
                const Icon = category.icon;
                return (
                  <Button
                    key={category.id}
                    variant={selectedCategory === category.id ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setSelectedCategory(category.id)}
                    className="gap-2"
                  >
                    <Icon className="h-4 w-4" />
                    {category.label}
                  </Button>
                );
              })}
            </div>

            {/* Quick Info Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card className="bg-gradient-to-br from-primary/5 to-primary/10 border-primary/20">
                <CardContent className="p-5">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="p-2 rounded-lg bg-primary/20">
                      <Clock className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold">Operating Hours</p>
                      <p className="text-xs text-muted-foreground">Mon - Sun</p>
                    </div>
                  </div>
                  <p className="text-sm font-bold text-primary">7:30 AM - 7:30 PM</p>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-950/20 dark:to-green-900/20 border-green-200 dark:border-green-800">
                <CardContent className="p-5">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="p-2 rounded-lg bg-green-500/20">
                      <Truck className="h-5 w-5 text-green-600 dark:text-green-400" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold">Free Delivery</p>
                      <p className="text-xs text-muted-foreground">First kilometer</p>
                    </div>
                  </div>
                  <p className="text-sm font-bold text-green-700 dark:text-green-300">₱20/km after</p>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-950/20 dark:to-blue-900/20 border-blue-200 dark:border-blue-800">
                <CardContent className="p-5">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="p-2 rounded-lg bg-blue-500/20">
                      <Package className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold">Standard Load</p>
                      <p className="text-xs text-muted-foreground">Per 7.5kg</p>
                    </div>
                  </div>
                  <p className="text-sm font-bold text-blue-700 dark:text-blue-300">₱180 per load</p>
                </CardContent>
              </Card>
            </div>

            {/* FAQs Accordion */}
            <Card className="shadow-lg">
              <CardContent className="p-6">
                {filteredFaqs.length > 0 ? (
                  <Accordion type="single" collapsible className="w-full space-y-2">
                    {filteredFaqs.map((faq, index) => {
                      const Icon = faq.icon;
                      return (
                        <AccordionItem 
                          key={index} 
                          value={`item-${index}`}
                          className="border rounded-lg px-4 hover:bg-muted/50 transition-colors"
                        >
                          <AccordionTrigger className="text-base font-semibold text-left py-4 hover:no-underline">
                            <div className="flex items-center gap-3 flex-1">
                              <div className="flex-shrink-0 p-2 rounded-lg bg-primary/10">
                                <Icon className="h-4 w-4 text-primary" />
                              </div>
                              <span className="flex-1">{faq.question}</span>
                            </div>
                          </AccordionTrigger>
                          <AccordionContent className="text-sm text-muted-foreground pb-4 pl-11">
                            <div className="pt-2 leading-relaxed">
                              {faq.answer}
                            </div>
                          </AccordionContent>
                        </AccordionItem>
                      );
                    })}
                  </Accordion>
                ) : (
                  <div className="text-center py-12">
                    <HelpCircle className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                    <p className="text-lg font-semibold mb-2">No questions found</p>
                    <p className="text-sm text-muted-foreground">
                      Try adjusting your search or filter criteria
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Contact Section */}
            <Card className="bg-gradient-to-r from-primary/5 to-primary/10 border-primary/20">
              <CardContent className="p-6">
                <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="p-3 rounded-full bg-primary/20">
                      <MessageCircle className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-lg">Still have questions?</h3>
                      <p className="text-sm text-muted-foreground">
                        Can't find what you're looking for? We're here to help!
                      </p>
                    </div>
                  </div>
                  <div className="flex flex-col sm:flex-row gap-2">
                    <Link href="/contact-us">
                      <Button variant="outline" className="gap-2 w-full sm:w-auto">
                        <Phone className="h-4 w-4" />
                        Contact Us
                      </Button>
                    </Link>
                    <Link href="/create-order">
                      <Button className="gap-2 w-full sm:w-auto">
                        <Sparkles className="h-4 w-4" />
                        Create Order
                      </Button>
                    </Link>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
      <AppFooter />
    </div>
  );
}
