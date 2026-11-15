// Runs the Godot logic tests (tests/test_logic.gd), downloading Godot if needed.
import { execFileSync } from 'node:child_process';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { ensureGodot } from './godot.mjs';

const project = join(dirname(fileURLToPath(import.meta.url)), '..', 'godot');
const godot = await ensureGodot();
execFileSync(godot, ['--headless', '--path', project, '--import'], { stdio: 'inherit' });
execFileSync(godot, ['--headless', '--path', project, '-s', 'tests/test_logic.gd'], { stdio: 'inherit' });
