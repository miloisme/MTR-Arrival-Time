# MTR Arrival Time — 港鐵實時到站

A real-time Hong Kong MTR train arrival tracker built with React + TypeScript + Tailwind CSS. Data sourced from the [MTR Open Data API](https://rt.data.gov.hk).

## Features

- Real-time arrival times for all MTR lines
- Bilingual display (English + Chinese)
- Pin favourite stations for quick access
- Auto-refresh every 60 seconds
- Up / Down direction split view

## Quick Start

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Build

```bash
npm run build
```

Output is in the `dist/` directory, ready for static hosting.

## Data Source

Train arrival data is provided by the [Hong Kong MTR Open Data](https://rt.data.gov.hk) portal. No API key is required.
