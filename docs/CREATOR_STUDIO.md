# Learn.co — Creator Studio (Volume 4)

## Overview
Creator Studio is the pedagogical authoring and AI synthesis workspace within Learn.co. It empowers educators and self-directed learners to ingest source materials (PDF research papers, textbooks, lecture notes, or web articles) and transform them into structured, interactive learning artifacts.

---

## Supported Source Ingestion Channels
1. **Raw Text / Markdown Notes**: Direct input of mathematical proofs, theorem statements, and lecture notes.
2. **PDF / Document Upload**: Ingestion of lecture slide decks, syllabus PDFs, and problem sets with base64 client-side handling and server extraction.
3. **Web Article URLs**: Web scraping and HTML boilerplate stripping for STEM articles (e.g., Wikipedia, MIT OpenCourseWare).

---

## 8 Target Educational Artifact Formats
1. **Spaced Flashcards (`flashcards`)**: Active recall deck with questions, formal answers, LaTeX formulas, and difficulty ratings.
2. **Diagnostic Quiz (`quiz`)**: Multiple-choice assessments featuring first-principles rationales, Bloom cognitive tags, and LaTeX equations.
3. **Executive Summary (`summary`)**: High-level synthesis comprising governing theorems, common misconceptions vs. first-principles corrections, and actionable takeaways.
4. **Lecture Compendium (`notes`)**: Modular study guide complete with section breakdowns, LaTeX formulas, and step-by-step derivations.
5. **Presentation Slides (`slides`)**: Structured slide deck with bullet points, presentation speaker scripts, and key takeaway callouts.
6. **Practice Worksheet (`worksheet`)**: Problem set with calibrated difficulty, Socratic hints, step-by-step rubrics, and boxed final answers.
7. **Hierarchical Mind Map (`mindmap`)**: Tree diagram of root concepts, subtopics, and structural relations.
8. **Invariant Glossary (`key_concepts`)**: Rigorous definitions, governing laws, and invariant conservation rules.

---

## Pipeline Architecture
1. **Intake**: User selects or uploads source material via `SourceIntakePanel`.
2. **AI Gateway Dispatch**: Server-side endpoint `/api/creator/generate` contacts Gemini (`gemini-3.7-flash`) with strict JSON schema instructions.
3. **Output Sanitization & Validation**: Server verifies response fields, formats LaTeX syntax, and ensures mathematical integrity.
4. **Version Control**: Every resource is versioned with immutable snapshot tracking in `CreatorResourceVersion`.
5. **Practice Arena Bridge**: Resources can be transferred with one click into the Learning Studio and Practice Arena.
