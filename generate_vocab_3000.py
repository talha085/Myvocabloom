# Generator for CEFR 3000 vocabulary (500 words each for A1, A2, B1, B2, C1, C2)
import json
import os

print("Writing 3000 words generator...")

# Helper function to generate structured word entry
def make_entry(level, idx, word, tr, pos, phonetic, en_def, ex_en, ex_tr, collocations=None, synonyms=None):
    return {
        "id": f"w-{level.lower()}-{idx}",
        "word": word.lower().strip(),
        "phonetic": phonetic or f"/{word}/",
        "partOfSpeech": pos or "noun",
        "level": level,
        "meaningTr": tr,
        "definitionEn": en_def,
        "exampleEn": ex_en,
        "exampleTr": ex_tr,
        "collocations": collocations or [f"{word} daily", f"use {word}"],
        "synonyms": synonyms or []
    }
