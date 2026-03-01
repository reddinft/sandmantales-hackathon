# DEMO_SCRIPT_V5.md — Sandman Tales v2
*3-Minute Hackathon Pitch — "Bonne Nuit, Sophie"*
*Judging: Technical 20% | Creativity 20% | Usefulness 20% | Demo 20% | Track Alignment 20%*

---

## ACT 1 — THE PROBLEM (Doc, 30s)
**[Screen: Title slide — "Sandman Tales" logo on starry gradient]**

*"Judges — over a quarter of Australians were born overseas. Millions of kids grow up hearing a second language at home. But for many of them, that language fades as English takes over at school.*

*Sophie's mum is French. They live in Sydney. Sophie barely hears a word of French anymore. Every night, her mum worries — will Sophie forget the language that shaped who we are?*

*We built Sandman Tales to answer that question."*

**[USEFULNESS ✅ — real problem, verified stat, emotional hook]**

---

## ACT 2 — THE LIVE DEMO (Pathfinder + Doc narrating, 60s)
**[Screen: Live app at Tailscale Funnel URL — Create Story page]**

*"Watch. Sophie's mum opens Sandman Tales. She taps the microphone…"*

**[LIVE: Click mic button — show recording pulse animation, then stop]**

*"Voxtral — Mistral's speech model — transcribes her words. She spoke English. But she chose French for the story."*

**[LIVE: Show transcribed text appearing in prompt field, language auto-set to Français]**

*"Now I take over. Mistral Large generates a story — personalised. Sophie's name. Her world. In French."*

**[LIVE: Click Create Story — show pipeline status: Voxtral ✅ → Pathfinder generating… → Firefly → Lifeline]**

**[Screen: Story reader loads — "Sophie et la Baleine de Nuages" — cloud whale illustration, French text]**

*"Six scenes. Watercolour illustrations. Every scene written for Sophie."*

**[LIVE: Click Listen button — FRENCH AUDIO PLAYS for 15 seconds]**

*"That's ElevenLabs narrating in French. One of 29 languages. Sophie falls asleep hearing the words that feel like home."*

**[DEMO ✅ — live app, real Mistral API calls, audio plays]**

---

## ACT 3 — THE TECH (Firefly, 30s)
**[Screen: Pipeline diagram visible in the app UI]**

*"Four Mistral agents — running in parallel through the Agents API. Voxtral transcribes the parent's voice. Pathfinder writes the story. I generate the illustrations. Lifeline handles narration.*

*And yeah — I also designed this UI. All three React pages, written by Mistral Large. Check the git log."*

**[Screen: Quick flash of git diff showing Firefly's commit]**

*"We fine-tuned Stable Diffusion with LoRA — 500 steps on storybook images. Then we benchmarked it against Imagen using Pixtral as an LLM-as-Judge. The fine-tune scored 9 out of 10. But Imagen scored higher. So we shipped Imagen. The pipeline is the innovation. Knowing when NOT to use your own model — that's the engineering maturity."*

**[TECHNICAL ✅ — Agents API, Voxtral, LoRA, Pixtral judge, architecture visible]**

---

## ACT 4 — THE MOAT (Lifeline, 20s)
**[Screen: Story Library showing 🇬🇧🇯🇵🇫🇷 flags — 4 stories, 3 languages]**

*"Every story Sophie hears builds her vocabulary. Every night the app learns what she loves — clouds, whales, adventure. The stories grow with her. That's not a feature competitors can copy overnight — it's a relationship.*

*29 languages. $9.99 a month. 50 million multilingual households worldwide. This isn't just an app. It's how Sophie keeps her mother tongue."*

**[CREATIVITY ✅ — personalisation moat, retention hook, market size]**

---

## ACT 5 — CLOSE (Doc, 10s)

*"Tonight, Sophie falls asleep to a story in French. Written for her. About her world. In the language of her heart.*

*Bonne nuit, Sophie. Goodnight, judges."*

**[Screen: Cloud whale illustration fades to "Sandman Tales — powered by Mistral AI"]**

---

## TIMING BUDGET
| Section | Speaker | Time | Criteria Hit |
|---------|---------|------|-------------|
| Problem | Doc | 30s | Usefulness |
| Live Demo | Pathfinder + Doc | 60s | Demo |
| Tech | Firefly | 30s | Technical |
| Moat | Lifeline | 20s | Creativity |
| Close | Doc | 10s | All |
| **TOTAL** | | **2:30** | **All 5 criteria** |

## KEY CHANGES FROM V4
1. **60s live demo** — app runs live, French audio PLAYS (every judge demanded this)
2. **LoRA story reframed** — not a failure, an engineering maturity decision
3. **Moat reframed** — personalisation data + relationship, not just "voice cloning coming soon"
4. **Retention hook** — "stories grow with her" answers Liv's "what brings them back?"
5. **Git diff flash** — proves Firefly wrote the code (Oli's #1 ask)
6. **Track alignment woven in** — Mistral name-dropped 4 times naturally
7. **Removed "Duolingo teaches vocabulary, we preserve voices"** line — too defensive. Let the demo speak.
