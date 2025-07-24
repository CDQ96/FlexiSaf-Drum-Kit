const soundKits = {
    electronic: {
        Q: { url: "https://s3.amazonaws.com/freecodecamp/drums/Heater-1.mp3", name: "Heater-1" },
        W: { url: "https://s3.amazonaws.com/freecodecamp/drums/Heater-2.mp3", name: "Heater-2" },
        E: { url: "https://s3.amazonaws.com/freecodecamp/drums/Heater-3.mp3", name: "Heater-3" },
        A: { url: "https://s3.amazonaws.com/freecodecamp/drums/Heater-4_1.mp3", name: "Heater-4" },
        S: { url: "https://s3.amazonaws.com/freecodecamp/drums/Heater-6.mp3", name: "Clap" },
        D: { url: "https://s3.amazonaws.com/freecodecamp/drums/Dsc_Oh.mp3", name: "Opened HH" },
        Z: { url: "https://s3.amazonaws.com/freecodecamp/drums/Kick_n_Hat.mp3", name: "Kick n' Hat" },
        X: { url: "https://s3.amazonaws.com/freecodecamp/drums/RP4_KICK_1.mp3", name: "Kick" },
        C: { url: "https://s3.amazonaws.com/freecodecamp/drums/Cev_H2.mp3", name: "Closed HH" }
    },
    acoustic: {
        Q: { url: "https://s3.amazonaws.com/freecodecamp/drums/Chord_1.mp3", name: "Chord 1" },
        W: { url: "https://s3.amazonaws.com/freecodecamp/drums/Chord_2.mp3", name: "Chord 2" }
        // More acoustics can be added later
    }
};

let currentKit = "electronic";
const display = document.getElementById("display");
const drumPadsContainer = document.querySelector(".drum-pads");

// --- OPTIMIZATION START ---

// Object to store pre-loaded Audio objects
const preloadedAudio = {};

// Function to preload all sounds for a given kit
function preloadSounds(kitName) {
    if (!preloadedAudio[kitName]) {
        preloadedAudio[kitName] = {};
    }
    Object.keys(soundKits[kitName]).forEach(key => {
        const sound = soundKits[kitName][key];
        // Create an Audio object if it doesn't exist for this sound
        if (!preloadedAudio[kitName][key]) {
            preloadedAudio[kitName][key] = new Audio(sound.url);
            // Optional: You can add an event listener here to know when the audio is loaded
            // preloadedAudio[kitName][key].addEventListener('canplaythrough', () => {
            //     console.log(`${sound.name} loaded!`);
            // });
        }
    });
}

// Preload all electronic sounds on initial load
preloadSounds("electronic");
// Preload acoustic sounds as well if you expect quick switching
preloadSounds("acoustic");

// --- OPTIMIZATION END ---


// Creating drum pads
function createPads() {
    drumPadsContainer.innerHTML = "";
    Object.keys(soundKits[currentKit]).forEach(key => {
        const pad = document.createElement("button");
        pad.className = "drum-pad";
        pad.id = `pad-${key}`;
        pad.textContent = key;

        pad.addEventListener("click", () => playSound(key));
        drumPadsContainer.appendChild(pad);
    });
}

// Global variables for recording
let isRecording = false;
let recordedSequence = [];
let recordStartTime = null;

// Play sound function
function playSound(key) {
    const sound = soundKits[currentKit][key];
    if (!sound) return;

    // --- OPTIMIZATION START: Use pre-loaded audio object ---
    const audio = preloadedAudio[currentKit][key];
    if (audio) {
        audio.currentTime = 0; // Rewind to start for instant playback
        audio.volume = document.getElementById("volume").value;
        audio.play();
    }
    // --- OPTIMIZATION END ---

    display.textContent = sound.name;

    const pad = document.getElementById(`pad-${key}`);
    if (pad) {
        pad.classList.add("active");
        setTimeout(() => pad.classList.remove("active"), 100);
    }

    if (isRecording && recordStartTime !== null) {
        recordedSequence.push({
            key,
            time: Date.now() - recordStartTime
        });
    }
}

// Volume control
document.getElementById("volume").addEventListener("input", (e) => {
    display.textContent = `Volume: ${Math.round(e.target.value * 100)}%`;
    // OPTIONAL: Update volume for all preloaded sounds instantly
    Object.keys(preloadedAudio[currentKit]).forEach(key => {
        if (preloadedAudio[currentKit][key]) {
            preloadedAudio[currentKit][key].volume = e.target.value;
        }
    });
});


// Keyboard support
document.addEventListener("keydown", (e) => {
    const key = e.key.toUpperCase();
    if (soundKits[currentKit][key]) playSound(key);
});

// Kit Switcher
document.getElementById("kit-selector").addEventListener("change", (e) => {
    currentKit = e.target.value;
    createPads();
    display.textContent = `Kit: ${currentKit}`;
    // Ensure new kit sounds are preloaded when switching
    preloadSounds(currentKit);
});

// Tempo Control
let tempo = 120;
const tempoSlider = document.getElementById("tempo");
const bpmDisplay = document.getElementById("bpm-display");

tempoSlider.addEventListener("input", (e) => {
    tempo = e.target.value;
    bpmDisplay.textContent = tempo;
});

// Record and Playback
const recordBtn = document.getElementById("record-btn");
const playBtn = document.getElementById("play-btn");

recordBtn.addEventListener("click", () => {
    isRecording = !isRecording;
    recordBtn.textContent = isRecording ? "Stop" : "Record";
    if (isRecording) {
        recordedSequence = [];
        recordStartTime = Date.now();
    } else {
        recordStartTime = null;
    }
    display.textContent = isRecording ? "Recording..." : "Ready";
});

playBtn.addEventListener("click", () => {
    if (recordedSequence.length === 0) return;
    display.textContent = "Playing...";

    const bpmFactor = 120 / tempo;

    recordedSequence.forEach(({ key, time }) => {
        setTimeout(() => playSound(key), time * bpmFactor);
    });
});


//Download code
const downloadBtn = document.getElementById("download-btn");

downloadBtn.addEventListener("click", () => {
    if (recordedSequence.length === 0) {
        display.textContent = "Nothing to download.";
        return;
    }

    const sequenceData = {
        kit: currentKit,
        tempo: tempo,
        sequence: recordedSequence
    };

    const blob = new Blob([JSON.stringify(sequenceData, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);

    const a = document.createElement("a");
    a.href = url;
    a.download = `drum-sequence-${Date.now()}.json`;
    a.click();

    URL.revokeObjectURL(url);
    display.textContent = "Download ready.";
});




// attempt to turn the data file into a sound file
const audioContext = new AudioContext();
let recorder;

function startRecording() {
  recorder = new Recorder(audioContext.destination);
  recorder.record();
}

function stopRecording() {
  recorder.stop();
  recorder.exportWAV(blob => {
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "drum-machine.wav";
    a.click();
  });
}



// Initialize
createPads();
