import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import RadioFacade from "./RadioFacade";
import RadioDisplay from "./RadioDisplay";
import PowerButton from "./PowerButton";
import StationSelector from "./StationSelector";
import SpeedSlider from "./SpeedSlider";
import VolumeSlider from "./VolumeSlider";

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
      <PowerButton isPoweredOn={false} onClick={() => {}} />
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
      <PowerButton isPoweredOn={true} onClick={() => {}} />
    </RadioFacade>
  ),
};
