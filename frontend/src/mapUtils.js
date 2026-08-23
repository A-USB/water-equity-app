// Rwanda's approximate bounding box, used to project GeoJSON lon/lat onto a
// 0-100 viewBox. Shared by the WASAC needs map and the homepage preview so
// both maps line up visually.
export const RWANDA_BOUNDS = { west: 28.8617, east: 30.8998, south: -2.8403, north: -1.0471 };

export function project([longitude, latitude], bounds = RWANDA_BOUNDS) {
  const x = 5 + ((longitude - bounds.west) / (bounds.east - bounds.west)) * 90;
  const y = 95 - ((latitude - bounds.south) / (bounds.north - bounds.south)) * 90;
  return [x, y];
}

function ringPath(ring, bounds) {
  return (
    ring
      .map((point, index) => {
        const [x, y] = project(point, bounds);
        return `${index ? "L" : "M"}${x.toFixed(2)} ${y.toFixed(2)}`;
      })
      .join(" ") + "Z"
  );
}

export function featurePath(feature, bounds = RWANDA_BOUNDS) {
  const polygons = feature.geometry.type === "Polygon" ? [feature.geometry.coordinates] : feature.geometry.coordinates;
  return polygons.map((polygon) => polygon.map((ring) => ringPath(ring, bounds)).join(" ")).join(" ");
}
