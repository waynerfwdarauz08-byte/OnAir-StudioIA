import assert from "node:assert/strict";
import {
  createCoverageSimulation,
  getEditorialLocationTypeLabel,
  getPublicCoverageSimulation,
  getRegisteredEditorialLocation,
  getSimulationLocationLabel,
  normalizeEditorialLocation,
  resolvePresenterEditorialLocation,
} from "../src/utils/presenterLocations.js";

const location = {
  latitude: 9.935, longitude: -84.09,
  label: "Estudio editorial registrado", type: "studio",
};
assert.equal(getRegisteredEditorialLocation(location).label, location.label);
assert.equal(normalizeEditorialLocation({ ...location, type: "estudio" }).type, "studio");
assert.equal(getEditorialLocationTypeLabel("studio", "es"), "Estudio");
assert.equal(getEditorialLocationTypeLabel("studio", "en"), "Studio");
for (const latitude of [null, undefined, "", " ", true, [], {}, 91, -91, NaN]) {
  assert.equal(normalizeEditorialLocation({ ...location, latitude }), null);
}
for (const type of ["", "home", "casa", "constructor", "toString", [], false]) {
  assert.equal(normalizeEditorialLocation({ ...location, type }), null);
}
assert.equal(normalizeEditorialLocation({ ...location, isSimulated: "true" }), null);
assert.equal(getRegisteredEditorialLocation({ ...location, isSimulated: true }), null);
assert.equal(getPublicCoverageSimulation({ ...location, type: "coverage", isSimulated: true }), null);
assert.equal(resolvePresenterEditorialLocation(null, null), null);

const original = JSON.stringify(location);
const simulation = createCoverageSimulation("national-theatre", "es");
assert.equal(simulation.isSimulated, true);
assert.equal(simulation.type, "coverage");
assert.ok(getPublicCoverageSimulation(simulation));
assert.equal(createCoverageSimulation("private-home", "es"), null);
assert.notEqual(getSimulationLocationLabel(simulation, "es"), getSimulationLocationLabel(simulation, "en"));
assert.equal(getSimulationLocationLabel(simulation, "en"), "National Theatre of Costa Rica, San José");
assert.equal(resolvePresenterEditorialLocation(location, simulation).source, "registered");
assert.equal(resolvePresenterEditorialLocation(null, simulation).source, "simulated-session");
assert.equal(resolvePresenterEditorialLocation(simulation, null).source, "simulated-saved");
assert.equal(JSON.stringify(location), original);

console.log("PASS: editorial location validation, empty states, public simulations, ES/EN labels, origin priority, and unmodified records.");
