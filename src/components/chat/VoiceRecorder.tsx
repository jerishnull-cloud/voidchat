import React, { useState, useEffect, useRef } from 'react';
import { Mic, Square, Trash2, Send } from 'lucide-react';
import { MessageMedia } from '../../types/chat';
import { sounds } from '../../lib/sounds';

interface VoiceRecorderProps {
  onSendVoice: (media: MessageMedia) => void;
  onCancel: () => void;
}

export const VoiceRecorder: React.FC<VoiceRecorderProps> = ({ onSendVoice, onCancel }) => {
  const [isRecording, setIsRecording] = useState(false);
  const [duration, setDuration] = useState(0);
  const [waveform, setWaveform] = useState<number[]>([15, 20, 30, 25, 40, 20, 15, 30]);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animFrameRef = useRef<number | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  useEffect(() => {
    startRecording();
    return () => {
      cleanup();
    };
  }, []);

  const cleanup = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
    }
    if (audioCtxRef.current && audioCtxRef.current.state !== 'closed') {
      audioCtxRef.current.close().catch(() => {});
    }
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          audioChunksRef.current.push(e.data);
        }
      };

      // Set up real AudioContext for live waveform visualizer
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioCtx) {
        const audioCtx = new AudioCtx();
        audioCtxRef.current = audioCtx;
        const source = audioCtx.createMediaStreamSource(stream);
        const analyser = audioCtx.createAnalyser();
        analyser.fftSize = 32;
        source.connect(analyser);
        analyserRef.current = analyser;

        const bufferLength = analyser.frequencyBinCount;
        const dataArray = new Uint8Array(bufferLength);

        const updateWave = () => {
          if (!analyserRef.current) return;
          analyserRef.current.getByteFrequencyData(dataArray);
          // Sample 12 frequencies
          const bars: number[] = [];
          for (let i = 0; i < 12; i++) {
            const val = dataArray[i * 2] || 0;
            // scale 10px to 45px
            bars.push(Math.max(8, Math.round((val / 255) * 45)));
          }
          setWaveform(bars);
          animFrameRef.current = requestAnimationFrame(updateWave);
        };
        updateWave();
      }

      mediaRecorder.start(100);
      setIsRecording(true);

      timerRef.current = setInterval(() => {
        setDuration((prev) => prev + 1);
      }, 1000);
    } catch (err) {
      console.error('Microphone access denied or unsupported:', err);
      alert('Microphone access is required to record voice comms.');
      onCancel();
    }
  };

  const stopAndSend = () => {
    if (!mediaRecorderRef.current || !isRecording) return;

    sounds.playClick();
    mediaRecorderRef.current.onstop = () => {
      const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64Audio = reader.result as string;
        onSendVoice({
          url: base64Audio,
          mimeType: 'audio/webm',
          fileName: `voice_transmission_${Date.now()}.webm`,
          fileSize: audioBlob.size,
          duration: Math.max(1, duration),
        });
      };
      reader.readAsDataURL(audioBlob);
      cleanup();
    };

    mediaRecorderRef.current.stop();
    setIsRecording(false);
  };

  const handleCancel = () => {
    sounds.playClick();
    cleanup();
    onCancel();
  };

  const formatSeconds = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <div className="flex items-center gap-3 w-full bg-[#100B18] border border-[#B026FF]/50 rounded-xl px-3 py-2 shadow-[0_0_15px_rgba(176,38,255,0.25)] animate-in fade-in duration-200">
      {/* Blinking Recording Dot */}
      <div className="flex items-center gap-2">
        <span className="w-3 h-3 rounded-full bg-red-500 animate-pulse shadow-[0_0_8px_#ef4444]" />
        <span className="font-orbitron text-xs text-white tracking-widest">
          {formatSeconds(duration)}
        </span>
      </div>

      {/* Live Waveform Visualizer */}
      <div className="flex-1 flex items-center justify-center gap-1 h-8 px-2">
        {waveform.map((h, i) => (
          <div
            key={i}
            className="w-1 bg-[#B026FF] rounded-full transition-all duration-75 shadow-[0_0_6px_#B026FF]"
            style={{ height: `${h}px` }}
          />
        ))}
      </div>

      <div className="flex items-center gap-2">
        {/* Cancel Button */}
        <button
          onClick={handleCancel}
          type="button"
          title="Cancel Recording"
          className="p-2 rounded-lg text-[#A1A1AA] hover:text-red-400 hover:bg-red-500/10 transition-colors cursor-pointer"
        >
          <Trash2 className="w-4 h-4" />
        </button>

        {/* Send Voice Button */}
        <button
          onClick={stopAndSend}
          type="button"
          title="Transmit Voice Memo"
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gradient-to-r from-[#B026FF] to-[#8A2BE2] text-white font-tech font-bold text-xs tracking-wider shadow-[0_0_12px_#B026FF] hover:scale-105 active:scale-95 transition-transform cursor-pointer"
        >
          <Send className="w-3.5 h-3.5" />
          <span>TRANSMIT</span>
        </button>
      </div>
    </div>
  );
};
