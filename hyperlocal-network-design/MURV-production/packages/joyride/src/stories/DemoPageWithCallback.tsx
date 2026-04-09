import React, { useState } from "react";
import { Route, useHistory } from "react-router-dom";
import { CallBackProps } from "react-joyride";
import { DemoPageBody } from "./DemoPageBody";
import { StorybookHeader } from "./StorybookHeader";
import { TourMockData } from "./index.mock";
import { waitForTheElement } from "../util/waitForTheElement";
import { Joyride, ACTIONS, STATUS, EVENTS } from "..";

export const DemoPageWithCustomCallback = () => {
  const history = useHistory();
  const [currentStep, setCurrentStep] = useState(0);
  const [started, setStarted] = useState(false);
  const [run, setRun] = useState(true);

  const callBack = async (data: CallBackProps) => {
    const { action, status, type, index, step, lifecycle } = data;
    const currentTarget = document.querySelector(step.target as string);
    if (!currentTarget) {
      setStarted(false);
      setRun(false);
      waitForTheElement([{ query: step.target as string }], ({ element, observer }) => {
        if (element) {
          setRun(true);
          observer.disconnect();
        }
      });
    }

    if (action === "update" && lifecycle === "tooltip" && !started) {
      setStarted(true);
    }

    if (EVENTS.STEP_AFTER === type) {
      const toSetStep = index + (action === ACTIONS.PREV ? -1 : 1);
      setCurrentStep(toSetStep);
      if (action === ACTIONS.PREV) {
        if (toSetStep === 1) {
          history.replace("/");
        }
      }
      if (action === ACTIONS.NEXT) {
        if (toSetStep === 2) {
          history.replace("/storybook-page-2");
        }
      }
    } else if (STATUS.FINISHED === status || STATUS.SKIPPED === status) {
      setRun(false);
    } else if (type === EVENTS.TOOLTIP_CLOSE) {
      setCurrentStep(index + 1);
    }
  };

  return (
    <article style={{ background: "#fff" }}>
      <StorybookHeader
        onLogin={() => {}}
        onLogout={() => {
          if (started && run) {
            setRun(false);
            setCurrentStep(2);
            waitForTheElement(
              [{ query: TourMockData.multiRoute.steps[currentStep].target as string }],
              ({ element, observer }) => {
                if (element) {
                  setRun(true);
                  observer.disconnect();
                }
              },
            );
          }
        }}
        onCreateAccount={() => {}}
      />
      <Route exact path="/">
        <DemoPageBody index="loged-in" />
      </Route>
      <Route exact path="/storybook-page-2">
        <DemoPageBody index="loged-out" />
      </Route>
      <Route exact path="/storybook-page-3">
        <DemoPageBody index="signed-up" />
      </Route>
      <Joyride
        disableOverlayClose
        spotlightClicks
        stepIndex={currentStep}
        callback={callBack}
        run={run}
        continuous
        steps={TourMockData.multiRoute.steps}
      />
    </article>
  );
};
