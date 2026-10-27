import { MOCK_PROJECTS } from './lib/mock-projects.ts';
const ok = MOCK_PROJECTS.length >= 3;
console.log(`MOCK_PROJECTS length: ${MOCK_PROJECTS.length} (min 3)`);
console.log(ok ? 'LENGTH OK' : 'LENGTH FAIL');
process.exit(ok ? 0 : 1);
