import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const StoryCreator = () => {
  const [childName, setChildName] = useState('');
  const [language, setLanguage] = useState('en');
  const [prompt, setPrompt] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [pipelineStatus, setPipelineStatus] = useState({
    voice: 'idle',
    story: 'idle',
    illustrations: 'idle',
    narration: 'idle',
  });
  const [progressText, setProgressText] = useState('');
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const navigate = useNavigate();

  const languages = [
    { code: 'en', name: 'English' },
    { code: 'ja', name: '日本語' },
    { code: 'fr', name: 'Français' },
    { code: 'hi', name: 'हिन्दी' },
    { code: 'es', name: 'Español' },
    { code: 'pt', name: 'Português' },
    { code: 'de', name: 'Deutsch' },
    { code: 'zh', name: '中文' },
    { code: 'ar', name: 'العربية' },
    { code: 'ko', name: '한국어' },
  ];

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        audioChunksRef.current.push(event.data);
      };

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/wav' });
        const formData = new FormData();
        formData.append('audio', audioBlob);

        try {
          const response = await fetch('/api/voice/transcribe', {
            method: 'POST',
            body: formData,
          });
          const data = await response.json();
          setPrompt(data.prompt);
          setLanguage(data.language);
        } catch (error) {
          console.error('Transcription error:', error);
        }
      };

      mediaRecorder.start();
      setIsRecording(true);
    } catch (error) {
      console.error('Recording error:', error);
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());
    }
  };

  const handleCreateStory = async () => {
    setPipelineStatus({
      voice: 'processing',
      story: 'idle',
      illustrations: 'idle',
      narration: 'idle',
    });
    setProgressText('Listening to your voice...');

    try {
      const response = await fetch('/api/story', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          child_name: childName,
          language,
          prompt,
        }),
      });

      const data = await response.json();
      setPipelineStatus(prev => ({ ...prev, voice: 'complete' }));
      setProgressText('Crafting your story...');

      const interval = setInterval(() => {
        setPipelineStatus(prev => {
          if (prev.story === 'idle') {
            setProgressText('Generating magical illustrations...');
            return { ...prev, story: 'complete' };
          } else if (prev.illustrations === 'idle') {
            setProgressText('Recording the narration...');
            return { ...prev, illustrations: 'complete' };
          } else if (prev.narration === 'idle') {
            clearInterval(interval);
            setProgressText('Your story is ready!');
            navigate(`/story/${data.id}`);
            return { ...prev, narration: 'complete' };
          }
          return prev;
        });
      }, 2000);
    } catch (error) {
      console.error('Story creation error:', error);
    }
  };

  useEffect(() => {
    return () => {
      if (mediaRecorderRef.current && isRecording) {
        mediaRecorderRef.current.stop();
        mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());
      }
    };
  }, [isRecording]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-950 via-purple-900 to-slate-900 relative overflow-hidden">
      <style>
        {`
          @keyframes twinkle {
            0%, 100% { opacity: 0.2; }
            50% { opacity: 1; }
          }
          .star {
            position: absolute;
            background: white;
            border-radius: 50%;
            animation: twinkle 3s infinite ease-in-out;
          }
          .star-1 { width: 2px; height: 2px; top: 10%; left: 20%; animation-delay: 0s; }
          .star-2 { width: 3px; height: 3px; top: 20%; left: 80%; animation-delay: 0.5s; }
          .star-3 { width: 1px; height: 1px; top: 60%; left: 10%; animation-delay: 1s; }
          .star-4 { width: 2px; height: 2px; top: 80%; left: 90%; animation-delay: 1.5s; }
          .star-5 { width: 3px; height: 3px; top: 40%; left: 60%; animation-delay: 2s; }
          .star-6 { width: 1px; height: 1px; top: 30%; left: 40%; animation-delay: 2.5s; }
          .glow {
            box-shadow: 0 0 15px rgba(245, 158, 11, 0.5);
          }
        `}
      </style>

      <div className="star star-1"></div>
      <div className="star star-2"></div>
      <div className="star star-3"></div>
      <div className="star star-4"></div>
      <div className="star star-5"></div>
      <div className="star star-6"></div>

      <div className="container mx-auto px-4 py-12 relative z-10">
        <div className="max-w-2xl mx-auto">
          <div className="bg-slate-800/50 backdrop-blur-lg rounded-3xl p-8 border border-amber-200/20 glow">
            <h1 className="text-4xl font-bold text-center text-amber-100 mb-8">Create a Magical Story</h1>

            <div className="space-y-6">
              <div>
                <label className="block text-amber-100 text-sm font-medium mb-2">Child's Name</label>
                <input
                  type="text"
                  value={childName}
                  onChange={(e) => setChildName(e.target.value)}
                  placeholder="Sophie"
                  className="w-full px-4 py-3 rounded-xl bg-slate-700/50 border border-amber-200/30 text-white placeholder-amber-200/70 focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-amber-100 text-sm font-medium mb-2">Language</label>
                <select
                  value={language}
                  onChange={(e) => setLanguage(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl bg-slate-700/50 border border-amber-200/30 text-white focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-transparent appearance-none"
                  style={{ backgroundImage: 'url("data:image/svg+xml;charset=US-ASCII,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%22292.4%22%20height%3D%22292.4%22%3E%3Cpath%20fill%3D%22%23F59E0B%22%20d%3D%22M287%2069.4a17.6%2017.6%200%200%200-13-5.4H18.4c-5%200-9.3%201.8-12.9%205.4A17.6%2017.6%200%200%200%200%2082.2c0%205%201.8%209.3%205.4%2012.9l128%20127.9c3.6%203.6%207.8%205.4%2012.8%205.4s9.2-1.8%2012.8-5.4L287%2095c3.5-3.5%205.4-7.8%205.4-12.8%200-5-1.9-9.2-5.5-12.8z%22%2F%3E%3C%2Fsvg%3E")', backgroundRepeat: 'no-repeat', backgroundPosition: 'right 1rem center', backgroundSize: '0.65rem' }}
                >
                  {languages.map((lang) => (
                    <option key={lang.code} value={lang.code} className="bg-slate-700">
                      {lang.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="relative">
                <label className="block text-amber-100 text-sm font-medium mb-2">Tell us about their day</label>
                <textarea
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  placeholder="Sophie barely hears French at school in Sydney. Her mum worries she'll forget her language. Tell her a magical bedtime story in French so she falls asleep hearing the words that feel like home."
                  rows={5}
                  className="w-full px-4 py-3 rounded-xl bg-slate-700/50 border border-amber-200/30 text-white placeholder-amber-200/70 focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-transparent resize-none"
                />
                <button
                  onClick={isRecording ? stopRecording : startRecording}
                  className="absolute top-10 right-4 p-2 text-amber-400 hover:text-amber-300 transition-colors"
                  aria-label={isRecording ? 'Stop recording' : 'Start recording'}
                >
                  🎙️
                </button>
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <div className={`w-3 h-3 rounded-full ${pipelineStatus.voice === 'idle' ? 'bg-slate-500' : pipelineStatus.voice === 'processing' ? 'bg-amber-400 animate-pulse' : 'bg-green-400'}`}></div>
                    <span className="text-amber-100">Voxtral Voice→Text</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className={`w-3 h-3 rounded-full ${pipelineStatus.story === 'idle' ? 'bg-slate-500' : pipelineStatus.story === 'processing' ? 'bg-amber-400 animate-pulse' : 'bg-green-400'}`}></div>
                    <span className="text-amber-100">Pathfinder Story Gen</span>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <div className={`w-3 h-3 rounded-full ${pipelineStatus.illustrations === 'idle' ? 'bg-slate-500' : pipelineStatus.illustrations === 'processing' ? 'bg-amber-400 animate-pulse' : 'bg-green-400'}`}></div>
                    <span className="text-amber-100">Firefly Illustrations</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className={`w-3 h-3 rounded-full ${pipelineStatus.narration === 'idle' ? 'bg-slate-500' : pipelineStatus.narration === 'processing' ? 'bg-amber-400 animate-pulse' : 'bg-green-400'}`}></div>
                    <span className="text-amber-100">Lifeline Narration</span>
                  </div>
                </div>
              </div>

              {progressText && (
                <div className="mt-4 p-3 bg-amber-900/30 rounded-xl text-center text-amber-100">
                  {progressText}
                </div>
              )}

              <button
                onClick={handleCreateStory}
                disabled={!childName || !prompt}
                className="w-full py-4 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 text-white font-bold text-lg hover:from-amber-600 hover:to-amber-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed glow"
              >
                🌙 Create Story
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StoryCreator;