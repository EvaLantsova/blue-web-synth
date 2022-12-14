import React, { useRef, useEffect, useContext } from "react";
import {
  LFO,
  Gain,
  ScaleExp,
  Delay,
  Loop,
  CrossFade,
  Signal,
  Meter
} from "tone";
import styled from "astroturf";
import useRaf from "@rooks/use-raf";

import PlayStateContext from "../../playStateContext";
import SignalEncoder from "../ui/SignalEncoder";
import Group from "../ui/Group";

const StyledOscillator = styled("div")`
  grid-area: lfo;
`;

const LFOElement = ({ register }) => {
  const { playing } = useContext(PlayStateContext);
  const lfoNode = useRef();
  const noiseNode = useRef();
  const crossFade = useRef();
  const gainNode = useRef();
  const loopNode = useRef();
  const signalMeter = useRef();
  let frequencyControlSignal = useRef();
  let gainControlSignal = useRef();
  let mixControlSignal = useRef();

  useEffect(() => {
    lfoNode.current = new LFO("4n", -0.5, 0.5);

    signalMeter.current = new Meter();
    noiseNode.current = new Signal(1);

    loopNode.current = new Loop(time => {
      noiseNode.current.value = Math.random() - 0.5;
    }, 0.1);

    crossFade.current = new CrossFade(0);
    gainNode.current = new Gain({
      gain: 0
    });

    noiseNode.current.connect(crossFade.current, 0, 1);
    lfoNode.current.connect(crossFade.current, 0, 0);

    crossFade.current.connect(gainNode.current);

    register(gainNode.current);
    // eslint-disable-next-line
  }, []);

  useEffect(() => {
    if (playing) {
      lfoNode.current.start();
      loopNode.current.start(0);
    }
  }, [playing]);

  useEffect(() => {
    if (gainNode.current && gainControlSignal) {
      const delay = new Delay(0.01);
      gainControlSignal.connect(delay);
      delay.connect(gainNode.current.gain);

      return function cleanup() {
        delay.dispose();
      };
    }
  }, [gainControlSignal]);

  useEffect(() => {
    if (lfoNode.current && frequencyControlSignal) {
      const delay = new Delay(0.01);
      const lfoScale = new ScaleExp(0.01, 10, 2);

      frequencyControlSignal.connect(delay);
      delay.connect(lfoScale);
      lfoScale.connect(lfoNode.current.frequency);

      lfoNode.current.frequency.connect(signalMeter.current);

      return function cleanup() {
        lfoScale.dispose();
        delay.dispose();
      };
    }
  }, [frequencyControlSignal]);

  useEffect(() => {
    if (crossFade.current && mixControlSignal) {
      const delay = new Delay(0.01);
      mixControlSignal.connect(delay);
      delay.connect(crossFade.current.fade);

      return function cleanup() {
        delay.dispose();
      };
    }
  }, [mixControlSignal]);

  useRaf(() => {
    loopNode.current.interval = 0.1 / signalMeter.current.getValue();
  }, signalMeter.current && loopNode.current && noiseNode.current);

  const handleFrequencyControlSignal = signalRef => {
    frequencyControlSignal = signalRef;
  };

  const handleGainControlSignal = signalRef => {
    gainControlSignal = signalRef;
  };

  const handleMixControlSignal = signalRef => {
    mixControlSignal = signalRef;
  };

  return (
    <StyledOscillator>
      <Group title="LFO">
        <SignalEncoder
          label="Rate"
          midiCC={5}
          defaultValue={0.1}
          registerSignal={handleFrequencyControlSignal}
        />
        <SignalEncoder
          label="Noise"
          midiCC={6}
          defaultValue={0.1}
          registerSignal={handleMixControlSignal}
        />
        <SignalEncoder
          label="Gain"
          midiCC={7}
          defaultValue={0.1}
          registerSignal={handleGainControlSignal}
        />
      </Group>
    </StyledOscillator>
  );
};
export default LFOElement;
