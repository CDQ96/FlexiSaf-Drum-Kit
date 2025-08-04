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
let recordingInterval = null;

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
            time: Date.now() - recordStartTime,
            soundUrl: sound.url,
            soundName: sound.name
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
    if (!isRecording) {
        // Start recording button clicks
        isRecording = true;
        recordStartTime = Date.now();
        recordedSequence = [];
        recordBtn.textContent = "Stop";
        recordBtn.classList.add("recording");
        display.textContent = "Recording... 0s";
        
        // Update recording duration
        recordingInterval = setInterval(() => {
            const duration = Math.floor((Date.now() - recordStartTime) / 1000);
            display.textContent = `Recording... ${duration}s`;
        }, 1000);
        
    } else {
        // Stop recording
        isRecording = false;
        recordStartTime = null;
        recordBtn.textContent = "Record";
        recordBtn.classList.remove("recording");
        
        // Clear recording interval
        if (recordingInterval) {
            clearInterval(recordingInterval);
            recordingInterval = null;
        }
        
        display.textContent = `Recording stopped. ${recordedSequence.length} sounds recorded.`;
        
        // Enable download button if we have recorded sounds
        if (recordedSequence.length > 0) {
            downloadBtn.disabled = false;
            downloadBtn.style.opacity = "1";
        }
    }
});

playBtn.addEventListener("click", () => {
    if (recordedSequence.length === 0) {
        display.textContent = "Nothing to play.";
        return;
    }
    display.textContent = "Playing...";

    const bpmFactor = 120 / tempo;

    recordedSequence.forEach(({ key, time }) => {
        setTimeout(() => playSound(key), time * bpmFactor);
    });
});

// Download functionality - generates drum sounds using Web Audio API
const downloadBtn = document.getElementById("download-btn");

downloadBtn.addEventListener("click", async () => {
    if (recordedSequence.length === 0) {
        display.textContent = "No sounds recorded to download.";
        return;
    }

    // Show progress bar
    const progressContainer = document.getElementById("progress-container");
    const progressBar = document.getElementById("progress-bar");
    const progressText = document.getElementById("progress-text");
    
    progressContainer.style.display = "block";
    progressBar.style.width = "0%";
    progressText.textContent = "Initializing...";
    
    try {
        // Create audio context for generating sounds
        const audioContext = new (window.AudioContext || window.webkitAudioContext)();
        
        // Get the total duration of the recording
        const totalDuration = recordedSequence[recordedSequence.length - 1].time + 2000; // Add 2 seconds padding
        
        // Create a buffer for the combined audio
        const combinedBuffer = audioContext.createBuffer(2, audioContext.sampleRate * (totalDuration / 1000), audioContext.sampleRate);
        
        // Process each recorded sound
        for (let i = 0; i < recordedSequence.length; i++) {
            const sound = recordedSequence[i];
            
            try {
                // Update progress
                const progress = ((i + 1) / recordedSequence.length) * 100;
                progressBar.style.width = progress + "%";
                progressText.textContent = `Processing sound ${i + 1}/${recordedSequence.length}: ${sound.soundName}`;
                
                // Generate drum sound based on the sound name
                const audioBuffer = generateDrumSound(audioContext, sound.soundName);
                
                
                // Calculate the start time in samples
                const startSample = Math.floor((sound.time / 1000) * audioContext.sampleRate);
                
                // Copy the audio data to the combined buffer
                for (let channel = 0; channel < audioBuffer.numberOfChannels; channel++) {
                    const channelData = audioBuffer.getChannelData(channel);
                    const combinedChannelData = combinedBuffer.getChannelData(channel);
                    
                    for (let sample = 0; sample < channelData.length; sample++) {
                        const targetSample = startSample + sample;
                        if (targetSample < combinedChannelData.length) {
                            // Mix the audio (add to existing)
                            combinedChannelData[targetSample] += channelData[sample] * 0.7; // Reduce volume to prevent clipping
                        }
                    }
                }
                
            } catch (error) {
                console.error(`Error processing sound ${sound.soundName}:`, error);
            }
        }
        
        // Update progress for final steps
        progressText.textContent = "Finalizing audio file...";
        progressBar.style.width = "95%";
        
        // Convert the combined buffer to a blob
        const offlineContext = new OfflineAudioContext(2, combinedBuffer.length, audioContext.sampleRate);
        const source = offlineContext.createBufferSource();
        source.buffer = combinedBuffer;
        source.connect(offlineContext.destination);
        source.start();
        
        const renderedBuffer = await offlineContext.startRendering();
        
        // Convert to WAV format
        const wavBlob = audioBufferToWav(renderedBuffer);
        
        // Update progress
        progressBar.style.width = "100%";
        progressText.textContent = "Downloading...";
        
        // Create download link
        const url = URL.createObjectURL(wavBlob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `drum-recording-${Date.now()}.wav`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        
        URL.revokeObjectURL(url);
        
        // Hide progress bar and show success message
        progressContainer.style.display = "none";
        display.textContent = "Audio file downloaded successfully!";
        
    } catch (error) {
        console.error("Error creating audio file:", error);
        progressContainer.style.display = "none";
        display.textContent = "Error creating audio file. Please try again.";
    }
});

// Function to generate drum sounds using Web Audio API
function generateDrumSound(audioContext, soundName) {
    const sampleRate = audioContext.sampleRate;
    const duration = 0.5; // 500ms duration
    const bufferLength = Math.floor(sampleRate * duration);
    const buffer = audioContext.createBuffer(2, bufferLength, sampleRate);
    
    // Generate different sounds based on the exact sound name
    if (soundName === "Kick") {
        // Kick drum - low frequency sine wave with decay
        for (let channel = 0; channel < 2; channel++) {
            const channelData = buffer.getChannelData(channel);
            for (let i = 0; i < bufferLength; i++) {
                const time = i / sampleRate;
                const frequency = 60 * Math.exp(-time * 10); // Frequency decay
                const amplitude = Math.exp(-time * 8); // Amplitude decay
                channelData[i] = Math.sin(2 * Math.PI * frequency * time) * amplitude * 0.8;
            }
        }
    } else if (soundName === "Kick n' Hat") {
        // Kick with hi-hat overlay
        for (let channel = 0; channel < 2; channel++) {
            const channelData = buffer.getChannelData(channel);
            for (let i = 0; i < bufferLength; i++) {
                const time = i / sampleRate;
                const kickFreq = 60 * Math.exp(-time * 10);
                const kickAmp = Math.exp(-time * 8);
                const kick = Math.sin(2 * Math.PI * kickFreq * time) * kickAmp * 0.6;
                
                const hatAmp = Math.exp(-time * 25);
                const hat = (Math.random() * 2 - 1) * hatAmp * 0.3;
                
                channelData[i] = kick + hat;
            }
        }
    } else if (soundName === "Clap") {
        // Clap - noise with envelope
        for (let channel = 0; channel < 2; channel++) {
            const channelData = buffer.getChannelData(channel);
            for (let i = 0; i < bufferLength; i++) {
                const time = i / sampleRate;
                const amplitude = Math.exp(-time * 15); // Fast decay
                channelData[i] = (Math.random() * 2 - 1) * amplitude * 0.6;
            }
        }
    } else if (soundName === "Opened HH") {
        // Opened hi-hat - longer decay, more metallic
        for (let channel = 0; channel < 2; channel++) {
            const channelData = buffer.getChannelData(channel);
            for (let i = 0; i < bufferLength; i++) {
                const time = i / sampleRate;
                const amplitude = Math.exp(-time * 8); // Slower decay for opened
                const noise = (Math.random() * 2 - 1) * 0.4;
                const highPass = Math.sin(2 * Math.PI * 6000 * time) * 0.2;
                const ring = Math.sin(2 * Math.PI * 1200 * time) * 0.1;
                channelData[i] = (noise + highPass + ring) * amplitude * 0.5;
            }
        }
    } else if (soundName === "Closed HH") {
        // Closed hi-hat - short, sharp decay
        for (let channel = 0; channel < 2; channel++) {
            const channelData = buffer.getChannelData(channel);
            for (let i = 0; i < bufferLength; i++) {
                const time = i / sampleRate;
                const amplitude = Math.exp(-time * 25); // Very fast decay
                const noise = (Math.random() * 2 - 1) * 0.5;
                const highPass = Math.sin(2 * Math.PI * 8000 * time) * 0.3;
                channelData[i] = (noise + highPass) * amplitude * 0.4;
            }
        }
    } else if (soundName === "Heater-1") {
        // Heater-1 - mid-range drum sound
        for (let channel = 0; channel < 2; channel++) {
            const channelData = buffer.getChannelData(channel);
            for (let i = 0; i < bufferLength; i++) {
                const time = i / sampleRate;
                const frequency = 180;
                const amplitude = Math.exp(-time * 12);
                const wave = Math.sin(2 * Math.PI * frequency * time);
                const noise = (Math.random() * 2 - 1) * 0.2;
                channelData[i] = (wave + noise) * amplitude * 0.6;
            }
        }
    } else if (soundName === "Heater-2") {
        // Heater-2 - different mid-range drum sound
        for (let channel = 0; channel < 2; channel++) {
            const channelData = buffer.getChannelData(channel);
            for (let i = 0; i < bufferLength; i++) {
                const time = i / sampleRate;
                const frequency = 220;
                const amplitude = Math.exp(-time * 10);
                const wave = Math.sin(2 * Math.PI * frequency * time);
                const noise = (Math.random() * 2 - 1) * 0.3;
                channelData[i] = (wave + noise) * amplitude * 0.5;
            }
        }
    } else if (soundName === "Heater-3") {
        // Heater-3 - higher frequency drum sound
        for (let channel = 0; channel < 2; channel++) {
            const channelData = buffer.getChannelData(channel);
            for (let i = 0; i < bufferLength; i++) {
                const time = i / sampleRate;
                const frequency = 260;
                const amplitude = Math.exp(-time * 14);
                const wave = Math.sin(2 * Math.PI * frequency * time);
                const noise = (Math.random() * 2 - 1) * 0.25;
                channelData[i] = (wave + noise) * amplitude * 0.55;
            }
        }
    } else if (soundName === "Heater-4") {
        // Heater-4 - bass-heavy drum sound
        for (let channel = 0; channel < 2; channel++) {
            const channelData = buffer.getChannelData(channel);
            for (let i = 0; i < bufferLength; i++) {
                const time = i / sampleRate;
                const frequency = 120;
                const amplitude = Math.exp(-time * 9);
                const wave = Math.sin(2 * Math.PI * frequency * time);
                const noise = (Math.random() * 2 - 1) * 0.15;
                channelData[i] = (wave + noise) * amplitude * 0.7;
            }
        }
    } else if (soundName === "Chord 1") {
        // Chord 1 - major chord
        for (let channel = 0; channel < 2; channel++) {
            const channelData = buffer.getChannelData(channel);
            for (let i = 0; i < bufferLength; i++) {
                const time = i / sampleRate;
                const amplitude = Math.exp(-time * 6);
                const chord = Math.sin(2 * Math.PI * 300 * time) + 
                             Math.sin(2 * Math.PI * 375 * time) + 
                             Math.sin(2 * Math.PI * 450 * time);
                channelData[i] = (chord / 3) * amplitude * 0.6;
            }
        }
    } else if (soundName === "Chord 2") {
        // Chord 2 - minor chord
        for (let channel = 0; channel < 2; channel++) {
            const channelData = buffer.getChannelData(channel);
            for (let i = 0; i < bufferLength; i++) {
                const time = i / sampleRate;
                const amplitude = Math.exp(-time * 7);
                const chord = Math.sin(2 * Math.PI * 350 * time) + 
                             Math.sin(2 * Math.PI * 420 * time) + 
                             Math.sin(2 * Math.PI * 525 * time);
                channelData[i] = (chord / 3) * amplitude * 0.55;
            }
        }
    } else {
        // Default sound - simple sine wave for any unmatched sounds
        for (let channel = 0; channel < 2; channel++) {
            const channelData = buffer.getChannelData(channel);
            for (let i = 0; i < bufferLength; i++) {
                const time = i / sampleRate;
                const frequency = 300;
                const amplitude = Math.exp(-time * 10);
                channelData[i] = Math.sin(2 * Math.PI * frequency * time) * amplitude * 0.5;
            }
        }
    }
    
    return buffer;
}

// Helper function to convert AudioBuffer to WAV format
function audioBufferToWav(buffer) {
    const length = buffer.length;
    const numberOfChannels = buffer.numberOfChannels;
    const sampleRate = buffer.sampleRate;
    const arrayBuffer = new ArrayBuffer(44 + length * numberOfChannels * 2);
    const view = new DataView(arrayBuffer);
    
    // WAV header
    const writeString = (offset, string) => {
        for (let i = 0; i < string.length; i++) {
            view.setUint8(offset + i, string.charCodeAt(i));
        }
    };
    
    writeString(0, 'RIFF');
    view.setUint32(4, 36 + length * numberOfChannels * 2, true);
    writeString(8, 'WAVE');
    writeString(12, 'fmt ');
    view.setUint32(16, 16, true);
    view.setUint16(20, 1, true);
    view.setUint16(22, numberOfChannels, true);
    view.setUint32(24, sampleRate, true);
    view.setUint32(28, sampleRate * numberOfChannels * 2, true);
    view.setUint16(32, numberOfChannels * 2, true);
    view.setUint16(34, 16, true);
    writeString(36, 'data');
    view.setUint32(40, length * numberOfChannels * 2, true);
    
    // Convert audio data
    let offset = 44;
    for (let i = 0; i < length; i++) {
        for (let channel = 0; channel < numberOfChannels; channel++) {
            const sample = Math.max(-1, Math.min(1, buffer.getChannelData(channel)[i]));
            view.setInt16(offset, sample < 0 ? sample * 0x8000 : sample * 0x7FFF, true);
            offset += 2;
        }
    }
    
    return new Blob([arrayBuffer], { type: 'audio/wav' });
}

// Initialize
createPads();

// Initialize download button as disabled
downloadBtn.disabled = true;
downloadBtn.style.opacity = "0.5";

// Add favicon to prevent 404 error
const favicon = document.createElement('link');
favicon.rel = 'icon';
favicon.type = 'image/x-icon';
favicon.href = 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><text y=".9em" font-size="90">🥁</text></svg>';
document.head.appendChild(favicon);
