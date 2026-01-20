
import React, { useState, useEffect } from 'react';
import { GoogleGenAI } from "@google/genai";

const LoadingScreen: React.FC = () => {
  const [progress, setProgress] = useState(0);
  const [aiTip, setAiTip] = useState("Initializing neural networks...");
  const [dots, setDots] = useState("");

  // Simulated progress logic
  useEffect(() => {
    const interval = setInterval(() => {
      setProgress(prev => {
        if (prev >= 100) return 100;
        const increment = Math.random() * 15;
        return Math.min(prev + increment, 100);
      });
    }, 400);

    const dotInterval = setInterval(() => {
      setDots(prev => (prev.length >= 3 ? "" : prev + "."));
    }, 500);

    return () => {
      clearInterval(interval);
      clearInterval(dotInterval);
    };
  }, []);

  // Fetch a "thought" from Gemini to show during loading
  useEffect(() => {
    const fetchThought = async () => {
      try {
        const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || "" });
        const response = await ai.models.generateContent({
          model: 'gemini-3-flash-preview',
          contents: 'Give me a very short, futuristic 5-word quote about technology and progress.',
          config: { temperature: 0.9 }
        });
        if (response.text) {
          setAiTip(response.text.replace(/"/g, ''));
        }
      } catch (error) {
        console.error("Gemini failed:", error);
        // Fallback tips
        const tips = [
          "Optimizing workspace for efficiency",
          "Synchronizing with cloud modules",
          "Generating aesthetic interfaces",
          "Calibrating system parameters"
        ];
        setAiTip(tips[Math.floor(Math.random() * tips.length)]);
      }
    };

    fetchThought();
  }, []);

  return (
    <div className="fixed inset-0 flex flex-col items-center justify-center bg-[#030712] overflow-hidden">
      {/* Background Decorative Elements */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-indigo-600/10 rounded-full blur-[120px] animate-pulse"></div>
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-600/10 rounded-full blur-[120px] animate-pulse delay-700"></div>

      {/* Main Loader Visual */}
      <div className="relative z-10 flex flex-col items-center">
        <div className="relative mb-12">
          {/* Outer Ring */}
          <div className="w-24 h-24 border-2 border-indigo-500/20 rounded-full absolute inset-0"></div>
          
          {/* Spinning Segment */}
          <div 
            className="w-24 h-24 border-t-2 border-indigo-500 rounded-full animate-spin"
            style={{ animationDuration: '1.5s' }}
          ></div>

          {/* Core Symbol */}
          <div className="absolute inset-0 flex items-center justify-center">
             <div className="w-10 h-10 bg-gradient-to-br from-indigo-400 to-purple-600 rounded-lg rotate-45 animate-pulse shadow-[0_0_20px_rgba(99,102,241,0.5)]"></div>
          </div>
        </div>

        {/* Text Content */}
        <div className="text-center space-y-4 max-w-md px-6">
          <h2 className="text-2xl font-light tracking-widest text-white/90 uppercase">
            Loading{dots}
          </h2>
          
          <div className="h-1.5 w-64 bg-slate-800 rounded-full overflow-hidden mx-auto">
            <div 
              className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 transition-all duration-500 ease-out"
              style={{ width: `${progress}%` }}
            ></div>
          </div>

          <p className="text-sm text-slate-400 font-medium h-6 italic">
            "{aiTip}"
          </p>
        </div>
      </div>

      {/* Subtle Bottom Badge */}
      <div className="absolute bottom-10 text-[10px] text-slate-600 tracking-[0.3em] uppercase">
        Engineered with Nexus OS
      </div>
    </div>
  );
};

export default LoadingScreen;
