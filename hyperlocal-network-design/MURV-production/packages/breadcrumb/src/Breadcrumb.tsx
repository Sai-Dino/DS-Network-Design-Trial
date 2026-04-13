import React, { CSSProperties } from "react";
import { Link } from "@murv/link";
import { useTheme } from "styled-components";
import { Icon } from "./Icon";
import { BreadcrumbProps } from "./types";
import { BreadcrumbContainer, BreadcrumbElement } from "./styles";

const Breadcrumb: React.FC<BreadcrumbProps> = ({
  id,
  dataTestId,
  routes = [],
  baseIconId = "home-icon-id",
  separatorIconId = "base-separator-icon-id",
  truncateIconId = "truncate-icon-id",
  showBaseIcon = true,
  showSeparatorIcon = true,
}) => {
  const theme = useTheme();
  const customStyles: CSSProperties = {
    fontSize: theme.murv.typography.subtext.s.size,
    fontWeight: theme.murv.typography.subtext.s.weight,
    lineHeight: theme.murv.typography.subtext.s.lineHeight,
    letterSpacing: theme.murv.typography.subtext.s.letterSpacing,
  };
  const routesLength = routes.length;
  return (
    <BreadcrumbContainer id={id} data-testid={dataTestId}>
      {routes.map((route, idx) => {
        let component;
        const styles: CSSProperties = { ...customStyles };
        if (idx === routesLength - 1) {
          styles.color = theme.murv.color.text.secondary;
        }
        if (routesLength > 4 && idx > 2 && idx < routesLength - 2) {
          component = null;
        } else {
          let content;
          if (routesLength > 4 && idx === 2) {
            content = <Icon id={truncateIconId} />;
          } else if (idx === routesLength - 1) {
            content = <span style={styles}>{route.caption}</span>;
          } else {
            content = <Link {...route} styles={styles} />;
          }

          component = (
            <BreadcrumbElement>
              {idx === 0 && showBaseIcon ? <Icon id={baseIconId} /> : null}
              {idx > 0 && showSeparatorIcon ? <Icon id={separatorIconId} /> : null}
              {content}
            </BreadcrumbElement>
          );
        }
        return component;
      })}
    </BreadcrumbContainer>
  );
};

export default Breadcrumb;
