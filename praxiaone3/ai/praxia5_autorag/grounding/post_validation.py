def validate_answer(answer, chunks):
    for c in chunks:
        if c[:50] in answer:
            return True
    return False
