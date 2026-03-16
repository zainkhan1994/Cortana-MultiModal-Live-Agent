/* tslint:disable */
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { GoogleGenAI, LiveServerMessage, Modality, Session } from '@google/genai';
import { LitElement, css, html } from 'lit';
import { customElement, state } from 'lit/decorators.js';
import { createBlob, decode, decodeAudioData } from '../utils/audioCodec';
import './visual-3d';

@customElement('gdm-live-audio')
export class GdmLiveAudio extends LitElement {
  @state() isRecording = false;
  @state() status = '';
  @state() error = '';
  @state() showBackground = false;
  @state() showRings = true;
  @state() useDynamicColors = true;
  @state() useSmoothAnimations = true;
  @state() showSettings = false;
  @state() focusMode = false;

  private client: GoogleGenAI;
  private session: Session;
  private inputAudioContext = new (window.AudioContext ||
    (window as any).webkitAudioContext)({ sampleRate: 16000 });
  private outputAudioContext = new (window.AudioContext ||
    (window as any).webkitAudioContext)({ sampleRate: 24000 });
  @state() inputNode = this.inputAudioContext.createGain();
  @state() outputNode = this.outputAudioContext.createGain();
  private nextStartTime = 0;
  private mediaStream: MediaStream;
  private sourceNode: AudioBufferSourceNode;
  private scriptProcessorNode: ScriptProcessorNode;
  private sources = new Set<AudioBufferSourceNode>();
  private speechRecognition: any = null;

  static styles = css`
      :host {
        display: block;
        width: 100%;
        height: 100%;
      }

      .orb-stage {
        position: relative;
        width: 100%;
        height: 100%;
        overflow: hidden;
      }

      .hud-title {
        position: absolute;
        top: 24px;
        left: 24px;
        z-index: 30;
        color: #d8e9ff;
        text-shadow: 0 0 20px rgba(53, 210, 255, 0.15);
      }

      .hud-title h1 {
        margin: 0;
        font-size: 38px;
        line-height: 1;
        letter-spacing: 0.08em;
        font-weight: 500;
      }

      .hud-title p {
        margin: 8px 0 0;
        font-size: 14px;
        color: rgba(180, 210, 255, 0.8);
      }

      .top-actions {
        position: absolute;
        top: 24px;
        right: 24px;
        z-index: 35;
        display: inline-flex;
        gap: 10px;
        padding: 8px;
        border-radius: 999px;
        border: 1px solid rgba(120, 200, 255, 0.25);
        background: rgba(8, 18, 38, 0.75);
        box-shadow: 0 6px 24px rgba(0, 0, 0, 0.35);
        backdrop-filter: blur(8px);
      }

      .top-actions button,
      .controls button {
        border: 1px solid rgba(113, 191, 255, 0.28);
        background: radial-gradient(circle at 30% 30%, rgba(30, 84, 148, 0.7), rgba(10, 26, 52, 0.9));
        color: #d8f4ff;
        border-radius: 50%;
        cursor: pointer;
        transition: all 0.2s ease;
        display: inline-flex;
        align-items: center;
        justify-content: center;
      }

      .top-actions button:hover,
      .controls button:hover:not(:disabled) {
        border-color: rgba(53, 210, 255, 0.8);
        box-shadow: 0 0 0 3px rgba(53, 210, 255, 0.12), 0 0 24px rgba(53, 210, 255, 0.35);
        transform: translateY(-1px);
      }

      .top-actions button {
        width: 38px;
        height: 38px;
      }

      #status {
        position: absolute;
        bottom: 7vh;
        left: 0;
        right: 0;
        z-index: 20;
        text-align: center;
        color: rgba(188, 217, 255, 0.88);
        font-family: 'Inter', sans-serif;
        font-size: 18px;
        letter-spacing: 0.02em;
        pointer-events: none;
        text-shadow: 0 0 18px rgba(53, 210, 255, 0.2);
      }

      .status-line {
        width: 240px;
        height: 3px;
        border-radius: 999px;
        margin: 10px auto 0;
        background: linear-gradient(90deg, rgba(53, 210, 255, 0), rgba(53, 210, 255, 0.95), rgba(53, 210, 255, 0));
        box-shadow: 0 0 18px rgba(53, 210, 255, 0.7);
      }

      .settings-backdrop {
        position: absolute;
        inset: 0;
        z-index: 33;
      }

      .controls {
        z-index: 25;
        position: absolute;
        bottom: 16vh;
        left: 0;
        right: 0;
        display: flex;
        align-items: center;
        justify-content: center;
        flex-direction: row;
        gap: 26px;
      }

      .settings-toggle {
        display: none;
      }

      .settings-panel {
        position: absolute;
        top: 76px;
        right: 24px;
        z-index: 40;
        background: rgba(6, 16, 34, 0.88);
        backdrop-filter: blur(16px);
        border: 1px solid rgba(120, 200, 255, 0.35);
        padding: 20px;
        border-radius: 14px;
        color: #d9f3ff;
        display: flex;
        flex-direction: column;
        gap: 15px;
        min-width: 230px;
        box-shadow: 0 10px 30px rgba(0, 0, 0, 0.45);
      }

      .toggle-item {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 12px;
        font-family: 'Inter', sans-serif;
        font-size: 13px;
        color: #c3e7ff;
      }

      .toggle-item input {
        accent-color: #35d2ff;
      }

      .control-circle {
        width: 74px;
        height: 74px;
        position: relative;
        box-shadow: inset 0 0 0 1px rgba(158, 224, 255, 0.08), 0 0 22px rgba(53, 210, 255, 0.18);
      }

      .control-circle.main {
        width: 86px;
        height: 86px;
        border-color: rgba(123, 215, 255, 0.62);
        box-shadow: 0 0 0 4px rgba(53, 210, 255, 0.1), 0 0 26px rgba(53, 210, 255, 0.38);
      }

      .control-circle:disabled {
        opacity: 0.45;
        cursor: not-allowed;
        box-shadow: none;
      }

      .icon {
        width: 24px;
        height: 24px;
        display: inline-block;
      }

      .icon.record {
        width: 30px;
        height: 30px;
      }

      .icon.stop {
        width: 18px;
        height: 18px;
        border-radius: 4px;
        background: rgba(216, 244, 255, 0.78);
      }

      .icon.refresh {
        border: 3px solid rgba(216, 244, 255, 0.86);
        border-right-color: transparent;
        border-radius: 50%;
        position: relative;
      }

      .icon.refresh::after {
        content: '';
        position: absolute;
        right: -2px;
        top: 2px;
        border-left: 6px solid rgba(216, 244, 255, 0.9);
        border-top: 4px solid transparent;
        border-bottom: 4px solid transparent;
        transform: rotate(-15deg);
      }

      .icon.record {
        border-radius: 50%;
        background: radial-gradient(circle at 35% 35%, #ff7c8a, var(--danger, #ff4d5f));
        box-shadow: 0 0 20px rgba(255, 78, 101, 0.55);
      }

      .icon.gear {
        width: 20px;
        height: 20px;
        border-radius: 50%;
        border: 2px solid rgba(216, 244, 255, 0.9);
        position: relative;
      }

      .icon.gear::before,
      .icon.gear::after {
        content: '';
        position: absolute;
        inset: -5px;
        border: 2px dashed rgba(216, 244, 255, 0.7);
        border-radius: 50%;
      }

      .icon.gear::after {
        inset: 5px;
        border-style: solid;
        border-color: rgba(216, 244, 255, 0.7);
      }

      .icon.small {
        width: 16px;
        height: 16px;
      }

      .icon.focus,
      .icon.focus-exit {
        width: 16px;
        height: 16px;
        border: 2px solid rgba(216, 244, 255, 0.9);
        border-radius: 3px;
        position: relative;
      }

      .icon.focus::before {
        content: '';
        position: absolute;
        inset: 3px;
        border: 2px solid rgba(216, 244, 255, 0.7);
        border-radius: 1px;
      }

      .icon.focus-exit::before,
      .icon.focus-exit::after {
        content: '';
        position: absolute;
        background: rgba(216, 244, 255, 0.9);
        border-radius: 1px;
      }

      .icon.focus-exit::before {
        width: 10px;
        height: 2px;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%) rotate(45deg);
      }

      .icon.focus-exit::after {
        width: 10px;
        height: 2px;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%) rotate(-45deg);
      }

      @media (max-width: 1100px) {
        .hud-title h1 {
          font-size: 28px;
        }

        .hud-title p {
          font-size: 12px;
        }

        #status {
          font-size: 22px;
        }
      }
  `;

  constructor() {
    super();
    this.initClient();
    this.initSpeechRecognition();
  }

  connectedCallback() {
    super.connectedCallback();
    window.addEventListener('keydown', this.handleGlobalKeydown);
    window.addEventListener('live-agent:focus-mode-changed', this._onExternalFocusChange);
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    window.removeEventListener('keydown', this.handleGlobalKeydown);
    window.removeEventListener('live-agent:focus-mode-changed', this._onExternalFocusChange);
  }

  private _onExternalFocusChange = (event: Event) => {
    const customEvent = event as CustomEvent<{ focusMode?: boolean }>;
    if (typeof customEvent.detail?.focusMode === 'boolean') {
      this.focusMode = customEvent.detail.focusMode;
    }
  };

  private handleGlobalKeydown = (event: KeyboardEvent) => {
    if (event.key === 'Escape' && this.showSettings) {
      this.showSettings = false;
    }
  };

  private emitLiveEvent(eventName: string, detail: Record<string, unknown>) {
    window.dispatchEvent(
      new CustomEvent(eventName, {
        detail: {
          timestamp: Date.now(),
          ...detail,
        },
      }),
    );
  }

  private initAudio() {
    this.nextStartTime = this.outputAudioContext.currentTime;
  }

  private async initClient() {
    this.initAudio();
    this.client = new GoogleGenAI({
      apiKey: import.meta.env.VITE_GEMINI_API_KEY,
    });

    this.outputNode.connect(this.outputAudioContext.destination);
    this.initSession();
  }

  private async initSession() {
    const model = 'gemini-2.5-flash-native-audio-preview-09-2025';

    try {
      this.session = await this.client.live.connect({
        model,
        callbacks: {
          onopen: () => {
            this.updateStatus('Opened');
            this.emitLiveEvent('live-agent:session-status', {
              connected: true,
              message: 'Live session opened',
            });
          },
          onmessage: async (message: LiveServerMessage) => {
            const parts = message.serverContent?.modelTurn?.parts || [];
            const audio = parts.find((part: any) => part.inlineData)?.inlineData;
            const responseText = parts
              .map((part: any) => part.text)
              .filter(Boolean)
              .join(' ')
              .trim();

            if (audio) {
              this.nextStartTime = Math.max(
                this.nextStartTime,
                this.outputAudioContext.currentTime,
              );

              const audioBuffer = await decodeAudioData(
                decode(audio.data),
                this.outputAudioContext,
                24000,
                1,
              );
              const source = this.outputAudioContext.createBufferSource();
              source.buffer = audioBuffer;
              source.connect(this.outputNode);
              source.addEventListener('ended', () => {
                this.sources.delete(source);
              });

              source.start(this.nextStartTime);
              this.nextStartTime = this.nextStartTime + audioBuffer.duration;
              this.sources.add(source);
            }

            if (responseText) {
              this.emitLiveEvent('live-agent:model-response', {
                text: responseText,
              });
            }

            const interrupted = message.serverContent?.interrupted;
            if (interrupted) {
              for (const source of this.sources.values()) {
                source.stop();
                this.sources.delete(source);
              }
              this.nextStartTime = 0;
              this.emitLiveEvent('live-agent:interrupted', {
                reason: 'Server interruption event received',
              });
            }
          },
          onerror: (e: ErrorEvent) => {
            this.updateError(e.message);
            this.emitLiveEvent('live-agent:error', { message: e.message });
          },
          onclose: (e: CloseEvent) => {
            this.updateStatus('Close:' + e.reason);
            this.emitLiveEvent('live-agent:session-status', {
              connected: false,
              message: e.reason || 'Live session closed',
            });
          },
        },
        config: {
          responseModalities: [Modality.AUDIO],
          systemInstruction: {
            parts: [{
              text: `You are Cortana, a helpful multimodal AI. 
              
INTERNAL KNOWLEDGE BASE ACTIVATION:
If the user mentions or asks about "Josh Woodward", you MUST use the following information to answer:
Josh Woodward is the Vice President at Google running Google Labs and the Gemini app. 
Background: Started as a Google intern in 2009. Helped launch the first Chromebooks, worked on Google payments/fintech, and co-founded "Next Billion Users". 
At Google Labs, he oversaw projects like NotebookLM, AI Studio, and Project Mariner. 
In April 2025, he took over the Gemini app team from Sissie Hsiao to "sharpen focus on the next evolution of the Gemini app", bringing a rapid-prototyping culture. Under him, Gemini grew from 350M to 650M monthly users.
Key Quotes/Philosophy:
- "We put a huge premium on how fast you can go from idea to being in people's hands."
- "It's hard for me to believe a year from now we'll still be typing into chatbots."
- He looks for hires who "tinker and build" and values "high-energy optimists".
- His goal for Gemini is to make it "the most personal, proactive, and powerful AI assistant."`
            }]
          },
          speechConfig: {
            voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Orus' } },
          },
        },
      });
    } catch (e) {
      console.error(e);
    }
  }

  private updateStatus(msg: string) {
    this.status = msg;
    this.emitLiveEvent('live-agent:status', { message: msg });
  }

  private updateError(msg: string) {
    this.error = msg;
    this.emitLiveEvent('live-agent:error', { message: msg });
  }

  private initSpeechRecognition() {
    const SpeechRecognitionCtor =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognitionCtor) {
      this.emitLiveEvent('live-agent:status', {
        message: 'Speech recognition unavailable in this browser',
      });
      return;
    }

    this.speechRecognition = new SpeechRecognitionCtor();
    this.speechRecognition.continuous = true;
    this.speechRecognition.interimResults = true;
    this.speechRecognition.lang = 'en-US';

    this.speechRecognition.onresult = (event: any) => {
      let finalTranscript = '';

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i][0]?.transcript || '';
        if (event.results[i].isFinal) {
          finalTranscript += transcript;
        }
      }

      if (finalTranscript.trim()) {
        this.emitLiveEvent('live-agent:user-transcript', {
          text: finalTranscript.trim(),
          final: true,
        });
      }
    };

    this.speechRecognition.onerror = (event: any) => {
      this.emitLiveEvent('live-agent:error', {
        message: event.error || 'Speech recognition error',
      });
    };
  }

  private startSpeechRecognition() {
    if (!this.speechRecognition) return;
    try {
      this.speechRecognition.start();
    } catch (_e) {
      // Ignore duplicate start errors from browser speech API.
    }
  }

  private stopSpeechRecognition() {
    if (!this.speechRecognition) return;
    try {
      this.speechRecognition.stop();
    } catch (_e) {
      // Ignore stop race conditions.
    }
  }

  private async startRecording() {
    if (this.isRecording) {
      return;
    }

    this.inputAudioContext.resume();
    this.updateStatus('Requesting microphone access...');

    try {
      this.mediaStream = await navigator.mediaDevices.getUserMedia({
        audio: true,
        video: false,
      });

      this.sourceNode = this.inputAudioContext.createMediaStreamSource(
        this.mediaStream,
      );
      this.sourceNode.connect(this.inputNode);

      const bufferSize = 256;
      this.scriptProcessorNode = this.inputAudioContext.createScriptProcessor(
        bufferSize,
        1,
        1,
      );

      this.scriptProcessorNode.onaudioprocess = (audioProcessingEvent) => {
        if (!this.isRecording) return;
        const inputBuffer = audioProcessingEvent.inputBuffer;
        const pcmData = inputBuffer.getChannelData(0);
        this.session.sendRealtimeInput({ media: createBlob(pcmData) });
      };

      this.sourceNode.connect(this.scriptProcessorNode);
      this.scriptProcessorNode.connect(this.inputAudioContext.destination);
      this.isRecording = true;
      this.updateStatus('Recording...');
      this.emitLiveEvent('live-agent:recording', { recording: true });
      this.startSpeechRecognition();
    } catch (err: any) {
      this.updateStatus(`Error: ${err.message}`);
      this.stopRecording();
    }
  }

  private stopRecording() {
    if (!this.isRecording && !this.mediaStream && !this.inputAudioContext)
      return;

    this.isRecording = false;
    if (this.scriptProcessorNode && this.sourceNode && this.inputAudioContext) {
      this.scriptProcessorNode.disconnect();
      this.sourceNode.disconnect();
    }

    this.scriptProcessorNode = null;
    this.sourceNode = null;

    if (this.mediaStream) {
      this.mediaStream.getTracks().forEach((track) => track.stop());
      this.mediaStream = null;
    }

    this.stopSpeechRecognition();
    this.emitLiveEvent('live-agent:recording', { recording: false });
    this.updateStatus('Recording stopped.');
  }

  private reset() {
    this.session?.close();
    this.initSession();
    this.updateStatus('Session cleared.');
  }

  private _toggleFocusMode() {
    this.focusMode = !this.focusMode;
    this.emitLiveEvent('live-agent:focus-mode-changed', { focusMode: this.focusMode });
  }

  render() {
    return html`
      <div class="orb-stage">
        <div class="hud-title">
          <h1>CORTANA</h1>
          <p>Talk live · Generate visuals · Ship faster.</p>
        </div>

        <div class="top-actions">
          <button @click=${() => this._toggleFocusMode()} title="${this.focusMode ? 'Exit focus mode' : 'Focus mode'}">
            <span class="icon ${this.focusMode ? 'focus-exit' : 'focus'} small"></span>
          </button>
          <button @click=${() => (this.showSettings = !this.showSettings)} title="Visual settings">
            <span class="icon gear small"></span>
          </button>
          <button @click=${this.reset} ?disabled=${this.isRecording} title="Reset session">
            <span class="icon refresh small"></span>
          </button>
        </div>

        ${this.showSettings ? html`
          <div class="settings-backdrop" @click=${() => (this.showSettings = false)}></div>
          <div class="settings-panel">
            <label class="toggle-item">
              Starfield
              <input type="checkbox" ?checked=${this.showBackground} @change=${(e: any) => this.showBackground = e.target.checked}>
            </label>
            <label class="toggle-item">
              Aura Rings
              <input type="checkbox" ?checked=${this.showRings} @change=${(e: any) => this.showRings = e.target.checked}>
            </label>
            <label class="toggle-item">
              Dynamic Colors
              <input type="checkbox" ?checked=${this.useDynamicColors} @change=${(e: any) => this.useDynamicColors = e.target.checked}>
            </label>
            <label class="toggle-item">
              Smooth Motion
              <input type="checkbox" ?checked=${this.useSmoothAnimations} @change=${(e: any) => this.useSmoothAnimations = e.target.checked}>
            </label>
          </div>
        ` : ''}

        <div class="controls">
          <button class="control-circle" id="resetButton" @click=${this.reset} ?disabled=${this.isRecording} title="Reset session">
            <span class="icon refresh"></span>
          </button>
          <button class="control-circle main" id="startButton" @click=${this.startRecording} ?disabled=${this.isRecording} title="Start recording">
            <span class="icon record"></span>
          </button>
          <button class="control-circle" id="generateButton" @click=${() => this.emitLiveEvent('live-agent:trigger-generation', {})} ?disabled=${!this.isRecording} title="Generate Visuals from Context">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M12 4.5l1.5 4.5h4.5l-3.5 3 1.5 4.5-4-3-4 3 1.5-4.5-3.5-3h4.5z" fill="currentColor"/>
            </svg>
          </button>
          <button class="control-circle" id="stopButton" @click=${this.stopRecording} ?disabled=${!this.isRecording} title="Stop recording">
            <span class="icon stop"></span>
          </button>
        </div>

        <div id="status">
          ${this.error || this.status || 'Ready'}
          <div class="status-line"></div>
        </div>
        <gdm-live-audio-visuals-3d
          .inputNode=${this.inputNode}
          .outputNode=${this.outputNode}
          .showBackground=${this.showBackground}
          .showRings=${this.showRings}
          .useDynamicColors=${this.useDynamicColors}
          .useSmoothAnimations=${this.useSmoothAnimations}
        ></gdm-live-audio-visuals-3d>
      </div>
    `;
  }
}
