// Code Generator: Scaffold ai-agent-flow project structure
// Run this with Node.js to generate the base files and folders

const fs = require("fs");
const path = require("path");

const structure = {
  src: {
    nodes: ["action.ts", "llm.ts", "decision.ts", "batch.ts"],
    providers: ["openai.ts"],
    stores: ["in-memory.ts", "redis.ts"],
    utils: ["message-bus.ts"],
    "index.ts": "",
  },
  tests: [
    "index.test.ts",
    "nodes.test.ts",
    "flow.test.ts",
    "runner.test.ts",
    "message-bus.test.ts",
  ],
  examples: ["chatbot.ts", "multi-agent.ts", "data-pipeline.ts"],
  "docs/api": [],
  "": [
    "README.md",
    "package.json",
    "tsconfig.json",
    "jest.config.js",
    "LICENSE",
    ".gitignore",
  ],
};

function createStructure(base, structure) {
  Object.entries(structure).forEach(([key, value]) => {
    const fullPath = path.join(base, key);
    if (Array.isArray(value)) {
      fs.mkdirSync(fullPath, { recursive: true });
      value.forEach((file) =>
        fs.writeFileSync(path.join(fullPath, file), "// TODO")
      );
    } else if (typeof value === "object") {
      fs.mkdirSync(path.join(base, key), { recursive: true });
      createStructure(path.join(base, key), value);
    } else {
      fs.mkdirSync(base, { recursive: true });
      fs.writeFileSync(path.join(base, key), "// TODO");
    }
  });
}

function writeRootFiles() {
  fs.writeFileSync(
    "README.md",
    "# ai-agent-flow\n\nA Node.js framework for AI agent workflows."
  );
  fs.writeFileSync("LICENSE", "MIT License 2025 Rajesh Dhiman");
  fs.writeFileSync(".gitignore", "node_modules/\ndist/\ndocs/\n*.tgz\n");

  fs.writeFileSync(
    "tsconfig.json",
    JSON.stringify(
      {
        compilerOptions: {
          target: "es6",
          module: "commonjs",
          outDir: "./dist",
          rootDir: "./src",
          strict: true,
          esModuleInterop: true,
          skipLibCheck: true,
          declaration: true,
        },
        include: ["src/**/*"],
        exclude: ["node_modules", "tests"],
      },
      null,
      2
    )
  );

  fs.writeFileSync(
    "jest.config.js",
    `module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node'
};`
  );

  fs.writeFileSync(
    "package.json",
    JSON.stringify(
      {
        name: "ai-agent-flow",
        version: "1.0.0",
        description: "A Node.js framework for AI agent workflows",
        main: "dist/index.js",
        types: "dist/index.d.ts",
        scripts: {
          build:
            "esbuild src/index.ts --bundle --platform=node --outfile=dist/index.js",
          test: "jest",
          docs: "typedoc --out docs src/index.ts",
          prepare: "npm run build",
        },
        keywords: ["ai", "agent", "workflow", "typescript", "node"],
        author: "Rajesh Dhiman <your-email@example.com>",
        license: "MIT",
        repository: {
          type: "git",
          url: "https://github.com/your-org/ai-agent-flow.git",
        },
        dependencies: {
          winston: "^3.8.2",
          "prom-client": "^14.2.0",
          openai: "^4.0.0",
          redis: "^4.6.5",
        },
        devDependencies: {
          "@types/jest": "^29.5.12",
          esbuild: "^0.19.5",
          jest: "^29.7.0",
          "ts-jest": "^29.1.2",
          typescript: "^5.4.5",
          typedoc: "^0.25.0",
        },
        files: ["dist", "README.md", "LICENSE"],
      },
      null,
      2
    )
  );
}

function scaffoldProject() {
  createStructure(".", structure);
  writeRootFiles();
  console.log("✅ ai-agent-flow scaffold generated!");
}

scaffoldProject();
