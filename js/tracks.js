// RF1 — Official Formula 1 Track Data & Vector Outlines
(function(root) {
  'use strict';

  const TRACKS = [
    {
      id: 'silverstone',
      name: 'Silverstone Circuit',
      gp: 'BRITISH GP',
      flag: '🇬🇧',
      country: 'GBR',
      year: '2024',
      laps: 52,
      length: '5.891 km',
      topSpeed: 338,
      lapTimeSec: 85,
      // Iconic Silverstone layout: Club, Abbey, Farm, Village, The Loop, Brooklands, Copse, Maggotts, Becketts, Chapel, Hangar Straight, Stowe
      svgPath: 'M 22,82 C 16,74 14,56 16,42 C 18,32 30,22 45,18 C 65,14 82,20 88,28 C 92,34 88,44 78,50 C 72,54 75,60 84,66 C 90,72 82,82 68,84 C 54,86 42,88 32,86 Z'
    },
    {
      id: 'monaco',
      name: 'Circuit de Monaco',
      gp: 'MONACO GP',
      flag: '🇲🇨',
      country: 'MON',
      year: '2024',
      laps: 78,
      length: '3.337 km',
      topSpeed: 290,
      lapTimeSec: 72,
      // Ste Devote, Beau Rivage, Massenet, Casino, Mirabeau, Fairmont Hairpin, Portier, Tunnel, Chicane, Tabac, Swimming Pool, Rascasse
      svgPath: 'M 35,84 C 22,82 14,70 16,52 C 18,34 28,24 44,18 C 62,14 74,18 80,28 C 86,38 88,48 82,58 C 76,68 64,74 54,78 C 44,82 40,84 35,84 Z'
    },
    {
      id: 'spa',
      name: 'Circuit de Spa-Francorchamps',
      gp: 'BELGIAN GP',
      flag: '🇧🇪',
      country: 'BEL',
      year: '2024',
      laps: 44,
      length: '7.004 km',
      topSpeed: 345,
      lapTimeSec: 104,
      // La Source, Eau Rouge, Raidillon, Kemmel Straight, Les Combes, Bruxelles, Pouhon, Campus, Stavelot, Blanchimont, Bus Stop
      svgPath: 'M 20,78 C 18,60 22,44 26,30 C 30,18 44,14 62,16 C 78,18 86,28 84,42 C 82,56 74,66 62,74 C 48,82 32,84 20,78 Z'
    },
    {
      id: 'monza',
      name: 'Autodromo Nazionale Monza',
      gp: 'ITALIAN GP',
      flag: '🇮🇹',
      country: 'ITA',
      year: '2024',
      laps: 53,
      length: '5.793 km',
      topSpeed: 356,
      lapTimeSec: 80,
      // Rettifilo, Curva Grande, Variante della Roggia, Lesmo 1 & 2, Serraglio, Variante Ascari, Rettifilo Centrale, Curva Parabolica
      svgPath: 'M 18,84 C 16,68 18,40 22,26 C 26,16 42,14 62,14 C 80,14 86,26 84,48 C 82,70 76,84 56,86 C 36,88 22,86 18,84 Z'
    },
    {
      id: 'austria',
      name: 'Red Bull Ring',
      gp: 'AUSTRIAN GP',
      flag: '🇦🇹',
      country: 'AUT',
      year: '2024',
      laps: 71,
      length: '4.318 km',
      topSpeed: 328,
      lapTimeSec: 66,
      // Castrol, Remus, Rauch, Wurth, Jochen Rindt, Red Bull Mobile
      svgPath: 'M 25,80 C 20,60 22,38 28,24 C 36,16 54,16 72,20 C 82,24 84,44 76,64 C 68,78 48,84 25,80 Z'
    },
    {
      id: 'abudhabi',
      name: 'Yas Marina Circuit',
      gp: 'ABU DHABI GP',
      flag: '🇦🇪',
      country: 'UAE',
      year: '2024',
      laps: 58,
      length: '5.281 km',
      topSpeed: 332,
      lapTimeSec: 86,
      // Turn 1, Back Straight, Chicane, Marina complex, Hotel underpass
      svgPath: 'M 20,82 C 16,64 18,44 26,28 C 36,18 60,18 78,24 C 88,32 86,52 78,70 C 68,82 42,86 20,82 Z'
    }
  ];

  const TrackManager = {
    getAllTracks() {
      return TRACKS;
    },

    getTrackById(id) {
      return TRACKS.find(t => t.id === id) || TRACKS[0];
    },

    getDefaultTrack() {
      return TRACKS[0]; // Silverstone
    }
  };

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = TrackManager;
  } else {
    root.TrackManager = TrackManager;
  }
})(typeof window !== 'undefined' ? window : globalThis);
