import { useEffect, useRef } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import type { RegionId } from "../../data/regions";

// RegionId → Serebii slug
const TILE_SLUG: Record<RegionId, string> = {
  witheredWasteland: "witheredwastelands",
  bleakBeach: "bleakbeach",
  rockyRidges: "rockyridges",
  sparklingSkylands: "sparklingskylands",
  paletteTown: "palettetown",
};

// From Serebii's cvert():  x = game_x * (512/2048),  y = game_z * -1 * (512/2048)
// → full map occupies CRS x ∈ [0, 512],  y ∈ [-512, 0]
// → bounds: [[minLat, minLng], [maxLat, maxLng]] = [[-512, 0], [0, 512]]
const MAP_BOUNDS: L.LatLngBoundsExpression = [
  [-512, 0],
  [0, 512],
];

interface Props {
  region: RegionId;
}

export function RegionMap({ region }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const layerRef = useRef<L.TileLayer | null>(null);

  // Initialise map once
  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    const map = L.map(containerRef.current, {
      crs: L.CRS.Simple,
      minZoom: 0,
      maxZoom: 2,
      zoomSnap: 0.5,
      maxBounds: MAP_BOUNDS,
      maxBoundsViscosity: 0.8,
    });

    // Defer fitBounds so Leaflet measures the container after flex layout resolves.
    setTimeout(() => {
      map.invalidateSize();
      map.fitBounds(MAP_BOUNDS, { animate: false });
    }, 50);

    const slug = TILE_SLUG[region];
    const layer = L.tileLayer(`/serebii/maps/${slug}/tile_{z}-{x}-{y}.png`, {
      tileSize: 256,
      minZoom: 0,
      maxZoom: 2,
      noWrap: true,
      attribution:
        'Map tiles © <a href="https://www.serebii.net/pokemonpokopia/locations.shtml" target="_blank" rel="noopener">Serebii.net</a>',
      errorTileUrl:
        "data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7",
    });
    layer.addTo(map);

    mapRef.current = map;
    layerRef.current = layer;

    return () => {
      map.remove();
      mapRef.current = null;
      layerRef.current = null;
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Swap tile layer when region changes
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    // Remove old layer
    if (layerRef.current) {
      map.removeLayer(layerRef.current);
    }

    const slug = TILE_SLUG[region];
    const layer = L.tileLayer(`/serebii/maps/${slug}/tile_{z}-{x}-{y}.png`, {
      tileSize: 256,
      minZoom: 0,
      maxZoom: 2,
      noWrap: true,
      attribution:
        'Map tiles © <a href="https://www.serebii.net/pokemonpokopia/locations.shtml" target="_blank" rel="noopener">Serebii.net</a>',
      errorTileUrl:
        "data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7",
    });
    layer.addTo(map);
    layerRef.current = layer;

    map.fitBounds(MAP_BOUNDS, { animate: false });
  }, [region]);

  return (
    <div style={{ display: "flex", flexDirection: "column", width: "100%", height: "100%" }}>
      <div
        ref={containerRef}
        style={{ flex: "1 1 0", minHeight: 0, width: "100%", background: "#1a1a2e" }}
      />
      <div className="flex shrink-0 items-center justify-between border-t border-[var(--color-border)] bg-[var(--color-panel)] px-3 py-1 text-[10px] text-[var(--color-muted)]">
        <span>Scroll to zoom · Click-drag to pan</span>
        <a
          href="https://www.serebii.net/pokemonpokopia/locations.shtml"
          target="_blank"
          rel="noopener noreferrer"
          className="hover:text-[var(--color-accent)]"
        >
          Maps © Serebii.net
        </a>
      </div>
    </div>
  );
}
