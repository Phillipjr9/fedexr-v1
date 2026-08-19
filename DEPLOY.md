# Deploy

- Repo: `Phillipjr9/fedexr-v1`
- Production branch: **main**
- Host: Vercel (Git integration)

Latest trigger: 2026-08-19 deploy bump v1.0.1

If Vercel does not auto-build after a GitHub commit:

1. Vercel → Project → Settings → Git → confirm repo is `fedexr-v1` and Production Branch is `main`
2. Deployments → Redeploy the latest commit (or **Deploy** → promote)
3. Optional: add a Deploy Hook and call it after pushes
