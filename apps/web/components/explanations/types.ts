export interface ExplanationSceneConfig {
  id: string;
  index: number;
  title: string;
  duration: number; // in seconds
  simpleText: string;
  technicalText: string;
  annotationBadge: string;
  annotationSub?: string;
}

export interface ExplanationTechnicalDetail {
  title: string;
  biologicalContext: string;
  computationalRole: string;
  formula?: string;
  keyTakeaway: string;
}

export interface PageExplanationConfig {
  pageKey: "inheritance-paradox" | "meiosis-lab" | "phenotype-engine" | "novelty-trace" | "counterfactual-rescue" | "validation";
  pageTitle: string;
  scientificQuestion: string;
  totalDuration: number;
  finalThesis: string;
  technicalDetail: ExplanationTechnicalDetail;
  scenes: ExplanationSceneConfig[];
}
