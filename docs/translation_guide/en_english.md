# English (en) — Translation & Writing Guide

## Overview

| Property            | Value                                                     |
| ------------------- | --------------------------------------------------------- |
| **ISO Code**        | `en`                                                      |
| **Native Name**     | English                                                   |
| **Script**          | Latin                                                     |
| **Direction**       | Left-to-Right (LTR)                                       |
| **Primary Regions** | United States, United Kingdom, Canada, Australia, Ireland |

---

## 1. Tone & Register

### For Synoptic Studio UI

- **Register**: Professional yet approachable
- **Tone**: Confident, clear, and helpful—never condescending
- **Voice**: Active voice preferred; passive only when emphasizing the action over the actor

### Key Principles

```
✅ "Save your project" (direct, active)
❌ "Your project will be saved" (passive, less engaging)

✅ "Create beautiful bilingual books"
❌ "Bilingual books can be created by you"
```

---

## 2. Formality & Pronouns

### Second Person

- **Use "you"** consistently for addressing users
- Avoid mixing "you" with "one" or "the user"

### Inclusive Language

- Use **singular "they"** for unknown gender references
- Avoid gendered language when gender is unknown

```
✅ "When a user opens their project..."
❌ "When a user opens his project..."

✅ "Each author can customize their workspace"
❌ "Each author can customize his or her workspace"
```

### First Person Plural

- Use **"we"** when speaking as Synoptic (company voice)
- Use **"your"** when referring to user possessions

```
✅ "We've saved your changes"
✅ "Your manuscript is protected"
```

---

## 3. Gender-Inclusive Writing

### Guidelines

| Situation           | Inclusive Form          | Avoid             |
| ------------------- | ----------------------- | ----------------- |
| Unknown user        | they/their/them         | he/she, he or she |
| Professional titles | author, publisher       | authoress         |
| Generic references  | people, users, everyone | mankind, guys     |
| Possessives         | their                   | his/her           |

### Examples

```
✅ "The translator can save their work"
❌ "The translator can save his/her work"

✅ "Welcome, author!"
❌ "Welcome, sir/madam!"
```

---

## 4. Common Pitfalls & False Friends

### Words with Different Meanings in Other Englishes

| Term            | US English           | UK English              | Recommendation                             |
| --------------- | -------------------- | ----------------------- | ------------------------------------------ |
| "Table" (verb)  | Postpone             | Bring up for discussion | Avoid; use "postpone" or "discuss"         |
| "Quite"         | Somewhat             | Very                    | Use "very" or "fairly" for clarity         |
| "Scheme"        | Negative connotation | Neutral (plan)          | Use "plan" or "system"                     |
| "Public school" | Government-funded    | Private (UK)            | Specify "state school" or "private school" |

### Tech Jargon Clarity

- **Avoid**: "leverage", "synergize", "paradigm shift"
- **Prefer**: "use", "combine", "major change"

### "Ultimate" Trap

In English, "ultimate" can mean:

1. **Best/supreme**: "The ultimate solution" ✅
2. **Final/last**: "The ultimate chapter" ⚠️

For Synoptic, use "ultimate" only in the **superlative/best** sense.

---

## 5. Grammar & Syntax

### Sentence Structure

- **Subject-Verb-Object (SVO)** is standard
- Keep sentences concise (aim for 15-25 words max)
- Front-load important information

### Contractions

- **Use contractions** in UI for friendliness: "don't", "can't", "we've"
- **Avoid in legal text**: Terms of Service, Privacy Policy

### Oxford Comma

- **Use it consistently** for clarity

```
✅ "Export to PDF, EPUB, and Kindle"
❌ "Export to PDF, EPUB and Kindle"
```

### Capitalization

- **Title Case** for headings and buttons: "Save Project", "Export to PDF"
- **Sentence case** for descriptions: "Create a new project from scratch"

---

## 6. UI-Specific Patterns

### Button Labels

- Use **imperative verbs**: Save, Export, Create, Delete
- Keep to **1-3 words** maximum
- Avoid gerunds on buttons: "Save" not "Saving"

### Error Messages

- Be **specific** about what went wrong
- Offer **actionable solutions**
- Avoid blaming the user

```
✅ "Connection lost. Check your internet and try again."
❌ "Error: Network failure"
❌ "You lost connection"
```

### Placeholder Text

- Use realistic examples
- Indicate format when relevant

```
✅ placeholder="name@example.com"
✅ placeholder="e.g., Twenty Thousand Leagues Under the Sea"
```

---

## 7. Numbers & Formatting

### Number Formatting

| Type          | Format          | Example    |
| ------------- | --------------- | ---------- |
| Thousands     | Comma separator | 1,000      |
| Decimals      | Period          | 3.14       |
| Currency (US) | $X.XX           | $12.99     |
| Currency (UK) | £X.XX           | £12.99     |
| Dates (US)    | MM/DD/YYYY      | 12/30/2025 |
| Dates (UK)    | DD/MM/YYYY      | 30/12/2025 |
| Time (12h)    | h:mm AM/PM      | 2:30 PM    |
| Time (24h)    | HH:mm           | 14:30      |

### Recommendation for Synoptic

- Use **ISO 8601** for dates in data: `2025-12-30`
- Display dates in **user's locale preference**

---

## 8. Cultural Considerations

### Idioms to Avoid in UI

Idioms don't translate well. Avoid:

- "Piece of cake" → Use "Easy"
- "Hit the ground running" → Use "Get started quickly"
- "Ballpark figure" → Use "Estimate"

### Measurements

- Offer **both metric and imperial** where relevant
- Default to user's region preference

---

## 9. Glossary of Synoptic Terms

| Term      | Definition                              | Usage Note                         |
| --------- | --------------------------------------- | ---------------------------------- |
| Studio    | The main editing workspace              | Always capitalized as product name |
| Project   | A user's bilingual book document        | Lowercase unless starting sentence |
| Block     | A content unit (text, image, separator) | Technical term, consistent usage   |
| Grid-Lock | The alignment system                    | Hyphenated, product feature name   |
| AI Unit   | Credit for AI operations                | Two words, capitalized             |
| L1/L2     | Source/Target language                  | Use full terms for clarity in UI   |

---

## 10. Translation from English

When translating **from English to other languages**, watch for:

### Phrasal Verbs

Many English phrasal verbs have no direct equivalent:

- "Set up" → Configure / Initialize
- "Back up" → Create backup / Save copy
- "Log in" → Authenticate / Access

### Articles

English uses articles (a, an, the) differently than many languages:

- Some languages omit articles
- Some have more article forms (gendered, case-based)

### Compound Nouns

English compounds may need restructuring:

- "Cloud sync" → "Synchronisation via cloud" (French)
- "File upload" → "Téléversement de fichier" (French)

---

## 11. SEO & Accessibility

### Alt Text

- Be descriptive and concise
- Don't start with "Image of..." or "Picture of..."

```
✅ alt="Bilingual book layout with French and English columns"
❌ alt="Image showing a book"
```

### Meta Descriptions

- 150-160 characters maximum
- Include primary keyword naturally
- End with call-to-action when possible

---

## 12. Quick Reference Card

```
┌─────────────────────────────────────────────────────┐
│ ENGLISH TRANSLATION QUICK REFERENCE                 │
├─────────────────────────────────────────────────────┤
│ Formality: Professional-friendly                    │
│ Pronouns: You (user), We (Synoptic), They (unknown) │
│ Contractions: Yes in UI, No in legal               │
│ Oxford Comma: Yes, always                          │
│ Button Style: Imperative verbs (Save, Export)      │
│ Capitalization: Title Case for headings            │
│ Numbers: 1,000.00 (comma thousands, period decimal)│
│ Gender: Use singular they                          │
└─────────────────────────────────────────────────────┘
```

---

_Last updated: December 2025_
_For Synoptic Studio v1.0_
