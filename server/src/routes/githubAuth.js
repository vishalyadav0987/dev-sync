import { Router } from "express";
import { prisma } from "../lib/prisma.js";

const router = Router();

// /api/github/login?guestId=xyz
router.get("/github/login", (req, res) => {
  const { guestId } = req.query;
  const clientId = process.env.GITHUB_CLIENT_ID;
  
  if (!guestId) {
    return res.status(400).send("guestId is required");
  }

  if (!clientId) {
    return res.status(500).send("GITHUB_CLIENT_ID not configured");
  }

  // Redirect to GitHub OAuth
  const redirectUri = encodeURIComponent(`${process.env.VITE_API_URL || "http://localhost:4000"}/api/github/callback`);
  const scope = "public_repo user:email";
  
  const githubAuthUrl = `https://github.com/login/oauth/authorize?client_id=${clientId}&redirect_uri=${redirectUri}&scope=${scope}&state=${guestId}`;
  
  res.redirect(githubAuthUrl);
});

router.get("/github/callback", async (req, res) => {
  const { code, state: guestId } = req.query;
  const clientId = process.env.GITHUB_CLIENT_ID;
  const clientSecret = process.env.GITHUB_CLIENT_SECRET;

  if (!code || !guestId) {
    return res.status(400).send("Missing code or state");
  }

  try {
    // 1. Exchange code for access token
    const redirectUri = `${process.env.VITE_API_URL || "http://localhost:4000"}/api/github/callback`;
    const tokenResponse = await fetch("https://github.com/login/oauth/access_token", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify({
        client_id: clientId,
        client_secret: clientSecret,
        code,
        redirect_uri: redirectUri,
      }),
    });

    const tokenData = await tokenResponse.json();
    
    if (tokenData.error) {
      console.error("GitHub token error:", tokenData);
      console.error("  → redirect_uri sent:", redirectUri);
      console.error("  → Make sure your GitHub OAuth App's callback URL matches exactly.");
      return res.redirect(`${process.env.CLIENT_ORIGIN || "http://localhost:5173"}/projects?error=github_auth_failed`);
    }

    const accessToken = tokenData.access_token;

    // 2. Fetch user profile
    const userResponse = await fetch("https://api.github.com/user", {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "User-Agent": "DSA-Portfolio-App",
      },
    });

    const userData = await userResponse.json();
    const ghId = userData.id.toString();

    // 3. Clear this GitHub account from any OTHER guest session first
    //    (avoids unique constraint violation on githubId)
    await prisma.guestSession.updateMany({
      where: { githubId: ghId, NOT: { id: guestId } },
      data: {
        githubId: null,
        githubUsername: null,
        githubAccessToken: null,
        githubAvatarUrl: null,
      },
    });

    // 4. Link GitHub to the current guest session
    await prisma.guestSession.update({
      where: { id: guestId },
      data: {
        githubId: ghId,
        githubUsername: userData.login,
        githubAccessToken: accessToken,
        githubAvatarUrl: userData.avatar_url,
      },
    });

    // 5. Redirect back to frontend
    res.redirect(`${process.env.CLIENT_ORIGIN || "http://localhost:5173"}/projects?github_connected=true`);
  } catch (error) {
    console.error("GitHub OAuth Error:", error);
    res.redirect(`${process.env.CLIENT_ORIGIN || "http://localhost:5173"}/projects?error=github_auth_failed`);
  }
});

// Remove GitHub connection
router.delete("/github/disconnect", async (req, res) => {
  const guestId = req.header("x-guest-id");
  if (!guestId) return res.status(401).json({ error: "Unauthorized" });

  try {
    await prisma.guestSession.update({
      where: { id: guestId },
      data: {
        githubId: null,
        githubUsername: null,
        githubAccessToken: null,
        githubAvatarUrl: null,
      },
    });
    res.json({ success: true });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to disconnect GitHub" });
  }
});

export default router;
