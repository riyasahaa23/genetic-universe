export type FlowStageId =
  | "parents"
  | "haplotypes"
  | "meiosis"
  | "recombination"
  | "offspring"
  | "phenotype"
  | "novelty"
  | "trace"
  | "rescue"
  | "summary";

export interface TechnicalDetailContent {
  title: string;
  biologicalContext: string;
  computationalRole: string;
  formula?: string;
  keyTakeaway: string;
}

export interface FlowStageConfig {
  id: FlowStageId;
  index: number;
  chapterNumber: number;
  title: string;
  shortLabel: string;
  duration: number; // in seconds
  simpleText: string;
  scientificText: string;
  annotationBadge: string;
  annotationSub?: string;
  cameraPosition: [number, number, number];
  cameraTarget: [number, number, number];
  technicalDetail: TechnicalDetailContent;
}

export const FLOW_STAGES: FlowStageConfig[] = [
  {
    id: "parents",
    index: 0,
    chapterNumber: 1,
    title: "Parents",
    shortLabel: "1. Parents",
    duration: 8,
    simpleText: "Every offspring begins with two parental genomes.",
    scientificText: "Each parent contributes one haploid gamete derived from diploid homologous chromosomes.",
    annotationBadge: "DIPLOID PARENTAL GENOMES",
    annotationSub: "Parent A (Cyan) & Parent B (Magenta) — 2n = 46",
    cameraPosition: [0, 0.8, 10.5],
    cameraTarget: [0, 0.5, 0],
    technicalDetail: {
      title: "Diploid Parental Architecture",
      biologicalContext: "Eukaryotic sexual reproduction initiates with diploid (2n) progenitors harboring homologous chromosome pairs inherited from ancestral lineages.",
      computationalRole: "Initializes dual diploid reference genome matrices with phase-resolved single nucleotide variants and structural markers across parental lines.",
      keyTakeaway: "Homologous chromosome pairs carry ancestral genomic variation that serves as the substrate for meiotic reshuffling.",
    },
  },
  {
    id: "haplotypes",
    index: 1,
    chapterNumber: 2,
    title: "Haplotypes",
    shortLabel: "2. Haplotypes",
    duration: 8,
    simpleText: "Chromosomes carry different combinations of inherited variants.",
    scientificText: "Phase-resolved haplotypes preserve which alleles occur together on each parental homolog.",
    annotationBadge: "PHASE-RESOLVED HAPLOTYPES",
    annotationSub: "Maternal (A1, A2) & Paternal (B1, B2) Phasing",
    cameraPosition: [0, 0.6, 7.8],
    cameraTarget: [0, 0.4, 0],
    technicalDetail: {
      title: "Physical Linkage & Phase-Resolution",
      biologicalContext: "Alleles situated on the same physical chromosome molecule are physically linked and co-inherited during gametogenesis unless broken by recombination.",
      computationalRole: "Standard unphased genotype data collapses heterozygous sites into 0/1/2 counts. Phase-resolution explicitly maps allele configurations to specific homolog tracks, enabling detection of cis-epistatic interactions.",
      formula: "H = {h_1, h_2} \\in \\{0, 1\\}^{2 \\times L}",
      keyTakeaway: "Phase preserves cis-regulatory linkage essential for epistatic coupling.",
    },
  },
  {
    id: "meiosis",
    index: 2,
    chapterNumber: 3,
    title: "Meiosis",
    shortLabel: "3. Meiosis",
    duration: 9,
    simpleText: "Before reproduction, chromosome pairs separate to create gametes.",
    scientificText: "During meiosis, homologous chromosomes pair, segregate, and produce haploid gametes.",
    annotationBadge: "SYNAPTONEMAL SYNAPSIS",
    annotationSub: "Prophase I Homologous Pairing & Bivalent Alignment",
    cameraPosition: [0, 0.5, 6.5],
    cameraTarget: [0, 0.3, 0],
    technicalDetail: {
      title: "Meiotic Synapsis & Reductive Division",
      biologicalContext: "In Prophase I of meiosis, the proteinaceous synaptonemal complex zips homologous maternal and paternal chromosomes together into bivalent tetrads.",
      computationalRole: "Simulates homolog recognition, synaptonemal alignment, and prepares the physical substrate for double-strand break formation and crossover resolution.",
      keyTakeaway: "Homolog alignment brings non-sister chromatids into sub-micron proximity for reciprocal genetic exchange.",
    },
  },
  {
    id: "recombination",
    index: 3,
    chapterNumber: 4,
    title: "Recombination",
    shortLabel: "4. Recombination",
    duration: 10,
    simpleText: "Chromosomes can exchange pieces, creating combinations that neither parent carried in that exact form.",
    scientificText: "Meiotic crossover generates recombinant haplotypes by exchanging segments between homologous chromatids.",
    annotationBadge: "CROSSOVER DETECTED",
    annotationSub: "Chiasma Junction Resolution (Gold Highlight)",
    cameraPosition: [0, 0.3, 5.2],
    cameraTarget: [0, 0.2, 0],
    technicalDetail: {
      title: "Reciprocal Meiotic Crossover",
      biologicalContext: "Spo11-induced double-strand breaks resolve through double Holliday junctions into crossovers, physically swapping reciprocal DNA segments between homologous non-sister chromatids.",
      computationalRole: "Stochastically samples crossover break coordinates according to species-specific recombination rate maps λ(x), creating novel mosaic haplotype strings.",
      formula: "P(k \\text{ crossovers in interval } d) = \\frac{(\\lambda d)^k e^{-\\lambda d}}{k!}",
      keyTakeaway: "Recombination generates novel allele linkages without requiring de novo mutations.",
    },
  },
  {
    id: "offspring",
    index: 4,
    chapterNumber: 5,
    title: "Offspring",
    shortLabel: "5. Offspring",
    duration: 8,
    simpleText: "The offspring inherits a new mosaic of both parental genomes.",
    scientificText: "Fertilization combines the transmitted maternal and paternal gametes into a new diploid offspring genotype.",
    annotationBadge: "MOSAIC OFFSPRING GENOME",
    annotationSub: "Dual-Parent Provenance (Transmitted Maternal & Paternal Gametes)",
    cameraPosition: [0, 0.4, 7.2],
    cameraTarget: [0, 0.1, 0],
    technicalDetail: {
      title: "Syngamy & Mosaic Diploid Restoration",
      biologicalContext: "Fertilization fuses one recombinant maternal gamete (1n) with one recombinant paternal gamete (1n), restoring diploidy (2n) with an unprecedented mosaic haplotype pattern.",
      computationalRole: "Assembles the offspring diploid genotype matrix G_off by concatenating transmitted haplotype segments with exact provenance pointers back to parental homolog origins.",
      keyTakeaway: "The offspring is not an average of parents, but a discrete mosaic of ancestral blocks.",
    },
  },
  {
    id: "phenotype",
    index: 5,
    chapterNumber: 6,
    title: "Phenotype",
    shortLabel: "6. Phenotype",
    duration: 10,
    simpleText: "Genes do not always act independently. Their effects can combine.",
    scientificText: "The configured phenotype function combines additive, dominance, and pairwise epistatic terms.",
    annotationBadge: "COMPUTATIONAL PHENOTYPE MODEL",
    annotationSub: "In-Silico Polygenic Mapping Function (Non-Cellular)",
    cameraPosition: [0, 0.2, 8.5],
    cameraTarget: [0, 0, 0],
    technicalDetail: {
      title: "Non-Linear Epistatic Phenotype Architecture",
      biologicalContext: "Proteins operate in biochemical networks. Gene-gene interactions (epistasis) modulate flux through metabolic pathways, causing phenotypes to deviate from simple additive expectations.",
      computationalRole: "Evaluates the mathematical phenotype mapping function combining linear additive weights, dominance coefficients, and non-linear pairwise interaction tensors.",
      formula: "y = \\sum_{i} \\alpha_i x_i + \\sum_{j} \\beta_j d_j + \\sum_{u < v} \\gamma_{uv} x_u x_v + \\epsilon",
      keyTakeaway: "Epistatic non-linearities allow recombinant allele pairings to produce discontinuous phenotypic shifts.",
    },
  },
  {
    id: "novelty",
    index: 6,
    chapterNumber: 7,
    title: "Novelty",
    shortLabel: "7. Novelty",
    duration: 8,
    simpleText: "Sometimes the offspring phenotype goes beyond both parents.",
    scientificText: "This is a transgressive phenotype — a value outside the parental phenotype envelope under the configured model.",
    annotationBadge: "TRANSGRESSIVE SEGREGATION",
    annotationSub: "Observed Offspring Exceeds [P_min, P_max] Envelope",
    cameraPosition: [0, 0, 8.0],
    cameraTarget: [0, 0, 0],
    technicalDetail: {
      title: "Transgressive Phenotypic Segregation",
      biologicalContext: "When recombination uncouples alleles from negative genetic buffering in parental genomes, complementary positive alleles can coalesce, yielding a phenotype outside both parental bounds.",
      computationalRole: "Computes the parental bounding interval [P_min, P_max] and evaluates whether the offspring trait y_off satisfies y_off > P_max or y_off < P_min with statistical significance against empirical meiotic null simulations.",
      keyTakeaway: "Transgressive novelty emerges deterministically from recombination-induced epistatic interactions.",
    },
  },
  {
    id: "trace",
    index: 7,
    chapterNumber: 8,
    title: "Novelty Trace",
    shortLabel: "8. Trace",
    duration: 10,
    simpleText: "Now we ask which inherited configuration best explains the unusual outcome.",
    scientificText: "The attribution engine ranks candidate variants, segments, and epistatic configurations using model-relative counterfactual evidence and provenance.",
    annotationBadge: "BACKWARD COMPUTATIONAL ATTRIBUTION",
    annotationSub: "Model-Relative Causal Ranking (Does Not Reverse Biological Time)",
    cameraPosition: [0, 0.2, 7.6],
    cameraTarget: [0, 0, 0],
    technicalDetail: {
      title: "Backward Computational Attribution",
      biologicalContext: "Identifying the genetic basis of extreme traits in complex organisms requires untangling polygenic backgrounds without requiring exhaustive wet-lab screening of millions of loci.",
      computationalRole: "Traces backward through the provenance DAG (Parent -> Homolog -> Crossover -> Segment -> Phenotype), ranking candidate locus pairs by their Shapley-style attribution score and epistatic interaction energy.",
      formula: "\\phi_k = \\sum_{S \\subseteq N \\setminus \\{k\\}} \\frac{|S|!(|N|-|S|-1)!}{|N|!} [v(S \\cup \\{k\\}) - v(S)]",
      keyTakeaway: "Computational attribution isolates top candidate configurations responsible for the transgressive surge.",
    },
  },
  {
    id: "rescue",
    index: 8,
    chapterNumber: 9,
    title: "Counterfactual Rescue",
    shortLabel: "9. Rescue",
    duration: 10,
    simpleText: "We change one modeled configuration and ask whether the unusual phenotype disappears.",
    scientificText: "A counterfactual intervention recomputes the phenotype after altering a candidate variant, inherited segment, or modeled interaction.",
    annotationBadge: "IN-SILICO COUNTERFACTUAL RESCUE",
    annotationSub: "Minimal Rescue Set Prioritization (Purely Computational Simulation)",
    cameraPosition: [0, 0.2, 8.2],
    cameraTarget: [0, 0, 0],
    technicalDetail: {
      title: "In-Silico Counterfactual Ablation & Minimal Rescue",
      biologicalContext: "Computational pre-screening prior to wet-lab experiment design helps geneticists select the minimal number of precise molecular targets required to modulate a quantitative trait.",
      computationalRole: "Simulates in-silico allele reversion or edge ablation on candidate loci. Determines the minimal cardinality set S* such that y(x_{S*}^{ref}) returns inside the parental envelope [P_min, P_max].",
      formula: "S^* = \\arg\\min_{S \\subseteq \\mathcal{C}} |S| \\quad \\text{s.t.} \\quad y(x_{-S}, x_S^{\\text{ref}}) \\in [P_{\\min}, P_{\\max}]",
      keyTakeaway: "Minimal rescue pinpoints the highest-leverage target loci for prioritized laboratory validation.",
    },
  },
  {
    id: "summary",
    index: 9,
    chapterNumber: 10,
    title: "Summary",
    shortLabel: "10. Summary",
    duration: 15,
    simpleText: "From inheritance to explanation.",
    scientificText: "Genetic Universe links meiotic provenance, non-linear phenotype modeling, and counterfactual attribution in one auditable computational workflow.",
    annotationBadge: "COMPLETE COMPUTATIONAL WORKFLOW",
    annotationSub: "End-to-End Pipeline Provenance Architecture",
    cameraPosition: [0, 0.4, 11.5],
    cameraTarget: [0, 0, 0],
    technicalDetail: {
      title: "End-to-End Scientific Architecture",
      biologicalContext: "Bridges the historical gap between quantitative inheritance genetics, mechanistic meiosis cytology, and machine learning attribution.",
      computationalRole: "Integrates stochastic meiotic simulation, non-linear phenotype inference, and counterfactual causal search into a unified, reproducible research platform.",
      keyTakeaway: "Translates complex biological recombination into auditable, hypothesis-prioritized genetic insights.",
    },
  },
];
