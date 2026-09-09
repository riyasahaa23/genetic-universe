"""
Recombination and Meiosis Engine
Handles meiotic crossover, gamete formation, and fertilization while preserving
strict provenance for all segments and inherited loci.
Includes resilient fallback when numpy is not available in the active Python environment.
"""
from dataclasses import dataclass, field
from typing import List, Dict, Any, Optional, Tuple

try:
    import numpy as np
    HAS_NUMPY = True
except ImportError:
    HAS_NUMPY = False
    np = None


class DeterministicRNG:
    """Standard library RNG fallback when numpy is unavailable."""
    def __init__(self, seed: int = 42):
        import random
        self._rng = random.Random(seed)

    def integers(self, low: int, high: int) -> int:
        return self._rng.randint(low, high - 1)

    def choice(self, seq, size: int, replace: bool = False) -> List[Any]:
        items = list(seq)
        if replace:
            return [self._rng.choice(items) for _ in range(size)]
        return self._rng.sample(items, min(size, len(items)))

    def random(self) -> float:
        return self._rng.random()


def get_rng(seed: int = 42):
    if HAS_NUMPY and np is not None:
        return np.random.default_rng(seed)
    return DeterministicRNG(seed)


@dataclass
class Locus:
    id: str
    position: int
    chromosome: str = "chr1"
    alleles: List[int] = field(default_factory=lambda: [0, 1])

    def to_dict(self) -> Dict[str, Any]:
        return {
            "id": self.id,
            "position": self.position,
            "chromosome": self.chromosome,
            "alleles": self.alleles,
        }


@dataclass
class SegmentProvenance:
    start: int
    end: int
    source_homolog: str
    parent_id: str
    bounding_interval: Optional[Tuple[int, int]] = None

    def to_dict(self) -> Dict[str, Any]:
        d = {
            "start": self.start,
            "end": self.end,
            "source_homolog": self.source_homolog,
            "parent_id": self.parent_id,
        }
        if self.bounding_interval is not None:
            d["bounding_interval"] = list(self.bounding_interval)
        return d


@dataclass
class InferredRecombinationEvent:
    parent_id: str
    inferred_breakpoint: int      # Point estimate (1-based locus boundary)
    interval_start: int           # 1-based left bound of uninformative transition
    interval_end: int             # 1-based right bound of uninformative transition
    left_marker: int              # Nearest informative locus index to the left
    right_marker: int             # Nearest informative locus index to the right
    left_homolog: str             # Source homolog before switch (e.g. 'A1')
    right_homolog: str            # Source homolog after switch (e.g. 'A2')
    confidence_span: int          # Span of transition interval (interval_end - interval_start)

    def to_dict(self) -> Dict[str, Any]:
        return {
            "parent_id": self.parent_id,
            "inferred_breakpoint": self.inferred_breakpoint,
            "interval": [self.interval_start, self.interval_end],
            "flanking_markers": [self.left_marker, self.right_marker],
            "homolog_switch": f"{self.left_homolog} -> {self.right_homolog}",
            "confidence_span": self.confidence_span,
        }


@dataclass
class Gamete:
    parent_id: str
    alleles: List[int]
    crossovers: List[int]
    segments: List[SegmentProvenance]

    def to_dict(self) -> Dict[str, Any]:
        return {
            "parent_id": self.parent_id,
            "alleles": self.alleles,
            "crossovers": self.crossovers,
            "segments": [s.to_dict() for s in self.segments],
        }


@dataclass
class LocusProvenance:
    locus_id: str
    position: int
    allele_a: int
    source_parent_a: str
    source_homolog_a: str
    crossover_interval_a: str
    allele_b: int
    source_parent_b: str
    source_homolog_b: str
    crossover_interval_b: str
    genotype_dosage: int

    def to_dict(self) -> Dict[str, Any]:
        return {
            "locus_id": self.locus_id,
            "position": self.position,
            "allele_a": self.allele_a,
            "source_parent_a": self.source_parent_a,
            "source_homolog_a": self.source_homolog_a,
            "crossover_interval_a": self.crossover_interval_a,
            "allele_b": self.allele_b,
            "source_parent_b": self.source_parent_b,
            "source_homolog_b": self.source_homolog_b,
            "crossover_interval_b": self.crossover_interval_b,
            "genotype_dosage": self.genotype_dosage,
        }


@dataclass
class ParentGenome:
    parent_id: str
    homolog_1: List[int]
    homolog_2: List[int]
    loci: List[Locus]

    def get_dosage(self) -> List[int]:
        return [h1 + h2 for h1, h2 in zip(self.homolog_1, self.homolog_2)]

    def to_dict(self) -> Dict[str, Any]:
        return {
            "parent_id": self.parent_id,
            "haplotypes": {
                f"{self.parent_id}1": self.homolog_1,
                f"{self.parent_id}2": self.homolog_2,
            },
            "dosage": self.get_dosage(),
            "locus_count": len(self.loci),
        }


@dataclass
class OffspringGenome:
    offspring_id: str
    maternal_gamete: Gamete  # From Parent A
    paternal_gamete: Gamete  # From Parent B
    loci_provenance: List[LocusProvenance]

    def get_dosage(self) -> List[int]:
        return [p.genotype_dosage for p in self.loci_provenance]

    def to_dict(self) -> Dict[str, Any]:
        return {
            "offspring_id": self.offspring_id,
            "maternal_or_parent_a": self.maternal_gamete.alleles,
            "paternal_or_parent_b": self.paternal_gamete.alleles,
            "dosage": self.get_dosage(),
            "provenance": [p.to_dict() for p in self.loci_provenance],
        }


def generate_loci(count: int = 50) -> List[Locus]:
    """Generate ordered synthetic loci (L01 .. L{count})."""
    return [
        Locus(
            id=f"L{i:02d}",
            position=i,
            chromosome="chr1",
            alleles=[0, 1],
        )
        for i in range(1, count + 1)
    ]


def simulate_meiosis(
    h1: List[int],
    h2: List[int],
    parent_id: str,
    crossover_positions: Optional[List[int]] = None,
    start_homolog: int = 0,
    rng: Optional[Any] = None,
) -> Gamete:
    """
    Simulate meiosis with homolog crossover.
    Enforces at least one crossover per simulated meiosis if randomly generated.
    Validates crossover bounds: 1 <= breakpoint < locus_count.
    Tracks provenance of every transmitted segment.
    """
    locus_count = len(h1)
    if len(h2) != locus_count:
        raise ValueError("Homologs must have equal length.")
    if locus_count < 2:
        raise ValueError("Locus count must be at least 2 for recombination.")

    # Generate crossover positions if not provided
    if crossover_positions is None:
        if rng is None:
            rng = get_rng(42)
        num_crossovers = int(rng.integers(1, 4))
        raw_positions = rng.choice(
            list(range(1, locus_count)), size=min(num_crossovers, locus_count - 1), replace=False
        )
        crossover_positions = sorted([int(p) for p in raw_positions])
    else:
        crossover_positions = sorted(list(set(crossover_positions)))
        for bp in crossover_positions:
            if bp <= 0 or bp >= locus_count:
                raise ValueError(
                    f"Crossover breakpoint {bp} out of bounds for locus count {locus_count} (must be between 1 and {locus_count - 1})."
                )

    gamete_alleles: List[int] = []
    segments: List[SegmentProvenance] = []

    current = start_homolog
    previous = 0
    homolog_names = [f"{parent_id}1", f"{parent_id}2"]

    for breakpoint in crossover_positions:
        source_seq = h1 if current == 0 else h2
        source_name = homolog_names[current]

        gamete_alleles.extend(source_seq[previous:breakpoint])
        segments.append(
            SegmentProvenance(
                start=previous,
                end=breakpoint,
                source_homolog=source_name,
                parent_id=parent_id,
            )
        )

        current = 1 - current
        previous = breakpoint

    source_seq = h1 if current == 0 else h2
    source_name = homolog_names[current]
    gamete_alleles.extend(source_seq[previous:locus_count])
    segments.append(
        SegmentProvenance(
            start=previous,
            end=locus_count,
            source_homolog=source_name,
            parent_id=parent_id,
        )
    )

    return Gamete(
        parent_id=parent_id,
        alleles=gamete_alleles,
        crossovers=crossover_positions,
        segments=segments,
    )


def infer_recombination_events(
    homolog_1: List[int],
    homolog_2: List[int],
    gamete_alleles: List[int],
    parent_id: str = "A",
    fallback_segments: Optional[List[SegmentProvenance]] = None,
) -> Tuple[List[SegmentProvenance], List[InferredRecombinationEvent]]:
    """
    Rigorously infers meiotic recombination events and inherited segment blocks
    from observable parental and gamete haplotypes without accessing simulation ground truth.

    Identifies heterozygous informative markers, detects homolog origin transitions,
    bounds the crossover interval between adjacent informative markers, and reconstructs
    contiguous inherited segment provenance blocks.
    """
    n = len(homolog_1)
    if len(homolog_2) != n or len(gamete_alleles) != n:
        raise ValueError("Homolog and gamete lengths must match.")

    # 1. Identify informative markers (heterozygous in parent)
    informative: List[Tuple[int, str]] = []
    for i in range(n):
        if homolog_1[i] != homolog_2[i]:
            h = f"{parent_id}1" if gamete_alleles[i] == homolog_1[i] else f"{parent_id}2"
            informative.append((i, h))

    if not informative:
        # Fully homozygous parent; no detectable recombination
        if fallback_segments:
            return list(fallback_segments), []
        seg = SegmentProvenance(start=0, end=n, source_homolog=f"{parent_id}1", parent_id=parent_id)
        return [seg], []

    # 2. Detect transitions between consecutive informative markers
    breakpoints: List[InferredRecombinationEvent] = []
    for k in range(len(informative) - 1):
        idx_prev, h_prev = informative[k]
        idx_curr, h_curr = informative[k + 1]
        if h_prev != h_curr:
            # Recombination occurred between idx_prev and idx_curr
            # Bounding boundary interval: [idx_prev + 1, idx_curr]
            bp_est = (idx_prev + 1 + idx_curr) // 2
            breakpoints.append(
                InferredRecombinationEvent(
                    parent_id=parent_id,
                    inferred_breakpoint=bp_est,
                    interval_start=idx_prev + 1,
                    interval_end=idx_curr,
                    left_marker=idx_prev,
                    right_marker=idx_curr,
                    left_homolog=h_prev,
                    right_homolog=h_curr,
                    confidence_span=idx_curr - (idx_prev + 1),
                )
            )

    # 3. Construct contiguous inherited segment blocks from inferred breakpoints
    segments: List[SegmentProvenance] = []
    prev_idx = 0
    for bp in breakpoints:
        seg = SegmentProvenance(
            start=prev_idx,
            end=bp.inferred_breakpoint,
            source_homolog=bp.left_homolog,
            parent_id=parent_id,
            bounding_interval=(bp.interval_start, bp.interval_end),
        )
        segments.append(seg)
        prev_idx = bp.inferred_breakpoint

    last_h = informative[-1][1] if informative else f"{parent_id}1"
    last_seg = SegmentProvenance(
        start=prev_idx,
        end=n,
        source_homolog=last_h,
        parent_id=parent_id,
        bounding_interval=(prev_idx, n),
    )
    segments.append(last_seg)

    return segments, breakpoints


def fertilize(
    gamete_a: Gamete,
    gamete_b: Gamete,
    loci: List[Locus],
    offspring_id: str = "O1",
) -> OffspringGenome:
    """
    Combines gamete A and gamete B into diploid offspring.
    Preserves locus-level provenance for both parental transmissions.
    """
    locus_count = len(loci)
    if len(gamete_a.alleles) != locus_count or len(gamete_b.alleles) != locus_count:
        raise ValueError("Gamete lengths must match locus count.")

    def find_interval(pos: int, segments: List[SegmentProvenance], prefix: str) -> Tuple[str, str]:
        if not segments:
            return f"{prefix}1", f"{prefix}_XO_00"
        for idx, seg in enumerate(segments):
            if seg.start <= pos < seg.end:
                return seg.source_homolog, f"{prefix}_XO_{idx:02d}"
        return segments[-1].source_homolog, f"{prefix}_XO_{len(segments)-1:02d}"

    loci_prov: List[LocusProvenance] = []
    for i, loc in enumerate(loci):
        al_a = gamete_a.alleles[i]
        al_b = gamete_b.alleles[i]
        homolog_a, interval_a = find_interval(i, gamete_a.segments, "A")
        homolog_b, interval_b = find_interval(i, gamete_b.segments, "B")

        dosage = al_a + al_b

        loci_prov.append(
            LocusProvenance(
                locus_id=loc.id,
                position=loc.position,
                allele_a=al_a,
                source_parent_a="A",
                source_homolog_a=homolog_a,
                crossover_interval_a=interval_a,
                allele_b=al_b,
                source_parent_b="B",
                source_homolog_b=homolog_b,
                crossover_interval_b=interval_b,
                genotype_dosage=dosage,
            )
        )

    return OffspringGenome(
        offspring_id=offspring_id,
        maternal_gamete=gamete_a,
        paternal_gamete=gamete_b,
        loci_provenance=loci_prov,
    )


def generate_synthetic_parents(
    loci: List[Locus],
    seed: int = 42,
    planted_config: Optional[Dict[str, Any]] = None,
    legacy_deterministic: bool = False,
    stochastic: bool = False,
) -> Tuple[ParentGenome, ParentGenome]:
    """
    Generates Parent A and Parent B genomes.
    - If not stochastic and planted_config is None (or legacy_deterministic is True):
      reproduces the exact static proposal fixture.
    - If stochastic is True (or planted_config is provided): generates a genuinely stochastic
      multi-seed world where every seed produces a distinct parental genomic architecture
      while remaining 100% reproducible per seed.
    """
    n = len(loci)

    use_deterministic = legacy_deterministic or (not stochastic and planted_config is None)
    if use_deterministic and n >= 35:
        a1 = [0] * n
        a2 = [0] * n
        b1 = [0] * n
        b2 = [0] * n
        a1[4] = 1   # L05 (+2.0)
        a1[9] = 1   # L10 (+2.0)
        a1[24] = 1  # L25 (+3.0)
        a1[34] = 1  # L35 (dom +2.0)
        a2[30] = 1  # L31 (+3.0)

        b1[4] = 1;  b2[4] = 1   # L05 (2 * 2.0 = 4.0)
        b1[24] = 1; b2[24] = 1  # L25 (2 * 3.0 = 6.0)
        b1[30] = 1; b2[30] = 1  # L31 (2 * 3.0 = 6.0)
        b1[34] = 1              # L35 (dom +2.0)
    else:
        rng = get_rng(seed)
        # Background allele frequency ~ 0.20
        a1 = [int(rng.random() < 0.20) for _ in range(n)]
        a2 = [int(rng.random() < 0.20) for _ in range(n)]
        b1 = [int(rng.random() < 0.20) for _ in range(n)]
        b2 = [int(rng.random() < 0.20) for _ in range(n)]

        # If specific causal loci are planted, configure them so recombination creates the target scenario
        if planted_config:
            crossovers_a = planted_config.get("crossover_positions_a", [20])

            def transmitted_homolog_a(pos_idx: int) -> int:
                flips = sum(1 for bp in crossovers_a if bp <= pos_idx)
                return 1 if flips % 2 == 0 else 2

            # Configure single loci
            for pos in planted_config.get("single_loci", []):
                idx = pos - 1
                if 0 <= idx < n:
                    tx_h = transmitted_homolog_a(idx)
                    if tx_h == 1:
                        a1[idx] = 1
                        a2[idx] = 0
                    else:
                        a1[idx] = 0
                        a2[idx] = 1
                    b1[idx] = 0
                    b2[idx] = 0

            # Configure epistatic pairs
            for pair in planted_config.get("epistatic_pairs", []):
                pos_a, pos_b = pair[0], pair[1]
                idx_a = pos_a - 1
                idx_b = pos_b - 1
                if 0 <= idx_a < n and 0 <= idx_b < n:
                    tx_ha = transmitted_homolog_a(idx_a)
                    tx_hb = transmitted_homolog_a(idx_b)

                    if tx_ha == 1:
                        a1[idx_a] = 1
                        a2[idx_a] = 0
                    else:
                        a1[idx_a] = 0
                        a2[idx_a] = 1

                    if tx_hb == 1:
                        a1[idx_b] = 1
                        a2[idx_b] = 0
                    else:
                        a1[idx_b] = 0
                        a2[idx_b] = 1

                    b1[idx_a] = 0
                    b2[idx_a] = 0
                    b1[idx_b] = 0
                    b2[idx_b] = 0

            # Backward compatibility for legacy single-pair planted_config
            if "locus_a_pos" in planted_config and not planted_config.get("epistatic_pairs") and not planted_config.get("single_loci"):
                l1 = planted_config.get("locus_a_pos", 10) - 1
                l2 = planted_config.get("locus_b_pos", 31) - 1
                if 0 <= l1 < n and 0 <= l2 < n:
                    if l1 == l2:
                        # Single locus (additive or dominance): place on transmitted homolog of Parent A
                        a1[l1] = 1
                        a2[l1] = 0
                        b1[l1] = 0
                        b2[l1] = 0
                    else:
                        # Place on opposite homologs of Parent A so only crossover assembles them
                        a1[l1] = 1
                        a2[l1] = 0
                        a1[l2] = 0
                        a2[l2] = 1
                        # Ensure Parent B does not already have them both in cis
                        b1[l1] = 0
                        b2[l1] = 0
                        b1[l2] = 1
                        b2[l2] = 0

    parent_a = ParentGenome("A", a1, a2, loci)
    parent_b = ParentGenome("B", b1, b2, loci)

    return parent_a, parent_b
