import React from 'react';
import { Form } from 'react-final-form';
import { Button, Loader2 } from '../ui'; // Update the import statement
import { DeletionInfoMessage } from './DeletionInfoMessage';

interface PostServiceFormProps {
  // Define the PostServiceFormProps interface
  onSubmit: (values: any) => void;
  onCancel: () => void;
  isSubmitting: boolean;
  categoryOptions: any[]; // Add the categoryOptions prop
  initialCategory: string; // Add the initialCategory prop
  isCustomOrder?: boolean; // Add the isCustomOrder prop
}

// ... (rest of the component code)