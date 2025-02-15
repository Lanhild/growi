import React, { useState, useCallback, useMemo } from 'react';


import { isPopulated } from '@growi/core';
import type {
  IPagePopulatedToShowRevision,
  IPageToRenameWithMeta, IPageWithMeta, IPageInfoForEntity,
} from '@growi/core';
import { pagePathUtils } from '@growi/core/dist/utils';
import { useTranslation } from 'next-i18next';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import { useRouter } from 'next/router';
import Sticky from 'react-stickynode';
import { DropdownItem } from 'reactstrap';

import { useShouldExpandContent } from '~/client/services/layout';
import { exportAsMarkdown, updateContentWidth } from '~/client/services/page-operation';
import type { OnDuplicatedFunction, OnRenamedFunction, OnDeletedFunction } from '~/interfaces/ui';
import {
  useCurrentPathname,
  useCurrentUser, useIsGuestUser, useIsReadOnlyUser, useIsSharedUser, useShareLinkId,
} from '~/stores/context';
import {
  usePageAccessoriesModal, PageAccessoriesModalContents, type IPageForPageDuplicateModal,
  usePageDuplicateModal, usePageRenameModal, usePageDeleteModal, usePagePresentationModal,
} from '~/stores/modal';
import {
  useSWRMUTxCurrentPage, useCurrentPageId, useSWRxPageInfo,
} from '~/stores/page';
import { mutatePageTree } from '~/stores/page-listing';
import {
  useEditorMode, useIsAbleToShowPageManagement,
  useIsAbleToChangeEditorMode,
  useIsDeviceLargerThanMd,
} from '~/stores/ui';

import { CreateTemplateModal } from '../CreateTemplateModal';
import { NotAvailable } from '../NotAvailable';
import { Skeleton } from '../Skeleton';

import { GroundGlassBar } from './GroundGlassBar';

import styles from './GrowiContextualSubNavigation.module.scss';
import PageEditorModeManagerStyles from './PageEditorModeManager.module.scss';

const PageEditorModeManager = dynamic(
  () => import('./PageEditorModeManager').then(mod => mod.PageEditorModeManager),
  { ssr: false, loading: () => <Skeleton additionalClass={`${PageEditorModeManagerStyles['grw-page-editor-mode-manager-skeleton']}`} /> },
);
const PageControls = dynamic(
  () => import('../PageControls').then(mod => mod.PageControls),
  { ssr: false, loading: () => <></> },
);


type PageOperationMenuItemsProps = {
  pageId: string,
  revisionId: string,
  isLinkSharingDisabled?: boolean,
}

const PageOperationMenuItems = (props: PageOperationMenuItemsProps): JSX.Element => {
  const { t } = useTranslation();

  const {
    pageId, revisionId, isLinkSharingDisabled,
  } = props;

  const { data: isGuestUser } = useIsGuestUser();
  const { data: isReadOnlyUser } = useIsReadOnlyUser();
  const { data: isSharedUser } = useIsSharedUser();

  const { open: openPresentationModal } = usePagePresentationModal();
  const { open: openAccessoriesModal } = usePageAccessoriesModal();

  return (
    <>
      {/* Presentation */}
      <DropdownItem
        onClick={() => openPresentationModal()}
        data-testid="open-presentation-modal-btn"
        className="grw-page-control-dropdown-item"
      >
        <span className="material-symbols-outlined me-1 grw-page-control-dropdown-icon">jamboard_kiosk</span>
        {t('Presentation Mode')}
      </DropdownItem>

      {/* Export markdown */}
      <DropdownItem
        onClick={() => exportAsMarkdown(pageId, revisionId, 'md')}
        className="grw-page-control-dropdown-item"
      >
        <span className="material-symbols-outlined me-1 grw-page-control-dropdown-icon">cloud_download</span>
        {t('export_bulk.export_page_markdown')}
      </DropdownItem>

      <DropdownItem divider />

      {/*
        TODO: show Tooltip when menu is disabled
        refs: PageAccessoriesModalControl
      */}
      <DropdownItem
        onClick={() => openAccessoriesModal(PageAccessoriesModalContents.PageHistory)}
        disabled={!!isGuestUser || !!isSharedUser}
        data-testid="open-page-accessories-modal-btn-with-history-tab"
        className="grw-page-control-dropdown-item"
      >
        <span className="material-symbols-outlined me-1 grw-page-control-dropdown-icon">history</span>
        {t('History')}
      </DropdownItem>

      <DropdownItem
        onClick={() => openAccessoriesModal(PageAccessoriesModalContents.Attachment)}
        data-testid="open-page-accessories-modal-btn-with-attachment-data-tab"
        className="grw-page-control-dropdown-item"
      >
        <span className="material-symbols-outlined me-1 grw-page-control-dropdown-icon">attachment</span>
        {t('attachment_data')}
      </DropdownItem>

      {!isGuestUser && !isReadOnlyUser && !isSharedUser && (
        <NotAvailable isDisabled={isLinkSharingDisabled ?? false} title="Disabled by admin">
          <DropdownItem
            onClick={() => openAccessoriesModal(PageAccessoriesModalContents.ShareLink)}
            data-testid="open-page-accessories-modal-btn-with-share-link-management-data-tab"
            className="grw-page-control-dropdown-item"
          >
            <span className="material-symbols-outlined me-1 grw-page-control-dropdown-icon">share</span>
            {t('share_links.share_link_management')}
          </DropdownItem>
        </NotAvailable>
      )}
    </>
  );
};

type CreateTemplateMenuItemsProps = {
  onClickTemplateMenuItem: (isPageTemplateModalShown: boolean) => void,
}

const CreateTemplateMenuItems = (props: CreateTemplateMenuItemsProps): JSX.Element => {
  const { t } = useTranslation();

  const { onClickTemplateMenuItem } = props;

  const openPageTemplateModalHandler = () => {
    onClickTemplateMenuItem(true);
  };

  return (
    <>
      {/* Create template */}
      <DropdownItem
        onClick={openPageTemplateModalHandler}
        className="grw-page-control-dropdown-item"
        data-testid="open-page-template-modal-btn"
      >
        <span className="material-symbols-outlined me-1 grw-page-control-dropdown-icon">contract_edit</span>
        {t('template.option_label.create/edit')}
      </DropdownItem>
    </>
  );
};

type GrowiContextualSubNavigationProps = {
  currentPage?: IPagePopulatedToShowRevision | null,
  isLinkSharingDisabled?: boolean,
};

const GrowiContextualSubNavigation = (props: GrowiContextualSubNavigationProps): JSX.Element => {

  const { currentPage } = props;

  const { t } = useTranslation();

  const router = useRouter();

  const { data: shareLinkId } = useShareLinkId();
  const { trigger: mutateCurrentPage } = useSWRMUTxCurrentPage();

  const { data: currentPathname } = useCurrentPathname();
  const isSharedPage = pagePathUtils.isSharedPage(currentPathname ?? '');

  const revision = currentPage?.revision;
  const revisionId = (revision != null && isPopulated(revision)) ? revision._id : undefined;

  const { data: editorMode } = useEditorMode();
  const { data: pageId } = useCurrentPageId();
  const { data: currentUser } = useCurrentUser();
  const { data: isGuestUser } = useIsGuestUser();
  const { data: isReadOnlyUser } = useIsReadOnlyUser();
  const { data: isSharedUser } = useIsSharedUser();

  const shouldExpandContent = useShouldExpandContent(currentPage);

  const { data: isAbleToShowPageManagement } = useIsAbleToShowPageManagement();
  const { data: isAbleToChangeEditorMode } = useIsAbleToChangeEditorMode();
  const { data: isDeviceLargerThanMd } = useIsDeviceLargerThanMd();

  const { open: openDuplicateModal } = usePageDuplicateModal();
  const { open: openRenameModal } = usePageRenameModal();
  const { open: openDeleteModal } = usePageDeleteModal();
  const { mutate: mutatePageInfo } = useSWRxPageInfo(pageId);

  const [isStickyActive, setStickyActive] = useState(false);


  const path = currentPage?.path ?? currentPathname;
  // const grant = currentPage?.grant ?? grantData?.grant;
  // const grantUserGroupId = currentPage?.grantedGroup?._id ?? grantData?.grantedGroup?.id;

  const [isPageTemplateModalShown, setIsPageTempleteModalShown] = useState(false);

  const { isLinkSharingDisabled } = props;

  const duplicateItemClickedHandler = useCallback(async(page: IPageForPageDuplicateModal) => {
    const duplicatedHandler: OnDuplicatedFunction = (fromPath, toPath) => {
      router.push(toPath);
    };
    openDuplicateModal(page, { onDuplicated: duplicatedHandler });
  }, [openDuplicateModal, router]);

  const renameItemClickedHandler = useCallback(async(page: IPageToRenameWithMeta<IPageInfoForEntity>) => {
    const renamedHandler: OnRenamedFunction = () => {
      mutateCurrentPage();
      mutatePageInfo();
      mutatePageTree();
    };
    openRenameModal(page, { onRenamed: renamedHandler });
  }, [mutateCurrentPage, mutatePageInfo, openRenameModal]);

  const deleteItemClickedHandler = useCallback((pageWithMeta: IPageWithMeta) => {
    const deletedHandler: OnDeletedFunction = (pathOrPathsToDelete, isRecursively, isCompletely) => {
      if (typeof pathOrPathsToDelete !== 'string') {
        return;
      }

      const path = pathOrPathsToDelete;

      if (isCompletely) {
        // redirect to NotFound Page
        router.push(path);
      }
      else if (currentPathname != null) {
        router.push(currentPathname);
      }

      mutateCurrentPage();
      mutatePageInfo();
      mutatePageTree();
    };
    openDeleteModal([pageWithMeta], { onDeleted: deletedHandler });
  }, [currentPathname, mutateCurrentPage, openDeleteModal, router, mutatePageInfo]);

  const switchContentWidthHandler = useCallback(async(pageId: string, value: boolean) => {
    if (!isSharedPage) {
      await updateContentWidth(pageId, value);
      mutateCurrentPage();
    }
  }, [isSharedPage, mutateCurrentPage]);

  const additionalMenuItemsRenderer = useCallback(() => {
    if (revisionId == null || pageId == null) {
      return (
        <>
          {!isReadOnlyUser
            && (
              <CreateTemplateMenuItems
                onClickTemplateMenuItem={() => setIsPageTempleteModalShown(true)}
              />
            )
          }
        </>
      );
    }
    return (
      <>
        <PageOperationMenuItems
          pageId={pageId}
          revisionId={revisionId}
          isLinkSharingDisabled={isLinkSharingDisabled}
        />
        {!isReadOnlyUser && (
          <>
            <DropdownItem divider />
            <CreateTemplateMenuItems
              onClickTemplateMenuItem={() => setIsPageTempleteModalShown(true)}
            />
          </>
        )
        }
      </>
    );
  }, [isLinkSharingDisabled, isReadOnlyUser, pageId, revisionId]);

  // hide sub controls when sticky on mobile device
  const hideSubControls = useMemo(() => {
    return !isDeviceLargerThanMd && isStickyActive;
  }, [isDeviceLargerThanMd, isStickyActive]);

  return (
    <>
      <GroundGlassBar className="py-4 d-block d-md-none d-print-none border-bottom" />

      <Sticky className="z-1" onStateChange={status => setStickyActive(status.status === Sticky.STATUS_FIXED)}>
        <GroundGlassBar>

          <nav
            className={`${styles['grw-contextual-sub-navigation']}
              d-flex align-items-center justify-content-end px-2 px-sm-3 px-md-4 py-1 gap-2 gap-md-4 d-print-none
            `}
            data-testid="grw-contextual-sub-nav"
            id="grw-contextual-sub-nav"
          >

            {pageId != null && (
              <PageControls
                pageId={pageId}
                revisionId={revisionId}
                shareLinkId={shareLinkId}
                path={path ?? currentPathname} // If the page is empty, "path" is undefined
                expandContentWidth={shouldExpandContent}
                disableSeenUserInfoPopover={isSharedUser}
                hideSubControls={hideSubControls}
                showPageControlDropdown={isAbleToShowPageManagement}
                additionalMenuItemRenderer={additionalMenuItemsRenderer}
                onClickDuplicateMenuItem={duplicateItemClickedHandler}
                onClickRenameMenuItem={renameItemClickedHandler}
                onClickDeleteMenuItem={deleteItemClickedHandler}
                onClickSwitchContentWidth={switchContentWidthHandler}
              />
            )}

            {isAbleToChangeEditorMode && (
              <PageEditorModeManager
                editorMode={editorMode}
                isBtnDisabled={!!isGuestUser || !!isReadOnlyUser}
                path={path}
                // grant={grant}
                // grantUserGroupId={grantUserGroupId}
              />
            )}

            { isGuestUser && (
              <div className="mt-2">
                <Link href="/login#register" className="btn me-2" prefetch={false}>
                  <span className="material-symbols-outlined me-1">person_add</span>{t('Sign up')}
                </Link>
                <Link href="/login#login" className="btn btn-primary" prefetch={false}>
                  <span className="material-symbols-outlined me-1">login</span>{t('Sign in')}
                </Link>
              </div>
            ) }
          </nav>

        </GroundGlassBar>
      </Sticky>

      {path != null && currentUser != null && !isReadOnlyUser && (
        <CreateTemplateModal
          path={path}
          isOpen={isPageTemplateModalShown}
          onClose={() => setIsPageTempleteModalShown(false)}
        />
      )}
    </>
  );

};


export default GrowiContextualSubNavigation;
