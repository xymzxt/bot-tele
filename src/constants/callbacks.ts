export const Callback = {
  NavHome: 'nav:home',
  NavBack: 'nav:back',
  NavRefresh: 'nav:refresh',
  Cancel: 'nav:cancel',

  GithubConnect: 'github:connect',
  GithubOAuth: 'github:oauth',
  GithubPat: 'github:pat',
  GithubStatus: 'github:status',
  GithubRepos: 'github:repos',
  GithubCreateRepo: 'github:create_repo',
  GithubDisconnect: 'github:disconnect',

  DeployVercel: 'deploy:vercel',
  DeployNetlify: 'deploy:netlify',
  DeployRender: 'deploy:render',
  DeployHistory: 'deploy:history',

  OwnerBroadcast: 'owner:broadcast',
  OwnerHealth: 'owner:health',
  OwnerUsers: 'owner:users',
} as const;
