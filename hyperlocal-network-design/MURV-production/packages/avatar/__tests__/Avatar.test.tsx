import React from 'react';
import { render,screen } from "murv/test-utils";
import '@testing-library/jest-dom';
import { Person } from "@murv/icons";
import { Avatar } from '../src';

describe('Avatar Component', () => {
  
  it('renders ImageAvatar correctly', () => {
    // const theme = useTheme();
    render(<Avatar type='image' size='large' badgeProps={{
      type: "highlight",
    }}>
       <img src="https://st.depositphotos.com/2290789/4327/i/950/depositphotos_43274805-stock-illustration-black-panther-head.jpg" alt="panther" />
    </Avatar>);
    const imgElement = screen.getByAltText('panther');
    expect(imgElement).toBeInTheDocument();
    expect(imgElement).toHaveAttribute('src', 'https://st.depositphotos.com/2290789/4327/i/950/depositphotos_43274805-stock-illustration-black-panther-head.jpg');
  });

  it('renders IconAvatar correctly', () => {
    render(<Avatar dataTestId='icon-avatar' type='icon' size='large' badgeProps={{
      type: "highlight",
    }}>
      <Person />
    </Avatar>);
    const iconElement = screen.getByTestId('icon-avatar');
    expect(iconElement).toBeInTheDocument();
    expect(iconElement).toHaveStyle('color: rgb(255, 255, 255)');
  });
});

describe('Avatar Component', () => {
  it("matches snapshot with icon props", () => {
    const { asFragment } = render(<Avatar type='icon' size='small' badgeProps={{
      type: "brand",
    }}>
      <Person />
    </Avatar>);
    expect(asFragment()).toMatchSnapshot();
  });

  it("matches snapshot with image props", () => {
    const { asFragment } = render(<Avatar type='image' size='large' badgeProps={{
      type: "highlight",
    }}>
       <img src="https://st.depositphotos.com/2290789/4327/i/950/depositphotos_43274805-stock-illustration-black-panther-head.jpg" alt="panther" />
    </Avatar>);
    expect(asFragment()).toMatchSnapshot();
  });

  it("matches snapshot with text props", () => {
    const { asFragment } = render(<Avatar type='text' size='large' badgeProps={{
      children: 30,
      type: "highlight",
    }}>
      MU
    </Avatar>);
    expect(asFragment()).toMatchSnapshot();
  });
});