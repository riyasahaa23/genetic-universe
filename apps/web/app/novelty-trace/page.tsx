import { Metadata } from "next";
import { NoveltyTracePage } from "@/components/novelty-trace/NoveltyTracePage";

export const metadata: Metadata = {
  title: "Novelty Trace | Genetic Universe → Offspring Universe",
  description:
    "Backward computational attribution: trace the inherited genomic configurations that explain transgressive offspring phenotypes under our model.",
};

export default function NoveltyTraceRoute() {
  return <NoveltyTracePage />;
}
