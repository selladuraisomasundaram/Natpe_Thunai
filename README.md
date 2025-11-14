# Welcome to your Dyad app

## Appwrite Setup (Mandatory for Deployment)

To resolve the 'Failed to fetch' authentication error, you must configure the following environment variables in your deployment platform (e.g., Vercel) and ensure your Appwrite project is correctly set up.

### 1. Environment Variables (Vercel/Vite)

These variables must be set in your Vercel project settings:

| Variable Name | Description | Example Value |
|---|---|---|
| `VITE_APPWRITE_ENDPOINT` | The URL of your Appwrite instance. | `https://cloud.appwrite.io/v1` |
| `VITE_APPWRITE_PROJECT_ID` | Your unique Appwrite Project ID. | `690f3ae200352dd0534a` |
| `VITE_APP_HOST_URL` | The public URL of your deployed application. | `https://your-app-name.vercel.app` |

### 2. Appwrite Console Configuration (CORS)

You must register your deployed domain in the Appwrite Console:

1. Go to your Appwrite Project.
2. Navigate to **Platform** -> **Web**.
3. Add your Vercel domain (e.g., `https://your-app-name.vercel.app`) as a new Web platform.
4. Ensure the **Host URL** and **Redirect URLs** are correctly configured to allow traffic from your deployed application.