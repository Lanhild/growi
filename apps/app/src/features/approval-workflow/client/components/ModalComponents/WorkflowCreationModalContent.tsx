// TODO: https://redmine.weseek.co.jp/issues/130338
import React, { useCallback, useState } from 'react';

import { useTranslation } from 'next-i18next';
import { ModalBody, ModalFooter } from 'reactstrap';

import { useCurrentUser } from '~/stores/context';

import { useEditingApproverGroups } from '../../services/workflow';
import { useSWRMUTxCreateWorkflow } from '../../stores/workflow';

import { EditableApproverGroupCards } from './EditableApproverGroupCards';
import { WorkflowModalHeader } from './WorkflowModalHeader';

import styles from './WorkflowCreationModalContent.module.scss';

type Props = {
  pageId: string,
  onCreated?: () => void
  onClickWorkflowListPageBackButton: () => void;
}

export const WorkflowCreationModalContent = (props: Props): JSX.Element => {
  const { t } = useTranslation();
  const { data: currentUser } = useCurrentUser();
  const {
    editingApproverGroups, allEditingApproverIds, updateApproverGroupHandler, addApproverGroupHandler, removeApproverGroupHandler,
  } = useEditingApproverGroups();

  const { pageId, onCreated, onClickWorkflowListPageBackButton } = props;

  const [editingWorkflowName, setEditingWorkflowName] = useState<string | undefined>();
  const [editingWorkflowDescription, setEditingWorkflowDescription] = useState<string | undefined>();

  const { trigger: createWorkflow } = useSWRMUTxCreateWorkflow(pageId, editingApproverGroups, editingWorkflowName, editingWorkflowDescription);

  const workflowNameChangeHandler = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    setEditingWorkflowName(event.target.value);
  }, []);

  const workflowDescriptionChangeHandler = useCallback((event: React.ChangeEvent<HTMLTextAreaElement>) => {
    setEditingWorkflowDescription(event.target.value);
  }, []);

  const createWorkflowButtonClickHandler = useCallback(async() => {
    if (editingApproverGroups == null) {
      return;
    }

    try {
      // TODO: https://redmine.weseek.co.jp/issues/131035
      await createWorkflow();
      if (onCreated != null) {
        onCreated();
      }
    }
    catch (err) {
      // TODO: Consider how to display errors
    }
  }, [createWorkflow, editingApproverGroups, onCreated]);

  if (currentUser == null) {
    return <></>;
  }

  const excludedSearchUserIds = [currentUser._id, ...allEditingApproverIds];

  const isCreatableWorkflow = allEditingApproverIds.length > 0;

  return (
    <>
      <WorkflowModalHeader onClickPageBackButton={() => onClickWorkflowListPageBackButton()}>
        <span className="fw-bold">{t('approval_workflow.create_new')}</span>
      </WorkflowModalHeader>

      <ModalBody>
        <div className="col-9 mx-auto">
          <div className="mb-3">
            <div className="row align-items-center">
              <label htmlFor="name" className="col-md-4 col-form-label text-center">
                {t('approval_workflow.name')}
              </label>
              <div className="col-md-8 mb-3">
                <div className="row">
                  <div className="col">
                    <input
                      className="form-control"
                      type="text"
                      name="name"
                      value={editingWorkflowName}
                      onChange={workflowNameChangeHandler}
                      required
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="row">
              <label htmlFor="description" className="col-md-4 col-form-label text-center">
                {t('approval_workflow.description')}
              </label>
              <div className="col-md-8">
                <div className="row">
                  <div className="col">
                    <textarea
                      className="form-control"
                      name="description"
                      value={editingWorkflowDescription}
                      onChange={workflowDescriptionChangeHandler}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className={styles['workflow-creation-modal-content']}>
            <EditableApproverGroupCards
              editingApproverGroups={editingApproverGroups}
              excludedSearchUserIds={excludedSearchUserIds}
              onUpdateApproverGroups={updateApproverGroupHandler}
              onClickAddApproverGroupCard={addApproverGroupHandler}
              onClickRemoveApproverGroupCard={removeApproverGroupHandler}
            />
          </div>

          <p className="my-3 text-muted text-center">{t('approval_workflow.description_for_new_creation')}</p>
        </div>
      </ModalBody>

      <ModalFooter>
        <button
          className="btn btn-primary mx-auto"
          type="button"
          disabled={!isCreatableWorkflow}
          onClick={createWorkflowButtonClickHandler}
        >
          {t('approval_workflow.create')}
        </button>
      </ModalFooter>
    </>
  );
};
