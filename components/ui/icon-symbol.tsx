// Fallback for using MaterialIcons on Android and web.

import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { SymbolViewProps, SymbolWeight } from "expo-symbols";
import { ComponentProps } from "react";
import { OpaqueColorValue, type StyleProp, type TextStyle } from "react-native";

type IconMapping = Record<SymbolViewProps["name"], ComponentProps<typeof MaterialIcons>["name"]>;
type IconSymbolName = keyof typeof MAPPING;

/**
 * Add your SF Symbols to Material Icons mappings here.
 * - see Material Icons in the [Icons Directory](https://icons.expo.fyi).
 * - see SF Symbols in the [SF Symbols](https://developer.apple.com/sf-symbols/) app.
 */
const MAPPING = {
  "house.fill": "home",
  "paperplane.fill": "send",
  "chevron.left.forwardslash.chevron.right": "code",
  "chevron.right": "chevron-right",
  "chevron.down": "expand-more",
  "chevron.up": "expand-less",
  "magnifyingglass": "search",
  "camera.fill": "camera",
  "folder.fill": "folder",
  "pencil": "edit",
  "printer.fill": "print",
  "shippingbox.fill": "inventory",
  "checkmark.circle.fill": "check-circle",
  "gearshape.fill": "settings",
  "xmark": "close",
  "xmark.circle.fill": "cancel",
  "arrow.left": "arrow-back",
  // question mark variants
  "questionmark": "help",
  "questionmark.circle": "help",
  "questionmark.circle.fill": "help",
  "question-mark": "help",
  "question-mark.circle": "help",
  // info and about
  "info.circle": "info",
  "info.circle.fill": "info",
  // app and version
  "app.fill": "apps",
  "number": "tag",
  "calendar": "event",
  // contact icons
  "envelope.fill": "email",
  "phone.fill": "phone",
  "mappin.circle.fill": "place",
  // arrows
  "arrow.clockwise": "refresh",
  // money/currency icons
  "dollarsign.circle.fill": "attach-money",
  "dollarsign.circle": "attach-money",
  "dollarsign": "attach-money",
  // document icons
  "square.and.pencil": "edit-document",
  // moon and sun for theme
  "moon.fill": "dark-mode",
  "sun.max.fill": "light-mode",
  // exclamation
  "exclamationmark.triangle.fill": "warning",
} as IconMapping;

/**
 * An icon component that uses native SF Symbols on iOS, and Material Icons on Android and web.
 * This ensures a consistent look across platforms, and optimal resource usage.
 * Icon `name`s are based on SF Symbols and require manual mapping to Material Icons.
 */
export function IconSymbol({
  name,
  size = 24,
  color,
  style,
}: {
  name: IconSymbolName;
  size?: number;
  color: string | OpaqueColorValue;
  style?: StyleProp<TextStyle>;
  weight?: SymbolWeight;
}) {
  return <MaterialIcons color={color} size={size} name={MAPPING[name]} style={style} />;
}
