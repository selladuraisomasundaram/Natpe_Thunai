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
  isCustomOrder,
}: PostServiceFormProps) {
  return ( 
    <div>
      {/* component code */}
    </div>
  );
}