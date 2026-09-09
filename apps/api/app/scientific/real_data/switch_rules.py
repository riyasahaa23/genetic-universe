"""Shared support rules; scope changes never change the evidence thresholds."""
ALGORITHM = "parental-transmission-switch/1.0.0"
MAX_MARKER_GAP = 50_000
MIN_FLANK_MARKERS = 2


def partition_runs(items, point=lambda item: item):
    runs = []
    for item in items:
        marker = point(item)
        previous = point(runs[-1][-1]) if runs else None
        if (previous is None or marker.chromosome != previous.chromosome
                or marker.phase_set != previous.phase_set or marker.homolog != previous.homolog
                or marker.start - previous.start > MAX_MARKER_GAP):
            runs.append([])
        runs[-1].append(item)
    return runs


def rejection_reasons(left_run, right_run, point=lambda item: item):
    left, right = point(left_run[-1]), point(right_run[0])
    reasons = []
    if left.chromosome != right.chromosome:
        reasons.append("different_chromosome")
    if not left.phase_set or left.phase_set != right.phase_set:
        reasons.append("phase_set_change_or_unavailable")
    if left.homolog == right.homolog:
        reasons.append("no_homolog_change")
    if min(len(left_run), len(right_run)) < MIN_FLANK_MARKERS:
        reasons.append("insufficient_flank_markers")
    if not 0 < right.start - left.start <= MAX_MARKER_GAP:
        reasons.append("nonpositive_or_excessive_marker_gap")
    return reasons
