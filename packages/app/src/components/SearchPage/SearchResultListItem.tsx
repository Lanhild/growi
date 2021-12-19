import React, { FC, memo } from 'react';

import Clamp from 'react-multiline-clamp';

import { UserPicture, PageListMeta, PagePathLabel } from '@growi/ui';
import { pagePathUtils } from '@growi/core';
import { useIsDeviceSmallerThanMd } from '~/stores/ui';

import { IPageSearchResultData } from '../../interfaces/search';
import PageItemControl from '../Common/Dropdown/PageItemControl';

const { isTopPage } = pagePathUtils;

type Props = {
  page: IPageSearchResultData,
  isSelected: boolean,
  isChecked: boolean,
  isEnableActions: boolean,
  shortBody?: string
  onClickCheckbox?: (pageId: string) => void,
  onClickSearchResultItem?: (pageId: string) => void,
  onClickDeleteButton?: (pageId: string) => void,
}

const SearchResultListItem: FC<Props> = memo((props:Props) => {
  const {
    // todo: refactoring variable name to clear what changed
    page: { pageData, pageMeta }, isSelected, onClickSearchResultItem, onClickCheckbox, isChecked, isEnableActions, shortBody,
  } = props;

  const { data: isDeviceSmallerThanMd } = useIsDeviceSmallerThanMd();

  // Add prefix 'id_' in pageId, because scrollspy of bootstrap doesn't work when the first letter of id attr of target component is numeral.
  const pageId = `#${pageData._id}`;

  const pageTitle = (
    <PagePathLabel
      path={pageMeta.elasticSearchResult?.highlightedPath || pageData.path}
      isLatterOnly
      isPathIncludedHtml={pageMeta.elasticSearchResult?.isHtmlInPath}
    >
    </PagePathLabel>
  );
  const pagePathElem = (
    <PagePathLabel
      path={pageMeta.elasticSearchResult?.highlightedPath || pageData.path}
      isFormerOnly
      isPathIncludedHtml={pageMeta.elasticSearchResult?.isHtmlInPath}
    />
  );

  const responsiveListStyleClass = `${isDeviceSmallerThanMd ? '' : `list-group-item-action ${isSelected ? 'active' : ''}`}`;

  return (
    <li
      key={pageData._id}
      className={`w-100 page-list-li search-result-item border-bottom ${responsiveListStyleClass}`}
    >
      <a
        className="d-block h-100"
        href={pageId}
        onClick={() => onClickSearchResultItem != null && onClickSearchResultItem(pageData._id)}
      >
        <div className="d-flex h-100">
          {/* checkbox */}
          <div className="form-check d-flex align-items-center justify-content-center px-md-2 pl-3 pr-2 search-item-checkbox">
            <input
              className="form-check-input position-relative m-0"
              type="checkbox"
              id="flexCheckDefault"
              onChange={() => {
                if (onClickCheckbox != null) {
                  onClickCheckbox(pageData._id);
                }
              }}
              checked={isChecked}
            />
          </div>
          <div className="search-item-text p-md-3 pl-2 py-3 pr-3 flex-grow-1">
            {/* page path */}
            <h6 className="mb-1 py-1">
              <i className="icon-fw icon-home"></i>
              {pagePathElem}
            </h6>
            <div className="d-flex align-items-center mb-2">
              {/* Picture */}
              <span className="mr-2 d-none d-md-block">
                <UserPicture user={pageData.lastUpdateUser} size="sm" />
              </span>
              {/* page title */}
              <Clamp lines={1}>
                <span className="h5 mr-2 mb-0">
                  {pageTitle}
                </span>
              </Clamp>
              {/* page meta */}
              <div className="d-none d-md-flex item-meta py-0 px-1">
                <PageListMeta page={pageData} bookmarkCount={pageMeta.bookmarkCount} />
              </div>
              {/* doropdown icon includes page control buttons */}
              <div className="item-control ml-auto">
                <PageItemControl
                  page={pageData}
                  onClickDeleteButton={props.onClickDeleteButton}
                  isEnableActions={isEnableActions}
                  isDeletable={!isTopPage(pageData.path)}
                />
              </div>
            </div>
            <div className="search-result-list-snippet py-1">
              <Clamp lines={2}>
                {
                  pageMeta.elasticSearchResult != null && pageMeta.elasticSearchResult?.snippet.length !== 0 ? (
                    <div dangerouslySetInnerHTML={{ __html: pageMeta.elasticSearchResult.snippet }}></div>
                  ) : (
                    <div>{ shortBody != null ? shortBody : 'Loading ...' }</div> // TODO: improve indicator
                  )
                }
              </Clamp>
            </div>
          </div>
        </div>
        {/* TODO: adjust snippet position */}
      </a>
    </li>
  );
});

export default SearchResultListItem;
