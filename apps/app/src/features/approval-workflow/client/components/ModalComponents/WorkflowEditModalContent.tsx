import React, { useState, useCallback } from 'react';

import { useTranslation } from 'next-i18next';
import { ModalBody, ModalFooter } from 'reactstrap';

import type {
  IWorkflowHasId,
  IWorkflowApproverGroupForRenderList,
  WorkflowApprovalType,
  CreateApproverGroupData,
  UpdateApproverGroupData,
} from '~/features/approval-workflow/interfaces/workflow';

import { getLatestApprovedApproverGroupIndex } from '../../../utils/workflow';
import { useEditingApproverGroups } from '../../services/workflow';
import { useSWRxWorkflow } from '../../stores/workflow';

import { EditableApproverGroupCards } from './EditableApproverGroupCards';
import { WorkflowModalHeader } from './WorkflowModalHeader';

const findArrayDiff = (userIds1: string[], userIds2: string[]): { userIdToAdd?: string, userIdToRemove?: string } => {
  const userIdToAdd = userIds2.find(item => !userIds1.includes(item));
  const userIdToRemove = userIds1.find(item => !userIds2.includes(item));
  return { userIdToAdd, userIdToRemove };
};

type Props = {
  workflow: IWorkflowHasId
  onUpdated?: () => void
  onClickWorkflowDetailPageBackButton: () => void
}

export const WorkflowEditModalContent = (props: Props): JSX.Element => {
  const { t } = useTranslation();

  const { workflow, onUpdated, onClickWorkflowDetailPageBackButton } = props;

  const {
    editingApproverGroups, allEditingApproverIds, updateApproverGroupHandler, addApproverGroupHandler, removeApproverGroupHandler,
  } = useEditingApproverGroups(workflow.approverGroups);

  const [editingWorkflowName, setEditingWorkflowName] = useState<string | undefined>(workflow.name);
  const [editingWorkflowDescription, setEditingWorkflowDescription] = useState<string | undefined>(workflow.comment);

  const [createApproverGroupData, setCreateApproverGroupData] = useState<Array<CreateApproverGroupData & { uuidForRender: string }>>([]);
  const [updateApproverGroupData, setUpdateApproverGroupData] = useState<Array<UpdateApproverGroupData & { uuidForRender: string }>>([]);

  const updateGroup = useCallback((
      groupId: string,
      uuidForRender: string,
      approvalType: WorkflowApprovalType,
      userIdToAdd?: string,
      userIdToRemove?: string,
  ) => {
    const clonedData = [...updateApproverGroupData];
    const targetData = clonedData.find(v => uuidForRender === v.uuidForRender);

    if (targetData != null) {
      targetData.approvalType = approvalType;

      if (userIdToAdd != null && !targetData.userIdsToAdd?.includes(userIdToAdd)) {
        targetData.userIdsToAdd?.push(userIdToAdd);

        const removeIndex = targetData.userIdsToRemove?.indexOf(userIdToAdd);
        if (removeIndex != null && removeIndex >= 0) targetData.userIdsToRemove?.splice(removeIndex, 1);
      }

      if (userIdToRemove != null && !targetData.userIdsToRemove?.includes(userIdToRemove)) {
        targetData.userIdsToRemove?.push(userIdToRemove);

        const removeIndex = targetData.userIdsToAdd?.indexOf(userIdToRemove);
        if (removeIndex != null && removeIndex >= 0) targetData.userIdsToAdd?.splice(removeIndex, 1);
      }
      setUpdateApproverGroupData(clonedData);
    }
    else {
      const newData = {
        groupId,
        uuidForRender,
        approvalType,
        userIdsToAdd: userIdToAdd != null ? [userIdToAdd] : [],
        userIdsToRemove: userIdToRemove != null ? [userIdToRemove] : [],
      };
      setUpdateApproverGroupData([...updateApproverGroupData, newData]);
    }
  }, [updateApproverGroupData]);

  const { update: updateWorkflow } = useSWRxWorkflow(workflow?._id);

  const latestApprovedApproverGroupIndex = getLatestApprovedApproverGroupIndex(workflow);
  const excludedSearchUserIds = [workflow.creator._id, ...allEditingApproverIds];

  const onUpdateApproverGroupsHandler = useCallback((groupIndex: number, approverGroup: IWorkflowApproverGroupForRenderList) => {
    const oldUserIds = editingApproverGroups[groupIndex].approvers.map(v => (typeof v.user === 'string' ? v.user : v.user._id));
    const newUserIds = approverGroup.approvers.map(v => (typeof v.user === 'string' ? v.user : v.user._id));
    const result = findArrayDiff(oldUserIds, newUserIds);

    updateGroup(approverGroup._id, approverGroup.uuidForRenderList, approverGroup.approvalType, result.userIdToAdd, result.userIdToRemove);
    updateApproverGroupHandler(groupIndex, approverGroup);
  }, [editingApproverGroups, updateApproverGroupHandler, updateGroup]);

  const clickSaveWorkflowButtonClickHandler = useCallback(async() => {
    try {
      const updateData = {
        name: editingWorkflowName,
        comment: editingWorkflowDescription,
        createApproverGroupData: undefined,
        updateApproverGroupData,
      };
      await updateWorkflow(updateData);

      if (onUpdated != null) {
        onUpdated();
      }
    }
    catch (err) {
      // TODO: Consider how to display errors
    }
  }, [editingWorkflowDescription, editingWorkflowName, onUpdated, updateApproverGroupData, updateWorkflow]);


  return (
    <>
      <WorkflowModalHeader
        title={t('approval_workflow.edit_workflow')}
        onClickPageBackButton={onClickWorkflowDetailPageBackButton}
      />

      <ModalBody>
        <EditableApproverGroupCards
          editingApproverGroups={editingApproverGroups}
          excludedSearchUserIds={excludedSearchUserIds}
          latestApprovedApproverGroupIndex={latestApprovedApproverGroupIndex ?? undefined}
          onUpdateApproverGroups={onUpdateApproverGroupsHandler}
          onClickAddApproverGroupCard={addApproverGroupHandler}
          onClickRemoveApproverGroupCard={removeApproverGroupHandler}
        />
      </ModalBody>

      <ModalFooter>
        <button type="button">{t('approval_workflow.cancel')}</button>
        <button
          type="button"
          onClick={() => clickSaveWorkflowButtonClickHandler()}
        >{t('approval_workflow.completion')}
        </button>
      </ModalFooter>
    </>
  );
};
