const https = require('https');
const { execSync } = require('child_process');

function getCredentials() {
  const credInput = 'protocol=https\nhost=github.com\n\n';
  const credOut = execSync('git credential fill', { input: credInput, encoding: 'utf8' });
  let username = '';
  let token = '';
  credOut.split('\n').forEach(line => {
    if (line.startsWith('username=')) username = line.replace('username=', '').trim();
    if (line.startsWith('password=')) token = line.replace('password=', '').trim();
  });
  return { username, token };
}

function githubRequest(path, method, data, token, retries = 3) {
  return new Promise((resolve, reject) => {
    const payload = data ? JSON.stringify(data) : '';
    const req = https.request({
      hostname: 'api.github.com',
      path: path,
      method: method,
      headers: {
        'User-Agent': 'Antigravity-Publisher',
        'Authorization': 'token ' + token,
        'Accept': 'application/vnd.github.v3+json',
        ...(payload ? {
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(payload)
        } : {})
      }
    }, res => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        let parsed = null;
        try { parsed = JSON.parse(body); } catch (_) { parsed = body; }
        resolve({ status: res.statusCode, data: parsed });
      });
    });

    req.on('error', err => {
      if (retries > 0) {
        console.log(`Connection warning: ${err.message}. Retrying (${retries} left)...`);
        setTimeout(() => {
          githubRequest(path, method, data, token, retries - 1).then(resolve).catch(reject);
        }, 1500);
      } else {
        reject(err);
      }
    });

    if (payload) req.write(payload);
    req.end();
  });
}

async function main() {
  console.log('--- Publishing Portfolio to GitHub Pages ---');
  const { username, token } = getCredentials();
  if (!username || !token) {
    throw new Error('Unable to resolve GitHub credentials via Git Credential Manager');
  }
  console.log(`Authenticated as GitHub user: ${username}`);

  const repoName = `${username}.github.io`;
  console.log(`Target Repository: ${repoName}`);

  // 1. Create or verify repository
  console.log('Step 1: Checking/Creating repository on GitHub...');
  let repoRes = await githubRequest('/user/repos', 'POST', {
    name: repoName,
    description: 'Personal Portfolio of Ilham (@IlhamXkyo) - Full-Stack Web Enthusiast & Minimalist Design Lover',
    homepage: `https://${repoName.toLowerCase()}`,
    private: false,
    has_issues: true,
    has_projects: false,
    has_wiki: false
  }, token);

  if (repoRes.status === 201) {
    console.log(`Repository '${repoName}' successfully created.`);
  } else if (repoRes.status === 422) {
    console.log(`Repository '${repoName}' already exists. Proceeding with deployment.`);
  } else {
    console.log(`Create repository responded with status ${repoRes.status}:`, repoRes.data);
  }

  // 2. Set git remote and push
  console.log('Step 2: Pushing codebase to branch main...');
  try {
    execSync('git remote remove origin', { stdio: 'ignore' });
  } catch (_) {}

  const remoteUrl = `https://${username}:${token}@github.com/${username}/${repoName}.git`;
  execSync(`git remote add origin ${remoteUrl}`, { stdio: 'inherit' });
  execSync('git branch -M main', { stdio: 'inherit' });

  // Clean remote URL for safety in git log/config after push
  try {
    execSync('git push -u origin main --force', { stdio: 'inherit' });
    console.log('Code pushed successfully to GitHub!');
  } finally {
    // Reset remote origin to clean URL without embedded token
    execSync(`git remote set-url origin https://github.com/${username}/${repoName}.git`, { stdio: 'inherit' });
  }

  // 3. Configure / Verify GitHub Pages
  console.log('Step 3: Checking GitHub Pages status...');
  let pagesRes = await githubRequest(`/repos/${username}/${repoName}/pages`, 'GET', null, token);
  if (pagesRes.status === 404) {
    console.log('Enabling GitHub Pages on branch main...');
    pagesRes = await githubRequest(`/repos/${username}/${repoName}/pages`, 'POST', {
      source: {
        branch: 'main',
        path: '/'
      }
    }, token);
    console.log('Enable Pages response status:', pagesRes.status);
  } else {
    console.log('GitHub Pages already active:', pagesRes.data.html_url || pagesRes.data);
  }

  const liveUrl = `https://${repoName.toLowerCase()}`;
  console.log('\n======================================================');
  console.log(`🎉 LIVE GITHUB PAGES URL: ${liveUrl}`);
  console.log('======================================================\n');
}

main().catch(err => {
  console.error('Publishing failed:', err);
  process.exit(1);
});
