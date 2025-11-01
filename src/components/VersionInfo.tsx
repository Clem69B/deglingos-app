'use client';

import React from 'react';

interface VersionData {
  version: string;
  commitHash: string;
  branch: string;
  buildDate: string;
  env: string;
}

interface VersionInfoProps {
  className?: string;
  showDetails?: boolean;
}

const VersionInfo: React.FC<VersionInfoProps> = ({ 
  className = '', 
  showDetails = false 
}) => {
  const [versionData, setVersionData] = React.useState<VersionData | null>(null);

  React.useEffect(() => {
    // Dynamically import version data
    import('@/lib/version.json')
      .then((data) => setVersionData(data.default || data))
      .catch(() => {
        // Fallback version if file doesn't exist
        setVersionData({
          version: '0.0.0',
          commitHash: 'dev',
          branch: 'local',
          buildDate: new Date().toISOString(),
          env: 'development'
        });
      });
  }, []);

  if (!versionData) {
    return null;
  }

  const isDevelopment = versionData.env === 'development' || versionData.branch !== 'main';

  return (
    <div className={`text-xs text-gray-500 ${className}`}>
      <span className="font-medium">v{versionData.version}</span>
      {showDetails && (
        <>
          {' • '}
          <span 
            title={`Commit: ${versionData.commitHash}\nBuilt: ${new Date(versionData.buildDate).toLocaleString('fr-FR')}`}
            className="cursor-help"
          >
            {versionData.commitHash}
          </span>
        </>
      )}
      {isDevelopment && versionData.branch !== 'main' && (
        <>
          {' • '}
          <span className="text-amber-600 font-medium">
            {versionData.branch}
          </span>
        </>
      )}
    </div>
  );
};

export default VersionInfo;
