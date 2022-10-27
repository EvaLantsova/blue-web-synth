import * as Tone from 'tone'
import React, { PureComponent } from 'react'

import WelcomeScreen from '../views/WelcomeScreen'
import SynthRoom from '../views/SynthRoom'

export default class SynthContainer extends PureComponent {
  constructor(props) {
    super(props)

    this.state = {
      webAudioStarted: false,
      instruments: []
    }
  }

  startWebAudio = async () => {
    await Tone.start()
    this.initInstruments()

    this.setState({
      webAudioStarted: true
    })
  }

  generateUniqId = () => {
    return Math.floor(Math.random() * Date.now())
  }

  initInstruments = () => {
    const melodySynthSettings = {
      volume: 0.8,
      detune: 0,
      portamento: 0.05,
      envelope: {
        attack: 0.05,
        attackCurve: 'exponential',
        decay: 0.2,
        decayCurve: 'exponential',
        sustain: 0.2,
        release: 1.5,
        releaseCurve: 'exponential'
      },
      oscillator: {
        type: 'amtriangle',
        modulationType: 'sine',
        // partialCount: 0,
        // partials: [],
        phase: 0,
        harmonicity: 0.5
      }
    }

    const melodySynthChorusSettings = {
      wet: 0.6,
      type: 'sine',
      frequency: 1.5,
      delayTime: 3.5,
      depth: 0.7,
      spread: 180
    }

    const melodySynthChannelSettings = {
      pan: 0,
      volume: 0,
      mute: false,
      solo: false
    }

    const melodySynthNode = new Tone.Synth(melodySynthSettings)

    const melodySynthChorusNode = new Tone.Chorus(
      melodySynthChorusSettings
    ).start()

    const melodySynthChannelNode = new Tone.Channel(
      melodySynthChannelSettings
    ).toDestination()

    melodySynthNode.chain(melodySynthChorusNode, melodySynthChannelNode)

    const instruments = [
      {
        id: this.generateUniqId(),
        name: 'Melody Synth',
        type: 'ToneSynth',
        node: melodySynthNode,
        settings: melodySynthSettings
      },
      {
        id: this.generateUniqId(),
        name: 'Chorus',
        type: 'Chorus',
        node: melodySynthChorusNode,
        settings: melodySynthChorusSettings
      },
      {
        id: this.generateUniqId(),
        name: 'Channel',
        type: 'Channel',
        node: melodySynthChannelNode,
        settings: melodySynthChannelSettings
      }
    ]

    // prettier-ignore
    const seq = new Tone.Sequence(
      (time, note) => {
        melodySynthNode.triggerAttackRelease(note, 0.8, time)
      },
      [
        'C4', 'E4', 'G4', 'C4', 'E4', 'G4', 'C4', 'E4', 'G4', 'C4', 'E4', 'G4',
        'E4', 'G4', 'B3', 'E4', 'G4', 'B3', 'E4', 'G4', 'B3', 'E4', 'G4', 'B3'
      ]
    ).start(0)

    Tone.Transport.start()

    this.setState({
      instruments
    })
  }

  componentDidMount() {
    input.current = new Gain();

    shaper.current = new WaveShaper(x => {
      const alpha = 1;
      return Math.sin(Math.pow(2, 3.2 * alpha) * Math.sin(x * (Math.PI / 2)));
    });

    crossFadeFold.current = new CrossFade(0);

    // Connect input -> shaper
    input.current.fan(shaper.current);

    // Connect input, shaper -> crossfader
    input.current.connect(crossFadeFold.current, 0, 0);
    shaper.current.connect(crossFadeFold.current, 0, 1);

    // Setup Reverb
    reverbNode.current = new Freeverb();

    // Connect input -> reverb
    crossFadeFold.current.connect(reverbNode.current);

    registerInput(input.current);
    registerOutput(reverbNode.current);

    let midi = { midiInput: inputs[0], midiOutput: outputs[0] };

    const modulation = { lfoRef: lfoRef };
    const playState = { playing: playing, onChange: setPlaying };

    Tone.connect(oscillator1Ref, envelopeRef);
    Tone.connect(oscillator2Ref, envelopeRef);
    Tone.connect(noiseRef, envelopeRef);
    Tone.connect(envelopeRef, filterRef);
    Tone.connect(filterRef, effectsInputRef);
    Tone.connect(effectsOutputRef, Tone.Master);
  }

  handlePropertyValueChange = (id, property, value) => {
    // Звук лагает при изменении параметров
    // const { instruments } = this.state
    //
    // instruments.forEach((instrument, i) => {
    //   if (instrument.id === id) {
    //     const propertyLevel1 = property[0]
    //     instrument.settings[propertyLevel1] = value
    //   }
    //
    //   instruments.push(instrument)
    // })

    // Иммутабельный способ, звук не лагает
    const instruments = []

    this.state.instruments.forEach((instrument, i) => {
      const newInstrument = Object.assign({}, instrument)

      if (instrument.id === id) {
        if (property.length === 1) {
          const propertyName = property[0]
          newInstrument.settings[propertyName] = value
        } else if (property.length === 2) {
          const scopeName = property[0]
          const propertyName = property[1]
          newInstrument.settings[scopeName][propertyName] = value
        }
      }

      instruments.push(newInstrument)
    })

    this.setState({
      instruments
    })
  }

  renderWelcomeScreen = () => {
    return <WelcomeScreen handleStartWebAudio={this.startWebAudio} />
  }

  renderSynthRoom = () => {
    const { instruments } = this.state

    return (
      <SynthRoom
        instruments={instruments}
        handlePropertyValueChange={this.handlePropertyValueChange}
      />
    )
  }

  render() {
    const { webAudioStarted } = this.state

    return (
      <table className={styles.table}>
        <tr>
          <td width="70%">
            <Sequencer
              setFrequency={setFrequency}
              triggerEnvelope={setTrigger}
            />
          </td>
          <td width="30%">
            <div style={{ margin: '10px' }}>
              <PlayButton/>
            </div>
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
            }}>
              <Envelope
                register={setEnvelopeRef}
                triggerTime={trigger}
              />
              <div style={{ display: 'flex', margin: '15px 0' }}>
                <Noise register={setNoiseRef}/>
                <SawtoothOscillator
                  register={setOscillator1Ref}
                  frequency={frequency}
                />
              </div>
              <LFO register={setLfoRef}/>
            </div>
          </td>
        </tr>
        <tr>
          <td>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <div style={{margin: '0 15px 0 4px'}}>
                <PulseOscillator
                  register={setOscillator2Ref}
                  frequency={frequency}
                />
              </div>
              <Filter register={setFilterRef}/>
              <div style={{ margin: '0 4px 0 15px' }}>
                <Effects
                  registerInput={setEffectsInputRef}
                  registerOutput={setEffectsOutputRef}
                />
              </div>
            </div>
          </td>
          <td/>
        </tr>
      </table>
    )
  }
}
