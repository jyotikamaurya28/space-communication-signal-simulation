import { useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import {
  SignalParams, generateSignal, addNoise, lowPassFilter,
  attenuateSignal, attenuationDb, computeSNR, estimateBER, downsampleForChart,
} from "@/lib/signal";
import SignalChart from "@/components/SignalChart";
import { BarChart3, Signal, AlertTriangle, ShieldCheck } from "lucide-react";

interface Props {
  signalParams: SignalParams;
  runKey: number;
}

const MetricsPanel = ({ signalParams, runKey }: Props) => {
  const [distanceKm, setDistanceKm] = useState(384400);
  const [noiseStd, setNoiseStd] = useState(0.5);
  const [filterWindow, setFilterWindow] = useState(15);

  const data = useMemo(() => {
    const original = generateSignal(signalParams);
    const attenuated = attenuateSignal(original, distanceKm);
    const noisy = addNoise(attenuated, noiseStd);
    const filtered = lowPassFilter(noisy, filterWindow);

    const snrNoisy = computeSNR(attenuated, noisy);
    const snrFiltered = computeSNR(attenuated, filtered);
    const berNoisy = estimateBER(snrNoisy);
    const berFiltered = estimateBER(snrFiltered);
    const attDb = attenuationDb(distanceKm);

    const origChart = downsampleForChart(original);
    const attChart = downsampleForChart(attenuated);

    const attMerged = origChart.map((p, i) => ({
      time: p.time,
      original: p.value,
      attenuated: attChart[i]?.value ?? 0,
    }));

    return { snrNoisy, snrFiltered, berNoisy, berFiltered, attDb, attMerged };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [signalParams, distanceKm, noiseStd, filterWindow, runKey]);

  const snrColor = (snr: number) => snr > 20 ? "text-signal-filtered" : snr > 10 ? "text-signal-delayed" : "text-signal-noisy";
  const berStatus = (ber: number) => ber < 1e-6 ? "Excellent" : ber < 1e-3 ? "Good" : ber < 0.01 ? "Fair" : "Poor";

  return (
    <div className="space-y-4">
      {/* Controls */}
      <Card className="bg-card/50 border-border/50">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-mono text-signal-filtered flex items-center gap-2">
            <BarChart3 className="w-4 h-4" /> SIGNAL METRICS DASHBOARD
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
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
                Noise σ: <span className="text-foreground">{noiseStd.toFixed(2)}</span>
              </Label>
              <Slider
                value={[noiseStd]}
                onValueChange={([v]) => setNoiseStd(v)}
                min={0} max={3} step={0.05}
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
        </CardContent>
      </Card>

      {/* Metrics Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <Card className="bg-card/50 border-border/50">
          <CardContent className="p-4 text-center space-y-1">
            <Signal className="w-5 h-5 mx-auto text-muted-foreground" />
            <p className="text-xs font-mono text-muted-foreground">Attenuation</p>
            <p className="text-lg font-mono font-bold text-signal-noisy">{data.attDb.toFixed(1)} dB</p>
          </CardContent>
        </Card>
        <Card className="bg-card/50 border-border/50">
          <CardContent className="p-4 text-center space-y-1">
            <BarChart3 className="w-5 h-5 mx-auto text-muted-foreground" />
            <p className="text-xs font-mono text-muted-foreground">SNR (noisy)</p>
            <p className={`text-lg font-mono font-bold ${snrColor(data.snrNoisy)}`}>
              {isFinite(data.snrNoisy) ? `${data.snrNoisy.toFixed(1)} dB` : "∞"}
            </p>
          </CardContent>
        </Card>
        <Card className="bg-card/50 border-border/50">
          <CardContent className="p-4 text-center space-y-1">
            <ShieldCheck className="w-5 h-5 mx-auto text-muted-foreground" />
            <p className="text-xs font-mono text-muted-foreground">SNR (filtered)</p>
            <p className={`text-lg font-mono font-bold ${snrColor(data.snrFiltered)}`}>
              {isFinite(data.snrFiltered) ? `${data.snrFiltered.toFixed(1)} dB` : "∞"}
            </p>
          </CardContent>
        </Card>
        <Card className="bg-card/50 border-border/50">
          <CardContent className="p-4 text-center space-y-1">
            <AlertTriangle className="w-5 h-5 mx-auto text-muted-foreground" />
            <p className="text-xs font-mono text-muted-foreground">BER (filtered)</p>
            <p className="text-lg font-mono font-bold text-accent">
              {data.berFiltered < 1e-15 ? "< 1e-15" : data.berFiltered.toExponential(2)}
            </p>
            <p className="text-xs font-mono text-muted-foreground">{berStatus(data.berFiltered)}</p>
          </CardContent>
        </Card>
      </div>

      {/* Attenuation Chart */}
      <SignalChart
        data={data.attMerged}
        lines={[
          { key: "original", name: "Original", color: "hsl(185, 80%, 50%)" },
          { key: "attenuated", name: "Attenuated", color: "hsl(0, 60%, 55%)" },
        ]}
        title="Signal Attenuation (Inverse Square Law)"
      />
    </div>
  );
};

export default MetricsPanel;
