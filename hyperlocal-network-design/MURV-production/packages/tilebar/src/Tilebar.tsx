import React from "react";
import { Divider } from "@murv/divider";
import { Tile } from "@murv/tile";
import { ITileBarProps, ITilesComponentProps } from "./types";
import { TileBarContainer } from "./styles";

function TileBar({
  tiles = [],
  gap = "8px",
  testId = "tile-bar",
  selectedId,
  onClick = () => {},
  onFocus = () => {},
  onHover = () => {},
}: ITileBarProps) {
  return (
    <TileBarContainer gap={gap} data-testid={testId}>
      {tiles.map((tile: ITilesComponentProps, index: number) => (
        <React.Fragment key={tile.id || `tile-${index}`}>
          {tile.infoText ? (
            <Tile.TileWithIcon
              {...tile}
              selected={tile.selected || selectedId === tile.id}
              onClick={(e) => onClick(e, tile.id)}
              onFocus={(e) => onFocus(e, tile.id)}
              onHover={(e) => onHover(e, tile.id)}
            />
          ) : (
            <Tile.SimpleTile
              {...tile}
              selected={tile.selected || selectedId === tile.id}
              onClick={(e) => onClick(e, tile.id)}
              onFocus={(e) => onFocus(e, tile.id)}
              onHover={(e) => onHover(e, tile.id)}
            />
          )}
          {tile.hasDivider ? <Divider direction="vertical" /> : null}
        </React.Fragment>
      ))}
    </TileBarContainer>
  );
}

export default TileBar;
