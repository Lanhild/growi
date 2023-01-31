import {
  useState, useCallback, useEffect,
} from 'react';

import { useTranslation } from 'next-i18next';

import { toastSuccess, toastError } from '~/client/util/apiNotification';
import { apiv3Put } from '~/client/util/apiv3-client';
import { useSWRxAppSettings } from '~/stores/admin/app-settings';
import loggerFactory from '~/utils/logger';

import AdminUpdateButtonRow from '../Common/AdminUpdateButtonRow';

const logger = loggerFactory('growi:questionnaireSettings');

const QuestionnaireSettings = (): JSX.Element => {
  // TODO: i18n
  const { t } = useTranslation();

  const { data, error, mutate } = useSWRxAppSettings();

  const [isEnableQuestionnaire, setIsEnableQuestionnaire] = useState(data?.isEnableQuestionnaire);
  const onChangeIsEnableQuestionnaireHandler = useCallback(() => {
    setIsEnableQuestionnaire(prev => !prev);
  }, []);

  const [isAppSiteUrlHashed, setIsAppSiteUrlHashed] = useState(data?.isAppSiteUrlHashed);
  const onChangeisAppSiteUrlHashedHandler = useCallback(() => {
    setIsAppSiteUrlHashed(prev => !prev);
  }, []);

  const onSubmitHandler = useCallback(async() => {
    try {
      await apiv3Put('/app-settings/questionnaire-settings', {
        isEnableQuestionnaire,
        isAppSiteUrlHashed,
      });
      toastSuccess(t('toaster.update_successed', { target: 'アンケート設定', ns: 'commons' }));
    }
    catch (err) {
      toastError(err);
    }
    mutate();
  }, [isAppSiteUrlHashed, isEnableQuestionnaire, mutate, t]);

  // Sync SWR value and state
  useEffect(() => {
    setIsEnableQuestionnaire(data?.isEnableQuestionnaire);
    setIsAppSiteUrlHashed(data?.isAppSiteUrlHashed);
  }, [data, data?.isAppSiteUrlHashed, data?.isEnableQuestionnaire]);

  const isLoading = data === undefined && error === undefined;

  return (
    <div id="questionnaire-settings" className="mb-5">
      <p className="card well">
        システム全体でアンケート機能を有効/無効にします。また、ユーザーは設定画面から個別にアンケート機能を有効/無効にできます。<br />
        送信されるデータにユーザーの個人情報は一切含まれません。
        <div>
          {/* eslint-disable-next-line max-len */}
          詳しくは<a href="https://docs.growi.org/ja/admin-guide/management-cookbook/app-settings.html" rel="noreferrer" target="_blank" className="d-inline"> GROWI Docs &quot;アンケート設定&quot; <i className="icon-share-alt"></i></a>を参照ください。
        </div>
        <br />
        GROWI の改善にご協力お願いします。
      </p>

      {isLoading && <div className="text-muted text-center mb-5">
        <i className="fa fa-2x fa-spinner fa-pulse mr-1" />
      </div>}

      {!isLoading && (
        <>
          <div className="row my-3">
            <div className="custom-control custom-switch custom-checkbox-primary col-md-5 offset-md-5">
              <input
                type="checkbox"
                className="custom-control-input"
                id="isEnableQuestionnaire"
                checked={isEnableQuestionnaire}
                onChange={onChangeIsEnableQuestionnaireHandler}
              />
              <label className="custom-control-label" htmlFor="isEnableQuestionnaire">
                アンケートを有効にする
              </label>
            </div>
          </div>

          <div className="row my-4">
            <div className="custom-control custom-checkbox custom-checkbox-primary col-md-5 offset-md-5">
              <input
                type="checkbox"
                className="custom-control-input"
                id="isAppSiteUrlHashed"
                checked={isAppSiteUrlHashed}
                onChange={onChangeisAppSiteUrlHashedHandler}
                disabled={!isEnableQuestionnaire}
              />
              <label className="custom-control-label" htmlFor="isAppSiteUrlHashed">
                サイト URL を匿名化して送信する
              </label>
              <p className="form-text text-muted small">
                アンケート回答データに含まれるサイト URL が匿名化されます。この設定を有効にすることで、アンケート回答データの送信元である GROWI アプリケーションが特定されなくなります。
              </p>
            </div>
          </div>

          <AdminUpdateButtonRow onClick={onSubmitHandler}/>
        </>
      )}
    </div>
  );
};

export default QuestionnaireSettings;
