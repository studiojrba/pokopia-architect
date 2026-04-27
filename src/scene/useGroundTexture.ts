import { useLoader } from "@react-three/fiber";
import * as THREE from "three";
import type { RegionId } from "../data/regions";

const TILE_SLUG: Record<RegionId, string> = {
  witheredWasteland: "witheredwastelands",
  bleakBeach: "bleakbeach",
  rockyRidges: "rockyridges",
  sparklingSkylands: "sparklingskylands",
  paletteTown: "palettetown",
};

export function useGroundTexture(region: RegionId): THREE.Texture {
  const slug = TILE_SLUG[region];
  const texture = useLoader(THREE.TextureLoader, `/serebii/maps/${slug}/map.jpg`);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}
