import { describe, expect, it } from "vitest";
import { buildGpx } from "./gpx";

describe("buildGpx", () => {
  it("génère un GPX 1.1 valide avec traces et altitudes", () => {
    const gpx = buildGpx("TMB — Étape 1", [
      {
        name: "Étape 1 <test> & co",
        coords: [
          [6.7986, 45.8908, 1008],
          [6.7614, 45.8769, 1653],
        ],
      },
    ]);
    expect(gpx).toContain('<gpx version="1.1"');
    expect(gpx).toContain("<name>TMB — Étape 1</name>");
    expect(gpx).toContain("Étape 1 &lt;test&gt; &amp; co");
    expect(gpx).toContain('<trkpt lat="45.8908" lon="6.7986"><ele>1008</ele></trkpt>');
    expect(gpx).toContain("<ele>1653</ele>");
    expect((gpx.match(/<trkpt /g) || []).length).toBe(2);
  });
});
