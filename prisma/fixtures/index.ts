import { oneOnOne } from "./one-on-one";
import { teamSync } from "./team-sync";
import { quarterlyPlanning } from "./quarterly-planning";
import type { Fixture } from "./types";

export const fixtures: Fixture[] = [oneOnOne, teamSync, quarterlyPlanning];
export type { Fixture, FixtureSegment } from "./types";
