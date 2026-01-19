import { useMemo } from "react";

type Props = {
  data: number[];
  width?: number;
  height?: number;
  color?: string;
};

export function MiniSparkline({
  data,
  width = 40,
  height = 20,
  color = "currentColor",
}: Props) {
  const path = useMemo(() => {
    if (data.length < 2) return "";

    const min = Math.min(...data);
    const max = Math.max(...data);
    const range = max - min || 1;

    const points = data.map((value, index) => {
      const x = (index / (data.length - 1)) * width;
      const y = height - ((value - min) / range) * height;
      return `${x},${y}`;
    });

    return `M ${points.join(" L ")}`;
  }, [data, width, height]);

  if (data.length < 2) {
    return <div style={{ width, height }} />;
  }

  const trend = data[data.length - 1] > data[0] ? "up" : "down";
  const strokeColor =
    trend === "up" ? "rgb(52, 211, 153)" : "rgb(251, 113, 133)";

  return (
    <svg
      width={width}
      height={height}
      className="inline-block"
      style={{ overflow: "visible" }}
    >
      <path
        d={path}
        fill="none"
        stroke={strokeColor}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        opacity="0.8"
      />
    </svg>
  );
}
