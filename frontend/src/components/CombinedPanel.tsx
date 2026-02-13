import { useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import {
  SignalParams, generateSignal, computeDelay, delaySignal,
  dopplerSignal, computeDopplerFrequency, addNoise, lowPassFilter,
  attenuateSignal, attenuationDb, formatDelay, downsampleForChart,
} from "@/lib/signal";
import SignalChart from "@/components/SignalChart";

interface Props {
  signalParams: SignalParams;
  runKey: number;
}

const CombinedPanel = ({ signalParams, runKey }: Props) => {
  const [distanceKm, setDistanceKm] = useState(384400);
  const [velocity, setVelocity] = useState(1000);
  const [noiseStd, setNoiseStd] = useState(0.3);
  const [filterWindow, setFilterWindow] = useState(11);

  const data = useMemo(() => {
    // Step 1: Generate original
    const original = generateSignal(signalParams);

    // Step 2: Attenuate by distance
    const attenuated = attenuateSignal(original, distanceKm);
    const attDb = attenuationDb(distanceKm);

    // Step 3: Apply delay
    const delay = computeDelay(distanceKm);
    const delayed = delaySignal(attenuated, delay, { ...signalParams, amplitude: signalParams.amplitude * Math.pow(1000 / Math.max(1, distanceKm), 1) });

    // Step 4: Apply Doppler shift
    const dopplerFreq = computeDopplerFrequency(signalParams.frequency, velocity);
    const doppler = dopplerSignal({ ...signalParams, amplitude: attenuated.values[Math.floor(attenuated.values.length / 4)] !== 0 ? Math.max(...attenuated.values.map(Math.abs)) : signalParams.amplitude }, velocity);

    // Step 5: Add noise
    const noisy = addNoise(attenuated, noiseStd);

    // Step 6: Filter
    const filtered = lowPassFilter(noisy, filterWindow);

    const origChart = downsampleForChart(original);
    const finalChart = downsampleForChart(filtered);

    const merged = origChart.map((p, i) => ({
      time: p.time,
      original: p.value,
      processed: finalChart[i]?.value ?? 0,
    }));

    return { merged, delay, attDb, dopplerFreq };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [signalParams, distanceKm, velocity, noiseStd, filterWindow, runKey]);

  return (
    <div className="space-y-4">
      <Card className="bg-card/50 border-border/50">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-mono text-signal-delayed">COMBINED SIMULATION</CardTitle>
          <p className="text-xs text-muted-foreground font-mono">
            Attenuation → Delay → Doppler → Noise → Filter — all applied together
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label className="font-mono text-xs text-muted-foreground">
                Distance: <span className="text-foreground">{distanceKm.toLocaleString()} km</span>
              </Label>
              <Slider
                value={[Math.log10(distanceKm)]}
                onValueChange={([v]) => setDistanceKm(Math.round(Math.pow(10, v)))}
                min={2} max={10} step={0.01}
              />
            </div>
            <div className="space-y-2">
              <Label className="font-mono text-xs text-muted-foreground">
                Velocity: <span className="text-foreground">{velocity.toLocaleString()} km/s</span>
              </Label>
              <Slider
                value={[velocity]}
                onValueChange={([v]) => setVelocity(v)}
                min={-50000} max={50000} step={100}
              />
            </div>
            <div className="space-y-2">
              <Label className="font-mono text-xs text-muted-foreground">
                Noise σ: <span className="text-foreground">{noiseStd.toFixed(2)}</span>
              </Label>
              <Slider
                value={[noiseStd]}
                onValueChange={([v]) => setNoiseStd(v)}
                min={0} max={2} step={0.05}
              />
            </div>
            <div className="space-y-2">
              <Label className="font-mono text-xs text-muted-foreground">
                Filter Window: <span className="text-foreground">{filterWindow}</span>
              </Label>
              <Slider
                value={[filterWindow]}
                onValueChange={([v]) => setFilterWindow(v)}
                min={3} max={51} step={2}
              />
            </div>
          </div>

          <div className="flex flex-wrap gap-4 text-xs font-mono border-t border-border/50 pt-3">
            <div><span className="text-muted-foreground">Delay: </span><span className="text-signal-delayed font-semibold">{formatDelay(data.delay)}</span></div>
            <div><span className="text-muted-foreground">Attenuation: </span><span className="text-signal-noisy font-semibold">{data.attDb.toFixed(1)} dB</span></div>
            <div><span className="text-muted-foreground">Doppler Freq: </span><span className="text-accent font-semibold">{data.dopplerFreq.toFixed(4)} Hz</span></div>
          </div>
        </CardContent>
      </Card>

      <SignalChart
        data={data.merged}
        lines={[
          { key: "original", name: "Original (Tx)", color: "hsl(185, 80%, 50%)" },
          { key: "processed", name: "Received (Rx)", color: "hsl(30, 90%, 55%)" },
        ]}
        title="Original Transmitted vs Final Received Signal"
      />
    </div>
  );
};

export default CombinedPanel;
