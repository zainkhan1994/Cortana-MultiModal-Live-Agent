import React from 'react';

interface OrbShellLayoutProps {
  left: React.ReactNode;
  center: React.ReactNode;
  right: React.ReactNode;
  bottom: React.ReactNode;
}

export const OrbShellLayout: React.FC<OrbShellLayoutProps> = ({ left, center, right, bottom }) => {
  return (
    <div className="orb-layout">
      <aside className="orb-panel orb-panel-left">{left}</aside>
      <main className="orb-panel orb-panel-center">{center}</main>
      <aside className="orb-panel orb-panel-right">{right}</aside>
      <footer className="orb-panel orb-panel-bottom">{bottom}</footer>
    </div>
  );
};
