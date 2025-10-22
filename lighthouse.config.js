module.exports = {
  ci: {
    collect: {
      staticDistDir: "./dist",
      startServerCommand: "pnpm run preview",
      url: ["http://localhost:4173"],
      numberOfRuns: 3
    },
    assert: {
      assertions: {
        "categories:performance": ["error", { minScore: 0.95 }],
        "categories:accessibility": ["error", { minScore: 0.95 }],
        "categories:best-practices": ["error", { minScore: 0.95 }],
        "categories:pwa": ["error", { minScore: 0.95 }]
      }
    }
  }
}
