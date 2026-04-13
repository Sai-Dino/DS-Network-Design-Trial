import React, { FC } from "react";
import { Divider } from "@murv/divider";
import { Button } from "@murv/button";
import { Search as SearchIcon } from "@murv/icons";
import { useMURVContext } from "@murv/provider";
import {
  SearchIconWrapper,
  FeedbackContainer,
  FeedbackBaseText,
  FailedItemsText,
  MixedMessageWrapper,
  SeperatorContainer,
  ButtonContainer,
  LabelText,
  DividerAndIconsWrapper,
} from "./styles";
import { SearchFeedbackProps } from "./types";

const SearchFeedback: FC<SearchFeedbackProps> = ({
  totalItemCount,
  foundItemCount,
  foundItems = [],
  notFoundItemCount,
  notFoundItems = [],
  actionLabel = "Copy",
  onReset,
  width,
  showActions = true,
  displayMode = "search",
}) => {
  const { theme } = useMURVContext();
  const renderFoundMessage = () =>
    foundItemCount === 1 && foundItems ? (
      <FeedbackBaseText data-testid="found-message">
        Results found for {foundItems[0]}
      </FeedbackBaseText>
    ) : (
      <FeedbackBaseText data-testid="found-message">
        Results found for {foundItemCount} / {totalItemCount} items
      </FeedbackBaseText>
    );

  const renderNotFoundMessage = () =>
    notFoundItemCount === 1 && notFoundItemCount ? (
      <FailedItemsText data-testid="not-found-message">
        No Results found for {notFoundItems[0]}
      </FailedItemsText>
    ) : (
      <FailedItemsText data-testid="not-found-message">
        No Results found for {notFoundItemCount} / {totalItemCount} items
      </FailedItemsText>
    );

  const renderMixedMessage = () =>
    notFoundItemCount === 1 && foundItemCount === 1 && notFoundItems && foundItems ? (
      <MixedMessageWrapper>
        <FeedbackBaseText data-testid="found-message">
          Showing results for {foundItems[0]}{" "}
        </FeedbackBaseText>
        <FailedItemsText data-testid="not-found-message">
          No Results found for {notFoundItems[0]}
        </FailedItemsText>
      </MixedMessageWrapper>
    ) : (
      <MixedMessageWrapper>
        <FeedbackBaseText data-testid="found-message">
          Showing results for {foundItemCount}/ {totalItemCount} items
        </FeedbackBaseText>
        <FailedItemsText data-testid="not-found-message">
          No Results found for {notFoundItemCount} / {totalItemCount} items
        </FailedItemsText>
      </MixedMessageWrapper>
    );
  const copyToClipboard = (notFoundItem: string[]) => {
    const itemString = notFoundItem.join(", ");
    navigator.clipboard.writeText(itemString);
  };

  const renderFeedbackContent = () => {
    if (displayMode === "total") {
      return (
        <FeedbackBaseText data-testid="total-message">
          Total {totalItemCount} Items
        </FeedbackBaseText>
      );
    }

    if (foundItemCount > 0 && notFoundItemCount > 0) {
      return renderMixedMessage();
    }

    return (
      <>
        {foundItemCount > 0 && renderFoundMessage()}
        {notFoundItemCount > 0 && renderNotFoundMessage()}
      </>
    );
  };

  return (
    <FeedbackContainer
      width={width || (showActions ? "100%" : "fit-content")}
      showActions={showActions}
    >
      <SearchIconWrapper>
        {displayMode === "search" ? <SearchIcon color={theme.color.icon.secondary} /> : "#"}
      </SearchIconWrapper>
      {renderFeedbackContent()}

      {showActions ? (
        <DividerAndIconsWrapper>
          {foundItemCount > 1 && notFoundItemCount > 1 && (
            <ButtonContainer>
              <Button
                buttonType="inline"
                buttonStyle="brand"
                size="small"
                onClick={() => copyToClipboard(notFoundItems)}
              >
                <LabelText>{actionLabel}</LabelText>
              </Button>
            </ButtonContainer>
          )}
          <SeperatorContainer>
            <Divider direction="vertical" />
          </SeperatorContainer>

          <Button
            buttonType="inline"
            buttonStyle="brand"
            type="reset"
            size="small"
            onClick={onReset}
          >
            <LabelText>Reset</LabelText>
          </Button>
        </DividerAndIconsWrapper>
      ) : null}
    </FeedbackContainer>
  );
};

export default SearchFeedback;
