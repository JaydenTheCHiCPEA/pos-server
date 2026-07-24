/**
 * Enhanced chart component using react-native-gifted-charts
 * with animations, time pan capabilities, and smooth interactions.
 */

import React, { useRef, useState, useEffect } from "react";
import { View, Text, StyleSheet, ScrollView, Animated, TouchableOpacity } from "react-native";
import { BarChart, LineChart, PieChart } from "react-native-gifted-charts";

/* ─────────────────────────────── ENHANCED BAR CHART ─────────────────────── */

interface EnhancedBarChartProps {
  data: Array<{ label: string; value: number; color?: string }>;
  height?: number;
  barColor?: string;
  labelColor?: string;
  gridColor?: string;
  formatValue?: (v: number) => string;
  animationDuration?: number;
  enablePan?: boolean;
}

export function EnhancedBarChart({
  data,
  height = 240,
  barColor = "#5865F2",
  labelColor = "#72767d",
  gridColor = "#ffffff14",
  formatValue,
  animationDuration = 1000,
  enablePan = true,
}: EnhancedBarChartProps) {
  const [displayData, setDisplayData] = useState(data);
  const scrollRef = useRef<ScrollView>(null);
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    setDisplayData(data);
    fadeAnim.setValue(0);
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: animationDuration,
      useNativeDriver: true,
    }).start();
  }, [data, animationDuration, fadeAnim]);

  const chartData = displayData.map((item) => ({
    value: item.value,
    label: item.label,
    labelWidth: 50,
    frontColor: item.color || barColor,
  }));

  return (
    <Animated.View style={{ opacity: fadeAnim }}>
      <View style={{ overflow: "hidden", borderRadius: 8 }}>
        {enablePan && displayData.length > 8 ? (
          <ScrollView
            ref={scrollRef}
            horizontal
            showsHorizontalScrollIndicator={false}
            scrollEventThrottle={16}
          >
            <BarChart
              data={chartData}
              height={height}
              xAxisColor={gridColor}
              yAxisColor={gridColor}
              barWidth={32}
              spacing={16}
              yAxisLabelWidth={50}
              noOfSections={4}
              yAxisTextStyle={{ color: labelColor, fontSize: 10 }}
              xAxisLabelTextStyle={{ color: labelColor, fontSize: 10 }}
              isAnimated
              animationDuration={animationDuration}
              showGradient
              gradientColor={barColor}
            />
          </ScrollView>
        ) : (
          <BarChart
            data={chartData}
            height={height}
            xAxisColor={gridColor}
            yAxisColor={gridColor}
            barWidth={32}
            spacing={12}
            yAxisLabelWidth={50}
            noOfSections={4}
            yAxisTextStyle={{ color: labelColor, fontSize: 10 }}
            xAxisLabelTextStyle={{ color: labelColor, fontSize: 10 }}
            isAnimated
            animationDuration={animationDuration}
            showGradient
            gradientColor={barColor}
          />
        )}
      </View>
    </Animated.View>
  );
}

/* ─────────────────────────────── ENHANCED LINE CHART ─────────────────────── */

interface EnhancedLineChartProps {
  data: Array<{ label: string; value: number; color?: string }>;
  height?: number;
  lineColor?: string;
  labelColor?: string;
  gridColor?: string;
  formatValue?: (v: number) => string;
  animationDuration?: number;
  enablePan?: boolean;
  curved?: boolean;
}

export function EnhancedLineChart({
  data,
  height = 280,
  lineColor = "#5865F2",
  labelColor = "#72767d",
  gridColor = "#ffffff14",
  formatValue,
  animationDuration = 1500,
  enablePan = true,
  curved = true,
}: EnhancedLineChartProps) {
  const [displayData, setDisplayData] = useState(data);
  const scrollRef = useRef<ScrollView>(null);
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    setDisplayData(data);
    fadeAnim.setValue(0);
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: animationDuration,
      useNativeDriver: true,
    }).start();
  }, [data, animationDuration, fadeAnim]);

  const chartData = displayData.map((item) => ({
    value: item.value,
    label: item.label,
    labelWidth: 50,
  }));

  return (
    <Animated.View style={{ opacity: fadeAnim }}>
      <View style={{ overflow: "hidden", borderRadius: 8 }}>
        {enablePan && displayData.length > 8 ? (
          <ScrollView
            ref={scrollRef}
            horizontal
            showsHorizontalScrollIndicator={false}
            scrollEventThrottle={16}
          >
            <LineChart
              data={chartData}
              height={height}
              xAxisColor={gridColor}
              yAxisColor={gridColor}
              yAxisLabelWidth={50}
              noOfSections={5}
              spacing={16}
              curved={curved}
              color={lineColor}
              yAxisTextStyle={{ color: labelColor, fontSize: 10 }}
              xAxisLabelTextStyle={{ color: labelColor, fontSize: 10 }}
              isAnimated
              animationDuration={animationDuration}
              thickness={2}
              startFillColor={lineColor}
              startOpacity={0.3}
              endOpacity={0.01}
            />
          </ScrollView>
        ) : (
          <LineChart
            data={chartData}
            height={height}
            xAxisColor={gridColor}
            yAxisColor={gridColor}
            yAxisLabelWidth={50}
            noOfSections={5}
            spacing={12}
            curved={curved}
            color={lineColor}
            yAxisTextStyle={{ color: labelColor, fontSize: 10 }}
            xAxisLabelTextStyle={{ color: labelColor, fontSize: 10 }}
            isAnimated
            animationDuration={animationDuration}
            thickness={2}
            startFillColor={lineColor}
            startOpacity={0.3}
            endOpacity={0.01}
          />
        )}
      </View>
    </Animated.View>
  );
}

/* ─────────────────────────────── ENHANCED PIE CHART ──────────────────────── */

interface EnhancedPieChartProps {
  data: Array<{ label: string; value: number; color: string }>;
  size?: number;
  animationDuration?: number;
}

export function EnhancedPieChart({
  data,
  size = 200,
  animationDuration = 1000,
}: EnhancedPieChartProps) {
  const [displayData, setDisplayData] = useState(data);
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    setDisplayData(data);
    fadeAnim.setValue(0);
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: animationDuration,
      useNativeDriver: true,
    }).start();
  }, [data, animationDuration, fadeAnim]);

  const chartData = displayData.map((item) => ({
    value: item.value,
    color: item.color,
    label: item.label,
  }));

  return (
    <Animated.View style={{ opacity: fadeAnim, alignItems: "center" }}>
      <PieChart
        data={chartData}
        donut
        radius={size / 2}
        innerRadius={size / 3}
        showValuesAsLabels={false}
      />
    </Animated.View>
  );
}

/* ─────────────────────────────── Time range selector ───────────────────────── */

interface TimeRangeSelectorProps {
  ranges: { key: string; label: string }[];
  selected: string;
  onSelect: (range: string) => void;
  backgroundColor?: string;
  selectedColor?: string;
  textColor?: string;
  mutedColor?: string;
}

export function TimeRangeSelector({
  ranges,
  selected,
  onSelect,
  backgroundColor = "#1a1a1a",
  selectedColor = "#5865F2",
  textColor = "#ffffff",
  mutedColor = "#72767d",
}: TimeRangeSelectorProps) {
  return (
    <View
      style={[
        st.rangeContainer,
        { backgroundColor, borderColor: "#ffffff14" },
      ]}
    >
      {ranges.map((r) => (
        <Animated.View key={r.key}>
          <TouchableOpacity
            style={[
              st.rangeBtn,
              {
                backgroundColor:
                  selected === r.key ? selectedColor : "transparent",
              },
            ]}
            onPress={() => onSelect(r.key)}
          >
            <Text
              style={[
                st.rangeText,
                {
                  color: selected === r.key ? "#fff" : mutedColor,
                },
              ]}
            >
              {r.label}
            </Text>
          </TouchableOpacity>
        </Animated.View>
      ))}
    </View>
  );
}

/* ──────────────────────────── Analytics card wrapper ──────────────────────── */

interface AnalyticsCardProps {
  title: string;
  children: React.ReactNode;
  backgroundColor?: string;
  borderColor?: string;
  titleColor?: string;
}

export function AnalyticsCard({
  title,
  children,
  backgroundColor = "#2d2d2d",
  borderColor = "#404040",
  titleColor = "#ffffff",
}: AnalyticsCardProps) {
  const scaleAnim = useRef(new Animated.Value(0.95)).current;

  useEffect(() => {
    Animated.timing(scaleAnim, {
      toValue: 1,
      duration: 300,
      useNativeDriver: true,
    }).start();
  }, [scaleAnim]);

  return (
    <Animated.View
      style={[
        st.card,
        {
          backgroundColor,
          borderColor,
          transform: [{ scale: scaleAnim }],
        },
      ]}
    >
      <Text style={[st.cardTitle, { color: titleColor }]}>{title}</Text>
      <View style={st.cardContent}>{children}</View>
    </Animated.View>
  );
}

/* ──────────────────────────────────── styles ────────────────────────────────── */

const st = StyleSheet.create({
  rangeContainer: {
    flexDirection: "row",
    padding: 8,
    borderRadius: 6,
    borderWidth: 1,
    gap: 6,
  },
  rangeBtn: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 4,
  },
  rangeText: {
    fontSize: 12,
    fontWeight: "600",
  },
  card: {
    borderRadius: 8,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    overflow: "hidden",
  },
  cardTitle: {
    fontSize: 14,
    fontWeight: "700",
    marginBottom: 12,
  },
  cardContent: {
    overflow: "hidden",
  },
});
