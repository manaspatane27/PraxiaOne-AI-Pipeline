def compute_confidence(g_score, valid):
    base = g_score
    if not valid:
        base *= 0.5
    return round(min(base, 1.0), 3)
