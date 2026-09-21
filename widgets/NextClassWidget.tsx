import { Text, VStack } from '@expo/ui/swift-ui';
import { containerBackground, font, foregroundStyle, lineLimit, padding } from '@expo/ui/swift-ui/modifiers';
import { createWidget, type WidgetEnvironment } from 'expo-widgets';

export type NextClassWidgetProps = {
  name: string;
  time: string;
  location: string;
  teacher: string;
};

const NextClassWidget = (props: NextClassWidgetProps, environment: WidgetEnvironment) => {
  'widget';
  const secondary = environment.colorScheme === 'dark' ? '#BEC3BF' : '#636A66';
  return (
    <VStack alignment="leading" spacing={6} modifiers={[padding({ all: 15 }), containerBackground(environment.colorScheme === 'dark' ? '#171B18' : '#F7F7F2', 'widget')]}>
      <Text modifiers={[font({ size: 11, weight: 'bold' }), foregroundStyle('#767BEF')]}>下一节课</Text>
      <Text modifiers={[font({ size: 20, weight: 'black' }), foregroundStyle(environment.colorScheme === 'dark' ? '#FFFFFF' : '#1D211F'), lineLimit(2)]}>{props.name}</Text>
      <Text modifiers={[font({ size: 12, weight: 'semibold' }), foregroundStyle(secondary)]}>{props.time}</Text>
      <Text modifiers={[font({ size: 11 }), foregroundStyle(secondary), lineLimit(1)]}>{props.location} · {props.teacher}</Text>
    </VStack>
  );
};

export default createWidget<NextClassWidgetProps>('NextClassWidget', NextClassWidget);
