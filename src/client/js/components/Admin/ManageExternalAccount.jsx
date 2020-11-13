import React, { Fragment } from 'react';
import PropTypes from 'prop-types';
import { withTranslation } from 'react-i18next';

import PaginationWrapper from '../PaginationWrapper';

import { withUnstatedContainers } from '../UnstatedUtils';
import AppContainer from '../../services/AppContainer';
import AdminExternalAccountsContainer from '../../services/AdminExternalAccountsContainer';
import ExternalAccountTable from './Users/ExternalAccountTable';
import { toastError } from '../../util/apiNotification';


class ManageExternalAccount extends React.Component {

  constructor(props) {
    super(props);
    this.xss = window.xss;
    this.handleExternalAccountPage = this.handleExternalAccountPage.bind(this);
  }

  componentWillMount() {
    this.handleExternalAccountPage(1);
  }

  async handleExternalAccountPage(selectedPage) {
    try {
      await this.props.adminExternalAccountsContainer.retrieveExternalAccountsByPagingNum(selectedPage);
    }
    catch (err) {
      toastError(err);
    }
  }

  render() {
    const { t, adminExternalAccountsContainer } = this.props;
    const { activePage, totalAccounts, pagingLimit } = adminExternalAccountsContainer.state;

    return (
      <Fragment>
        <p>
          <a className="btn btn-outline-secondary" href="/admin/users">
            <i className="icon-fw ti-arrow-left" aria-hidden="true"></i>
            {t('admin:user_management.back_to_user_management')}
          </a>
        </p>

        <h2>{t('admin:user_management.external_account_list')}</h2>


        {totalAccounts === 0 ? <></> : (
          <PaginationWrapper
            activePage={activePage}
            changePage={this.handleExternalAccountPage}
            totalItemsCount={totalAccounts}
            pagingLimit={pagingLimit}
            align="right"
            size="sm"
          />
        )}

        <ExternalAccountTable />

        {totalAccounts === 0 ? <p>外部アカウントはありません</p> : (
          <PaginationWrapper
            activePage={activePage}
            changePage={this.handleExternalAccountPage}
            totalItemsCount={totalAccounts}
            pagingLimit={pagingLimit}
            align="right"
            size="sm"
          />
        )}

      </Fragment>
    );
  }

}

ManageExternalAccount.propTypes = {
  t: PropTypes.func.isRequired, // i18next
  appContainer: PropTypes.instanceOf(AppContainer).isRequired,
  adminExternalAccountsContainer: PropTypes.instanceOf(AdminExternalAccountsContainer).isRequired,
};

const ManageExternalAccountWrapper = withUnstatedContainers(ManageExternalAccount, [AppContainer, AdminExternalAccountsContainer]);


export default withTranslation()(ManageExternalAccountWrapper);
