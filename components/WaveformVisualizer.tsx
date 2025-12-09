import React, { useRef, useEffect } from 'react';

interface WaveformVisualizerProps {
    stream: MediaStream | null;
}

export const WaveformVisualizer: React.FC<WaveformVisualizerProps> = ({ stream }) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const audioContextRef = useRef<AudioContext | null>(null);
    const animationFrameIdRef = useRef<number | null>(null);

    useEffect(() => {
        if (!stream || !canvasRef.current) {
            return;
        }

        // Create and store a new AudioContext
        const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
        audioContextRef.current = audioContext;

        const source = audioContext.createMediaStreamSource(stream);
        const analyser = audioContext.createAnalyser();
        analyser.fftSize = 2048;
        
        const gainNode = audioContext.createGain();
        gainNode.gain.setValueAtTime(0, audioContext.currentTime); // Mute output to prevent feedback

        source.connect(analyser);
        analyser.connect(gainNode);
        gainNode.connect(audioContext.destination);

        const canvas = canvasRef.current;
        const canvasCtx = canvas.getContext('2d');

        const draw = () => {
            if (!canvasCtx || analyser.context.state === 'closed') return;
            
            animationFrameIdRef.current = requestAnimationFrame(draw);

            const bufferLength = analyser.frequencyBinCount;
            const dataArray = new Uint8Array(bufferLength);
            analyser.getByteTimeDomainData(dataArray);

            const isDarkMode = document.documentElement.classList.contains('dark');
            canvasCtx.fillStyle = isDarkMode ? 'rgb(30 41 59)' : 'rgb(248 250 252)'; // slate-800 or slate-50
            canvasCtx.fillRect(0, 0, canvas.width, canvas.height);

            canvasCtx.lineWidth = 2;
            canvasCtx.strokeStyle = '#3b82f6'; // blue-600

            canvasCtx.beginPath();
            const sliceWidth = canvas.width * 1.0 / bufferLength;
            let x = 0;

            for (let i = 0; i < bufferLength; i++) {
                const v = dataArray[i] / 128.0;
                const y = v * canvas.height / 2;

                if (i === 0) {
                    canvasCtx.moveTo(x, y);
                } else {
                    canvasCtx.lineTo(x, y);
                }
                x += sliceWidth;
            }
            canvasCtx.lineTo(canvas.width, canvas.height / 2);
            canvasCtx.stroke();
        };

        draw();

        // Cleanup function
        return () => {
            if (animationFrameIdRef.current) {
                cancelAnimationFrame(animationFrameIdRef.current);
            }
            // Disconnect nodes and close the context to release resources
            if (audioContext.state !== 'closed') {
                source.disconnect();
                analyser.disconnect();
                gainNode.disconnect();
                audioContext.close().catch(e => console.error("Error closing AudioContext", e));
            }
        };

    }, [stream]); // Re-run effect if the stream changes

    return <canvas ref={canvasRef} width="300" height="60" className="mb-2 rounded"></canvas>;
};
