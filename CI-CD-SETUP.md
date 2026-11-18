# MOS Project Monitor — Git-based website CI/CD

Permanent website: https://projects.mysomis.com

Source repository: https://github.com/fibast18/mos-project-monitor

Cloud API: https://mos-project-monitor-api.ormocslaughter.workers.dev

## One-time setting in GitHub (required)

1. Open the repository, then Settings → Pages.
2. Under Build and deployment → Source, select GitHub Actions instead of Deploy from a branch.
3. Confirm the Custom domain still reads projects.mysomis.com and turn on Enforce HTTPS if available.
4. Open the Actions tab → MOS Project Monitor - GitHub Pages CI/CD → Run workflow → main → Run workflow.
5. Wait for both jobs, Validate and package website and Publish projects.mysomis.com, to succeed. Verify the site still loads and the MOS dashboard syncs.

IMPORTANT: Keep the existing CNAME file. The workflow packages it into the deployed website.

## One-time local setup on MacBook

Open Terminal and run:

    cd ~/Documents
    git clone https://github.com/fibast18/mos-project-monitor.git
    cd mos-project-monitor

If the repository is already cloned on the Mac, open that directory instead of cloning again.

## Every future app update

Edit the app files in the cloned repository. To publish a website update:

    bash deploy-mac.sh 'Describe the MOS app update'

The helper checks the service worker syntax, validates the app, stages only approved public website files, commits your changes, and pushes them to main. GitHub Actions automatically tests and deploys the new website. GitHub Desktop or ordinary git commit / git push are also supported.

If you make a functional app release, increment the app version in index.html and sw.js together and update manifest.webmanifest descriptive text. Keep the existing localStorage keys and the API endpoint unchanged.

## Scope, data safety, and credentials

- Website CI/CD is automatic for Git commits affecting the app, CNAME, validator, or workflow.
- The deployment artifact includes only index.html, sw.js, manifest.webmanifest, apple-touch-icon.png, icon-192.png, icon-512.png, CNAME, and .nojekyll.
- Cloudflare Worker and D1 are NOT deployed or migrated by this website workflow. They remain in the existing ormocslaughter Cloudflare account.
- Do not place Cloudflare API tokens, SETUP_KEY, admin passwords, .dev.vars, or project JSON backups into this public GitHub repository.
- Export a JSON backup and verify any offline drafts before changing installation or browser storage. Local-only documents are not cloud-synced.
- GitHub Actions still requires the one-time Source setting above; committing a workflow does not change it automatically.
- Worker code can get a separate CI/CD workflow later, ideally from a private repository with an API token restricted to the ormocslaughter Cloudflare account.
