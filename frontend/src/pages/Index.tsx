import { useState, useCallback } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Radio, Waves, Volume2, Zap, Layers, BarChart3 } from "lucide-react";
import { SignalParams } from "@/lib/signal";
import SignalGeneratorPanel from "@/components/SignalGeneratorPanel";
import DelayPanel from "@/components/DelayPanel";
import DopplerPanel from "@/components/DopplerPanel";
import NoisePanel from "@/components/NoisePanel";
import CombinedPanel from "@/components/CombinedPanel";
import MetricsPanel from "@/components/MetricsPanel";

const Index = () => {
  const [signalParams, setSignalParams] = useState<SignalParams>({
    frequency: 5,
    amplitude: 1,
    duration: 1,
    samplingRate: 1000,
    signalType: "sine",
  });

  const [runKey, setRunKey] = useState(0);
  const handleRun = useCallback(async () => {
  try {
    console.log("Running Simulation...");

    const response = await fetch("http://127.0.0.1:8000/simulate", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        frequency: signalParams.frequency,
        distance: 1000000,
        velocity: 2000,
        noise: 0.2,
      }),
    });

    const data = await response.json();

    console.log("Backend Data:", data);

    setRunKey((k) => k + 1);

  } catch (error) {
    console.error("Simulation error:", error);
  }
}, []);   

  return (
    <div className="min-h-screen grid-bg">
      <header className="border-b border-border/50 px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-primary/10 glow-primary flex items-center justify-center">
              <Radio className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h1 className="text-lg font-semibold font-mono tracking-tight text-foreground glow-text">
                SPACE COMM SIM
              </h1>
              <p className="text-xs text-muted-foreground font-mono">
                Signal Delay · Doppler · Noise · Attenuation
              </p>
            </div>
          </div>

          <Button onClick={handleRun} className="font-mono text-sm gap-2">
            <Zap className="w-4 h-4" />
            Run Simulation
          </Button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto p-6 space-y-6">
        <SignalGeneratorPanel
          params={signalParams}
          onChange={setSignalParams}
        />

        <Tabs defaultValue="delay" className="space-y-4">
          <TabsList className="bg-secondary/50 border border-border/50 flex-wrap h-auto gap-1 p-1">
            <TabsTrigger value="delay">Delay</TabsTrigger>
            <TabsTrigger value="doppler">Doppler</TabsTrigger>
            <TabsTrigger value="noise">Noise & Filter</TabsTrigger>
            <TabsTrigger value="combined">Combined</TabsTrigger>
            <TabsTrigger value="metrics">Metrics</TabsTrigger>
          </TabsList>

          <TabsContent value="delay">
            <DelayPanel signalParams={signalParams} runKey={runKey} />
          </TabsContent>

          <TabsContent value="doppler">
            <DopplerPanel signalParams={signalParams} runKey={runKey} />
          </TabsContent>

          <TabsContent value="noise">
            <NoisePanel signalParams={signalParams} runKey={runKey} />
          </TabsContent>

          <TabsContent value="combined">
            <CombinedPanel signalParams={signalParams} runKey={runKey} />
          </TabsContent>

          <TabsContent value="metrics">
            <MetricsPanel signalParams={signalParams} runKey={runKey} />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default Index;
