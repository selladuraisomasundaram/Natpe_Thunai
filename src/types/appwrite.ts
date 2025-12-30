import { Models } from 'appwrite';

export interface AffiliateListing extends Models.Document {
  title: string;
  description: string;
  original_url: string;
  // Add any other properties specific to AffiliateListing that are not in Models.Document
}

export interface AppwriteFunctionExecutionResult {
  response: string; // The actual response body from the function
  // Add other properties if needed, like stderr, status, etc.
}