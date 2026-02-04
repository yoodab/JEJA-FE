import { useNavigate, useLocation } from 'react-router-dom';
import type { FormTemplate } from '../types/form';
import { createFormTemplate, updateFormTemplate } from '../services/formService';
import { FormBuilder } from '../components/forms/FormBuilder';

export default function FormBuilderPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const templateToEdit = location.state?.template as FormTemplate | undefined;
  
  // ReportManagePage에서 전달된 초기값
  const initialTitle = location.state?.initialTitle;
  const initialCategory = location.state?.initialCategory;
  const initialFormType = location.state?.initialFormType;
  const initialTargetClubId = location.state?.initialTargetClubId;

  const handleSave = async (templateData: Partial<FormTemplate>) => {
    try {
      if (templateToEdit) {
        await updateFormTemplate(templateToEdit.id, templateData);
        alert('양식이 수정되었습니다.');
      } else {
        await createFormTemplate(templateData);
        alert('양식이 생성되었습니다.');
      }
      navigate(-1); // Go back to previous page
    } catch (error) {
      console.error('Failed to save template:', error);
      alert('저장 중 오류가 발생했습니다.');
    }
  };

  return (
    <FormBuilder
      initialTemplate={templateToEdit}
      initialTitle={initialTitle}
      initialCategory={initialCategory}
      initialFormType={initialFormType}
      initialTargetClubId={initialTargetClubId}
      onSave={handleSave}
      onCancel={() => window.history.back()}
    />
  );
}
