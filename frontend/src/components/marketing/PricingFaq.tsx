'use client';

import React from 'react';
import {
  Accordion,
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
} from '@/components/ui/accordion';

export default function PricingFaq() {
  return (
    <div className="w-full max-w-3xl mx-auto">
      <Accordion type="single" collapsible defaultValue="item-1">
        <AccordionItem value="item-1">
          <AccordionTrigger>Can I cancel anytime?</AccordionTrigger>
          <AccordionContent>
            Yes. You can cancel your subscription at any time directly from your workspace billing settings. There are no long-term lock-ins or cancellation penalties for Starter or Growth tiers. Upon cancellation, your access remains active through the end of your current billing period.
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="item-2">
          <AccordionTrigger>How is data gathered and tracked?</AccordionTrigger>
          <AccordionContent>
            Vaatify GEO performs live searches across Google AI, ChatGPT, and Perplexity exactly as a real customer would. We read the complete answer generated in real time, extract every source website cited, and calculate your exact recommendation ranking so your data always matches what buyers actually see.
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="item-3">
          <AccordionTrigger>What is included in the Done-For-You setup?</AccordionTrigger>
          <AccordionContent>
            Our Done-For-You tier is designed for teams that want end-to-end management. It includes custom AI integration into your existing systems, a Dedicated Account Manager, full workflow setup, custom buyer question modeling, and ongoing monthly strategy reviews of your visibility reports so you never have to configure or manage the software yourself.
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </div>
  );
}
