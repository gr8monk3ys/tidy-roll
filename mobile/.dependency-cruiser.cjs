/** @type {import('dependency-cruiser').IConfiguration} */
module.exports = {
  forbidden: [
    {
      name: 'no-circular',
      comment: 'No dependency cycles. Extract the shared piece into its own module.',
      severity: 'error',
      from: {},
      to: { circular: true },
    },
    {
      name: 'src-does-not-import-routes',
      comment: 'Routes in app/ depend on src/, never the other way round. Move shared code into src/.',
      severity: 'error',
      from: { path: '^src/' },
      to: { path: '^(app|components)/' },
    },
    {
      name: 'lib-does-not-import-ui-or-stores',
      comment: 'src/lib holds pure logic that stays unit-testable in Node. Pass stores or UI state in as arguments instead of importing them.',
      severity: 'error',
      from: { path: '^src/lib/', pathNot: '\\.test\\.ts$' },
      to: { path: '^src/(components|store)/' },
    },
    {
      name: 'store-does-not-import-ui',
      comment: 'Stores are state only. UI imports stores, not the reverse.',
      severity: 'error',
      from: { path: '^src/store/' },
      to: { path: '^src/components/' },
    },
  ],
  options: {
    doNotFollow: { path: 'node_modules' },
    exclude: { path: '^(node_modules|\\.expo|dist|web-build)/' },
    tsConfig: { fileName: 'tsconfig.json' },
    enhancedResolveOptions: { extensions: ['.ts', '.tsx', '.js', '.jsx', '.json'] },
  },
};
