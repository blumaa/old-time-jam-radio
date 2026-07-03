import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import RadioFacade from "./RadioFacade";
import RadioDisplay from "./RadioDisplay";
import PlayerControls from "./PlayerControls";
import StationSelector from "./StationSelector";
import SpeedSlider from "./SpeedSlider";

const meta: Meta<typeof RadioFacade> = {
  title: "Radio/RadioFacade",
  component: RadioFacade,
};

export default meta;
type Story = StoryObj<typeof RadioFacade>;

export const PoweredOff: Story = {
  args: { isPoweredOn: false },
  render: (args) => (
    <RadioFacade {...args}>
      <RadioDisplay
        tuneName={null}
        artist={null}
        stationKey={null}
        speed={1.0}
        progress={0}
        isPoweredOn={false}
      />
      <StationSelector
        stations={["G", "D", "A"]}
        currentStation="G"
        onStationChange={() => {}}
        disabled={true}
      />
      <SpeedSlider speed={1.0} onSpeedChange={() => {}} disabled={true} />

      <PlayerControls
        isPoweredOn={false}
        onPowerToggle={() => {}}
        isPaused={false}
        onPause={() => {}}
        onSearch={() => {}}
        onQueue={() => {}}
        onRestart={() => {}}
        mode="jam"
        onModeChange={() => {}}
        hasCurrentTune={false}
      />
    </RadioFacade>
  ),
};

export const PoweredOn: Story = {
  args: { isPoweredOn: true },
  render: (args) => (
    <RadioFacade {...args}>
      <RadioDisplay
        tuneName="Turkey in the Straw"
        artist="Dan Gellert"
        stationKey="G"
        speed={0.75}
        progress={0.35}
        isPoweredOn={true}
      />
      <StationSelector
        stations={["G", "D", "A"]}
        currentStation="G"
        onStationChange={() => {}}
        disabled={false}
      />
      <SpeedSlider speed={0.75} onSpeedChange={() => {}} disabled={false} />

      <PlayerControls
        isPoweredOn={true}
        onPowerToggle={() => {}}
        isPaused={false}
        onPause={() => {}}
        onSearch={() => {}}
        onQueue={() => {}}
        onRestart={() => {}}
        mode="jam"
        onModeChange={() => {}}
        hasCurrentTune={true}
      />
    </RadioFacade>
  ),
};

export const LearnMode: Story = {
  args: { isPoweredOn: true },
  render: (args) => (
    <RadioFacade {...args}>
      <RadioDisplay
        tuneName="Sally Ann"
        artist="Highwoods Stringband"
        stationKey="A"
        speed={0.5}
        progress={0.35}
        isPoweredOn={true}
        mode="learn"
        playCount={3}
      />
      <StationSelector
        stations={["G", "D", "A"]}
        currentStation="A"
        onStationChange={() => {}}
        disabled={false}
      />
      <SpeedSlider speed={0.5} onSpeedChange={() => {}} disabled={false} />

      <PlayerControls
        isPoweredOn={true}
        onPowerToggle={() => {}}
        isPaused={false}
        onPause={() => {}}
        onSearch={() => {}}
        onQueue={() => {}}
        onRestart={() => {}}
        mode="learn"
        onModeChange={() => {}}
        hasCurrentTune={true}
      />
    </RadioFacade>
  ),
};
