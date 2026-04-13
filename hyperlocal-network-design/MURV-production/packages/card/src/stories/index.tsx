import React from "react";
import Tag from "@murv/tag";
import Button from "@murv/button";
import Link from "@murv/link";
import { Info, Save } from "@murv/icons";
import { Tooltip } from "@murv/tooltip";
import Card from "../components/Card";

const HeaderIcon: React.FC = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="21" height="20" viewBox="0 0 21 20" fill="none">
    <path
      d="M6.04246 16.6667V7.47918C6.04246 7.02085 6.20912 6.63196 6.54246 6.31251C6.87579 5.99307 7.27162 5.83335 7.72996 5.83335H16.8758C17.3341 5.83335 17.7265 5.99654 18.0529 6.32293C18.3793 6.64932 18.5425 7.04168 18.5425 7.50001V14.1667L14.3758 18.3333H7.70912C7.25079 18.3333 6.85843 18.1702 6.53204 17.8438C6.20565 17.5174 6.04246 17.125 6.04246 16.6667ZM1.89662 5.20835C1.81329 4.75001 1.90357 4.33682 2.16746 3.96876C2.43135 3.60071 2.79246 3.37501 3.25079 3.29168L12.2925 1.68751C12.7508 1.60418 13.164 1.69446 13.532 1.95835C13.9001 2.22223 14.1258 2.58335 14.2091 3.04168L14.4175 4.16668H12.7091L12.5633 3.33335L3.54246 4.93751L4.37579 9.64585V15.4583C4.15357 15.3333 3.9626 15.1667 3.80287 14.9583C3.64315 14.75 3.54246 14.5139 3.50079 14.25L1.89662 5.20835ZM7.70912 7.50001V16.6667H13.5425V13.3333H16.8758V7.50001H7.70912Z"
      fill="#2A55E5"
    />
  </svg>
);
const MenuIcon: React.FC = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="21"
    height="20"
    viewBox="0 0 21 20"
    fill="none"
    display="flex"
  >
    <path
      d="M10.2047 16C9.79097 16 9.43827 15.8527 9.14661 15.5581C8.85494 15.2635 8.70911 14.9093 8.70911 14.4956C8.70911 14.0819 8.85641 13.7292 9.15102 13.4375C9.44565 13.1458 9.79981 13 10.2135 13C10.6272 13 10.9799 13.1473 11.2716 13.4419C11.5633 13.7365 11.7091 14.0907 11.7091 14.5044C11.7091 14.9181 11.5618 15.2708 11.2672 15.5625C10.9726 15.8542 10.6184 16 10.2047 16ZM10.2047 11.5C9.79097 11.5 9.43827 11.3527 9.14661 11.0581C8.85494 10.7635 8.70911 10.4093 8.70911 9.99558C8.70911 9.58186 8.85641 9.22917 9.15102 8.9375C9.44565 8.64583 9.79981 8.5 10.2135 8.5C10.6272 8.5 10.9799 8.64731 11.2716 8.94192C11.5633 9.23654 11.7091 9.59071 11.7091 10.0044C11.7091 10.4181 11.5618 10.7708 11.2672 11.0625C10.9726 11.3542 10.6184 11.5 10.2047 11.5ZM10.2047 7C9.79097 7 9.43827 6.8527 9.14661 6.55808C8.85494 6.26346 8.70911 5.90929 8.70911 5.49558C8.70911 5.08186 8.85641 4.72917 9.15102 4.4375C9.44565 4.14583 9.79981 4 10.2135 4C10.6272 4 10.9799 4.14731 11.2716 4.44192C11.5633 4.73654 11.7091 5.09071 11.7091 5.50442C11.7091 5.91814 11.5618 6.27083 11.2672 6.5625C10.9726 6.85417 10.6184 7 10.2047 7Z"
      fill="#212121"
    />
  </svg>
);

const DummyImage: React.FC = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="39" height="39" viewBox="0 0 39 39" fill="none">
    <path
      d="M0.709106 8.15109C0.709106 4.00896 4.06697 0.651093 8.20911 0.651093H30.2091C34.3512 0.651093 37.7091 4.00896 37.7091 8.15109V30.1511C37.7091 34.2932 34.3512 37.6511 30.2091 37.6511H8.20911C4.06697 37.6511 0.709106 34.2932 0.709106 30.1511V8.15109Z"
      fill="#ABC8FF"
      stroke="#EEEEEE"
    />
  </svg>
);
const DummyImageBig: React.FC = () => (
  <div
    style={{
      borderRadius: "8px",
      border: "1px solid  #EEE",
      background: "#ABC8FF",
      width: "100%",
      height: "200px",
    }}
  />
);
const DummyIcon: React.FC = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="21" height="21" viewBox="0 0 21 21" fill="none">
    <path
      d="M10.2091 18.4844C9.75077 18.4844 9.35841 18.3212 9.03202 17.9949C8.70563 17.6685 8.54244 17.2761 8.54244 16.8178H11.8549C11.8549 17.2761 11.6952 17.6685 11.3758 17.9949C11.0563 18.3212 10.6674 18.4844 10.2091 18.4844ZM7.75077 16.0678C7.51466 16.0678 7.3098 15.981 7.13619 15.8073C6.96258 15.6337 6.87577 15.4289 6.87577 15.1928C6.87577 14.9567 6.96258 14.7518 7.13619 14.5782C7.3098 14.4046 7.51466 14.3178 7.75077 14.3178H12.6466C12.8827 14.3178 13.0876 14.4046 13.2612 14.5782C13.4348 14.7518 13.5216 14.9567 13.5216 15.1928C13.5216 15.4289 13.4348 15.6337 13.2612 15.8073C13.0876 15.981 12.8827 16.0678 12.6466 16.0678H7.75077ZM7.10494 13.5678C6.13272 12.9983 5.36536 12.231 4.80286 11.2657C4.24036 10.3004 3.95911 9.24832 3.95911 8.10943C3.95911 6.34554 4.5598 4.85596 5.76119 3.64068C6.96258 2.4254 8.44522 1.81776 10.2091 1.81776C11.9452 1.81776 13.4174 2.4254 14.6258 3.64068C15.8341 4.85596 16.4383 6.34554 16.4383 8.10943C16.4383 9.24832 16.157 10.3004 15.5945 11.2657C15.032 12.231 14.2647 12.9983 13.2924 13.5678H7.10494ZM7.64661 11.8178H12.7716C13.3966 11.3733 13.8723 10.8317 14.1987 10.1928C14.5251 9.55388 14.6883 8.85943 14.6883 8.10943C14.6883 6.84554 14.2577 5.77263 13.3966 4.89068C12.5355 4.00874 11.473 3.56776 10.2091 3.56776C8.94522 3.56776 7.87925 4.00874 7.01119 4.89068C6.14313 5.77263 5.70911 6.84554 5.70911 8.10943C5.70911 8.85943 5.87577 9.55388 6.20911 10.1928C6.54244 10.8317 7.02161 11.3733 7.64661 11.8178Z"
      fill="#666666"
    />
  </svg>
);
const Chevron: React.FC = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="21" height="21" viewBox="0 0 21 21" fill="none">
    <path
      d="M7.41744 14.5261C7.23688 14.3455 7.14661 14.1372 7.14661 13.9011C7.14661 13.665 7.23688 13.4567 7.41744 13.2761L10.5424 10.1511L7.41744 7.0261C7.23688 6.84554 7.14661 6.63721 7.14661 6.4011C7.14661 6.16499 7.23688 5.95665 7.41744 5.7761C7.598 5.59554 7.80633 5.50526 8.04244 5.50526C8.27855 5.50526 8.48688 5.59554 8.66744 5.7761L12.4174 9.5261C12.5147 9.62332 12.5841 9.72401 12.6258 9.82818C12.6674 9.93235 12.6883 10.04 12.6883 10.1511C12.6883 10.2622 12.6674 10.3698 12.6258 10.474C12.5841 10.5782 12.5147 10.6789 12.4174 10.7761L8.66744 14.5261C8.48688 14.7067 8.27855 14.7969 8.04244 14.7969C7.80633 14.7969 7.598 14.7067 7.41744 14.5261Z"
      fill="#212121"
    />
  </svg>
);

const PrimaryLine: React.FC<{ text: string }> = ({ text }) => (
  <div
    style={{
      color: "#666",
      fontSize: "13px",
      fontStyle: "normal",
      fontWeight: "400",
      lineHeight: "20px",
    }}
  >
    {text}
  </div>
);

const SecondaryLine: React.FC = () => (
  <div
    style={{
      color: "#212121",
      fontSize: "19px",
      fontStyle: "normal",
      fontWeight: "500",
      lineHeight: "28px",
      letterSpacing: "-0.15px",
    }}
  >
    ₹20 Lakh
  </div>
);

const TeriaryLine: React.FC = () => (
  <div
    style={{
      display: "flex",
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: "8px",
    }}
  >
    <div
      style={{
        color: "#666",
        fontSize: "13px",
        fontStyle: "normal",
        fontWeight: "400",
        lineHeight: "20px",
      }}
    >
      Last Month
    </div>
    <div
      style={{
        color: "#666",
        fontSize: "13px",
        fontStyle: "normal",
        fontWeight: "600",
        lineHeight: "20px",
      }}
    >
      ₹ 5 Lakh
    </div>
    <svg xmlns="http://www.w3.org/2000/svg" width="21" height="20" viewBox="0 0 21 20" fill="none">
      <path
        d="M9.37574 6.52083L5.29241 10.6042C5.12574 10.7708 4.9313 10.8507 4.70908 10.8438C4.48685 10.8368 4.29241 10.75 4.12574 10.5833C3.97296 10.4167 3.8931 10.2222 3.88616 10C3.87921 9.77778 3.95908 9.58333 4.12574 9.41667L9.62574 3.91667C9.70908 3.83333 9.79935 3.77431 9.89658 3.73958C9.9938 3.70486 10.098 3.6875 10.2091 3.6875C10.3202 3.6875 10.4244 3.70486 10.5216 3.73958C10.6188 3.77431 10.7091 3.83333 10.7924 3.91667L16.2924 9.41667C16.4452 9.56944 16.5216 9.76042 16.5216 9.98958C16.5216 10.2188 16.4452 10.4167 16.2924 10.5833C16.1257 10.75 15.9278 10.8333 15.6987 10.8333C15.4695 10.8333 15.2716 10.75 15.1049 10.5833L11.0424 6.52083V15.8333C11.0424 16.0694 10.9625 16.2674 10.8028 16.4271C10.6431 16.5868 10.4452 16.6667 10.2091 16.6667C9.97296 16.6667 9.77505 16.5868 9.61532 16.4271C9.4556 16.2674 9.37574 16.0694 9.37574 15.8333V6.52083Z"
        fill="#108934"
      />
    </svg>
  </div>
);

const NonInteractableCardLine: React.FC = () => (
  <div style={{ display: "flex", flexDirection: "row" }}>
    <p style={{ fontSize: "13px", fontStyle: "normal", fontWeight: "400", lineHeight: "20px" }}>
      System Stock: <span style={{ color: "#666666" }}>20</span>
    </p>
  </div>
);

export const MetricCardStory = () => (
  <Card interactable id="murv-card" testId="murv-card" role="group" tabIndex={0}>
    <Card.Header title="Title of list" role="heading" aria-level={2} isActionable>
      <Card.Header.Icon svg={<HeaderIcon />} aria-hidden="true" />
      <Card.Header.Tag aria-label="New">
        <Tag tagText="New" tagStyle="red" />
      </Card.Header.Tag>
      <Card.Header.MenuElement>
        <Button buttonType="inline" buttonStyle="neutral">
          {(<MenuIcon />) as any}
        </Button>
      </Card.Header.MenuElement>
    </Card.Header>
    <Card.Body>
      <Card.Body.HorizontalItem
        key="murv-card"
        aria-labelledby="murv-card-horizontal-item"
        tabIndex={0}
      >
        <Card.Body.HorizontalItem.Slot tabIndex={0} containerStyles={{ flex: 1 }}>
          <Card.Body.HorizontalItem.Slot.TextBlock
            primaryLine={<PrimaryLine text="Delivery Speed" />}
            secondaryLine={<SecondaryLine />}
            tertiaryLine={<TeriaryLine />}
          />
        </Card.Body.HorizontalItem.Slot>
      </Card.Body.HorizontalItem>
    </Card.Body>
  </Card>
);

export const MetricCardStoryWithoutTag = () => (
  <Card interactable id="murv-card" testId="murv-card" role="group" tabIndex={0}>
    <Card.Header title="Title of list" role="heading" aria-level={2} isActionable>
      <Card.Header.Icon svg={<HeaderIcon />} aria-hidden="true" />
      <Card.Header.MenuElement>
        <Button buttonType="inline" buttonStyle="neutral">
          {(<MenuIcon />) as any}
        </Button>
      </Card.Header.MenuElement>
    </Card.Header>
    <Card.Body>
      <Card.Body.HorizontalItem
        key="murv-card"
        aria-labelledby="murv-card-horizontal-item"
        tabIndex={0}
      >
        <Card.Body.HorizontalItem.Slot tabIndex={0} containerStyles={{ flex: 1 }}>
          <Card.Body.HorizontalItem.Slot.TextBlock
            primaryLine={<PrimaryLine text="Delivery Speed" />}
            secondaryLine={<SecondaryLine />}
            tertiaryLine={<TeriaryLine />}
          />
        </Card.Body.HorizontalItem.Slot>
      </Card.Body.HorizontalItem>
    </Card.Body>
  </Card>
);

export const MetricCardWithInvalidElements = () => (
  <Card interactable id="murv-card" testId="murv-card" role="group" tabIndex={0}>
    <Card.Header title="Title of list" role="heading" aria-level={2} isActionable>
      <Card.Header.Icon svg={<HeaderIcon />} aria-hidden="true" />
      <Card.Header.Tag aria-label="New">
        <div>Some Tag</div>
      </Card.Header.Tag>
      <Card.Header.MenuElement>
        <div>Some Icon</div>
      </Card.Header.MenuElement>
    </Card.Header>
    <Card.Body>
      <Card.Body.HorizontalItem
        key="murv-card"
        aria-labelledby="murv-card-horizontal-item"
        tabIndex={0}
      >
        <Card.Body.HorizontalItem.Slot tabIndex={0} containerStyles={{ flex: 1 }}>
          <Card.Body.HorizontalItem.Slot.TextBlock
            primaryLine={<PrimaryLine text="Delivery Speed" />}
            secondaryLine={<SecondaryLine />}
            tertiaryLine={<TeriaryLine />}
          />
        </Card.Body.HorizontalItem.Slot>
      </Card.Body.HorizontalItem>
    </Card.Body>
    <div>Some Invalid Element</div>
  </Card>
);

export const MultiMetricCardStory = () => (
  <Card interactable id="murv-card" testId="murv-card" role="group" tabIndex={0}>
    <Card.Header title="Title of list" role="heading" aria-level={2} isActionable>
      <Card.Header.Icon svg={<HeaderIcon />} aria-hidden="true" />
      <Card.Header.Tag aria-label="New">
        <Tag tagText="New" tagStyle="red" />
      </Card.Header.Tag>
      <Card.Header.MenuElement>
        <Button buttonType="inline" buttonStyle="neutral">
          {(<MenuIcon />) as any}
        </Button>
      </Card.Header.MenuElement>
    </Card.Header>
    <Card.Body>
      <Card.Body.HorizontalItem
        key="murv-card"
        aria-labelledby="murv-card-horizontal-item"
        tabIndex={0}
      >
        <Card.Body.HorizontalItem.Slot tabIndex={0}>
          <Card.Body.HorizontalItem.Slot.TextBlock
            primaryLine={<PrimaryLine text="Delivery Speed" />}
            secondaryLine={<SecondaryLine />}
            tertiaryLine={<TeriaryLine />}
          />
        </Card.Body.HorizontalItem.Slot>
        <Card.Body.HorizontalItem.Slot tabIndex={0}>
          <Card.Body.HorizontalItem.Slot.TextBlock
            primaryLine={<PrimaryLine text="Delivery Speed" />}
            secondaryLine={<SecondaryLine />}
            tertiaryLine={<TeriaryLine />}
          />
        </Card.Body.HorizontalItem.Slot>
        <Card.Body.HorizontalItem.Slot tabIndex={0}>
          <Card.Body.HorizontalItem.Slot.TextBlock
            primaryLine={<PrimaryLine text="Delivery Speed" />}
            secondaryLine={<SecondaryLine />}
            tertiaryLine={<TeriaryLine />}
          />
        </Card.Body.HorizontalItem.Slot>
      </Card.Body.HorizontalItem>
    </Card.Body>
  </Card>
);

export const MetricCardWithoutHeaderStory = () => (
  <Card interactable id="murv-card" testId="murv-card" role="group" tabIndex={0}>
    <Card.Body>
      <Card.Body.HorizontalItem
        key="murv-card"
        aria-labelledby="murv-card-horizontal-item"
        tabIndex={0}
      >
        <Card.Body.HorizontalItem.Slot tabIndex={0}>
          <Card.Body.HorizontalItem.Slot.TextBlock
            primaryLine={<PrimaryLine text="Delivery Speed" />}
            secondaryLine={<SecondaryLine />}
            tertiaryLine={<TeriaryLine />}
          />
        </Card.Body.HorizontalItem.Slot>
        <Card.Body.HorizontalItem.Slot tabIndex={0}>
          <Card.Body.HorizontalItem.Slot.TextBlock
            primaryLine={<PrimaryLine text="Delivery Speed" />}
            secondaryLine={<SecondaryLine />}
            tertiaryLine={<TeriaryLine />}
          />
        </Card.Body.HorizontalItem.Slot>
      </Card.Body.HorizontalItem>
    </Card.Body>
  </Card>
);

export const ImageCardWithTextStory = () => (
  <Card interactable id="murv-card" testId="murv-card" role="group" tabIndex={0}>
    <Card.Body>
      <Card.Body.HorizontalItem
        key="murv-card"
        aria-labelledby="murv-card-horizontal-item"
        tabIndex={0}
      >
        <Card.Body.HorizontalItem.Slot tabIndex={0}>
          <Card.Body.HorizontalItem.Slot.Thumbnail svg={<DummyImage />} />
        </Card.Body.HorizontalItem.Slot>
        <Card.Body.HorizontalItem.Slot tabIndex={0}>
          <Card.Body.HorizontalItem.Slot.TextBlock
            primaryLine={<PrimaryLine text="Secondary Information" />}
            secondaryLine={<PrimaryLine text="tertiary Information" />}
          />
        </Card.Body.HorizontalItem.Slot>
        <Card.Body.HorizontalItem.Slot tabIndex={0}>
          <Card.Body.HorizontalItem.Slot.Icon svg={<Chevron />} />
        </Card.Body.HorizontalItem.Slot>
      </Card.Body.HorizontalItem>
    </Card.Body>
  </Card>
);

export const IconCardWithTextStory = () => (
  <Card interactable id="murv-card" testId="murv-card" role="group" tabIndex={0}>
    <Card.Body>
      <Card.Body.HorizontalItem
        key="murv-card"
        aria-labelledby="murv-card-horizontal-item"
        tabIndex={0}
      >
        <Card.Body.HorizontalItem.Slot tabIndex={0}>
          <Card.Body.HorizontalItem.Slot.Icon svg={<DummyIcon />} />
        </Card.Body.HorizontalItem.Slot>
        <Card.Body.HorizontalItem.Slot tabIndex={0}>
          <Card.Body.HorizontalItem.Slot.TextBlock
            primaryLine={<PrimaryLine text="Secondary Information" />}
            secondaryLine={<PrimaryLine text="tertiary Information" />}
          />
        </Card.Body.HorizontalItem.Slot>
        <Card.Body.HorizontalItem.Slot tabIndex={0}>
          <Card.Body.HorizontalItem.Slot.Icon svg={<Chevron />} />
        </Card.Body.HorizontalItem.Slot>
      </Card.Body.HorizontalItem>
    </Card.Body>
  </Card>
);

export const ImageCardListWithTextStory = () => (
  <Card interactable id="murv-card" testId="murv-card" role="group" tabIndex={0}>
    <Card.Header title="Title of list" role="heading" aria-level={2} isActionable>
      <Card.Header.Icon svg={<HeaderIcon />} aria-hidden="true" />
      <Card.Header.Tag aria-label="New">
        <Tag tagText="New" tagStyle="red" />
      </Card.Header.Tag>
      <Card.Header.MenuElement>
        <Button buttonType="inline" buttonStyle="neutral">
          {(<MenuIcon />) as any}
        </Button>
      </Card.Header.MenuElement>
    </Card.Header>
    <Card.Body>
      {[1, 2, 3, 4, 5].map((item) => (
        <Card.Body.HorizontalItem
          key={`murv-card-body-row-${item}`}
          aria-labelledby="murv-card-horizontal-item"
          tabIndex={0}
          containerStyles={item !== 5 ? { borderBottom: "2px solid #eee" } : {}}
        >
          <Card.Body.HorizontalItem.Slot tabIndex={0}>
            <Card.Body.HorizontalItem.Slot.Icon svg={<DummyImage />} />
          </Card.Body.HorizontalItem.Slot>
          <Card.Body.HorizontalItem.Slot tabIndex={0} containerStyles={{ flex: 1 }}>
            <Card.Body.HorizontalItem.Slot.TextBlock
              primaryLine={<PrimaryLine text="Secondary Information" />}
              secondaryLine={<PrimaryLine text="tertiary Information" />}
            />
          </Card.Body.HorizontalItem.Slot>
          <Card.Body.HorizontalItem.Slot tabIndex={0}>
            <Card.Body.HorizontalItem.Slot.Icon svg={<Chevron />} />
          </Card.Body.HorizontalItem.Slot>
        </Card.Body.HorizontalItem>
      ))}
    </Card.Body>
  </Card>
);

export const ImageCardListWithTextStoryTwoColumns = () => (
  <Card interactable id="murv-card" testId="murv-card" role="group" tabIndex={0}>
    <Card.Header title="Title of list" role="heading" aria-level={2} isActionable>
      <Card.Header.Icon svg={<HeaderIcon />} aria-hidden="true" />
      <Card.Header.Tag aria-label="New">
        <Tag tagText="New" tagStyle="red" />
      </Card.Header.Tag>
      <Card.Header.MenuElement>
        <Button buttonType="inline" buttonStyle="neutral">
          {(<MenuIcon />) as any}
        </Button>
      </Card.Header.MenuElement>
    </Card.Header>
    <Card.Body containerStyles={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)" }}>
      {[1, 2, 3, 4, 5].map((item) => (
        <Card.Body.HorizontalItem
          key={`murv-card-body-row-${item}`}
          aria-labelledby="murv-card-horizontal-item"
          tabIndex={0}
          containerStyles={item !== 5 ? { borderBottom: "2px solid #eee" } : {}}
        >
          <Card.Body.HorizontalItem.Slot tabIndex={0}>
            <Card.Body.HorizontalItem.Slot.Icon svg={<DummyImage />} />
          </Card.Body.HorizontalItem.Slot>
          <Card.Body.HorizontalItem.Slot tabIndex={0} containerStyles={{ flex: 1 }}>
            <Card.Body.HorizontalItem.Slot.TextBlock
              primaryLine={<PrimaryLine text="Secondary Information" />}
              secondaryLine={<PrimaryLine text="tertiary Information" />}
            />
          </Card.Body.HorizontalItem.Slot>
        </Card.Body.HorizontalItem>
      ))}
    </Card.Body>
  </Card>
);

export const NonInteractableCardWithNoMenuElementRender = () => (
  <Card id="murv-card" testId="murv-card" role="group" tabIndex={0}>
    <Card.Header title="Title of list" role="heading" aria-level={2} />
    <Card.Body containerStyles={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)" }}>
      {[1, 2, 3, 4, 5].map((item) => (
        <Card.Body.HorizontalItem
          key={`murv-card-body-row-${item}`}
          aria-labelledby="murv-card-horizontal-item"
          tabIndex={0}
        >
          <Card.Body.HorizontalItem.Slot tabIndex={0} containerStyles={{ flex: 1 }}>
            <Card.Body.HorizontalItem.Slot.TextBlock primaryLine={<NonInteractableCardLine />} />
          </Card.Body.HorizontalItem.Slot>
        </Card.Body.HorizontalItem>
      ))}
    </Card.Body>
  </Card>
);

export const ImageCardListWithTextRightAlignedStory = () => (
  <Card interactable id="murv-card" testId="murv-card" role="group" tabIndex={0}>
    <Card.Header title="Title of list" role="heading" aria-level={2} isActionable>
      <Card.Header.Icon svg={<HeaderIcon />} aria-hidden="true" />
      <Card.Header.Tag aria-label="New">
        <Tag tagText="New" tagStyle="red" />
      </Card.Header.Tag>
      <Card.Header.MenuElement>
        <Button buttonType="inline" buttonStyle="neutral">
          {(<MenuIcon />) as any}
        </Button>
      </Card.Header.MenuElement>
    </Card.Header>
    <Card.Body>
      {[1, 2, 3, 4, 5].map((item) => (
        <Card.Body.HorizontalItem
          key={`murv-card-body-row-${item}`}
          aria-labelledby="murv-card-horizontal-item"
          tabIndex={0}
          containerStyles={item !== 5 ? { borderBottom: "2px solid #eee" } : {}}
        >
          <Card.Body.HorizontalItem.Slot tabIndex={0} containerStyles={{ flex: 1 }}>
            <Card.Body.HorizontalItem.Slot.TextBlock
              primaryLine={<PrimaryLine text="Secondary Information" />}
              secondaryLine={<PrimaryLine text="tertiary Information" />}
            />
          </Card.Body.HorizontalItem.Slot>
          <Card.Body.HorizontalItem.Slot tabIndex={0}>
            <Card.Body.HorizontalItem.Slot.Icon svg={<DummyImage />} />
          </Card.Body.HorizontalItem.Slot>
        </Card.Body.HorizontalItem>
      ))}
    </Card.Body>
  </Card>
);

export const LinkCardWithIconStory = () => (
  <Card interactable id="murv-card" testId="murv-card" role="group" tabIndex={0}>
    <Card.Header title="Title of list" role="heading" aria-level={2} isActionable>
      <Card.Header.Icon svg={<HeaderIcon />} aria-hidden="true" />
      <Card.Header.Tag aria-label="New">
        <Tag tagText="New" tagStyle="red" />
      </Card.Header.Tag>
      <Card.Header.MenuElement>
        <Button buttonType="inline" buttonStyle="neutral">
          {(<MenuIcon />) as any}
        </Button>
      </Card.Header.MenuElement>
    </Card.Header>
    <Card.Body>
      {[1, 2, 3, 4, 5].map((item) => (
        <Card.Body.HorizontalItem
          key={`murv-card-body-row-${item}`}
          aria-labelledby="murv-card-horizontal-item"
          tabIndex={0}
          containerStyles={item !== 5 ? { borderBottom: "2px solid #eee" } : {}}
        >
          <Card.Body.HorizontalItem.Slot tabIndex={0} containerStyles={{ flex: 1 }}>
            <Card.Body.HorizontalItem.Slot.Link>
              <Link
                id={`link-card-${item}`}
                dataTestId={`link-card-${item}`}
                body="Link"
                href="/"
                url="/"
                linkType="internal"
              />
            </Card.Body.HorizontalItem.Slot.Link>
          </Card.Body.HorizontalItem.Slot>
          <Card.Body.HorizontalItem.Slot tabIndex={0}>
            <Card.Body.HorizontalItem.Slot.Icon svg={<Chevron />} />
          </Card.Body.HorizontalItem.Slot>
        </Card.Body.HorizontalItem>
      ))}
    </Card.Body>
  </Card>
);

export const IconCardListWithTextStory = () => (
  <Card interactable id="murv-card" testId="murv-card" role="group" tabIndex={0}>
    <Card.Header title="Title of list" role="heading" aria-level={2} isActionable>
      <Card.Header.Icon svg={<HeaderIcon />} aria-hidden="true" />
      <Card.Header.Tag aria-label="New">
        <Tag tagText="New" tagStyle="red" />
      </Card.Header.Tag>
      <Card.Header.MenuElement>
        <Button buttonType="inline" buttonStyle="neutral">
          {(<MenuIcon />) as any}
        </Button>
      </Card.Header.MenuElement>
    </Card.Header>
    <Card.Body>
      {[1, 2, 3, 4, 5].map((item) => (
        <Card.Body.HorizontalItem
          key={`murv-card-body-row-${item}`}
          aria-labelledby="murv-card-horizontal-item"
          tabIndex={0}
          containerStyles={item !== 5 ? { borderBottom: "2px solid #eee" } : {}}
        >
          <Card.Body.HorizontalItem.Slot tabIndex={0}>
            <Card.Body.HorizontalItem.Slot.Icon svg={<DummyIcon />} />
          </Card.Body.HorizontalItem.Slot>
          <Card.Body.HorizontalItem.Slot tabIndex={0} containerStyles={{ flex: 1 }}>
            <Card.Body.HorizontalItem.Slot.TextBlock
              primaryLine={<PrimaryLine text="Secondary Information" />}
              secondaryLine={<PrimaryLine text="tertiary Information" />}
            />
          </Card.Body.HorizontalItem.Slot>
          <Card.Body.HorizontalItem.Slot tabIndex={0}>
            <Card.Body.HorizontalItem.Slot.Icon svg={<Chevron />} />
          </Card.Body.HorizontalItem.Slot>
        </Card.Body.HorizontalItem>
      ))}
    </Card.Body>
  </Card>
);

export const VerticalImageTextStory = () => (
  <Card interactable id="murv-card" testId="murv-card" role="group" tabIndex={0}>
    <Card.Header title="Title of list" role="heading" aria-level={2} isActionable>
      <Card.Header.Icon svg={<HeaderIcon />} aria-hidden="true" />
      <Card.Header.Tag aria-label="New">
        <Tag tagText="New" tagStyle="red" />
      </Card.Header.Tag>
      <Card.Header.MenuElement>
        <Button buttonType="inline" buttonStyle="neutral">
          {(<MenuIcon />) as any}
        </Button>
      </Card.Header.MenuElement>
    </Card.Header>
    <Card.Body>
      <Card.Body.VerticalItem aria-labelledby="murv-card-vertical-item" tabIndex={0}>
        <Card.Body.VerticalItem.Slot tabIndex={0}>
          <Card.Body.VerticalItem.Slot.Image
            svg={<DummyImageBig />}
            containerStyles={{ flex: 1 }}
          />
        </Card.Body.VerticalItem.Slot>
        <Card.Body.VerticalItem.Slot tabIndex={0} containerStyles={{ flex: 1 }}>
          <Card.Body.VerticalItem.Slot.TextBlock
            primaryLine={<PrimaryLine text="Primary Information" />}
            secondaryLine={<PrimaryLine text="secondary Information" />}
            tertiaryLine={<PrimaryLine text="tertiary Information" />}
          />
        </Card.Body.VerticalItem.Slot>
      </Card.Body.VerticalItem>
    </Card.Body>
  </Card>
);

export const DisabledCard = () => (
  <Card disabled id="murv-card" testId="murv-card" role="group" tabIndex={0}>
    <Card.Header title="Title of list" role="heading" aria-level={2} isActionable>
      <Card.Header.Icon svg={<HeaderIcon />} aria-hidden="true" />
      <Card.Header.Tag aria-label="New">
        <Tag tagText="New" tagStyle="red" />
      </Card.Header.Tag>
      <Card.Header.MenuElement>
        <Button buttonType="inline" buttonStyle="neutral" disabled>
          {(<MenuIcon />) as any}
        </Button>
      </Card.Header.MenuElement>
    </Card.Header>
    <Card.Body>
      <Card.Body.HorizontalItem
        key="murv-card"
        aria-labelledby="murv-card-horizontal-item"
        tabIndex={0}
      >
        <Card.Body.HorizontalItem.Slot tabIndex={0} containerStyles={{ flex: 1 }}>
          <Card.Body.HorizontalItem.Slot.TextBlock
            primaryLine={<PrimaryLine text="Delivery Speed" />}
            secondaryLine={<SecondaryLine />}
            tertiaryLine={<TeriaryLine />}
          />
        </Card.Body.HorizontalItem.Slot>
      </Card.Body.HorizontalItem>
    </Card.Body>
  </Card>
);

export const NonInteractableCard = () => (
  <Card interactable={false} id="murv-card" testId="murv-card" role="group" tabIndex={0}>
    <Card.Header title="Title of list" role="heading" aria-level={2} isActionable>
      <Card.Header.Icon svg={<HeaderIcon />} aria-hidden="true" />
      <Card.Header.Tag aria-label="New">
        <Tag tagText="New" tagStyle="red" />
      </Card.Header.Tag>
      <Card.Header.MenuElement>
        <Button buttonType="inline" buttonStyle="neutral" disabled>
          {(<MenuIcon />) as any}
        </Button>
      </Card.Header.MenuElement>
    </Card.Header>
    <Card.Body>
      <Card.Body.HorizontalItem
        key="murv-card"
        aria-labelledby="murv-card-horizontal-item"
        tabIndex={0}
      >
        <Card.Body.HorizontalItem.Slot tabIndex={0} containerStyles={{ flex: 1 }}>
          <Card.Body.HorizontalItem.Slot.TextBlock
            primaryLine={<PrimaryLine text="Delivery Speed" />}
            secondaryLine={<SecondaryLine />}
            tertiaryLine={<TeriaryLine />}
          />
        </Card.Body.HorizontalItem.Slot>
      </Card.Body.HorizontalItem>
    </Card.Body>
  </Card>
);

export const MetricCardWithTooltip = () => (
  <Card interactable id="murv-card" testId="murv-card" role="group" tabIndex={0}>
    <Card.Header title="Title of list" role="heading" aria-level={2} isActionable>
      <Card.Header.Icon svg={<HeaderIcon />} aria-hidden="true" />
      <Card.Header.Tag aria-label="New">
        <Button
          buttonType="inline"
          buttonStyle="neutral"
          onClick={() => {
            // eslint-disable-next-line no-console
            console.log("Save Button is clicked");
          }}
          className="save-btn"
        >
          {(<Save className="save-icon" />) as any}
        </Button>
      </Card.Header.Tag>
      <Card.Header.MenuElement>
        <Tooltip tooltipText="Test" position="left">
          <Info className="info-icon" />
        </Tooltip>
      </Card.Header.MenuElement>
    </Card.Header>
    <Card.Body>
      <Card.Body.HorizontalItem
        key="murv-card"
        aria-labelledby="murv-card-horizontal-item"
        tabIndex={0}
      >
        <Card.Body.HorizontalItem.Slot tabIndex={0} containerStyles={{ flex: 1 }}>
          <Card.Body.HorizontalItem.Slot.TextBlock
            primaryLine={<PrimaryLine text="Delivery Speed" />}
            secondaryLine={<SecondaryLine />}
            tertiaryLine={<TeriaryLine />}
          />
        </Card.Body.HorizontalItem.Slot>
      </Card.Body.HorizontalItem>
    </Card.Body>
  </Card>
);
