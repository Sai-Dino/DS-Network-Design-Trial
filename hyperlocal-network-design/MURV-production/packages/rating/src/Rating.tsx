import React, { useMemo, useCallback, KeyboardEvent } from "react";
import { RatingWrapper, StarContainer, StyledBadge } from "./style";
import { IRatingProps } from "./types";
import StarIcon from "./icons/Star";

const MAX_RATING = 5;

export function Rating({ readOnly = false, rating, onChange, dataTestId = "rating-test-id", id = 'star' }: IRatingProps) {

  const starRefs = useMemo(
    () => Array.from({ length: MAX_RATING }, () => React.createRef<HTMLDivElement>()),
    [],
  );

  const handleStarKeyDown = useCallback(
    (event: KeyboardEvent<HTMLDivElement>, index: number) => {
      switch (event.key) {
        case "ArrowRight":
          if (index < MAX_RATING - 1) {
            starRefs[index + 1]?.current?.focus();
          } else {
            starRefs[0]?.current?.focus();
          }
          break;
        case "ArrowLeft":
          if (index > 0) {
            starRefs[index - 1]?.current?.focus();
          } else {
            starRefs[MAX_RATING - 1]?.current?.focus();
          }
          break;
        case "Enter":
          onChange?.(index + 1);
          break;
        case "Home":
          starRefs[0]?.current?.focus();
          break;
        default:
          break;
      }
    },
    [starRefs],
  );

  return (
    <RatingWrapper id={id}>
      {Array.from(Array(MAX_RATING), (_, index) => {
        const isSelected = index < (rating || 0);
        const starId = `${id}-${index + 1}`;
        return (
          <StarContainer
            key={starId}
            data-testid={`${dataTestId}-star-icon-${index}`}
            onClick={onChange && !readOnly ? () => onChange(index + 1) : undefined}
            readOnly={readOnly}
            onKeyDown={onChange && !readOnly ? (event) => handleStarKeyDown(event, index) : undefined}
            ref={starRefs[index]}
            tabIndex={readOnly ? -1 : 0}
            id={starId}
          >
            <input
              className="visuallyhidden"
              type="radio"
              name="rating"
              id={starId}
              value={index + 1}
              aria-checked={isSelected ? "true" : "false"}
              aria-posinset={index + 1}
              checked={index + 1 === rating}
              aria-hidden="true"
            />
            <label htmlFor={starId} aria-hidden="true">
              <p className="visuallyhidden">{index + 1}</p>
              <StarIcon role="presentation" isSelected={isSelected} />
            </label>
          </StarContainer>
        );
      })}
      <StyledBadge type="subtle">{rating}</StyledBadge>
    </RatingWrapper>
  );
}
