import React from 'react';
import { InAppNotification as IInAppNotification } from '../../interfaces/in-app-notification';

interface Props {
  actionUsers: string
  notification: IInAppNotification
  onClick: () => void
}
export const PageCommentInAppNotification = (props: Props): JSX.Element => {

  return (
    <>
      <b>{props.actionUsers}</b> commented on {props.notification.target.path}
    </>
  );

};
