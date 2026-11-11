import Svg, { Path } from 'react-native-svg';

type Props = { height?: number };

export function OwodaSymbole({ height = 80 }: Props) {
  return (
    <Svg width={height} height={height} viewBox="0 0 1024 1024">
      <Path
        d="M512 212C677.685 212 812 346.315 812 512C812 677.685 677.685 812 512 812C346.315 812 212 677.685 212 512C212 346.315 346.315 212 512 212ZM598 350C519.576 350 456 413.576 456 492C456 570.424 519.576 634 598 634C676.424 634 740 570.424 740 492C740 413.576 676.424 350 598 350Z"
        fill="#93401F"
      />
    </Svg>
  );
}
