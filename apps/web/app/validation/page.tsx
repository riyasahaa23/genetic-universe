import { Metadata } from "next";
import { ValidationPage } from "@/components/validation/ValidationPage";

export const metadata: Metadata = {
  title: "Validation | Genetic Universe → Offspring Universe",
  description:
    "Scientific validation suite evaluating blind attribution recovery, exact mechanism recovery, counterfactual faithfulness, negative controls, and bootstrap confidence intervals.",
};

export default function ValidationRoute() {
  return <ValidationPage />;
}
