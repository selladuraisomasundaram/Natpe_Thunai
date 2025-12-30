import { Client, ID } from "https://deno.land/x/appwrite@11.0.0/mod.ts";

Deno.serve(async (req) => {
  if (req.method === "GET") {
    return new Response("This is the generate_cuelink function. Send a POST request to generate a link.", {
      headers: { "Content-Type": "text/plain" },
    });
  }

  if (req.method === "POST") {
    try {
      // Initialize Appwrite client (optional for simple ID generation, but good practice)
      // Ensure you set these environment variables in your Appwrite function settings
      const client = new Client()
        .setEndpoint(Deno.env.get("APPWRITE_ENDPOINT") ?? "https://cloud.appwrite.io/v1") // Your Appwrite Endpoint
        .setProject(Deno.env.get("APPWRITE_PROJECT_ID")) // Your project ID
        .setKey(Deno.env.get("APPWRITE_API_KEY")); // Your secret API key (for server-side operations)

      // Generate a unique ID for the cuelink
      const cuelinkId = ID.unique();

      // You can add logic here to store this cuelink in an Appwrite database
      // For example:
      // const databases = new Databases(client);
      // await databases.createDocument(
      //   Deno.env.get("DATABASE_ID"), // Your database ID
      //   Deno.env.get("COLLECTION_ID"), // Your collection ID for cuelinks
      //   cuelinkId,
      //   {
      //     // Add any relevant data, e.g., userId, targetUrl, creationDate
      //     createdAt: new Date().toISOString(),
      //   }
      // );

      // Construct the cuelink URL (example, adjust as needed)
      // Ensure APP_BASE_URL is set in your Appwrite function environment variables
      const baseUrl = Deno.env.get("APP_BASE_URL") ?? "https://your-app.com";
      const cuelink = `${baseUrl}/cuelink/${cuelinkId}`;

      return new Response(JSON.stringify({ cuelinkId, cuelink }), {
        headers: { "Content-Type": "application/json" },
        status: 200,
      });
    } catch (error) {
      console.error("Error generating cuelink:", error);
      return new Response(JSON.stringify({ error: error.message }), {
        headers: { "Content-Type": "application/json" },
        status: 500,
      });
    }
  }

  return new Response("Method Not Allowed", { status: 405 });
});