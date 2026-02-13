import React, { useEffect, useState, useCallback } from 'react';
import styled from 'styled-components';
import { toast } from 'react-hot-toast';
import { getClubSubmissions } from '../../services/formService';
import type { ClubSubmissionResponse } from '../../types/form';
import { FaTimes } from 'react-icons/fa';

interface SubmissionListModalProps {
  isOpen: boolean;
  onClose: () => void;
  clubId: number;
  onSelectSubmission: (id: number) => void;
}

const SubmissionListModal: React.FC<SubmissionListModalProps> = ({ isOpen, onClose, clubId, onSelectSubmission }) => {
  const [submissions, setSubmissions] = useState<ClubSubmissionResponse[]>([]);
  const [loading, setLoading] = useState(false);

  const loadSubmissions = useCallback(async () => {
    try {
      setLoading(true);
      const data = await getClubSubmissions(clubId);
      // Ensure type compatibility if needed, but assuming service returns matching shape
      setSubmissions(data as unknown as ClubSubmissionResponse[]);
    } catch (error) {
      console.error('Failed to load submissions', error);
      toast.error('신청 현황을 불러오는데 실패했습니다.');
    } finally {
      setLoading(false);
    }
  }, [clubId]);

  useEffect(() => {
    if (isOpen && clubId) {
      loadSubmissions();
    }
  }, [isOpen, clubId, loadSubmissions]);

  if (!isOpen) return null;

  return (
    <ModalOverlay onClick={onClose}>
      <ModalContainer onClick={(e) => e.stopPropagation()}>
        <Header>
          <Title>신청 현황</Title>
          <CloseButton onClick={onClose}><FaTimes /></CloseButton>
        </Header>
        <Content>
          {loading ? (
            <LoadingText>불러오는 중...</LoadingText>
          ) : submissions.length === 0 ? (
            <EmptyText>제출된 신청서가 없습니다.</EmptyText>
          ) : (
            <TableContainer>
              <Table>
                <thead>
                  <tr>
                    <th>제목</th>
                    <th>작성자</th>
                    <th>제출일</th>
                    <th>상태</th>
                  </tr>
                </thead>
                <tbody>
                  {submissions.map((sub) => (
                    <tr key={sub.submissionId} onClick={() => onSelectSubmission(sub.submissionId)}>
                      <td>{sub.templateTitle}</td>
                      <td>{sub.submitterName}</td>
                      <td>{sub.submitDate}</td>
                      <td>
                        <StatusBadge status={sub.status}>
                          {sub.status === 'PENDING' ? '대기' : sub.status === 'APPROVED' ? '승인' : '거절'}
                        </StatusBadge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            </TableContainer>
          )}
        </Content>
      </ModalContainer>
    </ModalOverlay>
  );
};

export default SubmissionListModal;

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
  z-index: 1000;
`;

const ModalContainer = styled.div`
  background-color: white;
  border-radius: 8px;
  width: 90%;
  max-width: 800px;
  max-height: 80vh;
  display: flex;
  flex-direction: column;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
`;

const Header = styled.div`
  padding: 16px 24px;
  border-bottom: 1px solid #eee;
  display: flex;
  justify-content: space-between;
  align-items: center;
`;

const Title = styled.h2`
  margin: 0;
  font-size: 1.25rem;
  font-weight: 600;
`;

const CloseButton = styled.button`
  background: none;
  border: none;
  font-size: 1.25rem;
  cursor: pointer;
  color: #666;
  padding: 4px;
  
  &:hover {
    color: #333;
  }
`;

const Content = styled.div`
  padding: 24px;
  overflow-y: auto;
  flex: 1;
`;

const LoadingText = styled.div`
  text-align: center;
  padding: 20px;
  color: #666;
`;

const EmptyText = styled.div`
  text-align: center;
  padding: 40px;
  color: #888;
`;

const TableContainer = styled.div`
  overflow-x: auto;
`;

const Table = styled.table`
  width: 100%;
  border-collapse: collapse;
  
  th, td {
    padding: 12px;
    text-align: left;
    border-bottom: 1px solid #eee;
  }
  
  th {
    font-weight: 600;
    color: #444;
    background-color: #f9f9f9;
  }
  
  tbody tr {
    cursor: pointer;
    &:hover {
      background-color: #f5f5f5;
    }
  }
`;

const StatusBadge = styled.span<{ status: string }>`
  padding: 4px 8px;
  border-radius: 12px;
  font-size: 0.85rem;
  font-weight: 500;
  background-color: ${props => 
    props.status === 'APPROVED' ? '#e6f4ea' : 
    props.status === 'REJECTED' ? '#fce8e6' : '#fff8e1'};
  color: ${props => 
    props.status === 'APPROVED' ? '#1e7e34' : 
    props.status === 'REJECTED' ? '#d93025' : '#f1c40f'};
`;
