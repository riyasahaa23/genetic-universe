import { Metadata } from "next";
import { CounterfactualRescuePage } from "@/components/counterfactual-rescue/CounterfactualRescuePage";

export const metadata: Metadata = {
  title: "Counterfactual Rescue | Genetic Universe → Offspring Universe",
  description:
    "Explore counterfactual genomic modifications to test explanatory sufficiency and evaluate whether unexpected phenotypes can be restored to parental ranges.",
};

export default function CounterfactualRescueRoute() {
  return <CounterfactualRescuePage />;
}
