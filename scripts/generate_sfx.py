import os
from pathlib import Path

import lameenc
import numpy as np

SAMPLE_RATE = 44100
OUTPUT_DIR = Path("public/audio")


def encode(samples: np.ndarray) -> bytes:
    encoder = lameenc.Encoder()
    encoder.set_bit_rate(128)
    encoder.set_in_sample_rate(SAMPLE_RATE)
    encoder.set_channels(1)
    encoder.set_quality(2)

    clipped = np.clip(samples, -1.0, 1.0)
    pcm = (clipped * 32767).astype(np.int16)
    data = encoder.encode(pcm.tobytes())
    data += encoder.flush()
    return data


def sweep_wave(duration: float, start_freq: float, end_freq: float) -> np.ndarray:
    t = np.linspace(0.0, duration, int(SAMPLE_RATE * duration), endpoint=False)
    k = (end_freq - start_freq) / duration
    phase = 2 * np.pi * (start_freq * t + 0.5 * k * t**2)
    return np.sin(phase)


def correct_guess() -> np.ndarray:
    duration = 0.32
    t = np.linspace(0.0, duration, int(SAMPLE_RATE * duration), endpoint=False)
    envelope = np.exp(-4.5 * t / duration)
    base = np.sin(2 * np.pi * 880 * t)
    shimmer = np.sin(2 * np.pi * 1320 * t) * 0.4
    return (base + shimmer) * envelope * 0.9


def wrong_guess() -> np.ndarray:
    duration = 0.7
    t = np.linspace(0.0, duration, int(SAMPLE_RATE * duration), endpoint=False)
    sweep = sweep_wave(duration, 200, 70)
    secondary = sweep_wave(duration, 120, 40) * 0.4
    noise = (np.random.rand(t.size) * 2 - 1) * 0.1
    envelope = 1 - np.power(t / duration, 1.2)
    return (sweep * 0.9 + secondary + noise) * envelope


def win_cheer() -> np.ndarray:
    segments = [
        (0.36, 523),
        (0.36, 659),
        (0.44, 784),
    ]
    waves = []
    for duration, freq in segments:
        t = np.linspace(0.0, duration, int(SAMPLE_RATE * duration), endpoint=False)
        base = np.sin(2 * np.pi * freq * t)
        harmonic = np.sin(2 * np.pi * freq * 1.5 * t) * 0.35
        envelope = np.exp(-3 * t / duration)
        waves.append((base + harmonic) * envelope * 0.85)
    return np.concatenate(waves)


def loss_creak() -> np.ndarray:
    duration = 0.9
    t = np.linspace(0.0, duration, int(SAMPLE_RATE * duration), endpoint=False)
    sweep = sweep_wave(duration, 320, 80)
    grit = (np.random.rand(t.size) * 2 - 1) * 0.15
    wobble = np.sin(2 * np.pi * 6 * t) * 0.2
    envelope = np.exp(-2.5 * t / duration)
    return (sweep * 0.8 + wobble + grit) * envelope


def silence(duration: float = 0.25) -> np.ndarray:
    return np.zeros(int(SAMPLE_RATE * duration), dtype=np.float32)


def write_mp3(name: str, samples: np.ndarray) -> Path:
    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
    data = encode(samples)
    path = OUTPUT_DIR / name
    path.write_bytes(data)
    return path


def main():
    np.random.seed(42)
    write_mp3("correct-guess.mp3", correct_guess())
    write_mp3("wrong-guess.mp3", wrong_guess())
    write_mp3("win.mp3", win_cheer())

    loss_base_path = write_mp3("loss-base.mp3", loss_creak())
    silence_path = write_mp3("loss-silence.mp3", silence(0.22))

    voice_path = OUTPUT_DIR / "loss-voice.mp3"
    if not voice_path.exists():
        raise FileNotFoundError(
            "Expected loss-voice.mp3 (generate via gTTS or voice recording) before running script."
        )

    combined = loss_base_path.read_bytes() + silence_path.read_bytes() + voice_path.read_bytes()
    (OUTPUT_DIR / "loss.mp3").write_bytes(combined)

    # cleanup intermediates
    for temp_path in (loss_base_path, silence_path, voice_path):
        if temp_path.exists():
            temp_path.unlink()


if __name__ == "__main__":
    main()
