import { useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { SignalParams, generateSignal, dopplerSignal, computeDopplerFrequency, downsampleForChart } from "@/lib/signal";
import SignalChart from "@/components/SignalChart";

interface Props {
  signalParams: SignalParams;
  runKey: number;
}

const DopplerPanel = ({ signalParams, runKey }: Props) => {
  const [velocity, setVelocity] = useState(1000); // km/s

  const data = useMemo(() => {
    const original = generateSignal(signalParams);
    const doppler = dopplerSignal(signalParams, velocity);
    const shiftedFreq = computeDopplerFrequency(signalParams.frequency, velocity);

    const origChart = downsampleForChart(original);
    const dopChart = downsampleForChart(doppler);

    const merged = origChart.map((p, i) => ({
      time: p.time,
      original: p.value,
      doppler: dopChart[i]?.value ?? 0,
    }));

    return { merged, shiftedFreq };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [signalParams, velocity, runKey]);

  return (
    <div className="space-y-4">
      <Card className="bg-card/50 border-border/50">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-mono text-accent">DOPPLER EFFECT</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label className="font-mono text-xs text-muted-foreground">
              Relative Velocity: <span className="text-foreground">{velocity.toLocaleString()} km/s</span>
              <span className="text-muted-foreground ml-2">({(velocity / 299792.458 * 100).toFixed(3)}% c)</span>
            </Label>
            <Slider
              value={[velocity]}
              onValueChange={([v]) => setVelocity(v)}
              min={-100000}
              max={100000}
              step={100}
            />
            <p className="text-xs text-muted-foreground font-mono">
              Negative = approaching · Positive = receding
            </p>
          </div>
          <div className="flex gap-6 text-xs font-mono">
            <div>
              <span className="text-muted-foreground">Original Freq: </span>
              <span className="text-primary font-semibold">{signalParams.frequency.toFixed(2)} Hz</span>
            </div>
            <div>
              <span className="text-muted-foreground">Shifted Freq: </span>
              <span className="text-accent font-semibold">{data.shiftedFreq.toFixed(4)} Hz</span>
            </div>
            <div>
              <span className="text-muted-foreground">Shift: </span>
              <span className="text-accent font-semibold">
                {(data.shiftedFreq - signalParams.frequency) > 0 ? "+" : ""}
                {(data.shiftedFreq - signalParams.frequency).toFixed(4)} Hz
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      <SignalChart
        data={data.merged}
        lines={[
          { key: "original", name: "Original", color: "hsl(185, 80%, 50%)" },
          { key: "doppler", name: "Doppler Shifted", color: "hsl(260, 60%, 55%)" },
        ]}
        title="Original vs Doppler-Shifted Signal"
      />
    </div>
  );
};

export default DopplerPanel;
