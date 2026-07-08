import { useEffect, useRef, useState } from "react";

/**
 * Speaker toggle for ambient site audio — a soft wind bed with a faint
 * electrical hum, synthesized with the Web Audio API (no audio assets).
 * Off by default; starting requires this explicit user gesture, satisfying
 * autoplay policies. Fades in/out instead of hard-cutting.
 */

type AudioRig = {
  ctx: AudioContext;
  master: GainNode;
};

function buildRig(): AudioRig {
  const ctx = new AudioContext();
  const master = ctx.createGain();
  master.gain.value = 0;
  master.connect(ctx.destination);

  // Wind: looped white noise through a slowly wandering lowpass
  const noiseLen = 4 * ctx.sampleRate;
  const buffer = ctx.createBuffer(1, noiseLen, ctx.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < noiseLen; i++) data[i] = Math.random() * 2 - 1;
  const noise = ctx.createBufferSource();
  noise.buffer = buffer;
  noise.loop = true;
  const lowpass = ctx.createBiquadFilter();
  lowpass.type = "lowpass";
  lowpass.frequency.value = 320;
  lowpass.Q.value = 0.4;
  const windGain = ctx.createGain();
  windGain.gain.value = 0.5;
  noise.connect(lowpass).connect(windGain).connect(master);
  const gustLfo = ctx.createOscillator();
  gustLfo.frequency.value = 0.07;
  const gustDepth = ctx.createGain();
  gustDepth.gain.value = 140;
  gustLfo.connect(gustDepth).connect(lowpass.frequency);

  // Hum: low inverter tone, two soft harmonics
  const humGain = ctx.createGain();
  humGain.gain.value = 0.035;
  humGain.connect(master);
  for (const [freq, level] of [
    [55, 1],
    [110, 0.4],
  ] as const) {
    const osc = ctx.createOscillator();
    osc.type = "sine";
    osc.frequency.value = freq;
    const g = ctx.createGain();
    g.gain.value = level;
    osc.connect(g).connect(humGain);
    osc.start();
  }

  noise.start();
  gustLfo.start();
  return { ctx, master };
}

const TARGET_LEVEL = 0.11;
const FADE_S = 1.2;

export function AmbientAudioToggle({ className }: { className?: string }) {
  const [on, setOn] = useState(false);
  const rigRef = useRef<AudioRig | null>(null);

  const toggle = () => {
    const next = !on;
    setOn(next);
    if (next) {
      if (!rigRef.current) rigRef.current = buildRig();
      const { ctx, master } = rigRef.current;
      void ctx.resume();
      master.gain.cancelScheduledValues(ctx.currentTime);
      master.gain.setTargetAtTime(TARGET_LEVEL, ctx.currentTime, FADE_S / 3);
    } else if (rigRef.current) {
      const { ctx, master } = rigRef.current;
      master.gain.cancelScheduledValues(ctx.currentTime);
      master.gain.setTargetAtTime(0, ctx.currentTime, FADE_S / 3);
    }
  };

  useEffect(
    () => () => {
      void rigRef.current?.ctx.close();
      rigRef.current = null;
    },
    [],
  );

  return (
    <button
      type="button"
      className={className ?? "ambient-audio-toggle"}
      onClick={toggle}
      aria-pressed={on}
      aria-label={on ? "Mute ambient sound" : "Play ambient sound"}
      title={on ? "Mute ambient sound" : "Play ambient sound"}
    >
      {on ? "\u{1F50A}" : "\u{1F507}"}
    </button>
  );
}
