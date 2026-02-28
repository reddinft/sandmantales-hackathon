# **Sandman Tales v2**
*Interactive, Multilingual Storybook Generator*

**Mistral Worldwide Hackathon 2026 Submission**
🏆 **Team ClawCutters (Galaxy Rangers)** – Solo Hacker: Nissan Dookeran | 4 AI Agents
📍 **Sydney @ UNSW Founders** | Feb 28 – Mar 1, 2026

[![Mistral Hackathon](https://img.shields.io/badge/Mistral-Hackathon-ff6b6b?style=flat-square)](https://mistral.ai/hackathon)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg?style=flat-square)](LICENSE)
[![Python 3.10+](https://img.shields.io/badge/Python-3.10+-3776AB?style=flat-square&logo=python)](https://www.python.org/downloads/)
[![React](https://img.shields.io/badge/React-18.2+-61DAFB?style=flat-square&logo=react)](https://reactjs.org/)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.109+-009688?style=flat-square&logo=fastapi)](https://fastapi.tiangolo.com/)

---

## **🌙 Overview**
**Sandman Tales v2** is an AI-powered storybook generator that crafts **personalized, illustrated, and narrated bedtime stories** in **12+ languages**. Built for the **Mistral Worldwide Hackathon**, this project leverages **Mistral Large 3, Agents API, and multimodal AI** to create immersive, watercolor-style storybooks with **voice narration, dynamic moods, and interactive storytelling**.

### **🎯 Key Features**
✅ **Multilingual Storytelling** – English, Japanese, French, and 9+ more languages (via ElevenLabs).
✅ **AI-Generated Illustrations** – Google Imagen 4.0 for **watercolor-style artwork**.
✅ **Structured Story Generation** – Mistral Large 3 outputs **JSON-structured stories** (title, scenes, moods, illustration prompts).
✅ **Voice Narration** – ElevenLabs for **high-quality, expressive storytelling**.
✅ **Agent Orchestration** – **4 Mistral Agents** (Doc, Pathfinder, Firefly, Lifeline) working in harmony.
✅ **Multimodal Quality Control** – Pixtral Large evaluates **image-text alignment**.
✅ **Fine-Tuning Experiment** – LoRA on FLUX.1-schnell (OOM → pivoted to SD 1.5 + Imagen).

---

## **🚀 Demo Stories**
| Language | Title | Preview |
|----------|-------|---------|
| **English** | *The Whispering Willow* | [🎨 Illustration](https://example.com/whispering-willow) |
| **Japanese** | *月の砂漠の冒険* (*Tsuki no Sabaku no Bōken*) | [🎨 Illustration](https://example.com/moon-desert) |
| **French** | *Le Secret du Jardin Étoilé* | [🎨 Illustration](https://example.com/star-garden) |

*(Note: Replace example.com with actual demo links.)*

---

## **🛠️ Tech Stack**
### **Core AI Models**
| Component | Technology | Purpose |
|-----------|------------|---------|
| **Story Generation** | Mistral Large 3 | Structured JSON story output (title, scenes, moods, prompts) |
| **Agent Orchestration** | Mistral Agents API | 4 agents: **Doc (Orchestrator), Pathfinder (Story Gen), Firefly (Builder), Lifeline (Voice/Audio)** |
| **Image Generation** | Google Imagen 4.0 | Watercolor-style illustrations |
| **Image Quality Judge** | Pixtral Large | Multimodal evaluation of image-text alignment |
| **Voice Input** | Voxtral | Parent voice-to-text for story customization |
| **Narration** | ElevenLabs | Multilingual, expressive voiceovers |
| **Fine-Tuning** | LoRA (SD 1.5) | Attempted FLUX.1-schnell (OOM → pivoted to Imagen) |

### **Backend & Frontend**
| Component | Technology | Purpose |
|-----------|------------|---------|
| **Backend** | FastAPI | REST API for story generation, agent coordination, and image processing |
| **Frontend** | React | Interactive storybook UI with narration controls |
| **Orchestration** | OpenClaw | Agent workflow management (running on **Mac Mini M4**) |

---

## **⚙️ Setup Instructions**

### **Prerequisites**
- Python 3.10+
- Node.js 18+
- Docker (optional, for containerized deployment)
- API keys for:
  - Mistral AI
  - ElevenLabs
  - Google Cloud (Imagen 4.0)
  - OpenClaw (if self-hosting)

### **1. Backend Setup (FastAPI)**
```bash
# Clone the repo
git clone https://github.com/yourusername/sandman-tales-v2.git
cd sandman-tales-v2/backend

# Create a virtual environment
python -m venv venv
source venv/bin/activate  # Linux/Mac
# venv\Scripts\activate   # Windows

# Install dependencies
pip install -r requirements.txt

# Set up environment variables
cp .env.example .env
# Edit .env with your API keys

# Run the FastAPI server
uvicorn main:app --reload
```

### **2. Frontend Setup (React)**
```bash
cd ../frontend
npm install
npm start
```

### **3. Agent Orchestration (OpenClaw)**
- Deploy OpenClaw on a **Mac Mini M4** (or any machine with sufficient resources).
- Configure agent workflows in `openclaw/config.yaml`.
- Start the orchestrator:
  ```bash
  python -m openclaw.orchestrator
  ```

### **4. Running the Full Pipeline**
1. **Start the backend** (`uvicorn main:app --reload`).
2. **Start the frontend** (`npm start`).
3. **Trigger a story generation** via the UI or API.
4. **Agents process the request** (story → images → narration).
5. **Enjoy your personalized storybook!**

---

## **🔬 Fine-Tuning Experiment**
### **Goal**
Improve **custom illustration quality** for Sandman Tales.

### **Approach**
1. **LoRA on FLUX.1-schnell** (24GB VRAM required → **OOM**).
2. **Pivoted to Stable Diffusion 1.5** (500 steps, 20 Imagen training images).
3. **Pixtral as Judge** – Evaluated image-text alignment (+2.8 improvement).
4. **Conclusion** – **Teacher (Imagen) > Student (SD 1.5)** → Used Imagen for production.

---

## **📸 Screenshots**
*(Add screenshots of the UI, generated stories, and agent workflows.)*

---

## **🤝 Contributing**
We welcome contributions! Open an issue or submit a PR.

1. Fork the repo.
2. Create a feature branch (`git checkout -b feature/your-feature`).
3. Commit changes (`git commit -m "Add your feature"`).
4. Push to the branch (`git push origin feature/your-feature`).
5. Open a Pull Request.

---

## **📜 License**
MIT License – See [LICENSE](LICENSE) for details.

---

## **🙌 Acknowledgements**
- **Mistral AI** – For the hackathon and powerful models.
- **ElevenLabs** – For multilingual voice narration.
- **Google Cloud** – For Imagen 4.0 access.
- **OpenClaw** – For agent orchestration.
- **UNSW Founders** – For hosting the hackathon.

---

**🌟 Made with ❤️ by Team ClawCutters (Galaxy Rangers) – Nissan Dookeran & 4 AI Agents**