# Rationale for the deck sg-accessibility-followup (follow-up questions, Singapore case)

As of 26 Nov 2026, deck version 0.2.0-draft. Method: `docs/QUESTION_DESIGN.md`. No expected answers in this file.

## Purpose
After generating checking rules for clauses 4.7.3.1 and 4.2.3.6 of the Code on Accessibility in the Built Environment 2025 and testing them, five interpretation decisions remained open. Each card asks one of them in general form. The deck contains no data about specific people, models or checking software; questions about how a particular checker behaves are asked separately.

- **H1 (what makes a railing a handrail):** model binding. Whether the IFC type, the relation to the stair or a property identifies a handrail.
- **H2, H3 (continuity):** quantification. H2 is a stair with one continuous handrail on one side only; H3 a stair with handrails on both sides, one interrupted. Together they show whether one continuous handrail is enough or every handrail present must be continuous. A minimal pair.
- **B1 (bollard on a ramp):** measuring method, the reference surface when there is no level floor.
- **B2, B3 (drop-off area):** scope and model binding. How a kerb ramp is detected, and when a bollard counts as standing in a drop-off area.

## Design decisions
- **General form only:** no component numbers, no software names, no counts from a particular model.
- **Cases before questions in each section,** options with one-line consequences of the same form, "Depends" welcome.

## Known weaknesses
- H1 names an IFC type; respondents without IFC background may choose "Depends".
- B2 states the rule for drop-off areas without kerb ramp as given; it comes from a practitioner's reading, not from the code text. Respondents who disagree should say so in the note.
