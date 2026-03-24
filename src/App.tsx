import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Train, Clock, MapPin, RefreshCw, ChevronRight, Info, Star } from 'lucide-react';
import { MTR_LINES, MTR_STATIONS, STATION_NAME_MAP } from './constants';
import { fetchMTRSchedule } from './services/mtrService';
import { MTRScheduleResponse, TrainArrival } from './types';

interface PinnedStation {
  lineCode: string;
  stationCode: string;
}

export default function App() {
  const [pinned, setPinned] = useState<PinnedStation[]>(() => {
    try {
      const saved = localStorage.getItem('mtr_pinned');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [selectedLine, setSelectedLine] = useState(MTR_LINES[0]);
  const [selectedStation, setSelectedStation] = useState(MTR_STATIONS[MTR_LINES[0].code][0]);
  const [schedule, setSchedule] = useState<MTRScheduleResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [initialLoadDone, setInitialLoadDone] = useState(false);

  // Load pinned on mount
  useEffect(() => {
    if (pinned.length > 0 && !initialLoadDone) {
      const firstPinned = pinned[0];
      const line = MTR_LINES.find(l => l.code === firstPinned.lineCode);
      const station = MTR_STATIONS[firstPinned.lineCode]?.find(s => s.code === firstPinned.stationCode);
      if (line && station) {
        setSelectedLine(line);
        setSelectedStation(station);
      }
    }
    setInitialLoadDone(true);
  }, [pinned, initialLoadDone]);

  // Save pinned to localStorage
  useEffect(() => {
    localStorage.setItem('mtr_pinned', JSON.stringify(pinned));
  }, [pinned]);

  const loadSchedule = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchMTRSchedule(selectedLine.code, selectedStation.code);
      if (data.status === 1) {
        setSchedule(data);
        setLastUpdated(new Date());
      } else if (data.status === 0) {
        if (data.data && Object.keys(data.data).length > 0) {
          setSchedule(data);
          setLastUpdated(new Date());
        } else {
          setError(data.message || 'No schedule data available.');
        }
      } else {
        setError('Failed to load train arrival data. Please try again later.');
      }
    } catch (err) {
      setError('Failed to load train arrival data. Please try again later.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [selectedLine.code, selectedStation.code]);

  useEffect(() => {
    if (initialLoadDone) {
      loadSchedule();
      const interval = setInterval(loadSchedule, 60000); // Refresh every minute
      return () => clearInterval(interval);
    }
  }, [loadSchedule, initialLoadDone]);

  const handleLineChange = (line: typeof MTR_LINES[0]) => {
    setSelectedLine(line);
    setSelectedStation(MTR_STATIONS[line.code][0]);
  };

  const togglePin = () => {
    setPinned(prev => {
      const isPinned = prev.some(p => p.lineCode === selectedLine.code && p.stationCode === selectedStation.code);
      if (isPinned) {
        return prev.filter(p => !(p.lineCode === selectedLine.code && p.stationCode === selectedStation.code));
      } else {
        return [...prev, { lineCode: selectedLine.code, stationCode: selectedStation.code }];
      }
    });
  };

  const isCurrentlyPinned = pinned.some(p => p.lineCode === selectedLine.code && p.stationCode === selectedStation.code);

  const renderArrivalList = (arrivals: TrainArrival[] | undefined, direction: string) => {
    if (!arrivals || arrivals.length === 0) {
      return (
        <div className="text-zinc-500 italic py-4 text-center">
          No upcoming trains scheduled.
        </div>
      );
    }

    return (
      <div className="space-y-3">
        {arrivals.map((train, idx) => (
          <motion.div
            key={`${train.dest}-${train.time}-${idx}`}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: idx * 0.1 }}
            className="flex items-center justify-between p-4 bg-white/50 backdrop-blur-sm rounded-xl border border-zinc-200 shadow-sm hover:shadow-md transition-shadow"
          >
            <div className="flex flex-col">
              <span className="text-xs font-bold text-zinc-400 uppercase tracking-wider mb-1">
                To {direction === 'UP' ? 'Up' : 'Down'} Destination
              </span>
              <span className="text-lg font-bold text-zinc-800">
                {STATION_NAME_MAP[train.dest]?.zh || train.dest}
                <span className="text-sm font-normal text-zinc-500 ml-2">
                  {STATION_NAME_MAP[train.dest]?.en}
                </span>
              </span>
              <span className="text-xs text-zinc-500 mt-1">
                Platform {train.plat}
              </span>
            </div>
            <div className="flex flex-col items-end">
              <span className="text-2xl font-black text-zinc-900 font-mono">
                {train.ttnt === '0' ? 'Arriving' : `${train.ttnt} min`}
              </span>
              <span className="text-xs text-zinc-400 mt-1">
                {train.time.split(' ')[1]}
              </span>
            </div>
          </motion.div>
        ))}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-[#F8F9FA] text-zinc-900 font-sans selection:bg-zinc-200">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-zinc-200 px-6 py-4">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-zinc-900 p-2 rounded-lg">
              <Train className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-black tracking-tight uppercase">MTR Arrival</h1>
              <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Real-time Tracker</p>
            </div>
          </div>
          <button
            onClick={loadSchedule}
            disabled={loading}
            className="p-2 hover:bg-zinc-100 rounded-full transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`w-5 h-5 text-zinc-600 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-6 py-8 space-y-8">
        {/* Pinned Stations */}
        {pinned.length > 0 && (
          <section>
            <div className="flex items-center gap-2 mb-4">
              <Star className="w-4 h-4 text-amber-400 fill-amber-400" />
              <h2 className="text-xs font-bold text-zinc-400 uppercase tracking-widest">Pinned Stations</h2>
            </div>
            <div className="flex flex-wrap gap-2">
              {pinned.map(p => {
                const line = MTR_LINES.find(l => l.code === p.lineCode);
                const station = MTR_STATIONS[p.lineCode]?.find(s => s.code === p.stationCode);
                if (!line || !station) return null;
                const isSelected = selectedLine.code === p.lineCode && selectedStation.code === p.stationCode;
                return (
                  <button
                    key={`${p.lineCode}-${p.stationCode}`}
                    onClick={() => {
                      setSelectedLine(line);
                      setSelectedStation(station);
                    }}
                    className={`px-4 py-2 rounded-full text-sm font-bold transition-all flex items-center gap-2 ${
                      isSelected
                        ? 'bg-amber-400 text-amber-950 shadow-md'
                        : 'bg-white text-zinc-600 border border-zinc-200 hover:border-amber-400 hover:text-amber-900'
                    }`}
                  >
                    <div className="w-2 h-2 rounded-full" style={{ backgroundColor: line.color }} />
                    {station.nameZh}
                  </button>
                );
              })}
            </div>
          </section>
        )}

        {/* Line Selection */}
        <section>
          <div className="flex items-center gap-2 mb-4">
            <ChevronRight className="w-4 h-4 text-zinc-400" />
            <h2 className="text-xs font-bold text-zinc-400 uppercase tracking-widest">Select Line</h2>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
            {MTR_LINES.map((line) => (
              <button
                key={line.code}
                onClick={() => handleLineChange(line)}
                className={`relative overflow-hidden p-4 rounded-2xl border-2 transition-all group ${
                  selectedLine.code === line.code
                    ? 'border-zinc-900 bg-white shadow-lg scale-[1.02]'
                    : 'border-transparent bg-white/50 hover:bg-white hover:border-zinc-200'
                }`}
              >
                <div 
                  className="absolute top-0 left-0 w-full h-1.5" 
                  style={{ backgroundColor: line.color }}
                />
                <div className="flex flex-col items-start gap-1">
                  <span className="text-[10px] font-bold text-zinc-400 uppercase">{line.code}</span>
                  <span className="text-sm font-bold leading-tight">{line.nameZh}</span>
                  <span className="text-[10px] text-zinc-500 leading-tight">{line.nameEn}</span>
                </div>
              </button>
            ))}
          </div>
        </section>

        {/* Station Selection */}
        <section>
          <div className="flex items-center gap-2 mb-4">
            <ChevronRight className="w-4 h-4 text-zinc-400" />
            <h2 className="text-xs font-bold text-zinc-400 uppercase tracking-widest">Select Station</h2>
          </div>
          <div className="flex flex-wrap gap-2">
            {MTR_STATIONS[selectedLine.code].map((station) => (
              <button
                key={station.code}
                onClick={() => setSelectedStation(station)}
                className={`px-4 py-2 rounded-full text-sm font-bold transition-all ${
                  selectedStation.code === station.code
                    ? 'bg-zinc-900 text-white shadow-md'
                    : 'bg-white text-zinc-600 border border-zinc-200 hover:border-zinc-400'
                }`}
              >
                {station.nameZh}
              </button>
            ))}
          </div>
        </section>

        {/* Arrival Times */}
        <section className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full flex items-center justify-center bg-zinc-100">
                <MapPin className="w-5 h-5 text-zinc-600" />
              </div>
              <div>
                <h3 className="text-2xl font-black text-zinc-900">
                  {selectedStation.nameZh}
                  <span className="text-lg font-normal text-zinc-400 ml-2">{selectedStation.nameEn}</span>
                </h3>
                {lastUpdated && (
                  <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest mt-1">
                    Last Updated: {lastUpdated.toLocaleTimeString()}
                  </p>
                )}
              </div>
            </div>
            <button
              onClick={togglePin}
              className={`p-3 rounded-full transition-colors ${
                isCurrentlyPinned ? 'bg-amber-100 text-amber-500 hover:bg-amber-200' : 'bg-zinc-100 text-zinc-400 hover:bg-zinc-200 hover:text-zinc-600'
              }`}
              title={isCurrentlyPinned ? "Unpin station" : "Pin station"}
            >
              <Star className={`w-6 h-6 ${isCurrentlyPinned ? 'fill-amber-500' : ''}`} />
            </button>
          </div>

          {error ? (
            <div className="p-6 bg-red-50 border border-red-100 rounded-3xl flex items-center gap-4 text-red-600">
              <Info className="w-6 h-6 shrink-0" />
              <p className="font-bold">{error}</p>
            </div>
          ) : (
            <div className="grid md:grid-cols-2 gap-8">
              {/* Up Direction */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 px-2">
                  <div className="w-2 h-2 rounded-full bg-emerald-500" />
                  <h4 className="text-xs font-black text-zinc-400 uppercase tracking-widest">Up Direction</h4>
                </div>
                {loading ? (
                  <div className="space-y-3 animate-pulse">
                    {[1, 2, 3].map(i => <div key={i} className="h-20 bg-zinc-200 rounded-xl" />)}
                  </div>
                ) : (
                  renderArrivalList(schedule?.data?.[`${selectedLine.code}-${selectedStation.code}`]?.UP, 'UP')
                )}
              </div>

              {/* Down Direction */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 px-2">
                  <div className="w-2 h-2 rounded-full bg-blue-500" />
                  <h4 className="text-xs font-black text-zinc-400 uppercase tracking-widest">Down Direction</h4>
                </div>
                {loading ? (
                  <div className="space-y-3 animate-pulse">
                    {[1, 2, 3].map(i => <div key={i} className="h-20 bg-zinc-200 rounded-xl" />)}
                  </div>
                ) : (
                  renderArrivalList(schedule?.data?.[`${selectedLine.code}-${selectedStation.code}`]?.DOWN, 'DOWN')
                )}
              </div>
            </div>
          )}
        </section>
      </main>

      {/* Footer */}
      <footer className="max-w-5xl mx-auto px-6 py-12 border-t border-zinc-200 text-center space-y-4">
        <div className="flex items-center justify-center gap-4 text-zinc-400">
          <Clock className="w-4 h-4" />
          <span className="text-[10px] font-bold uppercase tracking-widest">Data provided by MTR Open Data</span>
        </div>
        <p className="text-[10px] text-zinc-400 leading-relaxed max-w-md mx-auto">
          Real-time train arrival information is subject to change. Please refer to MTR station displays for the most accurate information.
        </p>
      </footer>
    </div>
  );
}
