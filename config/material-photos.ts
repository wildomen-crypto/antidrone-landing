import type { MaterialId } from "@/lib/configuration/schema";

type MaterialPhoto = Readonly<{ image: string; alt: string }>;

// Original photorealistic illustrations created with built-in ImageGen.
// Prompt set and saved outputs: docs/generated-materials-prompts.json.
export const materialPhotos = {
  "M1": {
    "image": "/images/materials/polymer-net-generated.png",
    "alt": "Фотореалистичная визуализация полимерной сети с квадратными ячейками и узлами"
  },
  "M2": {
    "image": "/images/materials/chain-link-generated.png",
    "alt": "Фотореалистичная визуализация плетёной стальной сетки с ромбическими ячейками"
  },
  "M3": {
    "image": "/images/materials/hexagonal-mesh-generated.png",
    "alt": "Фотореалистичная визуализация крученой проволочной сетки с шестиугольными ячейками"
  },
  "M4": {
    "image": "/images/materials/welded-mesh-generated.png",
    "alt": "Фотореалистичная визуализация сварной сетки с квадратными ячейками в стальной раме"
  },
  "M5": {
    "image": "/images/materials/cable-net-generated.png",
    "alt": "Фотореалистичная визуализация стальной тросовой сети с креплениями в пересечениях"
  },
  "M6": {
    "image": "/images/materials/tubular-grating-generated.png",
    "alt": "Фотореалистичная визуализация решётки из параллельных круглых стальных труб"
  },
  "M7": {
    "image": "/images/materials/perforated-sheet-generated.png",
    "alt": "Фотореалистичная визуализация стального листа с круглыми отверстиями"
  },
  "M8": {
    "image": "/images/materials/combined-panel-generated.png",
    "alt": "Фотореалистичная визуализация двухслойной панели из сварной сетки и полимерной сети"
  }
} satisfies Record<MaterialId, MaterialPhoto>;
