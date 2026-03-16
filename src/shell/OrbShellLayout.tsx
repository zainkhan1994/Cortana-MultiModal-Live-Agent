import React from 'react';

interface OrbShellLayoutProps {
  left: React.ReactNode;
  center: React.ReactNode;
  right: React.ReactNode;
  bottom: React.ReactNode;
  focusMode?: boolean;
}

export const OrbShellLayout: React.FC<OrbShellLayoutProps> = ({ left, center, right, bottom, focusMode }) => {
  return (
    <div className={`orb-layout${focusMode ? ' orb-layout--focus' : ''}`}>
      <aside className="orb-panel orb-panel-left">{left}</aside>
      <main className="orb-panel orb-panel-center">{center}</main>
      <aside className="orb-panel orb-panel-right">{right}</aside>
      <footer className="orb-panel orb-panel-bottom">{bottom}</footer>
    </div>
  );
};
