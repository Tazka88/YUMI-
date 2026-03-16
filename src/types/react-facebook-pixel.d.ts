declare module 'react-facebook-pixel' {
  const ReactPixel: {
    init: (pixelId: string, advancedMatching?: any, options?: any) => void;
    pageView: () => void;
    track: (title: string, data?: any) => void;
    trackCustom: (event: string, data?: any) => void;
    grantConsent: () => void;
    revokeConsent: () => void;
  };
  export default ReactPixel;
}
