import { useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { SignalParams, generateSignal, computeDelay, delaySignal, formatDelay, downsampleForChart } from "@/lib/signal";
import SignalChart from "@/components/SignalChart";

interface Props {
  signalParams: SignalParams;
  runKey: number;
}

const PRESETS = [
  { label: "ISS", km: 408 },
  { label: "Moon", km: 384400 },
  { label: "Mars (min)", km: 54600000 },
  { label: "Mars (max)", km: 401000000 },
  { label: "Jupiter", km: 588000000 },
];

const DelayPanel = ({ signalParams, runKey }: Props) => {
  const [distanceKm, setDistanceKm] = useState(384400); // Moon

  const data = useMemo(() => {
    const original = generateSignal(signalParams);
    const delay = computeDelay(distanceKm);
    const delayed = delaySignal(original, delay, signalParams);

    const origChart = downsampleForChart(original);
    const delChart = downsampleForChart(delayed);

    // Merge into single array
    const merged = origChart.map((p, i) => ({
      time: p.time,
      original: p.value,
      delayed: delChart[i]?.value ?? 0,
    }));

    return { merged, delay };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [signalParams, distanceKm, runKey]);

  return (
    <div className="space-y-4">
      <Card className="bg-card/50 border-border/50">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-mono text-primary">DISTANCE-BASED DELAY</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label className="font-mono text-xs text-muted-foreground">
              Distance: <span className="text-foreground">{distanceKm.toLocaleString()} km</span>
            </Label>
            <Slider
              value={[Math.log10(distanceKm)]}
              onValueChange={([v]) => setDistanceKm(Math.round(Math.pow(10, v)))}
              min={2}
              max={10}
              step={0.01}
            />
          </div>
          <div className="flex flex-wrap gap-2">
            {PRESETS.map((p) => (
              <button
                key={p.label}
                onClick={() => setDistanceKm(p.km)}
                className="px-3 py-1 text-xs font-mono rounded-md bg-secondary border border-border/50 text-secondary-foreground hover:bg-primary/10 hover:text-primary transition-colors"
              >
                {p.label}
              </button>
            ))}
          </div>
          <div className="flex gap-6 text-xs font-mono">
            <div>
              <span className="text-muted-foreground">Signal Delay: </span>
              <span className="text-signal-delayed font-semibold">{formatDelay(data.delay)}</span>
            </div>
            <div>
              <span className="text-muted-foreground">Round Trip: </span>
              <span className="text-signal-delayed font-semibold">{formatDelay(data.delay * 2)}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      <SignalChart
        data={data.merged}
        lines={[
          { key: "original", name: "Original", color: "hsl(185, 80%, 50%)" },
          { key: "delayed", name: "Delayed", color: "hsl(30, 90%, 55%)" },
        ]}
        title="Original vs Delayed Signal"
      />
    </div>
  );
};

export default DelayPanel;
