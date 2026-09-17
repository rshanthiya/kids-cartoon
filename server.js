require('dotenv').config();

const path = require('path');
const express = require('express');
const session = require('express-session');
const { ConfidentialClientApplication } = require('@azure/msal-node');

const app = express();
const PORT = process.env.PORT || 3000;

const KIDS_VIDEOS = [
  { title: 'Milo and the Moon', genre: 'Cartoon', duration: '12 min', badge: 'Kids' },
  { title: 'Little Jungle Adventures', genre: 'Animated', duration: '15 min', badge: 'Family' },
  { title: 'Sunny Bunny Show', genre: 'Comedy', duration: '10 min', badge: 'Funny' },
  { title: 'Rainbow Rockets', genre: 'Adventure', duration: '14 min', badge: 'New' },
  { title: 'Tiny Tunes', genre: 'Music', duration: '8 min', badge: 'Songs' },
  { title: 'Doodle Town', genre: 'Learning', duration: '11 min', badge: 'Creative' }
];

const AZURE_CLIENT_ID = process.env.AZURE_CLIENT_ID;
const AZURE_TENANT_ID = process.env.AZURE_TENANT_ID;
const AZURE_CLIENT_SECRET = process.env.AZURE_CLIENT_SECRET;
const KIDS_GROUP_ID = process.env.KIDS_GROUP_ID;
const PARENT_GROUP_ID = process.env.PARENT_GROUP_ID;
const AZURE_REDIRECT_URI = process.env.REDIRECT_URI || 'http://localhost:3000/auth/redirect';

function getMissingAzureConfig() {
  const missing = [];
  if (!AZURE_CLIENT_ID) missing.push('AZURE_CLIENT_ID');
  if (!AZURE_TENANT_ID) missing.push('AZURE_TENANT_ID');
  if (!AZURE_CLIENT_SECRET) missing.push('AZURE_CLIENT_SECRET');
  if (!KIDS_GROUP_ID) missing.push('KIDS_GROUP_ID');
  if (!PARENT_GROUP_ID) missing.push('PARENT_GROUP_ID');
  return missing;
}

const missingAzureConfig = getMissingAzureConfig();

const msalClient = AZURE_CLIENT_ID && AZURE_TENANT_ID && AZURE_CLIENT_SECRET
  ? new ConfidentialClientApplication({
      auth: {
        clientId: AZURE_CLIENT_ID,
        authority: `https://login.microsoftonline.com/${AZURE_TENANT_ID}`,
        clientSecret: AZURE_CLIENT_SECRET
      }
    })
  : null;

const PARENT_VIDEOS = [
  { title: 'World Documentary', genre: 'Documentary', duration: '42 min', badge: 'HD' },
  { title: 'City Stories', genre: 'Drama', duration: '51 min', badge: 'Top pick' },
  { title: 'Action Night', genre: 'Action', duration: '38 min', badge: 'Thriller' },
  { title: 'The Business Lens', genre: 'Business', duration: '29 min', badge: 'Insight' },
  { title: 'Culinary Escape', genre: 'Lifestyle', duration: '34 min', badge: 'Food' },
  { title: 'Deep Space', genre: 'Sci‑Fi', duration: '46 min', badge: 'Epic' }
];

app.use(express.static(path.join(__dirname, 'files')));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(session({
  secret: process.env.SESSION_SECRET || 'streamverse-secret-key',
  resave: false,
  saveUninitialized: false,
  cookie: { httpOnly: true, secure: false }
}));

function getUserSession(req) {
  return req.session.user || null;
}

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'files', 'index.html'));
});

app.get('/register', (req, res) => {
  res.sendFile(path.join(__dirname, 'files', 'register.html'));
});

app.get('/kids-login', (req, res) => {
  res.sendFile(path.join(__dirname, 'files', 'kids-login.html'));
});

app.get('/parent-login', (req, res) => {
  res.sendFile(path.join(__dirname, 'files', 'parent-login.html'));
});

app.get('/auth/login/:role', (req, res) => {
  const role = String(req.params.role || '').trim().toLowerCase();

  if (!['kid', 'parent'].includes(role)) {
    return res.status(400).send('Invalid role selected.');
  }

  if (!msalClient) {
    const missing = getMissingAzureConfig().join(', ');
    return res.status(500).json({
      message: 'Azure AD is not configured. Missing required environment variables: ' + missing
    });
  }

  const allowedGroupId = role === 'kid' ? KIDS_GROUP_ID : PARENT_GROUP_ID;
  if (!allowedGroupId) {
    return res.status(500).json({
      message: `Missing Azure AD group ID for ${role}. Add KIDS_GROUP_ID or PARENT_GROUP_ID in .env.`
    });
  }

  const authUrl = msalClient.getAuthCodeUrl({
    scopes: ['User.Read', 'GroupMember.Read.All'],
    redirectUri: AZURE_REDIRECT_URI,
    prompt: 'select_account',
    state: role
  });

  res.redirect(authUrl);
});

app.get('/auth/redirect', async (req, res) => {
  const { code, state, error, error_description } = req.query;

  if (error) {
    return res.status(400).send(`Azure login failed: ${error_description || error}`);
  }

  if (!code) {
    return res.status(400).send('Missing authorization code from Azure AD.');
  }

  const requestedRole = String(state || '').trim().toLowerCase();
  if (!['kid', 'parent'].includes(requestedRole)) {
    return res.status(400).send('Invalid Azure login state.');
  }

  try {
    const tokenResponse = await msalClient.acquireTokenByCode({
      code,
      scopes: ['User.Read', 'GroupMember.Read.All'],
      redirectUri: AZURE_REDIRECT_URI
    });

    const accessToken = tokenResponse.accessToken;
    if (!accessToken) {
      return res.status(401).send('Unauthorized: Azure token was not issued.');
    }

    const memberOfResponse = await fetch('https://graph.microsoft.com/v1.0/me/memberOf?$select=id,displayName', {
      headers: {
        Authorization: `Bearer ${accessToken}`
      }
    });

    if (!memberOfResponse.ok) {
      return res.status(403).send('Unauthorized: unable to read Azure AD group membership.');
    }

    const memberOfData = await memberOfResponse.json();
    const groupIds = (memberOfData.value || []).map((group) => String(group.id).trim());
    const allowedGroupId = requestedRole === 'kid' ? KIDS_GROUP_ID : PARENT_GROUP_ID;

    if (!groupIds.includes(String(allowedGroupId).trim())) {
      return res.status(403).send('Unauthorized: user is not assigned to the required Azure AD group.');
    }

    const profileResponse = await fetch('https://graph.microsoft.com/v1.0/me?$select=displayName,mail,userPrincipalName', {
      headers: {
        Authorization: `Bearer ${accessToken}`
      }
    });

    if (!profileResponse.ok) {
      return res.status(403).send('Unauthorized: user profile could not be loaded.');
    }

    const profile = await profileResponse.json();
    const userEmail = String(profile.mail || profile.userPrincipalName || '').trim();

    req.session.user = {
      id: Date.now(),
      role: requestedRole,
      name: profile.displayName || userEmail.split('@')[0],
      email: userEmail,
      age: requestedRole === 'parent' ? 18 : 10,
      provider: 'azure-ad'
    };

    res.redirect(requestedRole === 'kid' ? '/kids' : '/parent');
  } catch (error) {
    console.error('Azure login failed:', error);
    return res.status(500).send('Azure login failed. Check your client secret and app registration settings.');
  }
});

app.post('/api/register', (req, res) => {
  const role = String(req.body.role || '').trim().toLowerCase();

  if (!['kid', 'parent'].includes(role)) {
    return res.status(400).json({ message: 'Please choose a valid role.' });
  }

  return res.status(200).json({
    success: true,
    message: 'Registration is handled in Microsoft Entra ID. Please continue with Azure sign-in.',
    redirect: role === 'kid' ? '/auth/login/kid' : '/auth/login/parent'
  });
});

app.post('/api/login/kid', (req, res) => {
  return res.json({
    success: true,
    redirect: '/auth/login/kid',
    message: 'Redirecting to Microsoft Entra ID sign-in.'
  });
});

app.post('/api/login/parent', (req, res) => {
  return res.json({
    success: true,
    redirect: '/auth/login/parent',
    message: 'Redirecting to Microsoft Entra ID sign-in.'
  });
});

app.get('/api/session', (req, res) => {
  res.json({ user: getUserSession(req) });
});

app.post('/api/logout', (req, res) => {
  req.session.destroy(() => {
    res.json({ success: true });
  });
});

app.get('/api/kids/videos', (req, res) => {
  const user = getUserSession(req);
  if (!user || user.role !== 'kid') {
    return res.status(401).json({ message: 'Unauthorized' });
  }
  res.json({ videos: KIDS_VIDEOS });
});

app.get('/api/parent/videos', (req, res) => {
  const user = getUserSession(req);
  if (!user || user.role !== 'parent' || user.age < 18) {
    return res.status(401).json({ message: 'Unauthorized' });
  }
  res.json({ videos: PARENT_VIDEOS });
});

function ensureProtected(req, res, next) {
  const user = getUserSession(req);
  if (!user) return res.redirect('/');
  next();
}

app.get('/kids', ensureProtected, (req, res) => {
  const user = getUserSession(req);
  if (!user || user.role !== 'kid') return res.redirect('/');
  res.sendFile(path.join(__dirname, 'files', 'kids.html'));
});

app.get('/parent', ensureProtected, (req, res) => {
  const user = getUserSession(req);
  if (!user || user.role !== 'parent' || user.age < 18) return res.redirect('/');
  res.sendFile(path.join(__dirname, 'files', 'parent.html'));
});

app.listen(PORT, () => {
  if (missingAzureConfig.length) {
    console.warn('Azure configuration missing: ' + missingAzureConfig.join(', '));
  }
  console.log(`Server running at http://localhost:${PORT}`);
  if (isAzureAppService) {
    console.log(`Azure App Service detected. Listening on port ${PORT}.`);
  }
});
