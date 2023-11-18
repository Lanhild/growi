// TODO: https://redmine.weseek.co.jp/issues/130337
import React, { useCallback } from 'react';

import { useTranslation } from 'next-i18next';
import { ModalBody, ModalFooter } from 'reactstrap';

import { type IWorkflowHasId, WorkflowApproverStatus } from '../../../interfaces/workflow';
import { useSWRxWorkflow } from '../../stores/workflow';

import { WorkflowModalHeader } from './WorkflowModalHeader';


type Props = {
  workflow?: IWorkflowHasId,
  onClickWorkflowEditButton: () => void,
  onClickWorkflowListPageBackButton: () => void,
}

export const WorkflowDetailModalContent = (props: Props): JSX.Element => {
  const { t } = useTranslation();

  const { workflow, onClickWorkflowEditButton, onClickWorkflowListPageBackButton } = props;
  const { updateApproverStatus } = useSWRxWorkflow(workflow?._id);

  const approveButtonClickHandler = useCallback(async() => {
    try {
      await updateApproverStatus(WorkflowApproverStatus.APPROVE);
    }
    catch (err) {
      // TODO: Consider how to display errors
    }
  }, [updateApproverStatus]);

  return (
    <>
      <WorkflowModalHeader
        title={workflow?.name ?? ''}
        onClickPageBackButton={onClickWorkflowListPageBackButton}
      />

      <ModalBody>
        <button type="button" onClick={() => { onClickWorkflowEditButton() }}>{t('approval_workflow.edit')}</button>
        詳細ページ
      </ModalBody>

      <ModalFooter>
        <button type="button" onClick={approveButtonClickHandler}>{t('approval_workflow.approver_status.APPROVE')}</button>
      </ModalFooter>
    </>
  );
};
