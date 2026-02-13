import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";

interface LineConfig {
  key: string;
  name: string;
  color: string;
}

interface Props {
  data: Record<string, number>[];
  lines: LineConfig[];
  title: string;
}

const SignalChart = ({ data, lines, title }: Props) => {
  return (
    <Card className="bg-card/50 border-border/50">
      <CardHeader className="pb-2">
        <CardTitle className="text-xs font-mono text-muted-foreground">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={320}>
          <LineChart data={data} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(200, 15%, 15%)" />
            <XAxis
              dataKey="time"
              tick={{ fill: "hsl(200, 10%, 50%)", fontSize: 10, fontFamily: "JetBrains Mono" }}
              tickFormatter={(v: number) => v.toFixed(2)}
              label={{ value: "Time (s)", position: "insideBottom", offset: -2, fill: "hsl(200, 10%, 50%)", fontSize: 10 }}
            />
            <YAxis
              tick={{ fill: "hsl(200, 10%, 50%)", fontSize: 10, fontFamily: "JetBrains Mono" }}
              label={{ value: "Amplitude", angle: -90, position: "insideLeft", fill: "hsl(200, 10%, 50%)", fontSize: 10 }}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: "hsl(220, 18%, 10%)",
                border: "1px solid hsl(200, 15%, 18%)",
                borderRadius: "6px",
                fontSize: 11,
                fontFamily: "JetBrains Mono",
              }}
              labelFormatter={(v: number) => `t = ${Number(v).toFixed(4)}s`}
            />
            <Legend
              wrapperStyle={{ fontSize: 11, fontFamily: "JetBrains Mono" }}
            />
            {lines.map((line) => (
              <Line
                key={line.key}
                type="monotone"
                dataKey={line.key}
                name={line.name}
                stroke={line.color}
                dot={false}
                strokeWidth={1.5}
                strokeOpacity={0.9}
              />
            ))}
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
};

export default SignalChart;
