from dataclasses import dataclass, field
from typing import List, Dict, Any
import numpy as np

# ----------------------------------------------------------------------
# 1. Data Schema Definitions
# ----------------------------------------------------------------------
@dataclass
class Track:
    id: str
    name: str
    muted: bool
    soloed: bool
    volume: float
    steps: List[bool]
    accents: List[bool]

    def to_array(self) -> np.ndarray:
        """Returns steps as a binary numpy vector (16,)."""
        return np.array(self.steps, dtype=np.int8)

@dataclass
class SoloNote:
    step: int
    note: str
    freq: float
    duration_steps: int

@dataclass
class Pattern:
    id: str
    name: str
    description: str
    tracks: Dict[str, Track]
    solo_notes: List[SoloNote]

    def get_track_matrix(self) -> np.ndarray:
        """Returns a (num_tracks, 16) binary grid of active trigger steps."""
        return np.vstack([t.to_array() for t in self.tracks.values()])

@dataclass
class SongSection:
    id: str
    pattern_id: str
    name: str
    repeats: int

# ----------------------------------------------------------------------
# 2. Project Data Payload
# ----------------------------------------------------------------------
bpm: int = 124
swing: float = 0.1
active_pattern_id: str = "pattern_a"

# Helper for track instantiation
def make_track(t_id: str, name: str, vol: float, step_indices: List[int], accent_indices: List[int] = None) -> Track:
    steps = [i in step_indices for i in range(16)]
    accents = [i in (accent_indices or []) for i in range(16)]
    return Track(id=t_id, name=name, muted=False, soloed=False, volume=vol, steps=steps, accents=accents)

patterns: Dict[str, Pattern] = {
    "pattern_a": Pattern(
        id="pattern_a",
        name="Pattern A: Intro",
        description="Crisp kick and hi-hat buildup setting the tempo",
        tracks={
            "kick": make_track("kick", "Punch Kick", 0.9, [0, 8]),
            "snare": make_track("snare", "Snappy Snare", 0.85, []),
            "hihat_closed": make_track("hihat_closed", "Closed Hat", 0.7, [0, 2, 4, 6, 8, 10, 12, 14], [0, 8]),
            "hihat_open": make_track("hihat_open", "Open Hat", 0.75, []),
            "tom_high": make_track("tom_high", "High Tom", 0.8, []),
            "tom_low": make_track("tom_low", "Floor Tom", 0.85, []),
            "clap": make_track("clap", "Electro Clap", 0.8, [4, 12]),
            "crash": make_track("crash", "Crash Cymbal", 0.65, []),
        },
        solo_notes=[
            SoloNote(step=0, note="A3", freq=220.0, duration_steps=4),
            SoloNote(step=8, note="C4", freq=261.63, duration_steps=4),
        ]
    ),
    "pattern_b": Pattern(
        id="pattern_b",
        name="Pattern B: Verse",
        description="Steady pocket groove with syncopated kick and snare snaps",
        tracks={
            "kick": make_track("kick", "Punch Kick", 0.9, [0, 6, 8, 10], [0, 8]),
            "snare": make_track("snare", "Snappy Snare", 0.85, [4, 12], [12]),
            "hihat_closed": make_track("hihat_closed", "Closed Hat", 0.7, [0, 2, 4, 6, 8, 10, 12, 14]),
            "hihat_open": make_track("hihat_open", "Open Hat", 0.75, [14]),
            "tom_high": make_track("tom_high", "High Tom", 0.8, []),
            "tom_low": make_track("tom_low", "Floor Tom", 0.85, []),
            "clap": make_track("clap", "Electro Clap", 0.8, []),
            "crash": make_track("crash", "Crash Cymbal", 0.65, []),
        },
        solo_notes=[
            SoloNote(step=0, note="A3", freq=220.0, duration_steps=2),
            SoloNote(step=4, note="D4", freq=293.66, duration_steps=2),
            SoloNote(step=8, note="E4", freq=329.63, duration_steps=4),
        ]
    ),
    "pattern_c": Pattern(
        id="pattern_c",
        name="Pattern C: Chorus",
        description="High-energy driving chorus with full percussion and crash downbeats",
        tracks={
            "kick": make_track("kick", "Punch Kick", 0.9, [0, 2, 6, 8, 10, 14], [0, 8]),
            "snare": make_track("snare", "Snappy Snare", 0.85, [4, 12]),
            "hihat_closed": make_track("hihat_closed", "Closed Hat", 0.7, list(range(16)), [0, 4, 8, 12]),
            "hihat_open": make_track("hihat_open", "Open Hat", 0.75, [6, 14]),
            "tom_high": make_track("tom_high", "High Tom", 0.8, []),
            "tom_low": make_track("tom_low", "Floor Tom", 0.85, []),
            "clap": make_track("clap", "Electro Clap", 0.8, [4, 12]),
            "crash": make_track("crash", "Crash Cymbal", 0.65, [0]),
        },
        solo_notes=[
            SoloNote(step=0, note="A4", freq=440.0, duration_steps=2),
            SoloNote(step=4, note="G4", freq=392.0, duration_steps=2),
            SoloNote(step=8, note="E4", freq=329.63, duration_steps=2),
            SoloNote(step=12, note="D4", freq=293.66, duration_steps=4),
        ]
    ),
    "pattern_d": Pattern(
        id="pattern_d",
        name="Pattern D: Drum Solo",
        description="Virtuosic drum solo breakdown with tom rolls, double kicks, and crash flourishes",
        tracks={
            "kick": make_track("kick", "Punch Kick", 0.9, [0, 1, 4, 6, 8, 9, 10, 14], [0, 8]),
            "snare": make_track("snare", "Snappy Snare", 0.85, [2, 3, 5, 11, 12, 13], [5, 13]),
            "hihat_closed": make_track("hihat_closed", "Closed Hat", 0.7, []),
            "hihat_open": make_track("hihat_open", "Open Hat", 0.75, [4, 12]),
            "tom_high": make_track("tom_high", "High Tom", 0.8, [6, 7, 10], [7]),
            "tom_low": make_track("tom_low", "Floor Tom", 0.85, [8, 9, 14, 15], [15]),
            "clap": make_track("clap", "Electro Clap", 0.8, []),
            "crash": make_track("crash", "Crash Cymbal", 0.65, [0, 8], [0, 8]),
        },
        solo_notes=[]
    ),
    "pattern_e": Pattern(
        id="pattern_e",
        name="Pattern E: Outro",
        description="Decelerating groove fading into resonant crash and atmospheric decay",
        tracks={
            "kick": make_track("kick", "Punch Kick", 0.9, [0, 8]),
            "snare": make_track("snare", "Snappy Snare", 0.85, [4, 12]),
            "hihat_closed": make_track("hihat_closed", "Closed Hat", 0.7, []),
            "hihat_open": make_track("hihat_open", "Open Hat", 0.75, []),
            "tom_high": make_track("tom_high", "High Tom", 0.8, []),
            "tom_low": make_track("tom_low", "Floor Tom", 0.85, []),
            "clap": make_track("clap", "Electro Clap", 0.8, []),
            "crash": make_track("crash", "Crash Cymbal", 0.65, [0, 14], [14]),
        },
        solo_notes=[
            SoloNote(step=0, note="A3", freq=220.0, duration_steps=8),
        ]
    )
}

song_sections = [
    SongSection("sec_1", "pattern_a", "Intro", 2),
    SongSection("sec_2", "pattern_b", "Verse 1", 4),
    SongSection("sec_3", "pattern_c", "Chorus", 4),
    SongSection("sec_4", "pattern_d", "Drum Solo", 2),
    SongSection("sec_5", "pattern_c", "Final Chorus", 4),
    SongSection("sec_6", "pattern_e", "Outro", 2),
]