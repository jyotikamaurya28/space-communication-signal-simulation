import { SignalParams, SignalType } from "@/lib/signal";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Zap } from "lucide-react";

interface Props {
  params: SignalParams;
  onChange: (p: SignalParams) => void;
}

const SIGNAL_TYPES: { value: SignalType; label: string }[] = [
  { value: "sine", label: "Sine" },
  { value: "square", label: "Square" },
  { value: "sawtooth", label: "Sawtooth" },
  { value: "pulse", label: "Pulse" },
];

const SignalGeneratorPanel = ({ params, onChange }: Props) => {
  const update = (key: keyof SignalParams, value: number | string) => {
    onChange({ ...params, [key]: value });
  };

  return (
    <Card className="bg-card/50 border-border/50 glow-primary">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-mono flex items-center gap-2 text-primary">
          <Zap className="w-4 h-4" />
          SIGNAL GENERATOR
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Signal Type Selector */}
        <div className="space-y-2">
          <Label className="font-mono text-xs text-muted-foreground">Signal Type</Label>
          <div className="flex gap-2">
            {SIGNAL_TYPES.map((st) => (
              <button
                key={st.value}
                onClick={() => update("signalType", st.value)}
                className={`px-3 py-1.5 text-xs font-mono rounded-md border transition-colors ${
                  params.signalType === st.value
                    ? "bg-primary/20 border-primary text-primary"
                    : "bg-secondary border-border/50 text-secondary-foreground hover:bg-primary/10 hover:text-primary"
                }`}
              >
                {st.label}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="space-y-2">
            <Label className="font-mono text-xs text-muted-foreground">
              Frequency: <span className="text-foreground">{params.frequency} Hz</span>
            </Label>
            <Slider
              value={[params.frequency]}
              onValueChange={([v]) => update("frequency", v)}
              min={1}
              max={50}
              step={0.5}
              className="[&_[role=slider]]:bg-primary [&_[role=slider]]:border-primary"
            />
          </div>
          <div className="space-y-2">
            <Label className="font-mono text-xs text-muted-foreground">
              Amplitude: <span className="text-foreground">{params.amplitude.toFixed(1)}</span>
            </Label>
            <Slider
              value={[params.amplitude]}
              onValueChange={([v]) => update("amplitude", v)}
              min={0.1}
              max={5}
              step={0.1}
            />
          </div>
          <div className="space-y-2">
            <Label className="font-mono text-xs text-muted-foreground">
              Duration: <span className="text-foreground">{params.duration.toFixed(1)} s</span>
            </Label>
            <Slider
              value={[params.duration]}
              onValueChange={([v]) => update("duration", v)}
              min={0.1}
              max={3}
              step={0.1}
            />
          </div>
          <div className="space-y-2">
            <Label className="font-mono text-xs text-muted-foreground">
              Sample Rate: <span className="text-foreground">{params.samplingRate} Hz</span>
            </Label>
            <Slider
              value={[params.samplingRate]}
              onValueChange={([v]) => update("samplingRate", v)}
              min={200}
              max={5000}
              step={100}
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default SignalGeneratorPanel;
