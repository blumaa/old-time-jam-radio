import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import RadioFacade from "./RadioFacade";
import RadioDisplay from "./RadioDisplay";
import PowerButton from "./PowerButton";
import PauseButton from "./PauseButton";
import RestartButton from "./RestartButton";
import StationSelector from "./StationSelector";
import SpeedSlider from "./SpeedSlider";
import VolumeSlider from "./VolumeSlider";
import ModeToggle from "./ModeToggle";

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
      <VolumeSlider volume={0.7} onVolumeChange={() => {}} disabled={true} />
      <div className="radio-transport">
        <div className="transport-button-slot transport-button-slot--hidden" />
        <div className="radio-transport__controls">
          <div className="transport-button-slot transport-button-slot--hidden">
            <RestartButton onClick={() => {}} disabled={true} />
          </div>
          <PowerButton isPoweredOn={false} onClick={() => {}} />
          <div className="transport-button-slot">
            <PauseButton isPaused={false} onClick={() => {}} disabled={true} />
          </div>
        </div>
        <ModeToggle mode="jam" onModeChange={() => {}} disabled={true} />
      </div>
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
      <VolumeSlider volume={0.7} onVolumeChange={() => {}} disabled={false} />
      <div className="radio-transport">
        <div className="transport-button-slot transport-button-slot--hidden" />
        <div className="radio-transport__controls">
          <div className="transport-button-slot transport-button-slot--hidden">
            <RestartButton onClick={() => {}} disabled={false} />
          </div>
          <PowerButton isPoweredOn={true} onClick={() => {}} />
          <div className="transport-button-slot">
            <PauseButton isPaused={false} onClick={() => {}} disabled={false} />
          </div>
        </div>
        <ModeToggle mode="jam" onModeChange={() => {}} disabled={false} />
      </div>
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
      <VolumeSlider volume={0.7} onVolumeChange={() => {}} disabled={false} />
      <div className="radio-transport">
        <div className="transport-button-slot radio-transport__search">
          <button className="transport-button" type="button" aria-label="Search tunes">
            <svg className="transport-button__icon-svg" viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              <circle cx="10" cy="10" r="6" />
              <line x1="14.5" y1="14.5" x2="20" y2="20" />
            </svg>
          </button>
        </div>
        <div className="radio-transport__controls">
          <div className="transport-button-slot">
            <RestartButton onClick={() => {}} disabled={false} />
          </div>
          <PowerButton isPoweredOn={true} onClick={() => {}} />
          <div className="transport-button-slot">
            <PauseButton isPaused={false} onClick={() => {}} disabled={false} />
          </div>
        </div>
        <ModeToggle mode="learn" onModeChange={() => {}} disabled={false} />
      </div>
    </RadioFacade>
  ),
};
