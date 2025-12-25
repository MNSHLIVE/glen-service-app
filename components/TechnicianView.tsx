import React from 'react';

const TechnicianView: React.FC = () => {
  return (
    <div style={{ padding: 20 }}>
      <h1 style={{ fontSize: 24, fontWeight: 'bold' }}>
        Technician Dashboard
      </h1>

      <p style={{ marginTop: 10 }}>
        If you can see this screen, the blank page issue is FIXED.
      </p>

      <p style={{ marginTop: 10, color: 'green' }}>
        Context and data will be connected next.
      </p>
    </div>
  );
};

export default TechnicianView;
