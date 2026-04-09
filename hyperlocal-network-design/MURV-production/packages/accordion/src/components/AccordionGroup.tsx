import React, { FC } from 'react';
import { useTheme } from "styled-components";
import isValidChildren from "@murv/core/utils/validate-children";
import { useId } from "@murv/core/hooks/use-id";
import { Accordion } from './Accordion';
import { AccordionProvider } from '../hooks/useAccordionContext';
import { IAccordionGroupProps } from '../types';
import { AccordionGroupView } from '../styles';

const exclusiveSupported = "name" in document.createElement("details");

const AccordionGroup: FC<IAccordionGroupProps> = (props) => {

    const theme = useTheme();

    const {
        children,
        id,
        dataTestId,
        gap = theme.murv.spacing.m,
        exclusive
    } = props;

    const accordionId = exclusive ? useId() : '';

    const { validChildren } = isValidChildren({
        allowedTypes: [Accordion],
      })(children);


    /*
      Polyfill for details: name attribute's toggle behaviour which is unsupported in older browser versions
      Refer To: https://developer.chrome.com/docs/css-ui/exclusive-accordion#polyfill_the_exclusive_accordion
                https://caniuse.com/?search=HTMLDetailsElement%3A%20name
    */
    const attachEventListeners = (ref: HTMLDivElement | null) => {
        if(ref){
            const groupChildren = [...ref.children] as HTMLDetailsElement[];

            groupChildren.forEach((accordion: HTMLDetailsElement) => {
                const newAcc = accordion;
                newAcc.onclick = (e) => {
                    e.preventDefault();
                    if (exclusive) {
                        groupChildren.forEach(child => {
                            const newChild = child;
                            if (newAcc !== child && child.open) {
                                newChild.open = false;
                            }
                        });
                    }
                    newAcc.open = !newAcc.open;
                }
                
            })
        }
    }

    return (
        <AccordionProvider accordionId={accordionId}>
            <AccordionGroupView ref={ref => !exclusiveSupported && attachEventListeners(ref)}  id={id} gap={gap} data-testId={`accordion-group-${dataTestId}`}>
                { validChildren }
            </AccordionGroupView>
        </AccordionProvider>
    )
}

export { AccordionGroup };