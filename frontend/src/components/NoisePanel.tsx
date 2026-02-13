import { useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { SignalParams, generateSignal, addNoise, lowPassFilter, downsampleForChart } from "@/lib/signal";
import SignalChart from "@/components/SignalChart";

interface Props {
  signalParams: SignalParams;
  runKey: number;
}

const NoisePanel = ({ signalParams, runKey }: Props) => {
  const [noiseStd, setNoiseStd] = useState(0.5);
  const [filterWindow, setFilterWindow] = useState(15);

  const data = useMemo(() => {
    const original = generateSignal(signalParams);
    const noisy = addNoise(original, noiseStd);
    const filtered = lowPassFilter(noisy, filterWindow);

    const origChart = downsampleForChart(original);
    const noisyChart = downsampleForChart(noisy);
    const filtChart = downsampleForChart(filtered);

    const merged = origChart.map((p, i) => ({
      time: p.time,
      original: p.value,
      noisy: noisyChart[i]?.value ?? 0,
      filtered: filtChart[i]?.value ?? 0,
    }));

    return { merged };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [signalParams, noiseStd, filterWindow, runKey]);

  return (
    <div className="space-y-4">
      <Card className="bg-card/50 border-border/50">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-mono text-signal-filtered">NOISE & FILTERING</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label className="font-mono text-xs text-muted-foreground">
                Noise Std Dev: <span className="text-foreground">{noiseStd.toFixed(2)}</span>
              </Label>
              <Slider
                value={[noiseStd]}
                onValueChange={([v]) => setNoiseStd(v)}
                min={0}
                max={3}
                step={0.05}
              />
            </div>
            <div className="space-y-2">
              <Label className="font-mono text-xs text-muted-foreground">
                Filter Window: <span className="text-foreground">{filterWindow} samples</span>
              </Label>
              <Slider
                value={[filterWindow]}
                onValueChange={([v]) => setFilterWindow(v)}
                min={3}
                max={51}
                step={2}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <SignalChart
        data={data.merged}
        lines={[
          { key: "original", name: "Original", color: "hsl(185, 80%, 50%)" },
          { key: "noisy", name: "Noisy", color: "hsl(0, 60%, 55%)" },
          { key: "filtered", name: "Filtered", color: "hsl(140, 60%, 50%)" },
        ]}
        title="Signal: Original → Noisy → Filtered"
      />
    </div>
  );
};

export default NoisePanel;
