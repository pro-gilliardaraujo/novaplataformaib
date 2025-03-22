const version = process.env.NEXT_PUBLIC_VERSION || 'dev';
const commitSha = process.env.NEXT_PUBLIC_COMMIT_SHA || '';
const buildDate = process.env.NODE_ENV === 'development' 
  ? 'dev' 
  : new Date().toLocaleDateString('pt-BR');

export const getVersion = () => {
  if (process.env.NODE_ENV === 'development') {
    return `v${version} (dev)`;
  }
  return `v${version} (${buildDate})`;
};

export const getCommitSha = () => commitSha; 