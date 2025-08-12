import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

export function HowToPlay() {
  return (
    <Accordion
      type="single"
      collapsible
      className="w-full"
      defaultValue="item-1"
    >
      <AccordionItem value="item-1">
        <AccordionTrigger className="text-white text-2xl">How to Play Game</AccordionTrigger>
        <AccordionContent className="flex flex-col gap-4 text-balance">
          <ul className="text-white font-lg flex flex-col justify-start items-start gap-4">
            <li>Control Avatar with arrow keys</li>
            <li>Use "W" to move forward</li>
            <li>Use "S" to move backward</li>
            <li>Use "A" to move left</li>
            <li>Use "D" to move right</li>
            <li>Avoid hitting or being hit by a moving car</li>
            <li>Complete missions to earn XPs, and move to the next stage</li>
          </ul>
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  );
}
