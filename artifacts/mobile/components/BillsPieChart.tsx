import React from "react";
import { StyleSheet, View } from "react-native";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from "react-native-reanimated";
import Svg, {
  Defs,
  G,
  LinearGradient,
  Path,
  Stop,
} from "react-native-svg";

import { useColors } from "@/hooks/useColors";
import type { Bill } from "@/types/bill";
import { getCategoryColor } from "@/types/bill";

interface Props {
  bills: Bill[];
}

const SIZE = 220;
const DEPTH = 26;
const RX = SIZE / 2 - 12;
const RY = RX * 0.62;
const CX = SIZE / 2;
const CY = SIZE / 2 - DEPTH / 2;
const INNER = 0.42;
const MIN_SCALE = 1;
const MAX_SCALE = 3;

// Darken a hex color by a factor (0-1) for the extruded side walls.
function darken(hex: string, factor: number): string {
  const h = hex.replace("#", "");
  const full =
    h.length === 3
      ? h
          .split("")
          .map((c) => c + c)
          .join("")
      : h;
  const r = Math.round(parseInt(full.slice(0, 2), 16) * factor);
  const g = Math.round(parseInt(full.slice(2, 4), 16) * factor);
  const b = Math.round(parseInt(full.slice(4, 6), 16) * factor);
  return `rgb(${r},${g},${b})`;
}

function pointOnEllipse(angle: number, dy: number) {
  return {
    x: CX + RX * Math.cos(angle),
    y: CY + RY * Math.sin(angle) + dy,
  };
}

// A complete donut ring top, used when a single bill makes up the whole pie
// (an SVG arc cannot draw a 360° span because its endpoints coincide).
function fullRingTopPath(): string {
  const ox = CX + RX;
  const ix = CX + RX * INNER;
  return [
    `M ${ox} ${CY}`,
    `A ${RX} ${RY} 0 1 1 ${CX - RX} ${CY}`,
    `A ${RX} ${RY} 0 1 1 ${ox} ${CY}`,
    `M ${ix} ${CY}`,
    `A ${RX * INNER} ${RY * INNER} 0 1 1 ${CX - RX * INNER} ${CY}`,
    `A ${RX * INNER} ${RY * INNER} 0 1 1 ${ix} ${CY}`,
    "Z",
  ].join(" ");
}

// Builds the flat top-surface wedge (a ring slice using outer + inner ellipse).
function topSlicePath(start: number, end: number): string {
  if (end - start >= Math.PI * 2 - 1e-3) return fullRingTopPath();
  const o1 = pointOnEllipse(start, 0);
  const o2 = pointOnEllipse(end, 0);
  const iEnd = {
    x: CX + RX * INNER * Math.cos(end),
    y: CY + RY * INNER * Math.sin(end),
  };
  const iStart = {
    x: CX + RX * INNER * Math.cos(start),
    y: CY + RY * INNER * Math.sin(start),
  };
  const large = end - start > Math.PI ? 1 : 0;
  return [
    `M ${o1.x} ${o1.y}`,
    `A ${RX} ${RY} 0 ${large} 1 ${o2.x} ${o2.y}`,
    `L ${iEnd.x} ${iEnd.y}`,
    `A ${RX * INNER} ${RY * INNER} 0 ${large} 0 ${iStart.x} ${iStart.y}`,
    "Z",
  ].join(" ");
}

// Builds the extruded outer side wall for the front-facing portion of a slice.
function sideWallPath(start: number, end: number): string {
  const o1 = pointOnEllipse(start, 0);
  const o2 = pointOnEllipse(end, 0);
  const o2d = pointOnEllipse(end, DEPTH);
  const o1d = pointOnEllipse(start, DEPTH);
  const large = end - start > Math.PI ? 1 : 0;
  return [
    `M ${o1.x} ${o1.y}`,
    `A ${RX} ${RY} 0 ${large} 1 ${o2.x} ${o2.y}`,
    `L ${o2d.x} ${o2d.y}`,
    `A ${RX} ${RY} 0 ${large} 0 ${o1d.x} ${o1d.y}`,
    "Z",
  ].join(" ");
}

// Clamp an angular span to the front-facing arc (where sin > 0, y is lowest),
// so we only extrude the visible bottom rim of the ellipse.
function frontSpan(start: number, end: number): Array<[number, number]> {
  const spans: Array<[number, number]> = [];
  const STEPS = 48;
  let segStart: number | null = null;
  for (let i = 0; i <= STEPS; i++) {
    const a = start + ((end - start) * i) / STEPS;
    const front = Math.sin(a) > 0;
    if (front && segStart === null) segStart = a;
    if ((!front || i === STEPS) && segStart !== null) {
      spans.push([segStart, a]);
      segStart = null;
    }
  }
  return spans;
}

export function BillsPieChart({ bills }: Props) {
  const colors = useColors();
  const scale = useSharedValue(1);
  const savedScale = useSharedValue(1);

  const total = bills.reduce((s, b) => s + b.amount, 0);

  const pinch = Gesture.Pinch()
    .onUpdate((e) => {
      const next = savedScale.value * e.scale;
      scale.value = Math.min(Math.max(next, MIN_SCALE), MAX_SCALE);
    })
    .onEnd(() => {
      savedScale.value = scale.value;
    });

  const doubleTap = Gesture.Tap()
    .numberOfTaps(2)
    .onEnd(() => {
      scale.value = withSpring(1);
      savedScale.value = 1;
    });

  const composed = Gesture.Simultaneous(pinch, doubleTap);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  if (bills.length === 0 || total <= 0) return null;

  // Build slices; sort largest-first for a stable, readable layout.
  const sorted = [...bills].sort((a, b) => b.amount - a.amount);
  let cursor = -Math.PI / 2; // start at top
  const slices = sorted.map((b) => {
    const frac = b.amount / total;
    const start = cursor;
    const end = cursor + frac * Math.PI * 2;
    cursor = end;
    return {
      bill: b,
      start,
      end,
      color: getCategoryColor(b.category),
    };
  });

  return (
    <View style={styles.wrap}>
      <GestureDetector gesture={composed}>
        <Animated.View style={[styles.canvas, animatedStyle]}>
          <Svg width={SIZE} height={SIZE}>
            <Defs>
              <LinearGradient id="pieSheen" x1="0" y1="0" x2="0" y2="1">
                <Stop offset="0" stopColor="#ffffff" stopOpacity={0.25} />
                <Stop offset="1" stopColor="#ffffff" stopOpacity={0} />
              </LinearGradient>
            </Defs>

            {/* Extruded side walls (drawn first, behind the top surface). */}
            <G>
              {slices.map((s, i) =>
                frontSpan(s.start, s.end).map(([fs, fe], j) => (
                  <Path
                    key={`wall-${i}-${j}`}
                    d={sideWallPath(fs, fe)}
                    fill={darken(s.color, 0.62)}
                  />
                )),
              )}
            </G>

            {/* Flat top surface slices. */}
            <G>
              {slices.map((s, i) => (
                <Path
                  key={`top-${i}`}
                  d={topSlicePath(s.start, s.end)}
                  fill={s.color}
                  fillRule="evenodd"
                  stroke={colors.card}
                  strokeWidth={1.5}
                />
              ))}
              {slices.map((s, i) => (
                <Path
                  key={`sheen-${i}`}
                  d={topSlicePath(s.start, s.end)}
                  fill="url(#pieSheen)"
                  fillRule="evenodd"
                />
              ))}
            </G>
          </Svg>
        </Animated.View>
      </GestureDetector>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 8,
  },
  canvas: {
    width: SIZE,
    height: SIZE,
    alignItems: "center",
    justifyContent: "center",
  },
});
