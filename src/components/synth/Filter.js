import React, { useRef, useEffect } from "react";
import { Filter, Scale, ScaleExp } from "tone";
import styled from "astroturf";
import SignalEncoder from "../ui/SignalEncoder";
import Group from "../ui/Group";

const StyledFilter = styled("div")`
  grid-area: filter;
`;

const FilterElement = ({ register }) => {
  const filter = useRef();
  let frequencyControlSignal = useRef();
  let resonanceControlSignal = useRef();

  useEffect(() => {
    filter.current = new Filter();

    register(filter.current);
    // eslint-disable-next-line
  }, []);

  useEffect(() => {
    if (frequencyControlSignal) {
      const scale = new ScaleExp(0, 20000, 2);
      frequencyControlSignal.connect(scale);
      scale.connect(filter.current.frequency);

      return function cleanup() {
        scale.dispose();
      };
    }
  }, [frequencyControlSignal]);

  useEffect(() => {
    if (resonanceControlSignal) {
      const scale = new Scale(0, 10);
      resonanceControlSignal.connect(scale);
      scale.connect(filter.current.Q);

      return function cleanup() {
        scale.dispose();
      };
    }
  }, [resonanceControlSignal]);

  const handleFrequencyControlSignal = signalRef => {
    frequencyControlSignal = signalRef;
  };

  const handleResonanceControlSignal = signalRef => {
    resonanceControlSignal = signalRef;
  };

  return (
    <StyledFilter>
      <Group title="Filter">
        <SignalEncoder
          label="Freq"
          midiCC={8}
          defaultValue={1}
          registerSignal={handleFrequencyControlSignal}
        />
        <SignalEncoder
          label="Res"
          midiCC={9}
          defaultValue={0}
          registerSignal={handleResonanceControlSignal}
        />
      </Group>
    </StyledFilter>
  );
};
export default FilterElement;
