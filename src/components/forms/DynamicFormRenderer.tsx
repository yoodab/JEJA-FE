import React, { useMemo } from 'react';
import type { FormTemplate, FormQuestion } from '../../types/form';
import { PersonalFormRenderer } from './PersonalFormRenderer';
import { GroupFormRenderer } from './GroupFormRenderer';

interface DynamicFormRendererProps {
  template: FormTemplate;
  answers: any; // Allow nested structure for GROUP forms
  onChange: (newAnswers: any) => void;
  onSubmit?: () => void;
  members?: string[];
  readOnly?: boolean;
}

// Helper to parse JSON fields and group consecutive schedule questions
const processQuestions = (questions: FormQuestion[]): FormQuestion[] => {
  const processed: FormQuestion[] = [];
  let currentScheduleGroup: FormQuestion | null = null;

  // Sort questions by orderIndex to ensure correct grouping and display order
  const sortedQuestions = [...questions].sort((a, b) => a.orderIndex - b.orderIndex);

  for (const q of sortedQuestions) {
    const updated = { ...q };

    // Handle richOptions (from FormBuilder Preview) - Populate options for FormInput
    if ((updated as any).richOptions && (!updated.options || updated.options.length === 0)) {
      updated.options = ((updated as any).richOptions as any[]).map(o => o.label);
    }

    // Parse optionsJson if options is missing
    if (updated.optionsJson && (!updated.options || updated.options.length === 0)) {
      try {
        const parsed = JSON.parse(updated.optionsJson);
        updated.options = Array.isArray(parsed) 
          ? parsed.map((o: string | { label: string }) => typeof o === 'string' ? o : o.label) 
          : [];
      } catch (e) {
        console.error('Failed to parse optionsJson', e);
      }
    }

    // Grouping Logic for SCHEDULE_ATTENDANCE
    if (updated.inputType === 'SCHEDULE_ATTENDANCE' && updated.linkedScheduleId) {
      if (currentScheduleGroup && currentScheduleGroup.memberSpecific === updated.memberSpecific) {
        // Add to existing group
        if (!currentScheduleGroup.linkedSchedules) currentScheduleGroup.linkedSchedules = [];
        
        currentScheduleGroup.linkedSchedules.push({
          id: updated.linkedScheduleId,
          title: updated.label,
          startDate: updated.linkedScheduleDate || '',
          questionId: updated.id // Preserve original question ID
        });
        
        // Don't push this question to processed list, it's merged into the group
        continue;
      } else {
        // Start new group
        currentScheduleGroup = {
          ...updated,
          // Keep the label of the first question, or maybe generic? 
          // User said "일정 참석여부 조사" so maybe the first label is fine.
          linkedSchedules: [{
            id: updated.linkedScheduleId,
            title: updated.label,
            startDate: updated.linkedScheduleDate || '',
            questionId: updated.id
          }]
        };
        processed.push(currentScheduleGroup);
      }
    } else {
      // Not a schedule question, or end of group
      currentScheduleGroup = null;
      processed.push(updated);
    }
  }

  return processed;
};

export const DynamicFormRenderer: React.FC<DynamicFormRendererProps> = ({
  template,
  answers,
  onChange,
  onSubmit,
  members = [],
  readOnly = false,
}) => {
  // Parse JSON fields and Group Questions
  const processedTemplate = useMemo(() => {
    const newTemplate = { ...template };
    if (newTemplate.sections) {
      newTemplate.sections = newTemplate.sections.map(s => ({
        ...s,
        questions: processQuestions(s.questions)
      }));
    }
    if (newTemplate.questions) {
      newTemplate.questions = processQuestions(newTemplate.questions);
    }
    return newTemplate;
  }, [template]);

  // Compute derived answers for grouped questions (transform booleans to array of IDs)
  const derivedAnswers = useMemo(() => {
    if (processedTemplate.type === 'PERSONAL') {
      const newAnswers = { ...answers };
      
      const allQuestions = processedTemplate.sections 
        ? processedTemplate.sections.flatMap(s => s.questions)
        : processedTemplate.questions || [];

      allQuestions.forEach(q => {
        if (q.inputType === 'SCHEDULE_ATTENDANCE' && q.linkedSchedules && q.linkedSchedules.length > 0) {
          // Collect selected schedule IDs
          const selectedIds = q.linkedSchedules
            .filter(s => answers[s.questionId!] === true) // Check original question answer
            .map(s => s.id.toString());
          
          newAnswers[q.id] = selectedIds;
        }
      });
      
      return newAnswers;
    } 
    else if (processedTemplate.type === 'GROUP') {
      const newAnswers = { ...answers }; // Shallow copy of member map
      
      const allQuestions = processedTemplate.sections 
        ? processedTemplate.sections.flatMap(s => s.questions)
        : processedTemplate.questions || [];

      // Iterate over each member (or COMMON) in answers
      // But answers keys are dynamic (member names).
      // We should iterate members provided in props + COMMON
      const targets = [...(members || []), 'COMMON'];

      targets.forEach(target => {
        if (!newAnswers[target]) return;
        
        const targetAnswers = { ...newAnswers[target] };
        let modified = false;

        allQuestions.forEach(q => {
          if (q.inputType === 'SCHEDULE_ATTENDANCE' && q.linkedSchedules && q.linkedSchedules.length > 0) {
            // Collect selected schedule IDs for this target
            const selectedIds = q.linkedSchedules
              .filter(s => newAnswers[target]?.[s.questionId!] === true)
              .map(s => s.id.toString());
            
            targetAnswers[q.id] = selectedIds;
            modified = true;
          }
        });

        if (modified) {
          newAnswers[target] = targetAnswers;
        }
      });

      return newAnswers;
    }
    
    return answers;
  }, [answers, processedTemplate, members]);

  if (processedTemplate.type === 'PERSONAL') {
    const handlePersonalChange = (questionId: number, value: string | number | boolean | string[] | null) => {
      // Find if this is a grouped question
      const allQuestions = processedTemplate.sections 
        ? processedTemplate.sections.flatMap(s => s.questions)
        : processedTemplate.questions || [];
      
      const question = allQuestions.find(q => q.id === questionId);

      if (question?.inputType === 'SCHEDULE_ATTENDANCE' && question.linkedSchedules && question.linkedSchedules.length > 0) {
        // Decompose array value to individual booleans
        const selectedIds = (Array.isArray(value) ? value : []) as string[];
        
        // We need to update multiple answers.
        // Since onChange only accepts one key-value pair, we need to merge updates?
        // Wait, the parent onChange accepts the FULL answers object.
        // DynamicFormRenderer's onChange prop: (newAnswers: Record<string, any>) => void
        
        const newAnswers = { ...answers };
        
        question.linkedSchedules.forEach(s => {
          const isSelected = selectedIds.includes(s.id.toString());
          newAnswers[s.questionId!] = isSelected;
        });
        
        onChange(newAnswers);
      } else {
        // Normal update
        onChange({
          ...answers,
          [questionId]: value,
        });
      }
    };

    return (
      <PersonalFormRenderer
        template={processedTemplate}
        answers={derivedAnswers}
        onChange={handlePersonalChange}
        onSubmit={onSubmit || (() => console.log('Submit triggered'))}
        readOnly={readOnly}
      />
    );
  }

  if (processedTemplate.type === 'GROUP') {
    if (!members || members.length === 0) {
      return <div className="text-red-500">Error: No members provided for GROUP form.</div>;
    }

    const handleGroupChange = (memberName: string, questionId: number, value: string | number | boolean | string[] | null) => {
      // Find if this is a grouped question
      const allQuestions = processedTemplate.sections 
        ? processedTemplate.sections.flatMap(s => s.questions)
        : processedTemplate.questions || [];
      
      const question = allQuestions.find(q => q.id === questionId);

      if (question?.inputType === 'SCHEDULE_ATTENDANCE' && question.linkedSchedules && question.linkedSchedules.length > 0) {
        // Decompose
        const selectedIds = (Array.isArray(value) ? value : []) as string[];
        const memberAnswers = answers[memberName] || {};
        const newMemberAnswers: any = { ...memberAnswers };

        question.linkedSchedules.forEach(s => {
          const isSelected = selectedIds.includes(s.id.toString());
          newMemberAnswers[s.questionId!] = isSelected;
        });

        onChange({
          ...answers,
          [memberName]: newMemberAnswers
        });

      } else {
        const memberAnswers = answers[memberName] || {};
        onChange({
          ...answers,
          [memberName]: {
            ...memberAnswers,
            [questionId]: value,
          },
        });
      }
    };

    return (
      <GroupFormRenderer
        template={processedTemplate}
        members={members}
        answers={derivedAnswers}
        onChange={handleGroupChange}
        onSubmit={onSubmit || (() => console.log('Submit triggered'))}
        readOnly={readOnly}
      />
    );
  }

  return <div>Unknown Form Type</div>;
};
