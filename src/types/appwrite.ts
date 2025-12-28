import { Models } from 'appwrite';

// Extend Models.Document to include $sequence which is often required by Appwrite
export interface AppwriteDocument extends Models.Document {
  $sequence: number;
}