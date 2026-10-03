/** Compile-time guarantees for the future calculator; executed by typecheck. */
import type { ShapeDefinition } from "@/config/catalog";
import type { Configuration, ScreenConfiguration, ComplexConfiguration, ComplexContour } from "@/lib/configuration/schema";

type ScreenDimensions = ScreenConfiguration["dimensions"];
type ComplexContours = ComplexConfiguration["contours"];

const validScreenDimensions: ScreenDimensions = { length: 10, height: 4 };
// @ts-expect-error Circular dimensions cannot silently enter a linear screen.
const mixedDimensions: ScreenDimensions = { length: 10, height: 4, diameter: 8 };
// @ts-expect-error A screen must have both required dimensions.
const missingHeight: ScreenDimensions = { length: 10 };
// @ts-expect-error A complex enclosure must contain at least one contour.
const emptyContours: ComplexContours = [];
declare const contour: ComplexContour;
// @ts-expect-error Four contours exceed the contract's three-contour maximum.
const excessContours: ComplexContours = [contour, contour, contour, contour];

declare const shape: ShapeDefinition;
if (shape.id === "C1") {
  const screenKey: "screen" = shape.key;
  void screenKey;
}
declare const configuration: Configuration;
if (configuration.shape === "round") {
  const roundId: "C7" = configuration.shapeId;
  const diameter: number = configuration.dimensions.diameter;
  if (configuration.variant === "dome") {
    const rise: number = configuration.dimensions.rise;
    void rise;
  }
  void roundId;
  void diameter;
}
if (configuration.shape === "screen") {
  // @ts-expect-error Visibility must remain separate from the order.
  const hidden = configuration.hiddenSurfaceIds;
  // @ts-expect-error Independent contours belong only to the complex shape.
  const contours = configuration.contours;
  void hidden;
  void contours;
}

void validScreenDimensions;
void mixedDimensions;
void missingHeight;
void emptyContours;
void excessContours;
