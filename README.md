# Heat Diffusion Simulator GUI

A real-time heat diffusion simulation with material region editing capabilities. This project allows users to create custom materials with different thermal properties and visualize how heat propagates through them.

## Features

- **Interactive Heat Simulation**: Real-time visualization of heat diffusion across a 2D grid
- **Material Editor**: Draw custom material regions with different diffusivity properties
  - Rectangle tool for creating rectangular regions
  - Ellipse tool for creating circular/elliptical regions
- **Custom Boundary Conditions**: Set different temperatures for each edge of the simulation
- **Playback Controls**: Play, pause, and scrub through simulation frames
- **Data Analysis**: View temperature statistics and trends over time

## Tech Stack

- React + TypeScript
- HTML5 Canvas for rendering
- Custom hooks for state management

## Usage

## Project Structure

```
├── src/
│   ├── components/
│   │   ├── SimulationCanvas.tsx    # Main canvas rendering
│   │   ├── MaterialToolbar.tsx     # Material editing controls
│   │   ├── SimulationSetup.tsx     # Simulation configuration
│   │   └── ...
│   ├── lib/
│   │   ├── api.ts                  # API client functions
│   │   ├── canvas.ts               # Canvas rendering helpers
│   │   ├── types.ts                # TypeScript type definitions
│   │   └── utils.ts                # Utility functions
│   └── App.tsx                     # Main application component
└── README.md
```
## Demo
[demo-GUI.webm](https://github.com/user-attachments/assets/b22bb253-3378-4fb7-8e86-81efdb765f33)


## Acknowledgments

- Heat diffusion equation implementation
- Canvas rendering techniques
- React best practices
