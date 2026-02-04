import React, { useEffect, useState, useCallback } from 'react';
import styled from 'styled-components';
import { getFormSubmission } from '../../services/formService';
import type { FormSubmission } from '../../types/form';
import { FaTimes } from 'react-icons/fa';

interface SubmissionDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  submissionId: number | null;
  onApprove?: (id: number) => void;
  onReject?: (id: number) => void;
}

const SubmissionDetailModal: React.FC<SubmissionDetailModalProps> = ({ isOpen, onClose, submissionId, onApprove, onReject }) => {
  const [submission, setSubmission] = useState<FormSubmission | null>(null);
  const [loading, setLoading] = useState(false);

  const loadSubmissionDetail = useCallback(async () => {
    if (!submissionId) return;
    try {
      setLoading(true);
      const data = await getFormSubmission(submissionId);
      setSubmission(data);
    } catch (error) {
      console.error('Failed to load submission detail', error);
      alert('상세 내용을 불러오는데 실패했습니다.');
    } finally {
      setLoading(false);
    }
  }, [submissionId]);

  useEffect(() => {
    if (isOpen && submissionId) {
      loadSubmissionDetail();
    }
  }, [isOpen, submissionId, loadSubmissionDetail]);

  if (!isOpen || !submissionId) return null;

  return (
    <ModalOverlay onClick={onClose}>
      <ModalContainer onClick={(e) => e.stopPropagation()}>
        <Header>
          <Title>신청서 상세</Title>
          <CloseButton onClick={onClose}><FaTimes /></CloseButton>
        </Header>
        <Content>
          {loading ? (
            <LoadingText>불러오는 중...</LoadingText>
          ) : submission ? (
            <DetailWrapper>
              <MetaInfo>
                <MetaItem>
                    <Label>작성자</Label>
                    <Value>{submission.submitterName}</Value>
                </MetaItem>
                <MetaItem>
                    <Label>제출일</Label>
                    <Value>{submission.submitDate}</Value>
                </MetaItem>
                <MetaItem>
                    <Label>상태</Label>
                    <StatusBadge status={submission.status}>
                        {submission.status === 'PENDING' ? '대기' : submission.status === 'APPROVED' ? '승인' : '거절'}
                    </StatusBadge>
                </MetaItem>
              </MetaInfo>
              <Divider />
              <AnswersContainer>
                {submission.answers.map((ans, idx) => (
                  <AnswerItem key={idx}>
                    <QuestionLabel>Q. {ans.questionLabel || `질문 ${ans.questionId}`}</QuestionLabel>
                    <AnswerValue>{ans.value}</AnswerValue>
                  </AnswerItem>
                ))}
              </AnswersContainer>
            </DetailWrapper>
          ) : (
            <EmptyText>데이터가 없습니다.</EmptyText>
          )}
        </Content>
        {submission && submission.status === 'PENDING' && onApprove && onReject && (
          <Footer>
            <RejectButton onClick={() => {
                if(confirm('정말 거절하시겠습니까?')) onReject(submission.id);
            }}>거절</RejectButton>
            <ApproveButton onClick={() => {
                if(confirm('정말 승인하시겠습니까?')) onApprove(submission.id);
            }}>승인</ApproveButton>
          </Footer>
        )}
      </ModalContainer>
    </ModalOverlay>
  );
};

export default SubmissionDetailModal;

const ModalOverlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1050;
`;

const ModalContainer = styled.div`
  background-color: white;
  border-radius: 12px;
  width: 90%;
  max-width: 600px;
  max-height: 85vh;
  display: flex;
  flex-direction: column;
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.1);
  overflow: hidden;
`;

const Header = styled.div`
  padding: 16px 24px;
  border-bottom: 1px solid #eee;
  display: flex;
  justify-content: space-between;
  align-items: center;
  background-color: #fff;
`;

const Title = styled.h2`
  margin: 0;
  font-size: 1.25rem;
  font-weight: 700;
  color: #111;
`;

const CloseButton = styled.button`
  background: none;
  border: none;
  font-size: 1.25rem;
  cursor: pointer;
  color: #888;
  padding: 4px;
  transition: color 0.2s;
  
  &:hover {
    color: #333;
  }
`;

const Content = styled.div`
  padding: 24px;
  overflow-y: auto;
  flex: 1;
  background-color: #f8fafc;
`;

const LoadingText = styled.div`
  text-align: center;
  padding: 40px;
  color: #666;
`;

const EmptyText = styled.div`
  text-align: center;
  padding: 40px;
  color: #888;
`;

const DetailWrapper = styled.div`
  display: flex;
  flex-direction: column;
  gap: 24px;
`;

const MetaInfo = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  background-color: #fff;
  padding: 16px 20px;
  border-radius: 10px;
  border: 1px solid #e2e8f0;
  box-shadow: 0 1px 2px rgba(0,0,0,0.05);
`;

const MetaItem = styled.div`
  display: flex;
  flex-direction: column;
  gap: 4px;
`;

const Label = styled.span`
  font-size: 0.75rem;
  color: #64748b;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.05em;
`;

const Value = styled.span`
  font-weight: 600;
  color: #334155;
  font-size: 0.95rem;
`;

const StatusBadge = styled.span<{ status: string }>`
    display: inline-block;
    padding: 4px 12px;
    border-radius: 20px;
    font-size: 0.85rem;
    font-weight: 700;
    color: white;
    background-color: ${props => 
    props.status === 'APPROVED' ? '#10b981' : 
    props.status === 'REJECTED' ? '#ef4444' : '#f59e0b'};
`;

const Divider = styled.hr`
  border: none;
  border-top: 1px dashed #cbd5e1;
  margin: 0;
`;

const AnswersContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 20px;
`;

const AnswerItem = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
`;

const QuestionLabel = styled.div`
  font-weight: 600;
  color: #1e293b;
  font-size: 0.95rem;
`;

const AnswerValue = styled.div`
  padding: 16px;
  background-color: #fff;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  color: #334155;
  white-space: pre-wrap;
  line-height: 1.6;
  font-size: 0.95rem;
`;

const Footer = styled.div`
    padding: 16px 24px;
    border-top: 1px solid #eee;
    background-color: #fff;
    display: flex;
    justify-content: flex-end;
    gap: 12px;
`;

const Button = styled.button`
    padding: 10px 20px;
    border-radius: 8px;
    font-weight: 600;
    font-size: 0.9rem;
    cursor: pointer;
    transition: all 0.2s;
    border: none;
`;

const RejectButton = styled(Button)`
    background-color: #fee2e2;
    color: #ef4444;
    
    &:hover {
        background-color: #fecaca;
    }
`;

const ApproveButton = styled(Button)`
    background-color: #10b981;
    color: white;
    
    &:hover {
        background-color: #059669;
    }
`;
