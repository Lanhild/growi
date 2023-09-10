import mongoose from 'mongoose';

import { WorkflowStatus, WorkflowApproverStatus, WorkflowApprovalType } from '../../../src/interfaces/workflow';
import Workflow from '../../../src/server/models/workflow';

let page1;
let page2;

describe('Workflow', () => {

  beforeAll(async() => {
    page1 = new mongoose.Types.ObjectId();
    page2 = new mongoose.Types.ObjectId();

    await Workflow.insertMany([
      {
        creator: new mongoose.Types.ObjectId(),
        pageId: page1,
        name: 'page1 Workflow',
        comment: 'commnet',
        status: WorkflowStatus.INPROGRESS,
        approverGroups: [
          {
            approvalType: WorkflowApprovalType.AND,
            approvers: [
              {
                user: new mongoose.Types.ObjectId(),
                status: WorkflowApproverStatus.NONE,
              },
            ],
          },
        ],
      },
    ]);
  });

  describe('hasInprogressWorkflowInTargetPage()', () => {
    test('found', async() => {
      // when
      const hasInprogressWorkflowInTargetPage = await Workflow.hasInprogressWorkflowInTargetPage(page1);

      // then
      expect(hasInprogressWorkflowInTargetPage).toBe(true);
    });

    test('not found', async() => {
      // when
      const hasInprogressWorkflowInTargetPage = await Workflow.hasInprogressWorkflowInTargetPage(page2);

      // then
      expect(hasInprogressWorkflowInTargetPage).toBe(false);
    });
  });
});
