import { Form } from 'react-final-form';
import { Button, Loader } from '@shadcn/ui'; 
import DeletionInfoMessage from './DeletionInfoMessage';

interface PostServiceFormProps {
  onSubmit: (data: any) => Promise<void>;
  onCancel: () => void;
  categoryOptions: any[];
  initialCategory: string;
  ambassadorMessagePlaceholder: string;
  titlePlaceholder: string;
  descriptionPlaceholder: string;
  pricePlaceholder?: string;
  contactPlaceholder?: string;
  customOrderDescriptionPlaceholder?: string;
  isCustomOrder?: boolean;
}

export default function PostServiceForm({
  onSubmit,
  onCancel,
  categoryOptions,
  initialCategory,
  ambassadorMessagePlaceholder,
  titlePlaceholder,
  descriptionPlaceholder,
  pricePlaceholder,
  contactPlaceholder,
  customOrderDescriptionPlaceholder,
  isCustomOrder,
}: PostServiceFormProps) {
  // component code
}