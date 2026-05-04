const required = [
  'CLOUDFLARE_API_TOKEN',
  'GITHUB_TOKEN',
  'GITHUB_REPO',
  'GITHUB_BRANCH',
  'SITE_URL'
];

const optional = [
  'OPENAI_API_KEY',
  'OPENAI_MODEL'
];

const missing = required.filter(key => !process.env[key]);

if (missing.length) {
  console.error(`Missing required production environment variables: ${missing.join(', ')}`);
  process.exit(1);
}

for (const key of optional) {
  if (!process.env[key]) console.warn(`Optional environment variable not set: ${key}`);
}

console.log('Production environment variables are present.');
