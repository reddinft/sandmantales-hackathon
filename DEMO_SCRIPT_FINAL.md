# Sandman Tales v2 — Final Demo Script
_Doc x Loki — Feb 28 2026_

## **PART 1: DEMO SCRIPT**
**Sandman Tales v2 – Mistral Hackathon Sydney 2026**
*Runtime: 3:00 | Tone: Warm, magical, high-energy*

---

### **[0:00 - 0:15] (TITLE SCREEN: "Sandman Tales v2")**
**DOC** *(grinning, leaning into mic)*
"Ladies and gentlemen, judges, fellow dream-weavers—welcome to *Sandman Tales v2*, where bedtime stories aren’t just told… they’re *born*. Tonight, we’re turning parents’ voices into *personalized, multilingual, illustrated lullabies*—powered by Mistral’s Agents API, ElevenLabs’ golden throats, and a pipeline so smooth it’ll make Pixtral weep. Let’s go!"

*(Screen cuts to live demo: Parent voice input UI)*

---

### **[0:15 - 0:45] (SCREEN: PARENT VOICE INPUT – ENGLISH)**
**DOC**
"Meet Sarah. Her son, Leo, can’t sleep without a story about his kitten, Whiskers. But Sarah’s exhausted—so she just *talks* to Sandman. Watch."

*(Parent speaks into mic:)*
**PARENT (Sarah)**
*"Leo loves Whiskers, his little gray kitten. Last week, they found a tiny door in our garden that led to a magical forest. Leo’s scared of the dark, but Whiskers glows in the moonlight…"*

**DOC** *(whispering, dramatic)*
"Mistral’s Large 3 model *listens*. Agents API spins the tale. ElevenLabs narrates. And boom—Leo’s story, *his* way."

*(Screen flashes: JSON story structure generates in real-time. Watercolor illustrations bloom—kitten in garden, glowing fireflies, tiny door.)*

---

### **[0:45 - 1:15] (SCREEN: STORY PLAYBACK – ENGLISH)**
**ELEVENLABS NARRATION** *(soft, soothing)*
*"Whiskers’ fur shimmered like stardust as he nudged Leo through the tiny door. The garden hummed with fireflies, their light dancing on petals that sang in the breeze. But where was the path home?"*

**DOC** *(pointing at screen)*
"Look at that illustration—Gemini’s watercolors, *judged* by Pixtral for maximum cozy vibes. And this? Just *one* scene. We’ve got four stories tonight, three languages, and a pipeline that turns bedtime into *art*."

---

### **[1:15 - 2:00] (SCREEN: JAPANESE STORY – EMOTIONAL PEAK)**
**DOC** *(lowering voice, serious)*
"But here’s where we *hurt* you. Meet Kenji. His daughter, Aiko, lost her favorite fox plushie in the snow. She’s heartbroken. So he tells Sandman…"

*(Parent speaks in Japanese:)*
**PARENT (Kenji)**
*"Aiko’s fox cub, Kitsune, ran away into the snowstorm. She’s afraid he’ll never find his way home… but the moon is bright tonight, and foxes are clever."*

**DOC** *(pausing, letting the silence build)*
"Agents API doesn’t just translate—it *feels*. The story unfolds in Japanese, with Pixtral ensuring every brushstroke of the watercolor *hurts* just right. Listen."

*(Screen: Moonlit snow, fox cub’s tiny paw prints. ElevenLabs narration in Japanese, voice trembling slightly.)*
**ELEVENLABS (JA)**
*"Kitsune’s breath made clouds in the cold air. The moon whispered to him, ‘Follow the silver path…’"*

*(Judges’ eyes well up. Doc smirks.)*

---

### **[2:00 - 2:45] (SCREEN: FRENCH STORY – WHIMSY)**
**DOC** *(grinning again)*
"Now, let’s *fly*. Meet Amélie. Her son, Hugo, dreams of riding a whale. But not just any whale—a *cloud* whale. So she tells Sandman…"

*(Parent speaks in French:)*
**PARENT (Amélie)**
*"Hugo says the whales in the sky are made of clouds, and if you’re very quiet, you can hear them sing. He wants to ride one to the stars…"*

**DOC**
"Agents API delivers. Pixtral judges the illustrations—*‘Oui, that whale needs more sparkle’*—and ElevenLabs? Pure magic."

*(Screen: Girl on cloud whale, stars swirling. French narration, playful and light.)*
**ELEVENLABS (FR)**
*"Le baleine-nuage gonfla ses joues, et *whoosh*! Hugo s’envola vers la Voie Lactée…"*

---

### **[2:45 - 3:00] (SCREEN: PIPELINE BREAKDOWN + CALL TO ACTION)**
**DOC** *(rapid-fire, pointing at tech stack)*
"Here’s the secret sauce:
- **Mistral Large 3** for structured JSON stories.
- **4 Agents API agents** handling voice, text, art, and judgment.
- **Pixtral Large** as our *ruthless* art critic.
- **ElevenLabs** for voices that’ll make you cry.
- **Gemini** for illustrations so pretty they’ll haunt your dreams.
- **Stable Diffusion 1.5** (because FLUX OOM’d on 24GB—*lesson learned*).

We’re taking **Sydney 1st**, **Best ElevenLabs**, **Best Agent Skills**, and **Best W&B**—because this isn’t just a demo. It’s a *lullaby factory*."

*(Screen: "SANDMAN TALES V2" + "VOTE FOR US" + team photo with thumbs up.)*

**DOC** *(winking)*
"Now—who’s ready to put their kids to sleep *forever*?"

---

## **PART 2: ORDERS**
### **🔹 PATHFINDER (Tech Lead – Pipeline & Agents)**
**PRIORITY: EMOTIONAL PEAK (JA STORY)**
- **Agent 1 (Voice → Text):** Ensure Kenji’s Japanese input is *flawlessly* transcribed (use Voxtral for accent nuances). No errors—this story *must* feel raw.
- **Agent 2 (Story Gen):** Feed Large 3 *structured JSON* with emotional triggers:
  - `"mood": "melancholic_hopeful"`
  - `"key_elements": ["moonlight", "paw_prints", "silver_path"]`
  - `"cultural_tone": "shinto_whispers"` (subtle, not heavy-handed).
- **Agent 3 (Art Direction):** Override Pixtral’s "cozy" default for this story. Demand:
  - `"contrast": "high"` (moonlight vs. snow)
  - `"focus": "paw_prints_leading_home"`
  - `"color_palette": "cool_blues_silver_accents"`
- **Agent 4 (Quality Control):** Run Pixtral *twice* on the Japanese illustrations. If score <8.5, *regenerate*. This story *cannot* look generic.

**FALLBACK:** If Gemini illustrations lag, use SD 1.5 with *manual* Pixtral-guided tweaks (e.g., "add more snowflakes to the fox’s fur").

---

### **🔥 FIREFLY (Creative Lead – Story & Art)**
**PRIORITY: WHIMSY & POLISH**
- **English Stories (Kitten/Garden):**
  - Push Gemini for *interactive* illustrations (e.g., fireflies that "glow" when narration mentions them).
  - ElevenLabs narration: Add *subtle* sound effects (rustling leaves, distant chimes) in post.
- **French Story (Cloud Whale):**
  - Demand *movement* in art: Whale’s tail flicking, stars twinkling. Use Pixtral’s "dynamic" tag.
  - Narration: ElevenLabs voice should sound like a *French grand-mère*—warm, slightly raspy.
- **Japanese Story (Fox Cub):**
  - *No shortcuts.* If Gemini’s watercolors feel "flat," manually adjust saturation in post.
  - Narration: ElevenLabs voice should *break* slightly on *"silver path"* (emotional payoff).

**SECRET WEAPON:** Pre-generate *two* versions of each story. If judges ask for a tweak ("Can the whale be *bigger*?"), swap in the alternate.

---

### **🚑 LIFELINE (Demo Lead – Judges & Backup)**
**PRIORITY: CONTROL THE ROOM**
- **Pre-Demo:**
  - Load *all* stories/art/narration on *three* devices (laptop, tablet, phone). If one fails, pivot *instantly*.
  - Pre-download ElevenLabs audio files (no live API calls during demo).
- **During Demo:**
  - **Japanese Story:** Pause *after* the narration. Let the judges *feel* it. Count to 3 before moving on.
  - **French Story:** If judges laugh at the whale, *lean in*. "Oh, you want *more* whimsy? We’ve got a *dragon* version in the backlog."
- **If Tech Fails:**
  - **Voice Input:** "Voxtral’s *so* good it’s hearing your thoughts—let’s try again." (Blame the mic, not the code.)
  - **Art Lag:** "Gemini’s *perfectionist*—it’s painting the fox’s *soul*." (Buy time.)
  - **ElevenLabs Glitch:** "That’s not a bug—that’s the sound of *magic*." (Play it off.)
- **Post-Demo:**
  - **Prize Strategy:**
    - **Sydney 1st:** Emphasize *pipeline innovation* (Agents API + Pixtral + Gemini).
    - **Best ElevenLabs:** Play the Japanese narration again. *Make them cry twice.*
    - **Best Agent Skills:** Highlight the *four-agent workflow* (voice → text → art → QC).
    - **Best W&B:** Show the *before/after* Pixtral scores (6.8 → 9.0).

**FINAL ORDER:** If a judge asks, *"Can you make one for my kid?"*—**YES.** Hand them a QR code to a *live* Sandman Tales sandbox. *Hook them.*