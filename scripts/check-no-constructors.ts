// Mock bytecode is installed with setCode, so constructors never run and immutables are never set.
// Fails if any contract under contracts/ (or a base it inherits) declares either.
import { readFileSync, readdirSync } from "fs";
import { join } from "path";

type Node = {
  nodeType: string;
  id: number;
  name?: string;
  kind?: string;
  mutability?: string;
  contractKind?: string;
  abstract?: boolean;
  linearizedBaseContracts?: number[];
  nodes?: Node[];
};

const buildInfoDir = join(__dirname, "..", "artifacts", "build-info");
const failures: string[] = [];

for (const file of readdirSync(buildInfoDir)) {
  const sources: Record<string, { ast: Node }> = JSON.parse(readFileSync(join(buildInfoDir, file), "utf8")).output
    .sources;
  const contractsById = new Map<number, Node>();
  for (const { ast } of Object.values(sources)) {
    for (const node of ast.nodes!) {
      if (node.nodeType === "ContractDefinition") contractsById.set(node.id, node);
    }
  }

  for (const [path, { ast }] of Object.entries(sources)) {
    if (!path.startsWith("contracts/") || path.startsWith("contracts/test/")) continue;
    for (const contract of ast.nodes!) {
      if (contract.nodeType !== "ContractDefinition" || contract.contractKind !== "contract" || contract.abstract)
        continue;
      for (const baseId of contract.linearizedBaseContracts!) {
        const base = contractsById.get(baseId)!;
        const via = base === contract ? "" : ` (inherited from ${base.name})`;
        for (const member of base.nodes!) {
          if (member.nodeType === "FunctionDefinition" && member.kind === "constructor") {
            failures.push(`${path}: ${contract.name} has a constructor${via}`);
          }
          if (member.nodeType === "VariableDeclaration" && member.mutability === "immutable") {
            failures.push(`${path}: ${contract.name} has immutable ${member.name}${via}`);
          }
        }
      }
    }
  }
}

if (failures.length > 0) {
  console.error(failures.join("\n"));
  process.exit(1);
}
console.log("No constructors or immutables found.");
