const anyPosition = ['Ar', 'Bre', 'Gre', 'Jul', 'Mer', 'Na', 'No', 'Tre', 'Ty'];
const beginningOnly = ['Al', 'Fe', 'Fi', 'Ha', 'He', 'Hu', 'Ja', 'Joo', 'Ma', 'Pa', 'Pu', 'The', 'Thor', 'Yar'];
const beginningAndMiddle = ['An'];
const endingOnly = ['On'];

function choose<T>(values: T[], random: () => number): T {
  return values[Math.min(values.length - 1, Math.floor(random() * values.length))];
}

function buildName(random: () => number) {
  const beginning = choose([...anyPosition, ...beginningOnly, ...beginningAndMiddle], random);
  const middle = random() < 0.5 ? choose([...anyPosition, ...beginningAndMiddle], random) : '';
  const ending = choose([...anyPosition, ...endingOnly], random);
  return beginning + middle.toLowerCase() + ending.toLowerCase();
}

export function generateFollowerName(existingNames: string[] = [], random: () => number = Math.random) {
  const used = new Set(existingNames.map(name => name.trim().toLocaleLowerCase()).filter(Boolean));
  let candidate = '';
  for (let attempt = 0; attempt < 100; attempt++) {
    candidate = buildName(random);
    if (!used.has(candidate.toLocaleLowerCase())) return candidate;
  }
  return candidate;
}
