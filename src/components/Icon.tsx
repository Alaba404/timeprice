/*
 * Icon — Lucide icons compiled to react-native-svg paths.
 *
 * Icon designs copyright (c) Lucide Contributors
 * Licensed under the ISC License
 * https://github.com/lucide-icons/lucide/blob/main/LICENSE
 */
import Svg, { Path, Line, Circle, Polyline, Rect } from 'react-native-svg';

export type IconName =
  | 'utensils' | 'car' | 'house' | 'laptop' | 'shirt'
  | 'gamepad-2' | 'pill' | 'package' | 'search'
  | 'timer' | 'list' | 'chart-column' | 'settings'
  | 'lightbulb' | 'gift' | 'book-open' | 'trending-up'
  | 'users' | 'infinity' | 'pencil' | 'lock' | 'mail';

type Props = {
  name: IconName;
  size?: number;
  color: string;
  strokeWidth?: number;
};

export function Icon({ name, size = 24, color, strokeWidth = 2 }: Props) {
  const p = { stroke: color, strokeWidth, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const, fill: 'none' };
  const c = { stroke: color, strokeWidth, fill: 'none' };

  function inner() {
    switch (name) {
      case 'utensils': return (<>
        <Path d="M3 2v7c0 1.1.9 2 2 2h4a2 2 0 0 0 2-2V2" {...p}/>
        <Path d="M7 2v20" {...p}/>
        <Path d="M21 15V2a5 5 0 0 0-5 5v6c0 1.1.9 2 2 2h3Zm0 0v7" {...p}/>
      </>);
      case 'car': return (<>
        <Path d="M19 17h2c.6 0 1-.4 1-1v-3c0-.9-.7-1.7-1.5-1.9C18.7 10.6 16 10 16 10s-1.3-1.4-2.2-2.3c-.5-.4-1.1-.7-1.8-.7H5c-.6 0-1.1.4-1.4.9l-1.4 2.9A3.7 3.7 0 0 0 2 12v4c0 .6.4 1 1 1h2" {...p}/>
        <Circle cx="7" cy="17" r="2" {...c}/>
        <Path d="M9 17h6" {...p}/>
        <Circle cx="17" cy="17" r="2" {...c}/>
      </>);
      case 'house': return (<>
        <Path d="M15 21v-8a1 1 0 0 0-1-1h-4a1 1 0 0 0-1 1v8" {...p}/>
        <Path d="M3 10a2 2 0 0 1 .709-1.528l7-6a2 2 0 0 1 2.582 0l7 6A2 2 0 0 1 21 10v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" {...p}/>
      </>);
      case 'laptop': return (<>
        <Path d="M18 5a2 2 0 0 1 2 2v8.526a2 2 0 0 0 .212.897l1.068 2.127a1 1 0 0 1-.9 1.45H3.62a1 1 0 0 1-.9-1.45l1.068-2.127A2 2 0 0 0 4 15.526V7a2 2 0 0 1 2-2z" {...p}/>
        <Path d="M20.054 15.987H3.946" {...p}/>
      </>);
      case 'shirt': return (
        <Path d="M20.38 3.46 16 2a4 4 0 0 1-8 0L3.62 3.46a2 2 0 0 0-1.34 2.23l.58 3.47a1 1 0 0 0 .99.84H6v10c0 1.1.9 2 2 2h8a2 2 0 0 0 2-2V10h2.15a1 1 0 0 0 .99-.84l.58-3.47a2 2 0 0 0-1.34-2.23z" {...p}/>
      );
      case 'gamepad-2': return (<>
        <Line x1="6" x2="10" y1="11" y2="11" {...p}/>
        <Line x1="8" x2="8" y1="9" y2="13" {...p}/>
        <Line x1="15" x2="15.01" y1="12" y2="12" {...p}/>
        <Line x1="18" x2="18.01" y1="10" y2="10" {...p}/>
        <Path d="M17.32 5H6.68a4 4 0 0 0-3.978 3.59c-.006.052-.01.101-.017.152C2.604 9.416 2 14.456 2 16a3 3 0 0 0 3 3c1 0 1.5-.5 2-1l1.414-1.414A2 2 0 0 1 9.828 16h4.344a2 2 0 0 1 1.414.586L17 18c.5.5 1 1 2 1a3 3 0 0 0 3-3c0-1.545-.604-6.584-.685-7.258-.007-.05-.011-.1-.017-.151A4 4 0 0 0 17.32 5z" {...p}/>
      </>);
      case 'pill': return (<>
        <Path d="m10.5 20.5 10-10a4.95 4.95 0 1 0-7-7l-10 10a4.95 4.95 0 1 0 7 7Z" {...p}/>
        <Path d="m8.5 8.5 7 7" {...p}/>
      </>);
      case 'package': return (<>
        <Path d="M11 21.73a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73z" {...p}/>
        <Path d="M12 22V12" {...p}/>
        <Polyline points="3.29 7 12 12 20.71 7" {...p}/>
        <Path d="m7.5 4.27 9 5.15" {...p}/>
      </>);
      case 'search': return (<>
        <Path d="m21 21-4.34-4.34" {...p}/>
        <Circle cx="11" cy="11" r="8" {...c}/>
      </>);
      case 'timer': return (<>
        <Line x1="10" x2="14" y1="2" y2="2" {...p}/>
        <Line x1="12" x2="15" y1="14" y2="11" {...p}/>
        <Circle cx="12" cy="14" r="8" {...c}/>
      </>);
      case 'list': return (<>
        <Path d="M3 5h.01" {...p}/>
        <Path d="M3 12h.01" {...p}/>
        <Path d="M3 19h.01" {...p}/>
        <Path d="M8 5h13" {...p}/>
        <Path d="M8 12h13" {...p}/>
        <Path d="M8 19h13" {...p}/>
      </>);
      case 'chart-column': return (<>
        <Path d="M3 3v16a2 2 0 0 0 2 2h16" {...p}/>
        <Path d="M18 17V9" {...p}/>
        <Path d="M13 17V5" {...p}/>
        <Path d="M8 17v-3" {...p}/>
      </>);
      case 'settings': return (<>
        <Path d="M9.671 4.136a2.34 2.34 0 0 1 4.659 0 2.34 2.34 0 0 0 3.319 1.915 2.34 2.34 0 0 1 2.33 4.033 2.34 2.34 0 0 0 0 3.831 2.34 2.34 0 0 1-2.33 4.033 2.34 2.34 0 0 0-3.319 1.915 2.34 2.34 0 0 1-4.659 0 2.34 2.34 0 0 0-3.32-1.915 2.34 2.34 0 0 1-2.33-4.033 2.34 2.34 0 0 0 0-3.831A2.34 2.34 0 0 1 6.35 6.051a2.34 2.34 0 0 0 3.319-1.915" {...p}/>
        <Circle cx="12" cy="12" r="3" {...c}/>
      </>);
      case 'lightbulb': return (<>
        <Path d="M15 14c.2-1 .7-1.7 1.5-2.5 1-.9 1.5-2.2 1.5-3.5A6 6 0 0 0 6 8c0 1 .2 2.2 1.5 3.5.7.7 1.3 1.5 1.5 2.5" {...p}/>
        <Path d="M9 18h6" {...p}/>
        <Path d="M10 22h4" {...p}/>
      </>);
      case 'gift': return (<>
        <Path d="M12 7v14" {...p}/>
        <Path d="M20 11v8a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2v-8" {...p}/>
        <Path d="M7.5 7a1 1 0 0 1 0-5A4.8 8 0 0 1 12 7a4.8 8 0 0 1 4.5-5 1 1 0 0 1 0 5" {...p}/>
        <Rect x="3" y="7" width="18" height="4" rx="1" stroke={color} strokeWidth={strokeWidth} fill="none"/>
      </>);
      case 'book-open': return (<>
        <Path d="M12 5v16" {...p}/>
        <Path d="M20.001 19A2 2 0 0 0 22 17V5a2 2 0 0 0-1.999-2L16 3.002A5 5 0 0 0 12 5a5 5 0 0 0-4-2H4a2 2 0 0 0-2 2v12a2 2 0 0 0 1.999 2H8a5 5 0 0 1 4 2 5 5 0 0 1 4-2z" {...p}/>
      </>);
      case 'trending-up': return (<>
        <Path d="M16 7h6v6" {...p}/>
        <Path d="m22 7-8.5 8.5-5-5L2 17" {...p}/>
      </>);
      case 'users': return (<>
        <Path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" {...p}/>
        <Path d="M16 3.128a4 4 0 0 1 0 7.744" {...p}/>
        <Path d="M22 21v-2a4 4 0 0 0-3-3.87" {...p}/>
        <Circle cx="9" cy="7" r="4" {...c}/>
      </>);
      case 'infinity': return (
        <Path d="M6 16c5 0 7-8 12-8a4 4 0 0 1 0 8c-5 0-7-8-12-8a4 4 0 1 0 0 8" {...p}/>
      );
      case 'pencil': return (<>
        <Path d="M21.174 6.812a1 1 0 0 0-3.986-3.987L3.842 16.174a2 2 0 0 0-.5.83l-1.321 4.352a.5.5 0 0 0 .623.622l4.353-1.32a2 2 0 0 0 .83-.497z" {...p}/>
        <Path d="m15 5 4 4" {...p}/>
      </>);
      case 'lock': return (<>
        <Rect width="18" height="11" x="3" y="11" rx="2" ry="2" stroke={color} strokeWidth={strokeWidth} fill="none"/>
        <Path d="M7 11V7a5 5 0 0 1 10 0v4" {...p}/>
      </>);
      case 'mail': return (<>
        <Rect width="20" height="16" x="2" y="4" rx="2" stroke={color} strokeWidth={strokeWidth} fill="none"/>
        <Path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" {...p}/>
      </>);
    }
  }

  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      {inner()}
    </Svg>
  );
}
